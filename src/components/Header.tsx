import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Smartphone, Monitor, Sparkles, Download, Home, User, Menu, X, BookOpen, Radio, BookCheck, StickyNote, Sliders, ChevronRight, Compass, Minimize2 } from 'lucide-react';
import { NavTab } from '../types';
import { TitleWithHelp } from './TitleWithHelp';

interface HeaderProps {
  isMobileFrame: boolean;
  setIsMobileFrame: (val: boolean) => void;
  onOpenAiAssistant: () => void;
  onOpenWelcomeModal?: () => void;
  onOpenExportImportModal?: () => void;
  onOpenUserProfileModal?: () => void;
  onOpenAuthLandingModal?: () => void;
  onStartTour?: () => void;
  onOpenQiblaFinder?: () => void;
  onOpenRiyazusModal?: () => void;
  user?: { name: string; email: string; avatar: string } | null;
  activeTab?: NavTab;
  onNavigateTab?: (tab: NavTab) => void;
  isFullScreen?: boolean;
  setIsFullScreen?: (val: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  isMobileFrame,
  setIsMobileFrame,
  onOpenAiAssistant,
  onOpenWelcomeModal,
  onOpenExportImportModal,
  onOpenUserProfileModal,
  onOpenAuthLandingModal,
  onStartTour,
  onOpenQiblaFinder,
  onOpenRiyazusModal,
  user,
  activeTab = 'quran',
  onNavigateTab,
  isFullScreen,
  setIsFullScreen,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Close full-screen burger menu on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Escape' || e.key === 'Esc') && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMenuOpen]);

  return (
    <header className="sticky top-0 z-50 bg-white/85 dark:bg-stone-900/90 backdrop-blur-xl text-stone-900 dark:text-stone-100 shadow-xs border-b border-stone-200/80 dark:border-stone-800 transition-all">
      {/* Main Bar */}
      <div className="px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2 max-w-6xl mx-auto w-full">
        {/* Logo & Title */}
        <div
          id="tour-header-logo"
          onClick={onOpenWelcomeModal}
          className="flex items-center gap-2.5 cursor-pointer group shrink-0"
          title="Karşılama Ekranı"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-bold shadow-xs border border-emerald-600 group-hover:scale-105 transition-transform">
            <span className="text-lg sm:text-xl font-serif">ق</span>
          </div>
          <div>
            <TitleWithHelp
              title="Kur'an & Tefsir"
              description="Ders ve Okuma Rehberi"
              titleClassName="text-xs sm:text-base font-bold tracking-tight text-stone-900 dark:text-stone-100"
            />
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* User Account or Split Screen Login Button */}
          {user ? (
            <button
              id="tour-user-profile"
              onClick={onOpenUserProfileModal}
              title={`Hesabım (${user.name})`}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-950 transition-all active:scale-95 flex items-center gap-1.5 text-xs border border-emerald-200 shadow-xs cursor-pointer"
            >
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-4 h-4 rounded-full" />
              ) : (
                <User className="w-4 h-4 text-emerald-700" />
              )}
              <span className="font-bold text-[11px] hidden xs:inline">{user.name.split(' ')[0]}</span>
            </button>
          ) : (
            <button
              id="tour-user-profile"
              onClick={onOpenAuthLandingModal || onOpenUserProfileModal}
              title="Giriş Yap / Tanıtım Ekranı"
              className="px-2.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white transition-all active:scale-95 flex items-center gap-1.5 text-xs border border-emerald-800 shadow-xs cursor-pointer font-semibold"
            >
              <User className="w-4 h-4 text-emerald-100" />
              <span className="font-bold text-[11px]">Giriş Yap</span>
            </button>
          )}

          {/* Welcome Screen Trigger - Hidden on mobile, available in menu */}
          {onOpenWelcomeModal && (
            <button
              onClick={onOpenWelcomeModal}
              title="Karşılama Ekranı & Kaldığın Yer"
              className="p-1.5 sm:p-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 transition-all active:scale-95 items-center gap-1 text-xs border border-stone-200 dark:border-stone-700 hidden sm:flex cursor-pointer"
            >
              <Home className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            </button>
          )}

          {/* Export/Import Trigger */}
          {onOpenExportImportModal && (
            <button
              onClick={onOpenExportImportModal}
              title="Not Dışa / İçe Aktar (Word, Drive, JSON)"
              className="p-1.5 sm:p-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 transition-all active:scale-95 items-center gap-1 text-xs border border-stone-200 dark:border-stone-700 hidden sm:flex cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </button>
          )}

          {/* Tour / Guide Button - Hidden on mobile header, available in menu */}
          {onStartTour && (
            <button
              onClick={onStartTour}
              title="Nasıl Kullanılır? Kolay Rehber"
              className="px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-stone-800 hover:bg-emerald-100 dark:hover:bg-stone-700 text-emerald-900 dark:text-emerald-300 font-bold text-xs transition-all items-center gap-1 border border-emerald-200 dark:border-stone-700 shadow-xs active:scale-95 cursor-pointer hidden sm:flex"
            >
              <Compass className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 animate-pulse" />
              <span>🚀 Rehber</span>
            </button>
          )}

          {/* Exit Fullscreen Toggle Button if in Fullscreen */}
          {isFullScreen && setIsFullScreen && (
            <button
              onClick={() => setIsFullScreen(false)}
              title="Tam Ekrandan Çık"
              className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-xs active:scale-95 cursor-pointer border border-amber-600 shrink-0"
            >
              <Minimize2 className="w-4 h-4 text-white" />
              <span className="hidden sm:inline">Tam Ekrandan Çık</span>
            </button>
          )}

          {/* AI Assistant Quick Trigger */}
          <button
            onClick={onOpenAiAssistant}
            title="Soru Sor / Akıllı Asistan"
            className="px-2.5 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-all flex items-center gap-1 shadow-xs active:scale-95 cursor-pointer border border-emerald-700"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-100" />
            <span className="hidden md:inline">Soru Sor</span>
          </button>

          {/* Hamburger Menu Toggle Button */}
          <button
            onClick={() => setIsMenuOpen(true)}
            title="Tüm Menü & Seçenekler"
            className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-emerald-50 dark:hover:bg-stone-700 text-stone-900 dark:text-stone-100 transition-all active:scale-95 flex items-center justify-center border border-stone-200 dark:border-stone-700 shadow-xs cursor-pointer"
          >
            <Menu className="w-5 h-5 text-stone-800 dark:text-stone-200" />
          </button>
        </div>
      </div>

      {/* FULL-SCREEN APPLE MINIMALIST BURGER MENU OVERLAY */}
      {createPortal(
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -10 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="fixed inset-0 z-[99999] bg-stone-50/98 dark:bg-stone-950/98 backdrop-blur-3xl text-stone-900 dark:text-stone-100 flex flex-col justify-between p-6 sm:p-12 overflow-y-auto"
            >
              {/* Top Bar of Fullscreen Overlay */}
              <div className="flex items-center justify-between max-w-4xl mx-auto w-full">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-bold shadow-sm">
                    <span className="text-xl font-serif">ق</span>
                  </div>
                  <div>
                    <TitleWithHelp
                      title="Kur'an & Tefsir Rehberi"
                      description="Sade & Kolay Kullanım"
                      titleClassName="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 tracking-tight"
                    />
                  </div>
                </div>

                {/* Close Button */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2.5 rounded-2xl bg-stone-200/80 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span className="text-xs font-mono font-semibold text-stone-500 dark:text-stone-400 hidden sm:inline">ESC</span>
                  <X className="w-5 h-5 text-stone-800 dark:text-stone-200" />
                </motion.button>
              </div>

              {/* Center Navigation Links */}
              <div className="max-w-4xl mx-auto w-full my-8 space-y-6">
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-800 dark:text-emerald-400 border-b border-stone-200 dark:border-stone-800 pb-2">
                  Ana Bölümler
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <motion.div
                    role="button"
                    tabIndex={0}
                    whileTap={{ scale: 0.97 }}
                    whileHover={{ scale: 1.01 }}
                    onClick={() => {
                      onNavigateTab?.('quran');
                      setIsMenuOpen(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        onNavigateTab?.('quran');
                        setIsMenuOpen(false);
                      }
                    }}
                    className={`p-5 rounded-3xl border text-left transition-all duration-200 flex items-center justify-between group cursor-pointer ${
                      activeTab === 'quran'
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-md'
                        : 'bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-100 border-stone-200/90 dark:border-stone-800 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-2xl ${activeTab === 'quran' ? 'bg-emerald-800 text-white' : 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800'}`}>
                        <BookOpen className="w-6 h-6" />
                      </div>
                      <div>
                        <TitleWithHelp
                          title="Kur'an Okuma"
                          description="Mushaf, Mealli ve Sadece Meal Sayfaları"
                          titleClassName={`font-bold text-base sm:text-lg ${activeTab === 'quran' ? 'text-white' : ''}`}
                        />
                      </div>
                    </div>
                    <ChevronRight className={`w-5 h-5 transition-transform group-hover:translate-x-1 ${activeTab === 'quran' ? 'text-white' : 'text-stone-400'}`} />
                  </motion.div>

                  <motion.div
                    role="button"
                    tabIndex={0}
                    whileTap={{ scale: 0.97 }}
                    whileHover={{ scale: 1.01 }}
                    onClick={() => {
                      onNavigateTab?.('sohbet');
                      setIsMenuOpen(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        onNavigateTab?.('sohbet');
                        setIsMenuOpen(false);
                      }
                    }}
                    className={`p-5 rounded-3xl border text-left transition-all duration-200 flex items-center justify-between group cursor-pointer ${
                      activeTab === 'sohbet'
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-md'
                        : 'bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-100 border-stone-200/90 dark:border-stone-800 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-2xl ${activeTab === 'sohbet' ? 'bg-emerald-800 text-white' : 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800'}`}>
                        <Radio className="w-6 h-6" />
                      </div>
                      <div>
                        <TitleWithHelp
                          title="Sohbet & Ders"
                          description="Ders Ses Kayıtları ve Sohbet Dinleme"
                          titleClassName={`font-bold text-base sm:text-lg ${activeTab === 'sohbet' ? 'text-white' : ''}`}
                        />
                      </div>
                    </div>
                    <ChevronRight className={`w-5 h-5 transition-transform group-hover:translate-x-1 ${activeTab === 'sohbet' ? 'text-white' : 'text-stone-400'}`} />
                  </motion.div>

                  <motion.div
                    role="button"
                    tabIndex={0}
                    whileTap={{ scale: 0.97 }}
                    whileHover={{ scale: 1.01 }}
                    onClick={() => {
                      onNavigateTab?.('notes');
                      setIsMenuOpen(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        onNavigateTab?.('notes');
                        setIsMenuOpen(false);
                      }
                    }}
                    className={`p-5 rounded-3xl border text-left transition-all duration-200 flex items-center justify-between group cursor-pointer ${
                      activeTab === 'notes'
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-md'
                        : 'bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-100 border-stone-200/90 dark:border-stone-800 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-2xl ${activeTab === 'notes' ? 'bg-emerald-800 text-white' : 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800'}`}>
                        <StickyNote className="w-6 h-6" />
                      </div>
                      <div>
                        <TitleWithHelp
                          title="Hoca Notlarım"
                          description="Ayetlere Alınan Tüm Ders Notları"
                          titleClassName={`font-bold text-base sm:text-lg ${activeTab === 'notes' ? 'text-white' : ''}`}
                        />
                      </div>
                    </div>
                    <ChevronRight className={`w-5 h-5 transition-transform group-hover:translate-x-1 ${activeTab === 'notes' ? 'text-white' : 'text-stone-400'}`} />
                  </motion.div>
                </div>

                {/* Quick Action Cards in Overlay */}
                <div className="pt-4 border-t border-stone-200 dark:border-stone-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {onOpenQiblaFinder && (
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={() => {
                        onOpenQiblaFinder();
                        setIsMenuOpen(false);
                      }}
                      className="p-3.5 rounded-2xl bg-amber-50 dark:bg-stone-900 hover:bg-amber-100 dark:hover:bg-stone-800 border border-amber-200 dark:border-stone-700 text-amber-950 dark:text-amber-300 font-bold text-xs flex items-center gap-3 transition-all cursor-pointer"
                    >
                      <Compass className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
                      <span>🕋 Kıble Pusulası (Kâbe Yönü)</span>
                    </motion.button>
                  )}

                  {onOpenRiyazusModal && (
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={() => {
                        onOpenRiyazusModal();
                        setIsMenuOpen(false);
                      }}
                      className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-stone-900 hover:bg-emerald-100 dark:hover:bg-stone-800 border border-emerald-200 dark:border-stone-700 text-emerald-950 dark:text-emerald-300 font-bold text-xs flex items-center gap-3 transition-all cursor-pointer"
                    >
                      <BookOpen className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                      <span>📖 Riyazü’s-Sâlihîn Hadisler</span>
                    </motion.button>
                  )}

                  {onOpenUserProfileModal && (
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={() => {
                        onOpenUserProfileModal();
                        setIsMenuOpen(false);
                      }}
                      className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-200 font-semibold text-xs flex items-center gap-3 transition-all cursor-pointer"
                    >
                      <Sliders className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                      <span>Kullanıcı Profili & Ayarlar</span>
                    </motion.button>
                  )}

                  {onOpenExportImportModal && (
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={() => {
                        onOpenExportImportModal();
                        setIsMenuOpen(false);
                      }}
                      className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-200 font-semibold text-xs flex items-center gap-3 transition-all cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                      <span>Notları Aktar (Word / Drive)</span>
                    </motion.button>
                  )}

                  {onOpenWelcomeModal && (
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={() => {
                        onOpenWelcomeModal();
                        setIsMenuOpen(false);
                      }}
                      className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-200 font-semibold text-xs flex items-center gap-3 transition-all cursor-pointer"
                    >
                      <Home className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                      <span>Karşılama Ekranı</span>
                    </motion.button>
                  )}

                  {onStartTour && (
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={() => {
                        setIsMenuOpen(false);
                        onStartTour();
                      }}
                      className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-stone-900 hover:bg-emerald-100 dark:hover:bg-stone-800 border border-emerald-200 dark:border-stone-700 text-emerald-950 dark:text-emerald-300 font-bold text-xs flex items-center gap-3 transition-all cursor-pointer"
                    >
                      <span className="text-sm">🧭</span>
                      <span>Uygulama Rehberi (Tur)</span>
                    </motion.button>
                  )}
                </div>
              </div>

              {/* Footer Info of Fullscreen Overlay */}
              <div className="max-w-4xl mx-auto w-full pt-4 border-t border-stone-200 dark:border-stone-800 text-center text-xs text-stone-500 dark:text-stone-400 flex items-center justify-between">
                <span>Kur'an & Tefsir Rehberi • Sade ve Yalın Tasarım</span>
                <span>Kapatmak için ESC'ye basın</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </header>
  );
};



