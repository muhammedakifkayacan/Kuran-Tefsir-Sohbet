import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Radio, Mic, Plus, MapPin, Sparkles, Share2, Trash2, Calendar as CalendarIcon, Clock, Check, RefreshCw, Volume2, ChevronRight, Bell, ExternalLink, ChevronLeft, X, BookOpen, Quote } from 'lucide-react';
import confetti from 'canvas-confetti';
import { SohbetSession } from '../types';
import { TitleWithHelp } from './TitleWithHelp';
import { getGoogleCalendarUrl, downloadIcsFile } from '../utils/calendarUtils';

interface SohbetViewProps {
  sohbetSessions: SohbetSession[];
  onAddSohbetSession: (newSession: SohbetSession) => void;
  onUpdateSohbetSession?: (updatedSession: SohbetSession) => void;
  onDeleteSohbetSession: (id: string) => void;
  onOpenVoiceRecorder: () => void;
  recordedVoiceUrl?: string | null;
  recordedVoiceTranscript?: string;
  user?: { name: string; email: string; avatar: string } | null;
  onRequireAuth?: (message: string) => void;
}

export const SohbetView: React.FC<SohbetViewProps> = ({
  sohbetSessions,
  onAddSohbetSession,
  onUpdateSohbetSession,
  onDeleteSohbetSession,
  onOpenVoiceRecorder,
  recordedVoiceUrl,
  recordedVoiceTranscript,
  user,
  onRequireAuth,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchVenue, setSearchVenue] = useState<string>('');
  const [activeRecordingSessionId, setActiveRecordingSessionId] = useState<string | null>(null);

  // Dedicated Detail Page Sheet State
  const [selectedDetailSession, setSelectedDetailSession] = useState<SohbetSession | null>(null);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [venueInput, setVenueInput] = useState('Fatih Camii Sohbet Meclisi');
  const [categoryInput, setCategoryInput] = useState<SohbetSession['category']>('Tefsir');
  const [durationInput, setDurationInput] = useState<number>(40);
  const [teacherNotesInput, setTeacherNotesInput] = useState('');
  const [audioTranscriptInput, setAudioTranscriptInput] = useState('');
  const [nukteInput, setNukteInput] = useState('');
  const [nukteList, setNukteList] = useState<string[]>([]);

  // Sync recordedVoiceTranscript when modal opens or transcript arrives
  React.useEffect(() => {
    if (recordedVoiceTranscript) {
      setAudioTranscriptInput(recordedVoiceTranscript);
    }
  }, [recordedVoiceTranscript]);

  // Handle voice recording for an existing session
  React.useEffect(() => {
    if (recordedVoiceUrl && activeRecordingSessionId && onUpdateSohbetSession) {
      const targetSession = sohbetSessions.find((s) => s.id === activeRecordingSessionId);
      if (targetSession) {
        const updated: SohbetSession = {
          ...targetSession,
          audioRecordingUrl: recordedVoiceUrl,
          audioTranscript: recordedVoiceTranscript || targetSession.audioTranscript,
        };
        onUpdateSohbetSession(updated);
        if (selectedDetailSession?.id === updated.id) {
          setSelectedDetailSession(updated);
        }
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });
      }
      setActiveRecordingSessionId(null);
    }
  }, [recordedVoiceUrl, recordedVoiceTranscript, activeRecordingSessionId, sohbetSessions, onUpdateSohbetSession, selectedDetailSession]);

  // AI Summary State
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredSessions = sohbetSessions.filter((session) => {
    if (selectedCategory !== 'all' && session.category !== selectedCategory) return false;
    if (
      searchVenue &&
      !(session.venue && session.venue.toLowerCase().includes(searchVenue.toLowerCase())) &&
      !(session.title && session.title.toLowerCase().includes(searchVenue.toLowerCase()))
    ) {
      return false;
    }
    return true;
  });

  const handleAddNukte = () => {
    if (!nukteInput.trim()) return;
    setNukteList([...nukteList, nukteInput.trim()]);
    setNukteInput('');
  };

  const handleRemoveNukte = (index: number) => {
    setNukteList(nukteList.filter((_, i) => i !== index));
  };

  const handleSaveSohbet = async () => {
    if (!titleInput.trim()) return;

    let generatedAiText = undefined;
    const finalTranscript = audioTranscriptInput.trim() || recordedVoiceTranscript || '';

    try {
      setIsGeneratingAi(true);
      const res = await fetch('/api/generate-sohbet-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: titleInput,
          venue: venueInput,
          category: categoryInput,
          teacherNotes: teacherNotesInput,
          keyNukteList: nukteList,
          audioTranscript: finalTranscript,
        }),
      });
      const data = await res.json();
      if (data.summary) {
        generatedAiText = data.summary;
      }
    } catch (e) {
      console.error('Sohbet summary generate error:', e);
    } finally {
      setIsGeneratingAi(false);
    }

    const newSohbet: SohbetSession = {
      id: `sohbet_${Date.now()}`,
      title: titleInput.trim(),
      venue: venueInput.trim() || 'Genel Sohbet Meclisi',
      category: categoryInput,
      date: new Date().toISOString().split('T')[0],
      durationMinutes: durationInput,
      teacherNotes: teacherNotesInput.trim() || 'Sohbet ve ders başarıyla icra edildi.',
      keyNukteList: nukteList,
      audioRecordingUrl: recordedVoiceUrl || undefined,
      audioTranscript: finalTranscript || undefined,
      aiSummary: generatedAiText,
      broadcastMessage: generatedAiText
        ? `*${titleInput} - ${venueInput}*\n\n` + generatedAiText
        : undefined,
    };

    onAddSohbetSession(newSohbet);
    setIsAddModalOpen(false);

    // Open detail page for the newly created session directly
    setSelectedDetailSession(newSohbet);

    // Reset inputs
    setTitleInput('');
    setTeacherNotesInput('');
    setAudioTranscriptInput('');
    setNukteList([]);

    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 },
    });
  };

  const handleCopyBroadcast = (session: SohbetSession) => {
    const textToCopy =
      session.broadcastMessage ||
      session.aiSummary ||
      `*${session.title}*\nMekan: ${session.venue}\nNot: ${session.teacherNotes}`;

    navigator.clipboard.writeText(textToCopy);
    setCopiedId(session.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleGenerateSummaryForExisting = async (session: SohbetSession) => {
    setIsGeneratingAi(true);
    try {
      const res = await fetch('/api/generate-sohbet-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: session.title,
          venue: session.venue,
          category: session.category,
          teacherNotes: session.teacherNotes,
          keyNukteList: session.keyNukteList,
          audioTranscript: session.audioTranscript || session.teacherNotes,
        }),
      });
      const data = await res.json();
      if (data.summary) {
        const updated = {
          ...session,
          aiSummary: data.summary,
          broadcastMessage: `*${session.title} - ${session.venue}*\n\n` + data.summary,
        };
        if (onUpdateSohbetSession) onUpdateSohbetSession(updated);
        setSelectedDetailSession(updated);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-5 pb-28 animate-fade-in w-full">
      {/* Sleek Apple-Style Header & Action Button */}
      <div className="bg-stone-100/90 dark:bg-stone-800/90 rounded-3xl p-5 border border-stone-200/90 dark:border-stone-700 shadow-2xs space-y-4 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Radio className="w-5 h-5 text-emerald-800 dark:text-emerald-400 shrink-0" />
              <TitleWithHelp
                title="Sohbet & Tefsir Meclisleri"
                description="Sohbet ve ders kayıtları, tefsir notları ve duyurular"
                titleClassName="text-lg font-bold text-stone-900 dark:text-stone-100 leading-tight"
              />
            </div>
          </div>

          <button
            id="tour-sohbet-add"
            onClick={() => {
              if (!user && onRequireAuth) {
                onRequireAuth('Sohbet meclisi ve ders kaydı eklemek için lütfen oturum açın.');
                return;
              }
              setIsAddModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs active:scale-95 transition-all shrink-0 w-full sm:w-auto justify-center cursor-pointer"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Sohbet Ekle</span>
          </button>
        </div>

        {/* Search & Category Filter Pills */}
        <div className="pt-3 border-t border-stone-200/80 dark:border-stone-700 space-y-2.5">
          <input
            type="text"
            placeholder="Mekan veya sohbet başlığı ara..."
            value={searchVenue}
            onChange={(e) => setSearchVenue(e.target.value)}
            className="w-full bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder-stone-400 text-xs rounded-xl px-3.5 py-2.5 border border-stone-200 dark:border-stone-700 focus:outline-none focus:ring-1 focus:ring-emerald-600 transition-all"
          />

          <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
            {[
              { id: 'all', label: 'Tümü' },
              { id: 'Tefsir', label: 'Tefsir' },
              { id: 'Hadis', label: 'Hadis' },
              { id: 'Ahlak & İhlas', label: 'Ahlak & İhlas' },
              { id: 'Siyer', label: 'Siyer' },
              { id: 'Akaid', label: 'Akaid' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap transition-all text-[11px] font-semibold cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-emerald-700 text-white font-bold shadow-2xs'
                    : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-200 border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sohbet Sessions Minimal Cards */}
      {filteredSessions.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 p-6 space-y-2">
          <Radio className="w-8 h-8 text-stone-300 dark:text-stone-600 mx-auto" />
          <p className="text-sm font-semibold text-stone-700 dark:text-stone-300">
            Henüz sohbet kaydı yok
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredSessions.map((session) => (
            <motion.div
              key={session.id}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.15 }}
              onClick={() => setSelectedDetailSession(session)}
              className="bg-white dark:bg-stone-900 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-stone-200/90 dark:border-stone-800 shadow-2xs hover:border-emerald-500/40 dark:hover:border-emerald-500/40 transition-all flex flex-col justify-between space-y-3.5 group cursor-pointer"
            >
              <div className="space-y-2.5">
                {/* Badge Header */}
                <div className="flex items-center justify-between text-xs">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-200/80 dark:border-emerald-800/80 text-[10px]">
                    {session.category}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-stone-400 dark:text-stone-500 font-mono text-[11px] flex items-center gap-1">
                      <CalendarIcon className="w-3 h-3" />
                      {session.date}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSohbetSession(session.id);
                      }}
                      className="text-stone-300 hover:text-rose-600 dark:text-stone-600 dark:hover:text-rose-400 p-1 transition-colors cursor-pointer"
                      title="Sil"
                      aria-label="Sohbet oturumunu sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Title & Venue */}
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 leading-snug group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                    {session.title}
                  </h3>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-stone-500 dark:text-stone-400 font-medium">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>{session.venue}</span>
                    </span>
                    {session.durationMinutes && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span>{session.durationMinutes} dk</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Button -> Open Dedicated Detail Sheet */}
              <div className="pt-1">
                <div
                  className="w-full py-2 px-3.5 rounded-xl bg-stone-100 dark:bg-stone-800 group-hover:bg-emerald-700 group-hover:text-white dark:group-hover:bg-emerald-600 text-stone-800 dark:text-stone-200 text-xs font-bold transition-all flex items-center justify-between"
                >
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Sohbet Detayını İncele</span>
                  </span>
                  <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Dedicated Apple-Style Full Detail Sheet Modal */}
      <AnimatePresence>
        {selectedDetailSession && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-stone-950/60 backdrop-blur-md animate-fade-in">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 rounded-3xl sm:rounded-[32px] w-full max-w-2xl max-h-[92vh] shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Header Bar */}
              <div className="p-4 sm:p-5 bg-stone-50 dark:bg-stone-800/80 border-b border-stone-200/80 dark:border-stone-800 flex items-center justify-between shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedDetailSession(null)}
                  className="flex items-center gap-1 text-xs font-bold text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white bg-white dark:bg-stone-700 px-3 py-1.5 rounded-full border border-stone-200 dark:border-stone-600 transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Kapat</span>
                </button>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300 text-xs font-bold border border-emerald-300 dark:border-emerald-800">
                    {selectedDetailSession.category}
                  </span>
                  <span className="text-xs font-mono text-stone-500 dark:text-stone-400">
                    {selectedDetailSession.date}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onDeleteSohbetSession(selectedDetailSession.id);
                    setSelectedDetailSession(null);
                  }}
                  className="text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 p-1.5 transition-colors cursor-pointer"
                  title="Sil"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Content Body */}
              <div className="p-5 sm:p-7 overflow-y-auto space-y-6 flex-1 text-stone-900 dark:text-stone-100">
                {/* Title & Location Header */}
                <div className="space-y-2 border-b border-stone-100 dark:border-stone-800 pb-4">
                  <h2 className="text-xl sm:text-2xl font-bold font-serif leading-tight">
                    {selectedDetailSession.title}
                  </h2>
                  <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-stone-600 dark:text-stone-300">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <strong>Mekan:</strong> {selectedDetailSession.venue}
                    </span>
                    {selectedDetailSession.durationMinutes && (
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <strong>Süre:</strong> {selectedDetailSession.durationMinutes} Dakika
                      </span>
                    )}
                  </div>
                </div>

                {/* Ders & Tefsir Notu Card */}
                <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/70 dark:bg-stone-800/80 border border-amber-200/80 dark:border-stone-700 space-y-2">
                  <div className="flex items-center gap-2 text-amber-950 dark:text-amber-300 font-bold text-xs uppercase tracking-wider">
                    <BookOpen className="w-4 h-4 text-amber-800 dark:text-amber-400" />
                    <span>Hoca Ders Notu & Tefsir Açıklaması</span>
                  </div>
                  <p className="text-xs sm:text-sm text-stone-800 dark:text-stone-200 leading-relaxed font-normal whitespace-pre-wrap">
                    {selectedDetailSession.teacherNotes}
                  </p>
                </div>

                {/* Hikmetli Nükteler Card */}
                {selectedDetailSession.keyNukteList && selectedDetailSession.keyNukteList.length > 0 && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 space-y-2.5">
                    <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100 font-bold text-xs uppercase tracking-wider">
                      <Quote className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>💡 Hikmetli Nükteler & Vurgulanan Cümleler</span>
                    </div>
                    <ul className="space-y-2 pl-1">
                      {selectedDetailSession.keyNukteList.map((nukte, idx) => (
                        <li key={idx} className="text-xs sm:text-sm text-stone-800 dark:text-stone-200 flex items-start gap-2">
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
                          <span className="leading-relaxed">{nukte}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Audio Recording & Player Card */}
                <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/60 dark:bg-stone-800/90 border border-emerald-200/80 dark:border-stone-700 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-emerald-950 dark:text-emerald-300 font-bold text-xs">
                      <Mic className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                      <span>Ders Ses Kaydı & Canlı Kayıt</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveRecordingSessionId(selectedDetailSession.id);
                        onOpenVoiceRecorder();
                      }}
                      className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer active:scale-95"
                    >
                      <Mic className="w-3.5 h-3.5 text-emerald-200 animate-pulse" />
                      <span>{selectedDetailSession.audioRecordingUrl ? 'Yeniden Ses Kaydı Al' : '🎙️ Vakti Geldi, Kaydı Başlat'}</span>
                    </button>
                  </div>

                  {selectedDetailSession.audioRecordingUrl ? (
                    <div className="flex items-center gap-3 pt-2 border-t border-emerald-200/60 dark:border-stone-700">
                      <Volume2 className="w-4 h-4 text-emerald-800 dark:text-emerald-400 shrink-0" />
                      <span className="text-xs font-medium text-emerald-950 dark:text-emerald-300">Ses Oynatıcı:</span>
                      <audio src={selectedDetailSession.audioRecordingUrl} controls className="h-8 w-full max-w-xs ml-auto" />
                    </div>
                  ) : (
                    <p className="text-xs text-stone-600 dark:text-stone-300 font-normal italic">
                      Henüz bu sohbet için kaydedilmiş ses dosyası yok. Canlı sohbet vaktinde yukarıdaki "Kaydı Başlat" butonuyla ses kaydı alabilirsiniz.
                    </p>
                  )}
                </div>

                {/* Audio Speech Transcript */}
                {selectedDetailSession.audioTranscript && (
                  <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-700 dark:text-stone-200 space-y-1.5">
                    <span className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5 text-xs">
                      <Mic className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                      <span>🎙️ Ses Kaydı Transkripti (Konuşma Metni)</span>
                    </span>
                    <p className="italic text-stone-700 dark:text-stone-300 leading-relaxed bg-white dark:bg-stone-900 p-3 rounded-xl border border-stone-200/80 dark:border-stone-700">
                      "{selectedDetailSession.audioTranscript}"
                    </p>
                  </div>
                )}

                {/* AI Summary Section */}
                <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/90 dark:bg-stone-800/90 border border-amber-200 dark:border-stone-700 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200/80 dark:border-stone-700 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                      <span className="font-bold text-xs text-amber-950 dark:text-amber-300">
                        Yapay Zekâ Sohbet Raporu
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleGenerateSummaryForExisting(selectedDetailSession)}
                        disabled={isGeneratingAi}
                        className="px-3 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingAi ? 'animate-spin' : ''}`} />
                        <span>{isGeneratingAi ? 'Analiz Ediliyor...' : selectedDetailSession.aiSummary ? 'Yeniden Üret' : 'Rapor Oluştur'}</span>
                      </button>
                    </div>
                  </div>

                  {selectedDetailSession.aiSummary ? (
                    <div className="text-xs sm:text-sm text-stone-800 dark:text-stone-200 whitespace-pre-wrap leading-relaxed">
                      {selectedDetailSession.aiSummary}
                    </div>
                  ) : (
                    <p className="text-xs text-stone-600 dark:text-stone-400 italic">
                      Ses kaydı veya ders notlarına dayanarak AI tarafından sohbet özeti çıkarmak için yukarıdaki "Rapor Oluştur" butonuna basabilirsiniz.
                    </p>
                  )}
                </div>

                {/* Calendar Sync & Reminders */}
                <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-stone-900 dark:text-stone-100">
                    <span className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Takvim Hatırlatıcı Kur</span>
                    </span>
                    <span className="text-[10px] text-stone-500 font-normal">30 Dk Önce Bildirim</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={getGoogleCalendarUrl(selectedDetailSession)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 min-w-[140px] px-3.5 py-2.5 rounded-xl bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-900 dark:text-stone-100 border border-stone-300 dark:border-stone-600 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Google Takvim'e Ekle</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => downloadIcsFile(selectedDetailSession)}
                      className="flex-1 min-w-[140px] px-3.5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs"
                    >
                      <CalendarIcon className="w-3.5 h-3.5 text-emerald-200" />
                      <span>Cihaz Takvimine Ekle</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer Share Action */}
              <div className="p-4 bg-stone-50 dark:bg-stone-800/80 border-t border-stone-200/80 dark:border-stone-800 flex items-center justify-between shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedDetailSession(null)}
                  className="px-4 py-2.5 rounded-2xl text-xs font-bold text-stone-600 hover:bg-stone-200/60 dark:text-stone-300 dark:hover:bg-stone-700 transition-colors"
                >
                  Kapat
                </button>

                <button
                  type="button"
                  onClick={() => handleCopyBroadcast(selectedDetailSession)}
                  className="px-5 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-2 shadow-sm active:scale-95 transition-all cursor-pointer"
                >
                  {copiedId === selectedDetailSession.id ? (
                    <>
                      <Check className="w-4 h-4 text-white" />
                      <span>Kopyalandı!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4 text-emerald-200" />
                      <span>WhatsApp Duyuru Metni Kopyala</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Sohbet Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-3xl p-6 w-full max-w-md shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Radio className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
              Yeni Sohbet / Tefsir Dersi Kaydet
            </h3>

            <div>
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                Sohbet / Dersi Konusu & Başlığı
              </label>
              <input
                type="text"
                required
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                placeholder="Örn: Mülk Sûresi Tefsiri veya İhlas ve Niyet Dersi"
                className="w-full bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 text-xs rounded-xl p-2.5 border border-stone-200 dark:border-stone-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                  Mekan / Cami / Cemaat
                </label>
                <input
                  type="text"
                  value={venueInput}
                  onChange={(e) => setVenueInput(e.target.value)}
                  placeholder="Örn: Fatih Camii, Gençlik Vakfı"
                  className="w-full bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 text-xs rounded-xl p-2.5 border border-stone-200 dark:border-stone-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                  Ders Kategorisi
                </label>
                <select
                  value={categoryInput}
                  onChange={(e) => setCategoryInput(e.target.value as SohbetSession['category'])}
                  className="w-full bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs rounded-xl p-2.5 border border-stone-200 dark:border-stone-700 focus:outline-none"
                >
                  <option value="Tefsir">Tefsir</option>
                  <option value="Hadis">Hadis</option>
                  <option value="Ahlak & İhlas">Ahlak & İhlas</option>
                  <option value="Siyer">Siyer</option>
                  <option value="Akaid">Akaid</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                Hoca Ders Notları & Açıklamaları
              </label>
              <textarea
                rows={3}
                value={teacherNotesInput}
                onChange={(e) => setTeacherNotesInput(e.target.value)}
                placeholder="Ders boyunca işlenen ana konular, ayet numaraları, tefsir açıklamaları..."
                className="w-full bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 text-xs rounded-xl p-2.5 border border-stone-200 dark:border-stone-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Nukte Addition */}
            <div>
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                Hikmetli Nükteler & Önemli Cümleler
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={nukteInput}
                  onChange={(e) => setNukteInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddNukte())}
                  placeholder="Vurgulanacak hikmetli söz veya nükteli cümle..."
                  className="flex-1 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs rounded-xl p-2 border border-stone-200 dark:border-stone-700 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddNukte}
                  className="px-3 py-2 rounded-xl bg-emerald-700 text-white font-bold text-xs hover:bg-emerald-800"
                >
                  Ekle
                </button>
              </div>

              {nukteList.length > 0 && (
                <div className="space-y-1">
                  {nukteList.map((n, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-emerald-50 dark:bg-stone-800 px-2.5 py-1 rounded-xl text-xs text-emerald-900 dark:text-emerald-300 border border-emerald-200/60 dark:border-stone-700"
                    >
                      <span>• {n}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveNukte(idx)}
                        className="text-rose-600 hover:text-rose-800"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Voice Recording & Speech Transcript Option */}
            <div className="space-y-2 p-3 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mic className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  <span className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                    {recordedVoiceUrl ? 'Ses kaydı eklendi' : 'Sohbet Ses Kaydı Al'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onOpenVoiceRecorder}
                  className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-semibold text-xs border border-rose-200 dark:border-rose-800 hover:bg-rose-100 transition-colors"
                >
                  {recordedVoiceUrl ? 'Yeniden Kaydet' : 'Ses Kaydet'}
                </button>
              </div>

              {/* Audio Transcript Field */}
              <div className="pt-2 border-t border-stone-200/60 dark:border-stone-700 space-y-1">
                <label className="text-[11px] font-bold text-stone-700 dark:text-stone-300 flex items-center justify-between">
                  <span>🎙️ Ses Kaydında Konuşulanlar (Transkript):</span>
                  <span className="text-[10px] text-stone-500 font-normal">AI özet bu metne göre üretilir</span>
                </label>
                <textarea
                  value={audioTranscriptInput}
                  onChange={(e) => setAudioTranscriptInput(e.target.value)}
                  placeholder="Mikrofondan alınan ses kaydı konuşmaları buraya otomatik aktarılır. Dilerseniz el ile de sohbet konuşma metnini yapıştırabilirsiniz..."
                  rows={2}
                  className="w-full p-2.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-800 dark:text-stone-100 focus:ring-1 focus:ring-emerald-500 outline-none resize-none"
                />
              </div>
            </div>

            {/* Submit & Cancel Buttons */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100 dark:border-stone-800">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-3.5 py-2 rounded-xl text-xs text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 font-medium"
              >
                Vazgeç
              </button>

              <button
                type="button"
                onClick={handleSaveSohbet}
                disabled={!titleInput.trim() || isGeneratingAi}
                className="px-4 py-2.5 rounded-xl bg-emerald-700 text-white font-bold text-xs hover:bg-emerald-800 shadow-2xs flex items-center gap-1.5 disabled:opacity-50 transition-all"
              >
                {isGeneratingAi ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 text-emerald-200" />
                )}
                <span>{isGeneratingAi ? 'AI Özeti Üretiliyor...' : 'Sohbeti Kaydet & Özetle'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
