import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ChevronRight, ChevronLeft, X, CheckCircle2, Navigation, Compass } from 'lucide-react';
import { NavTab } from '../types';

export interface TourStep {
  id: string;
  targetId: string;
  tab?: NavTab;
  title: string;
  badge?: string;
  description: string;
  preferredPosition?: 'bottom' | 'top' | 'left' | 'right';
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'step_welcome',
    targetId: 'tour-header-logo',
    tab: 'quran',
    title: 'Hoş Geldin! 🎉',
    badge: 'Kolay Kullanım Rehberi',
    description: 'Kur\'an & Tefsir Rehberine hoş geldin! Kur\'an-ı Kerim okumayı, dinlemeyi, ders notları almayı ve merak ettiğin ayetleri sormayı senin için çok kolaylaştırdık. Haydi birlikte keşfedelim!',
    preferredPosition: 'bottom',
  },
  {
    id: 'step_surah_select',
    targetId: 'tour-surah-selector',
    tab: 'quran',
    title: 'Sure ve Sayfa Seçimi 📖',
    badge: 'Arama & Gezinti',
    description: 'İstediğin Sûre ismini veya sayfa numarasını buraya yazarak anında açabilirsin. İster Türkçe mealini oku, ister Arapça metni takip et!',
    preferredPosition: 'bottom',
  },
  {
    id: 'step_recitation_audio',
    targetId: 'tour-audio-controls',
    tab: 'quran',
    title: 'Sesli Dinleme & Takip 🎧',
    badge: 'Güzel Tilavet',
    description: 'Ayetlerin altındaki \'Dinle\' butonuna basarak dünyaca ünlü hocaların sesinden Kur\'an dinleyebilir, okuma hızını istediğin gibi ayarlayabilirsin.',
    preferredPosition: 'top',
  },
  {
    id: 'step_sohbet_view',
    targetId: 'tour-tab-sohbet',
    tab: 'sohbet',
    title: 'Ders & Sohbet Kaydı 💬',
    badge: 'Ders Dinle',
    description: 'Ders veya sohbet esnasında ses kaydı başlatabilir, önemli notları kaydedip sesleri otomatik metne dönüştürebilirsin.',
    preferredPosition: 'top',
  },
  {
    id: 'step_ai_report',
    targetId: 'tour-ai-report',
    tab: 'sohbet',
    title: 'Yapay Zekâ Ders Asistanı 🤖',
    badge: 'Zeki Asistan',
    description: 'Anlamadığın bir konu mu oldu? Akıllı asistanımız ders kayıtlarını özetler ve sana ayetlerin anlamlarını tam senin anlayacağın sade bir dille anlatır!',
    preferredPosition: 'top',
  },
  {
    id: 'step_notes_view',
    targetId: 'tour-tab-notes',
    tab: 'notes',
    title: 'Notlarım & Ayraçlarım 📝',
    badge: 'Unutmamak İçin',
    description: 'Beğendiğin ayetlere kendi notlarını ekleyebilir, kaldığın yere ayraç koyabilirsin. İstediğin zaman notlarına tekrar göz atabilirsin.',
    preferredPosition: 'top',
  },
  {
    id: 'step_profile_sync',
    targetId: 'tour-user-profile',
    tab: 'quran',
    title: 'Profil & Kolay Ayarlar ⚙️',
    badge: 'Sana Özel',
    description: 'Buradan Google hesabınla giriş yapabilir, yazı boyutunu büyütüp küçültebilir ve gözünü yormayan gece modunu kolayca açabilirsin.',
    preferredPosition: 'bottom',
  },
];

interface InteractiveTourProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: NavTab;
  onNavigateTab: (tab: NavTab) => void;
  dontShowAgain?: boolean;
  onToggleDontShowAgain?: (val: boolean) => void;
}

