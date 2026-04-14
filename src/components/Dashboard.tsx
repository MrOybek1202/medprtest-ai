import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, Target, Clock, AlertCircle, ArrowRight, Plus, GraduationCap, Smartphone, Download } from 'lucide-react';
import { UserStats } from '@/src/types';
import { statsService, questionService, sessionService } from '@/src/services/api';
import Timer from './Timer';
import { toast } from 'sonner';

interface DashboardProps {
  userId: string;
  onStartTest: () => void;
  installPrompt?: any;
  onInstall?: () => void;
}

export default function Dashboard({ userId, onStartTest, installPrompt, onInstall }: DashboardProps) {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [topics, setTopics] = useState<string[]>([]);
  const [topicProgress, setTopicProgress] = useState<Record<string, { total: number; solved: number; percentage: number }>>({});
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [solvedCount, setSolvedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setError(null);
      try {
        const [statsData, topicsData, progressData, totalCount, solved] = await Promise.allSettled([
          statsService.getUserStats(userId),
          questionService.getTopics(),
          questionService.getTopicProgress(userId),
          questionService.getTotalQuestionCount(),
          sessionService.getSolvedQuestionsCount(userId)
        ]);

        let hasError = false;
        if (statsData.status === 'fulfilled') setStats(statsData.value);
        if (topicsData.status === 'fulfilled') setTopics(topicsData.value);
        else hasError = true;
        
        if (progressData.status === 'fulfilled') setTopicProgress(progressData.value);
        if (totalCount.status === 'fulfilled') setTotalQuestions(totalCount.value);
        if (solved.status === 'fulfilled') setSolvedCount(solved.value);

        if (hasError) {
          setError("Ma'lumotlar bazasiga ulanishda xatolik yuz berdi. Iltimos, jadvallar mavjudligini tekshiring.");
          toast.error("Ma'lumotlar bazasiga ulanishda xatolik yuz berdi");
        }

      } catch (error: any) {
        console.error('Failed to fetch dashboard data:', error);
        setError("Kutilmagan xatolik yuz berdi.");
        toast.error("Kutilmagan xatolik yuz berdi: " + (error.message || ''));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  if (loading) return (
    <div className="animate-pulse space-y-6 p-6">
      <div className="h-10 bg-slate-200 rounded-lg w-1/4 mb-6" />
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-slate-200 rounded-3xl" />)}
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 h-64 bg-slate-200 rounded-3xl" />
        <div className="h-64 bg-slate-200 rounded-3xl" />
      </div>
    </div>
  );

  if (error) return (
    <div className="p-8 flex items-center justify-center h-full">
      <div className="bg-white p-12 rounded-[40px] border border-red-100 shadow-xl text-center space-y-6 max-w-md">
        <div className="w-20 h-20 bg-red-50 rounded-[32px] flex items-center justify-center mx-auto text-red-500">
          <AlertCircle size={40} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900">Ulanishda xatolik</h3>
          <p className="text-slate-500 mt-2">{error}</p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="bg-slate-900 text-white font-bold px-8 py-4 rounded-2xl hover:bg-slate-800 transition-all"
        >
          Qayta urinish
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-3 md:p-5 max-w-[1600px] mx-auto space-y-4 dark:bg-[#0F172A]">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Boshqaruv paneli</h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm mt-1">O'z bilimingizni tahlil qiling va yangi marralarni zabt eting.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button 
            onClick={onStartTest}
            className="w-full md:w-auto bg-[#1B4D3E] hover:bg-[#153a2f] text-white font-bold px-6 py-3 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#1B4D3E]/20"
          >
            <Plus size={20} />
            Testni boshlash
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {installPrompt && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="lg:col-span-4 bg-gradient-to-r from-[#1B4D3E] to-[#153a2f] p-6 rounded-[32px] text-white flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl shadow-[#1B4D3E]/20 border border-white/10"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
                <Smartphone size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg">Ilovani o'rnating</h3>
                <p className="text-slate-300 text-sm">MedTest AI ni asosiy ekranga qo'shing va tezroq foydalaning.</p>
              </div>
            </div>
            <button 
              onClick={onInstall}
              className="w-full md:w-auto bg-white text-[#1B4D3E] font-bold px-8 py-3 rounded-2xl hover:bg-slate-100 transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              <Download size={18} />
              O'rnatish
            </button>
          </motion.div>
        )}

        <div className="bg-[#1B4D3E] p-8 rounded-[32px] text-white relative overflow-hidden group cursor-pointer shadow-sm">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <p className="text-slate-300 text-xs font-bold uppercase tracking-widest">Umumiy savollar</p>
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                <TrendingUp size={16} />
              </div>
            </div>
            <p className="text-4xl font-bold mb-2">{totalQuestions.toLocaleString()}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Bazadagi savollar soni</p>
          </div>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/5 rounded-full blur-2xl" />
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group cursor-pointer">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest">Yechilganlar</p>
              <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center group-hover:bg-slate-100 dark:group-hover:bg-slate-700 transition-colors text-[#1B4D3E]">
                <Target size={16} />
              </div>
            </div>
            <p className="text-4xl font-bold text-slate-900 dark:text-white mb-2">{solvedCount}</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Siz tomoningizdan</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group cursor-pointer">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest">Aniqlik</p>
              <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center group-hover:bg-slate-100 dark:group-hover:bg-slate-700 transition-colors text-blue-600">
                <TrendingUp size={16} />
              </div>
            </div>
            <p className="text-4xl font-bold text-slate-900 dark:text-white mb-2">{stats?.overall_accuracy || 0}%</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">O'rtacha ko'rsatkich</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group cursor-pointer">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest">Streak</p>
              <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center group-hover:bg-slate-100 dark:group-hover:bg-slate-700 transition-colors text-orange-500">
                <Clock size={16} />
              </div>
            </div>
            <p className="text-4xl font-bold text-slate-900 dark:text-white mb-2">{stats?.study_streak || 0}</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Kunlik davomiylik</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Analytics Section */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-900 p-10 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">O'qish tahlili</h3>
                <p className="text-slate-400 dark:text-slate-500 text-xs mt-1 font-medium">Oxirgi 7 kunlik faollik ko'rsatkichi</p>
              </div>
              <div className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                <span className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-[#1B4D3E]" /> To'g'ri</span>
                <span className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-slate-100 dark:bg-slate-800" /> Noto'g'ri</span>
              </div>
            </div>
            <div className="h-72 flex items-end justify-between gap-4 px-2">
              {[65, 82, 48, 92, 75, 58, 85].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-5">
                  <div className="w-full relative group">
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: `${h}%` }}
                      className="w-full bg-[#1B4D3E] rounded-2xl transition-all group-hover:bg-[#153a2f] shadow-sm relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                    </motion.div>
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-slate-800 text-white text-[10px] font-bold px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap shadow-xl">
                      {h}% aniqlik
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{'Du Se Ch Pa Ju Sh Ya'.split(' ')[i]}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-900 p-10 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-500">
                  <AlertCircle size={20} />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white">Zaif mavzu</h3>
              </div>
              <div className="bg-amber-50/50 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/20 p-5 rounded-[24px] mb-6 flex-1">
                <p className="text-amber-900 dark:text-amber-400 font-bold text-lg">{stats?.weak_topic || "Hozircha yo'q"}</p>
                <p className="text-amber-700/70 dark:text-amber-500/70 text-xs mt-2 leading-relaxed">
                  {stats?.recommendation || "Ushbu mavzuda ko'proq xato kuzatilmoqda. Takrorlash tavsiya etiladi."}
                </p>
              </div>
              <button className="w-full bg-slate-900 dark:bg-slate-800 text-white font-bold py-4 rounded-2xl hover:bg-slate-800 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-slate-900/10">
                Mavzuni takrorlash
                <ArrowRight size={16} />
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 p-10 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-8">O'qish jarayoni</h3>
              <div className="flex flex-col items-center justify-center">
                <div className="relative w-44 h-44 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90">
                    <circle cx="88" cy="88" r="76" fill="none" stroke="#F1F5F9" strokeWidth="14" className="dark:stroke-slate-800" />
                    <circle 
                      cx="88" cy="88" r="76" fill="none" stroke="#1B4D3E" strokeWidth="14" 
                      strokeDasharray="477.5" strokeDashoffset={477.5 * (1 - (solvedCount / (totalQuestions || 1)))}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold text-slate-900 dark:text-white">{Math.round((solvedCount / (totalQuestions || 1)) * 100)}%</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-1">Tugallandi</span>
                  </div>
                </div>
                <div className="flex gap-6 mt-8">
                  <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#1B4D3E]">
                    <div className="w-2 h-2 rounded-full bg-[#1B4D3E]" /> Bajarildi
                  </span>
                  <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-300 dark:text-slate-600">
                    <div className="w-2 h-2 rounded-full bg-slate-100 dark:bg-slate-800" /> Qoldi
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Section */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-10 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Mavzular</h3>
              <span className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                {topics.length} ta
              </span>
            </div>
            <div className="space-y-3">
              {topics.length > 0 ? topics.slice(0, 5).map((topic, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer group border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
                  <div className={`w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-[#1B4D3E]/10 group-hover:text-[#1B4D3E] transition-colors`}>
                    <GraduationCap size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate group-hover:text-[#1B4D3E] transition-colors">{topic}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex-1 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#1B4D3E] transition-all" 
                          style={{ width: `${topicProgress[topic]?.percentage || 0}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{topicProgress[topic]?.percentage || 0}%</span>
                    </div>
                  </div>
                  <ArrowRight size={14} className="text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                </div>
              )) : (
                <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                  <p className="text-sm font-medium">Mavzular topilmadi</p>
                </div>
              )}
            </div>
            {topics.length > 5 && (
              <button className="w-full mt-6 text-xs font-bold text-[#1B4D3E] hover:underline uppercase tracking-widest">
                Barcha mavzularni ko'rish
              </button>
            )}
          </div>

          <Timer />
        </div>
      </div>
    </div>
  );
}


