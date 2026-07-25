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
    badge: 'Uygulama Rehberi',
    description: "Kur'an & Tefsir Rehberine hoş geldin! Kur'an okuma, tilavet dinleme, sohbet meclislerini kaydetme ve not alma özelliklerini kolayca keşfedin.",
    preferredPosition: 'bottom',
  },
  {
    id: 'step_surah_select',
    targetId: 'tour-surah-selector',
    tab: 'quran',
    title: 'Sure & Sayfa Arama 📖',
    badge: 'Hızlı Erişim',
    description: "İstediğiniz Sûre ismini veya sayfa numarasını yazarak anında geçiş yapabilirsiniz. İster meal oku, ister Arapça metni takip et!",
    preferredPosition: 'bottom',
  },
  {
    id: 'step_recitation_audio',
    targetId: 'tour-audio-controls',
    tab: 'quran',
    title: 'Sesli Dinleme & Tilavet 🎧',
    badge: 'Kur\'an Dinle',
    description: "Sayfadaki 'Dinle' butonuna basarak dünyaca ünlü kârilerin sesinden Kur'an dinleyebilir, okuma hızını istediğiniz gibi ayarlayabilirsiniz.",
    preferredPosition: 'top',
  },
  {
    id: 'step_sohbet_view',
    targetId: 'tour-tab-sohbet',
    tab: 'sohbet',
    title: 'Sohbet & Tefsir Meclisleri 💬',
    badge: 'Ders ve Kayıtlar',
    description: "Sohbet meclislerinizi, ders kayıtlarınızı ve duyurularınızı bu sekmeden takip edebilir ve organize edebilirsiniz.",
    preferredPosition: 'top',
  },
  {
    id: 'step_sohbet_add',
    targetId: 'tour-sohbet-add',
    tab: 'sohbet',
    title: 'Sohbet & Tefsir Dersi Ekle ➕',
    badge: 'Yeni Kayıt',
    description: "Yeni bir sohbet meclisi düzenlediğinizde 'Sohbet Ekle' butonuna basarak ders konusunu, mekanını, tarihini ve ses kaydını kolayca ekleyebilirsiniz.",
    preferredPosition: 'bottom',
  },
  {
    id: 'step_notes_view',
    targetId: 'tour-tab-notes',
    tab: 'notes',
    title: 'Notlarım & Ayraçlar 📝',
    badge: 'Ders Notları',
    description: "Ayetlere aldığınız ders notlarını, son kaldığınız ayraçları ve kişisel notlarınızı bu sekmeden topluca inceleyebilirsiniz.",
    preferredPosition: 'top',
  },
  {
    id: 'step_profile_sync',
    targetId: 'tour-user-profile',
    tab: 'quran',
    title: 'Profil & Ayarlar ⚙️',
    badge: 'Hesap & Temalar',
    description: "Google hesabınızla giriş yaparak verilerinizi bulutta saklayabilir, gece modunu ve yazı boyutunu değiştirebilirsiniz.",
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

    let el = document.getElementById(currentStep.targetId);
    if (!el) {
      if (retryCountRef.current < 15) {
        retryCountRef.current += 1;
        setTimeout(measureTarget, 100);
        return;
      } else {
        // Fallback to top header logo or main selector if specific target element is missing
        el = document.getElementById('tour-surah-selector') || document.getElementById('tour-header-logo') || document.querySelector('header');
      }
    }

    if (!el) return;

    retryCountRef.current = 0;
    
    // Smoothly scroll element into view if off-screen
    const rect = el.getBoundingClientRect();
    const isOffscreen =
      rect.top < 20 ||
      rect.left < 10 ||
      rect.bottom > window.innerHeight - 20 ||
      rect.right > window.innerWidth - 10;

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
    }, 160);
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
      }, 250);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        measureTarget();
      }, 80);
      return () => clearTimeout(timer);
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

  // Ref & height state to measure actual popover dimensions for viewport clamping
  const popoverRef = useRef<HTMLDivElement>(null);
  const [popoverMeasuredHeight, setPopoverMeasuredHeight] = useState<number>(300);

  useEffect(() => {
    if (popoverRef.current) {
      const h = popoverRef.current.offsetHeight;
      if (h > 0 && Math.abs(h - popoverMeasuredHeight) > 8) {
        setPopoverMeasuredHeight(h);
      }
    }
  });

  if (!isOpen || !currentStep) return null;

  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === TOUR_STEPS.length - 1;

  // Calculate Popover Position relative to targetRect with strict mobile viewport bounds
  let popoverStyle: React.CSSProperties = {};
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const cardHeight = popoverMeasuredHeight || 280;

  if (targetRect) {
    if (isMobile) {
      // On mobile view: Pin left to 16px and right to 16px to guarantee zero horizontal overflow!
      const isTargetInBottomHalf = targetRect.top > window.innerHeight * 0.45;

      if (isTargetInBottomHalf) {
        // Target is near bottom (e.g., BottomNav in steps 4 & 6) -> Place card above target
        const desiredTop = targetRect.top - cardHeight - 12;
        const clampedTop = Math.max(12, desiredTop);
        const availableHeight = targetRect.top - clampedTop - 12;

        popoverStyle = {
          top: `${clampedTop}px`,
          left: '16px',
          right: '16px',
          width: 'auto',
          maxHeight: `${Math.max(180, availableHeight)}px`,
        };
      } else {
        // Target is near top (e.g., Header / Sohbet Add in steps 1, 2, 5, 7) -> Place card below target
        const desiredTop = targetRect.top + targetRect.height + 12;
        const clampedTop = Math.min(window.innerHeight - 200, desiredTop);
        const availableHeight = window.innerHeight - clampedTop - 68; // Reserve 68px for bottom nav bar

        popoverStyle = {
          top: `${clampedTop}px`,
          left: '16px',
          right: '16px',
          width: 'auto',
          maxHeight: `${Math.max(180, availableHeight)}px`,
        };
      }
    } else {
      // Desktop positioning
      const desktopCardWidth = 340;
      const spaceBelow = window.innerHeight - (targetRect.top + targetRect.height);
      const spaceAbove = targetRect.top;
      const preferredPos = currentStep.preferredPosition || 'bottom';

      let placeOnTop = preferredPos === 'top';
      if (preferredPos === 'bottom' && spaceBelow < cardHeight + 16 && spaceAbove > spaceBelow) {
        placeOnTop = true;
      } else if (preferredPos === 'top' && spaceAbove < cardHeight + 16 && spaceBelow > spaceAbove) {
        placeOnTop = false;
      }

      let calculatedTop: number;
      if (placeOnTop) {
        calculatedTop = targetRect.top - cardHeight - 12;
      } else {
        calculatedTop = targetRect.top + targetRect.height + 12;
      }

      const maxTop = Math.max(16, window.innerHeight - cardHeight - 16);
      calculatedTop = Math.max(16, Math.min(calculatedTop, maxTop));

      let leftPos = targetRect.left + targetRect.width / 2 - desktopCardWidth / 2;
      const maxLeft = Math.max(16, window.innerWidth - desktopCardWidth - 16);
      leftPos = Math.max(16, Math.min(leftPos, maxLeft));

      popoverStyle = {
        top: `${calculatedTop}px`,
        left: `${leftPos}px`,
        width: `${desktopCardWidth}px`,
        maxHeight: `calc(100vh - 32px)`,
      };
    }
  } else {
    // Fallback centered
    popoverStyle = {
      top: '50%',
      left: isMobile ? '16px' : '50%',
      right: isMobile ? '16px' : 'auto',
      transform: isMobile ? 'translateY(-50%)' : 'translate(-50%, -50%)',
      width: isMobile ? 'auto' : '340px',
      maxHeight: `calc(100vh - 32px)`,
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
          ref={popoverRef}
          key={currentStep.id}
          initial={{ opacity: 0, y: 10, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.97 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          style={popoverStyle}
          className="fixed z-[99995] sm:w-[340px] overflow-y-auto bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-2xl border border-stone-200/90 dark:border-stone-800 backdrop-blur-2xl"
        >
          {/* Header & Step Counter */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-stone-800 border border-amber-200/80 dark:border-stone-700 text-amber-900 dark:text-amber-300 text-[11px] font-bold">
              <Compass className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>{currentStep.badge || 'Rehber'}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 px-2.5 py-0.5 rounded-full">
                {currentStepIndex + 1} / {TOUR_STEPS.length}
              </span>
              
              <button
                onClick={onClose}
                className="p-1 rounded-full text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                title="Turu Kapat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Title & Description */}
          <div className="space-y-1.5 mb-5">
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 tracking-tight font-serif flex items-center gap-2">
              <span>{currentStep.title}</span>
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed font-normal">
              {currentStep.description}
            </p>
          </div>

          {/* Progress Dot Indicators */}
          <div className="flex items-center justify-center gap-1.5 mb-4">
            {TOUR_STEPS.map((step, idx) => (
              <button
                key={step.id}
                onClick={() => setCurrentStepIndex(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  idx === currentStepIndex
                    ? 'w-6 bg-emerald-700 dark:bg-emerald-500'
                    : idx < currentStepIndex
                    ? 'w-1.5 bg-emerald-300 dark:bg-emerald-700'
                    : 'w-1.5 bg-stone-200 dark:bg-stone-700'
                }`}
                title={`${idx + 1}. Adıma Git`}
              />
            ))}
          </div>

          {/* Don't show again option */}
          <div className="flex items-center justify-between gap-2 mb-3 pt-2 border-t border-stone-100 dark:border-stone-800">
            <label className="flex items-center gap-2 cursor-pointer select-none group">
              <input
                type="checkbox"
                checked={!!dontShowAgain}
                onChange={(e) => onToggleDontShowAgain?.(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-stone-300 dark:border-stone-700 text-emerald-700 focus:ring-emerald-600 accent-emerald-700 cursor-pointer"
              />
              <span className="text-[11px] font-medium text-stone-600 dark:text-stone-300 group-hover:text-stone-900 dark:group-hover:text-stone-100 transition-colors">
                Bir daha otomatik gösterme
              </span>
            </label>
          </div>

          {/* Navigation Action Buttons */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-100 dark:border-stone-800">
            <button
              onClick={() => {
                if (!isFirstStep) setCurrentStepIndex((prev) => prev - 1);
              }}
              disabled={isFirstStep}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
                isFirstStep
                  ? 'opacity-40 text-stone-400 dark:text-stone-600 cursor-not-allowed'
                  : 'text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 active:scale-95 cursor-pointer'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Geri</span>
            </button>

            <button
              onClick={onClose}
              className="text-xs font-medium text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition-colors cursor-pointer"
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