interface ElementRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export const InteractiveTour: React.FC<InteractiveTourProps> = ({
  isOpen,
  onClose,
  activeTab,
  onNavigateTab,
  dontShowAgain,
  onToggleDontShowAgain,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<ElementRect | null>(null);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const retryCountRef = useRef(0);

  // Reset step to 0 whenever tour opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(0);
    }
  }, [isOpen]);

  const currentStep = TOUR_STEPS[currentStepIndex];

  // Measure element position using getBoundingClientRect
  const measureTarget = useCallback(() => {
    if (!isOpen || !currentStep) return;

    const el = document.getElementById(currentStep.targetId);
    if (!el) {
      if (retryCountRef.current < 8) {
        retryCountRef.current += 1;
        setTimeout(measureTarget, 100);
      } else {
        // Fallback center position if element not found
        setTargetRect({
          top: window.innerHeight / 2 - 50,
          left: window.innerWidth / 2 - 100,
          width: 200,
          height: 100,
        });
      }
      return;
    }

    retryCountRef.current = 0;
    
    // Smoothly scroll element into view if off-screen
    const rect = el.getBoundingClientRect();
    const isOffscreen =
      rect.top < 0 ||
      rect.left < 0 ||
      rect.bottom > window.innerHeight ||
      rect.right > window.innerWidth;

    if (isOffscreen) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    }

    // Re-calculate after potential scroll offset
    setTimeout(() => {
      const updatedRect = el.getBoundingClientRect();
      const padding = 6;
      setTargetRect({
        top: Math.max(0, updatedRect.top - padding),
        left: Math.max(0, updatedRect.left - padding),
        width: updatedRect.width + padding * 2,
        height: updatedRect.height + padding * 2,
      });
      setIsMeasuring(false);
    }, 120);
  }, [isOpen, currentStep]);

  // When step changes, handle auto tab switching and remeasuring
  useEffect(() => {
    if (!isOpen || !currentStep) return;

    setIsMeasuring(true);
    retryCountRef.current = 0;

    if (currentStep.tab && currentStep.tab !== activeTab) {
      onNavigateTab(currentStep.tab);
      // Wait for tab switch animation & DOM mounting
      const timer = setTimeout(() => {
        measureTarget();
      }, 200);
      return () => clearTimeout(timer);
    } else {
      measureTarget();
    }
  }, [currentStepIndex, isOpen, currentStep, activeTab, onNavigateTab, measureTarget]);

  // Window resize & scroll listener to keep spotlight box updated
  useEffect(() => {
    if (!isOpen) return;

    const handleUpdate = () => {
      measureTarget();
    };

    window.addEventListener('resize', handleUpdate);
    window.addEventListener('scroll', handleUpdate, true);

    return () => {
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('scroll', handleUpdate, true);
    };
  }, [isOpen, measureTarget]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        if (currentStepIndex < TOUR_STEPS.length - 1) {
          setCurrentStepIndex((prev) => prev + 1);
        } else {
          onClose();
        }
      } else if (e.key === 'ArrowLeft') {
        if (currentStepIndex > 0) {
          setCurrentStepIndex((prev) => prev - 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStepIndex, onClose]);

  if (!isOpen || !currentStep) return null;

  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === TOUR_STEPS.length - 1;

  // Calculate Popover Position relative to targetRect
  let popoverStyle: React.CSSProperties = {};
  const popoverWidth = 340;

  if (targetRect) {
    const spaceBelow = window.innerHeight - (targetRect.top + targetRect.height);
    const spaceAbove = targetRect.top;
    const preferredPos = currentStep.preferredPosition || 'bottom';

    let placeOnTop = preferredPos === 'top';
    if (preferredPos === 'bottom' && spaceBelow < 220 && spaceAbove > 220) {
      placeOnTop = true;
    } else if (preferredPos === 'top' && spaceAbove < 220 && spaceBelow > 220) {
      placeOnTop = false;
    }

    // Horizontal centering relative to spotlight target box, bounded inside viewport
    let leftPos = targetRect.left + targetRect.width / 2 - popoverWidth / 2;
    leftPos = Math.max(16, Math.min(leftPos, window.innerWidth - popoverWidth - 16));

    if (placeOnTop) {
      popoverStyle = {
        bottom: `${window.innerHeight - targetRect.top + 12}px`,
        left: `${leftPos}px`,
      };
    } else {
      popoverStyle = {
        top: `${targetRect.top + targetRect.height + 12}px`,
        left: `${leftPos}px`,
      };
    }
  } else {
    // Fallback centered
    popoverStyle = {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    };
  }

  return (
    <div className="fixed inset-0 z-[99990] overflow-hidden select-none font-sans">
      {/* SVG CUTOUT SPOTLIGHT OVERLAY */}
      <svg className="absolute inset-0 w-full h-full pointer-events-auto transition-all duration-300">
        <defs>
          <mask id="tour-spotlight-mask">
            {/* White background means fully dark backdrop */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {/* Black rectangle creates the transparent spotlight hole */}
            {targetRect && (
              <rect
                x={targetRect.left}
                y={targetRect.top}
                width={targetRect.width}
                height={targetRect.height}
                rx="14"
                ry="14"
                fill="black"
              />
            )}
          </mask>
        </defs>

        {/* Backdrop overlay filled with dark color, masked by spotlight */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(15, 14, 12, 0.72)"
          mask="url(#tour-spotlight-mask)"
        />
      </svg>

      {/* GLOWING SPOTLIGHT BORDER OVER TARGET ELEMENT */}
      {targetRect && (
        <motion.div
          layoutId="tour-spotlight-ring"
          initial={false}
          animate={{
            top: targetRect.top,
            left: targetRect.left,
            width: targetRect.width,
            height: targetRect.height,
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed pointer-events-none rounded-[14px] border-2 border-amber-400 shadow-[0_0_25px_rgba(212,175,55,0.45)] z-[99992]"
        />
      )}

      {/* FLOATING TOUR POPOVER CARD */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep.id}
          initial={{ opacity: 0, y: 12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.96 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          style={popoverStyle}
          className="fixed z-[99995] w-[calc(100vw-32px)] sm:w-[340px] bg-white text-stone-900 rounded-3xl p-5 shadow-2xl border border-stone-200/90 backdrop-blur-2xl"
        >
          {/* Header & Step Counter */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-900 text-[11px] font-bold">
              <Compass className="w-3.5 h-3.5 text-amber-600" />
              <span>{currentStep.badge || 'Rehber'}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-stone-500 bg-stone-100 px-2.5 py-0.5 rounded-full">
                {currentStepIndex + 1} / {TOUR_STEPS.length}
              </span>
              
              <button
                onClick={onClose}
                className="p-1 rounded-full text-stone-400 hover:text-stone-800 hover:bg-stone-100 transition-colors cursor-pointer"
                title="Turu Kapat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Title & Description */}
          <div className="space-y-1.5 mb-5">
            <h3 className="text-base font-bold text-stone-900 tracking-tight font-serif flex items-center gap-2">
              <span>{currentStep.title}</span>
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed font-normal">
              {currentStep.description}
            </p>
          </div>

          {/* Progress Dot Indicators */}
          <div className="flex items-center justify-center gap-1.5 mb-4">
            {TOUR_STEPS.map((step, idx) => (
              <button
                key={step.id}
                onClick={() => setCurrentStepIndex(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentStepIndex
                    ? 'w-6 bg-emerald-700'
                    : idx < currentStepIndex
                    ? 'w-1.5 bg-emerald-300'
                    : 'w-1.5 bg-stone-200'
                }`}
                title={`${idx + 1}. Adıma Git`}
              />
            ))}
          </div>

          {/* Don't show again option */}
          <div className="flex items-center justify-between gap-2 mb-3 pt-2 border-t border-stone-100">
            <label className="flex items-center gap-2 cursor-pointer select-none group">
              <input
                type="checkbox"
                checked={!!dontShowAgain}
                onChange={(e) => onToggleDontShowAgain?.(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-stone-300 text-emerald-700 focus:ring-emerald-600 accent-emerald-700 cursor-pointer"
              />
              <span className="text-[11px] font-medium text-stone-600 group-hover:text-stone-900 transition-colors">
                Bir daha otomatik gösterme
              </span>
            </label>
          </div>

          {/* Navigation Action Buttons */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-100">
            <button
              onClick={() => {
                if (!isFirstStep) setCurrentStepIndex((prev) => prev - 1);
              }}
              disabled={isFirstStep}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
                isFirstStep
                  ? 'opacity-40 text-stone-400 cursor-not-allowed'
                  : 'text-stone-700 hover:bg-stone-100 active:scale-95 cursor-pointer'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Geri</span>
            </button>

            <button
              onClick={onClose}
              className="text-xs font-medium text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
            >
              Atla
            </button>

            <button
              onClick={() => {
                if (isLastStep) {
                  onToggleDontShowAgain?.(true);
                  onClose();
                } else {
                  setCurrentStepIndex((prev) => prev + 1);
                }
              }}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              <span>{isLastStep ? 'Tamamla' : 'Sonraki'}</span>
              {isLastStep ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
