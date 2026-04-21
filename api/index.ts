import express from 'express';
import Groq from 'groq-sdk';
import { rateLimit } from 'express-rate-limit';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const app = express();

app.set('trust proxy', 1);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin?.includes('localhost') || process.env.NODE_ENV !== 'production') {
    res.header('Access-Control-Allow-Origin', origin || '*');
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  next();
});

app.use(express.json());

const aiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 50,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  validate: { trustProxy: false },
  message: { error: 'Too many requests. Please try again later.' },
});

function getGroqClient() {
  return new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });
}

function getFriendlyGroqError(error: any) {
  const status = error?.status || 500;
  const message = String(error?.message || '').toLowerCase();

  if (!process.env.GROQ_API_KEY) {
    return {
      status: 500,
      error: "GROQ_API_KEY topilmadi. Server environment variables ichiga Groq kalitini qo'shing.",
    };
  }

  if (
    status === 401 ||
    status === 403 ||
    message.includes('invalid api key') ||
    message.includes('incorrect api key') ||
    message.includes('authentication') ||
    message.includes('unauthorized')
  ) {
    return {
      status: 401,
      error: "Groq API kaliti noto'g'ri yoki muddati tugagan. GROQ_API_KEY qiymatini tekshiring.",
    };
  }

  if (
    status === 429 ||
    message.includes('rate limit') ||
    message.includes('quota') ||
    message.includes('credits')
  ) {
    return {
      status: 429,
      error: "Groq limitiga yetildi yoki balans tugagan. Birozdan so'ng qayta urinib ko'ring yoki billingni tekshiring.",
    };
  }

  if (
    status >= 500 ||
    message.includes('timeout') ||
    message.includes('temporarily') ||
    message.includes('overloaded')
  ) {
    return {
      status: 503,
      error: "Groq serverida vaqtinchalik muammo yuz berdi. Iltimos, birozdan so'ng qayta urinib ko'ring.",
    };
  }

  return {
    status,
    error: error?.message || "AI xizmatida noma'lum xatolik yuz berdi.",
  };
}

function parseJsonResponse<T>(text: string | null | undefined, fallback: T): T {
  if (!text) {
    return fallback;
  }

  try {
    return JSON.parse(text.replace(/```json\n?|```/g, '').trim()) as T;
  } catch {
    return fallback;
  }
}

function getAdminClient() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function getMailTransport() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
}

function getEmailJsConfig() {
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;

  if (!serviceId || !publicKey) {
    return null;
  }

  return {
    serviceId,
    publicKey,
    privateKey: process.env.EMAILJS_PRIVATE_KEY,
    fromName: process.env.EMAILJS_FROM_NAME || process.env.SMTP_SENDER_NAME || 'MedTest AI',
    replyTo: process.env.EMAILJS_REPLY_TO || process.env.SMTP_SENDER_EMAIL || '',
    resetTemplateId: process.env.EMAILJS_RESET_TEMPLATE_ID,
    signupTemplateId: process.env.EMAILJS_SIGNUP_TEMPLATE_ID,
  };
}

function hashValue(value: string) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function generateSixDigitCode() {
  return String(crypto.randomInt(100000, 1000000));
}

function generateResetToken() {
  return crypto.randomBytes(32).toString('hex');
}

