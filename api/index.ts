import express from "express";
import Groq from "groq-sdk";
import cors from "cors";

// Rate limiter does not work effectively in Vercel Serverless environment 
// without an external store (like Redis), but we can still use a simplified memory version.
import { rateLimit } from 'express-rate-limit';

const app = express();

// Trust proxy headers for Vercel
app.set('trust proxy', 1);

// 1. Robust CORS & Preflight handling (MUST BE FIRST)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin === 'https://medprtest-ai.vercel.app' || process.env.NODE_ENV !== 'production' || origin?.includes('localhost')) {
    res.header("Access-Control-Allow-Origin", origin || "*");
  }
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  res.header("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
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
  message: { error: "Too many requests. Please try again later." }
});

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    ai_configured: !!process.env.GROQ_API_KEY,
    node_env: process.env.NODE_ENV,
    vercel: true
  });
});

app.post("/api/ai/explain", aiRateLimit, async (req, res) => {
  try {
    const { question, answer, context } = req.body;

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ error: "GROQ_API_KEY is not configured" });
    }

    const systemPrompt = `Siz tibbiy ta'lim bo'yicha yuqori malakali mutaxassissiz. Tibbiy savollarga chuqur, aniq va tizimli tushuntirishlar bering. 
    
    Vazifangiz:
    1. Nima uchun to'g'ri javob to'g'ri ekanligini ilmiy asoslab bering.
    2. Nima uchun boshqa variantlar noto'g'ri ekanligini (differensial tahlil) tushuntiring.
    3. Mavzuni yaxshiroq tushunish uchun 3-5 ta asosiy nuqtani (key points) ajratib ko'rsating.
    4. Talabalar ko'p yo'l qo'yadigan xatolarni sanab o'ting.
    5. Mavzuga oid vizual tasavvur uchun rasm tavsifi va video qidiruv kalit so'zini bering.
    6. Albatta nufuzli tibbiy manbalarga havolalar bering.

    Javobni FAQAT quyidagi JSON formatida qaytaring:
    {
      "explanation": "Tushuntirish matni...",
      "keyPoints": ["Nuqta 1", "Nuqta 2"],
      "typicalMistakes": ["Xato 1", "Xato 2"],
      "imageDescription": "Mavzuga oid rasm tavsifi",
      "videoQuery": "YouTube kalit so'zi",
      "sources": ["PubMed: Article Title (https://...)"]
    }`;

    let completion;
    try {
      completion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Savol: ${question}\nTanlangan javob: ${answer}\nKontekst: ${context}` },
        ],
        model: "llama-3.3-70b-versatile",
        response_format: { type: "json_object" },
        temperature: 0.5,
      });
    } catch (primaryError: any) {
      completion = await groq.chat.completions.create({
        messages: [
           { role: "system", content: systemPrompt },
           { role: "user", content: `Savol: ${question}\nTanlangan javob: ${answer}\nKontekst: ${context}` },
        ],
        model: "llama3-8b-8192",
        response_format: { type: "json_object" }
      });
    }

    const responseContent = completion.choices[0]?.message?.content || "{}";
    const cleanJson = responseContent.replace(/```json\n?|```/g, '').trim();
    const parsedData = JSON.parse(cleanJson);
    
    res.json(parsedData);
  } catch (error: any) {
    console.error("Groq Explain Error:", error);
    if (error.status === 429) {
      return res.status(429).json({ error: "Token tugadi yoki limitga yetildi." });
    }
    res.status(500).json({ error: "Failed to generate explanation" });
  }
});

app.post("/api/ai/define", aiRateLimit, async (req, res) => {
  try {
    const { term, fullContext } = req.body;
    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ error: "GROQ_API_KEY is not configured" });
    }

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `Tibbiy lug'at yordamchisiz. Javobni FAQAT quyidagi JSON formatida qaytaring:
          {
            "definition": "Termin ta'rifi...",
            "tip": "Eslab qolish maslahati...",
            "relatedTerms": ["Termin 1"]
          }`,
        },
        { role: "user", content: `Termin: ${term}\nKontekst: ${fullContext}` },
      ],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
    });

    const responseContent = completion.choices[0]?.message?.content || "{}";
    const parsedData = JSON.parse(responseContent.replace(/```json\n?|```/g, '').trim());
    res.json(parsedData);
  } catch (error: any) {
    if (error.status === 429) {
      return res.status(429).json({ error: "Token tugadi." });
    }
    res.status(500).json({ error: "Failed to generate definition" });
  }
});

app.post("/api/ai/chat", aiRateLimit, async (req, res) => {
  try {
    const { messages, context } = req.body;
    
    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ error: "GROQ_API_KEY is not configured" });
    }

    let completion;
    try {
      completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `Siz tibbiy ta'lim bo'yicha mutaxassissiz. Javoblarni O'zbek tilida bering.`,
          },
          ...messages.map((m: any) => ({ role: m.role, content: m.content }))
        ],
        model: "llama-3.3-70b-versatile",
      });
    } catch (chatError: any) {
      completion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: "Siz tibbiy yordamchisiz. O'zbek tilida javob bering." },
          ...messages.map((m: any) => ({ role: m.role, content: m.content }))
        ],
        model: "llama3-8b-8192",
      });
    }

    res.json({ content: completion.choices[0]?.message?.content });
  } catch (error: any) {
    if (error.status === 429) {
      return res.status(429).json({ error: "Token tugadi." });
    }
    res.status(500).json({ error: "Failed to get chat response" });
  }
});

// For Vercel Serverless Functions
export default app;
