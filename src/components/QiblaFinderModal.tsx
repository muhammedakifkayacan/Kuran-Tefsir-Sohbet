import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Compass, Navigation, MapPin, CheckCircle, RefreshCw, X, Info, Smartphone, LocateFixed, Sparkles } from 'lucide-react';
import { TitleWithHelp } from './TitleWithHelp';

interface QiblaFinderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Kaaba Coordinates (Mecca)
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
  return Math.round((qibla + 360) % 360); // 0..360 degrees
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

// Get cardinal direction text
function getDirectionCardinal(degree: number): string {
  if (degree >= 337.5 || degree < 22.5) return 'Kuzey';
  if (degree >= 22.5 && degree < 67.5) return 'Kuzeydoğu';
  if (degree >= 67.5 && degree < 112.5) return 'Doğu';
  if (degree >= 112.5 && degree < 157.5) return 'Güneydoğu';
  if (degree >= 157.5 && degree < 202.5) return 'Güney';
  if (degree >= 202.5 && degree < 247.5) return 'Güneybatı';
  if (degree >= 247.5 && degree < 292.5) return 'Batı';
  if (degree >= 292.5 && degree < 337.5) return 'Kuzeybatı';
  return 'Güneydoğu';
}

export const QiblaFinderModal: React.FC<QiblaFinderModalProps> = ({ isOpen, onClose }) => {
  // Direct GPS Coords - Defaults to Istanbul coordinates until auto GPS resolves
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number }>({ lat: 41.0082, lng: 28.9784 });
  const [isGpsActive, setIsGpsActive] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [deviceHeading, setDeviceHeading] = useState<number | null>(null);

  // Auto GPS Location request on modal open
  const fetchGpsLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Cihazınızda GPS servisi bulunamadı.');
      return;
    }
    setIsLocating(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserCoords({ lat: latitude, lng: longitude });
        setIsGpsActive(true);
        setIsLocating(false);
      },
      (err) => {
        console.error('GPS Error:', err);
        setIsLocating(false);
        setIsGpsActive(false);
        setGpsError('GPS alınamadı (Varsayılan konum kullanılıyor).');
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  // Orientation Event Handler
  const handleOrientation = (e: DeviceOrientationEvent) => {
    let headingVal: number | null = null;
    if ((e as any).webkitCompassHeading !== undefined) {
      headingVal = (e as any).webkitCompassHeading;
    } else if (e.alpha !== null && e.alpha !== undefined) {
      headingVal = 360 - e.alpha;
    }

    if (headingVal !== null && !isNaN(headingVal)) {
      setDeviceHeading(Math.round(headingVal));
    }
  };

  // Enable Sensors (iOS 13+ permission support + event listener)
  const enableSensors = async () => {
    if (
      typeof window !== 'undefined' &&
      typeof (DeviceOrientationEvent as any).requestPermission === 'function'
    ) {
      try {
        const permission = await (DeviceOrientationEvent as any).requestPermission();
        if (permission === 'granted') {
          window.addEventListener('deviceorientation', handleOrientation, true);
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      window.addEventListener('deviceorientation', handleOrientation, true);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchGpsLocation();
      enableSensors();
      window.addEventListener('deviceorientation', handleOrientation, true);
    }
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const qiblaAngle = calculateQiblaAngle(userCoords.lat, userCoords.lng);
  const distance = calculateDistanceToKaaba(userCoords.lat, userCoords.lng);
  const cardinalText = getDirectionCardinal(qiblaAngle);

  // Compass Rotation
  const isSensorActive = deviceHeading !== null;
  const needleRotation = isSensorActive ? (qiblaAngle - deviceHeading! + 360) % 360 : qiblaAngle;
  const isAligned = isSensorActive && (Math.abs(qiblaAngle - deviceHeading!) < 7 || Math.abs(qiblaAngle - deviceHeading!) > 353);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-950/80 backdrop-blur-xl animate-fade-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        className="bg-stone-900 text-stone-100 rounded-3xl border border-stone-800 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[95vh]"
      >
        {/* Full-screen Header Bar */}
        <div className="p-4 bg-emerald-950 text-white flex items-center justify-between border-b border-emerald-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-900 border border-emerald-700 flex items-center justify-center text-emerald-200 font-bold shadow-xs">
              <Compass className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <TitleWithHelp
                title="Otomatik GPS Kıble Pusulası"
                description="Mobil GPS ve yön sensörü ile tam Kâbe açısı hesabı"
                titleClassName="text-base font-bold tracking-tight text-white"
              />
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-emerald-900/80 hover:bg-emerald-900 text-emerald-200 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* GPS Status Indicator Banner */}
        <div className="px-4 py-2.5 bg-stone-950 border-b border-stone-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <LocateFixed className={`w-4 h-4 ${isLocating ? 'text-amber-400 animate-spin' : isGpsActive ? 'text-emerald-400' : 'text-stone-400'}`} />
            <span className="font-semibold text-stone-300">
              {isLocating
                ? 'Otomatik GPS Hesaplanıyor...'
                : isGpsActive
                ? `GPS Aktif (${userCoords.lat.toFixed(3)}°, ${userCoords.lng.toFixed(3)}°)`
                : gpsError || 'GPS Otomatik Arama Yapılıyor'}
            </span>
          </div>
          <button
            onClick={fetchGpsLocation}
            disabled={isLocating}
            className="px-2.5 py-1 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer border border-stone-700"
          >
            <RefreshCw className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
            <span>Yenile</span>
          </button>
        </div>

        {/* Main Compass Area */}
        <div className="p-6 bg-gradient-to-b from-stone-900 via-emerald-950/20 to-stone-950 flex flex-col items-center justify-center text-center space-y-6 overflow-y-auto">
          {/* Target Alignment Status */}
          {isAligned ? (
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="px-5 py-2.5 rounded-2xl bg-emerald-600 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-900/50 animate-bounce"
            >
              <CheckCircle className="w-5 h-5 text-emerald-200" />
              <span>TEBRİKLER! TAM KIBLE YÖNÜNDESİNİZ 🎯</span>
            </motion.div>
          ) : (
            <div className="px-4 py-2 rounded-2xl bg-stone-800/90 text-stone-200 font-bold text-xs border border-stone-700 shadow-xs flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>
                Kıble Açınız: <span className="font-extrabold text-amber-400 text-sm">{qiblaAngle}°</span> ({cardinalText})
              </span>
            </div>
          )}

          {/* Precision Digital Compass Circle */}
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full bg-stone-950 border-8 border-stone-800 shadow-2xl flex items-center justify-center overflow-hidden">
            {/* Outer Compass Degrees */}
            <div className="absolute top-2.5 text-xs font-black text-rose-500 tracking-wider">K (0°)</div>
            <div className="absolute right-3.5 text-xs font-black text-stone-500 tracking-wider">D (90°)</div>
            <div className="absolute bottom-2.5 text-xs font-black text-stone-500 tracking-wider">G (180°)</div>
            <div className="absolute left-3.5 text-xs font-black text-stone-500 tracking-wider">B (270°)</div>

            {/* Qibla Direction Needle */}
            <motion.div
              animate={{ rotate: needleRotation }}
              transition={{ type: 'spring', stiffness: 180, damping: 18 }}
              className="absolute w-full h-full flex items-center justify-center pointer-events-none"
            >
              <div className="relative w-full h-full flex flex-col items-center justify-between py-4">
                {/* Pointer Arrow pointing to Qibla */}
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-xl ${isAligned ? 'bg-amber-400 text-stone-950 scale-110 shadow-amber-400/50' : 'bg-emerald-900 text-amber-300 border border-emerald-600'} font-bold flex items-center justify-center shadow-lg transition-all`}>
                    <span className="text-base leading-none">🕋</span>
                  </div>
                  <div className="w-1.5 h-20 sm:h-22 bg-gradient-to-b from-amber-400 via-emerald-500 to-transparent rounded-full shadow-md mt-1" />
                </div>

                {/* Counter Weight (Bottom of Needle) */}
                <div className="w-1.5 h-12 bg-stone-700/60 rounded-full" />
              </div>
            </motion.div>

            {/* Center Pivot Point */}
            <div className="w-7 h-7 rounded-full bg-stone-900 border-2 border-amber-400 shadow-md z-10 flex items-center justify-center text-amber-400 font-bold">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
            </div>
          </div>

          {/* Sensor Permission / Enable Button if not moving */}
          {!isSensorActive && (
            <button
              onClick={enableSensors}
              className="px-4 py-2.5 rounded-2xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs border border-emerald-600 flex items-center gap-2 transition-all cursor-pointer shadow-md active:scale-95"
            >
              <Smartphone className="w-4 h-4 text-emerald-300" />
              <span>Pusula Sensörünü Etkinleştir</span>
            </button>
          )}

          {/* Distance & Info Metrics */}
          <div className="grid grid-cols-2 gap-3 w-full max-w-sm text-xs">
            <div className="p-3 bg-stone-950/80 rounded-2xl border border-stone-800 text-center shadow-2xs">
              <span className="text-[10px] text-stone-500 font-bold uppercase block">Kâbe-i Muazzama</span>
              <span className="text-xs font-black text-stone-200">~{distance.toLocaleString('tr-TR')} km</span>
            </div>
            <div className="p-3 bg-stone-950/80 rounded-2xl border border-stone-800 text-center shadow-2xs">
              <span className="text-[10px] text-stone-500 font-bold uppercase block">Pusula Derecesi</span>
              <span className="text-xs font-black text-emerald-400">{qiblaAngle}° {cardinalText}</span>
            </div>
          </div>
        </div>

        {/* Calibration & Instructions */}
        <div className="p-3.5 bg-stone-950 text-[11px] text-stone-400 border-t border-stone-800 space-y-1">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-stone-200">📱 Hassas Kalibrasyon İpucu:</span> Cihazınızın pusula sensörünü en doğru açıya getirmek için telefonunuzu havada 8 (sekiz) çizecek şekilde birkaç kez çeviriniz ve metal nesnelerden uzak tutunuz.
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
