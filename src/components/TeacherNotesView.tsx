import React, { useState } from 'react';
import { StickyNote, Sparkles, Trash2, Send, Bot, User, RefreshCw, Download, Upload, Copy, Check, Search, X } from 'lucide-react';
import { VerseNote } from '../types';

interface TeacherNotesViewProps {
  verseNotes: VerseNote[];
  onDeleteNote: (id: string) => void;
  onOpenExportImportModal?: () => void;
}

export const TeacherNotesView: React.FC<TeacherNotesViewProps> = ({
  verseNotes,
  onDeleteNote,
  onOpenExportImportModal,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'notes' | 'ai'>('notes');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [searchNoteQuery, setSearchNoteQuery] = useState<string>('');
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);

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
      <div className="bg-white rounded-3xl p-4 border border-stone-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <StickyNote className="w-5 h-5 text-amber-800" />
            Ders Not Defteri & AI Asistan
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-1.5 p-1 bg-stone-100 rounded-2xl">
          <button
            onClick={() => setActiveSubTab('notes')}
            className={`py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'notes'
                ? 'bg-white text-amber-900 shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Ayet Notları ({verseNotes.length})
          </button>

          <button
            onClick={() => setActiveSubTab('ai')}
            className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeSubTab === 'ai'
                ? 'bg-amber-700 text-white shadow-2xs font-bold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
            AI Asistan
          </button>
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
                  className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap transition-all ${
                    selectedTag === tagItem.id
                      ? 'bg-amber-700 text-white font-semibold shadow-2xs'
                      : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
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
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Dışa / İçe Aktar</span>
              </button>
            )}
          </div>

          {/* Search Box for Notes */}
          <div className="relative">
            <Search className="w-4 h-4 text-amber-700 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchNoteQuery}
              onChange={(e) => setSearchNoteQuery(e.target.value)}
              placeholder="Ders notlarında ara (Sûre adı, ayet no, not metni veya konu)..."
              className="w-full pl-10 pr-9 py-2.5 bg-white text-stone-900 text-xs font-medium rounded-2xl border border-amber-200/90 shadow-2xs focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition-all placeholder:text-stone-400"
            />
            {searchNoteQuery && (
              <button
                type="button"
                onClick={() => setSearchNoteQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1 rounded-full transition-colors"
                title="Aramayı Temizle"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Notes List */}
          {filteredNotes.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-stone-200 p-6 space-y-2">
              <StickyNote className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-800">Henüz kaydedilmiş not yok</p>
              <p className="text-xs text-slate-500">
                Kur'an Okuma ekranından herhangi bir ayet üzerine dokunarak hoca veya tefsir notu kaydedebilirsiniz.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredNotes.map((note) => (
                <div
                  key={note.id}
                  className="bg-white rounded-3xl p-4 sm:p-5 border border-stone-200 shadow-sm space-y-3 relative flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 font-bold border border-amber-200 text-[10px]">
                        {note.tag}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleCopyNote(note)}
                          className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all active:scale-95 ${
                            copiedNoteId === note.id
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-stone-100 hover:bg-amber-100 text-stone-700 hover:text-amber-900 border border-stone-200'
                          }`}
                          title="Not Metnini Kopyala"
                        >
                          {copiedNoteId === note.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Kopyalandı</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-stone-500" />
                              <span>Kopyala</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => onDeleteNote(note.id)}
                          className="text-slate-400 hover:text-rose-500 p-1.5 rounded-xl hover:bg-rose-50 transition-colors"
                          title="Notu Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs font-bold text-slate-900">
                      {note.surahName} — {note.verseNumber}. Ayet
                    </p>

                    <p className="text-xs text-slate-700 bg-stone-50 p-3 rounded-2xl border border-stone-200/80 leading-relaxed italic">
                      "{note.noteText}"
                    </p>
                  </div>

                  <p className="text-[10px] text-slate-400 text-right font-mono mt-2">{note.createdAt}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* AI Assistant Chat View */
        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-4 sm:p-5 space-y-4">
          {/* Quick Prompts Bar */}
          <div>
            <span className="text-[11px] text-slate-500 block mb-1 font-medium">Hızlı Konu Önerileri:</span>
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
                  className="text-[11px] px-3 py-1.5 rounded-full bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200 font-medium transition-colors"
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
                      : 'bg-stone-100 text-stone-900 rounded-bl-none border border-stone-200'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  <span
                    className={`text-[9px] block text-right mt-1 font-mono ${
                      msg.sender === 'user' ? 'text-amber-200' : 'text-slate-400'
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
              <div className="flex gap-2.5 items-center text-xs text-amber-700 font-medium">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>AI Asistanı yanıt hazırlıyor...</span>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="flex items-center gap-2 pt-2 border-t border-stone-200">
            <input
              type="text"
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendAiMessage()}
              placeholder="Sorunuzu yazın veya tefsir / tecvit konusu isteyin..."
              className="flex-1 bg-stone-50 text-slate-900 text-xs rounded-2xl px-3.5 py-2.5 border border-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />

            <button
              onClick={() => handleSendAiMessage()}
              disabled={!aiInput.trim() || isAiLoading}
              className="p-2.5 rounded-2xl bg-amber-700 hover:bg-amber-800 text-white disabled:opacity-50 transition-all shadow-2xs active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
