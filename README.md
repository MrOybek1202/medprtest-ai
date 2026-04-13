# MedTest AI

Tibbiy ta'limda yangi bosqich. AI asosidagi klinik testlar va tahlillar tizimi.

## Loyihani ishga tushirish (Local Development)

Ushbu loyihani o'zingizning kompyuteringizda ishga tushirish uchun quyidagi bosqichlarni bajaring:

### 1. Loyihani yuklab olish (Clone)

```bash
git clone https://github.com/MrOybek1202/medprtest-ai.git
cd medprtest-ai
```

### 2. Kutubxonalarni o'rnatish (Install Dependencies)

```bash
npm install
```

### 3. Muhit o'zgaruvchilarini sozlash (.env)

Loyiha ildizida `.env` faylini yarating va quyidagi ma'lumotlarni kiriting (Supabase va Gemini kalitlarini o'zingiznikiga almashtiring):

```env
VITE_SUPABASE_URL=sizning_supabase_url
VITE_SUPABASE_ANON_KEY=sizning_supabase_anon_key
GEMINI_API_KEY=sizning_gemini_api_key
```

### 4. Loyihani ishga tushirish

```bash
npm run dev
```

Loyiha odatda `http://localhost:3000` manzilida ishga tushadi.

## Texnologiyalar

- **Frontend:** React, Vite, Tailwind CSS, Framer Motion
- **Backend/Database:** Supabase (Auth, PostgreSQL, Real-time)
- **AI:** Google Gemini API
- **UI Components:** Lucide React, Sonner (Toasts), Recharts

## Muallif

[MrOybek1202](https://github.com/MrOybek1202)
