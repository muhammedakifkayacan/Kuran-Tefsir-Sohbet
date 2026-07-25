import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Trash2, Check, AlertCircle, Download, ShieldCheck, HardDrive } from 'lucide-react';

interface VoiceRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveRecording: (audioUrl: string, audioTranscript?: string) => void;
  title?: string;
  subtitle?: string;
}

export const VoiceRecorderModal: React.FC<VoiceRecorderModalProps> = ({
  isOpen,
  onClose,
  onSaveRecording,
  title = 'Kayıt Al',
  subtitle = 'Ders, sohbet veya sesli not kaydet (Tarayıcıda %100 Ücretsiz)',
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [liveTranscript, setLiveTranscript] = useState<string>('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioPlaybackRef = useRef<HTMLAudioElement | null>(null);
  const wakeLockRef = useRef<any>(null);
  const silentAudioRef = useRef<HTMLAudioElement | null>(null);
  const isRecordingRef = useRef<boolean>(false);

  useEffect(() => {
    if (!isOpen) {
      handleReset();
    }
  }, [isOpen]);

  // Request Wake Lock to prevent screen sleep during recording
  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
      }
    } catch (e) {
      console.warn('Wake Lock request failed:', e);
    }
  };

  // Release Wake Lock
  const releaseWakeLock = () => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release().catch(() => {});
      wakeLockRef.current = null;
    }
  };

  // Start background audio keep-alive (looping silent audio track + mediaSession)
  const startBackgroundAudioKeepAlive = () => {
    try {
      if (!silentAudioRef.current) {
        // 1-second silent WAV base64
        const silentWav = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
        const audio = new Audio(silentWav);
        audio.loop = true;
        silentAudioRef.current = audio;
      }
      silentAudioRef.current.play().catch(() => {});

      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: '🎙️ Ders & Sohbet Ses Kaydı Alınıyor',
          artist: "Kur'an & Tefsir Uygulaması (Arka Planda Kayıtta)",
          album: 'Canlı Ses Kayıt Motoru',
        });
        navigator.mediaSession.setActionHandler('play', () => {});
        navigator.mediaSession.setActionHandler('pause', () => {});
      }
    } catch (e) {
      console.warn('Background audio keep-alive warning:', e);
    }
  };

  const stopBackgroundAudioKeepAlive = () => {
    try {
      if (silentAudioRef.current) {
        silentAudioRef.current.pause();
      }
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = null;
      }
    } catch (e) {}
  };

  const startRecording = async () => {
    setErrorMsg(null);
    setLiveTranscript('');
    isRecordingRef.current = true;

    // Enable Mobile WakeLock and Background Audio KeepAlive
    await requestWakeLock();
    startBackgroundAudioKeepAlive();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingTime(0);

      // Initialize Browser Speech Recognition concurrently with auto-restart on Mobile
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'tr-TR';

          recognition.onresult = (event: any) => {
            let fullText = '';
            for (let i = 0; i < event.results.length; i++) {
              fullText += event.results[i][0].transcript + ' ';
            }
            setLiveTranscript(fullText.trim());
          };

          // Continuous auto-restart on Mobile browser tab background/pause
          recognition.onend = () => {
            if (isRecordingRef.current && recognitionRef.current) {
              try {
                recognitionRef.current.start();
              } catch (e) {}
            }
          };

          recognition.start();
          recognitionRef.current = recognition;
        } catch (srErr) {
          console.warn('SpeechRecognition start error:', srErr);
        }
      }

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Microphone error:', err);
      setErrorMsg('Mikrofon erişimi alınamadı veya engellendi. Simüle kayıt modu aktif.');
      simulateRecording();
    }
  };

  const simulateRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    isRecordingRef.current = false;
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);

    releaseWakeLock();
    stopBackgroundAudioKeepAlive();

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else {
      const dummyBlob = new Blob(['simulated audio content'], { type: 'audio/webm' });
      setAudioUrl(URL.createObjectURL(dummyBlob));
    }
  };

  const handlePlayAudio = () => {
    if (!audioUrl) return;

    if (!audioPlaybackRef.current) {
      audioPlaybackRef.current = new Audio(audioUrl);
      audioPlaybackRef.current.onended = () => setIsPlaying(false);
    }

    if (isPlaying) {
      audioPlaybackRef.current.pause();
      setIsPlaying(false);
    } else {
      audioPlaybackRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleReset = () => {
    isRecordingRef.current = false;
    releaseWakeLock();
    stopBackgroundAudioKeepAlive();
    if (timerRef.current) clearInterval(timerRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setIsRecording(false);
    setRecordingTime(0);
    setAudioUrl(null);
    setLiveTranscript('');
    setIsPlaying(false);
  };

  const handleSave = () => {
    if (audioUrl) {
      onSaveRecording(audioUrl, liveTranscript.trim() || undefined);
      onClose();
    }
  };

  const handleDownloadAudio = () => {
    if (!audioUrl) return;
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = `kuran_ders_ses_kaydi_${new Date().toISOString().slice(0, 10)}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!isOpen) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 rounded-3xl p-5 w-full max-w-sm shadow-2xl space-y-4">
        {/* Header */}
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-stone-800 text-amber-900 dark:text-amber-300 flex items-center justify-center mx-auto mb-2 border border-amber-200 dark:border-stone-700">
            <Mic className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-stone-100">{title}</h3>
          <p className="text-xs text-slate-500 dark:text-stone-400 mt-0.5">{subtitle}</p>
        </div>

        {errorMsg && (
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Timer / Waveform visualizer */}
        <div className="bg-stone-50 dark:bg-stone-800/80 rounded-2xl p-4 text-center border border-stone-200 dark:border-stone-700">
          <span className="text-3xl font-mono font-bold text-slate-900 dark:text-stone-100">
            {formatTime(recordingTime)}
          </span>

          {isRecording && (
            <div className="flex items-center justify-center gap-1 mt-3">
              {[...Array(9)].map((_, i) => (
                <span
                  key={i}
                  className="w-1 bg-[#D4AF37] rounded-full animate-bounce"
                  style={{
                    height: `${Math.random() * 20 + 10}px`,
                    animationDelay: `${i * 0.15}s`,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex flex-col gap-3 w-full">
          {/* Live Transcript / Speech-to-Text Box */}
          {(isRecording || audioUrl || liveTranscript) && (
            <div className="w-full text-left space-y-1">
              <label className="text-[11px] font-bold text-stone-700 dark:text-stone-300 flex items-center justify-between">
                <span>🎙️ Ses Kaydı Transkripti (Konuşulan Metin):</span>
                {isRecording && <span className="text-amber-600 dark:text-amber-400 animate-pulse text-[10px]">● Canlı Çözümleniyor</span>}
              </label>
              <textarea
                value={liveTranscript}
                onChange={(e) => setLiveTranscript(e.target.value)}
                placeholder="Konuşulanlar buraya canlı aktarılır. Dilerseniz el ile de düzenleyebilirsiniz..."
                className="w-full h-20 p-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-800 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 resize-none focus:ring-1 focus:ring-amber-500 outline-none"
              />
            </div>
          )}

          <div className="flex items-center justify-center gap-3">
            {!isRecording && !audioUrl && (
              <button
                onClick={startRecording}
                className="w-14 h-14 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg shadow-rose-600/30 hover:scale-105 active:scale-95 transition-all"
              >
                <Mic className="w-6 h-6" />
              </button>
            )}

            {isRecording && (
              <button
                onClick={stopRecording}
                className="w-14 h-14 rounded-full bg-slate-900 dark:bg-amber-600 text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all animate-pulse"
              >
                <Square className="w-5 h-5 fill-current" />
              </button>
            )}

            {audioUrl && (
              <div className="flex flex-col gap-2.5 w-full">
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={handlePlayAudio}
                    className="w-12 h-12 rounded-full bg-[#1C1A17] text-[#F3EFE0] flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-[#F3EFE0] ml-0.5" />}
                  </button>

                  <button
                    onClick={handleReset}
                    className="w-10 h-10 rounded-full bg-stone-100 dark:bg-stone-800 text-slate-600 dark:text-stone-300 flex items-center justify-center hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 transition-colors"
                    title="Yeniden Çek"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={handleSave}
                    className="px-4 py-2.5 rounded-2xl bg-amber-800 hover:bg-amber-900 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                  >
                    <Check className="w-4 h-4 text-amber-300" />
                    Kaydet
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadAudio}
                  className="w-full py-2.5 px-3 rounded-2xl bg-emerald-50 dark:bg-stone-800 border border-emerald-200/80 dark:border-stone-700 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-emerald-100 dark:hover:bg-stone-700 transition-colors shadow-sm"
                >
                  <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Ses Dosyasını Cihaza İndir (.webm)</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 0 Kredi & Gizlilik Bilgilendirme Kutusu */}
        <div className="p-3 bg-stone-50 dark:bg-stone-800/80 border border-stone-200/80 dark:border-stone-700 rounded-2xl text-[11px] text-stone-600 dark:text-stone-300 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-stone-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>%100 Yerel Kayıt — 0 Kredi Harcar</span>
          </div>
          <p className="leading-relaxed text-slate-600 dark:text-stone-300">
            Kayıt tamamen tarayıcınızın geçici belleğinde gerçekleşir. 1 saatlik sohbet veya ders kaydı da alsanız sunucuya yüklenmez ve <strong>kredi harcamaz</strong>. Nota dönüştükten sonra sesi cihazınıza indirip sunucuda yer tutmadan saklayabilirsiniz.
          </p>
        </div>

        {/* Close Button */}
        <div className="text-center pt-2">
          <button
            onClick={onClose}
            className="text-xs text-slate-500 dark:text-stone-400 hover:text-slate-800 dark:hover:text-stone-200 font-medium cursor-pointer"
          >
            Vazgeç
          </button>
        </div>
      </div>
    </div>
  );
};
