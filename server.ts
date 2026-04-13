import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Groq from "groq-sdk";
import cors from "cors";
import dotenv from "dotenv";
import { rateLimit } from 'express-rate-limit';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Trust proxy headers (Cloud Run / Nginx)
  app.set('trust proxy', 1);

  // 1. Robust CORS & Preflight handling (MUST BE FIRST)
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    // Allow specific origin or any if needed for development
    if (origin === 'https://medprtest-ai.vercel.app' || process.env.NODE_ENV !== 'production') {
      res.header("Access-Control-Allow-Origin", origin || "*");
    }
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
    res.header("Access-Control-Allow-Credentials", "true");

    // Handle Preflight
    if (req.method === "OPTIONS") {
      return res.status(204).end();
    }
    next();
  });

  app.use(express.json());
  
  // Rate limiting for AI endpoints
  const aiRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 50, // Limit each IP to 50 requests per window
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    validate: { trustProxy: false }, // Suppress trust proxy validation warnings
    message: { error: "Too many requests. Please try again later." }
  });

  // Request logging for debugging
  app.use((req, res, next) => {
    if (req.url.startsWith('/api')) {
      console.log(`[API LOG] ${req.method} ${req.url}`);
    }
    next();
  });

  // Groq Client Initialization
  const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });

  if (!process.env.GROQ_API_KEY) {
    console.warn('WARNING: GROQ_API_KEY is not set in environment variables. AI features will fail.');
  } else {
    console.log('GROQ_API_KEY is configured.');
  }

  // Simple In-Memory Cache
  const aiCache = new Map<string, any>();

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      ai_configured: !!process.env.GROQ_API_KEY,
      node_env: process.env.NODE_ENV
    });
  });

  app.post("/api/ai/explain", aiRateLimit, async (req, res) => {
    const requestId = Math.random().toString(36).substring(7);
    console.log(`[${requestId}] POST /api/ai/explain received`);
    try {
      const { question, answer, context } = req.body;
      
      // Caching key
      const cacheKey = `explain:${Buffer.from(question + answer).toString('base64')}`;
      if (aiCache.has(cacheKey)) {
        console.log('Returning cached explanation');
        return res.json(aiCache.get(cacheKey));
      }

      if (!process.env.GROQ_API_KEY) {
        console.error('GROQ_API_KEY is missing in environment variables');
        return res.status(500).json({ error: "GROQ_API_KEY is not configured" });
      }

      console.log('Requesting completion from Groq...');
      let completion;
      const systemPrompt = `Siz tibbiy ta'lim bo'yicha yuqori malakali mutaxassissiz. Tibbiy savollarga chuqur, aniq va tizimli tushuntirishlar bering. 
      
      Vazifangiz:
      1. Nima uchun to'g'ri javob to'g'ri ekanligini ilmiy asoslab bering.
      2. Nima uchun boshqa variantlar noto'g'ri ekanligini (differensial tahlil) tushuntiring.
      3. Mavzuni yaxshiroq tushunish uchun 3-5 ta asosiy nuqtani (key points) ajratib ko'rsating.
      4. Talabalar ko'p yo'l qo'yadigan xatolarni (typical mistakes) sanab o'ting.
      5. Mavzuga oid vizual tasavvur uchun rasm tavsifi va video qidiruv kalit so'zini bering.
      6. Albatta nufuzli tibbiy manbalarga (PubMed, Medscape, Mayo Clinic) havolalar bering.

      Barcha javoblarni O'zbek tilida, akademik lekin tushunarli tilda bering.
      
      Javobni FAQAT quyidagi JSON formatida qaytaring:
      {
        "explanation": "Batafsil tushuntirish matni (kamida 3-4 gap)...",
        "keyPoints": ["Asosiy nuqta 1", "Asosiy nuqta 2", "Asosiy nuqta 3"],
        "typicalMistakes": ["Xato 1", "Xato 2"],
        "imageDescription": "Mavzuga oid rasm tavsifi (masalan: 'Yurak klapanlari ishlash mexanizmi')",
        "videoQuery": "YouTube qidiruvi uchun inglizcha yoki o'zbekcha kalit so'z",
        "sources": ["PubMed: Article Title (https://pubmed.ncbi.nlm.nih.gov/...)"]
      }
      
      MUHIM: JSON formatidan tashqari hech qanday matn qo'shmang.`;

      try {
        completion = await groq.chat.completions.create({
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: `Savol: ${question}\nTanlangan javob: ${answer}\nKontekst: ${context}`,
            },
          ],
          model: "llama-3.3-70b-versatile",
          response_format: { type: "json_object" },
          temperature: 0.5,
        });
      } catch (primaryError: any) {
        console.warn('Primary model failed, trying 70b fallback...', primaryError.message);
        try {
          completion = await groq.chat.completions.create({
            messages: [
              { role: "system", content: systemPrompt },
              {
                role: "user",
                content: `Savol: ${question}\nTanlangan javob: ${answer}\nKontekst: ${context}`,
              },
            ],
            model: "llama3-70b-8192",
            response_format: { type: "json_object" }
          });
        } catch (secondaryError: any) {
          console.warn('Secondary model failed, trying 8b fallback...', secondaryError.message);
          completion = await groq.chat.completions.create({
            messages: [
              { role: "system", content: systemPrompt },
              {
                role: "user",
                content: `Savol: ${question}\nTanlangan javob: ${answer}\nKontekst: ${context}`,
              },
            ],
            model: "llama3-8b-8192",
            response_format: { type: "json_object" }
          });
        }
      }

      const responseContent = completion.choices[0]?.message?.content || "{}";
      console.log('Groq response content:', responseContent);
      
      try {
        // Clean the response content from potential markdown backticks
        const cleanJson = responseContent.replace(/```json\n?|```/g, '').trim();
        const parsedData = JSON.parse(cleanJson);
        
        // Store in cache
        const cacheKey = `explain:${Buffer.from(question + answer).toString('base64')}`;
        aiCache.set(cacheKey, parsedData);
        res.json(parsedData);
      } catch (parseError) {
        console.error("JSON Parse Error (Explain):", parseError, "Raw content:", responseContent);
        // Attempt to extract JSON if it's embedded in text
        const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const extractedData = JSON.parse(jsonMatch[0]);
            return res.json(extractedData);
          } catch (e) {
            console.error("Failed to extract JSON from content");
          }
        }
        
        res.json({
          explanation: responseContent,
          keyPoints: [],
          typicalMistakes: [],
          sources: []
        });
      }
    } catch (error: any) {
      console.error("Groq API Error (Explain):", error);
      if (error.status === 429 || (error.message && error.message.includes('quota'))) {
        return res.status(429).json({ error: "Token tugadi yoki limitga yetildi. Iltimos, birozdan so'ng qayta urinib ko'ring." });
      }
      res.status(500).json({ error: "Failed to generate explanation" });
    }
  });

  app.post("/api/ai/define", aiRateLimit, async (req, res) => {
    const requestId = Math.random().toString(36).substring(7);
    console.log(`[${requestId}] POST /api/ai/define received`);
    try {
      const { term, fullContext } = req.body;

      // Caching key
      const cacheKey = `define:${Buffer.from(term + (fullContext || '')).toString('base64')}`;
      if (aiCache.has(cacheKey)) {
        console.log('Returning cached definition');
        return res.json(aiCache.get(cacheKey));
      }

      if (!process.env.GROQ_API_KEY) {
        console.error('GROQ_API_KEY is missing in environment variables');
        return res.status(500).json({ error: "GROQ_API_KEY is not configured" });
      }

      console.log('Requesting definition from Groq...');
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `Siz tibbiy lug'at yordamchisiz. Berilgan tibbiy terminni butun savol kontekstidan kelib chiqib O'zbek tilida qisqa va tushunarli qilib ta'riflang. 
            Shuningdek, bitta eslab qolish uchun maslahat (tip) va mavzuga oid 2-3 ta bog'liq terminlarni bering.
            
            Javobni FAQAT quyidagi JSON formatida qaytaring:
            {
              "definition": "Termin ta'rifi...",
              "tip": "Eslab qolish uchun maslahat...",
              "relatedTerms": ["Termin 1", "Termin 2"]
            }
            
            MUHIM: JSON formatidan tashqari hech qanday matn qo'shmang.`,
          },
          {
            role: "user",
            content: `Termin: ${term}\nTo'liq kontekst: ${fullContext}`,
          },
        ],
        model: "llama-3.3-70b-versatile",
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const responseContent = completion.choices[0]?.message?.content || "{}";
      console.log('Groq response content (Define):', responseContent);
      try {
        const cleanJson = responseContent.replace(/```json\n?|```/g, '').trim();
        const parsedData = JSON.parse(cleanJson);
        // Store in cache
        const cacheKey = `define:${Buffer.from(term + (fullContext || '')).toString('base64')}`;
        aiCache.set(cacheKey, parsedData);
        res.json(parsedData);
      } catch (parseError) {
        console.error("JSON Parse Error (Define):", parseError, "Raw content:", responseContent);
        const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const extractedData = JSON.parse(jsonMatch[0]);
            return res.json(extractedData);
          } catch (e) {
            console.error("Failed to extract JSON from content (Define)");
          }
        }
        res.json({
          definition: responseContent,
          tip: "",
          relatedTerms: []
        });
      }
    } catch (error: any) {
      console.error("Groq API Error (Define):", error);
      if (error.status === 429 || (error.message && error.message.includes('quota'))) {
        return res.status(429).json({ error: "Token tugadi yoki limitga yetildi. Iltimos, birozdan so'ng qayta urinib ko'ring." });
      }
      res.status(500).json({ error: "Failed to generate definition" });
    }
  });

  app.post("/api/ai/chat", aiRateLimit, async (req, res) => {
    const requestId = Math.random().toString(36).substring(7);
    console.log(`[${requestId}] POST /api/ai/chat received`, { messageCount: req.body.messages?.length });
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
              content: `Siz tibbiy ta'lim bo'yicha mutaxassissiz. Foydalanuvchining tibbiy savollariga aniq, ilmiy va tushunarli javob bering. 
              Kontekst sifatida foydalanuvchi ko'rayotgan savol va uning tushuntirishi berilgan. 
              Javoblarni O'zbek tilida bering. Qisqa va lo'nda bo'ling.`,
            },
            ...messages.map((m: any) => ({
              role: m.role,
              content: m.content
            }))
          ],
          model: "llama-3.3-70b-versatile",
        });
      } catch (chatError: any) {
        console.warn('Chat primary model failed, trying fallback...', chatError.message);
        completion = await groq.chat.completions.create({
          messages: [
            {
              role: "system",
              content: `Siz tibbiy ta'lim bo'yicha mutaxassissiz. Tibbiy savollarga O'zbek tilida qisqa va lo'nda javob bering.`,
            },
            ...messages.map((m: any) => ({
              role: m.role,
              content: m.content
            }))
          ],
          model: "llama3-8b-8192",
        });
      }

      res.json({ content: completion.choices[0]?.message?.content });
    } catch (error: any) {
      console.error("Groq Chat Error:", error);
      if (error.status === 429 || (error.message && error.message.includes('quota'))) {
        return res.status(429).json({ error: "Token tugadi yoki limitga yetildi. Iltimos, birozdan so'ng qayta urinib ko'ring." });
      }
      res.status(500).json({ error: "Failed to get chat response" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
