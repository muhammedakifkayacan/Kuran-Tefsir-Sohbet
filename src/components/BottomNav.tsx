import React from 'react';
import { motion } from 'motion/react';
import { Home, BookOpen, Radio, StickyNote, Minimize2 } from 'lucide-react';
import { NavTab } from '../types';

interface BottomNavProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  unresolvedNotesCount?: number;
  isFullScreen?: boolean;
  setIsFullScreen?: (val: boolean) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  unresolvedNotesCount = 0,
  isFullScreen,
  setIsFullScreen,
}) => {
  const tabs: { id: NavTab; label: string; icon: React.FC<{ className?: string }>; badge?: number }[] = [
    { id: 'home', label: 'Ana Sayfa', icon: Home },
    { id: 'quran', label: 'Kur\'an Oku', icon: BookOpen },
    { id: 'sohbet', label: 'Ders & Sohbet', icon: Radio },
    { id: 'notes', label: 'Notlarım', icon: StickyNote, badge: unresolvedNotesCount },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-stone-900/95 backdrop-blur-2xl border-t border-stone-200/80 dark:border-stone-800 px-2 py-1.5 sm:py-2 shadow-2xl pb-safe">
      <div className="flex items-center justify-around max-w-lg mx-auto gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <motion.button
              key={tab.id}
              id={`tour-tab-${tab.id}`}
              onClick={() => {
                if (isFullScreen && setIsFullScreen) {
                  setIsFullScreen(false);
                }
                setActiveTab(tab.id);
              }}
              whileTap={{ scale: 0.92 }}
              whileHover={{ scale: 1.04 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className={`relative flex flex-col items-center justify-center py-1.5 px-2.5 sm:px-4 rounded-2xl cursor-pointer ${
                isActive
                  ? 'text-emerald-950 dark:text-amber-300 font-bold'
                  : 'text-stone-500 dark:text-stone-400 hover:text-emerald-800 dark:hover:text-amber-200 font-medium'
              }`}
            >
              {/* Active Apple Pill Indicator */}
              {isActive && (
                <motion.span
                  layoutId="activeBottomTabPill"
                  transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                  className="absolute inset-0 bg-emerald-50 dark:bg-stone-800/90 rounded-2xl border border-emerald-200/90 dark:border-stone-700 shadow-2xs -z-10"
                />
              )}

              <div className="relative">
                <motion.div
                  animate={{ scale: isActive ? 1.15 : 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-800 dark:text-amber-400' : 'text-stone-500 dark:text-stone-400'}`} />
                </motion.div>

                {/* Badge if exists */}
                {Boolean(tab.badge && tab.badge > 0) && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    className="absolute -top-1.5 -right-2 bg-emerald-700 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-[16px] text-center shadow-xs"
                  >
                    {tab.badge}
                  </motion.span>
                )}
              </div>

              <span className="text-[10px] sm:text-[11px] mt-1 tracking-tight leading-none whitespace-nowrap">{tab.label}</span>
            </motion.button>
          );
        })}

        {/* Exit Fullscreen Button in BottomNav when in Fullscreen */}
        {isFullScreen && setIsFullScreen && (
          <motion.button
            onClick={() => setIsFullScreen(false)}
            whileTap={{ scale: 0.92 }}
            whileHover={{ scale: 1.04 }}
            className="flex flex-col items-center justify-center py-1.5 px-2.5 rounded-2xl cursor-pointer text-amber-800 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-700 font-bold shrink-0"
            title="Tam Ekrandan Çık"
          >
            <Minimize2 className="w-5 h-5 text-amber-700 dark:text-amber-400" />
            <span className="text-[10px] mt-1 tracking-tight leading-none whitespace-nowrap">Tam Ekran</span>
          </motion.button>
        )}
      </div>
    </nav>
  );
};

