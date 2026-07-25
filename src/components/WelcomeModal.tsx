import React from 'react';
import { Bookmark, ArrowRight, X } from 'lucide-react';

interface LastReadPosition {
  surahId: number;
  surahName: string;
  verseNumber: number;
  pageNumber: number;
  updatedAt: string;
}

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  lastReadPosition: LastReadPosition | null;
  onResumeReading: (surahId: number, pageNumber?: number) => void;
  onNavigateTab: (tab: 'quran' | 'sohbet' | 'notes') => void;
  notesCount: number;
  dontShowAgain: boolean;
  setDontShowAgain: (val: boolean) => void;
  onStartTour?: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({
  isOpen,
  onClose,
  lastReadPosition,
  onResumeReading,
  dontShowAgain,
  setDontShowAgain,
  onStartTour,
}) => {
  if (!isOpen) return null;

  const currentHour = new Date().getHours();
  let greeting = 'Hoş Geldiniz';
  if (currentHour >= 5 && currentHour < 12) greeting = 'Hayırlı Sabahlar';
  else if (currentHour >= 12 && currentHour < 18) greeting = 'Hayırlı Günler';
  else if (currentHour >= 18 && currentHour < 23) greeting = 'Hayırlı Akşamlar';
  else greeting = 'Hayırlı Geceler';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-fade-in">
      <div className="bg-white/95 dark:bg-stone-900/95 text-stone-900 dark:text-stone-100 border border-white/60 dark:border-stone-800 shadow-2xl rounded-[32px] max-w-md w-full p-6 space-y-6 relative overflow-hidden backdrop-blur-2xl">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-500 dark:text-stone-300 hover:text-stone-800 dark:hover:text-stone-100 flex items-center justify-center transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Minimal Greeting */}
        <div className="text-center pt-2 space-y-1">
          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 tracking-wider uppercase">
            Kur'an & Ders Asistanı
          </p>
          <h2 className="text-2xl font-extrabold tracking-tight text-stone-900 dark:text-stone-100">
            {greeting}
          </h2>
        </div>

        {/* Hero Card: Kaldığın Yerden Devam Et */}
        {lastReadPosition ? (
          <div className="bg-emerald-50/90 dark:bg-stone-800/90 border border-emerald-200/90 dark:border-stone-700 text-stone-900 dark:text-stone-100 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300 font-medium">
              <span className="flex items-center gap-1.5 font-bold">
                <Bookmark className="w-4 h-4 text-emerald-600 dark:text-emerald-400 fill-emerald-600 dark:fill-emerald-400" />
                <span>Kaldığın Yer</span>
              </span>
              <span className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 font-mono">
                {lastReadPosition.updatedAt}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-stone-900 dark:text-stone-100">
                  {lastReadPosition.surahName}
                </h3>
                <p className="text-xs text-stone-600 dark:text-stone-300 font-medium pt-0.5">
                  {lastReadPosition.verseNumber}. Ayet • Sayfa {lastReadPosition.pageNumber}
                </p>
              </div>

              <button
                onClick={() => {
                  onResumeReading(lastReadPosition.surahId, lastReadPosition.pageNumber);
                  onClose();
                }}
                className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
              >
                <span>Devam Et</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-stone-900 dark:text-stone-100">Okumaya Başla</p>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">Mülk Sûresi 562. Sayfa</p>
            </div>
            <button
              onClick={() => {
                onResumeReading(67, 562);
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
            >
              Başla
            </button>
          </div>
        )}

        {/* Tour Launcher Button */}
        {onStartTour && (
          <button
            onClick={() => {
              onClose();
              onStartTour();
            }}
            className="w-full py-2.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs flex items-center justify-between shadow-xs active:scale-95 transition-all cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <span>🧭</span>
              <span>Uygulama Rehberini Başlat</span>
            </span>
            <span className="text-[10px] bg-amber-950 text-white px-2 py-0.5 rounded-full font-bold">
              Interaktif Tur ➔
            </span>
          </button>
        )}

        {/* Minimal Daily Reflection */}
        <div className="text-center px-2 py-1">
          <p className="font-serif text-stone-800 dark:text-stone-100 text-sm dir-rtl font-semibold">
            أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ
          </p>
          <p className="text-xs text-stone-500 dark:text-stone-400 italic mt-1">
            "Bilesiniz ki, kalpler ancak Allah'ı anmakla huzur bulur."
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-stone-200 dark:border-stone-800 text-xs">
          <label className="flex items-center gap-2 cursor-pointer select-none text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
            />
            <span className="text-[11px]">Tekrar gösterme</span>
          </label>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-bold text-xs transition-colors cursor-pointer"
          >
            Kapat
          </button>
        </div>

      </div>
    </div>
  );
};
