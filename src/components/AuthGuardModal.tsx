import React from 'react';
import { ShieldAlert, UserCheck, X } from 'lucide-react';

interface AuthGuardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuthModal: () => void;
  title?: string;
  message?: string;
}

export const AuthGuardModal: React.FC<AuthGuardModalProps> = ({
  isOpen,
  onClose,
  onOpenAuthModal,
  title = 'Oturum Açmalısınız',
  message = 'Ders notu eklemek ve sohbet kayıtlarınızı bulutta saklamak için lütfen hesabınıza giriş yapın.',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fade-in">
      <div className="bg-white text-stone-900 border border-stone-200/80 shadow-2xl rounded-[28px] max-w-sm w-full p-6 space-y-5 relative overflow-hidden backdrop-blur-2xl">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 hover:text-stone-800 flex items-center justify-center transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Warning Icon & Header */}
        <div className="text-center space-y-2 pt-1">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-200 text-amber-800 flex items-center justify-center mx-auto shadow-sm">
            <ShieldAlert className="w-6 h-6 text-amber-700" />
          </div>
          <h3 className="text-lg font-extrabold text-stone-900 tracking-tight">
            {title}
          </h3>
          <p className="text-xs text-stone-600 leading-relaxed px-1 font-medium">
            {message}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          <button
            onClick={() => {
              onClose();
              onOpenAuthModal();
            }}
            className="w-full py-3 px-4 rounded-2xl bg-[#1C1A17] text-[#D4AF37] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:bg-stone-800 active:scale-98 transition-all"
          >
            <UserCheck className="w-4 h-4 text-[#D4AF37]" />
            <span>Giriş Yap / Oturum Aç</span>
          </button>

          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-600 font-semibold text-xs transition-colors"
          >
            Şimdilik İptal (Okumaya Devam Et)
          </button>
        </div>

      </div>
    </div>
  );
};
