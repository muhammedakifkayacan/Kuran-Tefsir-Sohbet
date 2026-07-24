import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, BookOpen, Mic, StickyNote, ShieldCheck, Eye, X, CheckCircle2, ChevronRight, AlertCircle } from 'lucide-react';
import { loginWithGoogle } from '../lib/firebase';

interface AuthLandingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: { name: string; email: string; avatar: string }) => void;
  onContinueAsGuest: () => void;
  initialMessage?: string;
}

export const AuthLandingModal: React.FC<AuthLandingModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  onContinueAsGuest,
  initialMessage,
}) => {
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);
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

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setDomainError(null);
    try {
      const firebaseUser = await loginWithGoogle();
      if (firebaseUser) {
        const loggedUser = {
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Kullanıcı',
          email: firebaseUser.email || '',
          avatar: firebaseUser.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(firebaseUser.displayName || firebaseUser.email || 'Kullanici')}`,
        };
        onLoginSuccess(loggedUser);
      }
    } catch (err: any) {
      console.error("Google login error:", err);
      if (err?.code === 'auth/popup-closed-by-user') {
        setErrorMessage('Giriş penceresi kapatıldı.');
      } else if (err?.code === 'auth/cancelled-popup-request') {
        // Ignored duplicate click
      } else if (
        err?.code === 'auth/unauthorized-domain' ||
        err?.code === 'auth/operation-not-allowed' ||
        err?.message?.includes('unauthorized-domain') ||
        err?.message?.includes('unauthorized domain')
      ) {
        setDomainError(window.location.hostname);
        setShowEmailForm(true); // Automatically show email login form as fallback
      } else {
        setErrorMessage(err?.message || 'Google ile giriş yapılırken bir hata oluştu.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    const name = nameInput.trim() || emailInput.split('@')[0];
    const loggedUser = {
      name,
      email: emailInput.trim(),
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
    };
    onLoginSuccess(loggedUser);
  };

  // Repeated string unit for 100% seamless infinite background ticker
  const phraseUnit = "اللَّهُ أَكْبَرُ  •  اللَّهُ أَكْبَرُ  •  اللَّهُ أَكْبَرُ  •  اللَّهُ أَكْبَرُ  •  ";
  const halfRowText = phraseUnit + phraseUnit + phraseUnit;

  return (
    <div className="fixed inset-0 z-50 min-h-screen w-full max-w-full bg-[#FAF8F5] text-stone-900 flex flex-col lg:flex-row overflow-y-auto overflow-x-hidden animate-fade-in font-sans selection:bg-stone-200 selection:text-stone-900">
      
      {/* Top Right Close / Skip button */}
      <motion.button
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        onClick={onClose}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 z-40 px-3.5 py-2 rounded-full bg-white/90 hover:bg-white text-stone-700 hover:text-stone-950 text-xs font-semibold flex items-center gap-2 backdrop-blur-md border border-stone-200/80 transition-all shadow-sm hover:shadow active:scale-95 cursor-pointer"
        title="Uygulamaya Geç"
      >
        <span>Uygulamaya Geç</span>
        <X className="w-4 h-4 text-stone-500" />
      </motion.button>

      {/* BACKGROUND ANIMATED CALLIGRAPHY WATERMARK (ALLAHUAKBAR) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none flex flex-col justify-around py-6 z-0 max-w-full">
        {/* Row 1 - Left to Right (Ultra-slow serene infinite move) */}
        <motion.div
          className="flex w-max whitespace-nowrap text-6xl sm:text-8xl lg:text-[10rem] font-serif font-bold text-stone-800 tracking-widest opacity-[0.025]"
          animate={{ x: ['-50%', '0%'] }}
          transition={{ repeat: Infinity, duration: 150, ease: 'linear' }}
        >
          <span>{halfRowText}</span>
          <span>{halfRowText}</span>
        </motion.div>

        {/* Row 2 - Right to Left (Ultra-slow serene infinite move) */}
        <motion.div
          className="flex w-max whitespace-nowrap text-7xl sm:text-9xl lg:text-[12rem] font-serif font-bold text-amber-950 tracking-widest opacity-[0.025]"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ repeat: Infinity, duration: 130, ease: 'linear' }}
        >
          <span>{halfRowText}</span>
          <span>{halfRowText}</span>
        </motion.div>

        {/* Row 3 - Left to Right (Ultra-slow serene infinite move) */}
        <motion.div
          className="flex w-max whitespace-nowrap text-6xl sm:text-8xl lg:text-[10rem] font-serif font-bold text-stone-900 tracking-widest opacity-[0.025]"
          animate={{ x: ['-50%', '0%'] }}
          transition={{ repeat: Infinity, duration: 170, ease: 'linear' }}
        >
          <span>{halfRowText}</span>
          <span>{halfRowText}</span>
        </motion.div>
      </div>

      {/* LEFT COLUMN: Apple-Style Light Luxury Feature Showcase (Hidden on Mobile) */}
      <div className="hidden lg:flex flex-1 bg-white/40 lg:bg-transparent p-8 sm:p-12 lg:p-16 flex-col justify-between relative z-10 border-r border-stone-200/80 min-h-screen">
        
        {/* Ambient Glow Orbs */}
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />

        {/* Content Container */}
        <div className="relative z-10 max-w-xl mx-auto lg:mx-0 space-y-8 my-auto">
          
          {/* Apple-style pill badge */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold tracking-wide"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Kur'an & Tefsir Rehberi</span>
          </motion.div>

          {/* Headline & Subtitle */}
          <div className="space-y-3.5">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-[1.18] text-stone-900 font-serif"
            >
              Ders, Tefsir ve Sohbet Meclisi
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="text-sm sm:text-base text-stone-600 leading-relaxed font-normal"
            >
              Sohbet ve vaaz ses kayıtlarını yazıya dökün, yapay zekâ ile anında sohbet raporu çıkartın ve ayet tefekkür notlarınızı düzenleyin.
            </motion.p>
          </div>

          {/* Staggered Feature Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all duration-300 group"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200/60 text-emerald-700 flex items-center justify-center shrink-0 mb-2.5 transition-transform group-hover:scale-110">
                <BookOpen className="w-4.5 h-4.5" />
              </div>
              <h4 className="text-xs font-bold text-stone-900 tracking-wide">Tilavet & Tefsir</h4>
              <p className="text-[11px] text-stone-600 mt-1 leading-relaxed">
                Mülk Sûresi tefsiri, tecvitli renkli okuma ve sesli kâri dinleme.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.34, ease: [0.16, 1, 0.3, 1] }}
              className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-xs hover:shadow-md hover:border-rose-300 transition-all duration-300 group"
            >
              <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200/60 text-rose-700 flex items-center justify-center shrink-0 mb-2.5 transition-transform group-hover:scale-110">
                <Mic className="w-4.5 h-4.5" />
              </div>
              <h4 className="text-xs font-bold text-stone-900 tracking-wide">Arka Plan Ses Kaydı</h4>
              <p className="text-[11px] text-stone-600 mt-1 leading-relaxed">
                Sohbet esnasında ekran kapansa da kayda devam edin, yazıya dökün.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.40, ease: [0.16, 1, 0.3, 1] }}
              className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-xs hover:shadow-md hover:border-amber-300 transition-all duration-300 group"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200/60 text-amber-800 flex items-center justify-center shrink-0 mb-2.5 transition-transform group-hover:scale-110">
                <Sparkles className="w-4.5 h-4.5" />
              </div>
              <h4 className="text-xs font-bold text-stone-900 tracking-wide">Gemini 3.6 AI Raporu</h4>
              <p className="text-[11px] text-stone-600 mt-1 leading-relaxed">
                Ses kayıtlarından veya ders notlarından otomatik vaaz özeti çıkartın.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.46, ease: [0.16, 1, 0.3, 1] }}
              className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all duration-300 group"
            >
              <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200/60 text-indigo-700 flex items-center justify-center shrink-0 mb-2.5 transition-transform group-hover:scale-110">
                <StickyNote className="w-4.5 h-4.5" />
              </div>
              <h4 className="text-xs font-bold text-stone-900 tracking-wide">Ayet & Ders Notları</h4>
              <p className="text-[11px] text-stone-600 mt-1 leading-relaxed">
                Ayetler üzerine tefekkür notları tutun ve cihazlar arası yedekleyin.
              </p>
            </motion.div>

          </div>

          {/* Bottom Quran Verse Quote */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.55 }}
            className="pt-6 border-t border-stone-200/80 text-center lg:text-left"
          >
            <p className="font-serif text-amber-900 text-lg sm:text-xl font-bold tracking-wide">
              أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ
            </p>
            <p className="text-xs text-stone-600 italic mt-1 font-normal">
              "Bilesiniz ki, kalpler ancak Allah'ı anmakla huzur bulur." (Râ'd Sûresi, 28)
            </p>
          </motion.div>

        </div>
      </div>

      {/* RIGHT COLUMN: Clean Apple Minimalist Auth Panel */}
      <div className="flex-1 w-full max-w-full bg-white/60 lg:bg-white/30 backdrop-blur-xs text-stone-900 p-6 sm:p-10 lg:p-16 flex flex-col justify-center items-center relative z-10 min-h-screen">
        
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md space-y-7 my-auto"
        >

          {/* Optional Banner Message when triggered by guest attempt */}
          {initialMessage && (
            <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-xs font-medium flex items-center gap-3 shadow-xs">
              <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
              <span>{initialMessage}</span>
            </div>
          )}

          {/* Error Message if Login fails */}
          {errorMessage && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-medium flex items-center gap-3 shadow-xs">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Firebase Domain Authorization Error Guidance Card */}
          {domainError && (
            <div className="p-4 bg-amber-50/90 border border-amber-300 text-amber-950 rounded-2xl text-xs font-normal space-y-2.5 shadow-sm">
              <div className="flex items-start gap-2.5 font-bold text-amber-900">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <span>Firebase Yetkisiz Etki Alanı (Unauthorized Domain)</span>
              </div>
              <p className="leading-relaxed opacity-90">
                Bu Vercel alan adı (<b>{domainError}</b>) Firebase Konsolunda henüz onaylı etki alanlarına eklenmemiş.
              </p>
              <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200 flex items-center justify-between gap-2">
                <code className="text-[11px] font-mono text-amber-950 font-semibold truncate">
                  {domainError}
                </code>
                <button
                  type="button"
                  onClick={handleCopyDomain}
                  className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] shrink-0 transition-all active:scale-95 cursor-pointer"
                >
                  {isCopied ? '✓ Kopyalandı' : 'Domain Adını Kopyala'}
                </button>
              </div>
              <p className="text-[11px] text-amber-800 opacity-80 leading-normal">
                💡 <b>Çözüm:</b> Firebase Console ➔ Authentication ➔ Settings ➔ Authorized Domains kısmına bu adresi yapıştırıp ekleyin. Dilerseniz aşağıdaki form ile de hemen giriş yapabilirsiniz.
              </p>
            </div>
          )}

          {/* Auth Header */}
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-black text-stone-900 tracking-tight font-serif">
              Hoş Geldiniz
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 font-normal leading-relaxed">
              Ders notlarınızı ve kayıtlarınızı saklamak için oturum açın veya doğrudan incelemeye başlayın.
            </p>
          </div>

          {/* Main Google Login Button - High Contrast Apple style */}
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full py-4 px-6 rounded-2xl bg-white border border-stone-300 hover:border-stone-400 text-stone-900 font-bold text-xs sm:text-sm flex items-center justify-center gap-3.5 shadow-sm hover:shadow transition-all duration-200 active:scale-98 cursor-pointer group"
          >
            <svg className="w-5 h-5 shrink-0 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
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
            <span>{isLoading ? 'Bağlanılıyor...' : 'Google İle Giriş Yap'}</span>
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-2">
            <div className="border-t border-stone-200 w-full" />
            <span className="bg-[#FAF8F5] px-3.5 text-[11px] font-bold text-stone-400 uppercase tracking-widest">
              veya
            </span>
          </div>

          {/* Email Login Form or Toggle Button */}
          {!showEmailForm ? (
            <button
              type="button"
              onClick={() => setShowEmailForm(true)}
              className="w-full py-3.5 px-5 rounded-2xl bg-stone-200/70 hover:bg-stone-200 text-stone-800 font-semibold text-xs transition-colors cursor-pointer"
            >
              E-Posta Adresi İle Giriş Yap
            </button>
          ) : (
            <form onSubmit={handleFormSubmit} className="space-y-3.5 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
              <div>
                <label className="text-[11px] font-bold text-stone-700 block mb-1">
                  Adınız Soyadınız:
                </label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Örn: Ahmet Yılmaz"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:ring-1 focus:ring-stone-400 outline-none transition-all"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-stone-700 block mb-1">
                  E-Posta Adresiniz:
                </label>
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="ornek@gmail.com"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:ring-1 focus:ring-stone-400 outline-none transition-all"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-stone-900 text-white font-bold text-xs shadow hover:bg-stone-800 transition-all cursor-pointer"
              >
                Giriş Yap & Başla
              </button>
            </form>
          )}

          {/* Divider */}
          <div className="border-t border-stone-200" />

          {/* Continue as Guest Button (Sleek Dark Pill Button) */}
          <div className="space-y-3">
            <button
              onClick={() => {
                onContinueAsGuest();
                onClose();
              }}
              className="w-full py-4 px-6 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-md hover:shadow-lg transition-all duration-200 active:scale-98 cursor-pointer group"
            >
              <Eye className="w-4 h-4 text-emerald-400" />
              <span>Giriş Yapmadan Devam Et (Misafir İnceleme)</span>
              <ChevronRight className="w-4 h-4 text-stone-400 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <p className="text-[11px] text-stone-500 text-center leading-relaxed px-2 font-normal">
              * Misafir olarak Kur'an-ı Kerim, tilavet ve tefsir derslerini serbestçe inceleyebilirsiniz. Ders notu eklemek veya sohbet kaydı tutmak istediğinizde oturum uyarısı alırsınız.
            </p>
          </div>

          {/* Security & Privacy Badge */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-stone-600 font-medium pt-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Kişisel verileriniz ve tuttuğunuz ders notları güvenle saklanır.</span>
          </div>

        </motion.div>
      </div>

    </div>
  );
};
