import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Play, Pause, RotateCcw, Coffee, CheckCircle2, Bell, Timer as TimerIcon } from 'lucide-react';

export default function Timer() {
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [mode, setMode] = useState<'stopwatch' | 'countdown'>('stopwatch');
  const [countdownMinutes, setCountdownMinutes] = useState(25);
  const [showNotification, setShowNotification] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setSeconds(prev => {
          if (mode === 'countdown') {
            if (prev <= 0) {
              setIsActive(false);
              triggerNotification("Vaqt tugadi! Dam olish vaqti.");
              return 0;
            }
            return prev - 1;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, mode]);

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(Math.abs(totalSeconds) / 3600);
    const mins = Math.floor((Math.abs(totalSeconds) % 3600) / 60);
    const secs = Math.abs(totalSeconds) % 60;
    return `${hrs > 0 ? hrs.toString().padStart(2, '0') + ':' : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggle = () => {
    if (!isActive && mode === 'countdown' && seconds === 0) {
      setSeconds(countdownMinutes * 60);
    }
    setIsActive(!isActive);
    if (isBreak) setIsBreak(false);
  };

  const handleReset = () => {
    setIsActive(false);
    setIsBreak(false);
    setSeconds(mode === 'countdown' ? countdownMinutes * 60 : 0);
  };

  const handleBreak = () => {
    setIsActive(false);
    setIsBreak(true);
    triggerNotification("Tanaffus vaqti! Biroz dam oling.");
  };

  const handleFinish = () => {
    setIsActive(false);
    triggerNotification("Mashg'ulot yakunlandi! Yaxshi natija.");
  };

  const triggerNotification = (message: string) => {
    setShowNotification(message);
    // Play a subtle sound if possible (optional, but good for UX)
    // new Audio('/notification.mp3').play().catch(() => {}); 
    setTimeout(() => setShowNotification(null), 5000);
  };

  const toggleMode = () => {
    setIsActive(false);
    const newMode = mode === 'stopwatch' ? 'countdown' : 'stopwatch';
    setMode(newMode);
    setSeconds(newMode === 'countdown' ? countdownMinutes * 60 : 0);
  };

  return (
    <div className="bg-[#1B4D3E] p-8 rounded-[40px] text-white relative overflow-hidden shadow-lg shadow-[#1B4D3E]/20">
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              {mode === 'stopwatch' ? <Clock size={20} className={isActive ? 'animate-pulse' : ''} /> : <TimerIcon size={20} className={isActive ? 'animate-pulse' : ''} />}
            </div>
            <div>
              <h3 className="text-xl font-bold">{mode === 'stopwatch' ? "Vaqt o'lchagich" : "Taymer"}</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Fokus rejimi</p>
            </div>
          </div>
          <button 
            onClick={toggleMode}
            className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-colors"
            title="Rejimni almashtirish"
          >
            <RotateCcw size={16} />
          </button>
        </div>

        <div className="text-6xl font-mono font-bold mb-8 tracking-tighter text-center tabular-nums">
          {formatTime(seconds)}
        </div>

        {mode === 'countdown' && !isActive && seconds === countdownMinutes * 60 && (
          <div className="flex items-center justify-center gap-4 mb-6">
            {[15, 25, 45, 60].map(m => (
              <button 
                key={m}
                onClick={() => {
                  setCountdownMinutes(m);
                  setSeconds(m * 60);
                }}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${countdownMinutes === m ? 'bg-white text-[#1B4D3E]' : 'bg-white/10 text-white hover:bg-white/20'}`}
              >
                {m}m
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={handleToggle}
            className={`flex items-center justify-center gap-2 font-bold py-4 rounded-2xl transition-all text-xs uppercase tracking-widest ${
              isActive 
                ? 'bg-amber-500 hover:bg-amber-600 text-white' 
                : 'bg-white text-[#1B4D3E] hover:bg-slate-100'
            }`}
          >
            {isActive ? <Pause size={16} /> : <Play size={16} />}
            {isActive ? "To'xtatish" : "Boshlash"}
          </button>
          
          <button 
            onClick={handleFinish}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-2xl transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2"
          >
            <CheckCircle2 size={16} />
            Yakunlash
          </button>

          <button 
            onClick={handleBreak}
            className="bg-white/10 hover:bg-white/20 text-white font-bold py-4 rounded-2xl transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2"
          >
            <Coffee size={16} />
            Tanaffus
          </button>

          <button 
            onClick={handleReset}
            className="bg-white/10 hover:bg-white/20 text-white font-bold py-4 rounded-2xl transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2"
          >
            <RotateCcw size={16} />
            Reset
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="absolute bottom-4 left-4 right-4 bg-white text-slate-900 p-4 rounded-2xl shadow-2xl flex items-center gap-3 z-50 border border-slate-100"
          >
            <div className="w-8 h-8 bg-[#1B4D3E] rounded-lg flex items-center justify-center text-white">
              <Bell size={16} />
            </div>
            <p className="text-xs font-bold">{showNotification}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
    </div>
  );
}
