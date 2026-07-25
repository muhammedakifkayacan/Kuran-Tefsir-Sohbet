import { Surah, Ayah } from '../types';
import { ALL_SURAHS } from '../data/surahList';
import { QURAN_SURAHS } from '../data/quranData';

const surahCache: Record<number, Surah> = {};

// Warm up with existing static surahs to ensure instant loading of basic ones
QURAN_SURAHS.forEach((s) => {
  surahCache[s.id] = s;
});

export const fetchSurahFromApi = async (id: number): Promise<Surah> => {
  if (surahCache[id] && surahCache[id].verses.length === ALL_SURAHS.find(item => item.id === id)?.versesCount) {
    return surahCache[id];
  }

  // Check localStorage cache first if offline or memory missed
  try {
    const saved = localStorage.getItem(`kuran_offline_surah_${id}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.verses && parsed.verses.length > 0) {
        surahCache[id] = parsed;
        return parsed;
      }
    }
  } catch (e) {}

  const listItem = ALL_SURAHS.find((s) => s.id === id);
  if (!listItem) {
    throw new Error('Sûre bulunamadı');
  }

  try {
    // We combine the standard Uthmani text, the Turkish Diyanet translation, and the Alafasy audio edition
    const response = await fetch(
      `https://api.alquran.cloud/v1/surah/${id}/editions/quran-uthmani,tr.diyanet,ar.alafasy`
    );
    if (!response.ok) {
      throw new Error('API hatası oluştu');
    }

    const json = await response.json();
    if (json.code !== 200 || !json.data || json.data.length < 3) {
      throw new Error('Veri çekilemedi');
    }

    const arabicEdition = json.data[0];
    const turkishEdition = json.data[1];
    const audioEdition = json.data[2];

    const verses: Ayah[] = [];
    const length = arabicEdition.ayahs.length;

    for (let i = 0; i < length; i++) {
      const arAyah = arabicEdition.ayahs[i];
      const trAyah = turkishEdition.ayahs[i];
      const auAyah = audioEdition.ayahs[i];

      let arabicText = arAyah.text;
      if (id !== 1 && id !== 9 && arAyah.numberInSurah === 1) {
        // AlQuran API prepends Bismillah to Ayah 1 for surahs 2..114 (except 9)
        // We strip this prefix so Bismillah is not displayed twice (header + verse text)
        const stripped = arabicText
          .replace(/^بِسْمِ\s+ٱللَّهِ\s+ٱلرَّحْمَٰنِ\s+ٱلرَّحِيمِ\s*/u, '')
          .replace(/^بِسْمِ\s+ٱللَّهِ\s+ٱلرَّحْمَٰنِ\s+ٱلرَّحِيمِ\s*/u, '')
          .replace(/^بِسْمِ\s+اللَّهِ\s+الرَّحْمَنِ\s+الرَّحِيمِ\s*/u, '')
          .replace(/^بِسْمِ\s+[\u0600-\u06FF\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s]+?ٱلرَّحِيمِ\s*/u, '')
          .replace(/^بِسْمِ\s+[\u0600-\u06FF\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s]+?ٱلرَّحِيمِ\s*/u, '')
          .trim();
        if (stripped.length > 0) {
          arabicText = stripped;
        }
      }

      verses.push({
        number: arAyah.numberInSurah,
        globalNumber: arAyah.number,
        arabic: arabicText,
        transliteration: `Ayet ${arAyah.numberInSurah}`,
        translation: trAyah.text,
        audioUrl: auAyah.audio || `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${arAyah.number}.mp3`,
        juz: arAyah.juz,
        page: arAyah.page,
      });
    }

    const loadedSurah: Surah = {
      id: listItem.id,
      nameArabic: arabicEdition.name,
      nameTurkish: listItem.nameTurkish,
      nameEnglish: arabicEdition.englishName,
      versesCount: listItem.versesCount,
      revelationType: listItem.revelationType,
      juzNumber: verses[0]?.juz || 1,
      startPage: verses[0]?.page || 1,
      verses,
    };

    surahCache[id] = loadedSurah;
    try {
      localStorage.setItem(`kuran_offline_surah_${id}`, JSON.stringify(loadedSurah));
    } catch (e) {}

    return loadedSurah;
  } catch (err) {
    console.error(`Sûre ${id} yükleme hatası:`, err);
    // Try local storage fallback
    try {
      const saved = localStorage.getItem(`kuran_offline_surah_${id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed) return parsed;
      }
    } catch (e) {}

    // If we have a local fallback for this surah, return it
    const local = QURAN_SURAHS.find((s) => s.id === id);
    if (local) return local;
    throw err;
  }
};
