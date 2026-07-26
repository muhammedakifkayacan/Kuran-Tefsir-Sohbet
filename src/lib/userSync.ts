import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from './firebase';
import { SohbetSession, VerseNote, RibbonBookmark } from '../types';

export interface UserDataState {
  sohbets: SohbetSession[];
  notes: VerseNote[];
  ribbons: RibbonBookmark[];
  lastRead: any | null;
  bookmarks: Record<number, number[]>;
}

// Helper to determine the current user's isolation key
export const getUserStorageKey = (uid?: string | null): string => {
  const currentUid = uid || auth.currentUser?.uid;
  if (currentUid) return `kuran_user_${currentUid}`;
  return 'kuran_user_guest';
};

// Check if an item is a legacy hardcoded mock sample that should be stripped
const isMockSampleItem = (item: any): boolean => {
  if (!item) return true;
  if (item.id === 'sohbet_1' || item.id === 'sohbet_2') return true;
  if (item.id === 'note_1' && item.noteText?.includes('İdgam-ı Maal Gunne')) return true;
  return false;
};

// Clean legacy mock items from array
const sanitizeUserArray = <T>(arr: any[]): T[] => {
  if (!Array.isArray(arr)) return [];
  return arr.filter((item) => !isMockSampleItem(item));
};

// Load user data from Firestore (if authenticated) and local storage fallback
export const loadUserData = async (uid?: string | null): Promise<UserDataState> => {
  const targetUid = uid || auth.currentUser?.uid;
  const storageKey = getUserStorageKey(targetUid);

  // 1. Try loading from user-scoped localStorage
  let localSohbets: SohbetSession[] = [];
  let localNotes: VerseNote[] = [];
  let localRibbons: RibbonBookmark[] = [];
  let localLastRead: any | null = null;
  let localBookmarks: Record<number, number[]> = {};

  try {
    const savedSohbets = localStorage.getItem(`${storageKey}_sohbets`);
    if (savedSohbets) localSohbets = sanitizeUserArray(JSON.parse(savedSohbets));

    const savedNotes = localStorage.getItem(`${storageKey}_notes`);
    if (savedNotes) localNotes = sanitizeUserArray(JSON.parse(savedNotes));

    const savedRibbons = localStorage.getItem(`${storageKey}_ribbons`);
    if (savedRibbons) localRibbons = sanitizeUserArray(JSON.parse(savedRibbons));

    const savedLastRead = localStorage.getItem(`${storageKey}_lastread`);
    if (savedLastRead) localLastRead = JSON.parse(savedLastRead);

    const savedBookmarks = localStorage.getItem(`${storageKey}_bookmarks`);
    if (savedBookmarks) localBookmarks = JSON.parse(savedBookmarks);
  } catch (e) {
    console.warn("Local storage read error", e);
  }

  // If user is not authenticated, return clean user-scoped local data
  if (!targetUid) {
    return {
      sohbets: localSohbets,
      notes: localNotes,
      ribbons: localRibbons,
      lastRead: localLastRead,
      bookmarks: localBookmarks,
    };
  }

  // 2. Fetch from Firestore for logged-in user
  try {
    const userDocRef = doc(db, 'users', targetUid, 'userData', 'main');
    const snap = await getDoc(userDocRef);

    if (snap.exists()) {
      const data = snap.data();
      const firestoreSohbets = sanitizeUserArray<SohbetSession>(data.sohbets || []);
      const firestoreNotes = sanitizeUserArray<VerseNote>(data.notes || []);
      const firestoreRibbons = sanitizeUserArray<RibbonBookmark>(data.ribbons || []);
      const firestoreLastRead = data.lastRead || null;
      const firestoreBookmarks = data.bookmarks || {};

      // Sync into user-scoped localStorage for offline speed
      localStorage.setItem(`${storageKey}_sohbets`, JSON.stringify(firestoreSohbets));
      localStorage.setItem(`${storageKey}_notes`, JSON.stringify(firestoreNotes));
      localStorage.setItem(`${storageKey}_ribbons`, JSON.stringify(firestoreRibbons));
      if (firestoreLastRead) localStorage.setItem(`${storageKey}_lastread`, JSON.stringify(firestoreLastRead));
      localStorage.setItem(`${storageKey}_bookmarks`, JSON.stringify(firestoreBookmarks));

      return {
        sohbets: firestoreSohbets,
        notes: firestoreNotes,
        ribbons: firestoreRibbons,
        lastRead: firestoreLastRead,
        bookmarks: firestoreBookmarks,
      };
    } else {
      // First time logged in user: save their local data (if any) to Firestore
      const initialData = {
        userId: targetUid,
        sohbets: localSohbets,
        notes: localNotes,
        ribbons: localRibbons,
        lastRead: localLastRead,
        bookmarks: localBookmarks,
        updatedAt: new Date().toISOString(),
      };

      await setDoc(userDocRef, initialData, { merge: true }).catch((err) => {
        console.warn("Firestore setDoc initial error", err);
      });

      return {
        sohbets: localSohbets,
        notes: localNotes,
        ribbons: localRibbons,
        lastRead: localLastRead,
        bookmarks: localBookmarks,
      };
    }
  } catch (error) {
    console.warn("Error loading user data from Firestore, falling back to local storage", error);
    return {
      sohbets: localSohbets,
      notes: localNotes,
      ribbons: localRibbons,
      lastRead: localLastRead,
      bookmarks: localBookmarks,
    };
  }
};

