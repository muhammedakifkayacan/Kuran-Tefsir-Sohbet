import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bookmark, Sparkles, Mic, Search, Volume2, Info, Check, BookOpen, List, ChevronLeft, ChevronRight, ChevronDown, Edit3, Minimize2, FileText, X, Type, SlidersHorizontal, ArrowRight, Share2, Copy, CheckSquare, Square, MessageCircle } from 'lucide-react';
import { Surah, Ayah, VerseNote } from '../types';
import { ALL_SURAHS } from '../data/surahList';
import { fetchSurahFromApi } from '../utils/quranApi';
import { MEAL_SOURCES, TAFSIR_SOURCES, generateTafsirContent, getAuthorMealText } from '../data/tafsirData';

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
  targetVerseNumber?: number | null;
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
    { keywords: ['rabbisrahli', 'rabbişrahli', 'rabbişrah', 'rabbi israh li', 'rabbi israh', 'رب اشرح لي', 'رب اشرح لي صدري', 'اشرح لي صدري', 'رب اشرحلي', 'taha 25', 'tâhâ 25'], surahId: 20, verseNumber: 25, pageNumber: 313, title: "Hz. Mûsâ'nın Duası (Tâhâ 25)", description: 'Tâhâ Sûresi 25. Ayet (Sayfa 313)' },
    { keywords: ['insirah', 'inşirah', 'alam nasrah', 'elemneşrah', 'ألم نشرح لك صدرك', 'الانشراح'], surahId: 94, verseNumber: 1, pageNumber: 596, title: 'İnşirah Sûresi', description: 'Sayfa 596' },
    { keywords: ['la ilaha illa anta', 'subhanaka inni kuntu', 'la ilahe illa ente', 'süphaneke inni küntü', 'لا إله إلا أنت سبحانك', 'الأنبياء 87'], surahId: 21, verseNumber: 87, pageNumber: 329, title: "Hz. Yûnus'un Duası (Enbiyâ 87)", description: 'Enbiyâ Sûresi 87. Ayet (Sayfa 329)' },
    { keywords: ['hasbunallah', 'hasbunallahu ve nimel vekil', 'حسبنا الله ونعم الوكيل'], surahId: 3, verseNumber: 173, pageNumber: 72, title: "Hasbunallâhu ve Ni'mel Vekîl (Âl-i İmrân 173)", description: 'Âl-i İmrân Sûresi 173. Ayet (Sayfa 72)' },
    { keywords: ['rabbena atina', 'rabbenâ âtinâ', 'ربنا آتنا في الدنيا حسنة'], surahId: 2, verseNumber: 201, pageNumber: 31, title: 'Rabbena Âtinâ Duası (Bakara 201)', description: 'Bakara Sûresi 201. Ayet (Sayfa 31)' },
    { keywords: ['rabbicalni', 'rabbic\'alni', 'رب اجعلني مقيم الصلاة'], surahId: 14, verseNumber: 40, pageNumber: 260, title: "Hz. İbrâhîm'in Namaz Duası (İbrâhîm 40)", description: 'İbrâhîm Sûresi 40. Ayet (Sayfa 260)' },
    { keywords: ['tekasur', 'takasur', 'tekâsür', 'alhakum', 'ألهاكم التكاثر', 'ألهاكم', 'التكاثر'], surahId: 102, verseNumber: 1, pageNumber: 600, title: 'Tekâsür Sûresi', description: 'Sayfa 600' },
    { keywords: ['karia', 'kâria', 'kariah', 'القارعة', 'القارعة ما القارعة'], surahId: 101, verseNumber: 1, pageNumber: 600, title: 'Kâri\'a Sûresi', description: 'Sayfa 600' },
    { keywords: ['asr', 'wal asr', 'والعصر', 'والعصر إن الإنسان لفي خسر', 'العصر'], surahId: 103, verseNumber: 1, pageNumber: 601, title: 'Asr Sûresi', description: 'Sayfa 601' },
    { keywords: ['humaze', 'hümefe', 'ويل لكل همزة', 'الهمزة'], surahId: 104, verseNumber: 1, pageNumber: 601, title: 'Hümeze Sûresi', description: 'Sayfa 601' },
    { keywords: ['adiyat', 'âdiyât', 'والعاديات', 'العاديات'], surahId: 100, verseNumber: 1, pageNumber: 599, title: 'Âdiyât Sûresi', description: 'Sayfa 599' },
    { keywords: ['beyyine', 'لم يكن الذين كفروا', 'البينة'], surahId: 98, verseNumber: 1, pageNumber: 598, title: 'Beyyine Sûresi', description: 'Sayfa 598' },
    { keywords: ['zilzal', 'إذا زلزلت', 'الزلزلة'], surahId: 99, verseNumber: 1, pageNumber: 599, title: 'Zilzâl Sûresi', description: 'Sayfa 599' },
    { keywords: ['tin', 'tîn', 'والتين', 'التين'], surahId: 95, verseNumber: 1, pageNumber: 597, title: 'Tîn Sûresi', description: 'Sayfa 597' },
    { keywords: ['alak', 'alâk', 'اقرأ باسم ربك', 'العلق'], surahId: 96, verseNumber: 1, pageNumber: 597, title: 'Alak Sûresi', description: 'Sayfa 597' },
    { keywords: ['kadr', 'kadir', 'إنا أنزلناه في ليلة القدر', 'القدر'], surahId: 97, verseNumber: 1, pageNumber: 598, title: 'Kadir Sûresi', description: 'Sayfa 598' },
    { keywords: ['duha', 'duhâ', 'والضحى', 'الضحى'], surahId: 93, verseNumber: 1, pageNumber: 596, title: 'Duhâ Sûresi', description: 'Sayfa 596' },
    { keywords: ['insirah', 'inşirah', 'alam nasrah', 'elemneşrah', 'ألم نشرح لك صدرك', 'الانشراح'], surahId: 94, verseNumber: 1, pageNumber: 596, title: 'İnşirah Sûresi', description: 'Sayfa 596' },
    { keywords: ['leyl', 'والليل إذا يغشى', 'الليل'], surahId: 92, verseNumber: 1, pageNumber: 595, title: 'Leyl Sûresi', description: 'Sayfa 595' },
    { keywords: ['sems', 'şems', 'والشمس وضحاها', 'الشمس'], surahId: 91, verseNumber: 1, pageNumber: 595, title: 'Şems Sûresi', description: 'Sayfa 595' },
    { keywords: ['beled', 'لا أقسم بهذا البلد', 'البلد'], surahId: 90, verseNumber: 1, pageNumber: 594, title: 'Beled Sûresi', description: 'Sayfa 594' },
    { keywords: ['fecr', 'والفجر', 'الفجر'], surahId: 89, verseNumber: 1, pageNumber: 593, title: 'Fecr Sûresi', description: 'Sayfa 593' },
    { keywords: ['gasiye', 'gâşiye', 'هل أتاك حديث الغاشية', 'الغاشية'], surahId: 88, verseNumber: 1, pageNumber: 592, title: 'Gâşiye Sûresi', description: 'Sayfa 592' },
    { keywords: ['ala', 'a\'lâ', 'سبح اسم ربك الأعلى', 'الأعلى'], surahId: 87, verseNumber: 1, pageNumber: 591, title: 'A\'lâ Sûresi', description: 'Sayfa 591' },
    { keywords: ['tarik', 'târık', 'والسماء والطارق', 'الطارق'], surahId: 86, verseNumber: 1, pageNumber: 591, title: 'Târık Sûresi', description: 'Sayfa 591' },
    { keywords: ['buruc', 'burûc', 'والسماء ذات البروج', 'البروج'], surahId: 85, verseNumber: 1, pageNumber: 590, title: 'Burûc Sûresi', description: 'Sayfa 590' },
    { keywords: ['insikak', 'inşikâk', 'إذا السماء انشقت', 'الانشقاق'], surahId: 84, verseNumber: 1, pageNumber: 589, title: 'İnşikâk Sûresi', description: 'Sayfa 589' },
    { keywords: ['mutaffifin', 'mutaffifîn', 'ويل للمطففين', 'المطففين'], surahId: 83, verseNumber: 1, pageNumber: 587, title: 'Mutaffifîn Sûresi', description: 'Sayfa 587' },
    { keywords: ['infitar', 'infitâr', 'إذا السماء انفطرت', 'الانفطار'], surahId: 82, verseNumber: 1, pageNumber: 587, title: 'İnfitâr Sûresi', description: 'Sayfa 587' },
    { keywords: ['takvir', 'إذا الشمس كورت', 'التكوير'], surahId: 81, verseNumber: 1, pageNumber: 586, title: 'Tekvîr Sûresi', description: 'Sayfa 586' },
    { keywords: ['abese', 'عبس وتولى', 'عبس'], surahId: 80, verseNumber: 1, pageNumber: 585, title: 'Abese Sûresi', description: 'Sayfa 585' },
    { keywords: ['naziat', 'nâziât', 'والنازعات', 'النازعات'], surahId: 79, verseNumber: 1, pageNumber: 583, title: 'Nâziât Sûresi', description: 'Sayfa 583' },
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
  targetVerseNumber,
}) => {
  // Reading Mode state
  const [viewMode, setViewMode] = useState<'mushaf' | 'meal' | 'detailed'>('mushaf');
  const [selectedMushafAyah, setSelectedMushafAyah] = useState<Ayah | null>(null);

  // Auto highlight verse when targetVerseNumber prop changes
  useEffect(() => {
    if (targetVerseNumber && selectedSurah && selectedSurah.verses) {
      const vObj = selectedSurah.verses.find((v) => v.number === targetVerseNumber);
      if (vObj) {
        setSelectedMushafAyah(vObj);
        if (vObj.page && vObj.page !== selectedPage) {
          setSelectedPage(vObj.page);
        }
        setTimeout(() => {
          const el = document.getElementById(`verse-${vObj.number}`) || document.getElementById(`ayah-${vObj.number}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 350);
      }
    }
  }, [targetVerseNumber, selectedSurah]);

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

  const [selectedPage, setSelectedPage] = useState<number>(selectedSurah.startPage || 1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterJuz, setFilterJuz] = useState<number | 'all'>('all');
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchCategoryTab, setSearchCategoryTab] = useState<'all' | 'surahs' | 'verses' | 'pages'>('all');
  const [isLiveListening, setIsLiveListening] = useState(false);

  // Tarteel Live Recitation Tracking & Auto-Follower States
  const [isTarteelTracking, setIsTarteelTracking] = useState(false);
  const isTarteelTrackingRef = React.useRef(false);
  const [tarteelLastMatch, setTarteelLastMatch] = useState<{
    surahId: number;
    surahName: string;
    verseNumber: number;
    arabicText: string;
  } | null>(null);

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
  const lastMatchedVerseKeyRef = React.useRef<string>('');

  // Smart Match Direct Navigation Helper
  const navigateToSmartMatch = async (match: SmartQueryResult, options?: { silent?: boolean }) => {
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

            setTimeout(() => {
              const el =
                document.getElementById(`verse-${vObj.number}`) ||
                document.getElementById(`ayah-${vObj.number}`);
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }, 120);
          }
        }
      }
      setIsSearchModalOpen(false);
      setIsVoiceSearching(false);
      if (!options?.silent) {
        showToast(`🎯 Bulundu ve Açıldı: ${match.title}`);
      }
    } catch (e) {
      console.warn('Smart match navigation error:', e);
    }
  };

  // Sync state refs to prevent stale closures in speech recognition events
  const selectedSurahRef = React.useRef(selectedSurah);
  selectedSurahRef.current = selectedSurah;

  const selectedMushafAyahRef = React.useRef(selectedMushafAyah);
  selectedMushafAyahRef.current = selectedMushafAyah;

  const selectedPageRef = React.useRef(selectedPage);
  selectedPageRef.current = selectedPage;

  // Clean Arabic String Helper for Tarteel Matching (preserves spaces for word-level matching)
  const cleanArabicForMatching = (text: string): string => {
    if (!text) return '';
    return normalizeArabicText(text)
      .replace(/[^\u0621-\u064A\s]/g, '') // Keep Arabic letters AND spaces
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
  };

  // Helper to strip introductory phrases (Besmele & Euzu) that precede Surah recitation
  const stripBasmalahAndIstiadhah = (text: string): string => {
    if (!text) return '';
    let result = text;
    result = result.replace(/بسم الله الرحمن الرحيم/g, '');
    result = result.replace(/بسم الله/g, '');
    result = result.replace(/اعوذ بالله من الشيطان الرجيم/g, '');
    result = result.replace(/اعوذ بالله/g, '');
    return result.replace(/\s+/g, ' ').trim();
  };

  // Real-time Spoken Recitation Ayah Matcher & Auto-Follower (Supports Continuous Surah Transition & Anti-Flicker)
  const matchSpokenRecitationToAyah = React.useCallback(
    async (fullTranscript: string, latestChunk: string = '') => {
      if (!fullTranscript || fullTranscript.trim().length < 2) return;

      const surah = selectedSurahRef.current;
      if (!surah || !surah.verses || surah.verses.length === 0) return;

      const currentMushafAyah = selectedMushafAyahRef.current;
      const currentVerseNum = currentMushafAyah?.number || 1;

      const rawFullClean = cleanArabicForMatching(fullTranscript);
      const rawLatestClean = cleanArabicForMatching(latestChunk);

      if (!rawFullClean && !rawLatestClean) return;

      // Cleaned versions with Basmalah/Istiadhah stripped when evaluating content
      const fullCleanStripped = stripBasmalahAndIstiadhah(rawFullClean);
      const latestCleanStripped = stripBasmalahAndIstiadhah(rawLatestClean);

      // SAFETY GUARANTEE:
      // If the user ONLY spoke "Bismillahir Rahmanir Rahim" or "Euzu billah...",
      // stripped text will be empty ("").
      // Do NOT trigger any matches or jump to Fatiha 1! Wait until actual verse words are spoken.
      if (!fullCleanStripped && !latestCleanStripped) {
        return;
      }

      const fullClean = fullCleanStripped;
      const latestClean = latestCleanStripped || fullCleanStripped;

      // Extract recent spoken tail (last ~10 spoken words / ~50 chars)
      const fullWords = fullClean.split(/\s+/).filter((w) => w.length >= 2);
      const recentWords = fullWords.slice(-10);
      const recentTailClean = recentWords.join(' ');
      const latestWords = latestClean.split(/\s+/).filter((w) => w.length >= 2);

      // Helper to compute match score for a given verse
      const computeScore = (v: Ayah, isCurrentSurah: boolean) => {
        let cleanVerse = cleanArabicForMatching(v.arabic);
        if (!cleanVerse) return -999;

        // Always strip Besmele from verse text so raw Besmele in Fatiha 1 doesn't match introductory Besmele!
        const strippedVerse = stripBasmalahAndIstiadhah(cleanVerse);
        if (!strippedVerse) {
          // If a verse becomes empty after stripping Besmele (Fatiha Ayah 1), it shouldn't match on Besmele alone
          return -999;
        }
        cleanVerse = strippedVerse;

        const noSpaceVerse = cleanVerse.replace(/\s+/g, '');
        let score = 0;

        // 1. Match against latest spoken chunk
        if (latestClean.length >= 2) {
          const noSpaceLatest = latestClean.replace(/\s+/g, '');
          if (cleanVerse.includes(latestClean) || latestClean.includes(cleanVerse)) {
            score += 150;
          } else if (noSpaceVerse.includes(noSpaceLatest) || noSpaceLatest.includes(noSpaceVerse)) {
            score += 130;
          }

          let latestHits = 0;
          for (const lw of latestWords) {
            if (cleanVerse.includes(lw) || noSpaceVerse.includes(lw)) {
              latestHits++;
            }
          }
          if (latestWords.length > 0) {
            score += (latestHits / latestWords.length) * 100;
          }
        }

        // 2. Match against recent tail
        if (recentTailClean.length >= 2) {
          const noSpaceTail = recentTailClean.replace(/\s+/g, '');
          if (cleanVerse.includes(recentTailClean) || recentTailClean.includes(cleanVerse)) {
            score += 120;
          } else if (noSpaceVerse.includes(noSpaceTail) || noSpaceTail.includes(noSpaceVerse)) {
            score += 100;
          }

          let tailHits = 0;
          for (const rw of recentWords) {
            if (cleanVerse.includes(rw) || noSpaceVerse.includes(rw)) {
              tailHits++;
            }
          }
          if (recentWords.length > 0) {
            score += (tailHits / recentWords.length) * 80;
          }
        }

        // 3. Positional / Continuity bias
        if (isCurrentSurah) {
          const dist = v.number - currentVerseNum;
          if (dist === 0) {
            score += 110;
          } else if (dist === 1) {
            score += 90;
          } else if (dist === 2) {
            score += 45;
          } else if (dist === 3) {
            score += 20;
          } else if (dist < 0) {
            // Heavy penalty for backward jumps in current surah to prevent random flickering
            score -= 160;
          } else if (dist > 3) {
            score -= 90;
          }
        } else {
          // Next Surah bias (favor initial verses when transitioning)
          if (v.number === 1) score += 95;
          else if (v.number === 2) score += 80;
          else if (v.number === 3) score += 50;
        }

        return score;
      };

      // PASS 1: Score current surah
      let currentBestVerse: Ayah | null = null;
      let maxCurrentScore = -999;

      for (const v of surah.verses) {
        const score = computeScore(v, true);
        if (score > maxCurrentScore) {
          maxCurrentScore = score;
          currentBestVerse = v;
        }
      }

      // PASS 2: If near the end of current surah OR maxCurrentScore is low, check NEXT SURAH
      let nextSurahObj: Surah | null = null;
      let nextBestVerse: Ayah | null = null;
      let maxNextScore = -999;

      const isNearEndOfSurah = currentVerseNum >= surah.verses.length - 1;

      if ((isNearEndOfSurah || maxCurrentScore < 80) && surah.id < 114) {
        try {
          nextSurahObj = await fetchSurahFromApi(surah.id + 1);
          if (nextSurahObj && nextSurahObj.verses) {
            // Check first 10 verses of next surah
            const nextVersesToCheck = nextSurahObj.verses.slice(0, 10);
            for (const nv of nextVersesToCheck) {
              const score = computeScore(nv, false);
              if (score > maxNextScore) {
                maxNextScore = score;
                nextBestVerse = nv;
              }
            }
          }
        } catch (e) {
          console.warn('Next surah pre-fetch error:', e);
        }
      }

      // DECISION 1: Switch to NEXT SURAH if strong match found or near end of surah
      if (
        nextSurahObj &&
        nextBestVerse &&
        maxNextScore >= 45 &&
        (maxNextScore > maxCurrentScore || isNearEndOfSurah)
      ) {
        const targetSurahId = nextSurahObj.id;
        const matchKey = `${targetSurahId}:${nextBestVerse.number}`;

        if (matchKey !== lastMatchedVerseKeyRef.current) {
          lastMatchedVerseKeyRef.current = matchKey;

          // Update refs immediately
          selectedSurahRef.current = nextSurahObj;
          selectedMushafAyahRef.current = nextBestVerse;

          // Load next surah view
          await loadSurah(targetSurahId);
          setSelectedMushafAyah(nextBestVerse);
          setActiveAyah(nextBestVerse);
          if (nextBestVerse.page) setSelectedPage(nextBestVerse.page);

          setTarteelLastMatch({
            surahId: nextSurahObj.id,
            surahName: nextSurahObj.nameTurkish,
            verseNumber: nextBestVerse.number,
            arabicText: nextBestVerse.arabic,
          });

          setTimeout(() => {
            const el =
              document.getElementById(`verse-${nextBestVerse!.number}`) ||
              document.getElementById(`ayah-${nextBestVerse!.number}`);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 120);
        }
        return;
      }

      // DECISION 2: Apply match inside CURRENT SURAH
      if (currentBestVerse) {
        // Prevent spurious backward jumps in current surah unless score is overwhelmingly high (explicit restart)
        if (currentBestVerse.number < currentVerseNum && maxCurrentScore < 150) {
          return;
        }

        if (maxCurrentScore >= 35) {
          const verse = currentBestVerse;
          const matchKey = `${surah.id}:${verse.number}`;

          selectedMushafAyahRef.current = verse;

          setSelectedMushafAyah(verse);
          setActiveAyah(verse);
          if (verse.page && verse.page !== selectedPageRef.current) {
            setSelectedPage(verse.page);
          }

          setTarteelLastMatch({
            surahId: surah.id,
            surahName: surah.nameTurkish,
            verseNumber: verse.number,
            arabicText: verse.arabic,
          });

          if (matchKey !== lastMatchedVerseKeyRef.current) {
            lastMatchedVerseKeyRef.current = matchKey;
            setTimeout(() => {
              const el =
                document.getElementById(`verse-${verse.number}`) ||
                document.getElementById(`ayah-${verse.number}`);
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }, 60);
          }
          return;
        }
      }

      // PASS 3: Global Quran Search for Spoken Arabic (e.g. user jump to Taha 25 "Rabbi ishrah li sadri" or Karia "El qari'ah")
      const candidateSpoken = recentTailClean.length >= 4 ? recentTailClean : fullClean;
      const spokenArabic = stripBasmalahAndIstiadhah(candidateSpoken);

      if (spokenArabic && spokenArabic.length >= 3 && maxCurrentScore < 25 && maxNextScore < 25) {
        // 1. Check Smart Query / Famous Map
        const smartMatch =
          resolveSmartQuery(spokenArabic, surah) ||
          resolveSmartQuery(stripBasmalahAndIstiadhah(fullTranscript), surah);
        if (smartMatch && smartMatch.surahId && smartMatch.surahId !== surah.id) {
          const matchKey = `${smartMatch.surahId}:${smartMatch.verseNumber || 1}`;
          if (matchKey !== lastMatchedVerseKeyRef.current) {
            lastMatchedVerseKeyRef.current = matchKey;
            await navigateToSmartMatch(smartMatch, { silent: true });
            setTarteelLastMatch({
              surahId: smartMatch.surahId,
              surahName: smartMatch.surahName || '',
              verseNumber: smartMatch.verseNumber || 1,
              arabicText: smartMatch.title,
            });
            return;
          }
        }

        // 2. Search ALL_SURAHS by Arabic surah name (e.g. "العصر", "القارعة", "التكاثر")
        const normSpoken = normalizeArabicText(spokenArabic);
        for (const sObj of ALL_SURAHS) {
          if (sObj.id === surah.id) continue;
          const sArNorm = normalizeArabicText(sObj.nameArabic);
          const sArNoAl = sArNorm.replace(/^ال/, ''); // e.g. "عصر", "قارعة", "تكاثر"
          if (
            (sArNorm.length >= 3 && normSpoken.includes(sArNorm)) ||
            (sArNoAl.length >= 3 && normSpoken.includes(sArNoAl))
          ) {
            const matchKey = `${sObj.id}:1`;
            if (matchKey !== lastMatchedVerseKeyRef.current) {
              lastMatchedVerseKeyRef.current = matchKey;
              const loaded = await fetchSurahFromApi(sObj.id);
              selectedSurahRef.current = loaded;
              await loadSurah(sObj.id);

              const vObj = loaded.verses[0];
              selectedMushafAyahRef.current = vObj;
              setSelectedMushafAyah(vObj);
              setActiveAyah(vObj);
              if (vObj.page) setSelectedPage(vObj.page);

              setTarteelLastMatch({
                surahId: loaded.id,
                surahName: loaded.nameTurkish,
                verseNumber: vObj.number,
                arabicText: vObj.arabic,
              });

              setTimeout(() => {
                const el =
                  document.getElementById(`verse-1`) ||
                  document.getElementById(`ayah-1`);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 120);
              return;
            }
          }
        }

        // 3. Perform live global AlQuran Cloud API search across all 114 Surahs
        try {
          const searchRes = await fetch(
            `https://api.alquran.cloud/v1/search/${encodeURIComponent(spokenArabic)}/all/quran-uthmani`
          );
          if (searchRes.ok) {
            const searchJson = await searchRes.json();
            if (
              searchJson.code === 200 &&
              searchJson.data &&
              searchJson.data.matches &&
              searchJson.data.matches.length > 0
            ) {
              const topMatch = searchJson.data.matches[0];
              const targetSurahId = topMatch.surah.number;
              const targetVerseNum = topMatch.numberInSurah;
              const matchKey = `${targetSurahId}:${targetVerseNum}`;

              if (matchKey !== lastMatchedVerseKeyRef.current) {
                lastMatchedVerseKeyRef.current = matchKey;

                const targetSurahObj = await fetchSurahFromApi(targetSurahId);
                if (targetSurahObj) {
                  selectedSurahRef.current = targetSurahObj;
                  await loadSurah(targetSurahId);

                  const vObj = targetSurahObj.verses.find((v) => v.number === targetVerseNum);
                  if (vObj) {
                    selectedMushafAyahRef.current = vObj;
                    setSelectedMushafAyah(vObj);
                    setActiveAyah(vObj);
                    if (vObj.page) setSelectedPage(vObj.page);

                    setTarteelLastMatch({
                      surahId: targetSurahObj.id,
                      surahName: targetSurahObj.nameTurkish,
                      verseNumber: vObj.number,
                      arabicText: vObj.arabic,
                    });

                    setTimeout(() => {
                      const el =
                        document.getElementById(`verse-${vObj.number}`) ||
                        document.getElementById(`ayah-${vObj.number}`);
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }
                    }, 120);
                  }
                }
              }
            }
          }
        } catch (e) {
          console.warn('Global Tarteel API search error:', e);
        }
      }
    },
    [loadSurah]
  );

  // Start Tarteel Continuous Recitation Tracking Mode
  const startTarteelLiveTracking = () => {
    const SpeechRecognition =
      (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) {
      alert('Tarayıcınız canlı okuma takibi özelliğini desteklemiyor. Lütfen Chrome veya Safari kullanın.');
      return;
    }

    setIsSearchModalOpen(false);
    setIsVoiceSearching(false);
    setIsTarteelTracking(true);
    isTarteelTrackingRef.current = true;
    lastMatchedVerseKeyRef.current = '';

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'ar-SA'; // Quranic Arabic Recitation

      recognition.onresult = (event: any) => {
        let fullTranscript = '';
        let latestChunk = '';

        for (let i = 0; i < event.results.length; i++) {
          const res = event.results[i][0].transcript;
          fullTranscript += res + ' ';
          if (i === event.results.length - 1) {
            latestChunk = res;
          }
        }

        const trimmedFull = fullTranscript.trim();
        const trimmedLatest = latestChunk.trim();

        if (trimmedFull || trimmedLatest) {
          matchSpokenRecitationToAyah(trimmedFull, trimmedLatest);
        }
      };

      recognition.onerror = (err: any) => {
        console.warn('Tarteel live tracking speech error:', err);
      };

      recognition.onend = () => {
        if (isTarteelTrackingRef.current) {
          try {
            recognition.start();
          } catch (e) {}
        }
      };

      recognition.start();
      speechRecognitionRef.current = recognition;
      showToast('🎙️ Tarteel Canlı Okuma Takibi Başlatıldı');
    } catch (e) {
      console.warn('Could not start Tarteel tracking:', e);
    }
  };

  const stopTarteelLiveTracking = () => {
    isTarteelTrackingRef.current = false;
    setIsTarteelTracking(false);
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (e) {}
    }
    showToast('Tarteel Canlı Takip Durduruldu');
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

  // Tefsir & Meal Seçenek Durumları
  const [activeTafsirAyah, setActiveTafsirAyah] = useState<Ayah | null>(null);
  const [selectedMealSource, setSelectedMealSource] = useState<string>(() => {
    return localStorage.getItem('kuran_app_meal_source') || 'diyanet';
  });
  const [selectedTafsirSource, setSelectedTafsirSource] = useState<string>(() => {
    return localStorage.getItem('kuran_app_tafsir_source') || 'diyanet_kuranyolu';
  });

  // Çoklu Ayet Seçimi & Paylaşım Durumları
  const [isMultiSelectMode, setIsMultiSelectMode] = useState<boolean>(false);
  const [selectedVerseNumbers, setSelectedVerseNumbers] = useState<number[]>([]);
  const [shareModalVerses, setShareModalVerses] = useState<Ayah[] | null>(null);
  const [shareOptions, setShareOptions] = useState({
    includeArabic: true,
    includeTranslation: true,
    includeTransliteration: false,
    includeMetadata: true,
  });
  const [shareFormatMode, setShareFormatMode] = useState<'standard' | 'whatsapp'>('whatsapp');
  const [copySuccessToast, setCopySuccessToast] = useState<boolean>(false);

  const toggleVerseSelection = (verseNumber: number) => {
    setSelectedVerseNumbers((prev) =>
      prev.includes(verseNumber)
        ? prev.filter((n) => n !== verseNumber)
        : [...prev, verseNumber].sort((a, b) => a - b)
    );
  };

  const selectAllPageVerses = () => {
    const pageVerseNumbers = pageVerses.map((v) => v.number);
    const allSelected = pageVerseNumbers.every((n) => selectedVerseNumbers.includes(n));
    if (allSelected) {
      setSelectedVerseNumbers((prev) => prev.filter((n) => !pageVerseNumbers.includes(n)));
    } else {
      setSelectedVerseNumbers((prev) => Array.from(new Set([...prev, ...pageVerseNumbers])).sort((a, b) => a - b));
    }
  };

  const clearVerseSelection = () => {
    setSelectedVerseNumbers([]);
  };

  const exitMultiSelectMode = () => {
    setIsMultiSelectMode(false);
    setSelectedVerseNumbers([]);
  };

  const getFormattedShareText = (verses: Ayah[] | null): string => {
    if (!verses || verses.length === 0) return '';
    const sorted = [...verses].sort((a, b) => a.number - b.number);

    const body = sorted.map((v) => {
      const parts: string[] = [];
      if (shareOptions.includeArabic && v.arabic) {
        parts.push(v.arabic);
      }
      if (shareOptions.includeTranslation && v.translation) {
        parts.push(`"${v.translation}"`);
      }
      if (shareOptions.includeTransliteration && v.transliteration) {
        parts.push(`Okunuşu: ${v.transliteration}`);
      }
      if (shareOptions.includeMetadata && parts.length > 0) {
        parts.push(`(${selectedSurah.nameTurkish} Sûresi, ${v.number}. Ayet)`);
      }
      return parts.join('\n');
    }).join('\n\n---\n\n');

    let footer = '';
    if (shareOptions.includeMetadata) {
      if (sorted.length === 1) {
        footer = `\n\n— ${selectedSurah.nameTurkish} Sûresi, ${sorted[0].number}. Ayet (Sayfa ${sorted[0].page})`;
      } else {
        const minNum = sorted[0].number;
        const maxNum = sorted[sorted.length - 1].number;
        footer = `\n\n— ${selectedSurah.nameTurkish} Sûresi, ${minNum}-${maxNum}. Ayetler`;
      }
    }

    return `${body}${footer}`;
  };

  // WhatsApp Formatted Text Generator (Asterisks * mark bold text in WhatsApp)
  const getWhatsAppFormattedText = (verses: Ayah[] | null): string => {
    if (!verses || verses.length === 0) return '';
    const sorted = [...verses].sort((a, b) => a.number - b.number);

    const header = sorted.length === 1
      ? `*📖 ${selectedSurah.nameTurkish} Sûresi, ${sorted[0].number}. Ayet*`
      : `*📖 ${selectedSurah.nameTurkish} Sûresi (${sorted[0].number} - ${sorted[sorted.length - 1].number}. Ayetler)*`;

    const body = sorted.map((v) => {
      const parts: string[] = [];
      if (sorted.length > 1) {
        parts.push(`*📌 ${v.number}. Ayet:*`);
      }
      if (shareOptions.includeArabic && v.arabic) {
        parts.push(v.arabic);
      }
      if (shareOptions.includeTranslation && v.translation) {
        parts.push(`*Meal:* "${v.translation}"`);
      }
      if (shareOptions.includeTransliteration && v.transliteration) {
        parts.push(`*Okunuşu:* ${v.transliteration}`);
      }
      if (shareOptions.includeMetadata && sorted.length === 1) {
        parts.push(`_(${selectedSurah.nameTurkish} Sûresi, ${v.number}. Ayet • Sayfa ${v.page})_`);
      }
      return parts.join('\n');
    }).join('\n\n---\n\n');

    return `${header}\n\n${body}\n\n_KuranDersi Uygulamasından Paylaşıldı_`;
  };

  const handleCopyWhatsAppText = (verses: Ayah[]) => {
    const text = getWhatsAppFormattedText(verses);
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      showToast('💬 WhatsApp formatında kopyalandı! (*Yıldızlı* bold alanlar hazır)');
      setCopySuccessToast(true);
      setTimeout(() => setCopySuccessToast(false), 2000);
    }).catch(() => {
      showToast('Kopyalama başarısız oldu.');
    });
  };

  const handleCopyText = (verses: Ayah[]) => {
    const text = getFormattedShareText(verses);
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      showToast('📋 Ayet metni panoya kopyalandı!');
      setCopySuccessToast(true);
      setTimeout(() => setCopySuccessToast(false), 2000);
    }).catch(() => {
      showToast('Kopyalama başarısız oldu.');
    });
  };

  const handleShareNative = async (verses: Ayah[]) => {
    const text = getFormattedShareText(verses);
    if (!text) return;

    const title = verses.length === 1
      ? `${selectedSurah.nameTurkish} Sûresi ${verses[0].number}. Ayet`
      : `${selectedSurah.nameTurkish} Sûresi (${verses.length} Ayet)`;

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
        });
        showToast(' Paylaşıldı');
      } catch (err) {
        console.log('Share error or cancelled:', err);
      }
    } else {
      handleCopyText(verses);
    }
  };

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

  // Sync activeAyah page without opening verse option popovers when playing audio
  useEffect(() => {
    if (activeAyah) {
      // Turn page if audio moves to next page
      if (selectedPage !== activeAyah.page) {
        setSelectedPage(activeAyah.page);
      }
      // ONLY set selectedMushafAyah popover if NOT playing audio
      if (!isPlaying && viewMode === 'mushaf') {
        setSelectedMushafAyah(activeAyah);
      }
    }
  }, [activeAyah, isPlaying]);

  // Trigger prominent page badge notice whenever selectedPage changes (except initial mount)
  const isFirstRenderRef = React.useRef(true);
  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }
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

  // Theme class mappings (Apple Light & Dark Themes)
  const safeTheme = (pageTheme === 'mint' || pageTheme === 'white' || pageTheme === 'dark') ? pageTheme : 'ivory';
  const themeStyles = {
    ivory: {
      appBg: 'bg-[#FAF8F5] dark:bg-stone-950',
      cardBg: 'bg-white dark:bg-stone-900',
      boardBg: 'bg-[#FAF8F5] dark:bg-stone-900',
      boardBorder: 'border-[#D4AF37]/25 dark:border-amber-500/30',
      textMain: 'text-stone-900 dark:text-stone-100',
      textMuted: 'text-stone-500 dark:text-stone-400',
      arabicText: 'text-stone-900 dark:text-amber-100',
      verseSeal: 'bg-amber-50/70 text-amber-900 border-amber-600/40 dark:bg-stone-800 dark:text-amber-300 dark:border-amber-500/40',
      activeHighlight: 'bg-amber-100/95 text-stone-950 font-medium ring-2 ring-[#D4AF37]/50 dark:bg-amber-950/80 dark:text-amber-100 dark:ring-amber-500/60',
      hoverHighlight: 'hover:bg-amber-500/10 text-stone-900 dark:hover:bg-stone-800/80 dark:text-amber-100',
      accentColor: 'text-[#9E7A28] dark:text-amber-400',
      cardBorder: 'border-stone-200/80 dark:border-stone-800',
      subCardBg: 'bg-stone-50 dark:bg-stone-850',
    },
    mint: {
      appBg: 'bg-[#F2F7F4] dark:bg-stone-950',
      cardBg: 'bg-[#FAFCFA] dark:bg-stone-900',
      boardBg: 'bg-[#F2F7F4] dark:bg-stone-900',
      boardBorder: 'border-emerald-600/25 dark:border-emerald-500/30',
      textMain: 'text-[#112E1A] dark:text-emerald-100',
      textMuted: 'text-emerald-800/75 dark:text-emerald-300/75',
      arabicText: 'text-[#112E1A] dark:text-emerald-100',
      verseSeal: 'bg-emerald-50 text-emerald-900 border-emerald-600/35 dark:bg-stone-800 dark:text-emerald-300 dark:border-emerald-500/40',
      activeHighlight: 'bg-emerald-100/95 text-[#112E1A] ring-2 ring-emerald-500/50 dark:bg-emerald-950/80 dark:text-emerald-100',
      hoverHighlight: 'hover:bg-emerald-500/10 text-[#112E1A] dark:hover:bg-stone-800/80 dark:text-emerald-100',
      accentColor: 'text-emerald-700 dark:text-emerald-400',
      cardBorder: 'border-emerald-200/60 dark:border-stone-800',
      subCardBg: 'bg-emerald-50/50 dark:bg-stone-850',
    },
    white: {
      appBg: 'bg-[#FFFFFF] dark:bg-stone-950',
      cardBg: 'bg-white dark:bg-stone-900',
      boardBg: 'bg-[#FFFFFF] dark:bg-stone-900',
      boardBorder: 'border-stone-200 dark:border-stone-800',
      textMain: 'text-stone-900 dark:text-stone-100',
      textMuted: 'text-stone-500 dark:text-stone-400',
      arabicText: 'text-black dark:text-stone-100',
      verseSeal: 'bg-stone-50 text-stone-900 border-stone-300 dark:bg-stone-800 dark:text-stone-200 dark:border-stone-700',
      activeHighlight: 'bg-amber-50 text-stone-950 ring-2 ring-amber-500/30 dark:bg-stone-800 dark:text-stone-100',
      hoverHighlight: 'hover:bg-stone-100 text-black dark:hover:bg-stone-800 dark:text-white',
      accentColor: 'text-amber-800 dark:text-amber-400',
      cardBorder: 'border-stone-200 dark:border-stone-800',
      subCardBg: 'bg-stone-50 dark:bg-stone-850',
    },
    dark: {
      appBg: 'bg-stone-950',
      cardBg: 'bg-stone-900',
      boardBg: 'bg-stone-900',
      boardBorder: 'border-amber-500/30',
      textMain: 'text-stone-100',
      textMuted: 'text-stone-400',
      arabicText: 'text-amber-100',
      verseSeal: 'bg-stone-800 text-amber-300 border-amber-500/40',
      activeHighlight: 'bg-amber-950/90 text-amber-100 ring-2 ring-amber-500/60',
      hoverHighlight: 'hover:bg-stone-800/80 text-amber-100',
      accentColor: 'text-amber-400',
      cardBorder: 'border-stone-800',
      subCardBg: 'bg-stone-900/90',
    },
  }[safeTheme];

  const renderPageNavigationControl = () => {
    const firstVerseInPage = pageVerses[0];
    const lastVerseInPage = pageVerses[pageVerses.length - 1];

    return (
      <div id="tour-surah-selector" className={`relative z-20 border rounded-2xl p-2 sm:p-3 shadow-xs transition-all duration-300 w-full max-w-full overflow-visible ${themeStyles.cardBg} ${themeStyles.cardBorder} ${
        isFullScreen && !areOverlaysVisible
          ? 'opacity-0 -translate-y-6 pointer-events-none h-0 overflow-hidden mb-0'
          : 'opacity-100 translate-y-0 mb-3'
      }`}>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 w-full max-w-full">
          {/* Top Row on Mobile / Main Nav Controls */}
          <div className="flex items-center justify-between w-full sm:w-auto gap-1.5 sm:gap-2">
            {/* Önceki Sayfa */}
            <button
              disabled={!hasPrevPage}
              onClick={handlePrevPage}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100 font-bold text-xs flex items-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 shrink-0 cursor-pointer"
              title="Önceki Sayfa"
            >
              <ChevronLeft className="w-4 h-4 text-amber-600" />
              <span className="hidden xs:inline">Önceki</span>
            </button>

            {/* Page Dropdown Button */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsPageMenuOpen(!isPageMenuOpen);
                  if (isFilterMenuOpen) setIsFilterMenuOpen(false);
                }}
                className="px-2.5 sm:px-3.5 py-1.5 rounded-xl border border-amber-300/80 bg-amber-50/80 hover:bg-amber-100 text-amber-950 text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
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
                  <div className="fixed sm:absolute top-20 sm:top-full left-1/2 -translate-x-1/2 mt-2 z-50 p-3 rounded-2xl border border-stone-200 bg-white/95 text-stone-900 shadow-2xl w-72 sm:w-80 max-w-[calc(100vw-24px)] backdrop-blur-xl animate-fade-in">
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
                          className={`py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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
            </div>

            {/* Sonraki Sayfa */}
            <button
              disabled={!hasNextPage}
              onClick={handleNextPage}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100 font-bold text-xs flex items-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 shrink-0 cursor-pointer"
              title="Sonraki Sayfa"
            >
              <span className="hidden xs:inline">Sonraki</span>
              <ChevronRight className="w-4 h-4 text-amber-600" />
            </button>
          </div>

          {/* Action Bar Tools (Compact row on mobile, inline on desktop) */}
          <div className="flex items-center justify-between sm:justify-end gap-1 sm:gap-1.5 w-full sm:w-auto overflow-x-auto scrollbar-none pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-200/60">
            {/* Arama İkon Butonu */}
            <button
              onClick={() => {
                setIsSearchModalOpen(true);
                if (isFilterMenuOpen) setIsFilterMenuOpen(false);
                if (isPageMenuOpen) setIsPageMenuOpen(false);
              }}
              className="p-1.5 px-2 sm:px-2.5 rounded-xl border border-stone-200 bg-stone-100/90 hover:bg-amber-50 text-stone-800 text-xs font-bold flex items-center gap-1 transition-all active:scale-95 cursor-pointer shrink-0"
              title="Kur'an-ı Kerim'de Ara"
            >
              <Search className="w-4 h-4 text-amber-700" />
              <span className="text-xs font-semibold">Ara</span>
            </button>

            {/* Quick Font Size Controls */}
            <div className="flex items-center bg-stone-100/90 rounded-xl p-0.5 border border-stone-200 shrink-0">
              <button
                onClick={() => setFontSize(Math.max(18, fontSize - 2))}
                className="p-1 px-1.5 hover:bg-white rounded-lg text-[10px] font-extrabold text-stone-700 transition-all cursor-pointer"
                title="Yazı Boyutunu Küçült"
              >
                A-
              </button>
              <span className="text-[10px] font-bold text-stone-400 px-0.5">|</span>
              <button
                onClick={() => setFontSize(Math.min(48, fontSize + 2))}
                className="p-1 px-1.5 hover:bg-white rounded-lg text-xs font-extrabold text-stone-900 transition-all cursor-pointer"
                title="Yazı Boyutunu Büyüt"
              >
                A+
              </button>
            </div>

            {/* Audio Recitation Dinle Button */}
            <button
              id="tour-audio-controls"
              onClick={() => {
                const firstAyahInPage = pageVerses[0] || selectedSurah?.verses[0];
                if (firstAyahInPage) {
                  onPlayAyah(firstAyahInPage);
                }
              }}
              className={`p-1.5 px-2 sm:px-2.5 rounded-xl border text-xs font-bold flex items-center gap-1 transition-all active:scale-95 cursor-pointer shrink-0 ${
                isPlaying
                  ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                  : 'bg-stone-100/90 hover:bg-emerald-50 text-stone-800 border-stone-200'
              }`}
              title="Sayfadaki Ayetleri Dinle"
            >
              <Volume2 className={`w-3.5 h-3.5 ${isPlaying ? 'text-white animate-pulse' : 'text-emerald-700'}`} />
              <span className="text-xs font-semibold">{isPlaying ? 'Durdur' : 'Dinle'}</span>
            </button>

            {/* Çoklu Seç Butonu */}
            <button
              onClick={() => {
                if (isMultiSelectMode) {
                  exitMultiSelectMode();
                } else {
                  setIsMultiSelectMode(true);
                  showToast('Çoklu Ayet Seçim Modu Açıldı. Ayetlere dokunarak seçebilirsiniz.');
                }
              }}
              className={`p-1.5 px-2 sm:px-2.5 rounded-xl border text-xs font-bold flex items-center gap-1 transition-all active:scale-95 cursor-pointer shrink-0 ${
                isMultiSelectMode || selectedVerseNumbers.length > 0
                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                  : 'bg-stone-100/90 hover:bg-amber-50 text-stone-800 border-stone-200'
              }`}
              title="Çoklu Ayet Seçimi"
            >
              <CheckSquare className={`w-3.5 h-3.5 ${isMultiSelectMode || selectedVerseNumbers.length > 0 ? 'text-white' : 'text-amber-700'}`} />
              <span className="text-xs font-semibold">
                {isMultiSelectMode ? 'Açık' : 'Seç'}
              </span>
            </button>

            {/* Filtre / Okuma Ayarları İkon Butonu */}
            <div className="relative shrink-0">
              <button
                onClick={() => {
                  setIsFilterMenuOpen(!isFilterMenuOpen);
                  if (isPageMenuOpen) setIsPageMenuOpen(false);
                }}
                className={`p-1.5 px-2 sm:px-2.5 rounded-xl border text-xs font-bold flex items-center gap-1 transition-all active:scale-95 cursor-pointer ${
                  isFilterMenuOpen
                    ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                    : 'bg-stone-100/90 hover:bg-amber-50 text-stone-800 border-stone-200'
                }`}
                title="Filtreler & Okuma Ayarları (Sûre, Görünüm, Yazı Boyutu)"
              >
                <SlidersHorizontal className={`w-3.5 h-3.5 ${isFilterMenuOpen ? 'text-white' : 'text-amber-700'}`} />
                <span className="text-xs font-semibold">Ayarlar</span>
              </button>

              {/* Filter / Settings Popover */}
              {isFilterMenuOpen && (
                <>
                  <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs" onClick={() => setIsFilterMenuOpen(false)} />
                  <div className="fixed sm:absolute top-16 sm:top-full left-1/2 sm:left-auto right-auto sm:right-0 -translate-x-1/2 sm:translate-x-0 mt-2 z-50 p-4 sm:p-5 rounded-3xl border border-stone-200 bg-white/98 text-stone-900 shadow-2xl w-[92vw] sm:w-80 max-w-sm backdrop-blur-2xl animate-fade-in space-y-4 max-h-[85vh] overflow-y-auto">
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
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 bg-stone-100 p-1 rounded-xl text-xs font-bold">
                        <button
                          onClick={() => {
                            setViewMode('mushaf');
                            setShowTranslation(false);
                          }}
                          className={`py-1.5 px-1 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                            viewMode === 'mushaf' && !showTranslation ? 'bg-amber-800 text-white shadow-xs font-extrabold' : 'text-stone-600 hover:text-stone-900'
                          }`}
                        >
                          <BookOpen className="w-3 h-3 text-amber-500" />
                          <span>Arapça</span>
                        </button>

                        <button
                          onClick={() => {
                            setViewMode('mushaf');
                            setShowTranslation(true);
                          }}
                          className={`py-1.5 px-1 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                            viewMode === 'mushaf' && showTranslation ? 'bg-amber-800 text-white shadow-xs font-extrabold' : 'text-stone-600 hover:text-stone-900'
                          }`}
                        >
                          <BookOpen className="w-3 h-3 text-amber-500" />
                          <span>Arapça + Meal</span>
                        </button>

                        <button
                          onClick={() => setViewMode('meal')}
                          className={`py-1.5 px-1 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                            viewMode === 'meal' ? 'bg-amber-800 text-white shadow-xs font-extrabold' : 'text-stone-600 hover:text-stone-900'
                          }`}
                        >
                          <FileText className="w-3 h-3 text-amber-500" />
                          <span>Meal</span>
                        </button>

                        <button
                          onClick={() => setViewMode('detailed')}
                          className={`py-1.5 px-1 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                            viewMode === 'detailed' ? 'bg-amber-800 text-white shadow-xs font-extrabold' : 'text-stone-600 hover:text-stone-900'
                          }`}
                        >
                          <List className="w-3 h-3 text-amber-500" />
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

                    {/* Meal Müellifi / Seçeneği */}
                    <div className="space-y-1 pt-2 border-t border-stone-100">
                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block flex items-center gap-1">
                        <BookOpen className="w-3 h-3 text-amber-600" />
                        <span>Meal Müellifi / Seçeneği</span>
                      </label>
                      <select
                        value={selectedMealSource}
                        onChange={(e) => {
                          setSelectedMealSource(e.target.value);
                          localStorage.setItem('kuran_app_meal_source', e.target.value);
                          showToast('Meal müellifi güncellendi');
                        }}
                        className="w-full bg-stone-50 border border-stone-200 text-stone-900 text-xs font-bold rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                      >
                        {MEAL_SOURCES.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.author})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Tefsir Çeşidi / Kaynağı */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block flex items-center gap-1">
                        <FileText className="w-3 h-3 text-amber-600" />
                        <span>Tefsir Çeşidi / Kaynağı</span>
                      </label>
                      <select
                        value={selectedTafsirSource}
                        onChange={(e) => {
                          setSelectedTafsirSource(e.target.value);
                          localStorage.setItem('kuran_app_tafsir_source', e.target.value);
                          showToast('Tefsir kaynağı güncellendi');
                        }}
                        className="w-full bg-stone-50 border border-stone-200 text-stone-900 text-xs font-bold rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                      >
                        {TAFSIR_SOURCES.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} ({t.author})
                          </option>
                        ))}
                      </select>
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
        </div>
      </div>
    );
  };

  return (
    <div className={`mx-auto animate-fade-in w-full max-w-full overflow-x-hidden transition-all duration-300 ${themeStyles.textMain} ${
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
          <div className="bg-white text-stone-900 border border-stone-200 shadow-2xl rounded-3xl max-w-xl w-full p-5 sm:p-6 space-y-4 relative overflow-hidden backdrop-blur-2xl max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-stone-200/80 pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-900 border border-emerald-200 flex items-center justify-center font-bold">
                  <Search className="w-5 h-5 text-emerald-800" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-stone-900">Arama Yap</h3>
                  <p className="text-xs text-stone-500">Sure ismi, ayet numarası (Örn: Bakara 255) veya kelime arayın</p>
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
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 flex items-center justify-center transition-colors cursor-pointer"
                title="Kapat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Main Search Input & Voice Mic Bar */}
            <div className="space-y-2 shrink-0">
              <div className="relative flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Bakara 255, Yasin, Ayetel Kursi veya kelime..."
                    className="w-full pl-10 pr-9 py-2.5 text-xs font-semibold rounded-2xl bg-stone-100 border border-stone-200 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/40"
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1 rounded-full cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

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
                  { label: "Haşr", query: "Haşr 21" },
                  { label: "Nazar Ayeti", query: "Nazar Ayeti" },
                ].map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => setSearchQuery(chip.query)}
                    className="px-2.5 py-1 rounded-xl bg-stone-100 hover:bg-emerald-50 text-stone-700 hover:text-emerald-950 font-medium border border-stone-200/80 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Results Content Area */}
            <div className="overflow-y-auto flex-1 space-y-3 pr-1 scrollbar-thin">
              {/* Smart Match Card */}
              {searchResults?.smartMatch && (
                <div className="p-3.5 bg-emerald-50/90 border border-emerald-200 rounded-2xl space-y-2 animate-fade-in shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-700" />
                      Ayet / Sûre Eşleşmesi
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-700 text-white">
                      Bulundu
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-emerald-950">{searchResults.smartMatch.title}</div>
                    <div className="text-xs text-emerald-800 font-medium mt-0.5">{searchResults.smartMatch.description}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (searchResults?.smartMatch) {
                        navigateToSmartMatch(searchResults.smartMatch);
                      }
                    }}
                    className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition-all shadow-xs active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Sayfaya Git</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Kur'an Genelinde Ayet Numarası Eşleşmeleri */}
              {searchResults?.matchedAllQuranVersesByNumber && searchResults.matchedAllQuranVersesByNumber.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Search className="w-3 h-3 text-emerald-700" />
                      Tüm Sûrelerdeki {searchQuery.replace(/\D/g, '')}. Ayetler ({searchResults.matchedAllQuranVersesByNumber.length})
                    </span>
                    <span className="text-[9px] bg-emerald-100 px-1.5 py-0.5 rounded text-emerald-900 font-bold">Ayet No</span>
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
                        className="w-full p-3 rounded-2xl bg-stone-50 hover:bg-emerald-50/80 border border-stone-200/80 text-left transition-all flex items-center justify-between group active:scale-98 cursor-pointer"
                      >
                        <div className="space-y-0.5 flex-1 pr-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-lg bg-emerald-700 text-white font-bold text-[11px]">
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
                        <ArrowRight className="w-4 h-4 text-emerald-700 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Matched Surahs */}
              {searchResults && searchResults.matchedSurahs.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1">
                    <BookOpen className="w-3 h-3 text-emerald-700" />
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
                        className="p-3 rounded-2xl bg-stone-50 hover:bg-emerald-50 border border-stone-200/80 text-left flex items-center justify-between transition-all active:scale-98 cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-900 font-bold text-xs flex items-center justify-center">
                            {s.id}
                          </span>
                          <div>
                            <div className="text-xs font-bold text-stone-900">
                              {s.nameTurkish.replace(' Sûresi', '')} Sûresi
                            </div>
                            <div className="text-[10px] text-stone-500">{s.versesCount} Ayet</div>
                          </div>
                        </div>
                        <span className="font-serif text-sm text-emerald-900 font-bold">{s.nameArabic}</span>
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
                    <div className="text-[10px] text-stone-500">Sayfa Numarası</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPage(searchResults.pageMatch!);
                      setIsSearchModalOpen(false);
                      showToast(`📄 Sayfa ${searchResults.pageMatch} Açıldı`);
                    }}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition-all shadow-2xs cursor-pointer"
                  >
                    Sayfaya Git
                  </button>
                </div>
              )}

              {/* Matched Verses in Current Surah */}
              {searchResults && searchResults.matchedVersesInSurah.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1">
                    <List className="w-3 h-3 text-emerald-700" />
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
                        className="w-full p-3 rounded-2xl bg-stone-50 hover:bg-emerald-50 border border-stone-200/80 text-left transition-all group cursor-pointer"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-emerald-900">
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

              {/* Default Empty State */}
              {(!searchResults || (searchResults.matchedSurahs.length === 0 && !searchResults.pageMatch && searchResults.matchedVersesInSurah.length === 0)) && (
                <div className="text-center py-8 space-y-3">
                  <p className="text-xs text-stone-500 font-medium">
                    {searchQuery.trim()
                      ? `"${searchQuery}" araması için sonuç bulunamadı.`
                      : 'Aradığınız sure, ayet numarası (Örn: Bakara 255) veya kelimeyi yazın.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI SESLİ AYET ARAMA MODALI */}
      {isVoiceSearching && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white text-stone-900 border border-emerald-200/90 shadow-2xl rounded-3xl max-w-lg w-full p-6 space-y-5 text-center backdrop-blur-2xl relative overflow-hidden">
            {/* Ambient Emerald Glow */}
            <div className="absolute -top-12 -left-12 w-32 h-32 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />

            <div className="flex justify-between items-center pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-700" />
                <span className="font-bold text-sm text-stone-900">Tarteel AI (Hugging Face) Sesli Arama</span>
              </div>
              <button
                type="button"
                onClick={cancelAiVoiceSearch}
                className="p-1 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {voiceSearchStatus === 'listening' ? (
              <div className="space-y-4 py-2">
                {/* Language Selection Switcher Pills */}
                <div className="flex items-center justify-center gap-1.5 p-1 bg-stone-100 rounded-2xl w-max mx-auto border border-stone-200">
                  <button
                    type="button"
                    onClick={() => setVoiceSearchLang('ar-SA')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      voiceSearchLang === 'ar-SA'
                        ? 'bg-emerald-800 text-white shadow-2xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <span>🇸🇦 Arapça Tilavet (Tarteel AI)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setVoiceSearchLang('tr-TR')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      voiceSearchLang === 'tr-TR'
                        ? 'bg-emerald-800 text-white shadow-2xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <span>🇹🇷 Türkçe Arama</span>
                  </button>
                </div>

                {/* Animated Pulsing Mic Circle */}
                <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping" />
                  <div className="w-16 h-16 bg-gradient-to-tr from-emerald-700 to-emerald-900 text-white rounded-full flex items-center justify-center shadow-lg relative z-10">
                    <Mic className="w-8 h-8 text-emerald-100 animate-pulse" />
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="font-bold text-base text-stone-900">Tilavetiniz Dinleniyor...</h3>
                  <p className="text-xs text-stone-500 max-w-xs mx-auto">
                    Hugging Face <b>tarteel-ai/whisper-base-ar-quran</b> modeli için Arapça ayet tilaveti veya sure adı okuyun.
                  </p>
                </div>

                {/* Live Transcript Display Box */}
                <div className="bg-stone-50 rounded-2xl p-3.5 border border-emerald-200/80 min-h-[60px] flex items-center justify-center">
                  {voiceTranscript ? (
                    <p className="text-xs font-bold text-emerald-950 italic">"{voiceTranscript}"</p>
                  ) : (
                    <p className="text-xs text-stone-400 italic">Sesiniz kaydediliyor...</p>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={cancelAiVoiceSearch}
                    className="flex-1 py-2.5 rounded-xl border border-stone-200 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs transition-all cursor-pointer"
                  >
                    Vazgeç
                  </button>

                  <button
                    type="button"
                    onClick={stopAiVoiceSearch}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-emerald-200" />
                    <span>Durdur ve Tarteel AI ile Bul</span>
                  </button>
                </div>
              </div>
            ) : voiceSearchStatus === 'analyzing' ? (
              <div className="py-8 space-y-4">
                <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-700 rounded-full animate-spin mx-auto" />
                <div className="space-y-1">
                  <h3 className="font-bold text-base text-stone-900">Hugging Face Tarteel AI Analiz Ediyor...</h3>
                  <p className="text-xs text-stone-500 max-w-xs mx-auto">
                    <b>tarteel-ai/whisper-base-ar-quran</b> modeli ile ses kaydınız çözümleniyor.
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
                placeholder="Sure adı veya numarası ara (Mülk, Yasin, 67)..."
                className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold rounded-2xl bg-stone-100 border border-stone-200 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/40"
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
                  className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all active:scale-98 cursor-pointer ${
                    selectedSurah.id === s.id
                      ? 'bg-emerald-700 text-white border-emerald-800 shadow-md font-bold'
                      : 'bg-stone-50 hover:bg-emerald-50 border-stone-200/80 text-stone-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black ${
                      selectedSurah.id === s.id ? 'bg-emerald-900 text-white' : 'bg-stone-200/80 text-stone-700'
                    }`}>
                      {s.id}
                    </span>
                    <div>
                      <div className="text-xs font-bold leading-tight">
                        {s.nameTurkish.replace(' Sûresi', '')} Sûresi
                      </div>
                      <div className={`text-[10px] ${selectedSurah.id === s.id ? 'text-emerald-100' : 'text-stone-500'}`}>
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

                {/* Arabic Flowing Text or Stacked Arabic + Translation Cards */}
                {showTranslation ? (
                  <div className="space-y-3.5 text-right dir-rtl">
                    {pageVerses.map((verse) => {
                      const isSelected = selectedMushafAyah?.number === verse.number;
                      const isMultiSelected = selectedVerseNumbers.includes(verse.number);
                      const isPlayingCurrently = activeAyah?.number === verse.number && isPlaying;
                      const isBookmarked = bookmarkedVerses.includes(verse.number);
                      const isSajdah = checkIsSajdahVerse(selectedSurah.id, verse.number);

                      return (
                        <div
                          key={verse.number}
                          id={`verse-${verse.number}`}
                          onClick={() => {
                            if (isMultiSelectMode) {
                              toggleVerseSelection(verse.number);
                            } else {
                              setSelectedMushafAyah(verse);
                            }
                          }}
                          className={`cursor-pointer transition-all duration-200 p-4 rounded-2xl border text-right interactive-ayah ${
                            isMultiSelected
                              ? 'bg-amber-400/30 dark:bg-amber-600/40 border-amber-500 ring-2 ring-amber-600 shadow-md'
                              : isSelected
                              ? 'bg-amber-100/90 border-amber-400 dark:bg-amber-900/50 shadow-sm'
                              : isPlayingCurrently
                              ? 'bg-emerald-50 border-emerald-400'
                              : 'bg-stone-50/80 dark:bg-stone-800/50 border-stone-200/80 hover:bg-amber-50/50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3 pb-2.5 border-b border-stone-200/60">
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[11px] font-mono font-bold ${
                                isMultiSelected ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-900 border border-amber-300'
                              }`}>
                                {isSajdah && <span className="mr-0.5 font-serif text-xs">۩</span>}
                                Ayet {verse.number}
                              </span>
                              {isBookmarked && (
                                <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded-md font-bold">
                                  🔖 Kaydedildi
                                </span>
                              )}
                            </div>

                            <span className={`font-serif leading-loose ${fontSizeClass} text-stone-900 dark:text-amber-100`}>
                              {verse.arabic}
                            </span>
                          </div>

                          <div className="pt-2.5 text-left dir-ltr text-xs sm:text-sm text-stone-800 dark:text-stone-200 font-sans leading-relaxed">
                            <span className="font-bold text-amber-900 dark:text-amber-300 mr-1.5">({verse.number})</span>
                            {verse.translation}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className={`text-right dir-rtl leading-loose text-justify tracking-wide select-none transition-colors ${themeStyles.arabicText}`}>
                    {pageVerses.map((verse) => {
                      const isSelected = selectedMushafAyah?.number === verse.number;
                      const isMultiSelected = selectedVerseNumbers.includes(verse.number);
                      const isPlayingCurrently = activeAyah?.number === verse.number && isPlaying;
                      const isTarteelMatched = isTarteelTracking && (selectedMushafAyah?.number === verse.number || tarteelLastMatch?.verseNumber === verse.number);
                      const isBookmarked = bookmarkedVerses.includes(verse.number);
                      const isSajdah = checkIsSajdahVerse(selectedSurah.id, verse.number);

                      return (
                        <span
                          key={verse.number}
                          id={`verse-${verse.number}`}
                          onClick={() => {
                            if (isMultiSelectMode) {
                              toggleVerseSelection(verse.number);
                            } else {
                              setSelectedMushafAyah(verse);
                            }
                          }}
                          className={`cursor-pointer inline transition-all duration-200 px-1 py-1 rounded-lg interactive-ayah ${
                            isMultiSelected
                              ? 'bg-amber-400/50 dark:bg-amber-600/60 text-stone-950 dark:text-amber-100 shadow-md ring-2 ring-amber-600 rounded-xl px-1.5 py-1 font-extrabold'
                              : isTarteelMatched
                              ? 'bg-emerald-400/40 dark:bg-emerald-600/50 text-stone-950 dark:text-emerald-100 shadow-xl ring-2 ring-emerald-500 ring-offset-2 ring-offset-stone-50 dark:ring-offset-stone-900 rounded-xl px-1.5 py-1 border border-emerald-500/70 font-extrabold animate-pulse'
                              : isSelected
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
                            isMultiSelected
                              ? 'bg-amber-600 text-white border-amber-700 shadow-sm'
                              : isSajdah ? 'bg-amber-700 text-white border-amber-800 shadow-sm ring-2 ring-amber-400' : themeStyles.verseSeal
                          }`}>
                            {isSajdah && <span className="mr-0.5 font-serif text-xs font-black">۩</span>}
                            {verse.number}
                          </span>
                        </span>
                      );
                    })}
                  </div>
                )}

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
                        id={`verse-${verse.number}`}
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
          {renderPageNavigationControl()}
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
              const isSelected = selectedMushafAyah?.number === verse.number;
              const isCurrentActive = activeAyah?.number === verse.number;
              const isTarteelMatched = isTarteelTracking && (selectedMushafAyah?.number === verse.number || activeAyah?.number === verse.number);
              const isBookmarked = bookmarkedVerses.includes(verse.number);
              const isSajdah = checkIsSajdahVerse(selectedSurah.id, verse.number);

              return (
                <div
                  key={verse.number}
                  id={`ayah-${verse.number}`}
                  onClick={() => setSelectedMushafAyah(verse)}
                  className={`relative rounded-3xl p-5 transition-all duration-200 border interactive-ayah cursor-pointer ${
                    isTarteelMatched
                      ? 'bg-emerald-50/95 dark:bg-emerald-950/40 border-2 border-emerald-500 shadow-xl ring-2 ring-emerald-500/80 scale-[1.01]'
                      : isSelected
                      ? 'bg-amber-100/95 border-2 border-amber-500 shadow-lg ring-2 ring-amber-400/80 scale-[1.01]'
                      : isCurrentActive
                      ? 'bg-amber-50/80 border-amber-400 shadow-md ring-1 ring-amber-400/30'
                      : isSajdah
                      ? 'bg-amber-50/40 border-amber-300 shadow-sm'
                      : 'bg-white border-stone-200 hover:border-amber-300 shadow-sm'
                  }`}
                >
                  {/* Tarteel Active Recitation Badge */}
                  {isTarteelMatched && (
                    <div className="mb-3 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-700 text-white text-xs font-bold rounded-full shadow-xs animate-pulse">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                      <span>Tarteel Canlı Okuma Burayı Takip Ediyor</span>
                    </div>
                  )}
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
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isMultiSelectMode) setIsMultiSelectMode(true);
                          toggleVerseSelection(verse.number);
                        }}
                        className={`p-1 px-2 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                          selectedVerseNumbers.includes(verse.number)
                            ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                            : 'bg-stone-50 text-stone-700 border-stone-200 hover:border-amber-400'
                        }`}
                        title="Ayet Seç"
                      >
                        {selectedVerseNumbers.includes(verse.number) ? (
                          <CheckSquare className="w-3.5 h-3.5" />
                        ) : (
                          <Square className="w-3.5 h-3.5 text-stone-400" />
                        )}
                        <span>{verse.number}</span>
                      </button>

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
                      id="tour-audio-controls"
                      onClick={() => onPlayAyah(verse)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        isCurrentActive && isPlaying
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'bg-stone-50 text-stone-700 hover:bg-stone-100 border border-stone-200'
                      }`}
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>{isCurrentActive && isPlaying ? 'Durdur' : 'Dinle'}</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setActiveTafsirAyah(verse)}
                        className="px-2.5 py-1.5 rounded-xl bg-amber-100/90 text-amber-950 hover:bg-amber-200 border border-amber-300 transition-colors flex items-center gap-1 font-bold text-xs cursor-pointer shadow-2xs"
                        title="Ayet Tefsirine Bak"
                      >
                        <FileText className="w-3.5 h-3.5 text-amber-800" />
                        <span>Tefsire Bak</span>
                      </button>

                      <button
                        onClick={() =>
                          onOpenAiTajweedExplain(selectedSurah.nameTurkish, verse.number, verse.arabic)
                        }
                        className="p-2 rounded-xl bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-200/80 transition-colors cursor-pointer"
                        title="AI Tecvit Tahlili"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                      </button>

                      <button
                        onClick={onOpenVoiceRecorder}
                        className="p-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-100 transition-colors cursor-pointer"
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
                        className="p-2 rounded-xl bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-200/80 transition-colors flex items-center gap-1 font-semibold text-xs cursor-pointer"
                        title="Ayet Notu Ekle"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Not Al</span>
                      </button>

                      <button
                        onClick={() => setShareModalVerses([verse])}
                        className="p-2 px-2.5 rounded-xl bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200/80 transition-colors flex items-center gap-1 font-semibold text-xs cursor-pointer"
                        title="Ayeti Paylaş veya Kopyala"
                      >
                        <Share2 className="w-3.5 h-3.5 text-amber-700" />
                        <span className="hidden sm:inline">Paylaş</span>
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
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 text-xs italic text-stone-700 leading-relaxed max-h-36 overflow-y-auto space-y-1">
              <div className="text-[10px] font-bold text-amber-800 not-italic uppercase tracking-wider">
                {MEAL_SOURCES.find((m) => m.id === selectedMealSource)?.name || 'Türkçe Meali'}
              </div>
              <div>"{getAuthorMealText(selectedMushafAyah.arabic, selectedMushafAyah.translation, selectedMealSource)}"</div>
              <div className="text-[10px] font-mono not-italic text-amber-800 pt-1 border-t border-stone-200">
                Okunuşu: {selectedMushafAyah.transliteration}
              </div>
            </div>
          )}

          {/* Quick Actions Row inside Tooltip */}
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 pt-1">
            <button
              onClick={() => onPlayAyah(selectedMushafAyah)}
              className={`py-2 px-1 rounded-2xl text-[10px] font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                activeAyah?.number === selectedMushafAyah.number && isPlaying
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-stone-100 text-stone-800 hover:bg-amber-100 hover:text-amber-900 border border-stone-200'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5 text-amber-700" />
              <span className="truncate">{activeAyah?.number === selectedMushafAyah.number && isPlaying ? 'Durdur' : 'Dinle'}</span>
            </button>

            <button
              onClick={() => setShowTooltipTranslation(!showTooltipTranslation)}
              className={`py-2 px-1 rounded-2xl text-[10px] font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                showTooltipTranslation
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-stone-100 text-stone-800 hover:bg-amber-100 hover:text-amber-900 border border-stone-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-700" />
              <span className="truncate">{showTooltipTranslation ? 'Gizle' : 'Meali Gör'}</span>
            </button>

            <button
              onClick={() => setActiveTafsirAyah(selectedMushafAyah)}
              className="py-2 px-1 rounded-2xl text-[10px] font-bold bg-amber-700 hover:bg-amber-800 text-white border border-amber-700 flex flex-col items-center justify-center gap-1 transition-all shadow-2xs cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-amber-200" />
              <span className="truncate">Tefsire Bak</span>
            </button>

            <button
              onClick={() => setShareModalVerses([selectedMushafAyah])}
              className="py-2 px-1 rounded-2xl text-[10px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-amber-700" />
              <span className="truncate">Paylaş</span>
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
              className="py-2 px-1 rounded-2xl text-[10px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-700" />
              <span className="truncate">Not Al</span>
            </button>

            <button
              onClick={() => toggleBookmark(selectedMushafAyah.number)}
              className={`py-2 px-1 rounded-2xl text-[10px] font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                bookmarkedVerses.includes(selectedMushafAyah.number)
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-stone-100 text-stone-800 hover:bg-amber-100 hover:text-amber-900 border border-stone-200'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${bookmarkedVerses.includes(selectedMushafAyah.number) ? 'fill-current text-amber-600' : 'text-amber-700'}`} />
              <span className="truncate">{bookmarkedVerses.includes(selectedMushafAyah.number) ? 'Kaydedildi' : 'Kaydet'}</span>
            </button>

            <button
              onClick={() => onOpenAiTajweedExplain(selectedSurah.nameTurkish, selectedMushafAyah.number, selectedMushafAyah.arabic)}
              className="py-2 px-1 rounded-2xl text-[10px] font-bold bg-emerald-700 text-white hover:bg-emerald-800 border border-emerald-700 flex flex-col items-center justify-center gap-1 transition-all shadow-2xs cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
              <span className="truncate">AI Sor</span>
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
      {/* FLOATING LIVE TARTEEL RECITATION TRACKING HUD BANNER (Disabled until API is set up) */}
      {false && isTarteelTracking && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[999] bg-emerald-950/95 text-white px-4 py-3 rounded-2xl shadow-2xl border border-emerald-500/60 flex items-center gap-3 backdrop-blur-2xl animate-fade-in max-w-md w-[92%] sm:w-auto">
          <div className="relative flex h-3.5 w-3.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
          </div>
          <div className="text-xs space-y-0.5 flex-1 min-w-0">
            <div className="font-bold text-emerald-300 flex items-center gap-1.5 text-xs">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Tarteel Canlı Okuma Takibi Açık</span>
            </div>
            {tarteelLastMatch ? (
              <div className="text-stone-100 font-semibold text-[11px] truncate">
                🎯 {tarteelLastMatch.surahName} {tarteelLastMatch.verseNumber}. Ayet (Takip Ediliyor)
              </div>
            ) : (
              <div className="text-stone-300 text-[11px] truncate">
                Siz Kur'an okudukça okuduğunuz ayet canlı tespit edilecek...
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={stopTarteelLiveTracking}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold rounded-xl shadow-xs transition-all cursor-pointer shrink-0 active:scale-95"
          >
            Durdur
          </button>
        </div>
      )}

      {/* Floating Multi-Select Bottom Action Bar */}
      {(isMultiSelectMode || selectedVerseNumbers.length > 0) && (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-lg bg-stone-900/95 text-white backdrop-blur-2xl p-3.5 rounded-3xl border border-stone-700 shadow-2xl animate-fade-in space-y-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-500 text-stone-950 font-black text-xs flex items-center justify-center">
                {selectedVerseNumbers.length}
              </span>
              <span className="text-xs font-bold text-stone-200">
                Ayet Seçildi
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <button
                onClick={selectAllPageVerses}
                className="px-2.5 py-1 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-300 border border-stone-700 transition-all text-[11px] cursor-pointer"
              >
                {pageVerses.every((v) => selectedVerseNumbers.includes(v.number))
                  ? 'Sayfa Seçimini Kaldır'
                  : 'Tüm Sayfayı Seç'}
              </button>
              <button
                onClick={clearVerseSelection}
                className="px-2 py-1 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 transition-all text-[11px] cursor-pointer"
              >
                Temizle
              </button>
            </div>
          </div>

          {/* Actions Row */}
          <div className="grid grid-cols-5 gap-1 pt-1">
            <button
              disabled={selectedVerseNumbers.length === 0}
              onClick={() => {
                const selectedVerses = selectedSurah.verses.filter((v) => selectedVerseNumbers.includes(v.number));
                setShareModalVerses(selectedVerses);
              }}
              className="py-2.5 px-1 rounded-2xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 shadow-sm transition-all cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Paylaş</span>
            </button>

            <button
              disabled={selectedVerseNumbers.length === 0}
              onClick={() => {
                const selectedVerses = selectedSurah.verses.filter((v) => selectedVerseNumbers.includes(v.number));
                handleCopyText(selectedVerses);
              }}
              className="py-2.5 px-1 rounded-2xl bg-stone-800 hover:bg-stone-700 disabled:opacity-40 text-stone-200 border border-stone-700 text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">Kopyala</span>
            </button>

            <button
              disabled={selectedVerseNumbers.length === 0}
              onClick={() => {
                const sortedNums = [...selectedVerseNumbers].sort((a, b) => a - b);
                const targetVerse = selectedSurah.verses.find((v) => v.number === sortedNums[0]);
                if (targetVerse) {
                  setActiveNoteModalAyah(targetVerse);
                  setNoteTagInput('Önemli');
                  if (sortedNums.length > 1) {
                    setNoteTextInput(`[Seçilen Ayetler: ${selectedSurah.nameTurkish} Sûresi, ${sortedNums.join(', ')}. Ayetler]\n`);
                  } else {
                    setNoteTextInput('');
                  }
                }
              }}
              className="py-2.5 px-1 rounded-2xl bg-amber-700 hover:bg-amber-600 disabled:opacity-40 text-white border border-amber-600 text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-200 shrink-0" />
              <span className="truncate">Not Al</span>
            </button>

            <button
              disabled={selectedVerseNumbers.length === 0}
              onClick={() => {
                selectedVerseNumbers.forEach((vNum) => {
                  if (!bookmarkedVerses.includes(vNum)) {
                    toggleBookmark(vNum);
                  }
                });
                showToast(`🔖 ${selectedVerseNumbers.length} Ayet Kaydedildi! Hoca Notlarım > Kaydedilenler sekmesinden görebilirsiniz.`);
              }}
              className="py-2.5 px-1 rounded-2xl bg-stone-800 hover:bg-stone-700 disabled:opacity-40 text-stone-200 border border-stone-700 text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
            >
              <Bookmark className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">Kaydet</span>
            </button>

            <button
              onClick={exitMultiSelectMode}
              className="py-2.5 px-1 rounded-2xl bg-stone-800 hover:bg-rose-950 text-rose-300 border border-stone-700 text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
            >
              <X className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Kapat</span>
            </button>
          </div>
        </div>
      )}

      {/* Ayet Paylaş Seçenekleri Modalı */}
      {shareModalVerses && shareModalVerses.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
          <div className="bg-white border border-stone-200 rounded-3xl p-5 sm:p-6 w-full max-w-lg shadow-2xl space-y-4 text-slate-900 relative">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-amber-700" />
                  <span>Ayet Paylaş</span>
                </h3>
                <p className="text-xs text-stone-500 font-medium">
                  {shareModalVerses.length === 1
                    ? `${selectedSurah.nameTurkish} Sûresi, ${shareModalVerses[0].number}. Ayet`
                    : `${selectedSurah.nameTurkish} Sûresi (${shareModalVerses.length} Ayet Seçildi)`}
                </p>
              </div>
              <button
                onClick={() => setShareModalVerses(null)}
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Paylaşım İçerik Seçenekleri */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-700 block">Dahil Edilecek İçerikler:</label>
              <div className="grid grid-cols-2 gap-2 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setShareOptions(prev => ({ ...prev, includeArabic: !prev.includeArabic }))}
                  className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all cursor-pointer ${
                    shareOptions.includeArabic
                      ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold'
                      : 'bg-stone-50 border-stone-200 text-stone-600'
                  }`}
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                    shareOptions.includeArabic ? 'bg-amber-600 border-amber-600 text-white' : 'border-stone-400 bg-white'
                  }`}>
                    {shareOptions.includeArabic && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span>Arapça Metin</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShareOptions(prev => ({ ...prev, includeTranslation: !prev.includeTranslation }))}
                  className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all cursor-pointer ${
                    shareOptions.includeTranslation
                      ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold'
                      : 'bg-stone-50 border-stone-200 text-stone-600'
                  }`}
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                    shareOptions.includeTranslation ? 'bg-amber-600 border-amber-600 text-white' : 'border-stone-400 bg-white'
                  }`}>
                    {shareOptions.includeTranslation && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span>Türkçe Meal</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShareOptions(prev => ({ ...prev, includeTransliteration: !prev.includeTransliteration }))}
                  className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all cursor-pointer ${
                    shareOptions.includeTransliteration
                      ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold'
                      : 'bg-stone-50 border-stone-200 text-stone-600'
                  }`}
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                    shareOptions.includeTransliteration ? 'bg-amber-600 border-amber-600 text-white' : 'border-stone-400 bg-white'
                  }`}>
                    {shareOptions.includeTransliteration && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span>Okunuş (Latin)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShareOptions(prev => ({ ...prev, includeMetadata: !prev.includeMetadata }))}
                  className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all cursor-pointer ${
                    shareOptions.includeMetadata
                      ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold'
                      : 'bg-stone-50 border-stone-200 text-stone-600'
                  }`}
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                    shareOptions.includeMetadata ? 'bg-amber-600 border-amber-600 text-white' : 'border-stone-400 bg-white'
                  }`}>
                    {shareOptions.includeMetadata && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span>Sure ve Ayet Adı</span>
                </button>
              </div>
            </div>

            {/* Format Selection Tab */}
            <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-2xl border border-stone-200">
              <button
                type="button"
                onClick={() => setShareFormatMode('whatsapp')}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  shareFormatMode === 'whatsapp'
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-200" />
                <span>WhatsApp Formatı (*Yıldızlı*)</span>
              </button>

              <button
                type="button"
                onClick={() => setShareFormatMode('standard')}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  shareFormatMode === 'standard'
                    ? 'bg-amber-700 text-white shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-amber-200" />
                <span>Düz Metin</span>
              </button>
            </div>

            {/* Önizleme Alanı */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-stone-500 block">Paylaşım Metni Önizlemesi:</label>
                {shareFormatMode === 'whatsapp' && (
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    *Yıldızlar* WhatsApp'ta Kalın Görünür
                  </span>
                )}
              </div>
              <div className="p-3 bg-stone-50 border border-stone-200 rounded-2xl text-xs text-stone-800 font-mono whitespace-pre-wrap max-h-40 overflow-y-auto leading-relaxed select-all dir-auto">
                {(shareFormatMode === 'whatsapp' ? getWhatsAppFormattedText(shareModalVerses) : getFormattedShareText(shareModalVerses)) || (
                  <span className="text-stone-400 italic font-sans">En az bir içerik seçiniz...</span>
                )}
              </div>
            </div>

            {/* Butonlar */}
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-stone-100">
              <button
                onClick={() => handleCopyWhatsAppText(shareModalVerses)}
                className="w-full sm:flex-1 py-2.5 px-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 text-emerald-200" />
                <span>{copySuccessToast && shareFormatMode === 'whatsapp' ? 'Kopyalandı!' : 'WhatsApp İçin Kopyala (*)'}</span>
              </button>

              <button
                onClick={() => handleCopyText(shareModalVerses)}
                className="w-full sm:flex-1 py-2.5 px-3 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs flex items-center justify-center gap-2 transition-all border border-stone-200 active:scale-95 cursor-pointer"
              >
                <Copy className="w-4 h-4 text-amber-700" />
                <span>Düz Metin Kopyala</span>
              </button>

              <button
                onClick={() => handleShareNative(shareModalVerses)}
                className="w-full sm:w-auto py-2.5 px-4 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Paylaş</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tefsir Bak Detay Modalı */}
      {activeTafsirAyah && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-md animate-fade-in">
          <div className="bg-white border border-stone-200 rounded-3xl p-5 sm:p-6 w-full max-w-2xl shadow-2xl space-y-4 text-stone-900 relative max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center font-bold shrink-0">
                  <FileText className="w-5 h-5 text-amber-800" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900 leading-tight flex items-center gap-2">
                    <span>{selectedSurah.nameTurkish} Sûresi, {activeTafsirAyah.number}. Ayet Tefsiri</span>
                  </h3>
                  <p className="text-xs text-stone-500 font-medium">
                    Sayfa {activeTafsirAyah.page} — Kapsamlı Ayet Tahlili & Şerhi
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveTafsirAyah(null)}
                className="p-2 rounded-full hover:bg-stone-100 text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
                title="Kapat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tefsir Source Selector Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-amber-50/80 border border-amber-200/90 rounded-2xl shrink-0">
              <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5 shrink-0">
                <Sparkles className="w-4 h-4 text-amber-700" />
                <span>Tefsir Kaynağı:</span>
              </span>
              <select
                value={selectedTafsirSource}
                onChange={(e) => {
                  setSelectedTafsirSource(e.target.value);
                  localStorage.setItem('kuran_app_tafsir_source', e.target.value);
                }}
                className="px-3 py-1.5 rounded-xl bg-white border border-amber-300 text-amber-950 font-bold text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer shadow-2xs"
              >
                {TAFSIR_SOURCES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.author})
                  </option>
                ))}
              </select>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto flex-1 space-y-4 pr-1.5 scrollbar-thin">
              {/* Arabic snippet */}
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 text-right dir-rtl font-serif text-xl text-stone-900 leading-relaxed">
                {activeTafsirAyah.arabic}
              </div>

              {/* Meal snippet */}
              <div className="p-3.5 bg-amber-50/40 rounded-2xl border border-amber-200/60 space-y-1">
                <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider flex items-center justify-between">
                  <span>Türkçe Meali ({MEAL_SOURCES.find(m => m.id === selectedMealSource)?.name})</span>
                </div>
                <p className="text-xs font-medium text-stone-800 italic leading-relaxed">
                  "{getAuthorMealText(activeTafsirAyah.arabic, activeTafsirAyah.translation, selectedMealSource)}"
                </p>
              </div>

              {(() => {
                const tafsirData = generateTafsirContent(
                  selectedSurah.id,
                  selectedSurah.nameTurkish,
                  activeTafsirAyah.number,
                  activeTafsirAyah.arabic,
                  activeTafsirAyah.translation,
                  selectedTafsirSource
                );

                return (
                  <div className="space-y-3.5">
                    {/* Ayet Özeti / Esbab-ı Nüzul */}
                    <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl space-y-1.5 text-xs text-emerald-950">
                      <div className="font-bold flex items-center gap-1.5 text-emerald-900">
                        <Info className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span>Ayetin Özeti & Nüzul Sebebi</span>
                      </div>
                      <p className="font-semibold text-emerald-900 leading-relaxed">{tafsirData.summary}</p>
                      {tafsirData.revelationContext && (
                        <p className="text-[11px] text-emerald-800 pt-1 border-t border-emerald-200/80 leading-normal">
                          <strong>Nüzul Arka Planı:</strong> {tafsirData.revelationContext}
                        </p>
                      )}
                    </div>

                    {/* Tefsir Paragrafları */}
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-amber-700" />
                        <span>{tafsirData.sourceName} Detaylı İzahı</span>
                      </h4>
                      {tafsirData.commentary.map((paragraph, idx) => (
                        <p key={idx} className="text-xs text-stone-700 font-normal leading-relaxed bg-stone-50 p-3 rounded-2xl border border-stone-100">
                          {paragraph}
                        </p>
                      ))}
                    </div>

                    {/* Hikmetler ve Dersler */}
                    {tafsirData.spiritualLessons && tafsirData.spiritualLessons.length > 0 && (
                      <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2 text-xs">
                        <h4 className="font-bold text-amber-950 flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-amber-700" />
                          <span>Ayetten Çıkarılan Hikmet ve Dersler</span>
                        </h4>
                        <ul className="space-y-1.5 pl-1">
                          {tafsirData.spiritualLessons.map((lesson, lIdx) => (
                            <li key={lIdx} className="flex items-start gap-2 text-stone-800 font-medium">
                              <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                              <span>{lesson}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between gap-2 pt-3 border-t border-stone-200 shrink-0">
              <button
                onClick={() => {
                  if (!user && onRequireAuth) {
                    onRequireAuth('Tefsir ders notu eklemek için lütfen oturum açın.');
                    return;
                  }
                  setActiveNoteModalAyah(activeTafsirAyah);
                  setNoteTagInput('Tefsir Notu');
                  const sourceName = TAFSIR_SOURCES.find((t) => t.id === selectedTafsirSource)?.name || 'Tefsir';
                  setNoteTextInput(`[${sourceName} Tefsir Notu - ${selectedSurah.nameTurkish} ${activeTafsirAyah.number}. Ayet]:\n`);
                }}
                className="px-4 py-2.5 rounded-2xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                <Edit3 className="w-4 h-4 text-amber-200" />
                <span>Tefsir Notu Al</span>
              </button>

              <button
                onClick={() => setActiveTafsirAyah(null)}
                className="px-5 py-2.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs transition-all active:scale-95 cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
