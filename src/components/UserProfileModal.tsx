import React, { useState, useEffect } from 'react';
import { User, LogOut, ShieldCheck, Bookmark, StickyNote, X, Cloud, Sliders, Type, Palette, Eye, Sun, Moon, Monitor, ChevronRight, Sparkles, Check, Download } from 'lucide-react';
import { loginWithGoogle, logoutFirebase } from '../lib/firebase';

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
  fontSize = 'xl',
  setFontSize = (_s) => {},
  pageTheme = 'ivory',
  setPageTheme = (_t) => {},
  themeMode = 'system',
  setThemeMode = (_m) => {},
  showTajweed = true,
  setShowTajweed = (_v) => {},
  showTranslation = true,
  setShowTranslation = (_v) => {},
  onStartTour,
}) => {
  const [activeTab, setActiveTab] = useState<'settings' | 'account'>('settings');
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
        setErrorMessage(err?.message || 'Google ile giriş yapılırken bir hata oluştu.');
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/40 dark:bg-black/70 backdrop-blur-xl animate-fade-in">
      <div className="bg-white/95 dark:bg-stone-900/95 text-stone-900 dark:text-stone-100 border border-stone-200/80 dark:border-stone-800 shadow-2xl rounded-[28px] max-w-lg w-full p-5 sm:p-6 space-y-5 relative overflow-hidden backdrop-blur-2xl max-h-[90vh] flex flex-col justify-between">
        
        {/* Top Header */}
        <div className="flex items-center justify-between shrink-0 pb-1">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 flex items-center justify-center font-bold border border-stone-200 dark:border-stone-700">
              <Sliders className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-stone-900 dark:text-stone-100">
                Ayarlar & Profil
              </h2>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">
                Görünüm, okuma tercihleri ve hesap senkronizasyonu
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-500 dark:text-stone-300 flex items-center justify-center transition-all cursor-pointer"
            title="Kapat (ESC)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* iOS Segmented Navigation Switcher */}
        <div className="p-1 bg-stone-100 dark:bg-stone-800/80 rounded-2xl flex items-center text-xs font-bold shrink-0">
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Tercihler & Tema</span>
          </button>

          <button
            onClick={() => setActiveTab('account')}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'account'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <User className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Hesap & İstatistik</span>
          </button>
        </div>

        {/* Scrollable Main Content */}
        <div className="overflow-y-auto space-y-4 pr-0.5 max-h-[62vh] font-sans">
          {activeTab === 'settings' ? (
            <div className="space-y-4">
              {/* Apple Inset Group 1: Appearance & Theme */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider px-2">
                  Görünüm & Mod
                </span>
                <div className="bg-stone-100/80 dark:bg-stone-800/50 border border-stone-200/80 dark:border-stone-800 rounded-2xl p-3.5 space-y-3.5">
                  {/* Theme Mode iOS Segmented Switch */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-2">
                        <Sun className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        Renk Modu
                      </span>
                      <span className="text-[10px] text-stone-400 dark:text-stone-500">
                        Sistem & Tema
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1 p-1 bg-stone-200/60 dark:bg-stone-900/60 rounded-xl">
                      {[
                        { id: 'light', label: 'Açık', icon: Sun },
                        { id: 'dark', label: 'Koyu', icon: Moon },
                        { id: 'system', label: 'Otomatik', icon: Monitor },
                      ].map((mode) => {
                        const IconComp = mode.icon;
                        const isActive = themeMode === mode.id;
                        return (
                          <button
                            key={mode.id}
                            onClick={() => setThemeMode(mode.id as any)}
                            className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                              isActive
                                ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-sm'
                                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                            }`}
                          >
                            <IconComp className="w-3.5 h-3.5 shrink-0" />
                            <span>{mode.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Mushaf Page Theme Color Swatches */}
                  <div className="space-y-2 pt-2 border-t border-stone-200/60 dark:border-stone-700/60">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-2">
                        <Palette className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        Mushaf Sayfa Zemini
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'ivory', name: 'Fildişi', bg: 'bg-[#FBF9F1] text-stone-900 border-amber-300' },
                        { id: 'mint', name: 'Nane', bg: 'bg-[#F2F7F4] text-emerald-950 border-emerald-300' },
                        { id: 'white', name: 'Beyaz', bg: 'bg-white text-slate-900 border-slate-300' },
                        { id: 'dark', name: 'Gece', bg: 'bg-stone-900 text-amber-100 border-amber-500/50' },
                      ].map((theme) => (
                        <button
                          key={theme.id}
                          onClick={() => setPageTheme(theme.id as any)}
                          className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-between cursor-pointer ${theme.bg} ${
                            pageTheme === theme.id ? 'ring-2 ring-emerald-600 shadow-sm' : 'opacity-80 hover:opacity-100'
                          }`}
                        >
                          <span>{theme.name}</span>
                          {pageTheme === theme.id && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Apple Inset Group 2: Reading & Typography */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider px-2">
                  Okuma & Tipografi
                </span>
                <div className="bg-stone-100/80 dark:bg-stone-800/50 border border-stone-200/80 dark:border-stone-800 rounded-2xl p-3.5 space-y-3.5">
                  {/* Font Size Selector */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-2">
                        <Type className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        Arapça Yazı Boyutu
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { label: 'Orta', value: 'md' },
                        { label: 'Büyük', value: 'lg' },
                        { label: 'Çok Büyük', value: 'xl' },
                        { label: 'Dev', value: '2xl' },
                      ].map((item) => (
                        <button
                          key={item.value}
                          onClick={() => setFontSize(item.value as any)}
                          className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            fontSize === item.value
                              ? 'bg-emerald-700 text-white shadow-sm'
                              : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Smooth iOS Custom Toggles */}
                  <div className="space-y-3 pt-2 border-t border-stone-200/60 dark:border-stone-700/60">
                    {/* Tajweed Switch */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-stone-800 dark:text-stone-200 flex items-center gap-2">
                        <Eye className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        Tecvit Renk Vurguları
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowTajweed(!showTajweed)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          showTajweed ? 'bg-emerald-600' : 'bg-stone-300 dark:bg-stone-700'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            showTajweed ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Translation Switch */}
                    <div className="flex items-center justify-between text-xs pt-2 border-t border-stone-200/60 dark:border-stone-700/60">
                      <span className="font-medium text-stone-800 dark:text-stone-200 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        Ayet Meali Gösterimi
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowTranslation(!showTranslation)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          showTranslation ? 'bg-emerald-600' : 'bg-stone-300 dark:bg-stone-700'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            showTranslation ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Account & Stats Tab */
            <div className="space-y-4">
              {/* Apple ID Style User Card */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider px-2">
                  Kullanıcı Hesabı
                </span>

                {currentUser ? (
                  <div className="bg-stone-900 text-stone-100 rounded-2xl p-4 space-y-3.5 shadow-md border border-stone-800">
                    <div className="flex items-center gap-3.5">
                      <div className="relative shrink-0">
                        <img
                          src={currentUser.avatar}
                          alt={currentUser.name}
                          className="w-13 h-13 rounded-full border-2 border-emerald-500 object-cover"
                        />
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-stone-900" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-white truncate">{currentUser.name}</h3>
                        <p className="text-xs text-stone-400 truncate">{currentUser.email}</p>
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium pt-0.5">
                          <ShieldCheck className="w-3 h-3 text-emerald-400" />
                          Google Hesabı İle Bağlı
                        </span>
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-stone-800 flex items-center justify-between text-xs text-stone-300">
                      <span className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
                        <Cloud className="w-3.5 h-3.5" />
                        Bulut Eşitleme Aktif
                      </span>
                      <button
                        onClick={handleLogout}
                        className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-rose-300 hover:text-rose-200 flex items-center gap-1 text-[11px] font-medium transition-colors cursor-pointer"
                      >
                        <LogOut className="w-3 h-3" />
                        Çıkış Yap
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-stone-100/80 dark:bg-stone-800/50 border border-stone-200/80 dark:border-stone-800 rounded-2xl p-4 text-center space-y-3">
                    <div className="w-11 h-11 rounded-full bg-emerald-100 dark:bg-stone-800 text-emerald-700 dark:text-emerald-400 mx-auto flex items-center justify-center">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-stone-900 dark:text-stone-100">Misafir Modu</p>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 max-w-xs mx-auto">
                        Notlarınızı ve okuma kaldığınız yeri tüm cihazlarınızda eşitlemek için giriş yapabilirsiniz.
                      </p>
                    </div>

                    {/* Error Message */}
                    {errorMessage && (
                      <div className="p-3 bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 rounded-xl text-[11px] font-medium text-left">
                        {errorMessage}
                      </div>
                    )}

                    {/* Domain Error Guidance */}
                    {domainError && (
                      <div className="p-3 bg-amber-50 dark:bg-stone-800 border border-amber-300 dark:border-amber-700 text-amber-950 dark:text-amber-200 rounded-xl text-[11px] text-left space-y-2">
                        <p className="font-bold text-amber-900 dark:text-amber-300">
                          ⚠️ Firebase Domain Yetkilendirmesi
                        </p>
                        <p className="opacity-90">
                          <b>{domainError}</b> domaini Firebase Konsolunda yetkili değil.
                        </p>
                        <div className="bg-white dark:bg-stone-900 p-2 rounded-lg border border-amber-200 dark:border-stone-700 flex items-center justify-between gap-1">
                          <code className="font-mono text-[10px] text-amber-900 dark:text-amber-300 truncate">
                            {domainError}
                          </code>
                          <button
                            type="button"
                            onClick={handleCopyDomain}
                            className="px-2 py-0.5 rounded bg-amber-600 text-white font-bold text-[10px] shrink-0 active:scale-95 cursor-pointer"
                          >
                            {isCopied ? '✓ Kopyalandı' : 'Kopyala'}
                          </button>
                        </div>
                      </div>
                    )}

                    <button
                      disabled={isLoading}
                      onClick={handleSimulatedGoogleLogin}
                      className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      {isLoading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                            <path
                              fill="#4285F4"
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                              fill="#34A853"
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                              fill="#FBBC05"
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                            />
                            <path
                              fill="#EA4335"
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                            />
                          </svg>
                          <span>Google ile Giriş Yap</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Apple Inset Group 3: Stats Summary */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider px-2">
                  Okuma İstatistikleri
                </span>

                <div className="bg-stone-100/80 dark:bg-stone-800/50 border border-stone-200/80 dark:border-stone-800 rounded-2xl p-3.5 divide-y divide-stone-200/60 dark:divide-stone-700/60">
                  <div className="pb-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400">
                        <Bookmark className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="text-[10px] text-stone-500 dark:text-stone-400 font-medium">Son Okunan Yüz</p>
                        <p className="font-bold text-stone-900 dark:text-stone-100">
                          {lastReadPosition ? `${lastReadPosition.surahName}, Ayet ${lastReadPosition.verseNumber}` : 'Mülk Sûresi, 1. Ayet'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400">
                        <StickyNote className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="text-[10px] text-stone-500 dark:text-stone-400 font-medium">Kayıtlı Ders Notları</p>
                        <p className="font-bold text-stone-900 dark:text-stone-100">{notesCount} Not Alındı</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive Tour Item */}
              {onStartTour && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider px-2">
                    Yardım & Rehber
                  </span>
                  <button
                    onClick={() => {
                      onClose();
                      onStartTour();
                    }}
                    className="w-full bg-stone-100/80 dark:bg-stone-800/50 hover:bg-stone-200/80 dark:hover:bg-stone-800 border border-stone-200/80 dark:border-stone-800 rounded-2xl p-3.5 flex items-center justify-between transition-all cursor-pointer text-xs"
                  >
                    <div className="flex items-center gap-2.5 font-bold text-stone-900 dark:text-stone-100">
                      <span className="p-1 rounded-lg bg-emerald-100 dark:bg-stone-700 text-emerald-800 dark:text-emerald-300">
                        🧭
                      </span>
                      <span>İnteraktif Uygulama Turunu Başlat</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-stone-400" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-stone-400 dark:text-stone-500 font-medium">
            Sürüm 2.4 • Apple Sade Tasarım
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
          >
            Tamam
          </button>
        </div>

      </div>
    </div>
  );
};


