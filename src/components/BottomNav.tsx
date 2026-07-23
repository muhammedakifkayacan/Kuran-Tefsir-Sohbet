import React from 'react';
import { BookOpen, Radio, StickyNote } from 'lucide-react';
import { NavTab } from '../types';

interface BottomNavProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  unresolvedNotesCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  unresolvedNotesCount = 0,
}) => {
  const tabs: { id: NavTab; label: string; icon: React.FC<{ className?: string }>; badge?: number }[] = [
    { id: 'quran', label: 'Kur\'an-ı Kerim', icon: BookOpen },
    { id: 'sohbet', label: 'Sohbet & Tefsir', icon: Radio },
    { id: 'notes', label: 'Notlar & AI', icon: StickyNote, badge: unresolvedNotesCount },
  ];

  return (
    <nav className="sticky bottom-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 px-2 py-2 shadow-sm">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-3.5 rounded-2xl transition-all duration-200 active:scale-95 ${
                isActive
                  ? 'text-amber-900 font-bold'
                  : 'text-slate-500 hover:text-amber-700 font-medium'
              }`}
            >
              {/* Active Indicator Background */}
              {isActive && (
                <span className="absolute inset-0 bg-amber-50 rounded-2xl border border-amber-200/80 -z-10" />
              )}

              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110 text-amber-800' : ''}`} />

                {/* Badge if exists */}
                {Boolean(tab.badge && tab.badge > 0) && (
                  <span className="absolute -top-1.5 -right-2 bg-amber-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-[16px] text-center shadow-sm">
                    {tab.badge}
                  </span>
                )}
              </div>

              <span className="text-[11px] mt-1 tracking-tight leading-none">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
