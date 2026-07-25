import React, { useState, useEffect } from 'react';
import { User, LogOut, Bookmark, StickyNote, X, Type, Palette, Eye, Sun, Moon, Monitor, ChevronRight, Sparkles, Check } from 'lucide-react';
import { loginWithGoogle, logoutFirebase } from '../lib/firebase';
import { useSettings } from '../context/SettingsContext';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: { name: string; email: string; avatar: string } | null;
  onLoginSuccess?: (user: { name: string; email: string; avatar: string }) => void;
  onLogout?: () => void;
  notesCount: number;
  lastReadPosition: { surahName: string; verseNumber: number; pageNumber: number } | null;
  fontSize?: 'md' | 'lg' | 'xl' | '2xl';
  setFontSize?: (size: 'md' | 'lg' | 'xl' | '2xl') => void;
  pageTheme?: 'ivory' | 'mint' | 'white' | 'dark';
  setPageTheme?: (theme: 'ivory' | 'mint' | 'white' | 'dark') => void;
  themeMode?: 'light' | 'dark' | 'system';
  setThemeMode?: (mode: 'light' | 'dark' | 'system') => void;
  showTajweed?: boolean;
  setShowTajweed?: (val: boolean) => void;
  showTranslation?: boolean;
  setShowTranslation?: (val: boolean) => void;
  onStartTour?: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  user: userProp,
  onLoginSuccess,
  onLogout,
  notesCount,
  lastReadPosition,
  fontSize: propFontSize,
  setFontSize: propSetFontSize,
  pageTheme: propPageTheme,
  setPageTheme: propSetPageTheme,
  themeMode: propThemeMode,
  setThemeMode: propSetThemeMode,
  showTajweed: propShowTajweed,
  setShowTajweed: propSetShowTajweed,
  showTranslation: propShowTranslation,
  setShowTranslation: propSetShowTranslation,
  onStartTour,
}) => {
  const settings = useSettings();

  const fontSize = propFontSize !== undefined ? propFontSize : settings.fontSize;
  const setFontSize = (size: 'md' | 'lg' | 'xl' | '2xl') => {
    settings.setFontSize(size);
    if (propSetFontSize) propSetFontSize(size);
  };

  const pageTheme = propPageTheme !== undefined ? propPageTheme : settings.pageTheme;
  const setPageTheme = (theme: 'ivory' | 'mint' | 'white' | 'dark') => {
    settings.setPageTheme(theme);
    if (propSetPageTheme) propSetPageTheme(theme);
  };

  const themeMode = propThemeMode !== undefined ? propThemeMode : settings.themeMode;
  const setThemeMode = (mode: 'light' | 'dark' | 'system') => {
    settings.setThemeMode(mode);
    if (propSetThemeMode) propSetThemeMode(mode);
  };

  const showTajweed = propShowTajweed !== undefined ? propShowTajweed : settings.showTajweed;
  const setShowTajweed = (val: boolean) => {
    settings.setShowTajweed(val);
    if (propSetShowTajweed) propSetShowTajweed(val);
  };

  const showTranslation = propShowTranslation !== undefined ? propShowTranslation : settings.showTranslation;
  const setShowTranslation = (val: boolean) => {
    settings.setShowTranslation(val);
    if (propSetShowTranslation) propSetShowTranslation(val);
  };

  const [localUser, setLocalUser] = useState<{ name: string; email: string; avatar: string } | null>(() => {
    const saved = localStorage.getItem('kuran_user_profile');
    return saved ? JSON.parse(saved) : null;
  });

  const currentUser = userProp !== undefined ? userProp : localUser;

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [domainError, setDomainError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Close modal on ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Escape' || e.key === 'Esc') && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopyDomain = () => {
    const domain = window.location.hostname;
    navigator.clipboard.writeText(domain);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSimulatedGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setDomainError(null);
    try {
      const firebaseUser = await loginWithGoogle();
      if (firebaseUser) {
        const realUser = {
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Kullanıcı',
          email: firebaseUser.email || '',
          avatar: firebaseUser.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(firebaseUser.displayName || firebaseUser.email || 'Kullanici')}`,
        };
        setLocalUser(realUser);
        onLoginSuccess?.(realUser);
        localStorage.setItem('kuran_user_profile', JSON.stringify(realUser));
        localStorage.removeItem('kuran_app_guest_mode');
      }
    } catch (err: any) {
      console.error("Google login error:", err);
      if (
        err?.code === 'auth/unauthorized-domain' ||
        err?.code === 'auth/operation-not-allowed' ||
        err?.message?.includes('unauthorized-domain') ||
        err?.message?.includes('unauthorized domain')
      ) {
        setDomainError(window.location.hostname);
      } else {
        setErrorMessage(err?.message || 'Giriş yapılırken bir hata oluştu.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutFirebase();
    } catch (err) {
      console.error("Logout error:", err);
    }
    setLocalUser(null);
    onLogout?.();
    localStorage.removeItem('kuran_user_profile');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-profile-modal-title"
      aria-describedby="user-profile-modal-desc"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/40 dark:bg-black/70 backdrop-blur-md animate-fade-in"
    >
      <div className="bg-stone-50/95 dark:bg-stone-900/95 text-stone-900 dark:text-stone-100 border border-stone-200/80 dark:border-stone-800 shadow-2xl rounded-[28px] max-w-md w-full p-5 space-y-4 relative overflow-hidden backdrop-blur-2xl max-h-[85vh] flex flex-col justify-between">
        <p id="user-profile-modal-desc" className="sr-only">
          Profil, hesap yönetimi ve okuma tercihlerini ayarlayabileceğiniz pencere.
        </p>

        {/* Header */}
        <div className="flex items-center justify-between shrink-0 px-1 pt-1">
          <h2
            id="user-profile-modal-title"
            className="text-lg font-extrabold tracking-tight text-stone-900 dark:text-stone-100"
          >
            Ayarlar
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Ayarlar penceresini kapat"
            className="w-7 h-7 rounded-full bg-stone-200/70 dark:bg-stone-800 hover:bg-stone-300/80 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 flex items-center justify-center transition-all cursor-pointer"
            title="Kapat"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Unified Apple-Style Grouped List */}
        <div className="overflow-y-auto space-y-4 pr-0.5 font-sans flex-1">
          
          {/* Profile Card */}
          <div
            aria-label="Kullanıcı profili ve hesap durumu"
            className="bg-white dark:bg-stone-800/80 border border-stone-200/70 dark:border-stone-700/60 rounded-2xl p-3.5 flex items-center justify-between shadow-2xs"
          >
            {currentUser ? (
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={currentUser.avatar}
                  alt={`${currentUser.name} profil resmi`}
                  className="w-10 h-10 rounded-full object-cover border border-stone-200 dark:border-stone-700 shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">{currentUser.name}</p>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">{currentUser.email}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div
                  aria-hidden="true"
                  className="w-10 h-10 rounded-full bg-stone-100 dark:bg-stone-700 flex items-center justify-center text-stone-500 dark:text-stone-300 shrink-0"
                >
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-stone-900 dark:text-stone-100">Hesap Açılmadı</p>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">Misafir Modu</p>
                </div>
              </div>
            )}

            {currentUser ? (
              <button
                type="button"
                onClick={handleLogout}
                aria-label="Hesaptan çıkış yap"
                className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/80 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Çıkış</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={isLoading}
                onClick={handleSimulatedGoogleLogin}
                aria-label="Google hesabı ile giriş yap"
                className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <div
                    role="status"
                    aria-label="Giriş yapılıyor"
                    className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"
                  />
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        fill="#FFFFFF"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#FFFFFF"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FFFFFF"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#FFFFFF"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Giriş Yap</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Conditional Error Messages */}
          {errorMessage && (
            <div
              role="alert"
              aria-live="polite"
              className="p-3 bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 rounded-xl text-xs font-medium"
            >
              {errorMessage}
            </div>
          )}

          {domainError && (
            <div
              role="alert"
              aria-live="polite"
              className="p-3 bg-amber-50 dark:bg-stone-800 border border-amber-300 dark:border-amber-700 text-amber-950 dark:text-amber-200 rounded-xl text-xs space-y-2"
            >
              <p className="font-bold">Domain yetkilendirmesi gerekli: {domainError}</p>
              <button
                type="button"
                onClick={handleCopyDomain}
                aria-label="Domain adını panoya kopyala"
                className="px-2.5 py-1 rounded bg-amber-600 text-white font-bold text-xs cursor-pointer"
              >
                {isCopied ? 'Kopyalandı' : 'Domaini Kopyala'}
              </button>
            </div>
          )}

          {/* Group 1: Görünüm & Tema */}
          <div className="space-y-1">
            <span
              id="group-appearance-title"
              className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider px-2"
            >
              Görünüm
            </span>
            <div
              role="region"
              aria-labelledby="group-appearance-title"
              className="bg-white dark:bg-stone-800/80 border border-stone-200/70 dark:border-stone-700/60 rounded-2xl p-3 space-y-3 shadow-2xs"
            >
              
              {/* Renk Modu */}
              <div className="flex items-center justify-between text-xs">
                <span id="theme-mode-label" className="font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-2">
                  <Sun className="w-4 h-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                  Tema Modu
                </span>
                <div
                  role="radiogroup"
                  aria-labelledby="theme-mode-label"
                  className="inline-flex p-0.5 bg-stone-100 dark:bg-stone-900 rounded-xl border border-stone-200/80 dark:border-stone-700"
                >
                  {[
                    { id: 'light', label: 'Açık', icon: Sun },
                    { id: 'dark', label: 'Koyu', icon: Moon },
                    { id: 'system', label: 'Oto', icon: Monitor },
                  ].map((mode) => {
                    const IconComp = mode.icon;
                    const isActive = themeMode === mode.id;
                    return (
                      <button
                        type="button"
                        key={mode.id}
                        role="radio"
                        aria-checked={isActive}
                        aria-label={`Tema modu: ${mode.label}`}
                        onClick={() => setThemeMode(mode.id as any)}
                        className={`py-1 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                          isActive
                            ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-2xs'
                            : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                        }`}
                      >
                        <IconComp className="w-3 h-3 shrink-0" aria-hidden="true" />
                        <span>{mode.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mushaf Zemin Rengi */}
              <div className="flex items-center justify-between text-xs pt-2.5 border-t border-stone-100 dark:border-stone-700/50">
                <span id="page-theme-label" className="font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                  Sayfa Zemini
                </span>
                <div
                  role="radiogroup"
                  aria-labelledby="page-theme-label"
                  className="flex items-center gap-1.5"
                >
                  {[
                    { id: 'ivory', name: 'Fildişi', bg: 'bg-[#FBF9F1] border-amber-300' },
                    { id: 'mint', name: 'Nane', bg: 'bg-[#F2F7F4] border-emerald-300' },
                    { id: 'white', name: 'Beyaz', bg: 'bg-white border-slate-300' },
                    { id: 'dark', name: 'Gece', bg: 'bg-stone-900 border-stone-600' },
                  ].map((theme) => (
                    <button
                      type="button"
                      key={theme.id}
                      role="radio"
                      aria-checked={pageTheme === theme.id}
                      aria-label={`Sayfa zemin rengi: ${theme.name}`}
                      onClick={() => setPageTheme(theme.id as any)}
                      title={theme.name}
                      className={`w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center cursor-pointer ${theme.bg} ${
                        pageTheme === theme.id ? 'ring-2 ring-emerald-600 ring-offset-1 dark:ring-offset-stone-800 scale-110' : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      {pageTheme === theme.id && <Check className="w-3 h-3 text-emerald-700 dark:text-emerald-400 shrink-0" aria-hidden="true" />}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* Group 2: Okuma & Metin */}
          <div className="space-y-1">
            <span
              id="group-reading-title"
              className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider px-2"
            >
              Okuma Tercihleri
            </span>
            <div
              role="region"
              aria-labelledby="group-reading-title"
              className="bg-white dark:bg-stone-800/80 border border-stone-200/70 dark:border-stone-700/60 rounded-2xl p-3 space-y-3 shadow-2xs"
            >
              
              {/* Yazı Boyutu */}
              <div className="flex items-center justify-between text-xs">
                <span id="font-size-label" className="font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-2">
                  <Type className="w-4 h-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                  Arapça Font
                </span>
                <div
                  role="radiogroup"
                  aria-labelledby="font-size-label"
                  className="inline-flex p-0.5 bg-stone-100 dark:bg-stone-900 rounded-xl border border-stone-200/80 dark:border-stone-700"
                >
                  {[
                    { label: 'Orta', value: 'md' },
                    { label: 'Büyük', value: 'lg' },
                    { label: 'İri', value: 'xl' },
                    { label: 'Dev', value: '2xl' },
                  ].map((item) => (
                    <button
                      type="button"
                      key={item.value}
                      role="radio"
                      aria-checked={fontSize === item.value}
                      aria-label={`Arapça yazı boyutu: ${item.label}`}
                      onClick={() => setFontSize(item.value as any)}
                      className={`py-1 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        fontSize === item.value
                          ? 'bg-emerald-700 text-white shadow-2xs'
                          : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tecvit Switch */}
              <div className="flex items-center justify-between text-xs pt-2.5 border-t border-stone-100 dark:border-stone-700/50">
                <span id="tajweed-switch-label" className="font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                  Tecvit Renkleri
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={showTajweed}
                  aria-labelledby="tajweed-switch-label"
                  aria-label="Tecvit renklerini göster veya gizle"
                  onClick={() => setShowTajweed(!showTajweed)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    showTajweed ? 'bg-emerald-600' : 'bg-stone-300 dark:bg-stone-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      showTajweed ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Meal Switch */}
              <div className="flex items-center justify-between text-xs pt-2.5 border-t border-stone-100 dark:border-stone-700/50">
                <span id="translation-switch-label" className="font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                  Ayet Mealleri
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={showTranslation}
                  aria-labelledby="translation-switch-label"
                  aria-label="Ayet meallerini göster veya gizle"
                  onClick={() => setShowTranslation(!showTranslation)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    showTranslation ? 'bg-emerald-600' : 'bg-stone-300 dark:bg-stone-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      showTranslation ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

            </div>
          </div>

          {/* Group 3: İstatistikler */}
          <div className="space-y-1">
            <span
              id="group-stats-title"
              className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider px-2"
            >
              Okuma Durumu
            </span>
            <div
              role="region"
              aria-labelledby="group-stats-title"
              className="bg-white dark:bg-stone-800/80 border border-stone-200/70 dark:border-stone-700/60 rounded-2xl p-3 divide-y divide-stone-100 dark:divide-stone-700/50 text-xs shadow-2xs"
            >
              <div className="pb-2 flex items-center justify-between">
                <span className="text-stone-500 dark:text-stone-400 font-medium flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                  Kaldığınız Yer
                </span>
                <span className="font-bold text-stone-900 dark:text-stone-100">
                  {lastReadPosition ? `${lastReadPosition.surahName}, ${lastReadPosition.verseNumber}. Ayet` : 'Mülk Sûresi'}
                </span>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-stone-500 dark:text-stone-400 font-medium flex items-center gap-2">
                  <StickyNote className="w-4 h-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                  Ders Notlarınız
                </span>
                <span className="font-bold text-stone-900 dark:text-stone-100">
                  {notesCount} Adet
                </span>
              </div>
            </div>
          </div>

          {/* Group 4: Rehber (Optional) */}
          {onStartTour && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onStartTour();
              }}
              aria-label="İnteraktif uygulama turunu başlat"
              className="w-full bg-white dark:bg-stone-800/80 hover:bg-stone-100 dark:hover:bg-stone-700/80 border border-stone-200/70 dark:border-stone-700/60 rounded-2xl p-3 flex items-center justify-between transition-all cursor-pointer text-xs shadow-2xs"
            >
              <span className="font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-2">
                <span aria-hidden="true">🧭</span> Uygulama Turunu Başlat
              </span>
              <ChevronRight className="w-4 h-4 text-stone-400" aria-hidden="true" />
            </button>
          )}

        </div>

      </div>
    </div>
  );
};
