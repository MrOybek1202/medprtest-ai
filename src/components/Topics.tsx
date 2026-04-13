import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { GraduationCap, ArrowRight, Search, BookOpen, Clock, Target } from 'lucide-react';
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
            className="bg-white dark:bg-slate-900 p-10 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-[#1B4D3E]/5 transition-all group cursor-pointer flex flex-col"
            onClick={() => onStartTopicTest(topic)}
          >
            <div className="flex justify-between items-start mb-6">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:bg-[#1B4D3E]/10 group-hover:text-[#1B4D3E] transition-colors">
                <GraduationCap size={28} />
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-full text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Mavzu
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 group-hover:text-[#1B4D3E] transition-colors line-clamp-2 min-h-[3.5rem]">
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
                  className="h-full bg-[#1B4D3E]"
                />
              </div>
            </div>

            <button className="mt-auto w-full bg-slate-50 dark:bg-slate-800 group-hover:bg-[#1B4D3E] text-slate-400 dark:text-slate-500 group-hover:text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 text-sm">
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