// Save helper for Sohbet Sessions
export const saveUserSohbets = async (sohbets: SohbetSession[], uid?: string | null) => {
  const clean = sanitizeUserArray<SohbetSession>(sohbets);
  const targetUid = uid || auth.currentUser?.uid;
  const storageKey = getUserStorageKey(targetUid);

  localStorage.setItem(`${storageKey}_sohbets`, JSON.stringify(clean));

  if (targetUid) {
    try {
      const userDocRef = doc(db, 'users', targetUid, 'userData', 'main');
      await setDoc(userDocRef, { userId: targetUid, sohbets: clean, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (e) {
      console.warn("Failed saving sohbets to Firestore", e);
    }
  }
};

// Save helper for Verse Notes
export const saveUserNotes = async (notes: VerseNote[], uid?: string | null) => {
  const clean = sanitizeUserArray<VerseNote>(notes);
  const targetUid = uid || auth.currentUser?.uid;
  const storageKey = getUserStorageKey(targetUid);

  localStorage.setItem(`${storageKey}_notes`, JSON.stringify(clean));

  if (targetUid) {
    try {
      const userDocRef = doc(db, 'users', targetUid, 'userData', 'main');
      await setDoc(userDocRef, { userId: targetUid, notes: clean, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (e) {
      console.warn("Failed saving notes to Firestore", e);
    }
  }
};

// Save helper for Ribbon Bookmarks
export const saveUserRibbons = async (ribbons: RibbonBookmark[], uid?: string | null) => {
  const clean = sanitizeUserArray<RibbonBookmark>(ribbons);
  const targetUid = uid || auth.currentUser?.uid;
  const storageKey = getUserStorageKey(targetUid);

  localStorage.setItem(`${storageKey}_ribbons`, JSON.stringify(clean));

  if (targetUid) {
    try {
      const userDocRef = doc(db, 'users', targetUid, 'userData', 'main');
      await setDoc(userDocRef, { userId: targetUid, ribbons: clean, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (e) {
      console.warn("Failed saving ribbons to Firestore", e);
    }
  }
};

// Save helper for Last Read Position
export const saveUserLastRead = async (lastRead: any, uid?: string | null) => {
  const targetUid = uid || auth.currentUser?.uid;
  const storageKey = getUserStorageKey(targetUid);

  if (lastRead) {
    localStorage.setItem(`${storageKey}_lastread`, JSON.stringify(lastRead));
  } else {
    localStorage.removeItem(`${storageKey}_lastread`);
  }

  if (targetUid) {
    try {
      const userDocRef = doc(db, 'users', targetUid, 'userData', 'main');
      await setDoc(userDocRef, { userId: targetUid, lastRead: lastRead || null, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (e) {
      console.warn("Failed saving last read to Firestore", e);
    }
  }
};

// Save helper for Bookmarks (per surah or all surahs)
export const saveUserBookmarksMap = async (bookmarksMap: Record<number, number[]>, uid?: string | null) => {
  const targetUid = uid || auth.currentUser?.uid;
  const storageKey = getUserStorageKey(targetUid);

  localStorage.setItem(`${storageKey}_bookmarks`, JSON.stringify(bookmarksMap));

  if (targetUid) {
    try {
      const userDocRef = doc(db, 'users', targetUid, 'userData', 'main');
      await setDoc(userDocRef, { userId: targetUid, bookmarks: bookmarksMap, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (e) {
      console.warn("Failed saving bookmarks to Firestore", e);
    }
  }
};
