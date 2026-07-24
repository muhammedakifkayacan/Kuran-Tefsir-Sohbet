import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Repeat, X } from 'lucide-react';
import { Ayah, Reciter } from '../types';
import { RECITERS } from '../data/quranData';

interface AudioPlayerBarProps {
  currentAyah: Ayah | null;
  surahId?: number;
  surahName: string;
  isPlaying: boolean;
  onPlayPause: () => void;
  onNextAyah?: () => void;
  onPrevAyah?: () => void;
  selectedReciter: Reciter;
  onSelectReciter: (reciter: Reciter) => void;
  onClose?: () => void;
  playbackRate: number;
  setPlaybackRate: (rate: number) => void;
}

export const AudioPlayerBar: React.FC<AudioPlayerBarProps> = ({
  currentAyah,
  surahId,
  surahName,
  isPlaying,
  onPlayPause,
  onNextAyah,
  onPrevAyah,
  selectedReciter,
  onSelectReciter,
  onClose,
  playbackRate,
  setPlaybackRate,
}) => {
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Helper to dynamically calculate EveryAyah audio URL based on selected reciter
  const getAudioUrlForReciter = (reciter: Reciter, sId?: number, ayahObj?: Ayah | null) => {
    if (!ayahObj) return '';
    if (reciter?.baseUrl && sId && ayahObj.number) {
      const pad = (n: number, z = 3) => String(n).padStart(z, '0');
      return `${reciter.baseUrl}${pad(sId)}${pad(ayahObj.number)}.mp3`;
    }
    return ayahObj.audioUrl || '';
  };

  useEffect(() => {
    if (!currentAyah) return;

    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    const audio = audioRef.current;
    
    const targetAudioUrl = getAudioUrlForReciter(selectedReciter, surahId, currentAyah);

    // Only set audio.src if URL actually changed to prevent resetting currentTime on pause/resume
    if (!audio.src || (audio.src !== targetAudioUrl && !audio.src.endsWith(targetAudioUrl))) {
      audio.src = targetAudioUrl;
      audio.load();
    }
    audio.playbackRate = playbackRate;
    audio.loop = isLooping;

    const handleTimeUpdate = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      if (!isLooping && onNextAyah) {
        onNextAyah();
      } else if (!isLooping) {
        onPlayPause();
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    if (isPlaying) {
      audio.play().catch((err) => console.log('Audio autoplay prevented:', err));
    } else {
      audio.pause();
    }

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentAyah, surahId, selectedReciter, isPlaying]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = isLooping;
    }
  }, [isLooping]);

  if (!currentAyah) return null;

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = parseFloat(e.target.value);
    if (audioRef.current && audioRef.current.duration) {
      audioRef.current.currentTime = (newProgress / 100) * audioRef.current.duration;
      setProgress(newProgress);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 40, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 40, opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 450, damping: 28 }}
        className="fixed bottom-16 left-0 right-0 z-30 px-4 max-w-lg mx-auto pointer-events-auto"
      >
        <div className="bg-stone-50/95 text-stone-900 backdrop-blur-xl rounded-2xl p-4 border border-stone-200/90 shadow-xl space-y-2.5">
        {/* Progress Bar */}
        <div className="relative w-full h-1.5 bg-stone-200 rounded-full overflow-hidden group cursor-pointer">
          <input
            type="range"
            min="0"
            max="100"
            value={progress || 0}
            onChange={handleSeek}
            className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
          />
          <div
            className="h-full bg-amber-700 rounded-full transition-all duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Info & Reciter Row */}
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-amber-950 truncate">
              {surahName} — {currentAyah.number}. Ayet
            </p>
            <p className="text-[11px] text-stone-600 truncate font-serif dir-rtl text-right">
              {currentAyah.arabic}
            </p>
          </div>

          {/* Reciter Selector */}
          <select
            value={selectedReciter.id}
            onChange={(e) => {
              const r = RECITERS.find((rec) => rec.id === e.target.value);
              if (r) onSelectReciter(r);
            }}
            className="text-[10px] bg-white text-stone-800 border border-stone-200 rounded-lg px-2.5 py-1 font-semibold focus:outline-none"
          >
            {RECITERS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name.split(' ')[0]}
              </option>
            ))}
          </select>

          {onClose && (
            <button
              onClick={onClose}
              className="text-stone-400 hover:text-stone-800 p-1 rounded-md transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between pt-1">
          {/* Speed Rate Button */}
          <button
            onClick={() => {
              const rates = [0.75, 1.0, 1.25];
              const idx = rates.indexOf(playbackRate);
              const nextRate = rates[(idx + 1) % rates.length];
              setPlaybackRate(nextRate);
            }}
            className="text-[10px] bg-amber-50 hover:bg-amber-100 text-amber-900 font-mono font-bold px-2.5 py-1 rounded-md border border-amber-200"
            title="Okuma Hızı"
          >
            {playbackRate}x
          </button>

          {/* Repeat Ayah */}
          <button
            onClick={() => setIsLooping(!isLooping)}
            className={`p-1.5 rounded-md text-xs transition-colors ${
              isLooping ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'text-stone-500 hover:text-stone-900'
            }`}
            title="Ayeti Tekrarla"
          >
            <Repeat className="w-3.5 h-3.5" />
          </button>

          {/* Main Controls: Prev - Play/Pause - Next */}
          <div className="flex items-center gap-2">
            <button
              onClick={onPrevAyah}
              className="p-1.5 text-stone-600 hover:text-stone-900 transition-colors"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={onPlayPause}
              className="w-8 h-8 rounded-full bg-amber-700 hover:bg-amber-800 text-white flex items-center justify-center shadow-2xs hover:scale-105 active:scale-95 transition-all"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 text-white fill-white" />
              ) : (
                <Play className="w-4 h-4 fill-white ml-0.5 text-white" />
              )}
            </button>

            <button
              onClick={onNextAyah}
              className="p-1.5 text-stone-600 hover:text-stone-900 transition-colors"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Mute Toggle */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-1.5 text-stone-500 hover:text-stone-900 transition-colors"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-600" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
      </motion.div>
    </AnimatePresence>
  );
};
