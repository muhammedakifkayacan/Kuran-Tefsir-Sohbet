import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { StickyNote, Sparkles, Trash2, Send, Bot, User, RefreshCw, Download, Upload, Copy, Check, Search, X, Bookmark, BookOpen } from 'lucide-react';
import { VerseNote } from '../types';
import { ALL_SURAHS } from '../data/surahList';

interface TeacherNotesViewProps {
  verseNotes: VerseNote[];
  onDeleteNote: (id: string) => void;
  onOpenExportImportModal?: () => void;
  onNavigateToVerse?: (surahId: number, verseNumber: number) => void;
}

export const TeacherNotesView: React.FC<TeacherNotesViewProps> = ({
  verseNotes,
  onDeleteNote,
  onOpenExportImportModal,
  onNavigateToVerse,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'notes' | 'bookmarks' | 'ai'>('notes');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [searchNoteQuery, setSearchNoteQuery] = useState<string>('');
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);

  // Bookmarks loaded from localStorage
  const [allBookmarks, setAllBookmarks] = useState<{ surahId: number; surahName: string; verseNumber: number }[]>([]);

  const loadBookmarks = () => {
    const list: { surahId: number; surahName: string; verseNumber: number }[] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('kuran_bookmarks_')) {
          const surahId = parseInt(key.replace('kuran_bookmarks_', ''), 10);
          const surahObj = ALL_SURAHS.find((s) => s.id === surahId);
          const versesStr = localStorage.getItem(key);
          if (versesStr) {
            const vNums: number[] = JSON.parse(versesStr);
            if (Array.isArray(vNums)) {
              vNums.forEach((vNum) => {
                list.push({
                  surahId,
                  surahName: surahObj ? surahObj.nameTurkish : `${surahId}. Sûre`,
                  verseNumber: vNum,
                });
              });
            }
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
    setAllBookmarks(list.sort((a, b) => a.surahId - b.surahId || a.verseNumber - b.verseNumber));
  };

  useEffect(() => {
    loadBookmarks();
  }, [activeSubTab]);

  const handleDeleteBookmark = (surahId: number, verseNum: number) => {
    const key = `kuran_bookmarks_${surahId}`;
    const existing = localStorage.getItem(key);
    if (existing) {
      try {
        const arr: number[] = JSON.parse(existing);
        const updated = arr.filter((v) => v !== verseNum);
        if (updated.length > 0) {
          localStorage.setItem(key, JSON.stringify(updated));
        } else {
          localStorage.removeItem(key);
        }
        setAllBookmarks((prev) => prev.filter((b) => !(b.surahId === surahId && b.verseNumber === verseNum)));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleCopyNote = (note: VerseNote) => {
    const textToCopy = `${note.surahName} ${note.verseNumber}. Ayet (${note.tag}):\n${note.noteText}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedNoteId(note.id);
    setTimeout(() => setCopiedNoteId(null), 2000);
  };

  // AI Chat state
  const [messages, setMessages] = useState<
    { sender: 'user' | 'ai'; text: string; timestamp: string }[]
  >([
    {
      sender: 'ai',
      text: 'Selamün Aleyküm! Ben Kur\'an-ı Kerim ve Tefsir konularında size yardımcı olan AI Asistanım. Tecvit kuralları, ayet tahlilleri, ders notları veya sohbet fikirleri konusunda neye ihtiyacınız var?',
      timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [aiInput, setAiInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const filteredNotes = verseNotes.filter((note) => {
    if (selectedTag !== 'all' && note.tag !== selectedTag) return false;
    if (searchNoteQuery.trim()) {
      const q = searchNoteQuery.toLowerCase().trim();
      const matchSurah = note.surahName ? note.surahName.toLowerCase().includes(q) : false;
      const matchVerse = note.verseNumber ? String(note.verseNumber).includes(q) : false;
      const matchNote = note.noteText ? note.noteText.toLowerCase().includes(q) : false;
      const matchTag = note.tag ? note.tag.toLowerCase().includes(q) : false;
      const matchPage = note.pageNumber ? String(note.pageNumber).includes(q) : false;
      return matchSurah || matchVerse || matchNote || matchTag || matchPage;
    }
    return true;
  });

  const handleSendAiMessage = async (promptText?: string) => {
    const textToSend = promptText || aiInput.trim();
    if (!textToSend || isAiLoading) return;

    const userMsg = {
      sender: 'user' as const,
      text: textToSend,
      timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!promptText) setAiInput('');
    setIsAiLoading(true);

    try {
      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToSend,
          contextType: 'general',
        }),
      });

      const data = await response.json();
      const aiText = data.response || 'Üzgünüm, yanıt üretilemedi.';

      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: aiText,
          timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err: any) {
      console.error('AI Chat Error:', err);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: 'Üzgünüm, yanıt alınırken bir bağlantı hatası oluştu. Lütfen tekrar deneyin.',
          timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6 pb-28 animate-fade-in w-full">
      {/* Navigation Subtabs */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl p-4 border border-stone-200 dark:border-stone-700 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-stone-100 flex items-center gap-2">
            <StickyNote className="w-5 h-5 text-amber-800 dark:text-amber-400" />
            Ders Not Defteri & AI Asistan
          </h2>
        </div>

        <div className="grid grid-cols-3 gap-1.5 p-1 bg-stone-100 dark:bg-stone-800 rounded-2xl relative text-xs">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveSubTab('notes')}
            className={`relative py-2 px-1 rounded-xl font-bold transition-colors cursor-pointer text-center ${
              activeSubTab === 'notes'
                ? 'text-amber-900 dark:text-amber-300 font-bold'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            {activeSubTab === 'notes' && (
              <motion.span
                layoutId="activeSubTabPill"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="absolute inset-0 bg-white dark:bg-stone-900 rounded-xl shadow-xs border border-stone-200/60 dark:border-stone-700 -z-0"
              />
            )}
            <span className="relative z-10 truncate">Ayet Notlarım ({verseNotes.length})</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveSubTab('bookmarks')}
            className={`relative py-2 px-1 rounded-xl font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer text-center ${
              activeSubTab === 'bookmarks'
                ? 'text-amber-900 dark:text-amber-300 font-bold'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            {activeSubTab === 'bookmarks' && (
              <motion.span
                layoutId="activeSubTabPill"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="absolute inset-0 bg-white dark:bg-stone-900 rounded-xl shadow-xs border border-stone-200/60 dark:border-stone-700 -z-0"
              />
            )}
            <Bookmark className="w-3.5 h-3.5 relative z-10 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="relative z-10 truncate">Kaydedilenler ({allBookmarks.length})</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveSubTab('ai')}
            className={`relative py-2 px-1 rounded-xl font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer text-center ${
              activeSubTab === 'ai'
                ? 'text-white font-bold'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            {activeSubTab === 'ai' && (
              <motion.span
                layoutId="activeSubTabPill"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="absolute inset-0 bg-amber-700 rounded-xl shadow-xs -z-0"
              />
            )}
            <Sparkles className="w-3.5 h-3.5 relative z-10 text-amber-200 shrink-0" />
            <span className="relative z-10 truncate">AI Asistan</span>
          </motion.button>
        </div>
      </div>

      {activeSubTab === 'notes' ? (
        <div className="space-y-3">
          {/* Header Action Bar with Filters & Export/Import Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            {/* Tag Filter Pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs flex-1">
              {[
                { id: 'all', label: 'Tümü' },
                { id: 'Tecvit', label: 'Tecvit Notu' },
                { id: 'Tefsir Notu', label: 'Tefsir Notu' },
                { id: 'Hikmet', label: 'Hikmetli Söz' },
                { id: 'Önemli', label: 'Önemli' },
              ].map((tagItem) => (
                <button
                  key={tagItem.id}
                  onClick={() => setSelectedTag(tagItem.id)}
                  className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                    selectedTag === tagItem.id
                      ? 'bg-amber-700 text-white font-semibold shadow-2xs'
                      : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-200 border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800'
                  }`}
                >
                  {tagItem.label}
                </button>
              ))}
            </div>

            {/* Export/Import Trigger Button */}
            {onOpenExportImportModal && (
              <button
                onClick={onOpenExportImportModal}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all shrink-0 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Dışa / İçe Aktar</span>
              </button>
            )}
          </div>

          {/* Search Box for Notes */}
          <div className="relative">
            <Search className="w-4 h-4 text-amber-700 dark:text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchNoteQuery}
              onChange={(e) => setSearchNoteQuery(e.target.value)}
              placeholder="Ders notlarında ara (Sûre adı, ayet no, not metni veya konu)..."
              className="w-full pl-10 pr-9 py-2.5 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-xs font-medium rounded-2xl border border-amber-200/90 dark:border-stone-700 shadow-2xs focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition-all placeholder:text-stone-400"
            />
            {searchNoteQuery && (
              <button
                type="button"
                onClick={() => setSearchNoteQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-1 rounded-full transition-colors cursor-pointer"
                title="Aramayı Temizle"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Notes List */}
          {filteredNotes.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-700 p-6 space-y-2">
              <StickyNote className="w-10 h-10 text-slate-300 dark:text-stone-600 mx-auto" />
              <p className="text-sm font-bold text-slate-800 dark:text-stone-100">Henüz kaydedilmiş not yok</p>
              <p className="text-xs text-slate-500 dark:text-stone-400">
                Kur'an Okuma ekranından herhangi bir ayet üzerine dokunarak hoca veya tefsir notu kaydedebilirsiniz.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredNotes.map((note) => (
                <div
                  key={note.id}
                  className="bg-white dark:bg-stone-900 rounded-3xl p-4 sm:p-5 border border-stone-200 dark:border-stone-700 shadow-sm space-y-3 relative flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-stone-800 text-amber-900 dark:text-amber-300 font-bold border border-amber-200 dark:border-stone-700 text-[10px]">
                        {note.tag}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleCopyNote(note)}
                          className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all active:scale-95 cursor-pointer ${
                            copiedNoteId === note.id
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                              : 'bg-stone-100 dark:bg-stone-800 hover:bg-amber-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 hover:text-amber-900 dark:hover:text-amber-300 border border-stone-200 dark:border-stone-700'
                          }`}
                          title="Not Metnini Kopyala"
                        >
                          {copiedNoteId === note.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span>Kopyalandı</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
                              <span>Kopyala</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => onDeleteNote(note.id)}
                          className="text-slate-400 hover:text-rose-500 p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                          title="Notu Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs font-bold text-slate-900 dark:text-stone-100 flex items-center justify-between">
                      <span>{note.surahName} — {note.verseNumber}. Ayet</span>
                      {onNavigateToVerse && (
                        <button
                          onClick={() => onNavigateToVerse(note.surahId, note.verseNumber)}
                          className="text-[11px] font-bold text-amber-800 dark:text-amber-300 hover:text-amber-950 bg-amber-50 dark:bg-stone-800 hover:bg-amber-100 dark:hover:bg-stone-700 border border-amber-200 dark:border-stone-700 px-2 py-0.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <BookOpen className="w-3 h-3 text-amber-700 dark:text-amber-400" />
                          <span>Ayete Git</span>
                        </button>
                      )}
                    </p>

                    <p className="text-xs text-slate-700 dark:text-stone-200 bg-stone-50 dark:bg-stone-800/60 p-3 rounded-2xl border border-stone-200/80 dark:border-stone-700 leading-relaxed italic">
                      "{note.noteText}"
                    </p>
                  </div>

                  <p className="text-[10px] text-slate-400 dark:text-stone-500 text-right font-mono mt-2">{note.createdAt}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : activeSubTab === 'bookmarks' ? (
        /* Kaydedilen Ayetler (Yer İşaretleri) View */
        <div className="space-y-4">
          <div className="bg-amber-50/80 dark:bg-stone-800/80 border border-amber-200/80 dark:border-stone-700 rounded-2xl p-4 text-amber-900 dark:text-amber-300 text-xs flex items-start justify-between gap-3 shadow-2xs">
            <div className="flex items-start gap-2.5">
              <Bookmark className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-sm text-amber-950 dark:text-amber-200">Kaydedilen Ayetler (Yer İşaretleri)</h3>
                <p className="text-amber-800 dark:text-amber-400 text-[11px] mt-0.5 leading-relaxed">
                  Kur'an okurken veya çoklu ayet seçerken "Kaydet" seçeneği ile işaretlediğiniz tüm ayetler burada listelenir.
                </p>
              </div>
            </div>
            <button
              onClick={loadBookmarks}
              className="p-2 rounded-xl bg-white dark:bg-stone-900 border border-amber-200 dark:border-stone-700 text-amber-900 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-stone-800 transition-all shrink-0 cursor-pointer text-xs font-bold flex items-center gap-1"
              title="Listeyi Yenile"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Yenile</span>
            </button>
          </div>

          {allBookmarks.length === 0 ? (
            <div className="bg-white dark:bg-stone-900 rounded-3xl p-8 border border-dashed border-stone-300 dark:border-stone-700 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-stone-800 text-amber-800 dark:text-amber-300 flex items-center justify-center mx-auto text-xl font-bold">
                🔖
              </div>
              <p className="text-sm font-bold text-stone-800 dark:text-stone-100">Henüz kaydedilmiş yer işareti bulunmuyor</p>
              <p className="text-xs text-stone-500 dark:text-stone-400 max-w-md mx-auto">
                Kur'an sayfasında okurken ayet kartındaki 🔖 ikonuna dokunarak veya "Çoklu Seç" menüsünden "Kaydet"e basarak ayetleri buraya kaydedebilirsiniz.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {allBookmarks.map((bm, idx) => (
                <div
                  key={`${bm.surahId}-${bm.verseNumber}-${idx}`}
                  onClick={() => {
                    if (onNavigateToVerse) {
                      onNavigateToVerse(bm.surahId, bm.verseNumber);
                    }
                  }}
                  className="bg-white dark:bg-stone-900 hover:bg-amber-50/50 dark:hover:bg-stone-800/80 rounded-2xl p-4 border border-stone-200/90 dark:border-stone-700 hover:border-amber-400 shadow-2xs hover:shadow-md transition-all space-y-2 flex flex-col justify-between cursor-pointer group"
                >
                  <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-amber-100 dark:bg-stone-800 group-hover:bg-amber-700 group-hover:text-white text-amber-900 dark:text-amber-300 font-bold text-xs flex items-center justify-center border border-amber-200 dark:border-stone-700 transition-colors">
                        {bm.verseNumber}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-stone-900 dark:text-stone-100 group-hover:text-amber-950 dark:group-hover:text-amber-300 transition-colors">{bm.surahName}</h4>
                        <span className="text-[10px] text-stone-500 dark:text-stone-400 font-medium">{bm.verseNumber}. Ayet</span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteBookmark(bm.surahId, bm.verseNumber);
                      }}
                      className="p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-stone-800 text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Yer İşaretini Kaldır"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="pt-1 flex items-center justify-between text-xs font-semibold text-stone-600 dark:text-stone-300">
                    <span className="text-[11px] text-amber-800 dark:text-amber-400 font-medium flex items-center gap-1">
                      📌 Kaydedildi
                    </span>
                    <span className="text-[11px] font-bold text-amber-900 dark:text-amber-300 group-hover:underline flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                      Ayete Git →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* AI Assistant Chat View */
        <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-700 shadow-sm p-4 sm:p-5 space-y-4">
          {/* Quick Prompts Bar */}
          <div>
            <span className="text-[11px] text-slate-500 dark:text-stone-400 block mb-1 font-medium">Hızlı Konu Önerileri:</span>
            <div className="flex flex-wrap gap-1.5">
              {[
                'Mülk Sûresi 1-5 ayet tefsir özetini ver',
                'İhlas suresindeki tecvit kurallarını tahlil et',
                'Cuma vaazı için tefekkür soruları çıkar',
                'Med-di munfasil ve muttasil farkını anlat',
              ].map((qp, i) => (
                <button
                  key={i}
                  onClick={() => handleSendAiMessage(qp)}
                  className="text-[11px] px-3 py-1.5 rounded-full bg-amber-50 dark:bg-stone-800 text-amber-900 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-stone-700 border border-amber-200 dark:border-stone-700 font-medium transition-colors cursor-pointer"
                >
                  ✨ {qp}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Messages */}
          <div className="space-y-3 max-h-96 overflow-y-auto p-1 pr-2">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'ai' && (
                  <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-sm font-bold">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-amber-800 text-amber-50 rounded-br-none'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 rounded-bl-none border border-stone-200 dark:border-stone-700'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  <span
                    className={`text-[9px] block text-right mt-1 font-mono ${
                      msg.sender === 'user' ? 'text-amber-200' : 'text-slate-400 dark:text-stone-400'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>

                {msg.sender === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-amber-700 text-white flex items-center justify-center shrink-0 text-xs font-bold">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {isAiLoading && (
              <div className="flex gap-2.5 items-center text-xs text-amber-700 dark:text-amber-400 font-medium">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>AI Asistanı yanıt hazırlıyor...</span>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="flex items-center gap-2 pt-2 border-t border-stone-200 dark:border-stone-800">
            <input
              type="text"
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendAiMessage()}
              placeholder="Sorunuzu yazın veya tefsir / tecvit konusu isteyin..."
              className="flex-1 bg-stone-50 dark:bg-stone-800 text-slate-900 dark:text-stone-100 placeholder-stone-400 text-xs rounded-2xl px-3.5 py-2.5 border border-stone-200 dark:border-stone-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />

            <button
              onClick={() => handleSendAiMessage()}
              disabled={!aiInput.trim() || isAiLoading}
              className="p-2.5 rounded-2xl bg-amber-700 hover:bg-amber-800 text-white disabled:opacity-50 transition-all shadow-2xs active:scale-95 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
