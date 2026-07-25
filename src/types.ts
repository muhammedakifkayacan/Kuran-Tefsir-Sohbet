export type NavTab = 'home' | 'quran' | 'sohbet' | 'notes';

export interface SohbetSession {
  id: string;
  title: string; // e.g. "Mülk Sûresi Tefsiri ve Hayat Ölçüleri"
  venue: string; // e.g. "Fatih Camii Sohbet Meclisi"
  category: 'Tefsir' | 'Hadis' | 'Ahlak & İhlas' | 'Siyer' | 'Akaid';
  date: string;
  audioRecordingUrl?: string;
  audioTranscript?: string; // Transcribed speech text from recorded voice
  durationMinutes?: number;
  teacherNotes: string; // Hoca ders notları
  keyNukteList: string[]; // Önemli nükteler / hikmetli sözler
  aiSummary?: string; // AI generated summary based on audio transcript & notes
  broadcastMessage?: string; // WhatsApp cemaat mesajı
}

export interface Ayah {
  number: number; // Verse number in Surah
  globalNumber?: number;
  arabic: string;
  transliteration: string;
  translation: string;
  audioUrl: string;
  juz: number;
  page: number;
  tajweedMarkup?: {
    text: string;
    rules?: { word: string; rule: 'med' | 'ixfa' | 'izhar' | 'idgam' | 'iqlab' | 'qalqala'; note: string }[];
  };
}

export interface Surah {
  id: number;
  nameArabic: string;
  nameTurkish: string;
  nameEnglish: string;
  versesCount: number;
  revelationType: 'Mekke' | 'Medine';
  juzNumber: number;
  startPage: number;
  verses: Ayah[];
}

export interface VerseNote {
  id: string;
  surahId: number;
  surahName: string;
  verseNumber: number;
  tag: 'Tecvit' | 'Tefsir Notu' | 'Hikmet' | 'Önemli';
  noteText: string;
  createdAt: string;
}

export interface TajweedRule {
  id: string;
  title: string;
  category: string;
  description: string;
  colorClass: string;
  examples: {
    arabic: string;
    transliteration: string;
    explanation: string;
    audioUrl?: string;
  }[];
}

export interface ElifBaLetter {
  id: number;
  name: string;
  arabicSymbol: string;
  isolated: string;
  initial: string;
  medial: string;
  final: string;
  mahrecInfo: string;
  transliteration: string;
  exampleWords: { arabic: string; meaning: string }[];
}

export interface Reciter {
  id: string;
  name: string;
  subtext: string;
  baseUrl: string;
}

export interface RibbonBookmark {
  id: string;
  surahId: number;
  surahName: string;
  pageNumber: number;
  verseNumber?: number;
  verseTextSnippet?: string;
  createdAt: string;
  color?: string;
  note?: string;
}

