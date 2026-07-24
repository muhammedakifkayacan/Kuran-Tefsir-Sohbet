import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Search, Copy, Check, Share2, Sparkles, X, Heart, Bookmark, Filter, Quote } from 'lucide-react';
import { RIYAZUS_SALIHIN_HADITHS, RiyazusHadith } from '../data/riyazusSalihinData';

interface RiyazusSalihinModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RiyazusSalihinModal: React.FC<RiyazusSalihinModalProps> = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedHadithId, setCopiedHadithId] = useState<number | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<number[]>([]);
  const [randomHadith, setRandomHadith] = useState<RiyazusHadith | null>(null);

  if (!isOpen) return null;

  const categories = ['all', 'İhlas & Niyet', 'Sabır & Şükür', 'Doğruluk (Sıdk)', 'Ahlak & Edep', 'Namaz & İbadet', 'Merhamet & Kardeşlik', 'Cömertlik & İnfak'];

  const filteredHadiths = RIYAZUS_SALIHIN_HADITHS.filter((h) => {
    const matchesCategory = selectedCategory === 'all' || h.category === selectedCategory;
    const matchesSearch =
      h.turkish.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.arabic.includes(searchQuery) ||
      h.ravi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.babName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCopyHadith = (hadith: RiyazusHadith) => {
    const textToCopy = `✨ Riyazü’s-Sâlihîn Hadîs-i Şerîf ✨\n\n📌 ${hadith.babName}\n\n"${hadith.turkish}"\n\n— ${hadith.ravi}\n(${hadith.source})\n\n📖 Kur'an & Tefsir Rehberi Uygulamasından Paylaşıldı`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedHadithId(hadith.id);
    setTimeout(() => setCopiedHadithId(null), 2000);
  };

  const handlePickRandom = () => {
    const idx = Math.floor(Math.random() * RIYAZUS_SALIHIN_HADITHS.length);
    setRandomHadith(RIYAZUS_SALIHIN_HADITHS[idx]);
  };

  const toggleBookmark = (id: number) => {
    if (bookmarkedIds.includes(id)) {
      setBookmarkedIds(bookmarkedIds.filter((b) => b !== id));
    } else {
      setBookmarkedIds([...bookmarkedIds, id]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-md animate-fade-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-stone-50 rounded-3xl border border-stone-200/90 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header Bar */}
        <div className="p-4 sm:p-6 bg-emerald-900 text-white flex items-center justify-between border-b border-emerald-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-800 border border-emerald-700 flex items-center justify-center text-emerald-200 font-bold shadow-xs">
              <BookOpen className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <h2 className="text-base sm:text-xl font-bold tracking-tight">Riyazü’s-Sâlihîn Hadîs-i Şerîfler</h2>
              <p className="text-xs text-emerald-200 font-medium">İmam Nevevî — Sahih Hadis Külliyatı & Hikmetler</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-emerald-800/80 hover:bg-emerald-800 text-emerald-200 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls & Search Toolbar */}
        <div className="p-4 bg-white border-b border-stone-200/80 space-y-3 shrink-0">
          <div className="flex flex-col sm:flex-row items-center gap-2">
            {/* Search input */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Hadis metni, konu veya ravi ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-stone-100 border border-stone-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-700/50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Random Hadith button */}
            <button
              onClick={handlePickRandom}
              className="px-4 py-2.5 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-950 font-bold text-xs border border-amber-200 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shrink-0 w-full sm:w-auto justify-center"
            >
              <Sparkles className="w-4 h-4 text-amber-700 animate-pulse" />
              <span>🎲 Rastgele Hadis Getir</span>
            </button>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200'
                }`}
              >
                {cat === 'all' ? 'Tüm Konular' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Random Highlight Modal Popup if Picked */}
        {randomHadith && (
          <div className="p-4 bg-amber-50/90 border-b border-amber-200/90 text-amber-950 flex flex-col gap-2 relative animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-800 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Rasgele Seçilen Hadîs-i Şerîf
              </span>
              <button
                onClick={() => setRandomHadith(null)}
                className="text-amber-800 hover:text-amber-950 text-xs font-bold"
              >
                Kapat
              </button>
            </div>
            <p className="font-serif text-lg text-right dir-rtl leading-relaxed text-stone-900">{randomHadith.arabic}</p>
            <p className="text-xs font-medium italic text-stone-800 leading-relaxed">"{randomHadith.turkish}"</p>
            <p className="text-[11px] font-bold text-amber-900">— {randomHadith.ravi} ({randomHadith.source})</p>
          </div>
        )}

        {/* Hadith List Container */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {filteredHadiths.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <Quote className="w-10 h-10 text-stone-300 mx-auto" />
              <p className="text-sm font-bold text-stone-600">Aradığınız kritere uygun hadîs-i şerîf bulunamadı.</p>
              <p className="text-xs text-stone-400">Arama terimini değiştirebilir veya tüm konular seçeneğine tıklayabilirsiniz.</p>
            </div>
          ) : (
            filteredHadiths.map((hadith) => {
              const isBookmarked = bookmarkedIds.includes(hadith.id);
              const isCopied = copiedHadithId === hadith.id;

              return (
                <div
                  key={hadith.id}
                  className="bg-white rounded-3xl p-5 border border-stone-200/90 shadow-2xs hover:shadow-md transition-all space-y-4"
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-xl bg-amber-100/80 text-amber-900 font-bold text-xs border border-amber-200">
                        {hadith.babName}
                      </span>
                      <span className="text-[11px] font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-lg">
                        {hadith.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleBookmark(hadith.id)}
                        className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                          isBookmarked ? 'bg-amber-100 text-amber-800' : 'hover:bg-stone-100 text-stone-400'
                        }`}
                        title="Favorilere Ekle"
                      >
                        <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current text-amber-700' : ''}`} />
                      </button>
                      <button
                        onClick={() => handleCopyHadith(hadith)}
                        className="p-1.5 rounded-xl hover:bg-stone-100 text-stone-500 transition-colors cursor-pointer"
                        title="Kopyala / Paylaş"
                      >
                        {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Arabic Text */}
                  <div className="text-right dir-rtl font-serif text-xl sm:text-2xl text-stone-900 leading-loose bg-amber-50/40 p-4 rounded-2xl border border-amber-100/60">
                    {hadith.arabic}
                  </div>

                  {/* Turkish Translation */}
                  <div className="text-xs sm:text-sm font-sans text-stone-800 leading-relaxed font-medium">
                    <span className="font-bold text-emerald-900">Meal: </span>
                    "{hadith.turkish}"
                  </div>

                  {/* Ravi & Source */}
                  <div className="flex flex-wrap items-center justify-between text-[11px] font-bold text-stone-500 pt-2 border-t border-stone-100">
                    <span className="text-emerald-800">Ravi: {hadith.ravi}</span>
                    <span className="text-stone-400">Kaynak: {hadith.source}</span>
                  </div>

                  {/* Hikmet / Tefsir Nüktesi */}
                  {hadith.explanation && (
                    <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80 text-[11px] font-medium text-stone-700 space-y-1">
                      <div className="font-bold text-amber-900 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-700" />
                        <span>Hadis Nüktesi & Açıklama:</span>
                      </div>
                      <p className="leading-relaxed">{hadith.explanation}</p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </motion.div>
    </div>
  );
};
