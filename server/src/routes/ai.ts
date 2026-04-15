import { Router } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

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

const INVESTMENT_SYSTEM_PROMPT = `Sen bir yatırım danışmanı asistanısın. Kullanıcı SADECE yatırım, finansal yönetim, piyasa analizi, kripto, forex, altın, gümüş, borsa ve portföy yönetimi hakkında sorular sorabilir.

Kurallar:
1. Sadece yatırım ve finansal konularda yardım et
2. Yatırım dışı sorulara "Özür dilerim, sadece yatırım konularında yardım edebilirim." şeklinde cevap ver
3. Yanıtlarını Türkçe ve kısa tutsan çok iyi olur (3-4 cümle)
4. Spesifik, uygulanabilir öneriler sun
5. Hiçbir zaman finansal tavsiye değil, genel bilgi ver
6. Risk uyarısı eksik etme

Eğer kullanıcı yatırım dışı konu soruyorsa, kısaca reddet ve konuyu yatırıma yönlendir.`;

const isInvestmentQuestion = (message: string): boolean => {
  const investmentKeywords = [
    "yatırım", "kripto", "bitcoin", "ethereum", "altcoin", "forex", "dolar", "euro",
    "altın", "gümüş", "borsa", "hisse", "endeks", "fiyat", "piyasa", "grafik",
    "trend", "analiz", "portföy", "risk", "kâr", "zarar", "işlem", "al", "sat",
    "ticaret", "tahvil", "fon", "etf", "leverage", "margin", "stop", "takip",
    "momentum", "volatilite", "çeyrek", "sentetik", "vadeli", "opsiyon",
  ];
  return investmentKeywords.some((keyword) => message.toLowerCase().includes(keyword));
};

router.post("/chat", async (req, res) => {
  try {
    const message = String(req.body.message || "").trim();

    if (!message) {
      return res.status(400).json({ response: "Lütfen bir soru yazın." });
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

    // Check if the question is investment-related
    if (!isInvestmentQuestion(message)) {
      return res.status(200).json({
        response: "Özür dilerim, sadece yatırım konularında yardımcı olabilirim.",
      });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: INVESTMENT_SYSTEM_PROMPT,
    });

    const result = await model.generateContent(message);
    const response = result.response;
    const text = response.text();

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

export default router;
