import { Router } from "express";
import { AuthRequest, requireAuth } from "../middleware/auth";
import User from "../models/User";
import Transaction from "../models/Transaction";
import { sendEmailCode } from "../utils/mailer";

const router = Router();

// In-memory store for verification codes for simplicity
const verificationCodes: Record<string, { code: string; amount: number; expires: number }> = {};

router.post("/deposit", requireAuth, async (req: AuthRequest, res) => {
  try {
    const amount = Number(req.body.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ message: "Gecersiz tutar" });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(404).json({ message: "Kullanici bulunamadi" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $inc: { balance: amount } },
      { new: true, projection: { balance: 1 } }
    ).lean();

    if (!updatedUser) {
      return res.status(404).json({ message: "Kullanici bulunamadi" });
    }

    await Transaction.create({
      userId,
      symbol: "TRY",
      type: "deposit",
      quantity: 1,
      price: amount,
      total: amount
    });

    res.json({ balance: updatedUser.balance });
  } catch (error) {
    console.error("Deposit error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/withdraw", requireAuth, async (req: AuthRequest, res) => {
  try {
    const amount = Number(req.body.amount);
    const { iban, accountName } = req.body;

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ message: "Geçersiz tutar" });
    }

    if (!iban || !accountName) {
      return res.status(400).json({ message: "IBAN ve hesap sahibi bilgileri zorunludur" });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    }

    if (user.balance < amount) {
      return res.status(400).json({ message: "Yetersiz bakiye" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $inc: { balance: -amount } },
      { new: true, projection: { balance: 1 } }
    ).lean();

    if (!updatedUser) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    }

    await Transaction.create({
      userId,
      symbol: "TRY",
      type: "withdraw",
      quantity: 1,
      price: amount,
      total: amount
    });

    res.json({ balance: updatedUser.balance, message: "Para çekme talebiniz alındı." });
  } catch (error) {
    console.error("Withdraw error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/balance", requireAuth, async (req: AuthRequest, res) => {
  const user = await User.findById(req.user?.id).lean();
  if (!user) {
    res.status(404).json({ message: "Kullanici bulunamadi" });
    return;
  }

  res.json({ balance: user.balance });
});

router.post("/request-load", requireAuth, async (req: AuthRequest, res) => {
  const { amount, cardNumber, cardHolder, expiryDate, cvv } = req.body;
  const parsedAmount = Number(amount);
  const userId = req.user?.id;

  if (!userId || !cardNumber || !cardHolder || !expiryDate || !cvv) {
    return res.status(400).json({ message: "Tüm alanlar zorunludur." });
  }

  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ message: "Gecersiz tutar" });
  }

  if (String(cardNumber).replace(/\s+/g, "").length < 12 || String(cvv).length < 3) {
    return res.status(400).json({ message: "Kart bilgileri gecersiz." });
  }

  const user = req.user;
  if (!user) {
    return res.status(404).json({ message: "Kullanıcı bulunamadı." });
  }

  console.log(`[DEBUG] Attempting to send deposit email to: ${user.email}`);

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = Date.now() + 10 * 60 * 1000; // 10 minutes

  verificationCodes[userId] = { code, amount: parsedAmount, expires };

  try {
    await sendEmailCode(user.email, code, 'deposit');
    const response: { message: string; simulationCode?: string } = { 
      message: "Doğrulama kodu gönderildi." 
    };
    if (process.env.NODE_ENV !== 'production') {
      response.simulationCode = code;
    }
    res.status(200).json(response);
  } catch (error) {
    console.error("E-posta gönderme hatası:", error);
    res.status(500).json({ message: "Doğrulama kodu gönderilemedi." });
  }
});

router.post("/verify-load", requireAuth, async (req: AuthRequest, res) => {
  const { code } = req.body;
  const userId = req.user?.id;

  if (!userId || !code) {
    return res.status(400).json({ message: "Doğrulama kodu gereklidir." });
  }

  const stored = verificationCodes[userId];

  if (!stored || stored.expires < Date.now() || stored.code !== code) {
    return res.status(400).json({ message: "Geçersiz veya süresi dolmuş doğrulama kodu." });
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $inc: { balance: stored.amount } },
    { new: true, projection: { balance: 1 } }
  ).lean();

  if (!updatedUser) {
    return res.status(404).json({ message: "Kullanıcı bulunamadı." });
  }

  await Transaction.create({
    userId,
    symbol: "TRY",
    type: "deposit",
    quantity: 1,
    price: stored.amount,
    total: stored.amount,
  });

  delete verificationCodes[userId];

  res.json({ balance: updatedUser.balance });
});

export default router;
