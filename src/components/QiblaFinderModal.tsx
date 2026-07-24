import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Compass, Navigation, MapPin, CheckCircle, RefreshCw, X, Info } from 'lucide-react';

interface QiblaFinderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Kaaba Coordinates
const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8262;

// Calculate Qibla angle from user latitude/longitude
function calculateQiblaAngle(lat: number, lng: number): number {
  const phi1 = (lat * Math.PI) / 180;
  const phi2 = (KAABA_LAT * Math.PI) / 180;
  const lam1 = (lng * Math.PI) / 180;
  const lam2 = (KAABA_LNG * Math.PI) / 180;

  const y = Math.sin(lam2 - lam1) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(lam2 - lam1);

  let qibla = (Math.atan2(y, x) * 180) / Math.PI;
  return (qibla + 360) % 360; // 0..360 degrees
}

// Calculate distance in km
function calculateDistanceToKaaba(lat: number, lng: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((KAABA_LAT - lat) * Math.PI) / 180;
  const dLng = ((KAABA_LNG - lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat * Math.PI) / 180) *
      Math.cos((KAABA_LAT * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export const QiblaFinderModal: React.FC<QiblaFinderModalProps> = ({ isOpen, onClose }) => {
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>({ lat: 41.0082, lng: 28.9784 }); // Default Istanbul
  const [cityName, setCityName] = useState('İstanbul (Varsayılan)');
  const [isLocating, setIsLocating] = useState(false);
  const [heading, setHeading] = useState(0); // Current device heading
  const [manualHeading, setManualHeading] = useState(0);
  const [hasOrientation, setHasOrientation] = useState(false);

  // Request GPS location
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Tarayıcınız konum servisini desteklemiyor.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserCoords({ lat: latitude, lng: longitude });
        setCityName(`📍 Konumunuz (${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°)`);
        setIsLocating(false);
      },
      (err) => {
        console.error(err);
        setIsLocating(false);
        setCityName('İstanbul (Konum İzni Alınamadı)');
      },
      { enableHighAccuracy: true }
    );
  };

  // Device orientation sensor listener
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.alpha !== null && e.alpha !== undefined) {
        setHasOrientation(true);
        // alpha gives heading relative to north (0..360)
        setHeading(e.alpha);
      }
    };

    window.addEventListener('deviceorientation', handleOrientation, true);
    return () => window.removeEventListener('deviceorientation', handleOrientation, true);
  }, []);

  if (!isOpen) return null;

  const currentLat = userCoords?.lat || 41.0082;
  const currentLng = userCoords?.lng || 28.9784;
  const qiblaDegree = Math.round(calculateQiblaAngle(currentLat, currentLng));
  const kaabaDistance = calculateDistanceToKaaba(currentLat, currentLng);

  const activeHeading = hasOrientation ? heading : manualHeading;
  const diff = Math.abs((activeHeading - qiblaDegree + 360) % 360);
  const isAligned = diff < 8 || diff > 352;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-md animate-fade-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-stone-50 rounded-3xl border border-stone-200/90 shadow-2xl w-full max-w-md overflow-hidden flex flex-col"
      >
        {/* Header Bar */}
        <div className="p-4 bg-emerald-900 text-white flex items-center justify-between border-b border-emerald-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-800 border border-emerald-700 flex items-center justify-center text-emerald-200 font-bold shadow-xs">
              <Compass className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Kıble Pusulası</h2>
              <p className="text-xs text-emerald-200 font-medium">Kâbe-i Muazzama Yön Bulucu</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-emerald-800/80 hover:bg-emerald-800 text-emerald-200 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Location Info Banner */}
        <div className="p-3 bg-white border-b border-stone-200/80 flex items-center justify-between text-xs font-semibold text-stone-700">
          <div className="flex items-center gap-1.5 truncate pr-2">
            <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
            <span className="truncate">{cityName}</span>
          </div>
          <button
            onClick={handleGetLocation}
            disabled={isLocating}
            className="px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-[11px] font-bold flex items-center gap-1 transition-all active:scale-95 cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-3 h-3 text-emerald-700 ${isLocating ? 'animate-spin' : ''}`} />
            <span>{isLocating ? 'Alınıyor...' : 'Konumu Güncelle'}</span>
          </button>
        </div>

        {/* Main Compass Dial Area */}
        <div className="p-6 bg-radial from-emerald-50/50 via-stone-50 to-stone-100 flex flex-col items-center justify-center text-center space-y-6">
          {/* Alignment Banner */}
          {isAligned ? (
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="px-4 py-2 rounded-2xl bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg animate-bounce"
            >
              <CheckCircle className="w-4 h-4 text-emerald-200" />
              <span>TEBRİKLER! KIBLE YÖNÜNDESİNİZ 🎯</span>
            </motion.div>
          ) : (
            <div className="px-4 py-1.5 rounded-2xl bg-amber-100 text-amber-900 font-bold text-xs border border-amber-300">
              Kıble Açısı: <span className="font-extrabold text-amber-950">{qiblaDegree}°</span> (Güneydoğu)
            </div>
          )}

          {/* Compass Graphic */}
          <div className="relative w-56 h-56 rounded-full bg-white border-4 border-stone-200 shadow-xl flex items-center justify-center">
            {/* Degree Markers */}
            <div className="absolute top-2 text-[10px] font-black text-stone-400">K (0°)</div>
            <div className="absolute right-2 text-[10px] font-black text-stone-400">D (90°)</div>
            <div className="absolute bottom-2 text-[10px] font-black text-stone-400">G (180°)</div>
            <div className="absolute left-2 text-[10px] font-black text-stone-400">B (270°)</div>

            {/* Qibla Marker Needle */}
            <motion.div
              animate={{ rotate: qiblaDegree - activeHeading }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="absolute w-full h-full flex items-center justify-center"
            >
              <div className="relative w-full h-full flex flex-col items-center justify-start pt-1">
                {/* Kaaba Icon Pointer */}
                <div className="w-9 h-9 rounded-xl bg-stone-900 text-amber-400 border-2 border-amber-500 font-black text-xs flex flex-col items-center justify-center shadow-lg transform -translate-y-2">
                  <span className="text-sm leading-none">🕋</span>
                  <span className="text-[8px] tracking-tighter font-extrabold">KIBLE</span>
                </div>
                {/* Pointer Line */}
                <div className="w-1 h-20 bg-emerald-600 rounded-full shadow-md mt-1" />
              </div>
            </motion.div>

            {/* Center Pivot */}
            <div className="w-6 h-6 rounded-full bg-emerald-800 border-2 border-white shadow-md z-10 flex items-center justify-center">
              <Navigation className="w-3 h-3 text-white" />
            </div>
          </div>

          {/* Manual Compass Simulation Slider for Desktop */}
          {!hasOrientation && (
            <div className="w-full max-w-xs space-y-1 bg-white p-3 rounded-2xl border border-stone-200 text-left">
              <label className="text-[11px] font-bold text-stone-600 flex items-center justify-between">
                <span>Pusulayı Çevir (Cihaz Açı Simülasyonu):</span>
                <span className="text-emerald-800 font-extrabold">{manualHeading}°</span>
              </label>
              <input
                type="range"
                min="0"
                max="360"
                value={manualHeading}
                onChange={(e) => setManualHeading(Number(e.target.value))}
                className="w-full accent-emerald-700 cursor-pointer"
              />
            </div>
          )}

          {/* Stats Bar */}
          <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
            <div className="p-3 bg-white rounded-2xl border border-stone-200 text-center">
              <span className="text-[10px] text-stone-400 font-bold uppercase block">Kâbe Mesafesi</span>
              <span className="text-xs font-black text-stone-900">~{kaabaDistance.toLocaleString('tr-TR')} km</span>
            </div>
            <div className="p-3 bg-white rounded-2xl border border-stone-200 text-center">
              <span className="text-[10px] text-stone-400 font-bold uppercase block">Pusula Yönü</span>
              <span className="text-xs font-black text-emerald-800">{qiblaDegree}° Güneydoğu</span>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="p-3 bg-stone-100 text-[11px] text-stone-500 font-medium text-center border-t border-stone-200 flex items-center justify-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-stone-400" />
          <span>Telefonda pusula doğruluğu için cihazınızı sekiz (8) çizecek şekilde sallayabilirsiniz.</span>
        </div>
      </motion.div>
    </div>
  );
};
