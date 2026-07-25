import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // Initialize Gemini AI Client lazily/safely
  const getAiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return null;
    }
    return new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  };

  // Health check API
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // AI Assistant Endpoint for Quran Lessons, Tajweed Explanations & Notes
  app.post("/api/ai-assistant", async (req, res) => {
    try {
      const { prompt, contextType, verseText, surahName, verseNumber, studentData } = req.body;
      const ai = getAiClient();

      if (!ai) {
        return res.status(500).json({
          error: "GEMINI_API_KEY bulunamadı. Lütfen Ayarlar > Secrets panelinden anahtarınızı kontrol edin.",
        });
      }

      let systemInstruction = `Sen Kur'an-ı Kerim hocaları ve talebeleri için uzman bir İslami İlimler, Tecvit ve Eğitim Danışmanı yapay zeka asistanısın. 
Türkçe, nazik, özendirici, hürmetkâr ve pedagogik bir üslup kullan. 
Kur'an tilaveti, tecvit kuralları, ayet meali, hafızlık teknikleri ve ders notu hazırlama konularında net, doğru ve anlaşılır cevaplar ver. 
Gerektiğinde maddeler halinde açıkla.`;

      if (contextType === "tajweed_explain") {
        systemInstruction += `\nÖzellikle ${surahName || "Süre"} ${verseNumber ? verseNumber + ". ayet" : ""} içindeki tecvit tecellilerini (Med-di Muttasıl, İxfâ, İzhâr, İdgam, İqlâb, Qalqala vb.) ve mahreç inceliklerini adım adım detaylandır.`;
      } else if (contextType === "parent_report") {
        systemInstruction += `\nÖğrenci velisine gönderilmek üzere kısa, nazik, teşvik edici ve ders durumunu özetleyen WhatsApp / SMS mesajı taslağı oluştur.`;
      } else if (contextType === "memorization_tips") {
        systemInstruction += `\nHafızlık ve ezber sağlamlaştırma (hasır/pişirme) teknikleri konusunda pratik tavsiyeler ver.`;
      }

      let userMessage = prompt;
      if (verseText) {
        userMessage += `\n\nİlgili Ayet (${surahName || ""} ${verseNumber || ""}):\n"${verseText}"`;
      }
      if (studentData) {
        userMessage += `\n\nÖğrenci Bilgisi: ${JSON.stringify(studentData)}`;
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: userMessage,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      const text = response.text || "Üzgünüm, yanıt oluşturulamadı.";
      res.json({ response: text });
    } catch (error: any) {
      console.error("AI Assistant API Error:", error);
      res.status(500).json({
        error: error?.message || "AI Asistan yanıt üretirken bir hata oluştu.",
      });
    }
  });

  // Generate Lesson Report Endpoint
  app.post("/api/generate-lesson-report", async (req, res) => {
    try {
      const { studentName, surahOrPage, ezberScore, tecvitScore, akicilikScore, teacherNotes, mistakes } = req.body;
      const ai = getAiClient();

      if (!ai) {
        return res.status(500).json({
          error: "GEMINI_API_KEY mevcut değil.",
        });
      }

      const prompt = `Aşağıdaki ders verilerine göre ${studentName} isimli öğrenci için detaylı ders karnesi ve veli bilgilendirme metni hazırla:
- İşlenen Yer: ${surahOrPage}
- Ezber Puanı: ${ezberScore}/100
- Tecvit Puanı: ${tecvitScore}/100
- Akıcılık & Mahreç Puanı: ${akicilikScore}/100
- Tespit Edilen Hatalar/Tekrarlar: ${mistakes?.join(", ") || "Yok"}
- Hocanın Notları: ${teacherNotes || "Harika bir ders geçti."}

Lütfen yanıtı şu 3 bölümde ver:
1. Ders Değerlendirme Özeti
2. Çalışılması Gereken Noktalar (Gelişim Alanları)
3. Veliye Gönderilecek Kısa Teşvik Mesajı (WhatsApp Uyumlu)`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          temperature: 0.6,
        },
      });

      res.json({ report: response.text || "Rapor oluşturulamadı." });
    } catch (error: any) {
      console.error("Lesson Report API Error:", error);
      res.status(500).json({ error: error?.message || "Rapor oluşturulurken hata oluştu." });
    }
  });

  // Generate Sohbet & Tefsir Summary & Broadcast Message Endpoint
  app.post("/api/generate-sohbet-summary", async (req, res) => {
    try {
      const { title, venue, category, teacherNotes, keyNukteList, audioTranscript } = req.body;
      const ai = getAiClient();

      if (!ai) {
        return res.status(500).json({ error: "GEMINI_API_KEY mevcut değil." });
      }

      let prompt = `Sen uzman bir vaiz, müfessir ve İslami Sohbet editörüsün.
Hocanın vermiş olduğu sohbet dersinin verilerine ve GERÇEK SES KAYDI TRANSKRİPTİNE (konuşulan metne) dayanarak hikmetli, derli toplu ve estetik bir sohbet özeti ve cemaat duyuru metni hazırla. Uydurma/sallama bilgi ekleme, yalnızca verilen konuşma metnine ve notlara dayan:\n\n`;

      prompt += `- Sohbet Konusu: ${title || "Sohbet / Tefsir Dersi"}\n`;
      prompt += `- Mekan / Cemaat: ${venue || "Sohbet Meclisi"}\n`;
      prompt += `- Kategori: ${category || "Tefsir"}\n`;

      if (audioTranscript && audioTranscript.trim()) {
        prompt += `\n🎙️ GERÇEK SES KAYDINDAN ÇIKARILAN KONUŞMA METNİ (TRANSKRİPT):\n"${audioTranscript.trim()}"\n\nLütfen özetini ve nüktelerini doğrudan yukarıdaki ses kaydı konuşmalarına dayandır.\n`;
      }

      if (teacherNotes) {
        prompt += `- Hocanın Aldığı Notlar: ${teacherNotes}\n`;
      }
      if (keyNukteList && keyNukteList.length > 0) {
        prompt += `- Önemli Nükteler: ${keyNukteList.join("; ")}\n`;
      }

      prompt += `\nLütfen yanıtı şu 3 net başlıkla oluştur:
1. 📖 Ses Kaydı & Ders Özeti (Konuşulan ana fikir ve tefekkür maddeleri)
2. 💡 Öne Çıkan Hikmetli Nükteler (Kilit cümleler)
3. 💬 Cemaate / Veli Grubuna Gönderilecek WhatsApp Paylaşım Mesajı (İmza: Saygılarımızla, Ders Notları)`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          temperature: 0.6,
        },
      });

      res.json({ summary: response.text || "Sohbet özeti oluşturulamadı." });
    } catch (error: any) {
      console.error("Sohbet Summary API Error:", error);
      res.status(500).json({ error: error?.message || "Sohbet özeti oluşturulurken hata oluştu." });
    }
  });

  // Tarteel AI Hugging Face Whisper Model Voice Search Endpoint
  app.post("/api/quran-voice-search", async (req, res) => {
    try {
      const { transcript, audioBase64, mimeType } = req.body;
      let tarteelWhisperText = "";
      let geminiAudioText = "";

      // 1. Primary Attempt: Hugging Face Tarteel AI Quran Whisper Model (tarteel-ai/whisper-base-ar-quran)
      if (audioBase64) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
          const audioBuffer = Buffer.from(audioBase64, "base64");
          const hfHeaders: Record<string, string> = {
            "Content-Type": mimeType || "audio/webm",
            "x-wait-for-model": "true", // Hugging Face serverless wait header
          };
          if (process.env.HF_TOKEN) {
            hfHeaders["Authorization"] = `Bearer ${process.env.HF_TOKEN}`;
          }

          const hfResponse = await fetch("https://api-inference.huggingface.co/models/tarteel-ai/whisper-base-ar-quran", {
            method: "POST",
            headers: hfHeaders,
            body: audioBuffer,
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          if (hfResponse.ok) {
            const hfResult = await hfResponse.json();
            if (hfResult && hfResult.text && typeof hfResult.text === "string" && hfResult.text.trim()) {
              tarteelWhisperText = hfResult.text.trim();
            }
          }
        } catch (hfErr) {
          console.warn("HF Tarteel AI error, falling back to Gemini Audio transcription:", hfErr);
        }

        // 2. Backup / Precision Booster: Gemini Audio Multimodal Transcription if HF did not return text
        if (!tarteelWhisperText) {
          try {
            const ai = getAiClient();
            if (ai) {
              const geminiRes = await ai.models.generateContent({
                model: "gemini-3.6-flash",
                contents: [
                  {
                    inlineData: {
                      mimeType: mimeType || "audio/webm",
                      data: audioBase64,
                    },
                  },
                  "Bu ses kaydında okunan Kur'an-ı Kerim ayetini veya kelimelerini sadece orijinal Arapça metin olarak çıkar. Yanıtında başka hiçbir metin veya açıklama yazma, sadece okunan Arapça kelimeleri yaz.",
                ],
              });
              if (geminiRes.text && geminiRes.text.trim()) {
                geminiAudioText = geminiRes.text.trim();
              }
            }
          } catch (geminiErr) {
            console.warn("Gemini Audio Transcription error:", geminiErr);
          }
        }
      }

      const finalText = tarteelWhisperText || geminiAudioText || transcript || "";
      const usedEngine = tarteelWhisperText
        ? "Tarteel AI Whisper (Hugging Face)"
        : geminiAudioText
        ? "Gemini Quran AI (Ses Analizi)"
        : "Canlı Ses Motoru";

      res.json({
        success: true,
        text: finalText,
        engine: usedEngine,
        tarteelUsed: Boolean(tarteelWhisperText),
      });
    } catch (error: any) {
      res.status(500).json({ error: error?.message || "Ses çözümlenirken hata oluştu." });
    }
  });

  // Riyazus Salihin AI Search & Tefsir Endpoint
  app.post("/api/riyazus-ai-search", async (req, res) => {
    try {
      const { query } = req.body;
      const ai = getAiClient();

      if (!ai) {
        return res.status(500).json({ error: "GEMINI_API_KEY mevcut değil." });
      }

      const prompt = `Sen İmam Nevevî'nin muazzam eseri "Riyâzü's-Sâlihîn" (1896 Hadis-i Şerif Külliyatı) konusunda uzman bir Hadis Alimi ve Müfessirsin.
Kullanıcının sorgusu: "${query}"

Lütfen İmam Nevevî'nin Riyâzü's-Sâlihîn eserinden ilgili sahih hadîs-i şerîfı/şerîfleri bul ve aşağıdaki düzenli formatta yanıtla:
1. 📖 Hadis Numarası, Kitap ve Bâb Başlığı (Örn: Riyâzü's-Sâlihîn, 1. Kitap: İhlas ve Niyet, 1. Bâb, Hadis No: 1)
2. 🕌 Arapça Metni (Orijinal harekeli Arapça hadis metni)
3. 💬 Türkçe Meali (Net, anlaşılır ve edebi Türkçe çevirisi)
4. 🎙️ Ravi ve Kaynak (Örn: Hz. Ömer r.a. - Buhârî, İman 41; Müslim, İmâre 155)
5. 💡 Hadis Nüktesi ve Fıkhi/Ahlaki Şerhi (Maddeler halinde günlük hayata iz düşümü)

Eğer kullanıcı belirli bir hadis numarası (örn: "Hadis 50", "120. Hadis") sordusa doğrudan o numaralı sahih hadisi getir.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          temperature: 0.5,
        },
      });

      res.json({ result: response.text || "İlgili hadis bulunamadı." });
    } catch (error: any) {
      console.error("Riyazus AI Search API Error:", error);
      res.status(500).json({ error: error?.message || "Hadis araması yapılırken hata oluştu." });
    }
  });

  // Vite middleware for dev / static for prod
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Kur'an Dersi Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
