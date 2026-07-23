import React, { useState, useEffect } from 'react';
import { Bookmark, Sparkles, Mic, Search, Volume2, Info, Check, BookOpen, List, ChevronLeft, ChevronRight, ChevronDown, Edit3, Minimize2, FileText, X, Type, SlidersHorizontal, ArrowRight } from 'lucide-react';
import { Surah, Ayah, VerseNote } from '../types';
import { ALL_SURAHS } from '../data/surahList';
import { fetchSurahFromApi } from '../utils/quranApi';

interface QuranReaderProps {
  selectedSurah: Surah;
  setSelectedSurah: (surah: Surah) => void;
  loadSurah: (id: number) => Promise<void>;
  isLoadingSurah: boolean;
  surahError: string | null;
  isFullScreen: boolean;
  setIsFullScreen: (val: boolean) => void;
  activeAyah: Ayah | null;
  setActiveAyah: (ayah: Ayah) => void;
  isPlaying: boolean;
  onPlayAyah: (ayah: Ayah) => void;
  onOpenAiTajweedExplain: (surahName: string, verseNumber: number, verseText: string) => void;
  onSaveVerseNote: (note: Omit<VerseNote, 'id' | 'createdAt'>) => void;
  onOpenVoiceRecorder: () => void;
  areOverlaysVisible?: boolean;
  pageTheme?: 'ivory' | 'mint' | 'white' | 'dark';
  setPageTheme?: (theme: 'ivory' | 'mint' | 'white' | 'dark') => void;
  fontSize?: 'md' | 'lg' | 'xl' | '2xl';
  setFontSize?: (size: 'md' | 'lg' | 'xl' | '2xl') => void;
  showTajweed?: boolean;
  setShowTajweed?: (val: boolean) => void;
  showTranslation?: boolean;
  setShowTranslation?: (val: boolean) => void;
  user?: { name: string; email: string; avatar: string } | null;
  onRequireAuth?: (message: string) => void;
}

// 14 Tilavet Secdesi Ayeti Listesi (Sûre No ve Ayet No)
const SAJDAH_VERSES = [
  { surah: 7, verse: 206 },  // A'raf Sûresi 206
  { surah: 13, verse: 15 },  // Ra'd Sûresi 15
  { surah: 16, verse: 50 },  // Nahl Sûresi 50
  { surah: 17, verse: 109 }, // İsrâ Sûresi 109
  { surah: 19, verse: 58 },  // Meryem Sûresi 58
  { surah: 22, verse: 18 },  // Hac Sûresi 18
  { surah: 22, verse: 77 },  // Hac Sûresi 77 (Şâfiî)
  { surah: 25, verse: 60 },  // Furkân Sûresi 60
  { surah: 27, verse: 26 },  // Neml Sûresi 26
  { surah: 32, verse: 15 },  // Secde Sûresi 15
  { surah: 38, verse: 24 },  // Sâd Sûresi 24
  { surah: 41, verse: 38 },  // Fussilet Sûresi 38
  { surah: 53, verse: 62 },  // Necm Sûresi 62
  { surah: 84, verse: 21 },  // İnşikâk Sûresi 21
  { surah: 96, verse: 19 },  // Alak Sûresi 19
];

const checkIsSajdahVerse = (surahId: number, verseNumber: number): boolean => {
  return SAJDAH_VERSES.some((s) => s.surah === surahId && s.verse === verseNumber);
};

// Arapça Metin Harekeleri (Tashkeel) Temizleme ve Normalizasyon Yardımcısı
export const normalizeArabicText = (text: string): string => {
  if (!text) return '';
  return text
    // Arapça Harekeleri (fatha, damma, kasra, sukun, shadda, tanween vb.) temizler
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E8\u06EA-\u06ED]/g, '')
    // Elif biçimlerini (أ, إ, آ, ٱ -> ا) standartlaştırır
    .replace(/[\u0622\u0623\u0625\u0671]/g, '\u0627')
    // Ye ve Elif Maksura (ى -> ي) standartlaştırır
    .replace(/\u0649/g, '\u064A')
    // Te Marbuta (ة -> ه) standartlaştırır
    .replace(/\u0629/g, '\u0647')
    .trim();
};

export const isArabicText = (text: string): boolean => {
  return /[\u0600-\u06FF]/.test(text);
};

// Türkçe Metindeki Sayı Sözcüklerini Sayıya Dönüştürme Yardımcısı
const parseTurkishNumberInText = (str: string): number | null => {
  if (!str) return null;
  const cleaned = str.trim().toLowerCase();
  
  // Doğrudan sayı varsa
  const directNum = cleaned.match(/\d+/);
  if (directNum) return parseInt(directNum[0], 10);

  const units: Record<string, number> = {
    'bir': 1, 'iki': 2, 'üç': 3, 'uc': 3, 'dört': 4, 'dort': 4, 'beş': 5, 'bes': 5,
    'altı': 6, 'alti': 6, 'yedi': 7, 'sekiz': 8, 'dokuz': 9
  };
  const tens: Record<string, number> = {
    'on': 10, 'yirmi': 20, 'otuz': 30, 'kırk': 40, 'kirk': 40, 'elli': 50,
    'altmış': 60, 'altmis': 60, 'yetmiş': 70, 'yetmis': 70, 'seksen': 80, 'doksan': 90
  };

  const words = cleaned.split(/\s+/);
  let total = 0;
  let currentWordVal = 0;

  for (const w of words) {
    if (w === 'yüz' || w === 'yuz') {
      total += (currentWordVal || 1) * 100;
      currentWordVal = 0;
    } else if (units[w]) {
      currentWordVal += units[w];
    } else if (tens[w]) {
      currentWordVal += tens[w];
    }
  }
  total += currentWordVal;
  return total > 0 ? total : null;
};

export interface SmartQueryResult {
  type: 'verse' | 'surah' | 'page';
  surahId?: number;
  surahName?: string;
  verseNumber?: number;
  pageNumber?: number;
  title: string;
  description: string;
}

const resolveSmartQuery = (input: string, currentSurah?: Surah): SmartQueryResult | null => {
  if (!input || !input.trim()) return null;

  // 0. Arapça Okuma / Tilavet Metni İle Doğrudan Ayet Eşleştirme
  if (isArabicText(input)) {
    const normQ = normalizeArabicText(input);
    if (normQ.length >= 2) {
      // Önce mevcut yüklü sûre içinde ara
      if (currentSurah) {
        const matchedInCurrent = currentSurah.verses.find((v) =>
          normalizeArabicText(v.arabic).includes(normQ)
        );
        if (matchedInCurrent) {
          return {
            type: 'verse',
            surahId: currentSurah.id,
            surahName: currentSurah.nameTurkish,
            verseNumber: matchedInCurrent.number,
            pageNumber: matchedInCurrent.page,
            title: `${currentSurah.nameTurkish} ${matchedInCurrent.number}. Ayet (Arapça Eşleşme)`,
            description: matchedInCurrent.translation || matchedInCurrent.arabic,
          };
        }
      }
      // Sûre isimlerinde Arapça arama
      const matchedArabicSurah = ALL_SURAHS.find((s) =>
        s.nameArabic && normalizeArabicText(s.nameArabic).includes(normQ)
      );
      if (matchedArabicSurah) {
        return {
          type: 'surah',
          surahId: matchedArabicSurah.id,
          surahName: matchedArabicSurah.nameTurkish,
          title: `${matchedArabicSurah.nameTurkish} (${matchedArabicSurah.nameArabic})`,
          description: `${matchedArabicSurah.versesCount} Ayet`,
        };
      }
    }
  }

  const q = input.toLowerCase().trim();

  // 1. Ünlü Özel Ayet / Sûre Eşleşmeleri (Hem Türkçe hem Arapça Tilavet Metinleri)
  const famousMap = [
    { keywords: ['ayete', 'kursi', 'kürsi', 'bakara 255', 'الله لا اله الا هو', 'الله لا إله إلا هو'], surahId: 2, verseNumber: 255, pageNumber: 42, title: "Ayetü'l-Kürsî", description: 'Bakara Sûresi 255. Ayet (Sayfa 42)' },
    { keywords: ['amener', 'rasulu', 'resulü', 'bakara 285', 'bakara 286', 'امن الرسول', 'آمن الرسول'], surahId: 2, verseNumber: 285, pageNumber: 49, title: "Âmenerra'sûlü", description: 'Bakara Sûresi 285. Ayet (Sayfa 49)' },
    { keywords: ['fatiha', 'elham', 'الحمد لله', 'الحمد لله رب العالمين', 'الفاتحة'], surahId: 1, verseNumber: 1, pageNumber: 1, title: 'Fâtiha Sûresi', description: '1. Sayfa' },
    { keywords: ['yasin', 'yâsîn', 'يس', 'يس والقرآن الحكيم'], surahId: 36, verseNumber: 1, pageNumber: 440, title: 'Yâsîn Sûresi', description: 'Sayfa 440' },
    { keywords: ['ihlas', 'ihlaş', 'kul huvallahu', 'قل هو الله', 'قل هو الله احد', 'الإخلاص'], surahId: 112, verseNumber: 1, pageNumber: 604, title: 'İhlâs Sûresi', description: 'Sayfa 604' },
    { keywords: ['felak', 'قل اعوذ برب الفلق', 'الفلق'], surahId: 113, verseNumber: 1, pageNumber: 604, title: 'Felak Sûresi', description: 'Sayfa 604' },
    { keywords: ['nas', 'nâs', 'قل اعوذ برب الناس', 'الناس'], surahId: 114, verseNumber: 1, pageNumber: 604, title: 'Nâs Sûresi', description: 'Sayfa 604' },
    { keywords: ['mulk', 'mülk', 'tebareke', 'تبارك الذي بيده الملك', 'الملك'], surahId: 67, verseNumber: 1, pageNumber: 562, title: 'Mülk (Tebâreke) Sûresi', description: 'Sayfa 562' },
    { keywords: ['nebe', 'amme', 'عم يتساءلون', 'النبأ'], surahId: 78, verseNumber: 1, pageNumber: 582, title: 'Nebe (Amme) Sûresi', description: 'Sayfa 582' },
    { keywords: ['kevser', 'إنا أعطيناك الكوثر', 'الكوثر'], surahId: 108, verseNumber: 1, pageNumber: 602, title: 'Kevser Sûresi', description: 'Sayfa 602' },
    { keywords: ['kadr', 'kadir', 'إنا أنزلناه في ليلة القدر', 'القدر'], surahId: 97, verseNumber: 1, pageNumber: 598, title: 'Kadir Sûresi', description: 'Sayfa 598' },
    { keywords: ['zilzal', 'إذا زلزلت الأرض', 'الزلزلة'], surahId: 99, verseNumber: 1, pageNumber: 599, title: 'Zilzâl Sûresi', description: 'Sayfa 599' },
    { keywords: ['asr', 'والعصر', 'العصر'], surahId: 103, verseNumber: 1, pageNumber: 601, title: 'Asr Sûresi', description: 'Sayfa 601' },
    { keywords: ['fil', 'ألم تر كيف فعل ربك', 'الفيل'], surahId: 105, verseNumber: 1, pageNumber: 601, title: 'Fîl Sûresi', description: 'Sayfa 601' },
    { keywords: ['kureys', 'kureyş', 'لإيلاف قريش', 'قريش'], surahId: 106, verseNumber: 1, pageNumber: 602, title: 'Kureyş Sûresi', description: 'Sayfa 602' },
    { keywords: ['maun', 'mâûn', 'أرأيت الذي يكذب بالدين', 'الماعون'], surahId: 107, verseNumber: 1, pageNumber: 602, title: 'Mâûn Sûresi', description: 'Sayfa 602' },
    { keywords: ['kafirun', 'kâfirûn', 'قل يا أيها الكافرون', 'الكافرون'], surahId: 109, verseNumber: 1, pageNumber: 603, title: 'Kâfirûn Sûresi', description: 'Sayfa 603' },
    { keywords: ['nasr', 'إذا جاء نصر الله', 'النصر'], surahId: 110, verseNumber: 1, pageNumber: 603, title: 'Nasr Sûresi', description: 'Sayfa 603' },
    { keywords: ['tebbet', 'lahab', 'تبت يدا', 'المسد'], surahId: 111, verseNumber: 1, pageNumber: 603, title: 'Tebbet Sûresi', description: 'Sayfa 603' },
    { keywords: ['nazar', 'kalem 51', 'وإن يكاد الذين كفروا'], surahId: 68, verseNumber: 51, pageNumber: 566, title: 'Nazar Ayeti (Kalem 51-52)', description: 'Sayfa 566' },
    { keywords: ['hasr 21', 'haşr 21', 'lev anzelna', 'yestevi', 'لو أنزلنا هذا القرآن'], surahId: 59, verseNumber: 21, pageNumber: 548, title: 'Haşr Sûresi Son Ayetler (Lâ yestevî)', description: 'Sayfa 548' },
    { keywords: ['rahman', 'rah mân', 'الرحمن', 'الرحمن علم القرآن'], surahId: 55, verseNumber: 1, pageNumber: 531, title: 'Rahmân Sûresi', description: 'Sayfa 531' },
    { keywords: ['vakia', 'vâkıa', 'إذا وقعت الواقعة', 'الواقعة'], surahId: 56, verseNumber: 1, pageNumber: 534, title: 'Vâkıa Sûresi', description: 'Sayfa 534' },
    { keywords: ['cuma', 'cum\'a', 'يسبح لله ما في السماوات', 'الجمعة'], surahId: 62, verseNumber: 1, pageNumber: 553, title: 'Cum\'a Sûresi', description: 'Sayfa 553' },
  ];

  const normInput = normalizeArabicText(input.toLowerCase().trim());
  const plainInput = input.toLowerCase().trim();

  for (const item of famousMap) {
    if (item.keywords.some((k) => {
      const normK = normalizeArabicText(k.toLowerCase());
      return plainInput.includes(k.toLowerCase()) || (normK && normInput.includes(normK));
    })) {
      return {
        type: 'verse',
        surahId: item.surahId,
        verseNumber: item.verseNumber,
        pageNumber: item.pageNumber,
        title: item.title,
        description: item.description,
      };
    }
  }

  // 2. "Sayfa X" veya "X. sayfa" veya "s. X" sorgusu
  if (q.includes('sayfa') || q.includes('s.')) {
    const pNum = parseTurkishNumberInText(q);
    if (pNum && pNum >= 1 && pNum <= 604) {
      return {
        type: 'page',
        pageNumber: pNum,
        title: `Sayfa ${pNum}`,
        description: `Kur'an-ı Kerim ${pNum}. Sayfa`,
      };
    }
  }

  // 3. "SûreNo:AyetNo" veya "SûreNo/AyetNo" veya "SûreNo-AyetNo" (ör. 2:255, 2/255, 36/1)
  const separatorMatch = q.match(/^(\d+)[\:\/\-\.\s]+(\d+)$/);
  if (separatorMatch) {
    const sId = parseInt(separatorMatch[1], 10);
    const vNum = parseInt(separatorMatch[2], 10);
    const surahObj = ALL_SURAHS.find((s) => s.id === sId);
    if (surahObj && vNum >= 1 && vNum <= surahObj.versesCount) {
      const vObj = currentSurah?.id === sId ? currentSurah.verses.find((v) => v.number === vNum) : null;
      const targetPage = vObj?.page || (currentSurah?.id === sId ? currentSurah.startPage : 1);
      return {
        type: 'verse',
        surahId: sId,
        surahName: surahObj.nameTurkish,
        verseNumber: vNum,
        pageNumber: targetPage,
        title: `${surahObj.nameTurkish} ${vNum}. Ayet`,
        description: `Ayet ${vNum}`,
      };
    }
  }

  // 4. "SûreAdı AyetNo" veya Sûre Adı (ör. "Bakara 255", "Yasin 50", "الفاتحة", "البقرة 255")
  for (const surahObj of ALL_SURAHS) {
    const sNameTr = surahObj.nameTurkish.toLowerCase().replace(' sûresi', '').replace(' suresi', '').trim();
    const sNameAr = normalizeArabicText(surahObj.nameArabic);
    const isTrMatch = q.includes(sNameTr);
    const isArMatch = normInput && normInput.includes(sNameAr);

    if (isTrMatch || isArMatch) {
      // Sûre adı var, sayı var mı bakalım
      const numPart = q.replace(sNameTr, '').replace('sûresi', '').replace('suresi', '').replace('ayet', '').replace('ayeti', '').trim();
      const parsedNum = parseTurkishNumberInText(numPart);
      if (parsedNum && parsedNum >= 1 && parsedNum <= surahObj.versesCount) {
        const vObj = currentSurah?.id === surahObj.id ? currentSurah.verses.find((v) => v.number === parsedNum) : null;
        const targetPage = vObj?.page || (currentSurah?.id === surahObj.id ? currentSurah.startPage : 1);
        return {
          type: 'verse',
          surahId: surahObj.id,
          surahName: surahObj.nameTurkish,
          verseNumber: parsedNum,
          pageNumber: targetPage,
          title: `${surahObj.nameTurkish} ${parsedNum}. Ayet`,
          description: `Ayet ${parsedNum}`,
        };
      } else {
        // Sadece Sûre adı var
        return {
          type: 'surah',
          surahId: surahObj.id,
          surahName: surahObj.nameTurkish,
          title: `${surahObj.nameTurkish} (${surahObj.nameArabic})`,
          description: `${surahObj.versesCount} Ayet - ${surahObj.revelationType}`,
        };
      }
    }
  }

  // 5. Sadece Sayı Girilmesi (Örn: "255", "100", "50")
  const digitsOnly = q.replace(/\D/g, '');
  if (digitsOnly) {
    const val = parseInt(digitsOnly, 10);
    if (currentSurah) {
      const vObj = currentSurah.verses.find((v) => v.number === val);
      if (vObj) {
        return {
          type: 'verse',
          surahId: currentSurah.id,
          surahName: currentSurah.nameTurkish,
          verseNumber: val,
          pageNumber: vObj.page,
          title: `${currentSurah.nameTurkish} ${val}. Ayet`,
          description: `Sayfa ${vObj.page} (Mevcut Sûre)`,
        };
      }
    }
  }

  return null;
};

