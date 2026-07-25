import React, { useState } from 'react';
import { User, LogOut, ShieldCheck, Bookmark, StickyNote, X, Cloud, Sliders, Type, Palette, Eye, Sun, Moon, Monitor } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'profile' | 'settings'>('profile');
  const [localUser, setLocalUser] = useState<{ name: string; email: string; avatar: string } | null>(() => {
    const saved = localStorage.getItem('kuran_user_profile');
    return saved ? JSON.parse(saved) : null;
  });

  const currentUser = userProp !== undefined ? userProp : localUser;

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [domainError, setDomainError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-md animate-fade-in">
      <div className="bg-white/95 dark:bg-stone-900/95 text-stone-900 dark:text-stone-100 border border-white/60 dark:border-stone-800 shadow-2xl rounded-[32px] max-w-md w-full p-6 space-y-5 relative overflow-hidden backdrop-blur-2xl">
        
        {/* Apple Style Top Glow */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-emerald-500 to-amber-600" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-500 dark:text-stone-300 hover:text-stone-800 flex items-center justify-center transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-stone-800 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-stone-700 flex items-center justify-center font-bold">
            <User className="w-5 h-5 text-amber-800 dark:text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-stone-900 dark:text-stone-100">
              Kullanıcı Hesabı & Ayarlar
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Profil bilgileri, tema modu, yazı boyutu ve sayfa teması
            </p>
          </div>
        </div>

        {/* Navigation Switcher Tabs */}
        <div className="flex items-center p-1 bg-stone-100 dark:bg-stone-800/80 rounded-2xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <User className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Profil & İstatistik</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Okuma & Tema Ayarları</span>
          </button>
        </div>

        {activeTab === 'profile' ? (
          <>
            {/* User Card */}
            {currentUser ? (
              <div className="bg-gradient-to-br from-stone-900 to-stone-800 text-stone-100 rounded-2xl p-4 space-y-3 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-12 h-12 rounded-full border-2 border-amber-400 object-cover"
                    />
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-stone-900" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-white truncate">{currentUser.name}</h3>
                    <p className="text-xs text-stone-300 truncate">{currentUser.email}</p>
                    <span className="inline-flex items-center gap-1 text-[10px] text-amber-300 font-medium pt-0.5">
                      <ShieldCheck className="w-3 h-3 text-amber-400" />
                      Google Hesabı İle Bağlı
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-700/80 flex items-center justify-between text-xs text-stone-300">
                  <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                    <Cloud className="w-3.5 h-3.5" />
                    Bulut Senkronize Aktif
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-stone-400 hover:text-rose-300 flex items-center gap-1 text-[11px] font-medium transition-colors"
                  >
                    <LogOut className="w-3 h-3" />
                    Çıkış Yap
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 rounded-2xl p-4 text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-stone-800 text-amber-700 dark:text-amber-400 mx-auto flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-stone-900 dark:text-stone-100">Misafir Kullanıcı</p>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">
                    Notlarınızı ve okuma geçmişinizi tüm cihazlarınızda eşitlemek için giriş yapın.
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
                      ⚠️ Firebase Domain Yetkilendirmesi Gerekli
                    </p>
                    <p className="opacity-90">
                      <b>{domainError}</b> adresi Firebase Authorized Domains listesinde yok.
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
                  className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                      <span>Google İle Giriş Yap</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* User Stats Summary */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                Okuma & Ders İstatistikleri
              </p>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 rounded-xl p-3 flex items-center gap-2.5">
                  <Bookmark className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-stone-500 dark:text-stone-400 font-medium">Son Konum</p>
                    <p className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                      {lastReadPosition ? lastReadPosition.surahName : 'Mülk Sûresi'}
                    </p>
                  </div>
                </div>

                <div className="bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 rounded-xl p-3 flex items-center gap-2.5">
                  <StickyNote className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-[10px] text-stone-500 dark:text-stone-400 font-medium">Alınan Notlar</p>
                    <p className="text-xs font-bold text-stone-900 dark:text-stone-100">{notesCount} Adet</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Tour Launcher Button */}
            {onStartTour && (
              <button
                onClick={() => {
                  onClose();
                  onStartTour();
                }}
                className="w-full py-3 px-4 rounded-2xl bg-amber-50 dark:bg-stone-800/90 hover:bg-amber-100 dark:hover:bg-stone-700 text-amber-950 dark:text-amber-200 border border-amber-200/90 dark:border-stone-700 text-xs font-bold flex items-center justify-between shadow-2xs active:scale-95 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-amber-500 text-stone-950 flex items-center justify-center font-bold text-xs">
                    🧭
                  </span>
                  <span>Interaktif Uygulama Turu (Rehber)</span>
                </div>
                <span className="text-[10px] bg-amber-200/80 dark:bg-amber-900/80 px-2 py-0.5 rounded-full font-extrabold text-amber-900 dark:text-amber-200">
                  Başlat ➔
                </span>
              </button>
            )}
          </>
        ) : (
          /* Settings Tab */
          <div className="space-y-4 animate-fade-in">
            {/* Theme Mode Setting (Açık / Koyu / Sistem) */}
            <div className="bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/80 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-stone-900 dark:text-stone-100">
                <Sun className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Uygulama Görünüm Teması</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
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
                      className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        isActive
                          ? 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-500'
                          : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700'
                      }`}
                    >
                      <IconComp className="w-3.5 h-3.5 shrink-0" />
                      <span>{mode.label}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-stone-500 dark:text-stone-400 font-medium pt-0.5">
                * Otomatik mod, telefonunuzun / bilgisayarınızın sistem renk moduna göre uyarlanır.
              </p>
            </div>

            {/* Arabic Font Size Setting */}
            <div className="bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/80 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-stone-900 dark:text-stone-100">
                <Type className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Arapça Yazı Boyutu</span>
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
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Page Theme Setting */}
            <div className="bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/80 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-stone-900 dark:text-stone-100">
                <Palette className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Mushaf Sayfa Zemini Teması</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'ivory', name: 'Fildişi', bg: 'bg-[#FBF9F1] text-stone-900 border-amber-300' },
                  { id: 'mint', name: 'Nane', bg: 'bg-[#F2F7F4] text-emerald-950 border-emerald-300' },
                  { id: 'white', name: 'Beyaz', bg: 'bg-white text-slate-900 border-slate-300' },
                  { id: 'dark', name: 'Gece (Koyu)', bg: 'bg-stone-900 text-amber-100 border-amber-500/50' },
                ].map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setPageTheme(theme.id as any)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1 cursor-pointer ${theme.bg} ${
                      pageTheme === theme.id ? 'ring-2 ring-amber-500 shadow-sm scale-105' : 'opacity-80 hover:opacity-100'
                    }`}
                  >
                    <span>{theme.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Toggles */}
            <div className="bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/80 rounded-2xl p-3.5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-stone-900 dark:text-stone-100">
                <Eye className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Görünüm Seçenekleri</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-700 dark:text-stone-300 font-medium">Tecvit Renk Vurguları</span>
                <input
                  type="checkbox"
                  checked={showTajweed}
                  onChange={(e) => setShowTajweed(e.target.checked)}
                  className="w-4 h-4 accent-amber-600 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-stone-200 dark:border-stone-700">
                <span className="text-stone-700 dark:text-stone-300 font-medium">Ayet Meali Gösterimi</span>
                <input
                  type="checkbox"
                  checked={showTranslation}
                  onChange={(e) => setShowTranslation(e.target.checked)}
                  className="w-4 h-4 accent-amber-600 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 border-t border-stone-200 dark:border-stone-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-bold text-xs transition-colors cursor-pointer"
          >
            Tamam
          </button>
        </div>

      </div>
    </div>
  );
};

