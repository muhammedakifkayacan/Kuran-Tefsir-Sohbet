// IndexedDB Offline Storage Helper for Full Quran & Meal Offline Access
import { Surah } from '../types';
import { ALL_SURAHS } from '../data/surahList';

const DB_NAME = 'KuranDersiOfflineDB';
const DB_VERSION = 1;
const STORE_SURAHS = 'surahs';
const STORE_USERDATA = 'user_data';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB desteklenmiyor'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_SURAHS)) {
        db.createObjectStore(STORE_SURAHS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_USERDATA)) {
        db.createObjectStore(STORE_USERDATA, { keyPath: 'key' });
      }
    };
  });
}

/**
 * Save a surah into IndexedDB
 */
export async function saveSurahToIDB(surah: Surah): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SURAHS, 'readwrite');
      const store = tx.objectStore(STORE_SURAHS);
      const req = store.put(surah);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IDB Save error:', err);
  }
}

/**
 * Retrieve a surah from IndexedDB
 */
export async function getSurahFromIDB(id: number): Promise<Surah | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_SURAHS, 'readonly');
      const store = tx.objectStore(STORE_SURAHS);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    return null;
  }
}

/**
 * Get count and estimated size of offline downloaded surahs
 */
export async function getOfflineDownloadStatus(): Promise<{
  downloadedCount: number;
  totalSurahs: number;
  estimatedSizeMB: number;
  isComplete: boolean;
}> {
  const totalSurahs = 114;
  try {
    const db = await openDB();
    const count: number = await new Promise((resolve) => {
      const tx = db.transaction(STORE_SURAHS, 'readonly');
      const store = tx.objectStore(STORE_SURAHS);
      const req = store.count();
      req.onsuccess = () => resolve(req.result || 0);
      req.onerror = () => resolve(0);
    });

    // Approximate size: ~30KB per surah with Arabic + Meal
    const estimatedSizeMB = Number(((count * 35) / 1024).toFixed(2));

    return {
      downloadedCount: count,
      totalSurahs,
      estimatedSizeMB,
      isComplete: count >= totalSurahs,
    };
  } catch (err) {
    return {
      downloadedCount: 0,
      totalSurahs,
      estimatedSizeMB: 0,
      isComplete: false,
    };
  }
}

/**
 * Batch download all 114 Surahs (Arapça + Meal + Audio url metadata) for 100% offline use
 */
export async function downloadAllSurahsOffline(
  onProgress?: (current: number, total: number, currentSurahName: string) => void
): Promise<{ success: boolean; downloaded: number }> {
  const total = ALL_SURAHS.length; // 114
  let downloaded = 0;

  for (let i = 0; i < total; i++) {
    const listItem = ALL_SURAHS[i];
    if (onProgress) {
      onProgress(i + 1, total, listItem.nameTurkish);
    }

    try {
      // First check if already in IDB
      const existing = await getSurahFromIDB(listItem.id);
      if (existing && existing.verses && existing.verses.length === listItem.versesCount) {
        downloaded++;
        continue;
      }

      // Fetch from API
      const res = await fetch(
        `https://api.alquran.cloud/v1/surah/${listItem.id}/editions/quran-uthmani,tr.diyanet,ar.alafasy`
      );
      if (res.ok) {
        const json = await res.json();
        if (json.code === 200 && json.data && json.data.length >= 3) {
          const arEdition = json.data[0];
          const trEdition = json.data[1];
          const auEdition = json.data[2];

          const verses = [];
          for (let v = 0; v < arEdition.ayahs.length; v++) {
            const arAyah = arEdition.ayahs[v];
            const trAyah = trEdition.ayahs[v];
            const auAyah = auEdition.ayahs[v];

            let arabicText = arAyah.text;
            if (listItem.id !== 1 && listItem.id !== 9 && arAyah.numberInSurah === 1) {
              arabicText = arabicText
                .replace(/^بِسْمِ\s+ٱللَّهِ\s+ٱلرَّحْمَٰنِ\s+ٱلرَّحِيمِ\s*/u, '')
                .replace(/^بِسْمِ\s+ٱللَّهِ\s+ٱلرَّحْمَٰنِ\s+ٱلرَّحِيمِ\s*/u, '')
                .replace(/^بِسْمِ\s+اللَّهِ\s+الرَّحْمَنِ\s+الرَّحِيمِ\s*/u, '')
                .replace(/^بِسْمِ\s+[\u0600-\u06FF\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s]+?ٱلرَّحِيمِ\s*/u, '')
                .trim();
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

          const surahObj: Surah = {
            id: listItem.id,
            nameArabic: arEdition.name,
            nameTurkish: listItem.nameTurkish,
            nameEnglish: arEdition.englishName,
            versesCount: listItem.versesCount,
            revelationType: listItem.revelationType,
            juzNumber: verses[0]?.juz || 1,
            startPage: verses[0]?.page || 1,
            verses,
          };

          await saveSurahToIDB(surahObj);
          downloaded++;
        }
      }
    } catch (e) {
      console.warn(`Sûre ${listItem.id} indirme hatası:`, e);
    }

    // Small yield delay so UI remains fluid
    await new Promise((r) => setTimeout(r, 50));
  }

  return { success: downloaded > 0, downloaded };
}

/**
 * Clear all offline stored Quran data
 */
export async function clearAllOfflineData(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SURAHS, 'readwrite');
      const store = tx.objectStore(STORE_SURAHS);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Clear offline error:', err);
  }
}

/**
 * Save generic user data into IndexedDB for maximum persistence
 */
export async function savePersistentUserData(key: string, value: any): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_USERDATA, 'readwrite');
      const store = tx.objectStore(STORE_USERDATA);
      store.put({ key, value, updatedAt: Date.now() });
      tx.oncomplete = () => resolve();
    });
  } catch (e) {}
}

/**
 * Retrieve generic user data from IndexedDB
 */
export async function getPersistentUserData(key: string): Promise<any> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_USERDATA, 'readonly');
      const store = tx.objectStore(STORE_USERDATA);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result ? req.result.value : null);
      req.onerror = () => resolve(null);
    });
  } catch (e) {
    return null;
  }
}
