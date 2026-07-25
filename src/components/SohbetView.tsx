import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Radio, Mic, Plus, MapPin, Sparkles, Share2, Trash2, Calendar as CalendarIcon, Clock, Check, RefreshCw, Volume2, ChevronDown, ChevronUp, Bell, ExternalLink } from 'lucide-react';
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

  // Expansion state for details
  const [expandedSessionIds, setExpandedSessionIds] = useState<Record<string, boolean>>({});

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
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });
      }
      setActiveRecordingSessionId(null);
    }
  }, [recordedVoiceUrl, recordedVoiceTranscript, activeRecordingSessionId, sohbetSessions, onUpdateSohbetSession]);

  // AI Summary State
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [activeAiSummarySessionId, setActiveAiSummarySessionId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedSessionIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

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

    // Auto-expand the newly created session
    setExpandedSessionIds((prev) => ({ ...prev, [newSohbet.id]: true }));

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
        session.aiSummary = data.summary;
        session.broadcastMessage = `*${session.title} - ${session.venue}*\n\n` + data.summary;
        setActiveAiSummarySessionId(session.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-5 pb-28 animate-fade-in w-full">
      {/* Light Clean Header & New Sohbet Button */}
      <div className="bg-stone-100/90 dark:bg-stone-800/90 rounded-3xl p-5 border border-stone-200/90 dark:border-stone-700 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Radio className="w-5 h-5 text-amber-800 dark:text-amber-400" />
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

        {/* Quick Search & Category Filter */}
        <div className="pt-3 border-t border-stone-200/80 dark:border-stone-700 space-y-2.5">
          <input
            type="text"
            placeholder="Mekan veya sohbet başlığı ara..."
            value={searchVenue}
            onChange={(e) => setSearchVenue(e.target.value)}
            className="w-full bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder-stone-400 text-xs rounded-xl px-3.5 py-2 border border-stone-200 dark:border-stone-700 focus:outline-none focus:ring-1 focus:ring-emerald-600"
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
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all text-[11px] font-semibold cursor-pointer ${
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

      {/* Sohbet Sessions List */}
      {filteredSessions.length === 0 ? (
        <div className="text-center py-10 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/90 dark:border-stone-700 p-6 space-y-2">
          <Radio className="w-10 h-10 text-stone-300 dark:text-stone-600 mx-auto" />
          <p className="text-sm font-bold text-stone-800 dark:text-stone-100">
            Kayıtlı sohbet veya tefsir dersi bulunamadı
          </p>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Yukarıdaki "Sohbet Ekle" butonuna basarak yeni bir sohbet dersi kaydedebilirsiniz.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSessions.map((session) => {
            const isExpanded = Boolean(expandedSessionIds[session.id]);

            return (
              <div
                key={session.id}
                className="bg-white dark:bg-stone-900 rounded-3xl p-4 sm:p-5 border border-stone-200/90 dark:border-stone-700 shadow-2xs space-y-3 transition-all"
              >
                {/* Category & Date Header */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-stone-800 text-amber-900 dark:text-amber-300 font-bold border border-amber-200 dark:border-stone-700 text-[10px]">
                      {session.category}
                    </span>
                    <span className="flex items-center gap-1 text-stone-600 dark:text-stone-300 font-medium text-[11px]">
                      <MapPin className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                      {session.venue}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-stone-500 dark:text-stone-400 font-mono text-[11px] flex items-center gap-1">
                      <CalendarIcon className="w-3 h-3 text-stone-400 dark:text-stone-500" />
                      {session.date}
                    </span>
                    <button
                      onClick={() => onDeleteSohbetSession(session.id)}
                      className="text-stone-400 hover:text-rose-600 p-1 transition-colors cursor-pointer"
                      title="Sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Title & Duration */}
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 leading-snug">
                    {session.title}
                  </h3>
                  {session.durationMinutes && (
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-700 dark:text-amber-400" />
                      Ders Süresi: {session.durationMinutes} Dakika
                    </p>
                  )}
                </div>

                {/* Collapsible Toggle Control */}
                <button
                  onClick={() => toggleExpand(session.id)}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-2xl bg-stone-100/80 dark:bg-stone-800 hover:bg-stone-200/60 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-bold transition-all border border-stone-200/80 dark:border-stone-700 cursor-pointer"
                >
                  <span>{isExpanded ? 'Detayları Gizle' : 'Detayları Göster'}</span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-amber-800 dark:text-amber-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-stone-500 dark:text-stone-400" />
                  )}
                </button>

                {/* Expanded Details Section */}
                {isExpanded && (
                  <div className="space-y-3 pt-2 border-t border-stone-100 dark:border-stone-800 animate-fade-in">
                    {/* Teacher Notes */}
                    <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-stone-800/80 border border-amber-200/70 dark:border-stone-700 text-xs text-stone-800 dark:text-stone-200 space-y-1">
                      <span className="font-bold text-amber-950 dark:text-amber-300 block">
                        Ders & Tefsir Notu:
                      </span>
                      <p className="leading-relaxed">{session.teacherNotes}</p>
                    </div>

                    {/* Key Nüktes */}
                    {session.keyNukteList && session.keyNukteList.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[11px] font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1">
                          💡 Hikmetli Nükteler & Cümleler:
                        </span>
                        <ul className="space-y-1 pl-2">
                          {session.keyNukteList.map((nukte, idx) => (
                            <li
                              key={idx}
                              className="text-xs text-stone-800 dark:text-stone-200 flex items-start gap-1.5"
                            >
                              <span className="text-amber-700 dark:text-amber-400 font-bold">•</span>
                              <span>{nukte}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Audio URL indicator & Voice Record Action */}
                    <div className="p-3 rounded-2xl bg-amber-50/80 dark:bg-stone-800/80 text-amber-900 dark:text-amber-200 text-xs font-semibold border border-amber-200/80 dark:border-stone-700 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950 dark:text-amber-300">
                          <Mic className="w-4 h-4 text-amber-800 dark:text-amber-400 shrink-0" />
                          <span>Ders Ses Kaydı</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveRecordingSessionId(session.id);
                            onOpenVoiceRecorder();
                          }}
                          className="px-3 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer active:scale-95"
                        >
                          <Mic className="w-3.5 h-3.5 text-amber-200 animate-pulse" />
                          <span>{session.audioRecordingUrl ? 'Yeniden Ses Kaydı Al' : '🎙️ Vakti Geldi, Kaydı Başlat'}</span>
                        </button>
                      </div>

                      {session.audioRecordingUrl ? (
                        <div className="flex items-center gap-2 pt-1 border-t border-amber-200/60 dark:border-stone-700">
                          <Volume2 className="w-4 h-4 text-amber-800 dark:text-amber-400 shrink-0" />
                          <span className="text-[11px] font-medium text-amber-900 dark:text-amber-300">Kayıtlı Ses:</span>
                          <audio src={session.audioRecordingUrl} controls className="h-7 w-full max-w-[220px] ml-auto" />
                        </div>
                      ) : (
                        <p className="text-[11px] text-amber-800/90 dark:text-stone-300 font-normal italic">
                          Bu sohbet dersini önceden oluşturdunuz. Vakti geldiğinde yukarıdaki "Kaydı Başlat" butonuna basarak canlı ses kaydı alabilirsiniz.
                        </p>
                      )}
                    </div>

                    {/* Calendar Integration & Notification Box */}
                    <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-stone-800/80 border border-amber-200/80 dark:border-stone-700 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950 dark:text-amber-300">
                          <Bell className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                          <span>Takvime Ekle & Bildirim Hatırlatıcı</span>
                        </div>
                        <span className="text-[10px] text-amber-800 dark:text-amber-300 bg-amber-100/80 dark:bg-stone-700/80 px-2 py-0.5 rounded-full font-medium">30 Dk Önce Hatırlatma</span>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 pt-1">
                        <a
                          href={getGoogleCalendarUrl(session)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 min-w-[140px] px-3 py-2 rounded-xl bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-100 border border-amber-300 dark:border-stone-700 text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                          <span>Google Takvim'e Ekle</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => downloadIcsFile(session)}
                          className="flex-1 min-w-[140px] px-3 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all"
                        >
                          <CalendarIcon className="w-3.5 h-3.5 text-amber-100" />
                          <span>Telefon / Apple Takvimi (.ics)</span>
                        </button>
                      </div>
                    </div>

                    {/* AI Generated Summary & WhatsApp Actions */}
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 dark:border-stone-800">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            if (!session.aiSummary) {
                              handleGenerateSummaryForExisting(session);
                            } else {
                              setActiveAiSummarySessionId(
                                activeAiSummarySessionId === session.id ? null : session.id
                              );
                            }
                          }}
                          disabled={isGeneratingAi}
                          className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-stone-800 hover:bg-amber-100 dark:hover:bg-stone-700 text-amber-900 dark:text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-all border border-amber-200/80 dark:border-stone-700 disabled:opacity-50"
                        >
                          {isGeneratingAi ? (
                            <RefreshCw className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 animate-spin" />
                          ) : (
                            <Sparkles className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                          )}
                          <span>
                            {isGeneratingAi
                              ? 'Ses Kaydı Analiz Ediliyor...'
                              : session.aiSummary
                              ? activeAiSummarySessionId === session.id
                                ? 'Özeti Gizle'
                                : 'AI Özeti Gör'
                              : 'AI Sohbet Özeti Çıkar'}
                          </span>
                        </button>

                        {session.aiSummary && (
                          <button
                            onClick={() => handleGenerateSummaryForExisting(session)}
                            disabled={isGeneratingAi}
                            title="Ses kaydına göre yeniden analiz et"
                            className="p-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-amber-100 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 hover:text-amber-900 dark:hover:text-amber-300 transition-colors"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingAi ? 'animate-spin' : ''}`} />
                          </button>
                        )}
                      </div>

                      <button
                        onClick={() => handleCopyBroadcast(session)}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all"
                      >
                        {copiedId === session.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-white" />
                            <span>Kopyalandı!</span>
                          </>
                        ) : (
                          <>
                            <Share2 className="w-3.5 h-3.5" />
                            <span>WhatsApp Duyurusu</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Display Audio Speech Transcript if available */}
                    {session.audioTranscript && (
                      <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-700 dark:text-stone-200 space-y-1">
                        <span className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1 text-[11px]">
                          <Mic className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" /> 🎙️ Ses Kaydı Konuşma Transkripti (Metin)
                        </span>
                        <p className="italic text-stone-600 dark:text-stone-300 line-clamp-3 hover:line-clamp-none transition-all">
                          "{session.audioTranscript}"
                        </p>
                      </div>
                    )}

                    {/* Display AI Summary accordion */}
                    {activeAiSummarySessionId === session.id && session.aiSummary && (
                      <div className="p-3.5 rounded-2xl bg-amber-50/90 dark:bg-stone-800/90 border border-amber-200 dark:border-stone-700 text-xs text-stone-800 dark:text-stone-200 whitespace-pre-wrap leading-relaxed animate-fade-in space-y-2">
                        <div className="flex items-center justify-between border-b border-amber-200/70 dark:border-stone-700 pb-2">
                          <div className="flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                            <span className="font-bold text-amber-950 dark:text-amber-300">
                              {session.audioTranscript || session.audioRecordingUrl
                                ? '🎙️ Gerçek Ses Kaydı Transkriptine Göre Derlenmiş AI Raporu'
                                : '📝 Ders Notlarına Göre Derlenmiş AI Raporu'}
                            </span>
                          </div>
                          <button
                            onClick={() => handleCopyBroadcast(session)}
                            className="text-[11px] font-bold text-amber-900 dark:text-amber-300 hover:underline"
                          >
                            Kopyala
                          </button>
                        </div>
                        <div>{session.aiSummary}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Sohbet Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-3xl p-6 w-full max-w-md shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Radio className="w-5 h-5 text-amber-700 dark:text-amber-400" />
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
                className="w-full bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 text-xs rounded-xl p-2.5 border border-stone-200 dark:border-stone-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
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
                className="w-full bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 text-xs rounded-xl p-2.5 border border-stone-200 dark:border-stone-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {/* Nukte Addition */}
            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">
                Hikmetli Nükteler & Önemli Cümleler
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={nukteInput}
                  onChange={(e) => setNukteInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddNukte())}
                  placeholder="Vurgulanacak hikmetli söz veya nükteli cümle..."
                  className="flex-1 bg-stone-50 text-stone-900 text-xs rounded-xl p-2 border border-stone-200 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddNukte}
                  className="px-3 py-2 rounded-xl bg-amber-700 text-white font-bold text-xs hover:bg-amber-800"
                >
                  Ekle
                </button>
              </div>

              {nukteList.length > 0 && (
                <div className="space-y-1">
                  {nukteList.map((n, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-amber-50 px-2.5 py-1 rounded-xl text-xs text-amber-900 border border-amber-200/60"
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
            <div className="space-y-2 p-3 rounded-2xl bg-stone-50 border border-stone-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mic className="w-4 h-4 text-rose-600" />
                  <span className="text-xs font-semibold text-stone-800">
                    {recordedVoiceUrl ? 'Ses kaydı eklendi' : 'Sohbet Ses Kaydı Al'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onOpenVoiceRecorder}
                  className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 font-semibold text-xs border border-rose-200 hover:bg-rose-100 transition-colors"
                >
                  {recordedVoiceUrl ? 'Yeniden Kaydet' : 'Ses Kaydet'}
                </button>
              </div>

              {/* Audio Transcript Field */}
              <div className="pt-2 border-t border-stone-200/60 space-y-1">
                <label className="text-[11px] font-bold text-stone-700 flex items-center justify-between">
                  <span>🎙️ Ses Kaydında Konuşulanlar (Transkript):</span>
                  <span className="text-[10px] text-stone-600 font-normal">AI özet bu metne göre üretilir</span>
                </label>
                <textarea
                  value={audioTranscriptInput}
                  onChange={(e) => setAudioTranscriptInput(e.target.value)}
                  placeholder="Mikrofondan alınan ses kaydı konuşmaları buraya otomatik aktarılır. Dilerseniz el ile de sohbet konuşma metnini yapıştırabilirsiniz..."
                  rows={2}
                  className="w-full p-2.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-800 focus:ring-1 focus:ring-amber-500 outline-none resize-none"
                />
              </div>
            </div>

            {/* Submit & Cancel Buttons */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-3.5 py-2 rounded-xl text-xs text-stone-600 hover:bg-stone-100 font-medium"
              >
                Vazgeç
              </button>

              <button
                type="button"
                onClick={handleSaveSohbet}
                disabled={!titleInput.trim() || isGeneratingAi}
                className="px-4 py-2.5 rounded-xl bg-amber-700 text-white font-bold text-xs hover:bg-amber-800 shadow-2xs flex items-center gap-1.5 disabled:opacity-50 transition-all"
              >
                {isGeneratingAi ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 text-amber-200" />
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
