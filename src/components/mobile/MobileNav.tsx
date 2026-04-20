import React from 'react';
import { motion } from 'motion/react';
import { LayoutDashboard, GraduationCap, Target, BookMarked, User, Database } from 'lucide-react';

interface MobileNavProps {
  activeTab: string;
  onTabChange: (tab: any) => void;
  userRole: 'user' | 'admin';
}

const MobileNav: React.FC<MobileNavProps> = ({ activeTab, onTabChange, userRole }) => {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 480;
  const tabs = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Boshqaruv' },
    { id: 'topics', icon: GraduationCap, label: 'Mavzular' },
    { id: 'weak-practice', icon: Target, label: 'Zaif' },
    { id: 'glossary', icon: BookMarked, label: 'Lug\'at' },
    { id: 'profile', icon: User, label: 'Profil' },
  ];

  if (userRole === 'admin') {
    tabs.unshift({ id: 'admin', icon: Database, label: 'Admin' });
  }

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-2 sm:px-6 py-3 pb-8 z-50 flex justify-between items-center safe-area-bottom">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="flex flex-col items-center gap-1 relative flex-1 min-w-0"
          >
            <div className={`rounded-xl p-1.5 transition-all sm:p-2 ${isActive ? 'text-[#2c5ff2]' : 'text-slate-400 dark:text-slate-500'}`}>
              <tab.icon size={isMobile ? 20 : 24} strokeWidth={isActive ? 2.5 : 2} />
            </div>
            {isActive && (
              <motion.div
                layoutId="activeTab"
                className="absolute -top-1 h-1 w-1 rounded-full bg-[#2c5ff2]"
              />
            )}
            <span className={`text-[10px] font-bold ${isActive ? 'text-[#2c5ff2]' : 'text-slate-400 dark:text-slate-500'}`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export default MobileNav;
