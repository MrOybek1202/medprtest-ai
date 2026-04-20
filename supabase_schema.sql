-- 1. Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Tables

-- Users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Questions table
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic TEXT NOT NULL,
    difficulty_level INTEGER NOT NULL DEFAULT 1,
    stem TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_option TEXT NOT NULL,
    explanation_title TEXT,
    explanation_body TEXT,
    key_points TEXT[],
    typical_mistakes TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Sessions table
CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    topic TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed')),
    current_question_index INTEGER DEFAULT 0,
    total_questions INTEGER NOT NULL,
    question_ids UUID[],
    score_percent INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Question Attempts table
CREATE TABLE IF NOT EXISTS public.question_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,
    question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
    question_topic TEXT NOT NULL,
    level INTEGER NOT NULL,
    selected_option TEXT NOT NULL,
    correct_option TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Stats table
CREATE TABLE IF NOT EXISTS public.stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    overall_accuracy INTEGER DEFAULT 0,
    study_streak INTEGER DEFAULT 0,
    average_time_seconds INTEGER DEFAULT 0,
    weak_topic TEXT,
    recommendation TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Glossary table
CREATE TABLE IF NOT EXISTS public.glossary (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    term TEXT NOT NULL,
    definition TEXT NOT NULL,
    tip TEXT,
    related_terms TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.glossary ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies
CREATE POLICY "Public read access for questions" ON public.questions FOR SELECT USING (true);
CREATE POLICY "Admins can manage all questions" ON public.questions FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Users can manage their own data" ON public.users;
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can read all users" ON public.users;
DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;

CREATE POLICY "Users can read own profile" ON public.users
FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can insert own profile" ON public.users
FOR INSERT WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Users can update own profile" ON public.users
FOR UPDATE USING (auth.uid() = auth_user_id)
WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Admins can read all users" ON public.users
FOR SELECT USING (
    EXISTS (
        SELECT 1
        FROM public.users admin_user
        WHERE admin_user.auth_user_id = auth.uid()
          AND admin_user.role = 'admin'
    )
);

CREATE POLICY "Admins can manage all users" ON public.users
FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM public.users admin_user
        WHERE admin_user.auth_user_id = auth.uid()
          AND admin_user.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.users admin_user
        WHERE admin_user.auth_user_id = auth.uid()
          AND admin_user.role = 'admin'
    )
);
CREATE POLICY "Users can manage their own sessions" ON public.sessions FOR ALL USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()) OR EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Users can manage their own attempts" ON public.question_attempts FOR ALL USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()) OR EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Users can manage their own stats" ON public.stats FOR ALL USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()) OR EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Users can manage their own glossary" ON public.glossary FOR ALL USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()) OR EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = auth.uid() AND role = 'admin'));

-- 5. Seed Data
INSERT INTO public.questions (topic, difficulty_level, stem, option_a, option_b, option_c, option_d, correct_option, explanation_title, explanation_body)
VALUES 
('Anatomiya', 1, 'Inson tanasidagi eng katta suyak qaysi?', 'Boldir suyagi', 'Son suyagi', 'Yelka suyagi', 'To''sh suyagi', 'Son suyagi', 'Suyaklar tahlili', 'Son suyagi (femur) inson tanasidagi eng uzun va eng kuchli suyak hisoblanadi.'),
('Fiziologiya', 1, 'Normal holatda inson yuragi bir daqiqada necha marta uradi?', '40-60', '60-90', '90-120', '120-150', '60-90', 'Yurak urishi', 'Sog''lom katta yoshli odamda tinch holatda yurak urishi daqiqasiga 60 dan 90 martagacha bo''ladi.'),
('Farmakologiya', 2, 'Gipotenziv dori vositalari guruhiga nima kiradi?', 'Analgin', 'Enapril', 'Aspirin', 'Paratsetamol', 'Enapril', 'Dori vositalari', 'Enapril - bu qon bosimini tushirish uchun ishlatiladigan AAF inhibitori.');

-- Chat threads table
CREATE TABLE IF NOT EXISTS public.chat_threads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    thread_id UUID REFERENCES public.chat_threads(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Focus timers table (cross-device timer sync by auth user)
CREATE TABLE IF NOT EXISTS public.focus_timers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    mode TEXT NOT NULL DEFAULT 'countdown' CHECK (mode IN ('countdown', 'elapsed')),
    start_time BIGINT,
    duration INTEGER NOT NULL DEFAULT 1800,
    is_running BOOLEAN NOT NULL DEFAULT false,
    elapsed_ms BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.focus_timers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own chat threads" ON public.chat_threads;
CREATE POLICY "Users can manage their own chat threads" ON public.chat_threads
FOR ALL USING (
    user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = auth.uid() AND role = 'admin')
) WITH CHECK (
    user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Users can manage their own chat messages" ON public.chat_messages;
CREATE POLICY "Users can manage their own chat messages" ON public.chat_messages
FOR ALL USING (
    thread_id IN (
        SELECT id FROM public.chat_threads
        WHERE user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = auth.uid() AND role = 'admin')
) WITH CHECK (
    thread_id IN (
        SELECT id FROM public.chat_threads
        WHERE user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Users can manage own focus timers" ON public.focus_timers;
CREATE POLICY "Users can manage own focus timers" ON public.focus_timers
FOR ALL USING (auth.uid() = auth_user_id)
WITH CHECK (auth.uid() = auth_user_id);
