import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  BookOpen, 
  Plus, 
  Trash2, 
  Edit, 
  Search, 
  LayoutDashboard, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  TrendingUp,
  Database,
  BarChart3,
  Tags,
  Shield,
  Download,
  ChevronRight,
  RefreshCcw
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line
} from 'recharts';
import { supabase } from '@/src/lib/supabase';
import { Question } from '@/src/types';
import { questionService } from '@/src/services/api';
import { toast } from 'sonner';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<'questions' | 'users' | 'analytics' | 'topics'>('questions');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopicFilter, setSelectedTopicFilter] = useState<string>('all');
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, type: 'question' | 'topic' } | null>(null);
  const [newQuestion, setNewQuestion] = useState<Partial<Question>>({
    topic: '',
    difficulty_level: 1,
    stem: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_option: 'A',
    explanation_body: '',
    key_points: []
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: qData, error: qError } = await supabase
        .from('questions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (qError) throw qError;
      setQuestions(qData || []);

      const { data: uData, error: uError } = await supabase
        .from('users')
        .select('*, stats(*)')
        .order('role', { ascending: true }) // Admin first
        .order('created_at', { ascending: false });
      
      if (uError) throw uError;
      setUsers(uData || []);

      // Extract unique topics
      if (qData) {
        const uniqueTopics = Array.from(new Set(qData.map(q => q.topic))).filter(Boolean);
        setTopics(uniqueTopics);
      }
    } catch (error: any) {
      console.error('Error fetching admin data:', error);
      toast.error('Ma\'lumotlarni yuklashda xatolik: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const questionToSave = editingQuestion ? { ...editingQuestion } : { ...newQuestion };
      
      // Ensure key_points is an array if it's a string
      let keyPointsArray = questionToSave.key_points;
      if (typeof keyPointsArray === 'string') {
        keyPointsArray = (keyPointsArray as string).split(',').map((s: string) => s.trim()).filter(Boolean);
      }

      // Clean payload: remove id and created_at if they exist
      const { id, created_at, ...payload } = questionToSave as any;
      const finalPayload = {
        ...payload,
        key_points: keyPointsArray
      };

      if (editingQuestion) {
        await questionService.updateQuestion(editingQuestion.id, finalPayload);
      } else {
        await questionService.createQuestion(finalPayload);
      }
      
      setIsAddingQuestion(false);
      setEditingQuestion(null);
      setNewQuestion({
        topic: '',
        difficulty_level: 1,
        stem: '',
        option_a: '',
        option_b: '',
        option_c: '',
        option_d: '',
        correct_option: 'A',
        explanation_body: '',
        key_points: []
      });
      fetchData();
      toast.success(editingQuestion ? 'Savol yangilandi' : 'Yangi savol qo\'shildi');
    } catch (error: any) {
      console.error('Error saving question:', error);
      toast.error('Xatolik yuz berdi: ' + (error.message || 'Saqlashda xatolik'));
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);
      if (error) throw error;
      fetchData();
      toast.success('Foydalanuvchi roli yangilandi');
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast.error('Rolni yangilashda xatolik: ' + (error.message || 'Noma\'lum xatolik'));
    }
  };

  const exportData = () => {
    const dataStr = JSON.stringify(questions, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'medtest_questions.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Analytics Data
  const topicStats = topics.map(topic => ({
    name: topic,
    count: questions.filter(q => q.topic === topic).length
  })).sort((a, b) => b.count - a.count);

  const accuracyData = [
    { range: '0-20%', count: users.filter(u => (u.stats?.[0]?.overall_accuracy || 0) <= 20).length },
    { range: '21-40%', count: users.filter(u => (u.stats?.[0]?.overall_accuracy || 0) > 20 && (u.stats?.[0]?.overall_accuracy || 0) <= 40).length },
    { range: '41-60%', count: users.filter(u => (u.stats?.[0]?.overall_accuracy || 0) > 40 && (u.stats?.[0]?.overall_accuracy || 0) <= 60).length },
    { range: '61-80%', count: users.filter(u => (u.stats?.[0]?.overall_accuracy || 0) > 60 && (u.stats?.[0]?.overall_accuracy || 0) <= 80).length },
    { range: '81-100%', count: users.filter(u => (u.stats?.[0]?.overall_accuracy || 0) > 80).length },
  ];

  const COLORS = ['#1B4D3E', '#2D5A4C', '#3F675A', '#517468', '#638176', '#758E84'];

  const handleDeleteQuestion = async (id: string) => {
    try {
      await questionService.deleteQuestion(id);
      fetchData();
      toast.success('Savol o\'chirildi');
      setDeleteConfirm(null);
    } catch (error: any) {
      console.error('Error deleting question:', error);
      toast.error('O\'chirishda xatolik: ' + (error.message || 'Noma\'lum xatolik'));
    }
  };

  const handleDeleteTopic = async (topic: string) => {
    try {
      // Delete all questions for this topic
      const topicQuestions = questions.filter(q => q.topic === topic);
      for (const q of topicQuestions) {
        await questionService.deleteQuestion(q.id);
      }
      fetchData();
      toast.success(`"${topic}" mavzusi va unga tegishli barcha savollar o'chirildi`);
      setDeleteConfirm(null);
    } catch (error: any) {
      console.error('Error deleting topic:', error);
      toast.error('Mavzuni o\'chirishda xatolik');
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-slate-50 dark:bg-[#0F172A]">
      {/* Admin Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 py-4 flex flex-col sm:flex-row justify-between items-center sticky top-0 z-10 gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-10 h-10 bg-slate-900 dark:bg-slate-800 rounded-xl flex items-center justify-center text-white shrink-0">
            <Database size={20} />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">Admin Paneli</h1>
            <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 font-medium">MedTest AI Boshqaruvi</p>
          </div>
        </div>

        <nav className="flex items-center gap-1 md:gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
          <button 
            onClick={() => setActiveTab('questions')}
            className={`px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'questions' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
          >
            <BookOpen size={16} />
            Savollar
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'users' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
          >
            <Users size={16} />
            Foydalanuvchilar
          </button>
          <button 
            onClick={() => setActiveTab('analytics')}
            className={`px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'analytics' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
          >
            <BarChart3 size={16} />
            Analitika
          </button>
          <button 
            onClick={() => setActiveTab('topics')}
            className={`px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'topics' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
          >
            <Tags size={16} />
            Mavzular
          </button>
        </nav>

        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          {activeTab === 'questions' && (
            <select 
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700 outline-none text-slate-900 dark:text-white w-full sm:w-40"
              value={selectedTopicFilter}
              onChange={(e) => setSelectedTopicFilter(e.target.value)}
            >
              <option value="all">Barcha mavzular</option>
              {topics.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          )}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
            <input 
              type="text" 
              placeholder="Qidirish..." 
              className="pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700 w-full text-slate-900 dark:text-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </header>

      <main className="flex-1 p-3 md:p-6 pb-32 lg:pb-8">
        {activeTab === 'questions' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">Savollar Bazasi</h2>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button 
                  onClick={fetchData}
                  className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                  title="Yangilash"
                >
                  <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
                </button>
                <button 
                  onClick={exportData}
                  className="flex-1 sm:flex-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 px-4 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  <Download size={18} />
                  Eksport
                </button>
                <button 
                  onClick={() => {
                    setEditingQuestion(null);
                    setIsAddingQuestion(true);
                  }}
                  className="flex-1 sm:flex-none bg-slate-900 dark:bg-slate-800 text-white px-6 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-800 dark:hover:bg-slate-700 transition-all shadow-lg shadow-slate-900/10"
                >
                  <Plus size={18} />
                  Yangi savol
                </button>
              </div>
            </div>

            {(isAddingQuestion || editingQuestion) && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-900 p-4 md:p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-xl"
              >
                <form onSubmit={handleAddQuestion} className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="col-span-2 md:col-span-1 space-y-2">
                    <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Mavzu</label>
                      <input 
                        required
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700 outline-none text-slate-900 dark:text-white"
                        value={(editingQuestion ? editingQuestion.topic : newQuestion.topic) || ''}
                        onChange={e => editingQuestion ? setEditingQuestion({...editingQuestion, topic: e.target.value}) : setNewQuestion({...newQuestion, topic: e.target.value})}
                      />
                  </div>
                  <div className="col-span-2 md:col-span-1 space-y-2">
                    <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Qiyinchilik (1-3)</label>
                    <input 
                      type="number" min="1" max="3" required
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700 outline-none text-slate-900 dark:text-white"
                      value={(editingQuestion ? editingQuestion.difficulty_level : newQuestion.difficulty_level) || 1}
                      onChange={e => editingQuestion ? setEditingQuestion({...editingQuestion, difficulty_level: parseInt(e.target.value)}) : setNewQuestion({...newQuestion, difficulty_level: parseInt(e.target.value)})}
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Savol matni</label>
                    <textarea 
                      required rows={3}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700 outline-none text-slate-900 dark:text-white"
                      value={(editingQuestion ? editingQuestion.stem : newQuestion.stem) || ''}
                      onChange={e => editingQuestion ? setEditingQuestion({...editingQuestion, stem: e.target.value}) : setNewQuestion({...newQuestion, stem: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Variant A</label>
                    <input required className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white" value={(editingQuestion ? editingQuestion.option_a : newQuestion.option_a) || ''} onChange={e => editingQuestion ? setEditingQuestion({...editingQuestion, option_a: e.target.value}) : setNewQuestion({...newQuestion, option_a: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Variant B</label>
                    <input required className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white" value={(editingQuestion ? editingQuestion.option_b : newQuestion.option_b) || ''} onChange={e => editingQuestion ? setEditingQuestion({...editingQuestion, option_b: e.target.value}) : setNewQuestion({...newQuestion, option_b: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Variant C</label>
                    <input required className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white" value={(editingQuestion ? editingQuestion.option_c : newQuestion.option_c) || ''} onChange={e => editingQuestion ? setEditingQuestion({...editingQuestion, option_c: e.target.value}) : setNewQuestion({...newQuestion, option_c: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Variant D</label>
                    <input required className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white" value={(editingQuestion ? editingQuestion.option_d : newQuestion.option_d) || ''} onChange={e => editingQuestion ? setEditingQuestion({...editingQuestion, option_d: e.target.value}) : setNewQuestion({...newQuestion, option_d: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">To'g'ri javob</label>
                    <select 
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                      value={(editingQuestion ? editingQuestion.correct_option : newQuestion.correct_option) || 'A'}
                      onChange={e => editingQuestion ? setEditingQuestion({...editingQuestion, correct_option: e.target.value}) : setNewQuestion({...newQuestion, correct_option: e.target.value})}
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                    </select>
                  </div>
                  <div className="col-span-2 space-y-2">
                    <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Tushuntirish (Explanation)</label>
                    <textarea 
                      rows={3}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700 outline-none text-slate-900 dark:text-white"
                      value={(editingQuestion ? editingQuestion.explanation_body : newQuestion.explanation_body) || ''}
                      onChange={e => editingQuestion ? setEditingQuestion({...editingQuestion, explanation_body: e.target.value}) : setNewQuestion({...newQuestion, explanation_body: e.target.value})}
                      placeholder="Savolning to'g'ri javobi haqida qisqacha tushuntirish..."
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Asosiy nuqtalar (Key Points - vergul bilan ajrating)</label>
                    <input 
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700 outline-none text-slate-900 dark:text-white"
                      value={editingQuestion ? (Array.isArray(editingQuestion.key_points) ? editingQuestion.key_points.join(', ') : (editingQuestion.key_points || '')) : (Array.isArray(newQuestion.key_points) ? newQuestion.key_points?.join(', ') : (newQuestion.key_points || ''))}
                      onChange={e => editingQuestion ? setEditingQuestion({...editingQuestion, key_points: e.target.value as any}) : setNewQuestion({...newQuestion, key_points: e.target.value as any})}
                      placeholder="Nuqta 1, Nuqta 2, Nuqta 3..."
                    />
                  </div>
                  <div className="col-span-2 flex justify-end gap-3 pt-4">
                    <button type="button" onClick={() => { setIsAddingQuestion(false); setEditingQuestion(null); }} className="px-6 py-3 rounded-xl font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">Bekor qilish</button>
                    <button type="submit" className="bg-slate-900 dark:bg-slate-800 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-slate-700 transition-all">Saqlash</button>
                  </div>
                </form>
              </motion.div>
            )}

            <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Mavzu</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Savol</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Javob</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {questions
                      .filter(q => {
                        const matchesSearch = q.stem.toLowerCase().includes(searchQuery.toLowerCase()) || q.topic.toLowerCase().includes(searchQuery.toLowerCase());
                        const matchesTopic = selectedTopicFilter === 'all' || q.topic === selectedTopicFilter;
                        return matchesSearch && matchesTopic;
                      })
                      .map(q => (
                      <tr key={q.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">{q.topic}</span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-slate-900 dark:text-white font-medium line-clamp-2 max-w-md">{q.stem}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="w-6 h-6 bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 rounded-full flex items-center justify-center text-xs font-bold">{q.correct_option}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => setEditingQuestion(q)}
                              className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                            >
                              <Edit size={16} />
                            </button>
                            <button 
                              onClick={() => setDeleteConfirm({ id: q.id, type: 'question' })} 
                              className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Foydalanuvchilar</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div className="bg-white dark:bg-slate-900 p-10 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm">
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Jami foydalanuvchilar</p>
                <p className="text-4xl font-bold text-slate-900 dark:text-white">{users.length}</p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-10 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm">
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">O'rtacha aniqlik</p>
                <p className="text-4xl font-bold text-slate-900 dark:text-white">
                  {Math.round(users.reduce((acc, u) => acc + (u.stats?.[0]?.overall_accuracy || 0), 0) / (users.length || 1))}%
                </p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-10 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm sm:col-span-2 md:col-span-1">
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Faol o'quvchilar</p>
                <p className="text-4xl font-bold text-slate-900 dark:text-white">{users.filter(u => u.stats?.[0]?.study_streak > 0).length}</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Foydalanuvchi</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Email</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Rol</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Aniqlik</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-400">
                              {u.full_name?.charAt(0) || u.email.charAt(0)}
                            </div>
                            <span className="text-sm font-bold text-slate-900 dark:text-white">{u.full_name || 'Ismsiz'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{u.email}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${u.role === 'admin' ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400' : 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400'}`}>
                            {u.role === 'admin' ? 'Admin' : 'Foydalanuvchi'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full bg-slate-900 dark:bg-slate-400" style={{ width: `${u.stats?.[0]?.overall_accuracy || 0}%` }} />
                            </div>
                            <span className="text-xs font-bold text-slate-900 dark:text-white">{u.stats?.[0]?.overall_accuracy || 0}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => handleUpdateRole(u.id, u.role === 'admin' ? 'user' : 'admin')}
                            className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                            title={u.role === 'admin' ? 'Userga tushirish' : 'Adminga ko\'tarish'}
                          >
                            <Shield size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Tizim Analitikasi</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Topics Distribution */}
              <div className="bg-white dark:bg-slate-900 p-8 md:p-10 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Mavzular bo'yicha savollar</h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={topicStats}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="count"
                      >
                        {topicStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {topicStats.slice(0, 6).map((topic, index) => (
                    <div key={topic.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="text-xs text-slate-600 dark:text-slate-400 truncate">{topic.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Accuracy Distribution */}
              <div className="bg-white dark:bg-slate-900 p-8 md:p-10 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Foydalanuvchilar aniqligi</h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={accuracyData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800" />
                      <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                      <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }} />
                      <Bar dataKey="count" fill="#1B4D3E" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Recent Activity or other stats */}
            <div className="bg-white dark:bg-slate-900 p-8 md:p-10 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Eng faol mavzular</h3>
              <div className="space-y-4">
                {topicStats.slice(0, 5).map((topic, index) => (
                  <div key={topic.name} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center font-bold text-slate-900 dark:text-white shadow-sm">
                        {index + 1}
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white">{topic.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{topic.count} savol</span>
                      <ChevronRight size={16} className="text-slate-400 dark:text-slate-500" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'topics' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Mavzular Boshqaruvi</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {topics.map(topic => (
                <div key={topic} className="bg-white dark:bg-slate-900 p-10 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-400">
                      <Tags size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{topic}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{questions.filter(q => q.topic === topic).length} savol</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setDeleteConfirm({ id: topic, type: 'topic' })}
                    className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <button 
                onClick={() => {
                  setNewQuestion({ ...newQuestion, topic: '' });
                  setIsAddingQuestion(true);
                  setActiveTab('questions');
                }}
                className="border-2 border-dashed border-slate-200 dark:border-slate-800 p-6 rounded-[32px] flex items-center justify-center gap-2 text-slate-400 dark:text-slate-500 hover:border-slate-400 dark:hover:border-slate-600 hover:text-slate-600 dark:hover:text-slate-300 transition-all"
              >
                <Plus size={20} />
                <span className="font-bold">Yangi mavzu</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-[32px] p-8 max-w-sm w-full shadow-2xl border border-slate-100 dark:border-slate-800 space-y-6"
            >
              <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 mx-auto">
                <AlertCircle size={32} />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">O'chirishni tasdiqlaysizmi?</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {deleteConfirm.type === 'question' 
                    ? "Ushbu savol butunlay o'chiriladi. Bu amalni ortga qaytarib bo'lmaydi."
                    : "Ushbu mavzu va unga tegishli BARCHA savollar o'chiriladi. Bu amalni ortga qaytarib bo'lmaydi."}
                </p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-6 py-3 rounded-xl font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                >
                  Bekor qilish
                </button>
                <button 
                  onClick={() => deleteConfirm.type === 'question' ? handleDeleteQuestion(deleteConfirm.id) : handleDeleteTopic(deleteConfirm.id)}
                  className="flex-1 px-6 py-3 rounded-xl font-bold bg-red-500 text-white hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                >
                  O'chirish
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
