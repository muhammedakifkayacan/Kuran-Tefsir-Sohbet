import React, { useState } from 'react';
import { User, LogOut, ShieldCheck, Bookmark, StickyNote, X, Cloud, Sliders, Type, Palette, Eye } from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  notesCount: number;
  lastReadPosition: { surahName: string; verseNumber: number; pageNumber: number } | null;
  fontSize?: 'md' | 'lg' | 'xl' | '2xl';
  setFontSize?: (size: 'md' | 'lg' | 'xl' | '2xl') => void;
  pageTheme?: 'ivory' | 'mint' | 'white' | 'dark';
  setPageTheme?: (theme: 'ivory' | 'mint' | 'white' | 'dark') => void;
  showTajweed?: boolean;
  setShowTajweed?: (val: boolean) => void;
  showTranslation?: boolean;
  setShowTranslation?: (val: boolean) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  notesCount,
  lastReadPosition,
  fontSize = 'xl',
  setFontSize = (_s) => {},
  pageTheme = 'ivory',
  setPageTheme = (_t) => {},
  showTajweed = true,
  setShowTajweed = (_v) => {},
  showTranslation = true,
  setShowTranslation = (_v) => {},
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'settings'>('profile');
  const [user, setUser] = useState<{ name: string; email: string; avatar: string } | null>(() => {
    const saved = localStorage.getItem('kuran_user_profile');
    return saved ? JSON.parse(saved) : null;
  });

  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSimulatedGoogleLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      const mockUser = {
        name: 'Ahmet Yılmaz',
        email: 'ahmet.yilmaz@gmail.com',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      };
      setUser(mockUser);
      localStorage.setItem('kuran_user_profile', JSON.stringify(mockUser));
      setIsLoading(false);
    }, 800);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('kuran_user_profile');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-fade-in">
      <div className="bg-white/95 text-stone-900 border border-white/60 shadow-2xl rounded-[32px] max-w-md w-full p-6 space-y-5 relative overflow-hidden backdrop-blur-2xl">
        
        {/* Apple Style Top Glow */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-emerald-500 to-amber-600" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 hover:text-stone-800 flex items-center justify-center transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 border border-amber-200 flex items-center justify-center font-bold">
            <User className="w-5 h-5 text-amber-800" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-stone-900">
              Kullanıcı Hesabı & Ayarlar
            </h2>
            <p className="text-xs text-stone-500">
              Profil bilgileri, yazı boyutu ve sayfa teması
            </p>
          </div>
        </div>

        {/* Navigation Switcher Tabs */}
        <div className="flex items-center p-1 bg-stone-100 rounded-2xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'profile'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <User className="w-3.5 h-3.5 text-amber-600" />
            <span>Profil & İstatistik</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'settings'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-amber-600" />
            <span>Okuma Ayarları</span>
          </button>
        </div>

        {activeTab === 'profile' ? (
          <>
            {/* User Card */}
            {user ? (
              <div className="bg-gradient-to-br from-stone-900 to-stone-800 text-stone-100 rounded-2xl p-4 space-y-3 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-12 h-12 rounded-full border-2 border-amber-400 object-cover"
                    />
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-stone-900" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-white truncate">{user.name}</h3>
                    <p className="text-xs text-stone-300 truncate">{user.email}</p>
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
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-700 mx-auto flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-stone-900">Misafir Kullanıcı</p>
                  <p className="text-[11px] text-stone-500">
                    Notlarınızı ve okuma geçmişinizi tüm cihazlarınızda eşitlemek için giriş yapın.
                  </p>
                </div>

                <button
                  disabled={isLoading}
                  onClick={handleSimulatedGoogleLogin}
                  className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 disabled:opacity-50"
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
              <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                Okuma & Ders İstatistikleri
              </p>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 flex items-center gap-2.5">
                  <Bookmark className="w-4 h-4 text-amber-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-stone-500 font-medium">Son Konum</p>
                    <p className="text-xs font-bold text-stone-900 truncate">
                      {lastReadPosition ? lastReadPosition.surahName : 'Mülk Sûresi'}
                    </p>
                  </div>
                </div>

                <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 flex items-center gap-2.5">
                  <StickyNote className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-[10px] text-stone-500 font-medium">Alınan Notlar</p>
                    <p className="text-xs font-bold text-stone-900">{notesCount} Adet</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Settings Tab */
          <div className="space-y-4 animate-fade-in">
            {/* Arabic Font Size Setting */}
            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-stone-900">
                <Type className="w-4 h-4 text-amber-600" />
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
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      fontSize === item.value
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Page Theme Setting */}
            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-stone-900">
                <Palette className="w-4 h-4 text-amber-600" />
                <span>Mushaf Sayfa Teması (Sade & Aydınlık)</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'ivory', name: 'Fildişi', bg: 'bg-[#FBF9F1] text-stone-900 border-amber-300' },
                  { id: 'mint', name: 'Nane', bg: 'bg-[#F2F7F4] text-emerald-950 border-emerald-300' },
                  { id: 'white', name: 'Beyaz', bg: 'bg-white text-slate-900 border-slate-300' },
                ].map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setPageTheme(theme.id as any)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1 ${theme.bg} ${
                      pageTheme === theme.id ? 'ring-2 ring-amber-500 shadow-sm' : 'opacity-80'
                    }`}
                  >
                    <span>{theme.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Toggles */}
            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3.5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-stone-900">
                <Eye className="w-4 h-4 text-amber-600" />
                <span>Görünüm Seçenekleri</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-700 font-medium">Tecvit Renk Vurguları</span>
                <input
                  type="checkbox"
                  checked={showTajweed}
                  onChange={(e) => setShowTajweed(e.target.checked)}
                  className="w-4 h-4 accent-amber-600 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-stone-200">
                <span className="text-stone-700 font-medium">Ayet Meali Gösterimi</span>
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
        <div className="pt-2 border-t border-stone-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs transition-colors"
          >
            Tamam
          </button>
        </div>

      </div>
    </div>
  );
};

