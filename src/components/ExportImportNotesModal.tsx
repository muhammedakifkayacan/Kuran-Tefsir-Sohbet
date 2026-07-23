import React, { useState } from 'react';
import { Download, Upload, Filter, Copy, Check, FileText, FileCode, AlertCircle, X, Sparkles, FileSpreadsheet, Cloud } from 'lucide-react';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { VerseNote } from '../types';
import { QURAN_SURAHS } from '../data/quranData';

interface ExportImportNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  verseNotes: VerseNote[];
  onImportNotes: (importedNotes: VerseNote[], mode: 'merge' | 'replace') => void;
}

export const ExportImportNotesModal: React.FC<ExportImportNotesModalProps> = ({
  isOpen,
  onClose,
  verseNotes,
  onImportNotes,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');

  // Export Filter States
  const [selectedSurahId, setSelectedSurahId] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [selectedDateRange, setSelectedDateRange] = useState<'all' | '7days' | '30days'>('all');
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  // Toast / Copy Feedback State
  const [copySuccess, setCopySuccess] = useState(false);
  const [driveMsg, setDriveMsg] = useState<string | null>(null);

  // Import States
  const [importFileContent, setImportFileContent] = useState<VerseNote[] | null>(null);
  const [importFileName, setImportFileName] = useState<string>('');
  const [importError, setImportError] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filter Logic
  const filteredNotes = verseNotes.filter((note) => {
    if (selectedSurahId !== 'all' && note.surahId !== Number(selectedSurahId)) {
      return false;
    }
    if (selectedTag !== 'all' && note.tag !== selectedTag) {
      return false;
    }
    if (searchKeyword.trim() !== '') {
      const kw = searchKeyword.toLowerCase();
      const matchText = note.noteText ? note.noteText.toLowerCase().includes(kw) : false;
      const matchSurah = note.surahName ? note.surahName.toLowerCase().includes(kw) : false;
      if (!matchText && !matchSurah) return false;
    }
    if (selectedDateRange !== 'all') {
      const noteDate = new Date(note.createdAt).getTime();
      const now = new Date().getTime();
      const daysDiff = (now - noteDate) / (1000 * 3600 * 24);
      if (selectedDateRange === '7days' && daysDiff > 7) return false;
      if (selectedDateRange === '30days' && daysDiff > 30) return false;
    }
    return true;
  });

  const availableSurahIds = Array.from(new Set(verseNotes.map((n) => n.surahId)));

  // Generate Plain Text Format
  const generateFormattedText = () => {
    let report = `=========================================\n`;
    report += `📖 KUR'AN-I KERİM DERS VE TEFSİR NOTLARI RAPORU\n`;
    report += `Oluşturulma Tarihi: ${new Date().toLocaleString('tr-TR')}\n`;
    report += `Toplam Not Sayısı: ${filteredNotes.length}\n`;
    report += `=========================================\n\n`;

    filteredNotes.forEach((n, idx) => {
      report += `[${idx + 1}] ${n.surahName.toUpperCase()} — ${n.verseNumber}. AYET\n`;
      report += `Kategori / Etiket: ${n.tag}\n`;
      report += `Tarih: ${n.createdAt}\n`;
      report += `Not: "${n.noteText}"\n`;
      report += `-----------------------------------------\n\n`;
    });

    return report;
  };

  // Download Native Word Document (.docx)
  const handleDownloadDocx = async () => {
    const docParagraphs: Paragraph[] = [
      new Paragraph({
        text: "KUR'AN-I KERİM DERS VE TEFSİR NOTLARI",
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR')} | Toplam ${filteredNotes.length} Not`,
            italics: true,
            color: "666666",
          }),
        ],
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({ text: "" }),
    ];

    filteredNotes.forEach((n, idx) => {
      docParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${idx + 1}. ${n.surahName} Sûresi - ${n.verseNumber}. Ayet`,
              bold: true,
              size: 24,
              color: "B8860B", // Gold tone
            }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `Kategori: ${n.tag}  |  Tarih: ${n.createdAt}`, size: 18, color: "555555" }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `Not: ${n.noteText}`, size: 22 }),
          ],
        }),
        new Paragraph({ text: "--------------------------------------------------------------------------------------------------" }),
        new Paragraph({ text: "" })
      );
    });

    const doc = new Document({
      sections: [{ children: docParagraphs }],
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Kuran_Ders_Notlari_${new Date().toISOString().substring(0, 10)}.docx`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Save to Google Drive / Google Docs simulation/export
  const handleSaveToGoogleDrive = () => {
    handleDownloadDocx();
    setDriveMsg("Word (.docx) belgesi hazırlandı! Google Drive'a veya Google Dokümanlar'a yükleyebilirsiniz.");
    setTimeout(() => setDriveMsg(null), 4000);
  };

  // Download JSON
  const handleDownloadJson = () => {
    const dataObj = {
      app: 'Kuran-Ders-Asistani',
      version: '1.0',
      exportDate: new Date().toISOString(),
      notesCount: filteredNotes.length,
      notes: filteredNotes,
    };
    const jsonStr = JSON.stringify(dataObj, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Kuran_Notes_Yedek_${new Date().toISOString().substring(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Copy to Clipboard
  const handleCopyToClipboard = () => {
    const txt = generateFormattedText();
    navigator.clipboard.writeText(txt);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 3000);
  };

  // Import Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    setImportSuccessMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const rawJson = JSON.parse(event.target?.result as string);
        let extractedNotes: VerseNote[] = [];

        if (Array.isArray(rawJson)) {
          extractedNotes = rawJson;
        } else if (rawJson && Array.isArray(rawJson.notes)) {
          extractedNotes = rawJson.notes;
        } else {
          throw new Error('Geçersiz dosya formatı. Lütfen geçerli bir yedek JSON dosyası seçin.');
        }

        const isValid = extractedNotes.every(
          (n) => n && typeof n.noteText === 'string' && typeof n.surahName === 'string'
        );

        if (!isValid || extractedNotes.length === 0) {
          throw new Error('Dosya içeriğinde geçerli ayet notu bulunamadı.');
        }

        setImportFileContent(extractedNotes);
      } catch (err: any) {
        setImportError(err.message || 'JSON dosyası okunamadı veya bozuk.');
        setImportFileContent(null);
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    if (!importFileContent) return;
    onImportNotes(importFileContent, importMode);
    setImportSuccessMsg(`${importFileContent.length} adet not başarıyla içe aktarıldı!`);
    setTimeout(() => {
      setImportSuccessMsg(null);
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-fade-in">
      <div className="bg-white/95 text-slate-900 border border-white/60 shadow-2xl rounded-[32px] max-w-xl w-full p-6 sm:p-7 space-y-5 relative overflow-hidden backdrop-blur-2xl">
        
        {/* Apple Style Top Glow */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-emerald-500 to-amber-600" />

        {/* Header */}
        <div className="flex items-center justify-between pr-8">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-900 border border-amber-200/80 flex items-center justify-center font-bold">
              <Download className="w-5 h-5 text-amber-800" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900">
                Not Yönetimi & Dışa/İçe Aktar
              </h2>
              <p className="text-xs text-slate-500">
                Word (.docx), Google Drive, JSON yedekleme ve filtreli aktarım
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-stone-100 rounded-2xl">
          <button
            onClick={() => setActiveTab('export')}
            className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'export'
                ? 'bg-white text-amber-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Download className="w-4 h-4 text-amber-600" />
            <span>Dışa Aktar ({filteredNotes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('import')}
            className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'import'
                ? 'bg-white text-emerald-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-4 h-4 text-emerald-600" />
            <span>Toplu İçe Aktar</span>
          </button>
        </div>

        {activeTab === 'export' ? (
          <div className="space-y-4">
            {/* Filter Section */}
            <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-amber-700" />
                  Dışa Aktarma Filtreleri
                </span>

                <button
                  onClick={() => {
                    setSelectedSurahId('all');
                    setSelectedTag('all');
                    setSelectedDateRange('all');
                    setSearchKeyword('');
                  }}
                  className="text-[11px] text-amber-800 hover:underline font-semibold"
                >
                  Filtreleri Sıfırla
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Sûre Seçimi
                  </label>
                  <select
                    value={selectedSurahId}
                    onChange={(e) => setSelectedSurahId(e.target.value)}
                    className="w-full text-xs font-semibold bg-white border border-stone-200 rounded-xl px-2.5 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="all">Tüm Sûreler ({verseNotes.length} not)</option>
                    {availableSurahIds.map((sid) => {
                      const surahObj = QURAN_SURAHS.find((s) => s.id === sid);
                      const count = verseNotes.filter((n) => n.surahId === sid).length;
                      return (
                        <option key={sid} value={sid}>
                          {surahObj ? surahObj.nameTurkish : `Sûre ${sid}`} ({count} not)
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Not Kategori / Etiketi
                  </label>
                  <select
                    value={selectedTag}
                    onChange={(e) => setSelectedTag(e.target.value)}
                    className="w-full text-xs font-semibold bg-white border border-stone-200 rounded-xl px-2.5 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="all">Tüm Kategoriler</option>
                    <option value="Tecvit">Tecvit Notu</option>
                    <option value="Tefsir Notu">Tefsir Notu</option>
                    <option value="Hikmet">Hikmetli Söz</option>
                    <option value="Önemli">Önemli</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Tarih Aralığı
                  </label>
                  <select
                    value={selectedDateRange}
                    onChange={(e) => setSelectedDateRange(e.target.value as any)}
                    className="w-full text-xs font-semibold bg-white border border-stone-200 rounded-xl px-2.5 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="all">Tüm Zamanlar</option>
                    <option value="7days">Son 7 Gün</option>
                    <option value="30days">Son 30 Gün</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Metin Arama
                  </label>
                  <input
                    type="text"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    placeholder="Arama kelimesi..."
                    className="w-full text-xs bg-white border border-stone-200 rounded-xl px-2.5 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Live Filter Count Indicator & Toasts */}
            <div className="flex items-center justify-between text-xs font-semibold px-1">
              <span className="text-slate-600">
                Seçilen Kriterlere Uyan: <b className="text-amber-900">{filteredNotes.length} Not</b>
              </span>

              {copySuccess && (
                <span className="text-emerald-700 font-bold flex items-center gap-1 animate-fade-in">
                  <Check className="w-3.5 h-3.5" />
                  Panoya kopyalandı!
                </span>
              )}
            </div>

            {driveMsg && (
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center gap-2 font-semibold animate-fade-in">
                <Cloud className="w-4 h-4 text-blue-600 shrink-0" />
                <span>{driveMsg}</span>
              </div>
            )}

            {/* Export Format Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* Word (.docx) */}
              <button
                disabled={filteredNotes.length === 0}
                onClick={handleDownloadDocx}
                className="p-3 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-xs flex flex-col items-center justify-center gap-1 shadow-sm active:scale-95 transition-all"
              >
                <FileText className="w-5 h-5 text-blue-100" />
                <span>Word (.docx)</span>
              </button>

              {/* Google Drive / Docs */}
              <button
                disabled={filteredNotes.length === 0}
                onClick={handleSaveToGoogleDrive}
                className="p-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold text-xs flex flex-col items-center justify-center gap-1 shadow-sm active:scale-95 transition-all"
              >
                <Cloud className="w-5 h-5 text-emerald-100" />
                <span>Google Drive</span>
              </button>

              {/* JSON Backup */}
              <button
                disabled={filteredNotes.length === 0}
                onClick={handleDownloadJson}
                className="p-3 rounded-2xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white font-bold text-xs flex flex-col items-center justify-center gap-1 shadow-sm active:scale-95 transition-all"
              >
                <FileCode className="w-5 h-5 text-amber-100" />
                <span>JSON Yedek</span>
              </button>

              {/* Copy */}
              <button
                disabled={filteredNotes.length === 0}
                onClick={handleCopyToClipboard}
                className="p-3 rounded-2xl bg-white border border-stone-200 hover:bg-stone-50 disabled:opacity-40 text-slate-800 font-bold text-xs flex flex-col items-center justify-center gap-1 shadow-sm active:scale-95 transition-all"
              >
                <Copy className="w-5 h-5 text-stone-700" />
                <span>Panoya Al</span>
              </button>
            </div>
          </div>
        ) : (
          /* Import Tab */
          <div className="space-y-4">
            <div className="border-2 border-dashed border-stone-200 hover:border-emerald-500/60 rounded-2xl p-6 text-center space-y-3 bg-stone-50 transition-colors">
              <Upload className="w-8 h-8 text-emerald-600 mx-auto" />
              <div>
                <p className="text-xs font-bold text-slate-800">
                  JSON Yedek Dosyasını Yükleyin
                </p>
                <p className="text-[11px] text-slate-500">
                  Daha önce indirdiğiniz <code className="bg-stone-200 px-1 rounded">.json</code> formatındaki not yedek dosyanızı seçin.
                </p>
              </div>

              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
                id="json-file-input"
              />
              <label
                htmlFor="json-file-input"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-sm active:scale-95 transition-all"
              >
                <span>Dosya Seç</span>
              </label>

              {importFileName && (
                <p className="text-xs font-mono text-emerald-800 pt-1 font-semibold">
                  📄 {importFileName}
                </p>
              )}
            </div>

            {importError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{importError}</span>
              </div>
            )}

            {importSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2 font-bold animate-fade-in">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>{importSuccessMsg}</span>
              </div>
            )}

            {importFileContent && !importSuccessMsg && (
              <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-950">
                    Tespit Edilen Notlar: <b>{importFileContent.length} Adet</b>
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-md font-bold">
                    Hazır
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    Aktarım Yöntemi:
                  </label>
                  <div className="flex gap-2">
                    <label className="flex-1 flex items-center gap-2 p-2.5 rounded-xl bg-white border border-stone-200 cursor-pointer text-[11px] font-semibold">
                      <input
                        type="radio"
                        name="importMode"
                        checked={importMode === 'merge'}
                        onChange={() => setImportMode('merge')}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Mevcut notların üzerine ekle</span>
                    </label>

                    <label className="flex-1 flex items-center gap-2 p-2.5 rounded-xl bg-white border border-stone-200 cursor-pointer text-[11px] font-semibold">
                      <input
                        type="radio"
                        name="importMode"
                        checked={importMode === 'replace'}
                        onChange={() => setImportMode('replace')}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Mevcutları sil ve değiştir</span>
                    </label>
                  </div>
                </div>

                <button
                  onClick={handleConfirmImport}
                  className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>İçe Aktarmayı Tamamla ({importFileContent.length} Not)</span>
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
