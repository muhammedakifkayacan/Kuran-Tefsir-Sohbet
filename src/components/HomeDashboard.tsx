import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Radio, StickyNote, Compass, Sparkles, MapPin, RefreshCw, Clock, ArrowRight, Settings, Sliders, ChevronDown, Volume2, Quote, Sun, Moon, Eye, EyeOff, LocateFixed } from 'lucide-react';
import { NavTab, SohbetSession, VerseNote } from '../types';
import { TitleWithHelp } from './TitleWithHelp';
import { RIYAZUS_SALIHIN_HADITHS } from '../data/riyazusSalihinData';
import { TURKEY_AND_WORLD_CITIES, CityLocation } from '../data/citiesData';

interface HomeDashboardProps {
  onNavigateTab: (tab: NavTab) => void;
  onOpenQiblaFinder: () => void;
  onOpenRiyazusModal: () => void;
  onOpenVoiceRecorder: () => void;
  sohbetSessions: SohbetSession[];
  verseNotes: VerseNote[];
}

export interface WidgetConfig {
  id: 'prayer' | 'quickActions' | 'dailyVerse' | 'dailyHadith' | 'sohbetPreview';
  title: string;
  enabled: boolean;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  onNavigateTab,
  onOpenQiblaFinder,
  onOpenRiyazusModal,
  onOpenVoiceRecorder,
  sohbetSessions,
  verseNotes,
}) => {
  // Widget order & visibility configuration stored in LocalStorage
  const DEFAULT_WIDGETS: WidgetConfig[] = [
    { id: 'prayer', title: 'Namaz Vakitleri & Kıble', enabled: true },
    { id: 'quickActions', title: 'Hızlı İşlemler', enabled: true },
    { id: 'dailyVerse', title: 'Günün Ayeti & Tefsiri', enabled: true },
    { id: 'dailyHadith', title: 'Riyazü’s-Sâlihîn Hadîs-i Şerifi', enabled: true },
    { id: 'sohbetPreview', title: 'Yaklaşan Sohbet & Dersler', enabled: true },
  ];

  const [widgets, setWidgets] = useState<WidgetConfig[]>(() => {
    try {
      const saved = localStorage.getItem('kuran_app_home_widgets');
      return saved ? JSON.parse(saved) : DEFAULT_WIDGETS;
    } catch (e) {
      return DEFAULT_WIDGETS;
    }
  });

  const [isCustomizing, setIsCustomizing] = useState(false);

  useEffect(() => {
    localStorage.setItem('kuran_app_home_widgets', JSON.stringify(widgets));
  }, [widgets]);

  // Location & Prayer Times State
  const [selectedCityName, setSelectedCityName] = useState<string>(() => {
    return localStorage.getItem('kuran_app_prayer_city') || 'İstanbul';
  });
  const [cityNameLabel, setCityNameLabel] = useState<string>(() => {
    return localStorage.getItem('kuran_app_prayer_city_label') || localStorage.getItem('kuran_app_prayer_city') || 'İstanbul';
  });
  const [isLocating, setIsLocating] = useState(false);
  const [isLocationMenuOpen, setIsLocationMenuOpen] = useState(false);
  const [prayerTimes, setPrayerTimes] = useState({
    Imsak: '04:12',
    Gunes: '05:50',
    Ogle: '13:08',
    Ikindi: '17:02',
    Aksam: '20:15',
    Yatsi: '21:48',
  });

  // Live Timer for Prayer Countdown
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Helper to calculate exact countdown & active prayer status
  const getPrayerCountdown = () => {
    const parseTimeToday = (timeStr: string, date: Date, addDays = 0) => {
      const [h, m] = (timeStr || '00:00').split(':').map(Number);
      return new Date(date.getFullYear(), date.getMonth(), date.getDate() + addDays, h, m, 0, 0);
    };

    const imsakToday = parseTimeToday(prayerTimes.Imsak, now, 0);
    const gunesToday = parseTimeToday(prayerTimes.Gunes, now, 0);
    const ogleToday = parseTimeToday(prayerTimes.Ogle, now, 0);
    const ikindiToday = parseTimeToday(prayerTimes.Ikindi, now, 0);
    const aksamToday = parseTimeToday(prayerTimes.Aksam, now, 0);
    const yatsiToday = parseTimeToday(prayerTimes.Yatsi, now, 0);
    const imsakTomorrow = parseTimeToday(prayerTimes.Imsak, now, 1);
    const yatsiYesterday = parseTimeToday(prayerTimes.Yatsi, now, -1);

    let activeKey: 'Imsak' | 'Gunes' | 'Ogle' | 'Ikindi' | 'Aksam' | 'Yatsi' = 'Yatsi';
    let currentPrayerLabel = 'Yatsı Vakti';
    let nextPrayerLabel = 'İmsak';
    let startTime = yatsiYesterday;
    let targetTime = imsakToday;

    if (now < imsakToday) {
      activeKey = 'Yatsi';
      currentPrayerLabel = 'Yatsı Vakti';
      nextPrayerLabel = 'İmsak';
      startTime = yatsiYesterday;
      targetTime = imsakToday;
    } else if (now >= imsakToday && now < gunesToday) {
      activeKey = 'Imsak';
      currentPrayerLabel = 'İmsak Vakti';
      nextPrayerLabel = 'Güneş';
      startTime = imsakToday;
      targetTime = gunesToday;
    } else if (now >= gunesToday && now < ogleToday) {
      activeKey = 'Gunes';
      currentPrayerLabel = 'Güneş Doğdu';
      nextPrayerLabel = 'Öğle';
      startTime = gunesToday;
      targetTime = ogleToday;
    } else if (now >= ogleToday && now < ikindiToday) {
      activeKey = 'Ogle';
      currentPrayerLabel = 'Öğle Vakti';
      nextPrayerLabel = 'İkindi';
      startTime = ogleToday;
      targetTime = ikindiToday;
    } else if (now >= ikindiToday && now < aksamToday) {
      activeKey = 'Ikindi';
      currentPrayerLabel = 'İkindi Vakti';
      nextPrayerLabel = 'Akşam';
      startTime = ikindiToday;
      targetTime = aksamToday;
    } else if (now >= aksamToday && now < yatsiToday) {
      activeKey = 'Aksam';
      currentPrayerLabel = 'Akşam Vakti';
      nextPrayerLabel = 'Yatsı';
      startTime = aksamToday;
      targetTime = yatsiToday;
    } else {
      activeKey = 'Yatsi';
      currentPrayerLabel = 'Yatsı Vakti';
      nextPrayerLabel = 'İmsak';
      startTime = yatsiToday;
      targetTime = imsakTomorrow;
    }

    const totalDiffMs = Math.max(0, targetTime.getTime() - now.getTime());
    const totalSecs = Math.floor(totalDiffMs / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;
    const totalMinutes = Math.floor(totalSecs / 60);

    const pad = (n: number) => String(n).padStart(2, '0');
    const countdownStr = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

    const windowDurationMs = targetTime.getTime() - startTime.getTime();
    const elapsedMs = now.getTime() - startTime.getTime();
    const progressPercent = Math.min(100, Math.max(0, Math.round((elapsedMs / windowDurationMs) * 100)));

    return {
      activeKey,
      currentPrayerLabel,
      nextPrayerLabel,
      hours,
      minutes,
      seconds,
      totalMinutes,
      countdownStr,
      progressPercent,
    };
  };

  const countdownInfo = getPrayerCountdown();

  // Fetch Prayer Times for given latitude & longitude
  const fetchPrayerTimesForCoords = async (lat: number, lng: number, labelName: string) => {
    setCityNameLabel(labelName);
    try {
      const res = await fetch(`https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lng}&method=13`);
      const json = await res.json();
      if (json.data && json.data.timings) {
        const t = json.data.timings;
        setPrayerTimes({
          Imsak: t.Fajr,
          Gunes: t.Sunrise,
          Ogle: t.Dhuhr,
          Ikindi: t.Asr,
          Aksam: t.Maghrib,
          Yatsi: t.Isha,
        });
      }
    } catch (e) {
      console.error('Prayer times fetch error:', e);
    }
  };

  // Handle Manual City Dropdown Select
  const handleCitySelect = (cityName: string) => {
    setSelectedCityName(cityName);
    setCityNameLabel(cityName);
    localStorage.setItem('kuran_app_prayer_city', cityName);
    localStorage.setItem('kuran_app_prayer_city_label', cityName);
    localStorage.removeItem('kuran_app_prayer_coords');
    const found = TURKEY_AND_WORLD_CITIES.find((c) => c.name === cityName);
    if (found) {
      fetchPrayerTimesForCoords(found.lat, found.lng, found.name);
    }
  };

  // On initial mount, fetch prayer times for the saved city / saved GPS coordinates
  useEffect(() => {
    const savedCoordsStr = localStorage.getItem('kuran_app_prayer_coords');
    const savedCity = localStorage.getItem('kuran_app_prayer_city') || 'İstanbul';
    const savedLabel = localStorage.getItem('kuran_app_prayer_city_label') || savedCity;

    if (savedCoordsStr) {
      try {
        const { lat, lng } = JSON.parse(savedCoordsStr);
        if (typeof lat === 'number' && typeof lng === 'number') {
          setSelectedCityName(savedCity);
          setCityNameLabel(savedLabel);
          fetchPrayerTimesForCoords(lat, lng, savedLabel);
          return;
        }
      } catch (e) {
        console.error('Error parsing saved coords:', e);
      }
    }

    const found = TURKEY_AND_WORLD_CITIES.find(
      (c) => c.name.toLowerCase().trim() === savedCity.toLowerCase().trim()
    ) || TURKEY_AND_WORLD_CITIES.find((c) => c.name === 'İstanbul') || TURKEY_AND_WORLD_CITIES[0];

    if (found) {
      setSelectedCityName(found.name);
      setCityNameLabel(savedLabel || found.name);
      fetchPrayerTimesForCoords(found.lat, found.lng, savedLabel || found.name);
    }
  }, []);

  // GPS Location Handler with Reverse Geocoding to get City/Province Name
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Tarayıcınız konum servisini desteklemiyor.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        let detectedCity = 'Konumunuz';
        try {
          // Reverse Geocode using BigDataCloud free API or OpenStreetMap
          const geoRes = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=tr`
          );
          const geoJson = await geoRes.json();
          if (geoJson.principalSubdivision || geoJson.city || geoJson.locality) {
            detectedCity = geoJson.principalSubdivision || geoJson.city || geoJson.locality;
          }
        } catch (e) {
          console.warn('Reverse geocode error, fallback to GPS:', e);
        }

        const label = `📍 ${detectedCity} (Otomatik GPS)`;
        setSelectedCityName(detectedCity);
        setCityNameLabel(label);

        // Store persistent city name, label, and GPS coordinates
        localStorage.setItem('kuran_app_prayer_city', detectedCity);
        localStorage.setItem('kuran_app_prayer_city_label', label);
        localStorage.setItem('kuran_app_prayer_coords', JSON.stringify({ lat: latitude, lng: longitude }));

        await fetchPrayerTimesForCoords(latitude, longitude, label);
        setIsLocating(false);
      },
      (err) => {
        console.error(err);
        setIsLocating(false);
        alert('Konum alınamadı. Lütfen listeden şehrinizi manuel seçiniz.');
      }
    );
  };

  const toggleWidget = (id: WidgetConfig['id']) => {
    setWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, enabled: !w.enabled } : w))
    );
  };

  const moveWidget = (index: number, direction: 'up' | 'down') => {
    const newWidgets = [...widgets];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newWidgets.length) return;
    const temp = newWidgets[index];
    newWidgets[index] = newWidgets[targetIndex];
    newWidgets[targetIndex] = temp;
    setWidgets(newWidgets);
  };

  const todayHadith = RIYAZUS_SALIHIN_HADITHS[0];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-fade-in">
      {/* Top Banner & Dashboard Customizer Trigger */}
      <div className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 rounded-3xl p-5 sm:p-6 border border-stone-200/80 dark:border-stone-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
            Hoş Geldiniz
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
            Kur'an ve tefsir dersleriniz
          </p>
        </div>

        <button
          onClick={() => setIsCustomizing(!isCustomizing)}
          className="px-3.5 py-2 rounded-2xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-semibold text-xs border border-stone-200/80 dark:border-stone-700 flex items-center gap-2 transition-all active:scale-95 cursor-pointer shrink-0"
        >
          <Sliders className="w-4 h-4 text-stone-500 dark:text-stone-400" />
          <span>{isCustomizing ? 'Bitti' : 'Düzenle'}</span>
        </button>
      </div>

      {/* Customization Drawer / Manager */}
      <AnimatePresence>
        {isCustomizing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white dark:bg-stone-900 rounded-3xl p-5 border-2 border-emerald-500 shadow-md space-y-4 overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                <TitleWithHelp
                  title="Ana Ekran Kart Düzeni & Görünürlük Ayarları"
                  description="Okları kullanarak sıralamayı değiştirebilirsiniz"
                  titleClassName="font-bold text-sm text-stone-900 dark:text-stone-100"
                />
              </div>
            </div>

            <div className="space-y-2">
              {widgets.map((widget, idx) => (
                <div
                  key={widget.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200/90 dark:border-stone-700"
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleWidget(widget.id)}
                      className={`p-2 rounded-xl transition-colors cursor-pointer ${
                        widget.enabled ? 'bg-emerald-700 text-white' : 'bg-stone-200 dark:bg-stone-700 text-stone-500 dark:text-stone-400'
                      }`}
                    >
                      {widget.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <span className={`text-xs font-bold ${widget.enabled ? 'text-stone-900 dark:text-stone-100' : 'text-stone-400 line-through'}`}>
                      {widget.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      disabled={idx === 0}
                      onClick={() => moveWidget(idx, 'up')}
                      className="p-1.5 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 disabled:opacity-40 cursor-pointer text-xs font-bold"
                    >
                      ▲
                    </button>
                    <button
                      disabled={idx === widgets.length - 1}
                      onClick={() => moveWidget(idx, 'down')}
                      className="p-1.5 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 disabled:opacity-40 cursor-pointer text-xs font-bold"
                    >
                      ▼
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Render Dynamic Enabled Widgets */}
      <div className="space-y-6">
        {widgets.map((widget) => {
          if (!widget.enabled) return null;

          switch (widget.id) {
            case 'prayer':
              return (
                <div
                  key="prayer"
                  className="bg-white dark:bg-stone-900 rounded-3xl p-5 sm:p-6 border border-stone-200/90 dark:border-stone-800 shadow-2xs space-y-4"
                >
                  <div className="flex items-center justify-between gap-3 border-b border-stone-100 dark:border-stone-800 pb-3 relative">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-stone-800 text-amber-900 dark:text-amber-300 font-bold flex items-center justify-center border border-amber-200 dark:border-stone-700 shrink-0">
                        <Clock className="w-4 h-4 text-amber-800 dark:text-amber-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">Namaz Vakitleri & Konum</h3>
                        <p className="text-[11px] text-stone-500 dark:text-stone-400 font-medium flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-emerald-700 dark:text-emerald-400 inline" />
                          <span>{cityNameLabel}</span>
                        </p>
                      </div>
                    </div>

                    {/* Right Corner Menu Button */}
                    <div className="relative">
                      <button
                        onClick={() => setIsLocationMenuOpen(!isLocationMenuOpen)}
                        className="px-3 py-1.5 rounded-2xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition-all border border-stone-200/80 dark:border-stone-700 flex items-center gap-1.5 text-xs font-bold cursor-pointer shadow-2xs"
                        title="Konum ve Kıble Ayarları"
                      >
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span className="hidden sm:inline">{cityNameLabel}</span>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isLocationMenuOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {/* Dropdown Popover */}
                      <AnimatePresence>
                        {isLocationMenuOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-stone-900 rounded-2xl p-3 border border-stone-200 dark:border-stone-800 shadow-xl z-30 space-y-2 text-xs"
                          >
                            <div className="font-bold text-stone-800 dark:text-stone-200 px-1 border-b border-stone-100 dark:border-stone-800 pb-1.5 flex items-center justify-between">
                              <span>Konum & Kıble Ayarları</span>
                              <button
                                onClick={() => setIsLocationMenuOpen(false)}
                                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 font-bold"
                              >
                                ✕
                              </button>
                            </div>

                            {/* Manuel Şehir Seçimi Dropdown */}
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">Şehir Seçin</label>
                              <select
                                value={TURKEY_AND_WORLD_CITIES.some((c) => c.name === selectedCityName) ? selectedCityName : 'İstanbul'}
                                onChange={(e) => {
                                  handleCitySelect(e.target.value);
                                  setIsLocationMenuOpen(false);
                                }}
                                className="w-full px-2.5 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 font-bold text-xs focus:outline-none cursor-pointer"
                              >
                                {TURKEY_AND_WORLD_CITIES.map((c) => (
                                  <option key={c.name} value={c.name}>
                                    {c.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* GPS Auto Button */}
                            <button
                              onClick={() => {
                                handleGetLocation();
                                setIsLocationMenuOpen(false);
                              }}
                              disabled={isLocating}
                              className="w-full px-3 py-2 rounded-xl bg-emerald-50 dark:bg-stone-800 hover:bg-emerald-100 dark:hover:bg-stone-700 text-emerald-900 dark:text-emerald-300 border border-emerald-200 dark:border-stone-700 font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                            >
                              <LocateFixed className={`w-4 h-4 text-emerald-700 dark:text-emerald-400 ${isLocating ? 'animate-spin' : ''}`} />
                              <span>{isLocating ? 'GPS Konumu Alınıyor...' : 'Otomatik GPS Konumu'}</span>
                            </button>

                            {/* Qibla Finder Button */}
                            <button
                              onClick={() => {
                                onOpenQiblaFinder();
                                setIsLocationMenuOpen(false);
                              }}
                              className="w-full px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                            >
                              <Compass className="w-4 h-4 text-amber-200" />
                              <span>🕋 Kıble Pusulasını Aç</span>
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Prominent Prayer Countdown Hero Banner */}
                  <div className="bg-stone-900 dark:bg-stone-950 text-white rounded-2xl p-4 sm:p-5 border border-stone-800/90 shadow-xs relative overflow-hidden">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
                      {/* Status Info */}
                      <div className="space-y-1">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-300 text-xs font-bold border border-emerald-800/80">
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                          <span>Mevcut Vakit: {countdownInfo.currentPrayerLabel}</span>
                        </div>
                        <p className="text-xs sm:text-sm font-medium text-stone-300 pt-0.5">
                          Sonraki Vakit: <span className="text-emerald-400 font-bold">{countdownInfo.nextPrayerLabel}</span>
                        </p>
                      </div>

                      {/* Clean Digital Countdown Timer */}
                      <div className="flex items-center gap-3 bg-stone-800/90 dark:bg-stone-900/90 px-4 py-2.5 rounded-2xl border border-stone-700/80 shrink-0 w-full sm:w-auto justify-between sm:justify-start">
                        <div className="text-left">
                          <span className="text-2xl sm:text-3xl font-black font-mono tracking-wider text-emerald-400 block">
                            {countdownInfo.countdownStr}
                          </span>
                        </div>
                        <div className="text-right sm:text-left pl-3 border-l border-stone-700/80">
                          <span className="text-[10px] font-bold text-stone-400 block uppercase tracking-wider">
                            KALAN SÜRE
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3.5 space-y-1">
                      <div className="flex justify-between items-center text-[10px] text-stone-400 font-semibold">
                        <span>Vakit İlerlemesi (%{countdownInfo.progressPercent})</span>
                        <span>{countdownInfo.nextPrayerLabel} Vakti</span>
                      </div>
                      <div className="w-full h-1.5 bg-stone-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                          style={{ width: `${countdownInfo.progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Prayer Times Grid */}
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {[
                      { key: 'Imsak', label: 'İmsak', time: prayerTimes.Imsak, icon: Moon },
                      { key: 'Gunes', label: 'Güneş', time: prayerTimes.Gunes, icon: Sun },
                      { key: 'Ogle', label: 'Öğle', time: prayerTimes.Ogle, icon: Sun },
                      { key: 'Ikindi', label: 'İkindi', time: prayerTimes.Ikindi, icon: Sun },
                      { key: 'Aksam', label: 'Akşam', time: prayerTimes.Aksam, icon: Moon },
                      { key: 'Yatsi', label: 'Yatsı', time: prayerTimes.Yatsi, icon: Moon },
                    ].map((p) => {
                      const isActive = countdownInfo.activeKey === p.key;
                      return (
                        <div
                          key={p.key}
                          className={`p-3 rounded-2xl border text-center space-y-1 transition-all ${
                            isActive
                              ? 'bg-emerald-800 dark:bg-emerald-900 text-white border-emerald-700 shadow-sm ring-1 ring-emerald-500/30'
                              : 'bg-stone-50 dark:bg-stone-800/80 border-stone-200/80 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800'
                          }`}
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span className={`text-[11px] font-bold block ${isActive ? 'text-emerald-100' : 'text-stone-500 dark:text-stone-400'}`}>
                              {p.label}
                            </span>
                          </div>
                          <span className={`text-sm sm:text-base font-black ${isActive ? 'text-white' : 'text-stone-900 dark:text-stone-100'}`}>
                            {p.time}
                          </span>
                          {isActive && (
                            <span className="block text-[9px] font-bold uppercase tracking-wider bg-emerald-950/80 text-emerald-200 px-1 py-0.5 rounded-full mt-1 border border-emerald-700/60">
                              Mevcut Vakit
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );

            case 'quickActions':
              return (
                <div key="quickActions" className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => onNavigateTab('quran')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') onNavigateTab('quran');
                    }}
                    className="p-4 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/90 dark:border-stone-800 shadow-2xs hover:border-emerald-500/50 hover:shadow-md transition-all space-y-3 text-left cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800/60 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <TitleWithHelp
                        title="Kur'an Oku"
                        description="Mushaf & Tefsir"
                        titleClassName="font-bold text-sm text-stone-900 dark:text-stone-100"
                      />
                    </div>
                  </div>

                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => onNavigateTab('sohbet')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') onNavigateTab('sohbet');
                    }}
                    className="p-4 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/90 dark:border-stone-800 shadow-2xs hover:border-amber-500/50 hover:shadow-md transition-all space-y-3 text-left cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-100 dark:border-amber-800/60 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Radio className="w-5 h-5" />
                    </div>
                    <div>
                      <TitleWithHelp
                        title="Sohbet Kaydet"
                        description="Ses & AI Özet"
                        titleClassName="font-bold text-sm text-stone-900 dark:text-stone-100"
                      />
                    </div>
                  </div>

                  <div
                    role="button"
                    tabIndex={0}
                    onClick={onOpenRiyazusModal}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') onOpenRiyazusModal();
                    }}
                    className="p-4 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/90 dark:border-stone-800 shadow-2xs hover:border-stone-400 dark:hover:border-stone-600 hover:shadow-md transition-all space-y-3 text-left cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-200/80 dark:border-stone-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Quote className="w-5 h-5" />
                    </div>
                    <div>
                      <TitleWithHelp
                        title="Riyazü’s-Sâlihîn"
                        description="Hadîs-i Şerîfler"
                        titleClassName="font-bold text-sm text-stone-900 dark:text-stone-100"
                      />
                    </div>
                  </div>

                  <div
                    role="button"
                    tabIndex={0}
                    onClick={onOpenQiblaFinder}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') onOpenQiblaFinder();
                    }}
                    className="p-4 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/90 dark:border-stone-800 shadow-2xs hover:border-emerald-500/50 hover:shadow-md transition-all space-y-3 text-left cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800/60 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Compass className="w-5 h-5" />
                    </div>
                    <div>
                      <TitleWithHelp
                        title="Kıble Pusulası"
                        description="Kâbe Yönü"
                        titleClassName="font-bold text-sm text-stone-900 dark:text-stone-100"
                      />
                    </div>
                  </div>
                </div>
              );

            case 'dailyVerse':
              return (
                <div
                  key="dailyVerse"
                  className="bg-white dark:bg-stone-900 rounded-3xl p-6 border border-stone-200/90 dark:border-stone-800 shadow-2xs space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-2">
                    <span className="text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                      Günün Tefekkür Ayeti
                    </span>
                    <button
                      onClick={() => onNavigateTab('quran')}
                      className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Sûreyi Oku</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="font-serif text-xl sm:text-2xl text-right dir-rtl leading-loose text-stone-900 dark:text-stone-100">
                    اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ
                  </p>
                  <p className="text-xs sm:text-sm font-medium text-stone-800 dark:text-stone-200 italic">
                    "Allah, kendisinden başka hiçbir ilâh olmayandır. Diridir, kayyumdur (her şeyin varlığı O’na bağlıdır)."
                  </p>
                  <p className="text-[11px] font-bold text-stone-600 dark:text-stone-400">— Bakara Sûresi, 255. Ayet (Âyetü’l-Kürsî)</p>
                </div>
              );

            case 'dailyHadith':
              return (
                <div
                  key="dailyHadith"
                  className="bg-white dark:bg-stone-900 rounded-3xl p-6 border border-stone-200/90 dark:border-stone-800 shadow-2xs space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-2">
                    <span className="text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                      <Quote className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                      Günün Hadîs-i Şerîfi (Riyazü’s-Sâlihîn)
                    </span>
                    <button
                      onClick={onOpenRiyazusModal}
                      className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Tüm Hadisleri İncele</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="font-serif text-lg sm:text-xl text-right dir-rtl leading-relaxed text-stone-900 dark:text-stone-100">
                    {todayHadith.arabic}
                  </p>
                  <p className="text-xs sm:text-sm font-medium text-stone-800 dark:text-stone-200 italic">
                    "{todayHadith.turkish}"
                  </p>
                  <p className="text-[11px] font-bold text-stone-500 dark:text-stone-400">
                    — {todayHadith.ravi} ({todayHadith.source})
                  </p>
                </div>
              );

            case 'sohbetPreview':
              return (
                <div
                  key="sohbetPreview"
                  className="bg-white dark:bg-stone-900 rounded-3xl p-6 border border-stone-200/90 dark:border-stone-800 shadow-2xs space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
                    <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2">
                      <Radio className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                      <span>Sohbet & Tefsir Dersleri Kayıt Özeti</span>
                    </h3>
                    <button
                      onClick={() => onNavigateTab('sohbet')}
                      className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Tümünü Gör ({sohbetSessions.length})</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {sohbetSessions.length === 0 ? (
                    <p className="text-xs text-stone-500 dark:text-stone-400">Henüz sohbet veya ders kaydı yok.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {sohbetSessions.slice(0, 2).map((s) => (
                        <div
                          key={s.id}
                          className="p-4 bg-stone-50 dark:bg-stone-800/80 rounded-2xl border border-stone-200/80 dark:border-stone-700 space-y-2 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                        >
                          <div className="flex items-center justify-between text-[10px] font-bold text-emerald-800 dark:text-emerald-400">
                            <span>{s.category}</span>
                            <span>{s.date}</span>
                          </div>
                          <h4 className="font-bold text-xs text-stone-900 dark:text-stone-100 line-clamp-1">{s.title}</h4>
                          <p className="text-[11px] text-stone-500 dark:text-stone-400 font-medium truncate">{s.venue}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );

            default:
              return null;
          }
        })}
      </div>
    </div>
  );
};