export const QuranReader: React.FC<QuranReaderProps> = ({
  selectedSurah,
  setSelectedSurah,
  loadSurah,
  isLoadingSurah,
  surahError,
  isFullScreen,
  setIsFullScreen,
  activeAyah,
  setActiveAyah,
  isPlaying,
  onPlayAyah,
  onOpenAiTajweedExplain,
  onSaveVerseNote,
  onOpenVoiceRecorder,
  areOverlaysVisible = true,
  pageTheme = 'ivory',
  setPageTheme = (_theme: 'ivory' | 'mint' | 'white' | 'dark') => {},
  fontSize: propFontSize,
  setFontSize: propSetFontSize,
  showTajweed: propShowTajweed,
  setShowTajweed: propSetShowTajweed,
  showTranslation: propShowTranslation,
  setShowTranslation: propSetShowTranslation,
  user,
  onRequireAuth,
}) => {
  // Reading Mode state
  const [viewMode, setViewMode] = useState<'mushaf' | 'meal' | 'detailed'>('mushaf');
  const [selectedMushafAyah, setSelectedMushafAyah] = useState<Ayah | null>(null);

  const [localShowTajweed, setLocalShowTajweed] = useState(true);
  const [showTransliteration, setShowTransliteration] = useState(true);
  const [localShowTranslation, setLocalShowTranslation] = useState(true);
  const [localFontSize, setLocalFontSize] = useState<'md' | 'lg' | 'xl' | '2xl'>('xl');

  const showTajweed = propShowTajweed !== undefined ? propShowTajweed : localShowTajweed;
  const setShowTajweed = propSetShowTajweed || setLocalShowTajweed;

  const showTranslation = propShowTranslation !== undefined ? propShowTranslation : localShowTranslation;
  const setShowTranslation = propSetShowTranslation || setLocalShowTranslation;

  const fontSize = propFontSize !== undefined ? propFontSize : localFontSize;
  const setFontSize = propSetFontSize || setLocalFontSize;

  const [searchQuery, setSearchQuery] = useState('');
  const [filterJuz, setFilterJuz] = useState<number | 'all'>('all');
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchCategoryTab, setSearchCategoryTab] = useState<'all' | 'surahs' | 'verses' | 'pages'>('all');
  const [isLiveListening, setIsLiveListening] = useState(false);

  // AI Voice Search States
  const [isVoiceSearching, setIsVoiceSearching] = useState(false);
  const [voiceSearchStatus, setVoiceSearchStatus] = useState<'idle' | 'listening' | 'analyzing'>('idle');
  const [voiceSearchLang, setVoiceSearchLang] = useState<'ar-SA' | 'tr-TR'>('ar-SA');
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [voiceSearchResult, setVoiceSearchResult] = useState<{
    surahId: number;
    surahName: string;
    verseNumber: number;
    pageNumber: number;
    matchedArabicText: string;
    matchedTurkishTranslation: string;
    confidenceExplanation: string;
    engine?: string;
    tarteelTranscript?: string;
  } | null>(null);

  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);
  const speechRecognitionRef = React.useRef<any>(null);
  const liveVoiceTimeoutRef = React.useRef<any>(null);

  // Smart Match Direct Navigation Helper
  const navigateToSmartMatch = async (match: SmartQueryResult) => {
    if (!match) return;
    try {
      if (match.surahId) {
        if (selectedSurah.id !== match.surahId) {
          await loadSurah(match.surahId);
        }
      }
      if (match.pageNumber) {
        setSelectedPage(match.pageNumber);
      }
      if (match.verseNumber && match.surahId) {
        const targetSurah = selectedSurah.id === match.surahId ? selectedSurah : await fetchSurahFromApi(match.surahId);
        if (targetSurah) {
          const vObj = targetSurah.verses.find((v) => v.number === match.verseNumber);
          if (vObj) {
            setSelectedMushafAyah(vObj);
            setActiveAyah(vObj);
            if (vObj.page) setSelectedPage(vObj.page);
          }
        }
      }
      setIsSearchModalOpen(false);
      setIsVoiceSearching(false);
      showToast(`🎯 Bulundu ve Açıldı: ${match.title}`);
    } catch (e) {
      console.warn('Smart match navigation error:', e);
    }
  };

  // Instant Client-side Live Speech-to-Text Input (%100 Ücretsiz & Doğrudan Ayete Giden Akıllı Mod)
  const toggleLiveVoiceInput = () => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) {
      alert('Tarayıcınız anlık ses tanıma özelliğini desteklemiyor. Lütfen metin ile arayın.');
      return;
    }

    if (isLiveListening) {
      if (speechRecognitionRef.current) {
        try { speechRecognitionRef.current.stop(); } catch (e) {}
      }
      if (liveVoiceTimeoutRef.current) clearTimeout(liveVoiceTimeoutRef.current);
      setIsLiveListening(false);
    } else {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = voiceSearchLang; // Selected language ('ar-SA' for Arabic Quran, 'tr-TR' for Turkish)

        recognition.onresult = (event: any) => {
          let fullTranscript = '';
          let hasFinal = false;

          for (let i = 0; i < event.results.length; i++) {
            fullTranscript += event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              hasFinal = true;
            }
          }

          const trimmed = fullTranscript.trim();
          if (trimmed) {
            setSearchQuery(trimmed);

            if (liveVoiceTimeoutRef.current) clearTimeout(liveVoiceTimeoutRef.current);

            liveVoiceTimeoutRef.current = setTimeout(async () => {
              const smartMatch = resolveSmartQuery(trimmed, selectedSurah);
              if (smartMatch) {
                try { recognition.stop(); } catch (e) {}
                setIsLiveListening(false);
                await navigateToSmartMatch(smartMatch);
              }
            }, hasFinal ? 400 : 1200);
          }
        };

        recognition.onerror = (err: any) => {
          console.warn('SpeechRecognition error:', err);
        };

        recognition.onend = () => {
          setIsLiveListening(false);
        };

        recognition.start();
        speechRecognitionRef.current = recognition;
        setIsLiveListening(true);
      } catch (e) {
        console.warn('Could not start live speech recognition:', e);
      }
    }
  };

  const startAiVoiceSearch = async () => {
    setVoiceError(null);
    setVoiceTranscript('');
    setVoiceSearchResult(null);
    setIsVoiceSearching(true);
    setVoiceSearchStatus('listening');

    // 1. Initialize Web Speech API if supported
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = voiceSearchLang; // Selected language ('ar-SA' for Arabic Quran Recitation, 'tr-TR' for Turkish)

        recognition.onresult = (event: any) => {
          let fullTranscript = '';
          for (let i = 0; i < event.results.length; i++) {
            fullTranscript += event.results[i][0].transcript;
          }
          setVoiceTranscript(fullTranscript);
        };

        recognition.onerror = (err: any) => {
          console.warn('SpeechRecognition error:', err);
        };

        recognition.start();
        speechRecognitionRef.current = recognition;
      } catch (e) {
        console.warn('Speech recognition start error:', e);
      }
    }

    // 2. Also record media audio via MediaRecorder for Tarteel AI Whisper
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
    } catch (err) {
      console.warn('MediaRecorder or mic permission error:', err);
    }
  };

  const stopAiVoiceSearch = async () => {
    setVoiceSearchStatus('analyzing');

    if (speechRecognitionRef.current) {
      try { speechRecognitionRef.current.stop(); } catch (e) {}
    }

    let finalAudioBase64: string | null = null;
    let mimeType = 'audio/webm';

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      await new Promise<void>((resolve) => {
        mediaRecorderRef.current!.onstop = () => resolve();
        mediaRecorderRef.current!.stop();
        mediaRecorderRef.current!.stream.getTracks().forEach((track) => track.stop());
      });

      if (audioChunksRef.current.length > 0) {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        mimeType = audioBlob.type || 'audio/webm';
        const arrayBuffer = await audioBlob.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        finalAudioBase64 = btoa(binary);
      }
    }

    try {
      const response = await fetch('/api/quran-voice-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: voiceTranscript,
          audioBase64: finalAudioBase64,
          mimeType,
        }),
      });

      const data = await response.json();
      const transcribedText = (data.text || voiceTranscript || '').trim();

      if (transcribedText) {
        setSearchQuery(transcribedText);
        const smartMatch = resolveSmartQuery(transcribedText, selectedSurah);
        if (smartMatch) {
          await navigateToSmartMatch(smartMatch);
        } else {
          setVoiceSearchResult({
            surahId: 1,
            surahName: 'Arama Yapıldı',
            verseNumber: 1,
            pageNumber: 1,
            matchedArabicText: transcribedText,
            matchedTurkishTranslation: `"${transcribedText}" ifadesi arama çubuğuna yazıldı.`,
            confidenceExplanation: `Tarteel AI Whisper Metni: "${transcribedText}"`,
            engine: data.engine || 'Tarteel AI Whisper (0 Kredi)',
            tarteelTranscript: transcribedText,
          });
          setVoiceSearchStatus('idle');
        }
      } else {
        throw new Error('Ses kaydından metin çıkarılamadı. Lütfen tekrar berrak şekilde okuyun.');
      }
    } catch (err: any) {
      console.error('Voice Search Error:', err);
      setVoiceError(err.message || 'Okunan ayet veya sûre tespit edilemedi. Lütfen tekrar berrak şekilde okuyun.');
      setVoiceSearchStatus('idle');
    }
  };

  const cancelAiVoiceSearch = () => {
    if (speechRecognitionRef.current) {
      try { speechRecognitionRef.current.stop(); } catch (e) {}
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      } catch (e) {}
    }
    setIsVoiceSearching(false);
    setVoiceSearchStatus('idle');
    setVoiceTranscript('');
    setVoiceError(null);
  };

  // Instant Search Results computation
  const searchResults = (() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase().trim();

    // Smart Match (Örn: "Bakara 255", "Ayetel Kürsi", "2/255", "Sayfa 100" veya Arapça tilavet)
    const smartMatch = resolveSmartQuery(q, selectedSurah);

    // 1. Matched Surahs
    const matchedSurahs = ALL_SURAHS.filter(
      (s) =>
        (s.nameTurkish && s.nameTurkish.toLowerCase().includes(q)) ||
        (s.nameArabic && (s.nameArabic.includes(q) || (isArabicText(q) && normalizeArabicText(s.nameArabic).includes(normalizeArabicText(q))))) ||
        (s.id && s.id.toString() === q)
    ).slice(0, 6);

    // 2. Page match
    let pageMatch: number | null = null;
    const digitsOnly = q.replace(/\D/g, '');
    if (digitsOnly) {
      const pNum = parseInt(digitsOnly, 10);
      if (pNum >= 1 && pNum <= 604) {
        if (q.includes('sayfa') || q.includes('s.') || q.startsWith('s ') || digitsOnly === q) {
          pageMatch = pNum;
        }
      }
    }

    // 3. Matched Verses in loaded Surah (Hem Türkçe hem Harekeleri Temizlenmiş Arapça Arama)
    const normArabicQ = isArabicText(q) ? normalizeArabicText(q) : '';

    const matchedVersesInSurah = selectedSurah.verses.filter(
      (v) =>
        (v.number && v.number.toString() === q) ||
        (v.turkishTranslation && v.turkishTranslation.toLowerCase().includes(q)) ||
        (v.translation && v.translation.toLowerCase().includes(q)) ||
        (v.arabic && v.arabic.includes(q)) ||
        (normArabicQ && normalizeArabicText(v.arabic).includes(normArabicQ)) ||
        (v.transliteration && v.transliteration.toLowerCase().includes(q))
    ).slice(0, 10);

    // 4. If digits only or verse search, find matching verse numbers across ALL Surahs
    let matchedAllQuranVersesByNumber: { surahId: number; surahName: string; verseNumber: number; pageNumber: number; translation: string }[] = [];
    if (digitsOnly && (digitsOnly === q || q.includes('ayet'))) {
      const targetVerseNum = parseInt(digitsOnly, 10);
      if (targetVerseNum > 0) {
        ALL_SURAHS.forEach((s) => {
          if (targetVerseNum <= s.versesCount) {
            const isCurrent = selectedSurah.id === s.id;
            const vObj = isCurrent ? selectedSurah.verses.find((v) => v.number === targetVerseNum) : null;
            matchedAllQuranVersesByNumber.push({
              surahId: s.id,
              surahName: s.nameTurkish,
              verseNumber: targetVerseNum,
              pageNumber: vObj?.page || (isCurrent ? selectedSurah.startPage : 1),
              translation: vObj?.turkishTranslation || vObj?.translation || '',
            });
          }
        });
        matchedAllQuranVersesByNumber = matchedAllQuranVersesByNumber.slice(0, 10);
      }
    }

    return {
      smartMatch,
      matchedSurahs,
      pageMatch,
      matchedVersesInSurah,
      matchedAllQuranVersesByNumber,
    };
  })();
  const [bookmarkedVerses, setBookmarkedVerses] = useState<number[]>([]);
  const [activeNoteModalAyah, setActiveNoteModalAyah] = useState<Ayah | null>(null);
  const [pendingNoteConfirmAyah, setPendingNoteConfirmAyah] = useState<Ayah | null>(null);
  const [confirmedNoteAyahNumber, setConfirmedNoteAyahNumber] = useState<number | null>(null);
  const [noteTextInput, setNoteTextInput] = useState('');
  const [noteTagInput, setNoteTagInput] = useState<VerseNote['tag']>('Tefsir Notu');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [showTooltipTranslation, setShowTooltipTranslation] = useState<boolean>(false);
  const [isPageMenuOpen, setIsPageMenuOpen] = useState<boolean>(false);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState<boolean>(false);
  const [isSurahModalOpen, setIsSurahModalOpen] = useState<boolean>(false);
  const [surahSearchQuery, setSurahSearchQuery] = useState<string>('');
  const [isFontPopoverOpen, setIsFontPopoverOpen] = useState<boolean>(false);
  const [pageNotice, setPageNotice] = useState<number | null>(null);

  // Touch and Mouse Drag Gestures for Page Turning & Page Peel Animation
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [mouseDownX, setMouseDownX] = useState<number | null>(null);
  const [pageTurnDirection, setPageTurnDirection] = useState<'next' | 'prev' | null>(null);

  const triggerPagePeel = (dir: 'next' | 'prev') => {
    setPageTurnDirection(dir);
    setTimeout(() => {
      setPageTurnDirection(null);
    }, 450);
  };

  // Dynamic pages inside the selected Surah
  const pagesInSurah = Array.from(new Set(selectedSurah.verses.map((v) => v.page))).sort((a: number, b: number) => a - b);
  const [selectedPage, setSelectedPage] = useState<number>(selectedSurah.startPage || 1);

  const hasPrevPage = pagesInSurah.indexOf(selectedPage) > 0 || selectedSurah.id > 1;
  const hasNextPage = pagesInSurah.indexOf(selectedPage) < pagesInSurah.length - 1 || selectedSurah.id < 114;

  const handlePrevPage = () => {
    triggerPagePeel('prev');
    const curIdx = pagesInSurah.indexOf(selectedPage);
    if (curIdx > 0) {
      setSelectedPage(pagesInSurah[curIdx - 1]);
      setSelectedMushafAyah(null);
    } else if (selectedSurah.id > 1) {
      loadSurah(selectedSurah.id - 1);
      showToast('👈 Önceki Sûreye Geçildi');
    }
  };

  const handleNextPage = () => {
    triggerPagePeel('next');
    const curIdx = pagesInSurah.indexOf(selectedPage);
    if (curIdx < pagesInSurah.length - 1) {
      setSelectedPage(pagesInSurah[curIdx + 1]);
      setSelectedMushafAyah(null);
    } else if (selectedSurah.id < 114) {
      loadSurah(selectedSurah.id + 1);
      showToast('👉 Sonraki Sûreye Geçildi');
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null || touchStartY === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;

    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
      if (deltaX < 0) {
        handleNextPage();
        showToast('➡️ Sayfa İleri');
      } else {
        handlePrevPage();
        showToast('⬅️ Sayfa Geri');
      }
    }
    setTouchStartX(null);
    setTouchStartY(null);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, select, input, textarea, a')) return;
    setMouseDownX(e.clientX);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (mouseDownX === null) return;
    const deltaX = e.clientX - mouseDownX;
    if (Math.abs(deltaX) > 50) {
      if (deltaX < 0) {
        handleNextPage();
        showToast('➡️ Sayfa İleri');
      } else {
        handlePrevPage();
        showToast('⬅️ Sayfa Geri');
      }
    }
    setMouseDownX(null);
  };

  // When selectedSurah changes, reset active page and active mushaf ayah
  useEffect(() => {
    setSelectedPage(selectedSurah.startPage);
    setSelectedMushafAyah(null);
  }, [selectedSurah]);

  // Sync activeAyah back to selectedMushafAyah for coherence
  useEffect(() => {
    if (activeAyah && viewMode === 'mushaf') {
      setSelectedMushafAyah(activeAyah);
      setSelectedPage(activeAyah.page);
    }
  }, [activeAyah]);

  // Trigger prominent page badge notice whenever selectedPage changes
  useEffect(() => {
    setPageNotice(selectedPage);
    const timer = setTimeout(() => {
      setPageNotice(null);
    }, 900);
    return () => clearTimeout(timer);
  }, [selectedPage, selectedSurah.id]);

  // Handle Keyboard shortcuts (Arrow keys for page turn, ESC to close modals)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger page navigation if user is typing in text inputs or textareas
      const activeEl = document.activeElement;
      const isInputFocused =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        (activeEl as HTMLElement)?.isContentEditable;

      if (e.key === 'Escape' || e.key === 'Esc') {
        if (isSurahModalOpen) {
          setIsSurahModalOpen(false);
          setSurahSearchQuery('');
        } else if (isFilterMenuOpen) {
          setIsFilterMenuOpen(false);
        } else if (isFontPopoverOpen) {
          setIsFontPopoverOpen(false);
        } else if (activeNoteModalAyah) {
          setActiveNoteModalAyah(null);
          setNoteTextInput('');
        } else if (isPageMenuOpen) {
          setIsPageMenuOpen(false);
        } else if (selectedMushafAyah) {
          setSelectedMushafAyah(null);
        } else if (isFullScreen) {
          setIsFullScreen(false);
        }
        return;
      }

      if (!isInputFocused && !isSurahModalOpen && !activeNoteModalAyah) {
        if (e.key === 'ArrowRight' || e.key === 'PageDown') {
          e.preventDefault();
          handleNextPage();
        } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
          e.preventDefault();
          handlePrevPage();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isSurahModalOpen,
    isFilterMenuOpen,
    isFontPopoverOpen,
    activeNoteModalAyah,
    isPageMenuOpen,
    selectedMushafAyah,
    isFullScreen,
    setIsFullScreen,
    selectedPage,
    pagesInSurah,
    selectedSurah,
  ]);

  // Load bookmarked verses for current surah from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`kuran_bookmarks_${selectedSurah.id}`);
      if (saved) {
        setBookmarkedVerses(JSON.parse(saved));
      } else {
        setBookmarkedVerses([]);
      }
    } catch {
      setBookmarkedVerses([]);
    }
  }, [selectedSurah.id]);

  // Persist last reading position to localStorage
  useEffect(() => {
    const lastPos = {
      surahId: selectedSurah.id,
      surahName: selectedSurah.nameTurkish,
      verseNumber: selectedMushafAyah ? selectedMushafAyah.number : (activeAyah ? activeAyah.number : 1),
      pageNumber: selectedPage,
      updatedAt: new Date().toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
    };
    localStorage.setItem('kuran_last_read', JSON.stringify(lastPos));
  }, [selectedSurah, selectedPage, selectedMushafAyah, activeAyah]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const toggleBookmark = (verseNum: number) => {
    let updated: number[];
    if (bookmarkedVerses.includes(verseNum)) {
      updated = bookmarkedVerses.filter((v) => v !== verseNum);
      showToast('Ayet yer işaretlerinden kaldırıldı.');
    } else {
      updated = [...bookmarkedVerses, verseNum];
      showToast(`${verseNum}. Ayet yer işaretlerine eklendi.`);
    }
    setBookmarkedVerses(updated);
    try {
      localStorage.setItem(`kuran_bookmarks_${selectedSurah.id}`, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveNoteSubmit = (targetAyah: Ayah, customText?: string) => {
    const textToSave = customText || noteTextInput;
    if (!textToSave.trim()) return;

    onSaveVerseNote({
      surahId: selectedSurah.id,
      surahName: selectedSurah.nameTurkish,
      verseNumber: targetAyah.number,
      tag: noteTagInput,
      noteText: textToSave.trim(),
    });

    showToast(`${targetAyah.number}. Ayet için ders notu başarıyla kaydedildi.`);
    setActiveNoteModalAyah(null);
    setNoteTextInput('');
  };

  const filteredVerses = selectedSurah.verses.filter((verse) => {
    if (filterJuz !== 'all' && verse.juz !== filterJuz) return false;
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      (verse.arabic && verse.arabic.includes(query)) ||
      (verse.transliteration && verse.transliteration.toLowerCase().includes(query)) ||
      (verse.translation && verse.translation.toLowerCase().includes(query)) ||
      (verse.turkishTranslation && verse.turkishTranslation.toLowerCase().includes(query)) ||
      (verse.number && verse.number.toString() === query)
    );
  });

  // Get verses for the active page in Mushaf mode
  const pageVerses = selectedSurah.verses.filter((v) => v.page === selectedPage);

  const fontSizeClass = {
    md: 'text-lg leading-[2.1]',
    lg: 'text-xl sm:text-2xl leading-[2.3]',
    xl: 'text-2xl sm:text-3xl leading-[2.5]',
    '2xl': 'text-3xl sm:text-4xl leading-[2.7]',
  }[fontSize];

  const mealFontSizeClass = {
    md: 'text-xs sm:text-sm leading-relaxed',
    lg: 'text-sm sm:text-base leading-relaxed',
    xl: 'text-base sm:text-lg leading-loose',
    '2xl': 'text-lg sm:text-xl leading-loose',
  }[fontSize];

  // Theme class mappings (Apple Light Themes)
  const safeTheme = (pageTheme === 'mint' || pageTheme === 'white') ? pageTheme : 'ivory';
  const themeStyles = {
    ivory: {
      appBg: 'bg-[#FAF8F5]',
      cardBg: 'bg-white',
      boardBg: 'bg-[#FAF8F5]',
      boardBorder: 'border-[#D4AF37]/25',
      textMain: 'text-stone-900',
      textMuted: 'text-stone-500',
      arabicText: 'text-stone-900',
      verseSeal: 'bg-amber-50/70 text-amber-900 border-amber-600/40',
      activeHighlight: 'bg-amber-100/95 text-stone-950 font-medium ring-2 ring-[#D4AF37]/50',
      hoverHighlight: 'hover:bg-amber-500/10 text-stone-900',
      accentColor: 'text-[#9E7A28]',
      cardBorder: 'border-stone-200/80',
      subCardBg: 'bg-stone-50',
    },
    mint: {
      appBg: 'bg-[#F2F7F4]',
      cardBg: 'bg-[#FAFCFA]',
      boardBg: 'bg-[#F2F7F4]',
      boardBorder: 'border-emerald-600/25',
      textMain: 'text-[#112E1A]',
      textMuted: 'text-emerald-800/75',
      arabicText: 'text-[#112E1A]',
      verseSeal: 'bg-emerald-50 text-emerald-900 border-emerald-600/35',
      activeHighlight: 'bg-emerald-100/95 text-[#112E1A] ring-2 ring-emerald-500/50',
      hoverHighlight: 'hover:bg-emerald-500/10 text-[#112E1A]',
      accentColor: 'text-emerald-700',
      cardBorder: 'border-emerald-200/60',
      subCardBg: 'bg-emerald-50/50',
    },
    white: {
      appBg: 'bg-[#FFFFFF]',
      cardBg: 'bg-white',
      boardBg: 'bg-[#FFFFFF]',
      boardBorder: 'border-stone-200',
      textMain: 'text-stone-900',
      textMuted: 'text-stone-500',
      arabicText: 'text-black',
      verseSeal: 'bg-stone-50 text-stone-900 border-stone-300',
      activeHighlight: 'bg-amber-50 text-stone-950 ring-2 ring-amber-500/30',
      hoverHighlight: 'hover:bg-stone-100 text-black',
      accentColor: 'text-amber-800',
      cardBorder: 'border-stone-200',
      subCardBg: 'bg-stone-50',
    },
  }[safeTheme];

  const renderPageNavigationControl = () => {
    const firstVerseInPage = pageVerses[0];
    const lastVerseInPage = pageVerses[pageVerses.length - 1];

    return (
      <div id="tour-surah-selector" className={`relative z-20 flex items-center justify-between border rounded-2xl p-2 px-3 sm:px-4 shadow-xs transition-all duration-300 ${themeStyles.cardBg} ${themeStyles.cardBorder} ${
        isFullScreen && !areOverlaysVisible
          ? 'opacity-0 -translate-y-6 pointer-events-none h-0 overflow-hidden mb-0'
          : 'opacity-100 translate-y-0 mb-3'
      }`}>
        {/* Önceki Sayfa */}
        <button
          disabled={!hasPrevPage}
          onClick={handlePrevPage}
          className="px-3 py-1.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100 font-bold text-xs flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
          title="Önceki Sayfa"
        >
          <ChevronLeft className="w-4 h-4 text-amber-600" />
          <span className="hidden sm:inline">Önceki</span>
        </button>

        {/* Center Page Selector Pill & Filter Icon Button */}
        <div className="relative flex items-center gap-1.5 sm:gap-2">
          {/* Page Dropdown Button */}
          <button
            onClick={() => {
              setIsPageMenuOpen(!isPageMenuOpen);
              if (isFilterMenuOpen) setIsFilterMenuOpen(false);
            }}
            className="px-3 sm:px-3.5 py-1.5 rounded-xl border border-amber-300/80 bg-amber-50/80 hover:bg-amber-100 text-amber-950 text-xs font-bold flex items-center gap-1.5 sm:gap-2 shadow-xs transition-all active:scale-95"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span>Sayfa {selectedPage}{pagesInSurah.length > 1 ? ` / ${pagesInSurah[pagesInSurah.length - 1]}` : ''}</span>
            {firstVerseInPage && lastVerseInPage && (
              <span className="hidden md:inline text-[10px] font-normal opacity-75 border-l border-amber-400/30 pl-2">
                ({firstVerseInPage.number} - {lastVerseInPage.number}. Ayetler)
              </span>
            )}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isPageMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Popover Dropdown for Fast Page Selection */}
          {isPageMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsPageMenuOpen(false)}
              />
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 p-3 rounded-2xl border border-stone-200 bg-white/95 text-stone-900 shadow-2xl w-64 sm:w-80 backdrop-blur-xl animate-fade-in">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-200 text-xs font-bold">
                  <span>Sayfaya Git</span>
                  <span className="text-[10px] opacity-60">{selectedSurah.nameTurkish} ({pagesInSurah.length} Sayfa)</span>
                </div>

                <div className="grid grid-cols-5 sm:grid-cols-6 gap-1.5 max-h-48 overflow-y-auto p-1 scrollbar-thin">
                  {pagesInSurah.map((p) => (
                    <button
                      key={p}
                      onClick={() => {
                        setSelectedPage(p);
                        setSelectedMushafAyah(null);
                        setIsPageMenuOpen(false);
                      }}
                      className={`py-1.5 rounded-xl text-xs font-bold transition-all ${
                        selectedPage === p
                          ? 'bg-amber-500 text-white font-black shadow-md scale-105'
                          : 'bg-stone-100 text-stone-700 hover:bg-amber-100 hover:text-amber-900'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Arama İkon Butonu */}
          <button
            onClick={() => {
              setIsSearchModalOpen(true);
              if (isFilterMenuOpen) setIsFilterMenuOpen(false);
              if (isPageMenuOpen) setIsPageMenuOpen(false);
            }}
            className="p-1.5 px-2.5 rounded-xl border border-stone-200 bg-stone-100/90 hover:bg-amber-50 text-stone-800 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
            title="Kur'an-ı Kerim'de Ara & Sesle Bul"
          >
            <Search className="w-4 h-4 text-amber-700" />
            <span className="hidden sm:inline text-xs font-semibold">Ara</span>
          </button>

          {/* Filtre / Okuma Ayarları İkon Butonu */}
          <div className="relative">
            <button
              onClick={() => {
                setIsFilterMenuOpen(!isFilterMenuOpen);
                if (isPageMenuOpen) setIsPageMenuOpen(false);
              }}
              className={`p-1.5 px-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 ${
                isFilterMenuOpen
                  ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                  : 'bg-stone-100/90 hover:bg-amber-50 text-stone-800 border-stone-200'
              }`}
              title="Filtreler & Okuma Ayarları (Sûre, Görünüm, Yazı Boyutu)"
            >
              <SlidersHorizontal className={`w-4 h-4 ${isFilterMenuOpen ? 'text-white' : 'text-amber-700'}`} />
              <span className="hidden sm:inline text-xs font-semibold">Filtrele</span>
            </button>

            {/* Filter / Settings Popover */}
            {isFilterMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsFilterMenuOpen(false)} />
                <div className="absolute top-full right-0 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 mt-2 z-50 p-3.5 sm:p-4 rounded-3xl border border-stone-200 bg-white/95 text-stone-900 shadow-2xl w-72 sm:w-80 backdrop-blur-2xl animate-fade-in space-y-3.5">
                  <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                    <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600" />
                      Okuma Filtreleri & Ayarlar
                    </span>
                    <button
                      onClick={() => setIsFilterMenuOpen(false)}
                      className="p-1 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Sûre Seçimi */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Sûre Seçimi</label>
                    <button
                      onClick={() => {
                        setIsFilterMenuOpen(false);
                        setIsSurahModalOpen(true);
                      }}
                      className="w-full p-2 px-3 rounded-xl bg-amber-50/80 hover:bg-amber-100/90 border border-amber-200/80 text-stone-900 font-bold text-xs flex items-center justify-between transition-all"
                    >
                      <span className="truncate">{selectedSurah.id}. {selectedSurah.nameTurkish.replace(' Sûresi', '')} Sûresi</span>
                      <span className="text-[10px] text-amber-800 font-semibold shrink-0 ml-1">Değiştir ▾</span>
                    </button>
                  </div>

                  {/* Görünüm Modu */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Görünüm Modu</label>
                    <div className="grid grid-cols-3 gap-1 bg-stone-100 p-1 rounded-xl text-xs font-bold">
                      <button
                        onClick={() => setViewMode('mushaf')}
                        className={`py-1.5 px-1 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
                          viewMode === 'mushaf' ? 'bg-white text-amber-950 shadow-xs font-extrabold' : 'text-stone-500 hover:text-stone-800'
                        }`}
                      >
                        <BookOpen className="w-3 h-3 text-amber-600" />
                        <span>Mushaf</span>
                      </button>
                      <button
                        onClick={() => setViewMode('meal')}
                        className={`py-1.5 px-1 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
                          viewMode === 'meal' ? 'bg-white text-amber-950 shadow-xs font-extrabold' : 'text-stone-500 hover:text-stone-800'
                        }`}
                      >
                        <FileText className="w-3 h-3 text-amber-600" />
                        <span>Meal</span>
                      </button>
                      <button
                        onClick={() => setViewMode('detailed')}
                        className={`py-1.5 px-1 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
                          viewMode === 'detailed' ? 'bg-white text-amber-950 shadow-xs font-extrabold' : 'text-stone-500 hover:text-stone-800'
                        }`}
                      >
                        <List className="w-3 h-3 text-amber-600" />
                        <span>Detaylı</span>
                      </button>
                    </div>
                  </div>

                  {/* Yazı Boyutu */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Yazı Boyutu</label>
                    <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
                      {(['md', 'lg', 'xl', '2xl'] as const).map((sz) => (
                        <button
                          key={sz}
                          onClick={() => setFontSize(sz)}
                          className={`flex-1 py-1 text-xs rounded-lg font-black uppercase transition-all ${
                            fontSize === sz ? 'bg-amber-500 text-white shadow-xs' : 'text-stone-500 hover:text-stone-800'
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Yer İşaretli / Kaydedilen Ayetlere Hızlı Geçiş */}
                  <div className="space-y-1.5 pt-2.5 border-t border-stone-100">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1">
                        <Bookmark className="w-3 h-3 text-amber-600 fill-amber-500" />
                        Yer İşaretli / Kaydedilen Ayetler ({bookmarkedVerses.length})
                      </label>
                    </div>
                    {bookmarkedVerses.length === 0 ? (
                      <div className="text-[11px] text-stone-500 italic bg-stone-50 p-2.5 rounded-xl text-center border border-dashed border-stone-200">
                        Bu sûrede henüz yer işareti eklenmiş ayet yok. Ayet kartındaki 🔖 ikonuna basarak ekleyebilirsiniz.
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1 scrollbar-thin">
                        {[...bookmarkedVerses].sort((a, b) => a - b).map((vNum) => {
                          const verseObj = selectedSurah.verses.find((v) => v.number === vNum);
                          return (
                            <button
                              key={vNum}
                              onClick={() => {
                                if (verseObj) {
                                  setSelectedPage(verseObj.page);
                                  setSelectedMushafAyah(verseObj);
                                  setActiveAyah(verseObj);
                                  setIsFilterMenuOpen(false);
                                  showToast(`📌 ${vNum}. Ayete gidildi (Sayfa ${verseObj.page})`);
                                }
                              }}
                              className="px-2.5 py-1 rounded-xl bg-amber-50 hover:bg-amber-500 text-amber-900 hover:text-white border border-amber-200 text-xs font-bold transition-all active:scale-95 flex items-center gap-1 shadow-2xs"
                              title={`Ayet ${vNum}'e git (Sayfa ${verseObj?.page || ''})`}
                            >
                              <Bookmark className="w-3 h-3 text-amber-600 fill-amber-500 shrink-0" />
                              <span>Ayet {vNum}</span>
                              {verseObj && <span className="opacity-75 text-[10px] font-normal"> (S.{verseObj.page})</span>}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Sonraki Sayfa */}
        <button
          disabled={!hasNextPage}
          onClick={handleNextPage}
          className="px-3 py-1.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100 font-bold text-xs flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
          title="Sonraki Sayfa"
        >
          <span className="hidden sm:inline">Sonraki</span>
          <ChevronRight className="w-4 h-4 text-amber-600" />
        </button>
      </div>
    );
  };

  return (
    <div className={`mx-auto animate-fade-in w-full transition-all duration-300 ${themeStyles.textMain} ${
      isFullScreen
        ? 'p-3 sm:p-5 max-w-none space-y-4'
        : 'p-3 sm:p-6 max-w-5xl space-y-4 pb-28'
    }`}>
      {/* Toast Banner */}
      {toastMsg && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-stone-900 text-amber-200 px-5 py-2.5 rounded-full text-xs font-semibold shadow-xl border border-amber-500/30 flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4 text-amber-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* TAM EKRAN / MODAL ARAMA & SESLE AYET BULMA EKRANI */}
      {isSearchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/45 backdrop-blur-md animate-fade-in">
          <div className="bg-white/95 text-stone-900 border border-white/60 shadow-2xl rounded-[32px] max-w-2xl w-full p-5 sm:p-6 space-y-4 relative overflow-hidden backdrop-blur-2xl max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-stone-200/80 pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-900 border border-amber-200 flex items-center justify-center font-bold">
                  <Search className="w-5 h-5 text-amber-800" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-stone-900">Kur'an-ı Kerim Arama & Sesle Bul</h3>
                  <p className="text-xs text-stone-500">114 Sûre, Ayetler, Sayfalar veya Sesli Okuyarak Arayın</p>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsSearchModalOpen(false);
                  if (isLiveListening && speechRecognitionRef.current) {
                    try { speechRecognitionRef.current.stop(); } catch (e) {}
                    setIsLiveListening(false);
                  }
                }}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 flex items-center justify-center transition-colors"
                title="Kapat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Main Search Input & Live Mic Bar */}
            <div className="space-y-2 shrink-0">
              <div className="relative flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Sûre adı, ayet no (ör. Bakara 255, Yasin), sayfa no veya meal..."
                    className="w-full pl-10 pr-9 py-2.5 text-xs font-semibold rounded-2xl bg-stone-100/90 border border-stone-200 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1 rounded-full"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Instant Live Speech Recognition Mic Button (%100 Ücretsiz & Kredisiz) */}
                <button
                  type="button"
                  onClick={toggleLiveVoiceInput}
                  className={`px-3 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all shrink-0 ${
                    isLiveListening
                      ? 'bg-red-600 text-white animate-pulse'
                      : 'bg-amber-700 hover:bg-amber-800 text-white'
                  }`}
                  title="Mikrofonu Açarak Okuyun (%100 Ücretsiz / Cihaz İçi Ses Tanıma - 0 Kredi)"
                >
                  <Mic className={`w-4 h-4 ${isLiveListening ? 'text-white' : 'text-amber-200'}`} />
                  <span className="hidden sm:inline">
                    {isLiveListening ? 'Dinleniyor...' : 'Canlı Sesle Ara'}
                  </span>
                </button>

                {/* Tarteel AI Whisper Model Audio Record Button */}
                <button
                  type="button"
                  onClick={startAiVoiceSearch}
                  className="px-3 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm active:scale-95 transition-all shrink-0"
                  title="Tarteel AI Whisper Kur'an Kıraat Modeli (tarteel-ai/whisper-base-ar-quran) ile Ses Analizi"
                >
                  <Sparkles className="w-4 h-4 text-emerald-200 animate-pulse" />
                  <span className="hidden sm:inline">Tarteel AI Analiz</span>
                  <span className="text-[9px] bg-emerald-900 text-emerald-100 font-extrabold px-1.5 py-0.5 rounded-full">
                    Whisper AR
                  </span>
                </button>
              </div>

              {/* Tarteel AI Notice */}
              <div className="p-2 bg-emerald-50/90 border border-emerald-200/90 rounded-xl text-[11px] text-emerald-950 flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span><b>Tarteel AI Whisper (tarteel-ai/whisper-base-ar-quran):</b> %100 Ücretsiz Kur'an kıraat modeli (0 Kredi) ile sesli okuyuş analizi.</span>
                </span>
              </div>

              {/* Live Listening Status Banner */}
              {isLiveListening && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-900 rounded-xl text-xs flex items-center justify-between animate-fade-in">
                  <span className="flex items-center gap-2 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-red-600 animate-ping shrink-0" />
                    <span>Konuşmanız ve okuduğunuz Kur'an dinleniyor, otomatik sûre/ayet aranıyor...</span>
                  </span>
                  <button
                    type="button"
                    onClick={toggleLiveVoiceInput}
                    className="text-[11px] font-bold text-red-800 underline"
                  >
                    Durdur
                  </button>
                </div>
              )}

              {/* Quick Preset Shortcut Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider shrink-0 mr-1">Hızlı:</span>
                {[
                  { label: "Ayetü'l-Kürsî", query: "Ayetel Kürsi" },
                  { label: "Yâsîn", query: "Yasin" },
                  { label: "Âmenerra'sûlü", query: "Amenerrasulu" },
                  { label: "Fâtiha", query: "Fatiha" },
                  { label: "Mülk (Tebâreke)", query: "Mülk" },
                  { label: "İhlâs & Felak & Nâs", query: "İhlas" },
                  { label: "Haşr (Lâ yestevî)", query: "Haşr 21" },
                  { label: "Nazar Ayeti", query: "Nazar Ayeti" },
                ].map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => setSearchQuery(chip.query)}
                    className="px-2.5 py-1 rounded-xl bg-amber-50 hover:bg-amber-100/90 text-amber-900 font-bold border border-amber-200/80 whitespace-nowrap shrink-0 transition-colors"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Results Content Area */}
            <div className="overflow-y-auto flex-1 space-y-3 pr-1 scrollbar-thin">
              {/* Smart Match Card (Akıllı Otomatik Tespit) */}
              {searchResults?.smartMatch && (
                <div className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-400/80 rounded-2xl space-y-2 animate-fade-in shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-amber-950 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-600 animate-bounce" />
                      AKILLI AYET / SÛRE TESPİTİ
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-700 text-white shadow-2xs">
                      Doğrudan Eşleşme
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-black text-amber-950">{searchResults.smartMatch.title}</div>
                    <div className="text-xs text-amber-900/90 font-medium mt-0.5">{searchResults.smartMatch.description}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (searchResults?.smartMatch) {
                        navigateToSmartMatch(searchResults.smartMatch);
                      }
                    }}
                    className="w-full py-2 bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs rounded-xl transition-all shadow-sm active:scale-98 flex items-center justify-center gap-1.5"
                  >
                    <span>Doğrudan Bu Ayete / Sûreye Git</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Kur'an Genelinde Ayet Numarası Eşleşmeleri (Ayet Numarasına Göre Arama) */}
              {searchResults?.matchedAllQuranVersesByNumber && searchResults.matchedAllQuranVersesByNumber.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Search className="w-3 h-3 text-amber-700" />
                      Tüm Sûrelerdeki {searchQuery.replace(/\D/g, '')}. Ayetler ({searchResults.matchedAllQuranVersesByNumber.length})
                    </span>
                    <span className="text-[9px] bg-amber-100 px-1.5 py-0.5 rounded text-amber-900 font-bold">Ayet No İle Arama</span>
                  </div>
                  <div className="space-y-1.5">
                    {searchResults.matchedAllQuranVersesByNumber.map((item) => (
                      <button
                        key={`${item.surahId}-${item.verseNumber}`}
                        type="button"
                        onClick={() => {
                          loadSurah(item.surahId);
                          setSelectedPage(item.pageNumber);
                          if (selectedSurah.id === item.surahId) {
                            const vObj = selectedSurah.verses.find((v) => v.number === item.verseNumber);
                            if (vObj) {
                              setSelectedMushafAyah(vObj);
                              setActiveAyah(vObj);
                            }
                          }
                          setIsSearchModalOpen(false);
                          showToast(`📖 ${item.surahName} ${item.verseNumber}. Ayet Yüklendi (Sayfa ${item.pageNumber})`);
                        }}
                        className="w-full p-3 rounded-2xl bg-amber-50/60 hover:bg-amber-100/80 border border-amber-200/80 text-left transition-all flex items-center justify-between group active:scale-98"
                      >
                        <div className="space-y-0.5 flex-1 pr-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-lg bg-amber-700 text-white font-bold text-[11px]">
                              {item.surahName} {item.verseNumber}. Ayet
                            </span>
                            <span className="text-[10px] font-semibold text-stone-500">
                              Sayfa {item.pageNumber}
                            </span>
                          </div>
                          {item.translation && (
                            <p className="text-xs text-stone-700 font-normal line-clamp-1 mt-1">
                              "{item.translation}"
                            </p>
                          )}
                        </div>
                        <ArrowRight className="w-4 h-4 text-amber-700 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Matched Surahs */}
              {searchResults && searchResults.matchedSurahs.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1">
                    <BookOpen className="w-3 h-3 text-amber-700" />
                    Eşleşen Sûreler ({searchResults.matchedSurahs.length})
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {searchResults.matchedSurahs.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          loadSurah(s.id);
                          setIsSearchModalOpen(false);
                          showToast(`📖 ${s.nameTurkish} Yüklendi`);
                        }}
                        className="p-3 rounded-2xl bg-stone-50 hover:bg-amber-50 border border-stone-200/80 text-left flex items-center justify-between transition-all active:scale-98"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-7 h-7 rounded-xl bg-amber-200/80 text-amber-900 font-bold text-xs flex items-center justify-center">
                            {s.id}
                          </span>
                          <div>
                            <div className="text-xs font-bold text-stone-900">
                              {s.nameTurkish.replace(' Sûresi', '')} Sûresi
                            </div>
                            <div className="text-[10px] text-stone-500">{s.versesCount} Ayet</div>
                          </div>
                        </div>
                        <span className="font-serif text-sm text-amber-900 font-bold">{s.nameArabic}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Matched Page */}
              {searchResults && searchResults.pageMatch && (
                <div className="p-3 bg-stone-50 border border-stone-200 rounded-2xl flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-stone-900">Sayfa {searchResults.pageMatch}</div>
                    <div className="text-[10px] text-stone-500">Kur'an-ı Kerim Sayfa Numarası</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPage(searchResults.pageMatch!);
                      setIsSearchModalOpen(false);
                      showToast(`📄 Sayfa ${searchResults.pageMatch} Açıldı`);
                    }}
                    className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs rounded-xl transition-all shadow-2xs"
                  >
                    Sayfaya Git
                  </button>
                </div>
              )}

              {/* Matched Verses in Current Surah */}
              {searchResults && searchResults.matchedVersesInSurah.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1">
                    <List className="w-3 h-3 text-amber-700" />
                    {selectedSurah.nameTurkish} İçindeki Eşleşen Ayetler
                  </div>
                  <div className="space-y-2">
                    {searchResults.matchedVersesInSurah.map((v) => (
                      <button
                        key={v.number}
                        type="button"
                        onClick={() => {
                          setSelectedPage(v.page);
                          setSelectedMushafAyah(v);
                          setActiveAyah(v);
                          setIsSearchModalOpen(false);
                          showToast(`📌 ${v.number}. Ayete gidildi (Sayfa ${v.page})`);
                        }}
                        className="w-full p-3 rounded-2xl bg-stone-50 hover:bg-amber-50 border border-stone-200/80 text-left transition-all group"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-amber-900">
                            {selectedSurah.nameTurkish} {v.number}. Ayet (Sayfa {v.page})
                          </span>
                          <span className="font-serif text-sm text-stone-800">{v.arabic.slice(0, 35)}...</span>
                        </div>
                        <p className="text-xs text-stone-600 line-clamp-2 group-hover:text-stone-900">
                          {v.turkishTranslation}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Default Empty State or AI Deep Voice Search Option */}
              {(!searchResults || (searchResults.matchedSurahs.length === 0 && !searchResults.pageMatch && searchResults.matchedVersesInSurah.length === 0)) && (
                <div className="text-center py-8 space-y-4">
                  <p className="text-xs text-stone-500">
                    {searchQuery.trim()
                      ? `"${searchQuery}" için doğrudan sonuç bulunamadı.`
                      : 'Yukarıdaki arama çubuğuna yazarak veya sesli okuyarak hemen arayabilirsiniz.'}
                  </p>

                  <div className="pt-2 border-t border-stone-200/60 max-w-sm mx-auto space-y-2">
                    <p className="text-[11px] text-stone-400">
                      Özel bir tilavet ses kaydı analizi yapmak isterseniz Tarteel AI Whisper kredisiz hafız modunu başlatabilirsiniz:
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setIsSearchModalOpen(false);
                        startAiVoiceSearch();
                      }}
                      className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-700 to-emerald-900 text-white rounded-2xl font-bold text-xs shadow-md flex items-center justify-center gap-2 hover:opacity-95 transition-opacity"
                    >
                      <Sparkles className="w-4 h-4 text-emerald-200" />
                      <span>Tarteel AI Whisper Sesli Ayet Analizi Başlat</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI SESLİ AYET ARAMA MODALI */}
      {isVoiceSearching && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white/98 text-stone-900 border border-amber-200/90 shadow-2xl rounded-3xl max-w-lg w-full p-6 space-y-5 text-center backdrop-blur-2xl relative overflow-hidden">
            {/* Decorative Ambient Gold Glow */}
            <div className="absolute -top-12 -left-12 w-32 h-32 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />

            <div className="flex justify-between items-center pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-600" />
                <span className="font-bold text-sm text-stone-900">AI Sesli Ayet & Sûre Bulucu</span>
              </div>
              <button
                type="button"
                onClick={cancelAiVoiceSearch}
                className="p-1 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {voiceSearchStatus === 'listening' ? (
              <div className="space-y-4 py-2">
                {/* Language Selection Switcher Pills */}
                <div className="flex items-center justify-center gap-1.5 p-1 bg-stone-100/90 rounded-2xl w-max mx-auto border border-stone-200">
                  <button
                    type="button"
                    onClick={() => setVoiceSearchLang('ar-SA')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                      voiceSearchLang === 'ar-SA'
                        ? 'bg-[#1C1A17] text-[#D4AF37] shadow-sm'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <span>🇸🇦 Arapça Tilavet (Tarteel AI)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setVoiceSearchLang('tr-TR')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                      voiceSearchLang === 'tr-TR'
                        ? 'bg-[#1C1A17] text-[#D4AF37] shadow-sm'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <span>🇹🇷 Türkçe Arama</span>
                  </button>
                </div>

                {/* Animated Pulsing Mic Circle */}
                <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 bg-amber-500/20 rounded-full animate-ping" />
                  <div className="w-16 h-16 bg-gradient-to-tr from-amber-600 to-amber-800 text-white rounded-full flex items-center justify-center shadow-lg relative z-10">
                    <Mic className="w-8 h-8 text-amber-200 animate-pulse" />
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="font-bold text-base text-stone-900">Sesiniz Dinleniyor...</h3>
                  <p className="text-xs text-stone-500 max-w-xs mx-auto">
                    Lütfen okuduğunuz ayet tilavetini, Türkçe mealini veya aradığınız sûreyi sesli olarak okuyun.
                  </p>
                </div>

                {/* Live Transcript Display Box */}
                <div className="bg-stone-50 rounded-2xl p-3.5 border border-amber-200/60 min-h-[60px] flex items-center justify-center">
                  {voiceTranscript ? (
                    <p className="text-xs font-semibold text-amber-950 italic">"{voiceTranscript}"</p>
                  ) : (
                    <p className="text-xs text-stone-400 italic">Sesiniz bekleniyor ve kaydediliyor...</p>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={cancelAiVoiceSearch}
                    className="flex-1 py-2.5 rounded-xl border border-stone-200 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs transition-all"
                  >
                    Vazgeç
                  </button>

                  <button
                    type="button"
                    onClick={stopAiVoiceSearch}
                    className="flex-1 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4 text-amber-200" />
                    <span>Durdur ve Ayeti Bul</span>
                  </button>
                </div>
              </div>
            ) : voiceSearchStatus === 'analyzing' ? (
              <div className="py-8 space-y-4">
                <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-700 rounded-full animate-spin mx-auto" />
                <div className="space-y-1">
                  <h3 className="font-bold text-base text-stone-900">Tarteel AI Whisper Çözümlüyor...</h3>
                  <p className="text-xs text-stone-500">
                    Okunan tilavet %100 ücretsiz Tarteel AI Whisper modeliyle çözümlenip aranıyor.
                  </p>
                </div>
              </div>
            ) : voiceSearchResult ? (
              /* SUCCESS RESULT DISPLAY */
              <div className="space-y-4 text-left">
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-900 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 font-bold text-sm">
                    ✓
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-emerald-950">Ayet Başarıyla Tespit Edildi!</h4>
                      {voiceSearchResult.engine && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-700 text-white">
                          ⚡ Tarteel AI Whisper (0 Kredi)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-emerald-800 font-bold mt-0.5">
                      {voiceSearchResult.surahName}, {voiceSearchResult.verseNumber}. Ayet (Sayfa {voiceSearchResult.pageNumber})
                    </p>
                  </div>
                </div>

                {/* Tarteel AI Transcript if present */}
                {voiceSearchResult.tarteelTranscript && (
                  <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-xl text-xs space-y-1">
                    <div className="text-[10px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-600" />
                      Tarteel AI Whisper (tarteel-ai/whisper-base-ar-quran) Okuma Metni:
                    </div>
                    <div className="font-serif text-sm text-amber-950 text-right dir-rtl font-semibold">
                      {voiceSearchResult.tarteelTranscript}
                    </div>
                  </div>
                )}

                {/* Ayet Arabic & Turkish Preview */}
                <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-2">
                  <div className="text-right font-serif text-lg text-amber-950 dir-rtl leading-relaxed">
                    {voiceSearchResult.matchedArabicText}
                  </div>
                  <div className="text-xs text-stone-700 pt-2 border-t border-stone-200">
                    <b>Meal:</b> "{voiceSearchResult.matchedTurkishTranslation}"
                  </div>
                  {voiceSearchResult.confidenceExplanation && (
                    <div className="text-[11px] text-amber-800 font-medium italic pt-1">
                      💡 {voiceSearchResult.confidenceExplanation}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsVoiceSearching(false);
                      showToast(`🎯 ${voiceSearchResult.surahName} ${voiceSearchResult.verseNumber}. Ayete Gidildi`);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs shadow-md transition-all text-center"
                  >
                    Ayete Git & İncele
                  </button>
                  <button
                    type="button"
                    onClick={cancelAiVoiceSearch}
                    className="px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs transition-all"
                  >
                    Kapat
                  </button>
                </div>
              </div>
            ) : voiceError ? (
              /* ERROR DISPLAY */
              <div className="space-y-4">
                <div className="p-4 bg-red-50 border border-red-200 text-red-900 rounded-2xl text-xs space-y-1">
                  <b className="font-bold block text-sm">Ayet Tespit Edilemedi</b>
                  <p>{voiceError}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={startAiVoiceSearch}
                    className="flex-1 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs shadow-md transition-all"
                  >
                    Tekrar Okuyun
                  </button>
                  <button
                    type="button"
                    onClick={cancelAiVoiceSearch}
                    className="px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs transition-all"
                  >
                    Vazgeç
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* SÛRE SEÇİM MODALI (114 Sûre Arama ve Hızlı Seçim) */}
      {isSurahModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/40 backdrop-blur-md animate-fade-in">
          <div className="bg-white/95 text-stone-900 border border-white/60 shadow-2xl rounded-[32px] max-w-xl w-full p-5 sm:p-6 space-y-4 relative overflow-hidden backdrop-blur-2xl max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-stone-200/80 pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-900 border border-amber-200 flex items-center justify-center font-bold">
                  <BookOpen className="w-5 h-5 text-amber-800" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-stone-900">Sûre Seçin</h3>
                  <p className="text-xs text-stone-500">114 Kur'an Sûresi Arasından Hızlıca Arayın</p>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsSurahModalOpen(false);
                  setSurahSearchQuery('');
                }}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative shrink-0">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={surahSearchQuery}
                onChange={(e) => setSurahSearchQuery(e.target.value)}
                placeholder="Sûre adı veya numarası ara (örn: Mülk, Yasin, 67)..."
                className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold rounded-2xl bg-stone-100/80 border border-stone-200 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                autoFocus
              />
            </div>

            {/* Surah List Grid */}
            <div className="overflow-y-auto flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 pr-1 scrollbar-thin">
              {ALL_SURAHS.filter(s => 
                (s.nameTurkish && s.nameTurkish.toLowerCase().includes(surahSearchQuery.toLowerCase())) || 
                (s.nameArabic && s.nameArabic.includes(surahSearchQuery)) || 
                (s.id && s.id.toString() === surahSearchQuery.trim())
              ).map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    loadSurah(s.id);
                    setIsSurahModalOpen(false);
                    setSurahSearchQuery('');
                  }}
                  className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all active:scale-98 ${
                    selectedSurah.id === s.id
                      ? 'bg-amber-500 text-white border-amber-600 shadow-md font-bold'
                      : 'bg-stone-50/80 hover:bg-amber-50 border-stone-200/80 text-stone-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black ${
                      selectedSurah.id === s.id ? 'bg-amber-600 text-white' : 'bg-stone-200/80 text-stone-700'
                    }`}>
                      {s.id}
                    </span>
                    <div>
                      <div className="text-xs font-bold leading-tight">
                        {s.nameTurkish.replace(' Sûresi', '')} Sûresi
                      </div>
                      <div className={`text-[10px] ${selectedSurah.id === s.id ? 'text-amber-100' : 'text-stone-500'}`}>
                        {s.versesCount} Ayet • {s.revelationType}
                      </div>
                    </div>
                  </div>

                  <span className={`font-serif text-sm ${selectedSurah.id === s.id ? 'text-white' : 'text-stone-600'}`}>
                    {s.nameArabic}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {isLoadingSurah && (
        <div className="flex flex-col items-center justify-center py-24 bg-[#FCFBF7] rounded-3xl border border-amber-200/40 shadow-sm animate-fade-in space-y-4">
          <div className="relative flex items-center justify-center">
            <div className="w-12 h-12 rounded-full border-4 border-amber-100 border-t-[#D4AF37] animate-spin" />
            <BookOpen className="w-5 h-5 text-amber-600 absolute animate-pulse" />
          </div>
          <div className="text-center">
            <h4 className="text-sm font-bold text-stone-800">Sûre Yükleniyor</h4>
            <p className="text-xs text-stone-400 mt-1">Lütfen bekleyin, Kur'ân-ı Kerim kütüphanesinden ayetler çekiliyor...</p>
          </div>
        </div>
      )}

      {surahError && (
        <div className="p-10 bg-[#FCFBF7] rounded-3xl border border-red-200/60 shadow-sm text-center space-y-4 animate-fade-in">
          <p className="text-sm font-semibold text-red-800">{surahError}</p>
          <button
            onClick={() => loadSurah(selectedSurah.id)}
            className="px-6 py-2.5 bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs rounded-xl transition-all shadow-2xs active:scale-95"
          >
            Tekrar Dene
          </button>
        </div>
      )}

      {!isLoadingSurah && !surahError && (
        <>
          {/* --- VIEW MODE 1: PURE MUSHAF PAGE VIEW (SADECE KURAN SAYFALARI) --- */}
          {viewMode === 'mushaf' && (
            <div className="max-w-4xl mx-auto w-full space-y-4">
              {/* Simplified & Clean Page Navigation Control */}
              {renderPageNavigationControl()}

              {/* Tilavet Secdesi Uyarısı (Sayfada Secde Ayeti Varsa) */}
              {pageVerses.some((v) => checkIsSajdahVerse(selectedSurah.id, v.number)) && (
                <div className="p-3.5 bg-amber-500/15 border-2 border-amber-500/80 rounded-2xl text-amber-950 dark:text-amber-200 flex items-center justify-between gap-2.5 text-xs font-bold shadow-sm animate-fade-in my-1">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-amber-700 text-white flex items-center justify-center font-serif text-base font-black shadow-xs shrink-0">
                      ۩
                    </span>
                    <div>
                      <div className="font-black text-amber-950 dark:text-amber-100 flex items-center gap-1.5 text-xs sm:text-sm">
                        <span>TİLAVET SECDESİ UYARISI</span>
                        <span className="px-2 py-0.5 rounded-md bg-amber-700 text-white text-[10px] uppercase font-bold tracking-wider">
                          Vacip / Sünnet
                        </span>
                      </div>
                      <div className="text-[11px] text-amber-900/90 dark:text-amber-300 font-semibold mt-0.5 leading-snug">
                        Bu sayfada ({pageVerses.filter((v) => checkIsSajdahVerse(selectedSurah.id, v.number)).map(v => `${v.number}. Ayet`).join(', ')}) Tilavet Secdesi ayeti bulunmaktadır. Okunduğunda veya tilaveti dinlendiğinde secde yapılması icap eder.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Light Clean Bismillah Header (Except Surah 9 & Surah 1, only on the starting page of the surah) */}
              {selectedSurah.id !== 9 && selectedSurah.id !== 1 && selectedPage === selectedSurah.startPage && (
                <div className="text-center py-3.5 px-4 bg-amber-50/90 text-amber-950 rounded-2xl shadow-2xs border border-amber-200/80 font-serif text-2xl sm:text-3xl tracking-widest dir-rtl my-1">
                  بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                </div>
              )}

              {/* Immersive Mushaf Page Board */}
              <div
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                className={`rounded-3xl p-6 sm:p-8 border-2 shadow-lg relative min-h-[400px] transition-all duration-300 cursor-grab active:cursor-grabbing select-none ${themeStyles.boardBg} ${themeStyles.boardBorder} ${
                  pageTurnDirection === 'next'
                    ? 'animate-page-peel-next'
                    : pageTurnDirection === 'prev'
                    ? 'animate-page-peel-prev'
                    : ''
                }`}
              >
                {/* Gold Filigree Corner Accents */}
                <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-[#D4AF37]/30 rounded-tl-sm pointer-events-none" />
                <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-[#D4AF37]/30 rounded-tr-sm pointer-events-none" />
                <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-[#D4AF37]/30 rounded-bl-sm pointer-events-none" />
                <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-[#D4AF37]/30 rounded-br-sm pointer-events-none" />

                {/* Manuscript Info Header */}
                <div className={`flex items-center justify-between border-b border-[#D4AF37]/15 pb-3 mb-5 text-[11px] font-bold uppercase tracking-wide transition-colors ${themeStyles.textMuted}`}>
                  <span>{selectedSurah.nameTurkish}</span>
                  <span className={`font-serif font-bold text-xs transition-colors ${themeStyles.accentColor}`}>{selectedSurah.nameArabic}</span>
                  <span>Sayfa {selectedPage} • {selectedSurah.juzNumber}. Cüz</span>
                </div>

                {/* Pure Flowing Arabic Text block */}
                <div className={`text-right dir-rtl leading-loose text-justify tracking-wide select-none transition-colors ${themeStyles.arabicText}`}>
                  {pageVerses.map((verse) => {
                    const isSelected = selectedMushafAyah?.number === verse.number;
                    const isPlayingCurrently = activeAyah?.number === verse.number && isPlaying;
                    const isBookmarked = bookmarkedVerses.includes(verse.number);
                    const isSajdah = checkIsSajdahVerse(selectedSurah.id, verse.number);

                    return (
                      <span
                        key={verse.number}
                        onClick={() => setSelectedMushafAyah(verse)}
                        className={`cursor-pointer inline transition-all duration-200 px-1 py-1 rounded-lg interactive-ayah ${
                          isSelected
                            ? themeStyles.activeHighlight
                            : isPlayingCurrently
                            ? 'bg-amber-500/25 text-stone-950 dark:text-white shadow-sm ring-2 ring-[#D4AF37]'
                            : isSajdah
                            ? 'bg-amber-100/80 dark:bg-amber-900/30 text-stone-950 ring-1 ring-amber-500/50'
                            : themeStyles.hoverHighlight
                        }`}
                      >
                        {/* Highlighted text styling */}
                        <span className={`font-serif ${fontSizeClass}`}>
                          {verse.arabic}
                        </span>

                        {/* Traditional Gold Verse Number Seal with Sajdah indicator */}
                        <span className={`inline-flex items-center justify-center mx-1.5 px-1.5 py-0.5 h-6 rounded-full border text-[10px] font-mono font-bold align-middle select-none transition-colors ${
                          isSajdah ? 'bg-amber-700 text-white border-amber-800 shadow-sm ring-2 ring-amber-400' : themeStyles.verseSeal
                        }`}>
                          {isSajdah && <span className="mr-0.5 font-serif text-xs font-black">۩</span>}
                          {verse.number}
                        </span>
                      </span>
                    );
                  })}
                </div>

                {/* Help tip at the bottom */}
                <p className={`text-center text-[10px] mt-6 pt-3 border-t border-[#D4AF37]/10 font-semibold transition-colors flex items-center justify-center gap-1.5 ${themeStyles.textMuted}`}>
                  <ChevronLeft className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                  <span>Sağa / sola kaydırarak sayfa çevirin • İşlemler ve meal için ayete dokunun</span>
                  <ChevronRight className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                </p>
              </div>
            </div>
          )}

          {/* --- VIEW MODE 2: PURE MEAL PAGE VIEW (SADECE TÜRKÇE MEAL SAYFASI) --- */}
          {viewMode === 'meal' && (
            <div className="max-w-4xl mx-auto w-full space-y-4">
              {/* Simplified & Clean Page Navigation Control */}
              {renderPageNavigationControl()}

              {/* Tilavet Secdesi Uyarısı (Sayfada Secde Ayeti Varsa) */}
              {pageVerses.some((v) => checkIsSajdahVerse(selectedSurah.id, v.number)) && (
                <div className="p-3.5 bg-amber-500/15 border-2 border-amber-500/80 rounded-2xl text-amber-950 dark:text-amber-200 flex items-center justify-between gap-2.5 text-xs font-bold shadow-sm animate-fade-in my-1">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-amber-700 text-white flex items-center justify-center font-serif text-base font-black shadow-xs shrink-0">
                      ۩
                    </span>
                    <div>
                      <div className="font-black text-amber-950 dark:text-amber-100 flex items-center gap-1.5 text-xs sm:text-sm">
                        <span>TİLAVET SECDESİ UYARISI</span>
                        <span className="px-2 py-0.5 rounded-md bg-amber-700 text-white text-[10px] uppercase font-bold tracking-wider">
                          Vacip / Sünnet
                        </span>
                      </div>
                      <div className="text-[11px] text-amber-900/90 dark:text-amber-300 font-semibold mt-0.5 leading-snug">
                        Bu sayfadaki {pageVerses.filter((v) => checkIsSajdahVerse(selectedSurah.id, v.number)).map(v => `${v.number}. Ayet`).join(', ')} Tilavet Secdesi ayetidir. Okunduğunda veya tilaveti dinlendiğinde secde yapılması icap eder.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Light Clean Bismillah Header in Turkish (Except Surah 9 & Surah 1) */}
              {selectedSurah.id !== 9 && selectedSurah.id !== 1 && selectedPage === selectedSurah.startPage && (
                <div className="text-center py-3 px-4 bg-amber-50/90 text-amber-950 rounded-2xl shadow-2xs border border-amber-200/80 font-serif text-base sm:text-lg tracking-wide my-1">
                  Rahmân ve Rahîm olan Allah'ın adıyla
                </div>
              )}

              {/* Immersive Pure Meal Page Board */}
              <div
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                className={`rounded-3xl p-6 sm:p-8 border-2 shadow-lg relative min-h-[400px] transition-all duration-300 cursor-grab active:cursor-grabbing select-none ${themeStyles.boardBg} ${themeStyles.boardBorder} ${
                  pageTurnDirection === 'next'
                    ? 'animate-page-peel-next'
                    : pageTurnDirection === 'prev'
                    ? 'animate-page-peel-prev'
                    : ''
                }`}
              >
                {/* Gold Filigree Corner Accents */}
                <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-[#D4AF37]/30 rounded-tl-sm pointer-events-none" />
                <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-[#D4AF37]/30 rounded-tr-sm pointer-events-none" />
                <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-[#D4AF37]/30 rounded-bl-sm pointer-events-none" />
                <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-[#D4AF37]/30 rounded-br-sm pointer-events-none" />

                {/* Manuscript Info Header */}
                <div className={`flex items-center justify-between border-b border-[#D4AF37]/15 pb-3 mb-5 text-[11px] font-bold uppercase tracking-wide transition-colors ${themeStyles.textMuted}`}>
                  <span>{selectedSurah.nameTurkish}</span>
                  <span className={`font-bold text-xs uppercase tracking-wider transition-colors ${themeStyles.accentColor}`}>Sadece Türkçe Meal</span>
                  <span>Sayfa {selectedPage} • {selectedSurah.juzNumber}. Cüz</span>
                </div>

                {/* Pure Flowing Turkish Meal Text block */}
                <div className={`text-left leading-relaxed text-justify tracking-normal select-none transition-colors space-y-1 ${themeStyles.textMain}`}>
                  {pageVerses.map((verse) => {
                    const isSelected = selectedMushafAyah?.number === verse.number;
                    const isPlayingCurrently = activeAyah?.number === verse.number && isPlaying;

                    return (
                      <span
                        key={verse.number}
                        onClick={() => setSelectedMushafAyah(verse)}
                        className={`cursor-pointer inline transition-all duration-200 px-1 py-1 rounded-lg interactive-ayah ${
                          isSelected
                            ? themeStyles.activeHighlight
                            : isPlayingCurrently
                            ? 'bg-amber-500/25 text-stone-950 dark:text-white shadow-sm ring-2 ring-[#D4AF37]'
                            : themeStyles.hoverHighlight
                        }`}
                      >
                        {/* Verse Translation text */}
                        <span className={`font-sans font-medium ${mealFontSizeClass}`}>
                          {verse.translation}
                        </span>

                        {/* Gold Verse Number Seal */}
                        <span className={`inline-flex items-center justify-center mx-1.5 w-6 h-6 rounded-full border text-[10px] font-mono font-bold align-middle select-none transition-colors ${themeStyles.verseSeal}`}>
                          {verse.number}
                        </span>
                      </span>
                    );
                  })}
                </div>

                {/* Help tip at the bottom */}
                <p className={`text-center text-[10px] mt-6 pt-3 border-t border-[#D4AF37]/10 font-semibold transition-colors flex items-center justify-center gap-1.5 ${themeStyles.textMuted}`}>
                  <ChevronLeft className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                  <span>Sağa / sola kaydırarak sayfa çevirin • İşlemler ve tefsir için meale dokunun</span>
                  <ChevronRight className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                </p>
              </div>
            </div>
          )}

      {/* --- VIEW MODE 2: TRADITIONAL DETAILED VERSE LIST --- */}
      {viewMode === 'detailed' && (
        <div className="space-y-4">
          {/* Detailed Filters panel */}
          {(!isFullScreen || areOverlaysVisible) && (
            <div className="bg-white rounded-3xl p-4 border border-stone-200/80 shadow-sm space-y-3">
              {/* Search Bar & Juz Filter */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Ayet ara, meal veya kelime..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-stone-50 text-slate-800 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <select
                  value={filterJuz}
                  onChange={(e) => setFilterJuz(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  className="bg-stone-50 text-stone-700 text-xs rounded-xl px-2.5 py-2 border border-stone-200"
                >
                  <option value="all">Tüm Cüzler</option>
                  {[...Array(30)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1}. Cüz
                    </option>
                  ))}
                </select>
              </div>

              {/* View toggles for detailed mode */}
              <div className="flex items-center justify-between pt-1.5 border-t border-stone-100 text-xs">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setShowTajweed(!showTajweed)}
                    className={`px-3 py-1.5 rounded-lg border transition-all font-semibold ${
                      showTajweed
                        ? 'bg-amber-50 text-amber-900 border-amber-300'
                        : 'bg-stone-100 text-slate-400 border-transparent'
                    }`}
                  >
                    Tecvit Göster
                  </button>

                  <button
                    onClick={() => setShowTransliteration(!showTransliteration)}
                    className={`px-3 py-1.5 rounded-lg border transition-all font-semibold ${
                      showTransliteration
                        ? 'bg-amber-50 text-amber-900 border-amber-300'
                        : 'bg-stone-100 text-slate-400 border-transparent'
                    }`}
                  >
                    Okunuş
                  </button>

                  <button
                    onClick={() => setShowTranslation(!showTranslation)}
                    className={`px-3 py-1.5 rounded-lg border transition-all font-semibold ${
                      showTranslation
                        ? 'bg-amber-50 text-amber-950 border-amber-300'
                        : 'bg-stone-100 text-slate-400 border-transparent'
                    }`}
                  >
                    Meal
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Light Clean Bismillah Header (Except Surah 9 & Surah 1) */}
          {selectedSurah.id !== 9 && selectedSurah.id !== 1 && (
            <div className="text-center py-3.5 px-4 bg-amber-50/90 text-amber-950 rounded-2xl shadow-2xs border border-amber-200/80 font-serif text-2xl sm:text-3xl tracking-widest dir-rtl my-1">
              بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
            </div>
          )}

          {/* Verse Items */}
          <div className="space-y-4">
            {filteredVerses.map((verse) => {
              const isCurrentActive = activeAyah?.number === verse.number;
              const isBookmarked = bookmarkedVerses.includes(verse.number);
              const isSajdah = checkIsSajdahVerse(selectedSurah.id, verse.number);

              return (
                <div
                  key={verse.number}
                  id={`ayah-${verse.number}`}
                  className={`relative rounded-3xl p-5 transition-all duration-200 border interactive-ayah ${
                    isCurrentActive
                      ? 'bg-amber-50/80 border-amber-400 shadow-md ring-1 ring-amber-400/30'
                      : isSajdah
                      ? 'bg-amber-50/40 border-amber-300 shadow-sm'
                      : 'bg-white border-stone-200 hover:border-stone-300 shadow-sm'
                  }`}
                >
                  {/* Tilavet Secdesi Uyarısı (Ayet Bazlı) */}
                  {isSajdah && (
                    <div className="mb-3.5 p-3 bg-amber-500/15 border-2 border-amber-500/80 rounded-2xl text-amber-950 flex items-center justify-between gap-2.5 text-xs font-bold shadow-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-xl bg-amber-700 text-white flex items-center justify-center font-serif text-base font-black shrink-0 shadow-xs">
                          ۩
                        </span>
                        <div>
                          <div className="font-extrabold text-amber-950 text-xs flex items-center gap-2">
                            <span>TİLAVET SECDESİ AYETİ</span>
                            <span className="px-2 py-0.5 rounded bg-amber-700 text-white text-[10px] uppercase">
                              Secde Gerektirir
                            </span>
                          </div>
                          <div className="text-[11px] text-amber-900 font-medium mt-0.5">
                            Bu ayeti okuduğunuzda veya okunuşunu dinlediğinizde Tilavet Secdesi yapılması vaciptir (Şâfiî'de sünnet).
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Item header */}
                  <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-stone-100 text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`w-7 h-7 rounded-full font-bold flex items-center justify-center font-mono text-xs border ${
                        isSajdah ? 'bg-amber-700 text-white border-amber-800' : 'bg-amber-50 text-amber-900 border-amber-200'
                      }`}>
                        {verse.number}
                      </span>
                      <span className="text-slate-500 font-semibold text-[11px]">
                        {verse.page}. Sayfa • {verse.juz}. Cüz
                      </span>
                      {isSajdah && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold">
                          ۩ Secde Ayeti
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleBookmark(verse.number)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          isBookmarked
                            ? 'text-amber-700 bg-amber-50'
                            : 'text-stone-400 hover:text-amber-600'
                        }`}
                        title="Yer İşareti"
                      >
                        <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Arabic text with tecvit markup or pure text */}
                  <div className="my-4 text-right dir-rtl leading-relaxed">
                    {showTajweed && verse.tajweedMarkup ? (
                      <div
                        className={`font-serif text-stone-950 ${fontSizeClass}`}
                        dangerouslySetInnerHTML={{ __html: verse.tajweedMarkup.text }}
                      />
                    ) : (
                      <p className={`font-serif text-stone-950 ${fontSizeClass}`}>
                        {verse.arabic}
                      </p>
                    )}
                  </div>

                  {/* Inline Tajweed Markup rules if selected */}
                  {showTajweed && verse.tajweedMarkup?.rules && verse.tajweedMarkup.rules.length > 0 && (
                    <div className="my-3 flex flex-wrap gap-1.5 pt-1">
                      {verse.tajweedMarkup.rules.map((rl, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] px-2.5 py-1 rounded-full bg-[#FCFBF7] text-stone-700 border border-amber-200/50 font-medium"
                        >
                          <strong className="text-amber-800 mr-1">{rl.word}:</strong>
                          {rl.note}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Transliteration */}
                  {showTransliteration && (
                    <p className="text-xs font-mono text-stone-600 mt-2 bg-stone-50 p-3 rounded-xl border border-stone-200/60">
                      {verse.transliteration}
                    </p>
                  )}

                  {/* Translation */}
                  {showTranslation && (
                    <p className="text-xs text-stone-800 mt-3 italic leading-relaxed bg-[#FCFBF7] p-3 rounded-xl border border-amber-600/5">
                      "{verse.translation}"
                    </p>
                  )}

                  {/* Interaction bar */}
                  <div className="flex items-center justify-between gap-1 mt-5 pt-3 border-t border-stone-100">
                    <button
                      onClick={() => onPlayAyah(verse)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                        isCurrentActive && isPlaying
                          ? 'bg-[#D4AF37] text-stone-950 font-bold'
                          : 'bg-stone-50 text-stone-700 hover:bg-stone-100 border border-stone-200'
                      }`}
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>{isCurrentActive && isPlaying ? 'Durdur' : 'Dinle'}</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() =>
                          onOpenAiTajweedExplain(selectedSurah.nameTurkish, verse.number, verse.arabic)
                        }
                        className="p-2 rounded-xl bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-100 transition-colors"
                        title="AI Tecvit Tahlili"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      </button>

                      <button
                        onClick={onOpenVoiceRecorder}
                        className="p-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-100 transition-colors"
                        title="Ses Kaydı Al"
                      >
                        <Mic className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          if (!user && onRequireAuth) {
                            onRequireAuth('Ayetlere tefekkür ders notu eklemek için lütfen oturum açın.');
                            return;
                          }
                          setActiveNoteModalAyah(verse);
                          setNoteTextInput('');
                        }}
                        className="p-2 rounded-xl bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200 transition-colors flex items-center gap-1 font-semibold text-xs"
                        title="Ayet Notu Ekle"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                        <span>Not Al</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
        </>
      )}

      {/* Floating Selected Ayah Tooltip Popover (Tam Ekranda veya Normal Modda Ayet Üstü Tooltip Seçenekleri) */}
      {selectedMushafAyah && (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-lg bg-white/98 text-stone-900 backdrop-blur-2xl p-4 rounded-3xl border border-amber-300/80 shadow-2xl animate-fade-in space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-stone-200">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-600 text-white font-black text-[11px] flex items-center justify-center font-mono shadow-xs">
                {selectedMushafAyah.number}
              </span>
              <span className="text-xs font-bold text-amber-900">
                {selectedSurah.nameTurkish} Sûresi, {selectedMushafAyah.number}. Ayet
              </span>
              <span className="text-[10px] text-stone-500">
                (Sayfa {selectedMushafAyah.page})
              </span>
            </div>

            <button
              onClick={() => setSelectedMushafAyah(null)}
              className="px-2.5 py-1 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-all text-xs font-medium flex items-center gap-1.5 active:scale-95 border border-stone-200"
              title="Kapat (ESC)"
            >
              <span className="text-[10px] font-mono text-stone-600 bg-stone-200/80 px-1.5 py-0.5 rounded border border-stone-300">ESC</span>
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tilavet Secdesi Uyarısı (Seçili Ayet İçin) */}
          {checkIsSajdahVerse(selectedSurah.id, selectedMushafAyah.number) && (
            <div className="p-2.5 bg-amber-500/20 border-2 border-amber-500 rounded-2xl text-amber-950 flex items-center gap-2.5 text-xs font-bold">
              <span className="w-7 h-7 rounded-xl bg-amber-700 text-white flex items-center justify-center font-serif font-black text-sm shrink-0 shadow-xs">
                ۩
              </span>
              <div>
                <span className="font-extrabold text-amber-950 block">TİLAVET SECDESİ AYETİ</span>
                <span className="text-[10px] text-amber-900 block font-semibold leading-tight">
                  Bu ayeti okuduğunuzda veya okunuşunu dinlediğinizde Tilavet Secdesi yapılması vaciptir (Şâfiî'de sünnet).
                </span>
              </div>
            </div>
          )}

          {/* Selected Ayah Arabic snippet */}
          <div className="p-2.5 bg-amber-50/70 rounded-2xl border border-amber-200/70 text-right dir-rtl font-serif text-lg text-amber-950 max-h-24 overflow-y-auto leading-relaxed">
            {selectedMushafAyah.arabic}
          </div>

          {/* Expandable Translation inside Tooltip */}
          {showTooltipTranslation && (
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 text-xs italic text-stone-700 leading-relaxed max-h-32 overflow-y-auto space-y-1">
              <div>"{selectedMushafAyah.translation}"</div>
              <div className="text-[10px] font-mono non-italic text-amber-800 pt-1 border-t border-stone-200">
                Okunuşu: {selectedMushafAyah.transliteration}
              </div>
            </div>
          )}

          {/* Quick Actions Row inside Tooltip */}
          <div className="grid grid-cols-5 gap-1.5 pt-1">
            <button
              onClick={() => onPlayAyah(selectedMushafAyah)}
              className={`py-2 px-1 rounded-2xl text-[11px] font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                activeAyah?.number === selectedMushafAyah.number && isPlaying
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-stone-100 text-stone-800 hover:bg-amber-100 hover:text-amber-900 border border-stone-200'
              }`}
            >
              <Volume2 className="w-4 h-4 text-amber-700" />
              <span>{activeAyah?.number === selectedMushafAyah.number && isPlaying ? 'Durdur' : 'Dinle'}</span>
            </button>

            <button
              onClick={() => setShowTooltipTranslation(!showTooltipTranslation)}
              className={`py-2 px-1 rounded-2xl text-[11px] font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                showTooltipTranslation
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-stone-100 text-stone-800 hover:bg-amber-100 hover:text-amber-900 border border-stone-200'
              }`}
            >
              <BookOpen className="w-4 h-4 text-amber-700" />
              <span>{showTooltipTranslation ? 'Gizle' : 'Meal'}</span>
            </button>

            <button
              onClick={() => {
                if (!user && onRequireAuth) {
                  onRequireAuth('Ayetlere tefekkür ders notu eklemek için lütfen oturum açın.');
                  return;
                }
                setActiveNoteModalAyah(selectedMushafAyah);
                setNoteTextInput('');
              }}
              className="py-2 px-1 rounded-2xl text-[11px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 flex flex-col items-center justify-center gap-1 transition-all"
            >
              <Edit3 className="w-4 h-4 text-amber-700" />
              <span>Not Al</span>
            </button>

            <button
              onClick={() => toggleBookmark(selectedMushafAyah.number)}
              className={`py-2 px-1 rounded-2xl text-[11px] font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                bookmarkedVerses.includes(selectedMushafAyah.number)
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-stone-100 text-stone-800 hover:bg-amber-100 hover:text-amber-900 border border-stone-200'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${bookmarkedVerses.includes(selectedMushafAyah.number) ? 'fill-current text-amber-600' : 'text-amber-700'}`} />
              <span>{bookmarkedVerses.includes(selectedMushafAyah.number) ? 'Kaydedildi' : 'Kaydet'}</span>
            </button>

            <button
              onClick={() => onOpenAiTajweedExplain(selectedSurah.nameTurkish, selectedMushafAyah.number, selectedMushafAyah.arabic)}
              className="py-2 px-1 rounded-2xl text-[11px] font-bold bg-amber-600 text-white hover:bg-amber-700 border border-amber-600 flex flex-col items-center justify-center gap-1 transition-all shadow-2xs"
            >
              <Sparkles className="w-4 h-4 text-amber-200" />
              <span>AI Sor</span>
            </button>
          </div>
        </div>
      )}

      {/* Floating Traditional Save Note Dialog/Modal */}
      {activeNoteModalAyah && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
          <div className="bg-white border border-stone-200 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 text-slate-900 relative">
            <div className="flex items-center justify-between border-b pb-3 border-stone-100">
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-700" />
                <span>Not Ekle — {selectedSurah.nameTurkish} Sûresi, {activeNoteModalAyah.number}. Ayet</span>
              </h3>
            </div>

            {/* Ayah Snippet Context */}
            <div className="p-3.5 bg-[#FCFBF7] rounded-2xl border border-amber-200/70 space-y-1 text-xs">
              <p className="font-serif text-right text-stone-950 text-base font-bold dir-rtl leading-relaxed">
                {activeNoteModalAyah.arabic}
              </p>
              <p className="text-stone-700 italic text-[11px] line-clamp-2">
                "{activeNoteModalAyah.translation}"
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1.5">Not Etiketi / Kategorisi</label>
              <select
                value={noteTagInput}
                onChange={(e) => setNoteTagInput(e.target.value as VerseNote['tag'])}
                className="w-full bg-stone-50 text-stone-800 text-xs rounded-xl p-3 border border-stone-200 font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="Tefsir Notu">Tefsir Notu</option>
                <option value="Tecvit">Tecvit Notu</option>
                <option value="Hikmet">Hikmetli Söz</option>
                <option value="Önemli">Önemli Ders Notu</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1.5">Ders Notunuz</label>
              <textarea
                rows={4}
                placeholder="Ayet ile ilgili tefsir nüktelerinizi veya ders notlarınızı yazın..."
                value={noteTextInput}
                onChange={(e) => setNoteTextInput(e.target.value)}
                className="w-full bg-stone-50 text-stone-800 text-xs rounded-xl p-3 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed font-sans"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-stone-100">
              <button
                onClick={() => {
                  setActiveNoteModalAyah(null);
                  setNoteTextInput('');
                }}
                className="px-4 py-2.5 rounded-xl text-xs text-stone-600 hover:bg-stone-100 font-semibold transition-colors"
              >
                Vazgeç
              </button>
              <button
                onClick={() => handleSaveNoteSubmit(activeNoteModalAyah)}
                disabled={!noteTextInput.trim()}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4 text-white" />
                <span>Notu Kaydet</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Immersive Floating Page Nav Paddles (Desktop/Tablet Fullscreen Comfort) */}
      {isFullScreen && (
        <>
          {hasPrevPage && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrevPage();
              }}
              className={`fixed left-4 top-1/2 -translate-y-1/2 z-40 p-4 rounded-full shadow-2xl border transition-all duration-300 active:scale-95 flex items-center justify-center ${
                areOverlaysVisible
                  ? 'opacity-100 pointer-events-auto scale-100'
                  : 'opacity-0 pointer-events-none scale-75'
              } ${
                pageTheme === 'dark'
                  ? 'bg-stone-900/90 text-amber-200 border-stone-800 hover:bg-stone-800/95'
                  : 'bg-white/90 text-[#9E7A28] border-stone-200 hover:bg-stone-50/95'
              }`}
              title="Önceki Sayfa"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          {hasNextPage && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNextPage();
              }}
              className={`fixed right-4 top-1/2 -translate-y-1/2 z-40 p-4 rounded-full shadow-2xl border transition-all duration-300 active:scale-95 flex items-center justify-center ${
                areOverlaysVisible
                  ? 'opacity-100 pointer-events-auto scale-100'
                  : 'opacity-0 pointer-events-none scale-75'
              } ${
                pageTheme === 'dark'
                  ? 'bg-stone-900/90 text-amber-200 border-stone-800 hover:bg-stone-800/95'
                  : 'bg-white/90 text-[#9E7A28] border-stone-200 hover:bg-stone-50/95'
              }`}
              title="Sonraki Sayfa"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </>
      )}

      {/* BÜYÜK VE ANLAŞILIR SAYFA DEĞİŞİMİ BİLDİRİM OVERLAYI (HIZLI VE TIKLAYINCA ANINDA KAPANIR) */}
      {pageNotice && (
        <div
          onClick={() => setPageNotice(null)}
          className="fixed top-20 sm:top-24 left-1/2 -translate-x-1/2 z-[999] cursor-pointer animate-fade-in select-none"
          title="Anında kapatmak için tıkla"
        >
          <div className="bg-amber-900/95 hover:bg-amber-900 text-amber-50 backdrop-blur-2xl border border-amber-400/60 shadow-xl rounded-2xl px-5 py-2.5 sm:px-6 sm:py-3 flex items-center gap-3 transition-all active:scale-95">
            <div className="w-8 h-8 rounded-xl bg-amber-500/30 text-amber-200 border border-amber-400/50 flex items-center justify-center font-bold shrink-0">
              <BookOpen className="w-4 h-4 text-amber-200 animate-pulse" />
            </div>
            <div className="text-left">
              <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-amber-200/90">
                {selectedSurah.nameTurkish} ({selectedSurah.id}. Sûre)
              </div>
              <div className="text-xl sm:text-2xl font-black font-serif text-white tracking-tight leading-tight">
                SAYFA {pageNotice}
              </div>
            </div>
            <div className="ml-1 pl-2.5 border-l border-amber-500/40 text-[10px] text-amber-200 font-medium">
              Kapat ✕
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
