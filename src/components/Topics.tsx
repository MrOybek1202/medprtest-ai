import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { GraduationCap, ArrowRight, Search } from 'lucide-react';
import { questionService } from '@/src/services/api';
import { toast } from 'sonner';

interface TopicsProps {
  userId: string;
  onStartTopicTest: (topic: string) => void;
}

export default function Topics({ userId, onStartTopicTest }: TopicsProps) {
  const [topics, setTopics] = useState<string[]>([]);
  const [progress, setProgress] = useState<Record<string, { total: number; solved: number; percentage: number }>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [topicsData, progressData] = await Promise.all([
          questionService.getTopics(),
          questionService.getTopicProgress(userId)
        ]);
        setTopics(topicsData);
        setProgress(progressData);
      } catch (error: any) {
        console.error('Failed to fetch topics data:', error);
        toast.error('Mavzularni yuklashda xatolik yuz berdi: ' + (error.message || ''));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  const filteredTopics = topics.filter(t => 
    t.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="h-10 bg-slate-200 rounded-lg w-1/4" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-48 bg-slate-200 rounded-[32px]" />)}
      </div>
    </div>
  );

  return (
    <div className="p-3 md:p-6 max-w-[1600px] mx-auto space-y-4 md:space-y-6 dark:bg-[#0F172A]">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Mavzular</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm md:text-base">O'zingizga kerakli mavzuni tanlang va bilimingizni sinab ko'ring.</p>
        </div>
        <div className="bg-white dark:bg-slate-900 px-6 py-3 rounded-2xl flex items-center gap-3 w-full md:w-96 border border-slate-100 dark:border-slate-800 shadow-sm">
          <Search size={18} className="text-slate-400 dark:text-slate-500" />
          <input 
            type="text" 
            placeholder="Mavzuni qidirish..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none focus:ring-0 text-sm w-full outline-none text-slate-900 dark:text-white"
          />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTopics.length > 0 ? filteredTopics.map((topic, i) => (
          <motion.div
            key={topic}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="group flex cursor-pointer flex-col rounded-[40px] border border-[#dbe4f2] bg-white/92 p-10 shadow-[0_20px_44px_rgba(16,35,71,0.06)] transition-all hover:shadow-[0_24px_56px_rgba(44,95,242,0.12)] dark:border-slate-800 dark:bg-slate-900"
            onClick={() => onStartTopicTest(topic)}
          >
            <div className="flex justify-between items-start mb-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#edf3ff] text-[#2c5ff2] transition-colors group-hover:bg-[#dfe9ff] dark:bg-slate-800 dark:text-slate-500">
                <GraduationCap size={28} />
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-full text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Mavzu
              </div>
            </div>
            
            <h3 className="mb-4 min-h-[3.5rem] line-clamp-2 text-xl font-bold text-slate-900 transition-colors group-hover:text-[#2c5ff2] dark:text-white">
              {topic}
            </h3>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Progress</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{progress[topic]?.percentage || 0}%</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Savollar</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{progress[topic]?.solved || 0} / {progress[topic]?.total || 0}</p>
                </div>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress[topic]?.percentage || 0}%` }}
                  className="h-full bg-[#2c5ff2]"
                />
              </div>
            </div>

            <button className="mt-auto flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-50 py-4 text-sm font-bold text-slate-500 transition-all group-hover:bg-[#2c5ff2] group-hover:text-white dark:bg-slate-800 dark:text-slate-500">
              Testni boshlash
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </button>
          </motion.div>
        )) : (
          <div className="col-span-full py-20 text-center space-y-4">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-[32px] flex items-center justify-center mx-auto text-slate-300 dark:text-slate-600">
              <Search size={40} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Mavzular topilmadi</h3>
              <p className="text-slate-500 dark:text-slate-400">Qidiruvingizga mos keladigan mavzu mavjud emas.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
