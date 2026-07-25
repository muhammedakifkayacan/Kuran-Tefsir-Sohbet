import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Smartphone, PlusSquare, Share, X, Info, Check, ArrowRight } from 'lucide-react';

export const AddToHomeScreenPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [showInstructionsModal, setShowInstructionsModal] = useState<boolean>(false);
  const [isIos, setIsIos] = useState<boolean>(false);

  useEffect(() => {
    // Check if running in Standalone (PWA) mode
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    setIsStandalone(standalone);

    // Check if user dismissed prompt recently
    const dismissedUntil = localStorage.getItem('kuran_pwa_prompt_dismissed_until');
    if (dismissedUntil && Date.now() < Number(dismissedUntil)) {
      setIsDismissed(true);
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    // Capture beforeinstallprompt for Android Chrome / Edge
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Do not render if standalone or dismissed
  if (isStandalone || isDismissed) {
    return null;
  }

  const handleDismiss = (dontShowForDays = 7) => {
    setIsDismissed(true);
    const expireTime = Date.now() + dontShowForDays * 24 * 60 * 60 * 1000;
    localStorage.setItem('kuran_pwa_prompt_dismissed_until', String(expireTime));
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Android / Chrome native prompt
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsDismissed(true);
      }
      setDeferredPrompt(null);
    } else {
      // iOS Safari or browser without automated prompt -> show easy instructions
      setShowInstructionsModal(true);
    }
  };

  return (
    <>
      {/* Small Floating Reminder Banner above Bottom Navigation */}
      <AnimatePresence>
        {!isDismissed && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className="fixed bottom-20 sm:bottom-6 left-3 right-3 sm:left-auto sm:right-6 sm:w-96 z-[90] pointer-events-auto"
          >
            <div className="bg-stone-900/95 text-stone-100 p-3.5 sm:p-4 rounded-2xl shadow-2xl border border-stone-700/80 backdrop-blur-xl flex items-center justify-between gap-3 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />

              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold shrink-0 shadow-xs border border-emerald-600">
                  <Smartphone className="w-5 h-5 text-emerald-100" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5 leading-tight">
                    <span>Ana Ekrana Ekle</span>
                    <span className="text-[10px] bg-emerald-900/90 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-700 font-medium">
                      Hızlı Erişim
                    </span>
                  </h4>
                  <p className="text-[11px] text-stone-300 font-medium leading-tight truncate mt-0.5">
                    Uygulamayı telefonunuza indirmeden ekleyin!
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={handleInstallClick}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                >
                  <PlusSquare className="w-3.5 h-3.5" />
                  <span>Ekle</span>
                </button>

                <button
                  onClick={() => handleDismiss(7)}
                  title="Kapat"
                  className="p-1.5 rounded-xl hover:bg-stone-800 text-stone-400 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instructions Modal for iOS or manual browsers */}
      <AnimatePresence>
        {showInstructionsModal && (
          <div className="fixed inset-0 z-[99999] bg-stone-950/70 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white text-stone-900 rounded-3xl p-5 sm:p-6 max-w-sm w-full shadow-2xl border border-stone-200 space-y-4 relative"
            >
              <button
                onClick={() => setShowInstructionsModal(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center border border-emerald-200 shrink-0">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900 leading-tight">
                    Ana Ekrana Nasıl Eklenir?
                  </h3>
                  <p className="text-xs text-stone-500 font-medium">10 saniyede telefonunuza kaydedin</p>
                </div>
              </div>

              {isIos ? (
                /* iOS Safari Steps */
                <div className="space-y-3 bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200/80 text-xs text-stone-800">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-700 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <p className="leading-snug">
                      Safari tarayıcısının altındaki <Share className="w-3.5 h-3.5 text-emerald-700 inline mx-0.5" /> <strong>"Paylaş"</strong> düğmesine dokunun.
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-700 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <p className="leading-snug">
                      Açılan menüde aşağı kaydırıp <PlusSquare className="w-3.5 h-3.5 text-emerald-700 inline mx-0.5" /> <strong>"Ana Ekrana Ekle"</strong> seçeneğini seçin.
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-700 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </span>
                    <p className="leading-snug">
                      Sağ üstteki <strong>"Ekle"</strong> butonuna basın. Artık ana ekranınızda uygulama logosu belirecektir!
                    </p>
                  </div>
                </div>
              ) : (
                /* Android / General Steps */
                <div className="space-y-3 bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200/80 text-xs text-stone-800">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-700 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <p className="leading-snug">
                      Tarayıcınızın sağ üstündeki <strong>üç nokta (⋮)</strong> menüsüne dokunun.
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-700 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <p className="leading-snug">
                      <PlusSquare className="w-3.5 h-3.5 text-emerald-700 inline mx-0.5" /> <strong>"Uygulamayı Yükle"</strong> veya <strong>"Ana Ekrana Ekle"</strong> seçeneğine tıklayın.
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-700 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </span>
                    <p className="leading-snug">
                      Onay vererek ekleyin. Uygulamaya tek tıkla doğrudan erişin!
                    </p>
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  setShowInstructionsModal(false);
                  handleDismiss(7);
                }}
                className="w-full py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-all active:scale-95 cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4 text-emerald-200" />
                <span>Anladım, Teşekkürler</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
