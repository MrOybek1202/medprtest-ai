import express from 'express';
import Groq from 'groq-sdk';
import { rateLimit } from 'express-rate-limit';

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

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    ai_provider: 'groq',
    ai_configured: Boolean(process.env.GROQ_API_KEY),
  });
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
