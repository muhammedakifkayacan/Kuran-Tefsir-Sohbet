import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Download, BookOpen, Radio, BookCheck, StickyNote, Maximize2, Minimize2, Home, RefreshCw, ArrowDown } from 'lucide-react';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { QuranReader } from './components/QuranReader';
import { SohbetView } from './components/SohbetView';
import { TeacherNotesView } from './components/TeacherNotesView';
import { AudioPlayerBar } from './components/AudioPlayerBar';
import { VoiceRecorderModal } from './components/VoiceRecorderModal';
import { WelcomeModal } from './components/WelcomeModal';
import { ExportImportNotesModal } from './components/ExportImportNotesModal';
import { UserProfileModal } from './components/UserProfileModal';
import { AuthLandingModal } from './components/AuthLandingModal';
import { AuthGuardModal } from './components/AuthGuardModal';
import { InteractiveTour } from './components/InteractiveTour';
import { HomeDashboard } from './components/HomeDashboard';
import { QiblaFinderModal } from './components/QiblaFinderModal';
import { RiyazusSalihinModal } from './components/RiyazusSalihinModal';
import { AddToHomeScreenPrompt } from './components/AddToHomeScreenPrompt';

import { NavTab, Surah, Ayah, VerseNote, Reciter, SohbetSession } from './types';
import { QURAN_SURAHS, RECITERS } from './data/quranData';
import { INITIAL_SOHBET_SESSIONS } from './data/sohbetData';
import { fetchSurahFromApi } from './utils/quranApi';
import { auth } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function App() {
  // Mobile Frame Toggle
  const [isMobileFrame, setIsMobileFrame] = useState<boolean>(false);

  // User Account & Guest Mode State
  const [user, setUser] = useState<{ name: string; email: string; avatar: string } | null>(() => {
    const saved = localStorage.getItem('kuran_user_profile');
    return saved ? JSON.parse(saved) : null;
  });

  const [isGuest, setIsGuest] = useState<boolean>(() => {
    return localStorage.getItem('kuran_app_guest_mode') === 'true';
  });

  // Controls Split Screen Onboarding & Login Landing Modal
  const [isAuthLandingOpen, setIsAuthLandingOpen] = useState<boolean>(() => {
    const savedUser = localStorage.getItem('kuran_user_profile');
    const savedGuest = localStorage.getItem('kuran_app_guest_mode');
    return !savedUser && savedGuest !== 'true';
  });

  // Controls Auth Guard Warning Modal when a guest tries to add notes or sohbet
  const [isAuthGuardOpen, setIsAuthGuardOpen] = useState<boolean>(false);
  const [authGuardMessage, setAuthGuardMessage] = useState<string>('');

  // Subscribe to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const loggedUser = {
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Kullanıcı',
          email: firebaseUser.email || '',
          avatar: firebaseUser.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(firebaseUser.displayName || firebaseUser.email || 'Kullanici')}`,
        };
        setUser(loggedUser);
        setIsGuest(false);
        localStorage.setItem('kuran_user_profile', JSON.stringify(loggedUser));
        localStorage.removeItem('kuran_app_guest_mode');
        setIsAuthLandingOpen(false);
        setIsAuthGuardOpen(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLoginSuccess = (loggedUser: { name: string; email: string; avatar: string }) => {
    setUser(loggedUser);
    setIsGuest(false);
    localStorage.setItem('kuran_user_profile', JSON.stringify(loggedUser));
    localStorage.removeItem('kuran_app_guest_mode');
    setIsAuthLandingOpen(false);
    setIsAuthGuardOpen(false);
  };

  const handleContinueAsGuest = () => {
    setIsGuest(true);
    localStorage.setItem('kuran_app_guest_mode', 'true');
    setIsAuthLandingOpen(false);
  };

  const handleLogout = () => {
    setUser(null);
    setIsGuest(true);
    localStorage.removeItem('kuran_user_profile');
  };

  const handleRequireAuth = (msg: string) => {
    if (user) return;
    setAuthGuardMessage(msg);
    setIsAuthGuardOpen(true);
  };

  // Modals & Welcome Screen State
  const [dontShowAgain, setDontShowAgain] = useState<boolean>(() => {
    return localStorage.getItem('kuran_welcome_dismissed') === 'true';
  });
  const [dontShowTourAgain, setDontShowTourAgain] = useState<boolean>(() => {
    return localStorage.getItem('kuran_tour_dismissed') === 'true';
  });
  const [isWelcomeOpen, setIsWelcomeOpen] = useState<boolean>(false);
  const [isExportImportOpen, setIsExportImportOpen] = useState<boolean>(false);
  const [isUserProfileOpen, setIsUserProfileOpen] = useState<boolean>(false);
  const [isTourOpen, setIsTourOpen] = useState<boolean>(false);

  const handleStartTour = () => {
    setIsWelcomeOpen(false);
    setIsUserProfileOpen(false);
    setIsAuthLandingOpen(false);
    setIsTourOpen(true);
  };

  // Sync dontShowAgain setting
  useEffect(() => {
    localStorage.setItem('kuran_welcome_dismissed', dontShowAgain ? 'true' : 'false');
  }, [dontShowAgain]);

  // Sync dontShowTourAgain setting
  useEffect(() => {
    localStorage.setItem('kuran_tour_dismissed', dontShowTourAgain ? 'true' : 'false');
  }, [dontShowTourAgain]);

  // Auto-start tour guide on first open / session if not dismissed
  useEffect(() => {
    if (!dontShowTourAgain && !isAuthLandingOpen) {
      const timer = setTimeout(() => {
        setIsTourOpen(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [dontShowTourAgain, isAuthLandingOpen]);

  // Last Reading Position State
  const [lastReadPosition, setLastReadPosition] = useState<{
    surahId: number;
    surahName: string;
    verseNumber: number;
    pageNumber: number;
    updatedAt: string;
  } | null>(() => {
    const saved = localStorage.getItem('kuran_last_read');
    return saved ? JSON.parse(saved) : null;
  });

  // Re-read last read position from localStorage when welcome opens
  useEffect(() => {
    if (isWelcomeOpen) {
      const saved = localStorage.getItem('kuran_last_read');
      if (saved) setLastReadPosition(JSON.parse(saved));
    }
  }, [isWelcomeOpen]);

  // Full Screen Mode & Reader Settings State
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>(() => {
    return (localStorage.getItem('kuran_theme_mode') as 'light' | 'dark' | 'system') || 'system';
  });
  const [pageTheme, setPageTheme] = useState<'ivory' | 'mint' | 'white' | 'dark'>('ivory');
  const [fontSize, setFontSize] = useState<'md' | 'lg' | 'xl' | '2xl'>('xl');
  const [showTajweed, setShowTajweed] = useState<boolean>(true);
  const [showTranslation, setShowTranslation] = useState<boolean>(true);

  // Theme Mode Effect (Light / Dark / System)
  useEffect(() => {
    const applyTheme = () => {
      let isDark = false;
      if (themeMode === 'dark') {
        isDark = true;
      } else if (themeMode === 'light') {
        isDark = false;
      } else {
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      }

      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    applyTheme();
    localStorage.setItem('kuran_theme_mode', themeMode);

    if (themeMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        if (e.matches) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [themeMode]);

  // Immersive overlays visibility in Full Screen Reading Mode
  const [areOverlaysVisible, setAreOverlaysVisible] = useState<boolean>(true);
  const [showImmersiveTip, setShowImmersiveTip] = useState<boolean>(false);

  useEffect(() => {
    if (isFullScreen) {
      setAreOverlaysVisible(true);
      setShowImmersiveTip(true);
      const timer = setTimeout(() => {
        setShowImmersiveTip(false);
      }, 4000);
      return () => clearTimeout(timer);
    } else {
      setShowImmersiveTip(false);
    }
  }, [isFullScreen]);

  // Active Tab
  const [activeTab, setActiveTab] = useState<NavTab>('home');

  // Qibla & Riyazus Modals
  const [isQiblaModalOpen, setIsQiblaModalOpen] = useState<boolean>(false);
  const [isRiyazusModalOpen, setIsRiyazusModalOpen] = useState<boolean>(false);

  // Automatically exit full screen reading mode when leaving Quran tab
  useEffect(() => {
    if (activeTab !== 'quran') {
      setIsFullScreen(false);
    }
  }, [activeTab]);

  // Quran Reader State
  const [selectedSurah, setSelectedSurah] = useState<Surah>(QURAN_SURAHS[0]); // Fatiha
  const [isLoadingSurah, setIsLoadingSurah] = useState<boolean>(false);
  const [surahError, setSurahError] = useState<string | null>(null);
  const [activeAyah, setActiveAyah] = useState<Ayah | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [selectedReciter, setSelectedReciter] = useState<Reciter>(RECITERS[0]);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);

  // Sohbet Sessions State
  const [sohbetSessions, setSohbetSessions] = useState<SohbetSession[]>(() => {
    const saved = localStorage.getItem('kuran_app_sohbets');
    return saved ? JSON.parse(saved) : INITIAL_SOHBET_SESSIONS;
  });

  // Verse Notes State
  const [verseNotes, setVerseNotes] = useState<VerseNote[]>(() => {
    const saved = localStorage.getItem('kuran_app_notes');
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: 'note_1',
            surahId: 67,
            surahName: 'Mülk Sûresi',
            verseNumber: 3,
            tag: 'Tecvit',
            noteText: 'İdgam-ı Maal Gunne kuralında tutma süresi 1.5 elif miktarına tamamlanacak.',
            createdAt: '2026-07-20 14:30',
          },
        ];
  });

  // Voice Recorder Modal State
  const [isVoiceRecorderOpen, setIsVoiceRecorderOpen] = useState(false);
  const [recordedVoiceUrl, setRecordedVoiceUrl] = useState<string | null>(null);
  const [recordedVoiceTranscript, setRecordedVoiceTranscript] = useState<string>('');

  // Sync Sohbet Sessions to LocalStorage
  useEffect(() => {
    localStorage.setItem('kuran_app_sohbets', JSON.stringify(sohbetSessions));
  }, [sohbetSessions]);

  // Target verse auto-highlight state
  const [targetVerseNumber, setTargetVerseNumber] = useState<number | null>(null);
  useEffect(() => {
    localStorage.setItem('kuran_app_notes', JSON.stringify(verseNotes));
  }, [verseNotes]);

  // Global Escape key listener to close modals / full screen
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        if (isUserProfileOpen) setIsUserProfileOpen(false);
        if (isExportImportOpen) setIsExportImportOpen(false);
        if (isVoiceRecorderOpen) setIsVoiceRecorderOpen(false);
        if (isWelcomeOpen) setIsWelcomeOpen(false);
        if (isFullScreen) setIsFullScreen(false);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isUserProfileOpen, isExportImportOpen, isVoiceRecorderOpen, isWelcomeOpen, isFullScreen]);

  // Handlers
  const loadSurah = async (id: number) => {
    setIsLoadingSurah(true);
    setSurahError(null);
    try {
      const s = await fetchSurahFromApi(id);
      setSelectedSurah(s);
    } catch (err) {
      setSurahError('Sûre yüklenirken bir sorun oluştu. Lütfen internet bağlantınızı kontrol edin.');
    } finally {
      setIsLoadingSurah(false);
    }
  };

  const handlePlayAyah = (ayah: Ayah) => {
    if (activeAyah?.number === ayah.number && isPlaying) {
      setIsPlaying(false);
    } else {
      setActiveAyah(ayah);
      setIsPlaying(true);
    }
  };

  const handleNextAyah = () => {
    if (!activeAyah) return;
    const currentIndex = selectedSurah.verses.findIndex((v) => v.number === activeAyah.number);
    if (currentIndex < selectedSurah.verses.length - 1) {
      setActiveAyah(selectedSurah.verses[currentIndex + 1]);
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  };

  const handlePrevAyah = () => {
    if (!activeAyah) return;
    const currentIndex = selectedSurah.verses.findIndex((v) => v.number === activeAyah.number);
    if (currentIndex > 0) {
      setActiveAyah(selectedSurah.verses[currentIndex - 1]);
      setIsPlaying(true);
    }
  };

  const handleSaveVerseNote = (noteData: Omit<VerseNote, 'id' | 'createdAt'>) => {
    const newNote: VerseNote = {
      ...noteData,
      id: `note_${Date.now()}`,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };
    setVerseNotes([newNote, ...verseNotes]);
  };

  const handleDeleteNote = (id: string) => {
    setVerseNotes(verseNotes.filter((n) => n.id !== id));
  };

  const handleAddSohbetSession = (newSohbet: SohbetSession) => {
    setSohbetSessions([newSohbet, ...sohbetSessions]);
  };

  const handleUpdateSohbetSession = (updatedSession: SohbetSession) => {
    setSohbetSessions((prev) => prev.map((s) => (s.id === updatedSession.id ? updatedSession : s)));
  };

  const handleDeleteSohbetSession = (id: string) => {
    setSohbetSessions(sohbetSessions.filter((s) => s.id !== id));
  };

  const handleResumeReading = (surahId: number, pageNumber?: number) => {
    loadSurah(surahId);
    setActiveTab('quran');
  };

  const handleImportNotes = (importedNotes: VerseNote[], mode: 'merge' | 'replace') => {
    if (mode === 'replace') {
      setVerseNotes(importedNotes);
    } else {
      const existingIds = new Set(verseNotes.map((n) => n.id));
      const newItems = importedNotes.filter((n) => !existingIds.has(n.id));
      setVerseNotes([...newItems, ...verseNotes]);
    }
  };

  // Pull to Refresh State (PWA / Mobile Home Screen reload)
  const [pullDistance, setPullDistance] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStartApp = (e: React.TouchEvent) => {
    if (window.scrollY <= 10) {
      touchStartY.current = e.touches[0].clientY;
    } else {
      touchStartY.current = null;
    }
  };

  const handleTouchMoveApp = (e: React.TouchEvent) => {
    if (touchStartY.current === null || isRefreshing) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY.current;
    if (diff > 0 && window.scrollY <= 5) {
      const damped = Math.min(diff * 0.45, 110);
      setPullDistance(damped);
    } else {
      setPullDistance(0);
    }
  };

  const handleTouchEndApp = () => {
    if (pullDistance >= 60 && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(75);
      setTimeout(() => {
        window.location.reload();
      }, 350);
    } else {
      setPullDistance(0);
    }
    touchStartY.current = null;
  };

  return (
    <div
      onTouchStart={handleTouchStartApp}
      onTouchMove={handleTouchMoveApp}
      onTouchEnd={handleTouchEndApp}
      className="min-h-screen w-full max-w-full overflow-x-hidden bg-stone-100 dark:bg-stone-950 text-slate-900 dark:text-stone-100 flex flex-col items-center justify-center font-sans antialiased selection:bg-amber-400 selection:text-slate-950 relative transition-colors duration-200"
    >
      {/* PWA / Standalone Pull-to-Refresh Floating Indicator */}
      {(pullDistance > 0 || isRefreshing) && (
        <div
          style={{ transform: `translateY(${Math.min(pullDistance, 75)}px)` }}
          className="fixed top-2 left-1/2 -translate-x-1/2 z-[9999] transition-transform duration-75 pointer-events-none"
        >
          <div className="bg-emerald-950/95 text-emerald-50 px-4 py-2 rounded-2xl shadow-2xl border border-emerald-500/60 backdrop-blur-md flex items-center gap-2 text-xs font-bold animate-fade-in">
            <RefreshCw className={`w-4 h-4 text-emerald-300 ${pullDistance >= 60 || isRefreshing ? 'animate-spin' : ''}`} />
            <span>
              {isRefreshing
                ? 'Sayfa Yenileniyor...'
                : pullDistance >= 60
                ? 'Bırakın, Sayfa Güncellensin 🔄'
                : 'Yenilemek İçin Aşağı Çekin ⬇️'}
            </span>
          </div>
        </div>
      )}
      {/* Main Container Wrapper */}
      <div
        className={`w-full max-w-full overflow-x-hidden min-h-screen flex flex-col bg-[#FAF8F5] dark:bg-stone-950 transition-colors duration-200 ${
          isFullScreen && activeTab === 'quran'
            ? pageTheme === 'mint'
              ? 'bg-[#F2F7F4] dark:bg-stone-950'
              : pageTheme === 'white'
              ? 'bg-[#FFFFFF] dark:bg-stone-950'
              : pageTheme === 'dark'
              ? 'bg-stone-950'
              : 'bg-[#FAF8F5] dark:bg-stone-950'
            : ''
        }`}
      >
        {/* App Top Header - Fixed & Consistent Always */}
        <Header
          isMobileFrame={isMobileFrame}
          setIsMobileFrame={setIsMobileFrame}
          onOpenAiAssistant={() => setActiveTab('notes')}
          onOpenWelcomeModal={() => setIsWelcomeOpen(true)}
          onOpenExportImportModal={() => setIsExportImportOpen(true)}
          onOpenUserProfileModal={() => setIsUserProfileOpen(true)}
          onOpenAuthLandingModal={() => setIsAuthLandingOpen(true)}
          onStartTour={handleStartTour}
          onOpenQiblaFinder={() => setIsQiblaModalOpen(true)}
          onOpenRiyazusModal={() => setIsRiyazusModalOpen(true)}
          user={user}
          activeTab={activeTab}
          onNavigateTab={(tab) => setActiveTab(tab)}
        />

        {/* Scrollable View Content Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden w-full max-w-5xl mx-auto px-2 sm:px-4 pb-28 sm:pb-36 relative">
          <AnimatePresence mode="wait">
            {activeTab === 'home' && (
              <motion.div
                key="home"
                initial={{ opacity: 0, y: 10, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.985 }}
                transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              >
                <HomeDashboard
                  onNavigateTab={(tab) => setActiveTab(tab)}
                  onOpenQiblaFinder={() => setIsQiblaModalOpen(true)}
                  onOpenRiyazusModal={() => setIsRiyazusModalOpen(true)}
                  onOpenVoiceRecorder={() => setIsVoiceRecorderOpen(true)}
                  sohbetSessions={sohbetSessions}
                  verseNotes={verseNotes}
                />
              </motion.div>
            )}

            {activeTab === 'quran' && (
              <motion.div
                key="quran"
                initial={{ opacity: 0, y: 10, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.985 }}
                transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              >
                <QuranReader
                  selectedSurah={selectedSurah}
                  setSelectedSurah={setSelectedSurah}
                  loadSurah={loadSurah}
                  isLoadingSurah={isLoadingSurah}
                  surahError={surahError}
                  isFullScreen={isFullScreen}
                  setIsFullScreen={setIsFullScreen}
                  areOverlaysVisible={areOverlaysVisible}
                  pageTheme={pageTheme}
                  setPageTheme={setPageTheme}
                  fontSize={fontSize}
                  setFontSize={setFontSize}
                  showTajweed={showTajweed}
                  setShowTajweed={setShowTajweed}
                  showTranslation={showTranslation}
                  setShowTranslation={setShowTranslation}
                  activeAyah={activeAyah}
                  setActiveAyah={setActiveAyah}
                  isPlaying={isPlaying}
                  onPlayAyah={handlePlayAyah}
                  onOpenAiTajweedExplain={(_surahName, _verseNum, _verseText) => {
                    setActiveTab('notes');
                  }}
                  onSaveVerseNote={handleSaveVerseNote}
                  onOpenVoiceRecorder={() => setIsVoiceRecorderOpen(true)}
                  user={user}
                  onRequireAuth={handleRequireAuth}
                  targetVerseNumber={targetVerseNumber}
                />
              </motion.div>
            )}

            {activeTab === 'sohbet' && (
              <motion.div
                key="sohbet"
                initial={{ opacity: 0, y: 10, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.985 }}
                transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              >
                <SohbetView
                  sohbetSessions={sohbetSessions}
                  onAddSohbetSession={handleAddSohbetSession}
                  onUpdateSohbetSession={handleUpdateSohbetSession}
                  onDeleteSohbetSession={handleDeleteSohbetSession}
                  onOpenVoiceRecorder={() => setIsVoiceRecorderOpen(true)}
                  recordedVoiceUrl={recordedVoiceUrl}
                  recordedVoiceTranscript={recordedVoiceTranscript}
                  user={user}
                  onRequireAuth={handleRequireAuth}
                />
              </motion.div>
            )}

            {activeTab === 'notes' && (
              <motion.div
                key="notes"
                initial={{ opacity: 0, y: 10, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.985 }}
                transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              >
                <TeacherNotesView
                  verseNotes={verseNotes}
                  onDeleteNote={handleDeleteNote}
                  onOpenExportImportModal={() => setIsExportImportOpen(true)}
                  onNavigateToVerse={(surahId, verseNumber) => {
                    setTargetVerseNumber(verseNumber);
                    loadSurah(surahId);
                    setActiveTab('quran');
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Floating Recitation Audio Player Bar */}
        {activeAyah && (!isFullScreen || areOverlaysVisible) && (
          <AudioPlayerBar
            currentAyah={activeAyah}
            surahId={selectedSurah.id}
            surahName={selectedSurah.nameTurkish}
            isPlaying={isPlaying}
            onPlayPause={() => setIsPlaying(!isPlaying)}
            onNextAyah={handleNextAyah}
            onPrevAyah={handlePrevAyah}
            selectedReciter={selectedReciter}
            onSelectReciter={setSelectedReciter}
            onClose={() => {
              setIsPlaying(false);
              setActiveAyah(null);
            }}
            playbackRate={playbackRate}
            setPlaybackRate={setPlaybackRate}
          />
        )}

        {/* Floating Full-screen Overlay Control Pill Bar */}
        {isFullScreen && areOverlaysVisible && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-white/95 text-stone-900 backdrop-blur-2xl px-3.5 py-2 rounded-full shadow-xl border border-stone-200/90 flex items-center gap-2 sm:gap-3 text-xs animate-fade-in max-w-[95vw] overflow-x-auto scrollbar-none">
            {/* Theme Selector Color Dots */}
            <div className="flex items-center gap-1.5 pr-2 border-r border-stone-200">
              {(['ivory', 'mint', 'white', 'sepia'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setPageTheme(t as any)}
                  className={`w-5 h-5 rounded-full border transition-all ${
                    t === 'ivory'
                      ? 'bg-[#FCFBF7] border-amber-300'
                      : t === 'mint'
                      ? 'bg-[#F2F7F2] border-emerald-300'
                      : t === 'white'
                      ? 'bg-[#FFFFFF] border-stone-300'
                      : 'bg-[#FAF3E0] border-amber-400'
                  } ${pageTheme === t ? 'ring-2 ring-amber-600 scale-110 shadow-2xs' : 'opacity-70 hover:opacity-100'}`}
                  title={t === 'ivory' ? 'Fildişi Tema' : t === 'mint' ? 'Nane Yeşili Tema' : t === 'white' ? 'Kar Beyazı Tema' : 'Sepya Tema'}
                />
              ))}
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab('quran')}
                className={`px-3 py-1.5 rounded-full font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'quran'
                    ? 'bg-[#D4AF37] text-stone-950 shadow-sm'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Kur'an</span>
              </button>

              <button
                onClick={() => {
                  setIsFullScreen(false);
                  setActiveTab('sohbet');
                }}
                className={`px-3 py-1.5 rounded-full font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'sohbet'
                    ? 'bg-[#D4AF37] text-stone-950 shadow-sm'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Sohbet</span>
              </button>

              <button
                onClick={() => {
                  setIsFullScreen(false);
                  setActiveTab('notes');
                }}
                className={`px-3 py-1.5 rounded-full font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'notes'
                    ? 'bg-[#D4AF37] text-stone-950 shadow-sm'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                <StickyNote className="w-3.5 h-3.5" />
                <span>Notlar</span>
              </button>
            </div>

            <div className="w-px h-4 bg-stone-800 my-auto mx-0.5" />

            {/* Quick Action Icons & Fullscreen Exit */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsExportImportOpen(true)}
                title="Notları Dışa/İçe Aktar"
                className="p-1.5 rounded-full text-amber-300 hover:bg-stone-800 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setIsUserProfileOpen(true)}
                title="Kullanıcı Girişi / Profil"
                className="p-1.5 rounded-full text-amber-300 hover:bg-stone-800 transition-colors"
              >
                <User className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setIsFullScreen(false)}
                title="Tam Ekrandan Çık"
                className="p-1.5 rounded-full text-stone-300 hover:text-white hover:bg-stone-800 transition-colors"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Native Mobile Bottom Navigation */}
        {!isFullScreen && (
          <BottomNav
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            unresolvedNotesCount={verseNotes.length}
          />
        )}
      </div>

      {/* Immersive Reading Mode Toast Guide */}
      {isFullScreen && showImmersiveTip && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-amber-800 text-white backdrop-blur-md px-6 py-3.5 rounded-2xl text-xs font-semibold shadow-xl border border-amber-700/50 flex items-center gap-3 animate-bounce">
          <span className="text-base">📖</span>
          <span><b>Tam Ekran Okuma Modu:</b> Menüleri gizlemek / göstermek için sayfada boş bir yere dokunun.</span>
        </div>
      )}

      {/* Welcome & Resume Modal */}
      <WelcomeModal
        isOpen={isWelcomeOpen}
        onClose={() => setIsWelcomeOpen(false)}
        lastReadPosition={lastReadPosition}
        onResumeReading={handleResumeReading}
        onNavigateTab={(tab) => setActiveTab(tab)}
        notesCount={verseNotes.length}
        dontShowAgain={dontShowAgain}
        setDontShowAgain={setDontShowAgain}
        onStartTour={handleStartTour}
      />

      {/* Filtered Notes Export & Import Modal */}
      <ExportImportNotesModal
        isOpen={isExportImportOpen}
        onClose={() => setIsExportImportOpen(false)}
        verseNotes={verseNotes}
        onImportNotes={handleImportNotes}
      />

      {/* User Profile & Login Modal */}
      <UserProfileModal
        isOpen={isUserProfileOpen}
        onClose={() => setIsUserProfileOpen(false)}
        user={user}
        onLoginSuccess={handleLoginSuccess}
        onLogout={handleLogout}
        notesCount={verseNotes.length}
        lastReadPosition={lastReadPosition}
        fontSize={fontSize}
        setFontSize={setFontSize}
        pageTheme={pageTheme}
        setPageTheme={setPageTheme}
        themeMode={themeMode}
        setThemeMode={setThemeMode}
        showTajweed={showTajweed}
        setShowTajweed={setShowTajweed}
        showTranslation={showTranslation}
        setShowTranslation={setShowTranslation}
        onStartTour={handleStartTour}
      />

      {/* Split Screen Onboarding & Auth Landing Modal */}
      <AuthLandingModal
        isOpen={isAuthLandingOpen}
        onClose={() => setIsAuthLandingOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        onContinueAsGuest={handleContinueAsGuest}
        initialMessage={authGuardMessage}
      />

      {/* Auth Guard Warning Modal for Guests */}
      <AuthGuardModal
        isOpen={isAuthGuardOpen}
        onClose={() => setIsAuthGuardOpen(false)}
        onOpenAuthModal={() => {
          setIsAuthGuardOpen(false);
          setIsAuthLandingOpen(true);
        }}
        message={authGuardMessage}
      />

      {/* Voice Recorder Modal */}
      <VoiceRecorderModal
        isOpen={isVoiceRecorderOpen}
        onClose={() => setIsVoiceRecorderOpen(false)}
        onSaveRecording={(url, transcript) => {
          setRecordedVoiceUrl(url);
          if (transcript) setRecordedVoiceTranscript(transcript);
          setIsVoiceRecorderOpen(false);
        }}
        title="Ders & Sohbet Ses Kaydı"
        subtitle="Sohbet veya ders için ses kaydı alınıyor"
      />

      {/* Qibla Finder Modal */}
      <QiblaFinderModal
        isOpen={isQiblaModalOpen}
        onClose={() => setIsQiblaModalOpen(false)}
      />

      {/* Riyazus Salihin Hadiths Modal */}
      <RiyazusSalihinModal
        isOpen={isRiyazusModalOpen}
        onClose={() => setIsRiyazusModalOpen(false)}
      />

      {/* Add To Home Screen (PWA) Reminder Prompt */}
      <AddToHomeScreenPrompt />

      {/* Interactive Onboarding Tour */}
      <InteractiveTour
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        activeTab={activeTab}
        onNavigateTab={(tab) => setActiveTab(tab)}
        dontShowAgain={dontShowTourAgain}
        onToggleDontShowAgain={(val) => setDontShowTourAgain(val)}
      />
    </div>
  );
}
