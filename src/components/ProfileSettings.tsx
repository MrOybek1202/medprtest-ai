import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { User, Shield, Bell, Moon, Globe, LogOut, Camera, Save, ChevronRight, Smartphone, Download, Sun, Lock, Eye, EyeOff, RefreshCcw } from 'lucide-react';
import { supabase } from '@/src/lib/supabase';
import { toast } from 'sonner';

interface ProfileSettingsProps {
  userId: string;
  userEmail: string;
  onSignOut: () => void;
  onInstall?: () => void;
}

export default function ProfileSettings({ userId, userEmail, onSignOut, onInstall }: ProfileSettingsProps) {
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPWA, setIsPWA] = useState(false);
  const [stats, setStats] = useState({ solved: 0, accuracy: 0 });
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark') || localStorage.getItem('theme') === 'dark';
    }
    return false;
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (profile) {
        setFullName(profile.full_name || '');
        setAvatarUrl(profile.avatar_url || null);
      }

      const { data: statsData } = await supabase
        .from('stats')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (statsData) {
        const { data: solvedCount } = await supabase
          .from('question_attempts')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId);
        
        setStats({
          solved: solvedCount?.length || 0,
          accuracy: statsData.overall_accuracy || 0
        });
      }
    };

    fetchProfile();

    // Theme initialization
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Check if app is running as PWA
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsPWA(true);
    }
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          full_name: fullName,
          avatar_url: avatarUrl
        })
        .eq('id', userId);
      
      if (error) throw error;
      toast.success('Ma\'lumotlar muvaffaqiyatli saqlandi');
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast.error('Xatolik yuz berdi: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('Parol kamida 6 ta belgidan iborat bo\'lishi kerak');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Parollar mos kelmadi');
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Parol muvaffaqiyatli yangilandi');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast.error('Xatolik yuz berdi: ' + error.message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Rasm hajmi 2MB dan oshmasligi kerak');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleClearCache = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
      }
      
      const cacheNames = await caches.keys();
      for (const name of cacheNames) {
        await caches.delete(name);
      }
      
      localStorage.removeItem('medtest_ai_cache');
      
      toast.success('Kesh tozalandi. Ilova qayta yuklanmoqda...');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Error clearing cache:', error);
      toast.error('Keshni tozalashda xatolik yuz berdi');
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-8 pb-32 lg:pb-8 dark:bg-[#0F172A]">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Profil va Sozlamalar</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Shaxsiy ma'lumotlaringizni boshqaring va interfeysni o'zingizga moslang.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left: Profile Card */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[32px] md:rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm text-center">
            <div className="relative w-24 h-24 md:w-32 md:h-32 mx-auto mb-6">
              <div className="w-full h-full rounded-[32px] md:rounded-[48px] bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <User size={48} />
                )}
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 md:-bottom-2 md:-right-2 w-8 h-8 md:w-10 md:h-10 bg-[#1B4D3E] text-white rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg border-4 border-white dark:border-slate-900 hover:scale-110 transition-transform"
              >
                <Camera size={16} />
              </button>
            </div>
            <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">{fullName || 'Foydalanuvchi'}</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm mt-1">{userEmail}</p>
            <div className="mt-6 pt-6 border-t border-slate-50 dark:border-slate-800 flex justify-center gap-4">
              <div className="text-center">
                <p className="text-base md:text-lg font-bold text-slate-900 dark:text-white">{stats.solved}</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">Yechilgan</p>
              </div>
              <div className="w-px h-8 bg-slate-100 dark:bg-slate-800" />
              <div className="text-center">
                <p className="text-base md:text-lg font-bold text-slate-900 dark:text-white">{stats.accuracy}%</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">Aniqlik</p>
              </div>
            </div>
          </div>

            {isPWA ? (
              <div className="bg-blue-500 p-6 rounded-[32px] text-white space-y-4 shadow-lg shadow-blue-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                    <Shield size={20} />
                  </div>
                  <h4 className="font-bold text-sm">Ilova o'rnatilgan</h4>
                </div>
                <p className="text-xs text-slate-100 leading-relaxed">
                  Siz MedTest AI dan to'liq PWA ilovasi sifatida foydalanmoqdasiz. Barcha funksiyalar mobil qurilmangizga moslashtirilgan.
                </p>
              </div>
            ) : (
              <div className="bg-[#1B4D3E] p-6 rounded-[32px] text-white space-y-4 shadow-lg shadow-[#1B4D3E]/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                    <Smartphone size={20} />
                  </div>
                  <h4 className="font-bold text-sm">Ilovani o'rnating</h4>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  MedTest AI ni asosiy ekranga qo'shing va undan xuddi mobil ilovadek foydalaning.
                </p>
                
                <button 
                  onClick={onInstall}
                  className="w-full bg-white text-[#1B4D3E] font-bold py-4 rounded-2xl hover:bg-slate-100 transition-all flex items-center justify-center gap-3 shadow-lg mt-2"
                >
                  <Download size={20} />
                  Ilovani o'rnatish
                </button>
              </div>
            )}

          <button 
            onClick={onSignOut}
            className="w-full flex items-center justify-between p-4 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition-all font-bold text-sm"
          >
            <div className="flex items-center gap-3">
              <LogOut size={18} />
              Chiqish
            </div>
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Right: Settings Forms */}
        <div className="md:col-span-2 space-y-6">
          <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-500">
                <User size={20} />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white">Shaxsiy ma'lumotlar</h3>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">To'liq ism</label>
                <input 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl px-5 py-3.5 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-[#1B4D3E]/20 focus:border-[#1B4D3E] transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Email manzili</label>
                <input 
                  type="email" 
                  value={userEmail}
                  disabled
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl px-5 py-3.5 text-slate-400 dark:text-slate-500 font-medium cursor-not-allowed"
                />
              </div>
            </div>

            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="bg-[#1B4D3E] text-white font-bold px-8 py-4 rounded-2xl hover:bg-[#153a2f] transition-all flex items-center gap-2 shadow-lg shadow-[#1B4D3E]/20 disabled:opacity-50"
            >
              {isSaving ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save size={18} />
              )}
              O'zgarishlarni saqlash
            </button>
          </section>

          <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-500">
                <Lock size={20} />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white">Xavfsizlik</h3>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Yangi parol</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl px-5 py-3.5 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-[#1B4D3E]/20 focus:border-[#1B4D3E] transition-all pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Parolni tasdiqlang</label>
                  <div className="relative">
                    <input 
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl px-5 py-3.5 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-[#1B4D3E]/20 focus:border-[#1B4D3E] transition-all pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              <button 
                type="submit"
                disabled={isChangingPassword || !newPassword}
                className="bg-slate-900 dark:bg-slate-800 text-white font-bold px-8 py-4 rounded-2xl hover:bg-slate-800 dark:hover:bg-slate-700 transition-all flex items-center gap-2 shadow-lg disabled:opacity-50"
              >
                {isChangingPassword ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Shield size={18} />
                )}
                Parolni yangilash
              </button>
            </form>
          </section>

          <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center text-purple-500">
                <Shield size={20} />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white">Ilova sozlamalari</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 flex items-center justify-center text-slate-400">
                    <Bell size={16} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white text-sm">Bildirishnomalar</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Yangi testlar va natijalar haqida xabar berish</p>
                  </div>
                </div>
                <div className="w-12 h-6 bg-[#1B4D3E] rounded-full relative cursor-pointer">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 flex items-center justify-center text-slate-400">
                    {isDarkMode ? <Moon size={16} /> : <Sun size={16} />}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white text-sm">Tungi rejim</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Interfeysni qorong'u rangga o'tkazish</p>
                  </div>
                </div>
                <div 
                  onClick={toggleDarkMode}
                  className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${isDarkMode ? 'bg-[#1B4D3E]' : 'bg-slate-200 dark:bg-slate-700'}`}
                >
                  <motion.div 
                    animate={{ x: isDarkMode ? 24 : 4 }}
                    className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm" 
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 flex items-center justify-center text-slate-400">
                    <RefreshCcw size={16} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white text-sm">Keshni tozalash</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Muammolar bo'lsa ilovani yangilash</p>
                  </div>
                </div>
                <button 
                  onClick={handleClearCache}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs transition-all"
                >
                  Tozalash
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 flex items-center justify-center text-slate-400">
                    <Globe size={16} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white text-sm">Til</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Ilova tilini tanlash</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                  O'zbekcha
                  <ChevronRight size={16} className="text-slate-400" />
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
