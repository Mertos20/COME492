import { Router } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { AuthRequest, requireAuth } from "../middleware/auth";
import User from "../models/User";

const router = Router();

const getApiKey = (): string | undefined => {
  return process.env.GEMINI_API_KEY?.trim();
};

let genAI: GoogleGenerativeAI | null = null;

const initGenAI = (): GoogleGenerativeAI => {
  if (genAI) return genAI;
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in .env file");
  }
  genAI = new GoogleGenerativeAI(apiKey);
  return genAI;
};

const INVESTMENT_SYSTEM_PROMPT = `Sen son derece deneyimli, profesyonel ve analitik bir üst düzey yatırım danışmanı asistanısın (Gemini AI). Amacın kullanıcılara finans, yatırım, kripto para, borsa, emtia ve portföy yönetimi konularında derinlemesine, rasyonel ve yüksek kalitede rehberlik sunmaktır.

Kurallar:
1. Sadece Finans: Sadece yatırım, ekonomi ve finans konularında yardımcı ol. Farklı konularda (örn. yemek tarifi, yazılım, günlük sohbet) gelen soruları "Özür dilerim, uzmanlık alanım sadece finans ve yatırımdır." diyerek nazikçe reddet.
2. Profesyonel Üslup: Cevapların kurumsal bir analist düzeyinde, anlaşılır ama teknik olarak tatmin edici olsun.
3. Yapılandırılmış Anlatım: Okunabilirliği artırmak için madde işaretleri kullan, konuyu giriş, analiz ve sonuç olarak yapılandır. Kısa ve öz ol, ancak önemli detayları atlama.
4. Risk ve Strateji: Stratejileri açıklarken daima risk yönetimi (stop-loss, portföy çeşitlendirmesi, risk/ödül oranı) kavramlarını vurgula.
5. Yasal Uyarı: En sonda ufak bir not olarak verilen bilgilerin yatırım tavsiyesi olmadığını, nihai kararın kullanıcıya ait olduğunu profesyonelce belirt.`;

router.post("/chat", requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Yetkilendirilmis" });
    }

    const message = String(req.body.message || "").trim();

    if (!message) {
      return res.status(400).json({ response: "Lütfen bir soru yazın." });
    }

    // Check query limit based on membership tier
    const today = new Date().toISOString().split("T")[0];
    if (user.lastAiQueryDate !== today) {
      user.aiQueriesToday = 0;
      user.lastAiQueryDate = today;
    }

    let limit = 0;
    let limitName = "Free";
    if (user.isAdmin) {
      limit = Infinity;
    } else if (user.membership === "gold") {
      limit = Infinity;
    } else if (user.membership === "silver") {
      limit = 20;
      limitName = "Silver";
    } else if (user.membership === "bronze") {
      limit = 5;
      limitName = "Bronze";
    } else {
      limit = 2; // Free
      limitName = "Free";
    }

    if (user.aiQueriesToday >= limit) {
      return res.status(403).json({
        message: `Günlük AI soru limitinize ulaştınız (${limitName} üyelik için limit ${limit} sorudur). Limitlerinizi kaldırmak için üyeliğinizi yükseltin.`
      });
    }

    // Check API key
    let genAI: GoogleGenerativeAI;
    try {
      genAI = initGenAI();
    } catch (error) {
      console.error("❌ Gemini API Key Error:", error);
      return res.status(500).json({
        response: "⚠️ API key is not configured. Please check root .env file.\nTo add Gemini API key: https://ai.google.dev/",
      });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: INVESTMENT_SYSTEM_PROMPT,
    });

    const result = await model.generateContent(message);
    const response = result.response;
    const text = response.text();

    // Increment user queries on success
    if (user.lastAiQueryDate !== today) {
      // New day — reset counter to 1
      await User.findByIdAndUpdate(user._id, {
        $set: { lastAiQueryDate: today, aiQueriesToday: 1 }
      });
    } else {
      await User.findByIdAndUpdate(user._id, {
        $inc: { aiQueriesToday: 1 }
      });
    }

    res.json({ response: text });
  } catch (error: any) {
    console.error("❌ Gemini API Error:", {
      message: error.message,
      status: error.status,
    });
    res.status(500).json({
      response: `⚠️ Gemini API ile iletişim kurulamadı. Sunucu loglarını kontrol edin.`,
    });
  }
});

router.post("/analyze-news", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { title, summary } = req.body;
    if (!title) {
      return res.status(400).json({ message: "Haber başlığı gerekli" });
    }

    const ai = initGenAI();
    const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Aşağıdaki haber metnini yatırımcı gözüyle analiz et. Piyasa veya ilgili varlıklar için duyarlılık (sentiment) nedir?
SADECE üç kelimeden birini dön: POZİTİF, NEGATİF, NÖTR. Başka hiçbir şey yazma.

Haber Başlığı: ${title}
Haber Özeti: ${summary || ""}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim().toLocaleUpperCase('tr-TR');

    let sentiment = "NÖTR";
    if (responseText.includes("POZİTİF") || responseText.includes("POZITIF")) sentiment = "POZİTİF";
    else if (responseText.includes("NEGATİF") || responseText.includes("NEGATIF")) sentiment = "NEGATİF";

    res.json({ sentiment });
  } catch (error) {
    console.error("News analyze error:", error);
    res.status(500).json({ message: "Analiz sırasında hata oluştu" });
  }
});

export default router;
