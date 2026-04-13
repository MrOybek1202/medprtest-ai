/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster, toast } from 'sonner';
import { LayoutDashboard, GraduationCap, BookMarked, LogOut, User, Settings, Bell, Search, Menu, Target, HelpCircle, Database as DatabaseIcon, Eye, EyeOff, HeartPulse, Download } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { supabase } from './lib/supabase';
import Dashboard from './components/Dashboard';
import TestSession from './components/TestSession';
import Glossary from './components/Glossary';
import Topics from './components/Topics';
import WeakPractice from './components/WeakPractice';
import ProfileSettings from './components/ProfileSettings';
import LandingPage from './components/landing/LandingPage';
import AIChat from './components/AIChat';
import AdminPanel from './components/AdminPanel';
import MobileNav from './components/mobile/MobileNav';
import SelectionTooltip from './components/SelectionTooltip';

type Tab = 'dashboard' | 'topics' | 'weak-practice' | 'glossary' | 'profile' | 'settings' | 'help' | 'test' | 'admin';

export default function App() {
  const { user, loading: authLoading, signIn, signUp, signInWithGoogle, signOut, resetPassword } = useAuth();
  const [internalUserId, setInternalUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'user' | 'admin'>('user');
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsPWA(true);
    }

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) {
      toast.info("Ilovani o'rnatish uchun brauzer menyusidan 'Asosiy ekranga qo'shish' bandini tanlang");
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  useEffect(() => {
    // Check for recovery mode in URL
    const params = new URLSearchParams(window.location.search);
    if (params.get('type') === 'recovery') {
      setIsRecovering(true);
      setShowAuth(true);
      setIsLogin(false); // We'll use the signup/reset view
    }
  }, []);

  useEffect(() => {
    // Theme initialization
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  useEffect(() => {
    if (user) {
      const checkProfile = async () => {
        try {
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('auth_user_id', user.id)
            .single();

          if (profileError && profileError.code !== 'PGRST116') {
            throw profileError;
          }

          if (profile) {
            setInternalUserId(profile.id);
            const isAdminEmail = user.email?.toLowerCase() === 'oybek.karimjonov1202@gmail.com';
            
            if (isAdminEmail && profile.role !== 'admin') {
              console.log('Forcing admin role for:', user.email);
              await supabase.from('users').update({ role: 'admin' }).eq('id', profile.id);
              setUserRole('admin');
              toast.success('Admin huquqlari tasdiqlandi');
            } else {
              setUserRole(profile.role as 'user' | 'admin');
            }

            if (profile.role === 'admin' || isAdminEmail) {
              setActiveTab('admin');
            }
          } else {
            // Check if this is the designated admin email
            const isAdminEmail = user.email?.toLowerCase() === 'oybek.karimjonov1202@gmail.com';
            
            console.log('Creating new profile. Admin:', isAdminEmail);
            toast.info('Yangi profil yaratilmoqda...');
            const { data: newUser, error: insertError } = await supabase.from('users').insert({
              auth_user_id: user.id,
              email: user.email!,
              full_name: user.email?.split('@')[0],
              role: isAdminEmail ? 'admin' : 'user'
            }).select().single();
            
            if (insertError) throw insertError;

            if (newUser) {
              setInternalUserId(newUser.id);
              setUserRole(newUser.role as 'user' | 'admin');
              toast.success('Profil muvaffaqiyatli yaratildi');
              if (newUser.role === 'admin') {
                setActiveTab('admin');
              }
              try {
                await supabase.from('stats').insert({
                  user_id: newUser.id,
                  overall_accuracy: 0,
                  study_streak: 0,
                  average_time_seconds: 0
                });
              } catch (err) {
                console.error('Failed to initialize stats:', err);
              }
            }
          }
        } catch (err: any) {
          console.error('Profile check error:', err);
          toast.error('Profilni yuklashda xatolik yuz berdi: ' + (err.message || 'Noma\'lum xatolik'));
        }
      };
      checkProfile();
    }
  }, [user]);

  const handleAuth = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    console.log('Attempting auth...', { isLogin, email, isRecovering });
    try {
      if (isRecovering) {
        if (password.length < 6) {
          throw new Error('Parol kamida 6 ta belgidan iborat bo\'lishi kerak');
        }
        if (password !== confirmPassword) {
          throw new Error('Parollar mos kelmadi');
        }
        const { error: updateError } = await supabase.auth.updateUser({ password });
        if (updateError) throw updateError;
        toast.success('Parol muvaffaqiyatli yangilandi!');
        setIsRecovering(false);
        setIsLogin(true);
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }

      if (!isLogin && password.length < 6) {
        throw new Error('Parol kamida 6 ta belgidan iborat bo\'lishi kerak');
      }
      if (!isLogin && password !== confirmPassword) {
        throw new Error('Parollar mos kelmadi');
      }

      if (isLogin) {
        const { data, error: signInError } = await signIn(email, password);
        if (signInError) {
          console.error('Sign in error:', signInError);
          if (signInError.message === 'Invalid login credentials') {
            throw new Error('Email yoki parol noto\'g\'ri');
          }
          throw signInError;
        }
        console.log('Sign in success:', data);
        toast.success('Xush kelibsiz!');
      } else {
        const { data, error: signUpError } = await signUp(email, password);
        if (signUpError) {
          console.error('Sign up error:', signUpError);
          if (signUpError.message === 'User already registered') {
            throw new Error('Ushbu email bilan allaqachon ro\'yxatdan o\'tilgan');
          }
          throw signUpError;
        }
        console.log('Sign up success:', data);
        toast.success('Ro\'yxatdan o\'tdingiz! Emailingizni tasdiqlang.');
      }
    } catch (err: any) {
      console.error('Auth handler caught error:', err);
      setError(err.message || 'Noma\'lum xatolik yuz berdi');
      toast.error(err.message || 'Noma\'lum xatolik yuz berdi');
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error('Iltimos, email manzilingizni kiriting');
      return;
    }
    try {
      const { error: resetError } = await resetPassword(email);
      if (resetError) throw resetError;
      toast.success('Parolni tiklash havolasi emailingizga yuborildi!');
    } catch (err: any) {
      toast.error(err.message || 'Xatolik yuz berdi');
    }
  };

  if (authLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
      <motion.div 
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="w-16 h-16 bg-[#1B4D3E] rounded-3xl flex items-center justify-center text-white"
      >
        <HeartPulse size={32} />
      </motion.div>
      {!import.meta.env.VITE_SUPABASE_URL && (
        <p className="text-red-500 text-sm font-bold">Supabase URL topilmadi! .env faylini tekshiring.</p>
      )}
    </div>
  );

  if (!user) {
    if (!showAuth) {
      return <LandingPage onGetStarted={() => setShowAuth(true)} onInstall={handleInstallApp} />;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-10 rounded-[40px] shadow-2xl border border-slate-100 w-full max-w-md space-y-8 relative"
        >
          <button 
            onClick={() => setShowAuth(false)}
            className="absolute top-6 right-8 text-slate-400 hover:text-slate-600 font-bold text-sm"
          >
            Qaytish
          </button>
          <div className="text-center space-y-2">
            <div className="w-20 h-20 bg-[#1B4D3E] rounded-[32px] flex items-center justify-center text-white mx-auto mb-6 shadow-xl shadow-[#1B4D3E]/20">
              <HeartPulse size={40} />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">MedTest AI</h1>
            <p className="text-slate-500">Tibbiy ta'limda yangi bosqich</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Email manzili</label>
              <input
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-[#1B4D3E] transition-all outline-none text-slate-900"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Parol</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-[#1B4D3E] transition-all outline-none text-slate-900 pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {isLogin && !isRecovering && (
                <div className="flex justify-end px-1">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-[10px] font-bold text-[#1B4D3E] hover:underline uppercase tracking-wider"
                  >
                    Parolni unutdingizmi?
                  </button>
                </div>
              )}
            </div>
            {(isRecovering || !isLogin) && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                  {isRecovering ? 'Yangi parolni tasdiqlang' : 'Parolni tasdiqlang'}
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-[#1B4D3E] transition-all outline-none text-slate-900 pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            )}
            {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}
            <button
              type="submit"
              className="w-full bg-[#1B4D3E] hover:bg-[#153a2f] text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-[#1B4D3E]/20"
            >
              {isRecovering ? 'Parolni yangilash' : (isLogin ? 'Kirish' : "Ro'yxatdan o'tish")}
            </button>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-400 font-bold">Yoki</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => signInWithGoogle()}
              className="w-full bg-white border border-slate-200 text-slate-600 font-bold py-4 rounded-2xl transition-all hover:bg-slate-50 flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google orqali kirish
            </button>
          </form>

          <div className="text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm font-bold text-[#1B4D3E] hover:underline"
            >
              {isLogin ? "Hisobingiz yo'qmi? Ro'yxatdan o'ting" : "Hisobingiz bormi? Kiring"}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const menuItems = [
    { id: 'dashboard', label: 'Boshqaruv', icon: LayoutDashboard },
    { id: 'topics', label: 'Mavzular', icon: GraduationCap },
    { id: 'weak-practice', label: 'Zaif mavzular', icon: Target },
    { id: 'glossary', label: 'Lug\'at', icon: BookMarked },
    { id: 'profile', label: 'Profil', icon: User },
  ];

  const generalItems = [
    { id: 'settings', label: 'Sozlamalar', icon: Settings },
    { id: 'help', label: 'Yordam', icon: HelpCircle },
  ];

  return (
    <div className="h-screen bg-slate-50 dark:bg-[#0F172A] flex overflow-hidden font-sans relative">
      <Toaster position="top-center" expand={false} richColors />
      {/* Sidebar Overlay for Mobile - Removed since sidebar is hidden on mobile */}

      {/* Sidebar */}
      {activeTab !== 'test' && (
        <motion.aside 
          initial={false}
          animate={{ 
            width: isSidebarOpen ? 280 : 80,
            x: isSidebarOpen ? 0 : (window.innerWidth < 1024 ? -280 : 0)
          }}
          className={`bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 hidden lg:flex flex-col shrink-0 z-50 fixed lg:relative h-full transition-all duration-300 ${!isSidebarOpen && 'lg:w-20'}`}
        >
          <div className="p-6 flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 bg-[#1B4D3E] rounded-xl flex items-center justify-center text-white shrink-0 aspect-square">
              <HeartPulse size={24} />
            </div>
            {isSidebarOpen && (
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-bold text-xl text-slate-900 dark:text-white"
              >
                MedTest AI
              </motion.span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-8 space-y-8">
            <div className="space-y-2">
              {isSidebarOpen && <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-4 mb-4">Menu</p>}
              {userRole === 'admin' && (
                <button
                  onClick={() => setActiveTab('admin')}
                  className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all group ${
                    activeTab === 'admin' 
                      ? 'bg-[#1B4D3E] text-white shadow-lg shadow-[#1B4D3E]/20' 
                      : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <DatabaseIcon size={24} className={activeTab === 'admin' ? 'text-white' : 'group-hover:text-[#1B4D3E]'} />
                  {isSidebarOpen && (
                    <motion.span 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="font-bold text-sm"
                    >
                      Admin Panel
                    </motion.span>
                  )}
                </button>
              )}
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as Tab)}
                  className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all group ${
                    activeTab === item.id 
                      ? 'bg-[#1B4D3E] text-white shadow-lg shadow-[#1B4D3E]/20' 
                      : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <item.icon size={24} className={activeTab === item.id ? 'text-white' : 'group-hover:text-[#1B4D3E]'} />
                  {isSidebarOpen && (
                    <motion.span 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="font-bold text-sm"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {isSidebarOpen && <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-4 mb-4">General</p>}
              {generalItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as Tab)}
                  className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all group ${
                    activeTab === item.id 
                      ? 'bg-[#1B4D3E] text-white shadow-lg shadow-[#1B4D3E]/20' 
                      : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <item.icon size={24} className={activeTab === item.id ? 'text-white' : 'group-hover:text-[#1B4D3E]'} />
                  {isSidebarOpen && (
                    <motion.span 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="font-bold text-sm"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 space-y-4">
            {isSidebarOpen && !isPWA && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-2 p-5 bg-slate-900 dark:bg-slate-950 rounded-[32px] relative overflow-hidden group border border-white/5 shadow-2xl"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#1B4D3E]/20 rounded-full -mr-8 -mt-8 blur-2xl group-hover:bg-[#1B4D3E]/30 transition-colors" />
                <div className="relative z-10">
                  <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center mb-4">
                    <HeartPulse size={20} className="text-white" />
                  </div>
                  <h4 className="text-white font-bold text-sm leading-tight">Mobil ilovani yuklab oling</h4>
                  <p className="text-slate-400 text-[10px] mt-1.5">O'qishni yanada qulayroq qiling</p>
                  <button 
                    onClick={handleInstallApp}
                    className="w-full mt-5 bg-[#1B4D3E] hover:bg-[#153a2f] text-white text-xs font-bold py-3 rounded-2xl transition-all shadow-lg shadow-[#1B4D3E]/20 flex items-center justify-center gap-2"
                  >
                    <Download size={14} />
                    Yuklab olish
                  </button>
                </div>
              </motion.div>
            )}

            <button
              onClick={() => signOut()}
              className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all ${!isSidebarOpen && 'justify-center'}`}
              title="Chiqish"
            >
              <LogOut size={24} />
              {isSidebarOpen && <span className="font-bold text-sm">Chiqish</span>}
            </button>
          </div>
        </motion.aside>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative h-full dark:bg-[#0F172A]">
        {/* Top Navbar */}
        {activeTab !== 'test' && (
          <header className="h-20 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-4 md:px-8 shrink-0 safe-area-top">
            <div className="flex items-center gap-2 md:gap-4">
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-400 dark:text-slate-500 transition-colors hidden lg:block"
              >
                <Menu size={24} />
              </button>
              <div className="bg-slate-50 dark:bg-slate-800 px-3 md:px-4 py-2 rounded-xl flex items-center gap-2 md:gap-3 w-40 md:w-96">
                <Search size={18} className="text-slate-400 dark:text-slate-500 shrink-0" />
                <input 
                  type="text" 
                  placeholder="Qidirish..." 
                  className="bg-transparent border-none focus:ring-0 text-sm w-full outline-none text-slate-900 dark:text-white"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <button className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-400 dark:text-slate-500 relative hidden sm:block">
                <Bell size={22} />
                <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900" />
              </button>
              <div className={`flex items-center gap-2 md:gap-3 p-1.5 md:p-2 rounded-xl bg-slate-50 dark:bg-slate-800`}>
                <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                  <User size={16} />
                </div>
                <div className="hidden sm:block min-w-0">
                  <p className="text-[10px] md:text-xs font-bold text-slate-900 dark:text-white truncate">{user.email?.split('@')[0]}</p>
                </div>
              </div>
            </div>
          </header>
        )}

        {/* Content Area */}
        <div className={`flex-1 bg-slate-50/50 dark:bg-[#0F172A] scrolling-touch ${activeTab !== 'test' ? 'overflow-y-auto pb-24 lg:pb-0' : 'h-full overflow-hidden'}`}>
          <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className={activeTab === 'test' ? 'h-full flex flex-col' : 'min-h-full'}
              >
              {activeTab === 'dashboard' && internalUserId && (
                <Dashboard 
                  userId={internalUserId} 
                  onStartTest={() => {
                    setSelectedTopic(null);
                    setActiveTab('test');
                  }} 
                  installPrompt={deferredPrompt}
                  onInstall={handleInstallApp}
                />
              )}
              {activeTab === 'admin' && userRole === 'admin' && (
                <AdminPanel />
              )}
              {activeTab === 'topics' && internalUserId && (
                <Topics userId={internalUserId} onStartTopicTest={(topic) => {
                  setSelectedTopic(topic);
                  setActiveTab('test');
                }} />
              )}
              {activeTab === 'weak-practice' && internalUserId && (
                <WeakPractice userId={internalUserId} onStartPractice={(topic) => {
                  setSelectedTopic(topic || null);
                  setActiveTab('test');
                }} />
              )}
              {activeTab === 'test' && internalUserId && (
                <TestSession 
                  userId={internalUserId} 
                  topic={selectedTopic}
                  onComplete={() => {
                    if (selectedTopic) {
                      setActiveTab('topics');
                    } else {
                      setActiveTab('dashboard');
                    }
                    setSelectedTopic(null);
                  }} 
                />
              )}
              {activeTab === 'glossary' && internalUserId && (
                <Glossary userId={internalUserId} />
              )}
              {(activeTab === 'profile' || activeTab === 'settings') && internalUserId && (
                <ProfileSettings 
                  userId={internalUserId} 
                  userEmail={user.email || ''} 
                  onSignOut={signOut}
                  installPrompt={deferredPrompt}
                  onInstall={handleInstallApp}
                />
              )}
              {['help'].includes(activeTab) && (
                <div className="p-8 flex items-center justify-center h-full">
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-white rounded-[32px] shadow-sm border border-slate-100 flex items-center justify-center mx-auto text-[#1B4D3E]">
                      {activeTab === 'topics' && <GraduationCap size={40} />}
                      {activeTab === 'weak-practice' && <Target size={40} />}
                      {activeTab === 'profile' && <User size={40} />}
                      {activeTab === 'settings' && <Settings size={40} />}
                      {activeTab === 'help' && <HelpCircle size={40} />}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 capitalize">{activeTab.replace('-', ' ')}</h3>
                      <p className="text-slate-500">Tez kunda ushbu sahifa tayyor bo'ladi.</p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      <AIChat userId={internalUserId} />
      {internalUserId && activeTab === 'test' && (
        <SelectionTooltip 
          userId={internalUserId} 
          containerId="question-stem-container"
        />
      )}
      {activeTab !== 'test' && (
        <MobileNav 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
          userRole={userRole} 
        />
      )}
    </div>
  );
}



