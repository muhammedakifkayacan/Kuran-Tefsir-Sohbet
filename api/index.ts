import express from "express";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json({ limit: "10mb" }));

const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: { headers: { "User-Agent": "aistudio-build" } },
  });
};

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.post("/api/ai-assistant", async (req, res) => {
  try {
    const { prompt, contextType, verseText, surahName, verseNumber, studentData } = req.body;
    const ai = getAiClient();
    if (!ai) {
      return res.status(500).json({ error: "GEMINI_API_KEY bulunamadı. Lütfen Vercel Environment Variables kısmından GEMINI_API_KEY ekleyin." });
    }
    let systemInstruction = `Sen Kur'an-ı Kerim hocaları ve talebeleri için uzman bir İslami İlimler, Tecvit ve Eğitim Danışmanı yapay zeka asistanısın. Türkçe, nazik, özendirici, hürmetkâr ve pedagogik bir üslup kullan.`;
    if (contextType === "tajweed_explain") {
      systemInstruction += `\nÖzellikle ${surahName || "Süre"} ${verseNumber ? verseNumber + ". ayet" : ""} içindeki tecvit tecellilerini detaylandır.`;
    } else if (contextType === "parent_report") {
      systemInstruction += `\nÖğrenci velisine gönderilmek üzere WhatsApp / SMS mesajı taslağı oluştur.`;
    } else if (contextType === "memorization_tips") {
      systemInstruction += `\nHafızlık ve ezber sağlamlaştırma teknikleri konusunda tavsiyeler ver.`;
    }
    let userMessage = prompt;
    if (verseText) userMessage += `\n\nİlgili Ayet (${surahName || ""} ${verseNumber || ""}):\n"${verseText}"`;
    if (studentData) userMessage += `\n\nÖğrenci Bilgisi: ${JSON.stringify(studentData)}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: userMessage,
      config: { systemInstruction, temperature: 0.7 },
    });
    res.json({ response: response.text || "Yanıt oluşturulamadı." });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "Hata oluştu." });
  }
});

app.post("/api/generate-lesson-report", async (req, res) => {
  try {
    const { studentName, surahOrPage, ezberScore, tecvitScore, akicilikScore, teacherNotes, mistakes } = req.body;
    const ai = getAiClient();
    if (!ai) return res.status(500).json({ error: "GEMINI_API_KEY mevcut değil." });
    const prompt = `Aşağıdaki ders verilerine göre ${studentName} isimli öğrenci için detaylı ders karnesi ve veli bilgilendirme metni hazırla:\n- İşlenen Yer: ${surahOrPage}\n- Ezber Puanı: ${ezberScore}/100\n- Tecvit Puanı: ${tecvitScore}/100\n- Akıcılık Puanı: ${akicilikScore}/100\n- Hatalar: ${mistakes?.join(", ") || "Yok"}\n- Notlar: ${teacherNotes || "Harika ders."}`;
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: { temperature: 0.6 },
    });
    res.json({ report: response.text || "Rapor oluşturulamadı." });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "Hata oluştu." });
  }
});

app.post("/api/generate-sohbet-summary", async (req, res) => {
  try {
    const { title, venue, category, teacherNotes, keyNukteList, audioTranscript } = req.body;
    const ai = getAiClient();
    if (!ai) return res.status(500).json({ error: "GEMINI_API_KEY mevcut değil." });
    let prompt = `Sen uzman bir vaiz ve müfessirsiniz. Sohbet dersinin verilerine ve GERÇEK SES KAYDI TRANSKRİPTİNE (konuşulan metne) dayanarak hikmetli, derli toplu bir sohbet özeti ve cemaat duyuru metni hazırla:\n\n`;
    prompt += `- Konu: ${title || "Sohbet / Ders"}\n`;
    prompt += `- Mekan: ${venue || "Meclis"}\n`;
    prompt += `- Kategori: ${category || "Tefsir"}\n`;
    if (audioTranscript && audioTranscript.trim()) {
      prompt += `\n🎙️ GERÇEK SES KAYDINDAN ÇIKARILAN KONUŞMA METNİ (TRANSKRİPT):\n"${audioTranscript.trim()}"\n\n`;
    }
    if (teacherNotes) prompt += `- Notlar: ${teacherNotes}\n`;
    if (keyNukteList && keyNukteList.length > 0) prompt += `- Nükteler: ${keyNukteList.join("; ")}\n`;
    prompt += `\nLütfen şu başlıklarla yanıt ver: 1. 📖 Ses Kaydı & Ders Özeti 2. 💡 Öne Çıkan Nükteler 3. 💬 WhatsApp Paylaşım Mesajı`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: { temperature: 0.6 },
    });
    res.json({ summary: response.text || "Sohbet özeti oluşturulamadı." });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "Hata oluştu." });
  }
});

app.post("/api/quran-voice-search", async (req, res) => {
  try {
    const { transcript, audioBase64, mimeType } = req.body;
    let tarteelWhisperText = "";
    if (audioBase64) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        const audioBuffer = Buffer.from(audioBase64, "base64");
        const hfHeaders: Record<string, string> = { "Content-Type": mimeType || "audio/webm" };
        if (process.env.HF_TOKEN) hfHeaders["Authorization"] = `Bearer ${process.env.HF_TOKEN}`;
        const hfResponse = await fetch("https://api-inference.huggingface.co/models/tarteel-ai/whisper-base-ar-quran", {
          method: "POST",
          headers: hfHeaders,
          body: audioBuffer,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (hfResponse.ok) {
          const hfResult = await hfResponse.json();
          if (hfResult?.text) tarteelWhisperText = hfResult.text.trim();
        }
      } catch (e) {}
    }
    const finalText = tarteelWhisperText || transcript || "";
    res.json({
      success: true,
      text: finalText,
      engine: tarteelWhisperText ? "Tarteel AI Whisper (0 Kredi)" : "Tarayıcı Ses Motoru (0 Kredi)",
    });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "Hata oluştu." });
  }
});

export default app;
