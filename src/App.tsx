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
import { useSettings } from './context/SettingsContext';

import { NavTab, Surah, Ayah, VerseNote, Reciter, SohbetSession } from './types';
import { QURAN_SURAHS, RECITERS } from './data/quranData';
import { INITIAL_SOHBET_SESSIONS } from './data/sohbetData';
import { fetchSurahFromApi } from './utils/quranApi';
import { auth } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { loadUserData, saveUserSohbets, saveUserNotes, saveUserLastRead } from './lib/userSync';

export default function App() {
  const {
    fontSize,
    setFontSize,
    pageTheme,
    setPageTheme,
    themeMode,
    setThemeMode,
    showTajweed,
    setShowTajweed,
    showTranslation,
    setShowTranslation,
  } = useSettings();

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

  // Online / Offline Network Status State
  const [isOffline, setIsOffline] = useState<boolean>(() => typeof navigator !== 'undefined' ? !navigator.onLine : false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

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
    loadUserData(null).then((data) => {
      setSohbetSessions(data.sohbets);
      setVerseNotes(data.notes);
      setLastReadPosition(data.lastRead);
    });
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

  // Full Screen Mode
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);

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

  // Active Tab - Persisted in localStorage
  const [activeTab, setActiveTab] = useState<NavTab>(() => {
    try {
      const saved = localStorage.getItem('kuran_active_tab');
      if (saved && ['home', 'quran', 'sohbet', 'hatim', 'ezan', 'dualar', 'meal-karsilastir', 'notes', 'tarteel', 'saved'].includes(saved)) {
        return saved as NavTab;
      }
    } catch (e) {}
    return 'home';
  });

  useEffect(() => {
    try {
      localStorage.setItem('kuran_active_tab', activeTab);
    } catch (e) {}
  }, [activeTab]);

  // Qibla & Riyazus Modals
  const [isQiblaModalOpen, setIsQiblaModalOpen] = useState<boolean>(false);
  const [isRiyazusModalOpen, setIsRiyazusModalOpen] = useState<boolean>(false);

  // Automatically exit full screen reading mode when leaving Quran tab
  useEffect(() => {
    if (activeTab !== 'quran') {
      setIsFullScreen(false);
    }
  }, [activeTab]);

  // Quran Reader State - Restores last selected surah from localStorage
  const [selectedSurah, setSelectedSurah] = useState<Surah>(() => {
    try {
      const savedLastRead = localStorage.getItem('kuran_last_read');
      if (savedLastRead) {
        const parsed = JSON.parse(savedLastRead);
        if (parsed.surahId) {
          const found = QURAN_SURAHS.find((s) => s.id === parsed.surahId);
          if (found) return found;
        }
      }
      const savedSurahId = localStorage.getItem('kuran_selected_surah_id');
      if (savedSurahId) {
        const found = QURAN_SURAHS.find((s) => s.id === Number(savedSurahId));
        if (found) return found;
      }
    } catch (e) {}
    return QURAN_SURAHS[0];
  });

  // Restore full surah data on initial load if selected surah is not pre-loaded Fatiha
  useEffect(() => {
    if (selectedSurah && selectedSurah.id > 1) {
      loadSurah(selectedSurah.id);
    }
  }, []);
  const [isLoadingSurah, setIsLoadingSurah] = useState<boolean>(false);
  const [surahError, setSurahError] = useState<string | null>(null);
  const [activeAyah, setActiveAyah] = useState<Ayah | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [selectedReciter, setSelectedReciter] = useState<Reciter>(RECITERS[0]);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);

  // Sohbet Sessions & Verse Notes State
  const [sohbetSessions, setSohbetSessions] = useState<SohbetSession[]>([]);
  const [verseNotes, setVerseNotes] = useState<VerseNote[]>([]);

  // Voice Recorder Modal State
  const [isVoiceRecorderOpen, setIsVoiceRecorderOpen] = useState(false);
  const [recordedVoiceUrl, setRecordedVoiceUrl] = useState<string | null>(null);
  const [recordedVoiceTranscript, setRecordedVoiceTranscript] = useState<string>('');

  // Target verse auto-highlight state
  const [targetVerseNumber, setTargetVerseNumber] = useState<number | null>(null);

  // User Data Sync Effect (Firestore + User-Scoped Local Storage)
  useEffect(() => {
    let isMounted = true;
    const currentUid = auth.currentUser?.uid || null;
    loadUserData(currentUid).then((data) => {
      if (isMounted) {
        setSohbetSessions(data.sohbets);
        setVerseNotes(data.notes);
        if (data.lastRead) setLastReadPosition(data.lastRead);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [user?.email, auth.currentUser?.uid]);

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
    const updated = [newNote, ...verseNotes];
    setVerseNotes(updated);
    saveUserNotes(updated, auth.currentUser?.uid);
  };

  const handleDeleteNote = (id: string) => {
    const updated = verseNotes.filter((n) => n.id !== id);
    setVerseNotes(updated);
    saveUserNotes(updated, auth.currentUser?.uid);
  };

  const handleAddSohbetSession = (newSohbet: SohbetSession) => {
    const updated = [newSohbet, ...sohbetSessions];
    setSohbetSessions(updated);
    saveUserSohbets(updated, auth.currentUser?.uid);
  };

  const handleUpdateSohbetSession = (updatedSession: SohbetSession) => {
    const updated = sohbetSessions.map((s) => (s.id === updatedSession.id ? updatedSession : s));
    setSohbetSessions(updated);
    saveUserSohbets(updated, auth.currentUser?.uid);
  };

  const handleDeleteSohbetSession = (id: string) => {
    const updated = sohbetSessions.filter((s) => s.id !== id);
    setSohbetSessions(updated);
    saveUserSohbets(updated, auth.currentUser?.uid);
  };

  const handleResumeReading = (surahId: number, pageNumber?: number) => {
    loadSurah(surahId);
    setActiveTab('quran');
  };

  const handleImportNotes = (importedNotes: VerseNote[], mode: 'merge' | 'replace') => {
    let updated: VerseNote[];
    if (mode === 'replace') {
      updated = importedNotes;
    } else {
      const existingIds = new Set(verseNotes.map((n) => n.id));
      const newItems = importedNotes.filter((n) => !existingIds.has(n.id));
      updated = [...newItems, ...verseNotes];
    }
    setVerseNotes(updated);
    saveUserNotes(updated, auth.currentUser?.uid);
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
        if (activeTab === 'quran' && selectedSurah) {
          loadSurah(selectedSurah.id);
        }
        setIsRefreshing(false);
        setPullDistance(0);
      }, 500);
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
        {/* App Top Header - Shown on all tabs; hides in full screen when overlays are hidden */}
        <div className={`sticky top-0 z-50 transition-all ${isFullScreen && !areOverlaysVisible ? 'hidden' : ''}`}>
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
            isFullScreen={isFullScreen}
            setIsFullScreen={setIsFullScreen}
          />
        </div>

        {/* Offline Network Warning Bar */}
        {isOffline && (
          <div className="bg-amber-800/95 dark:bg-amber-950/95 text-amber-100 text-xs font-semibold py-2 px-3 text-center flex items-center justify-center gap-2 border-b border-amber-700/80 shadow-xs z-40 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
            <span className="leading-snug">
              <strong>Çevrim Dışı Mod:</strong> İnternet bağlantınız yok ancak uygulamanız ve önbellekteki Kur'an / ders notlarınız çalışıyor!
            </span>
          </div>
        )}

        {/* Scrollable View Content Area */}
        <main className={`flex-1 overflow-y-auto overflow-x-hidden w-full max-w-5xl mx-auto ${
          activeTab === 'quran' ? 'px-0 sm:px-4 pb-6 sm:pb-36' : 'px-2 sm:px-4 pb-28 sm:pb-36'
        } relative`}>
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
                  onNavigateTab={(tab) => setActiveTab(tab)}
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

        {/* Native Mobile Bottom Navigation - Shown on all tabs; hides in full screen when overlays are hidden */}
        {(!isFullScreen || areOverlaysVisible) && (
          <BottomNav
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            unresolvedNotesCount={verseNotes.length}
            isFullScreen={isFullScreen}
            setIsFullScreen={setIsFullScreen}
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
