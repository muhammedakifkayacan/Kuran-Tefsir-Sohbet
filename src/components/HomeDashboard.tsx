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
  const [cityNameLabel, setCityNameLabel] = useState<string>('İstanbul');
  const [isLocating, setIsLocating] = useState(false);
  const [prayerTimes, setPrayerTimes] = useState({
    Imsak: '04:12',
    Gunes: '05:50',
    Ogle: '13:08',
    Ikindi: '17:02',
    Aksam: '20:15',
    Yatsi: '21:48',
  });

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
    localStorage.setItem('kuran_app_prayer_city', cityName);
    const found = TURKEY_AND_WORLD_CITIES.find((c) => c.name === cityName);
    if (found) {
      fetchPrayerTimesForCoords(found.lat, found.lng, found.name);
    }
  };

  // On initial mount, fetch prayer times for the saved city
  useEffect(() => {
    const savedCity = localStorage.getItem('kuran_app_prayer_city') || 'İstanbul';
    const found = TURKEY_AND_WORLD_CITIES.find((c) => c.name === savedCity) || TURKEY_AND_WORLD_CITIES[0];
    if (found) {
      fetchPrayerTimesForCoords(found.lat, found.lng, found.name);
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
      <div className="bg-emerald-900 text-white rounded-3xl p-5 sm:p-7 shadow-lg border border-emerald-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-800 text-emerald-200 text-xs font-bold rounded-full mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Masaüstü & Mobil Bütünleşik Panel</span>
          </div>
          <TitleWithHelp
            title="Hoş Geldiniz, Hayırlı Dersler"
            description="Kur'an okumalarınızı, ders notlarınızı ve sohbet meclislerinizi tek ekrandan yönetin."
            titleClassName="text-xl sm:text-2xl font-bold tracking-tight text-white"
          />
        </div>

        <button
          onClick={() => setIsCustomizing(!isCustomizing)}
          className="px-4 py-2.5 rounded-2xl bg-emerald-800/90 hover:bg-emerald-800 text-emerald-100 font-bold text-xs border border-emerald-700 flex items-center gap-2 transition-all active:scale-95 cursor-pointer shrink-0"
        >
          <Sliders className="w-4 h-4 text-emerald-200" />
          <span>{isCustomizing ? 'Düzenlemeyi Bitir' : '⚙️ Ana Ekran Düzenini Özelleştir'}</span>
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
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-stone-100 dark:border-stone-800 pb-3">
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

                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                      {/* Manuel Şehir Seçimi Dropdown */}
                      <select
                        value={TURKEY_AND_WORLD_CITIES.some((c) => c.name === selectedCityName) ? selectedCityName : 'İstanbul'}
                        onChange={(e) => handleCitySelect(e.target.value)}
                        className="px-2.5 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 font-bold text-xs focus:outline-none cursor-pointer shadow-2xs"
                      >
                        {TURKEY_AND_WORLD_CITIES.map((c) => (
                          <option key={c.name} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>

                      <button
                        onClick={handleGetLocation}
                        disabled={isLocating}
                        className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-stone-800 hover:bg-emerald-100 dark:hover:bg-stone-700 text-emerald-900 dark:text-emerald-300 border border-emerald-200 dark:border-stone-700 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                        title="Otomatik Konum (GPS) İle İl Tespiti"
                      >
                        <LocateFixed className={`w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 ${isLocating ? 'animate-spin' : ''}`} />
                        <span>{isLocating ? 'GPS Alınıyor...' : 'Otomatik GPS'}</span>
                      </button>

                      <button
                        onClick={onOpenQiblaFinder}
                        className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
                      >
                        <Compass className="w-3.5 h-3.5 text-amber-200" />
                        <span>🕋 Kıble</span>
                      </button>
                    </div>
                  </div>

                  {/* Prayer Times Grid */}
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {[
                      { label: 'İmsak', time: prayerTimes.Imsak, icon: Moon },
                      { label: 'Güneş', time: prayerTimes.Gunes, icon: Sun },
                      { label: 'Öğle', time: prayerTimes.Ogle, icon: Sun },
                      { label: 'İkindi', time: prayerTimes.Ikindi, icon: Sun },
                      { label: 'Akşam', time: prayerTimes.Aksam, icon: Moon },
                      { label: 'Yatsı', time: prayerTimes.Yatsi, icon: Moon },
                    ].map((p, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-stone-50 dark:bg-stone-800/80 rounded-2xl border border-stone-200/80 dark:border-stone-700 text-center space-y-1 hover:bg-amber-50/50 dark:hover:bg-stone-800 transition-colors"
                      >
                        <span className="text-[11px] text-stone-500 dark:text-stone-400 font-bold block">{p.label}</span>
                        <span className="text-sm sm:text-base font-black text-stone-900 dark:text-stone-100">{p.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );

            case 'quickActions':
              return (
                <div key="quickActions" className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <button
                    onClick={() => onNavigateTab('quran')}
                    className="p-4 bg-emerald-900 dark:bg-emerald-950 text-white rounded-3xl hover:bg-emerald-950 dark:hover:bg-emerald-900 border border-emerald-800 transition-all shadow-2xs space-y-2 text-left cursor-pointer group"
                  >
                    <BookOpen className="w-6 h-6 text-emerald-300 group-hover:scale-110 transition-transform" />
                    <div>
                      <TitleWithHelp
                        title="Kur'an Oku"
                        description="Mushaf & Tefsir"
                        titleClassName="font-bold text-sm text-white"
                      />
                    </div>
                  </button>

                  <button
                    onClick={() => onNavigateTab('sohbet')}
                    className="p-4 bg-amber-800 dark:bg-amber-900 text-white rounded-3xl hover:bg-amber-900 dark:hover:bg-amber-800 border border-amber-700 transition-all shadow-2xs space-y-2 text-left cursor-pointer group"
                  >
                    <Radio className="w-6 h-6 text-amber-200 group-hover:scale-110 transition-transform" />
                    <div>
                      <TitleWithHelp
                        title="Sohbet Kaydet"
                        description="Ses & AI Özet"
                        titleClassName="font-bold text-sm text-white"
                      />
                    </div>
                  </button>

                  <button
                    onClick={onOpenRiyazusModal}
                    className="p-4 bg-stone-900 dark:bg-stone-800 text-white rounded-3xl hover:bg-stone-950 dark:hover:bg-stone-700 border border-stone-800 transition-all shadow-2xs space-y-2 text-left cursor-pointer group"
                  >
                    <Quote className="w-6 h-6 text-amber-400 group-hover:scale-110 transition-transform" />
                    <div>
                      <TitleWithHelp
                        title="Riyazü’s-Sâlihîn"
                        description="Hadîs-i Şerîfler"
                        titleClassName="font-bold text-sm text-white"
                      />
                    </div>
                  </button>

                  <button
                    onClick={onOpenQiblaFinder}
                    className="p-4 bg-amber-600 dark:bg-amber-700 text-white rounded-3xl hover:bg-amber-700 dark:hover:bg-amber-600 border border-amber-500 transition-all shadow-2xs space-y-2 text-left cursor-pointer group"
                  >
                    <Compass className="w-6 h-6 text-amber-100 group-hover:scale-110 transition-transform" />
                    <div>
                      <TitleWithHelp
                        title="Kıble Pusulası"
                        description="Kâbe Yönü"
                        titleClassName="font-bold text-sm text-white"
                      />
                    </div>
                  </button>
                </div>
              );

            case 'dailyVerse':
              return (
                <div
                  key="dailyVerse"
                  className="bg-white dark:bg-stone-900 rounded-3xl p-6 border border-stone-200/90 dark:border-stone-800 shadow-2xs space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-2">
                    <span className="text-xs font-bold text-amber-900 dark:text-amber-400 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      Günün Tefekkür Ayeti
                    </span>
                    <button
                      onClick={() => onNavigateTab('quran')}
                      className="text-xs font-bold text-amber-800 dark:text-amber-300 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Sûreyi Oku</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="font-serif text-xl sm:text-2xl text-right dir-rtl leading-loose text-stone-900 dark:text-amber-100">
                    اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ
                  </p>
                  <p className="text-xs sm:text-sm font-medium text-stone-800 dark:text-stone-200 italic">
                    "Allah, kendisinden başka hiçbir ilâh olmayandır. Diridir, kayyumdur (her şeyin varlığı O’na bağlıdır)."
                  </p>
                  <p className="text-[11px] font-bold text-amber-900 dark:text-amber-400">— Bakara Sûresi, 255. Ayet (Âyetü’l-Kürsî)</p>
                </div>
              );

            case 'dailyHadith':
              return (
                <div
                  key="dailyHadith"
                  className="bg-white dark:bg-stone-900 rounded-3xl p-6 border border-stone-200/90 dark:border-stone-800 shadow-2xs space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-2">
                    <span className="text-xs font-bold text-emerald-900 dark:text-emerald-400 flex items-center gap-1.5">
                      <Quote className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                      Günün Hadîs-i Şerîfi (Riyazü’s-Sâlihîn)
                    </span>
                    <button
                      onClick={onOpenRiyazusModal}
                      className="text-xs font-bold text-emerald-800 dark:text-emerald-300 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Tüm Hadisleri İncele</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="font-serif text-lg sm:text-xl text-right dir-rtl leading-relaxed text-stone-900 dark:text-amber-100">
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
                      <Radio className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                      <span>Sohbet & Tefsir Dersleri Kayıt Özeti</span>
                    </h3>
                    <button
                      onClick={() => onNavigateTab('sohbet')}
                      className="text-xs font-bold text-amber-800 dark:text-amber-300 hover:underline flex items-center gap-1 cursor-pointer"
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
                          className="p-4 bg-stone-50 dark:bg-stone-800/80 rounded-2xl border border-stone-200/80 dark:border-stone-700 space-y-2 hover:bg-amber-50/50 dark:hover:bg-stone-800 transition-colors"
                        >
                          <div className="flex items-center justify-between text-[10px] font-bold text-amber-800 dark:text-amber-400">
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
