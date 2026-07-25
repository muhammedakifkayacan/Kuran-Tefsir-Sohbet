import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Compass, Navigation, MapPin, CheckCircle, RefreshCw, X, Info, Smartphone, LocateFixed } from 'lucide-react';
import { TURKEY_AND_WORLD_CITIES } from '../data/citiesData';
import { TitleWithHelp } from './TitleWithHelp';

interface QiblaFinderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Kaaba Coordinates (Mecca)
const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8262;

const CITIES_LIST = TURKEY_AND_WORLD_CITIES;

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
  const [selectedCityName, setSelectedCityName] = useState<string>('İstanbul');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number }>({ lat: 41.0082, lng: 28.9784 });
  const [isLocating, setIsLocating] = useState(false);
  const [deviceHeading, setDeviceHeading] = useState<number | null>(null);
  const [sensorPermissionRequested, setSensorPermissionRequested] = useState(false);

  // Request GPS Location
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Cihazınızın konum servisi aktif değil veya tarayıcı tarafından desteklenmiyor.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserCoords({ lat: latitude, lng: longitude });
        setSelectedCityName(`GPS Konumu (${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°)`);
        setIsLocating(false);
      },
      (err) => {
        console.error(err);
        setIsLocating(false);
        alert('Konum bilgisi alınamadı. Lütfen şehir listesinden seçiniz.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Handle City Change
  const handleCitySelect = (cityName: string) => {
    const found = CITIES_LIST.find((c) => c.name === cityName);
    if (found) {
      setSelectedCityName(found.name);
      setUserCoords({ lat: found.lat, lng: found.lng });
    }
  };

  // Enable Phone Compass Orientation Sensors (iOS & Android)
  const enableSensors = async () => {
    setSensorPermissionRequested(true);

    // iOS 13+ permission request
    if (
      typeof window !== 'undefined' &&
      typeof (DeviceOrientationEvent as any).requestPermission === 'function'
    ) {
      try {
        const permission = await (DeviceOrientationEvent as any).requestPermission();
        if (permission === 'granted') {
          window.addEventListener('deviceorientation', handleOrientation, true);
        } else {
          alert('Pusula sensörü izni reddedildi.');
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      window.addEventListener('deviceorientation', handleOrientation, true);
    }
  };

  const handleOrientation = (e: DeviceOrientationEvent) => {
    // webkitCompassHeading is available on iOS safari
    let headingVal: number | null = null;
    if ((e as any).webkitCompassHeading !== undefined) {
      headingVal = (e as any).webkitCompassHeading;
    } else if (e.alpha !== null && e.alpha !== undefined) {
      headingVal = 360 - e.alpha; // Convert to compass heading
    }

    if (headingVal !== null && !isNaN(headingVal)) {
      setDeviceHeading(Math.round(headingVal));
    }
  };

  useEffect(() => {
    if (isOpen) {
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

  // If phone sensor active, calculate rotation relative to phone's current orientation
  const isSensorActive = deviceHeading !== null;
  const needleRotation = isSensorActive ? (qiblaAngle - deviceHeading! + 360) % 360 : qiblaAngle;
  const isAligned = isSensorActive && (Math.abs(qiblaAngle - deviceHeading!) < 8 || Math.abs(qiblaAngle - deviceHeading!) > 352);

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
              <TitleWithHelp
                title="Kıble Pusulası"
                description="Hassas Kâbe-i Muazzama Yön Hesabı"
                titleClassName="text-base font-bold tracking-tight text-white"
              />
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-emerald-800/80 hover:bg-emerald-800 text-emerald-200 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Location & City Selector Bar */}
        <div className="p-3 bg-emerald-50/80 border-b border-emerald-100/90 flex flex-col gap-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-emerald-950 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-700" />
              <span>Kıble Açısı İçin Coğrafi Konum:</span>
            </span>
            <span className="text-[10px] bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-md font-bold">
              Enlem/Boylam Hesabı
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="relative w-full sm:w-auto flex-1">
              <select
                value={CITIES_LIST.some((c) => c.name === selectedCityName) ? selectedCityName : 'İstanbul'}
                onChange={(e) => handleCitySelect(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-white border border-emerald-200 text-stone-800 font-bold focus:outline-none w-full cursor-pointer shadow-2xs"
              >
                {CITIES_LIST.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name} (Koordinat)
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleGetLocation}
              disabled={isLocating}
              className="w-full sm:w-auto px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shrink-0 shadow-2xs"
            >
              <LocateFixed className={`w-3.5 h-3.5 text-emerald-200 ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? 'GPS Alınıyor...' : 'Otomatik GPS'}</span>
            </button>
          </div>
        </div>

        {/* Main Compass Visual */}
        <div className="p-6 bg-radial from-emerald-50/60 via-stone-50 to-stone-100 flex flex-col items-center justify-center text-center space-y-5">
          {/* Angle Status Badge */}
          {isAligned ? (
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="px-4 py-2 rounded-2xl bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg animate-bounce"
            >
              <CheckCircle className="w-4 h-4 text-emerald-200" />
              <span>TEBRİKLER! TAM KIBLE YÖNÜNDESİNİZ 🎯</span>
            </motion.div>
          ) : (
            <div className="px-4 py-2 rounded-2xl bg-amber-100 text-amber-950 font-bold text-xs border border-amber-300 shadow-2xs">
              Hesaplanan Kıble Açısı: <span className="font-extrabold text-amber-900">{qiblaAngle}°</span> ({cardinalText})
            </div>
          )}

          {/* Compass Dial */}
          <div className="relative w-60 h-60 rounded-full bg-white border-8 border-stone-200 shadow-2xl flex items-center justify-center overflow-hidden">
            {/* Outer Compass Degree Tick marks */}
            <div className="absolute inset-2 rounded-full border border-stone-100 pointer-events-none" />

            {/* Cardinal Marks */}
            <div className="absolute top-2 text-[11px] font-black text-rose-600">K (0°)</div>
            <div className="absolute right-3 text-[11px] font-black text-stone-400">D (90°)</div>
            <div className="absolute bottom-2 text-[11px] font-black text-stone-400">G (180°)</div>
            <div className="absolute left-3 text-[11px] font-black text-stone-400">B (270°)</div>

            {/* Qibla Direction Needle */}
            <motion.div
              animate={{ rotate: needleRotation }}
              transition={{ type: 'spring', stiffness: 180, damping: 18 }}
              className="absolute w-full h-full flex items-center justify-center"
            >
              <div className="relative w-full h-full flex flex-col items-center justify-start pt-2">
                {/* Kaaba Emblem */}
                <div className="w-10 h-10 rounded-2xl bg-stone-900 text-amber-400 border-2 border-amber-500 font-black text-xs flex flex-col items-center justify-center shadow-xl">
                  <span className="text-base leading-none">🕋</span>
                  <span className="text-[7px] tracking-widest font-black text-amber-300 uppercase">KÂBE</span>
                </div>
                {/* Pointer Line */}
                <div className="w-1.5 h-22 bg-gradient-to-b from-amber-500 via-emerald-600 to-emerald-800 rounded-full shadow-md mt-1" />
              </div>
            </motion.div>

            {/* Center Pivot Point */}
            <div className="w-7 h-7 rounded-full bg-stone-900 border-2 border-amber-400 shadow-md z-10 flex items-center justify-center text-amber-400 font-bold text-xs">
              <Navigation className="w-3.5 h-3.5 fill-amber-400" />
            </div>
          </div>

          {/* Sensor Enable Button if mobile */}
          {!isSensorActive && (
            <button
              onClick={enableSensors}
              className="px-4 py-2 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs border border-emerald-700 flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <Smartphone className="w-4 h-4 text-emerald-200" />
              <span>📱 Canlı Telefon Pusula Sensörünü Başlat</span>
            </button>
          )}

          {/* Stats Bar */}
          <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
            <div className="p-3 bg-white rounded-2xl border border-stone-200 text-center shadow-2xs">
              <span className="text-[10px] text-stone-400 font-bold uppercase block">Kâbe Mesafesi</span>
              <span className="text-xs font-black text-stone-900">~{distance.toLocaleString('tr-TR')} km</span>
            </div>
            <div className="p-3 bg-white rounded-2xl border border-stone-200 text-center shadow-2xs">
              <span className="text-[10px] text-stone-400 font-bold uppercase block">Pusula Yönü</span>
              <span className="text-xs font-black text-emerald-800">{qiblaAngle}° {cardinalText}</span>
            </div>
          </div>
        </div>

        {/* Practical Instruction Note */}
        <div className="p-3 bg-stone-100 text-[11px] text-stone-700 font-medium text-left border-t border-stone-200 space-y-1">
          <div className="flex items-start gap-1.5">
            <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-emerald-950">💡 Şehir/Konum Neden Var?</span> Bulunduğunuz yerin enlem ve boylamına göre Kâbe'nin derece (açısı) değişir (Örn: İstanbul 151°, Erzurum 170°). Otomatik GPS ile veya listeden seçerek yaşadığınız yere özel tam kıble açınızı hesaplayabilirsiniz.
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