async function sendCodeEmail({
  email,
  code,
  subject,
  title,
  description,
  kind,
}: {
  email: string;
  code: string;
  subject: string;
  title: string;
  description: string;
  kind: 'reset' | 'signup';
}) {
  const emailJs = getEmailJsConfig();
  const templateId =
    kind === 'reset' ? emailJs?.resetTemplateId : emailJs?.signupTemplateId;

  if (emailJs && templateId) {
    const expiresAtDate = new Date(Date.now() + 15 * 60 * 1000);
    const formattedTime = expiresAtDate.toLocaleTimeString('uz-UZ', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: emailJs.serviceId,
        template_id: templateId,
        user_id: emailJs.publicKey,
        accessToken: emailJs.privateKey,
        template_params: {
          to_email: email,
          subject,
          title,
          description,
          code,
          passcode: code,
          otp: code,
          verification_code: code,
          one_time_password: code,
          time: formattedTime,
          expiry_minutes: '15',
          app_name: 'MedTest AI',
          from_name: emailJs.fromName,
          reply_to: emailJs.replyTo,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`EmailJS xatoligi: ${errorText || response.statusText}`);
    }

    return;
  }

  const transporter = getMailTransport();
  const senderEmail = process.env.SMTP_SENDER_EMAIL;
  const senderName = process.env.SMTP_SENDER_NAME || 'MedTest AI';

  if (!transporter || !senderEmail) {
    throw new Error("SMTP sozlanmagan. SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS va SMTP_SENDER_EMAIL ni to'ldiring.");
  }

  await transporter.sendMail({
    from: `"${senderName}" <${senderEmail}>`,
    to: email,
    subject,
    text: `${description}: ${code}\nKod 10 daqiqa davomida amal qiladi.`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 24px; color: #0f172a;">
        <h2 style="margin: 0 0 12px;">${title}</h2>
        <p style="margin: 0 0 16px;">${description}</p>
        <div style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #2c5ff2; margin: 0 0 16px;">
          ${code}
        </div>
        <p style="margin: 0; color: #475569;">Kod 10 daqiqa davomida amal qiladi.</p>
      </div>
    `,
  });
}

async function sendPasswordResetCodeEmail(email: string, code: string) {
  return sendCodeEmail({
    email,
    code,
    subject: 'Parolni tiklash kodi',
    title: 'Parolni tiklash',
    description: 'Quyidagi 6 xonali kodni kiriting:',
    kind: 'reset',
  });
}

async function sendSignupCodeEmail(email: string, code: string) {
  return sendCodeEmail({
    email,
    code,
    subject: "Ro'yxatdan o'tish kodi",
    title: 'Email tasdiqlash',
    description:
      "Ro'yxatdan o'tishni yakunlash uchun quyidagi 6 xonali kodni kiriting:",
    kind: 'signup',
  });
}

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    ai_provider: 'groq',
    ai_configured: Boolean(process.env.GROQ_API_KEY),
    emailjs_configured: Boolean(
      process.env.EMAILJS_SERVICE_ID &&
      process.env.EMAILJS_PUBLIC_KEY &&
      process.env.EMAILJS_RESET_TEMPLATE_ID &&
      process.env.EMAILJS_SIGNUP_TEMPLATE_ID
    ),
    smtp_configured: Boolean(
      process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.SMTP_SENDER_EMAIL
    ),
  });
});

app.post('/api/auth/password-reset/send', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();

    if (!email) {
      return res.status(400).json({ error: 'Email kiriting.' });
    }

    const supabase = getAdminClient();
    if (!supabase) {
      return res.status(500).json({
        error: "SUPABASE_SERVICE_ROLE_KEY topilmadi. Server env ichiga service role key qo'shing.",
      });
    }

    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (userError) {
      throw userError;
    }

    if (!userProfile) {
      return res.json({
        success: true,
        message: 'Agar bu email tizimda mavjud bo‘lsa, kod yuborildi.',
      });
    }

    const code = generateSixDigitCode();
    const codeHash = hashValue(code);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await supabase
      .from('password_reset_codes')
      .update({ consumed_at: new Date().toISOString() })
      .eq('email', email)
      .is('consumed_at', null);

    const { error: insertError } = await supabase
      .from('password_reset_codes')
      .insert({
        email,
        code_hash: codeHash,
        expires_at: expiresAt,
      });

    if (insertError) {
      throw insertError;
    }

    await sendPasswordResetCodeEmail(email, code);

    res.json({
      success: true,
      message: 'Tasdiqlash kodi emailingizga yuborildi.',
    });
  } catch (error: any) {
    console.error('Password reset send error:', error);
    res.status(500).json({
      error: error?.message || 'Kod yuborishda xatolik yuz berdi.',
    });
  }
});

app.post('/api/auth/signup/send-code', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();

    if (!email) {
      return res.status(400).json({ error: 'Email kiriting.' });
    }

    const supabase = getAdminClient();
    if (!supabase) {
      return res.status(500).json({
        error: "SUPABASE_SERVICE_ROLE_KEY topilmadi. Server env ichiga service role key qo'shing.",
      });
    }

    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (userError) {
      throw userError;
    }

    if (existingUser) {
      return res.status(400).json({
        error: "Ushbu email bilan allaqachon ro'yxatdan o'tilgan.",
      });
    }

    const code = generateSixDigitCode();
    const codeHash = hashValue(code);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await supabase
      .from('signup_verification_codes')
      .update({ consumed_at: new Date().toISOString() })
      .eq('email', email)
      .is('consumed_at', null);

    const { error: insertError } = await supabase
      .from('signup_verification_codes')
      .insert({
        email,
        code_hash: codeHash,
        expires_at: expiresAt,
      });

    if (insertError) {
      throw insertError;
    }

    await sendSignupCodeEmail(email, code);

    res.json({
      success: true,
      message: 'Tasdiqlash kodi emailingizga yuborildi.',
    });
  } catch (error: any) {
    console.error('Signup code send error:', error);
    res.status(500).json({
      error:
        error?.message || "Ro'yxatdan o'tish kodini yuborishda xatolik yuz berdi.",
    });
  }
});

app.post('/api/auth/signup/verify-code', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const code = String(req.body?.code || '').trim();

    if (!email || !code) {
      return res.status(400).json({ error: 'Email va kodni kiriting.' });
    }

    const supabase = getAdminClient();
    if (!supabase) {
      return res.status(500).json({
        error: "SUPABASE_SERVICE_ROLE_KEY topilmadi. Server env ichiga service role key qo'shing.",
      });
    }

    const now = new Date().toISOString();
    const codeHash = hashValue(code);

    const { data: codeRow, error: codeError } = await supabase
      .from('signup_verification_codes')
      .select('id')
      .eq('email', email)
      .eq('code_hash', codeHash)
      .is('consumed_at', null)
      .gt('expires_at', now)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (codeError) {
      throw codeError;
    }

    if (!codeRow) {
      return res.status(400).json({ error: "Kod noto'g'ri yoki eskirgan." });
    }

    const { error: consumeError } = await supabase
      .from('signup_verification_codes')
      .update({ consumed_at: now })
      .eq('id', codeRow.id);

    if (consumeError) {
      throw consumeError;
    }

    res.json({
      success: true,
      message: 'Email muvaffaqiyatli tasdiqlandi.',
    });
  } catch (error: any) {
    console.error('Signup code verify error:', error);
    res.status(500).json({
      error: error?.message || 'Kodni tekshirishda xatolik yuz berdi.',
    });
  }
});

app.post('/api/auth/password-reset/verify', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const code = String(req.body?.code || '').trim();

    if (!email || !code) {
      return res.status(400).json({ error: 'Email va kodni kiriting.' });
    }

    const supabase = getAdminClient();
    if (!supabase) {
      return res.status(500).json({
        error: "SUPABASE_SERVICE_ROLE_KEY topilmadi. Server env ichiga service role key qo'shing.",
      });
    }

    const now = new Date().toISOString();
    const codeHash = hashValue(code);

    const { data: resetRow, error: resetError } = await supabase
      .from('password_reset_codes')
      .select('id')
      .eq('email', email)
      .eq('code_hash', codeHash)
      .is('consumed_at', null)
      .is('verified_at', null)
      .gt('expires_at', now)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (resetError) {
      throw resetError;
    }

    if (!resetRow) {
      return res.status(400).json({ error: "Kod noto'g'ri yoki eskirgan." });
    }

    const resetToken = generateResetToken();
    const resetTokenHash = hashValue(resetToken);

    const { error: updateError } = await supabase
      .from('password_reset_codes')
      .update({
        verified_at: now,
        reset_token_hash: resetTokenHash,
      })
      .eq('id', resetRow.id);

    if (updateError) {
      throw updateError;
    }

    res.json({
      success: true,
      resetToken,
    });
  } catch (error: any) {
    console.error('Password reset verify error:', error);
    res.status(500).json({
      error: error?.message || 'Kodni tekshirishda xatolik yuz berdi.',
    });
  }
});

app.post('/api/auth/password-reset/complete', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const resetToken = String(req.body?.resetToken || '').trim();
    const newPassword = String(req.body?.newPassword || '');

    if (!email || !resetToken || !newPassword) {
      return res.status(400).json({ error: "Ma'lumotlar to'liq emas." });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        error: "Parol kamida 6 ta belgidan iborat bo'lishi kerak.",
      });
    }

    const supabase = getAdminClient();
    if (!supabase) {
      return res.status(500).json({
        error: "SUPABASE_SERVICE_ROLE_KEY topilmadi. Server env ichiga service role key qo'shing.",
      });
    }

    const now = new Date().toISOString();
    const resetTokenHash = hashValue(resetToken);

    const { data: resetRow, error: resetError } = await supabase
      .from('password_reset_codes')
      .select('id')
      .eq('email', email)
      .eq('reset_token_hash', resetTokenHash)
      .is('consumed_at', null)
      .not('verified_at', 'is', null)
      .gt('expires_at', now)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (resetError) {
      throw resetError;
    }

    if (!resetRow) {
      return res.status(400).json({
        error: 'Parolni almashtirish sessiyasi topilmadi yoki muddati tugagan.',
      });
    }

    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('auth_user_id')
      .eq('email', email)
      .single();

    if (userError) {
      throw userError;
    }

    const { error: updatePasswordError } = await supabase.auth.admin.updateUserById(
      userProfile.auth_user_id,
      { password: newPassword },
    );

    if (updatePasswordError) {
      throw updatePasswordError;
    }

    const { error: consumeError } = await supabase
      .from('password_reset_codes')
      .update({ consumed_at: now })
      .eq('id', resetRow.id);

    if (consumeError) {
      throw consumeError;
    }

    res.json({
      success: true,
      message: 'Parol muvaffaqiyatli yangilandi.',
    });
  } catch (error: any) {
    console.error('Password reset complete error:', error);
    res.status(500).json({
      error: error?.message || 'Parolni yangilashda xatolik yuz berdi.',
    });
  }
});

app.post('/api/ai/explain', aiRateLimit, async (req, res) => {
  try {
    const { question, answer, context } = req.body;

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ error: 'GROQ_API_KEY is not configured' });
    }

    const groq = getGroqClient();
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.4,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `Siz tibbiy testlarni tushuntiruvchi AI ustozsiz.
Javobni faqat JSON formatida qaytaring:
{
  "explanation": "matn",
  "keyPoints": ["nuqta"],
  "typicalMistakes": ["xato"],
  "imageDescription": "ixtiyoriy",
  "videoQuery": "ixtiyoriy",
  "sources": ["manba"]
}
MUHIM:
- "sources" ichiga faqat to'g'ridan-to'g'ri ishlaydigan https:// havolalarni kiriting.
- Har bir source satrida aniq URL bo'lsin.
- Agar ishonchli to'g'ridan-to'g'ri havola bera olmasangiz, "sources": [] qaytaring.
- Kitob nomi, tashkilot nomi yoki havolasiz matn qaytarmang.`,
        },
        {
          role: 'user',
          content: `Savol: ${question}\nTanlangan javob: ${answer}\nKontekst: ${context}`,
        },
      ],
    });

    const parsed = parseJsonResponse(completion.choices[0]?.message?.content, {
      explanation: 'Tushuntirishni olishda xatolik yuz berdi.',
      keyPoints: [],
      typicalMistakes: [],
      sources: [],
    });

    res.json(parsed);
  } catch (error: any) {
    console.error('Groq Explain Error:', error);
    const friendly = getFriendlyGroqError(error);
    res.status(friendly.status).json({ error: friendly.error });
  }
});

app.post('/api/ai/define', aiRateLimit, async (req, res) => {
  try {
    const { term, fullContext } = req.body;

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ error: 'GROQ_API_KEY is not configured' });
    }

    const groq = getGroqClient();
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `Siz tibbiy lug'at yordamchisiz.
Javobni faqat JSON formatida qaytaring:
{
  "definition": "ta'rif",
  "tip": "ixtiyoriy maslahat",
  "relatedTerms": ["termin"]
}`,
        },
        {
          role: 'user',
          content: `Termin: ${term}\nKontekst: ${fullContext}`,
        },
      ],
    });

    const parsed = parseJsonResponse(completion.choices[0]?.message?.content, {
      definition: "Ta'rifni olishda xatolik yuz berdi.",
      relatedTerms: [],
    });

    res.json(parsed);
  } catch (error: any) {
    console.error('Groq Define Error:', error);
    const friendly = getFriendlyGroqError(error);
    res.status(friendly.status).json({ error: friendly.error });
  }
});

app.post('/api/ai/chat', aiRateLimit, async (req, res) => {
  try {
    const { messages, context } = req.body as {
      messages: { role: 'user' | 'assistant'; content: string }[];
      context?: { question?: string; explanation?: string };
    };

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ error: 'GROQ_API_KEY is not configured' });
    }

    const groq = getGroqClient();
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.4,
      messages: [
        {
          role: 'system',
          content: `Siz tibbiy testlar bo'yicha yordamchi mutaxassissiz.
Javoblarni o'zbek tilida aniq va tushunarli yozing.
${context?.question ? `Savol konteksti: ${context.question}` : ''}
${context?.explanation ? `Tushuntirish konteksti: ${context.explanation}` : ''}`.trim(),
        },
        ...messages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
      ],
    });

    res.json({
      content: completion.choices[0]?.message?.content || "Kechirasiz, javob olishda xatolik yuz berdi.",
    });
  } catch (error: any) {
    console.error('Groq Chat Error:', error);
    const friendly = getFriendlyGroqError(error);
    res.status(friendly.status).json({ error: friendly.error });
  }
});

export default app;
