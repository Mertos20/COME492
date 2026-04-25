import { Router } from "express";
import nodemailer from "nodemailer";
import { AuthRequest, requireAuth } from "../middleware/auth";
import User from "../models/User";
import Transaction from "../models/Transaction";

const router = Router();

// In-memory store for verification codes for simplicity
const verificationCodes: Record<string, { code: string; amount: number; expires: number }> = {};

const smtpPort = Number(process.env.EMAIL_PORT || 587);
const smtpHost = process.env.EMAIL_HOST;
const smtpUser = process.env.EMAIL_USER;
const smtpPass = process.env.EMAIL_PASS?.replace(/\s+/g, "");
const emailFrom = process.env.EMAIL_FROM || smtpUser;

const mailTransporter =
  smtpHost && smtpUser && smtpPass
    ? nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass }
      })
    : null;

const sendVerificationEmail = async (email: string, code: string) => {
  if (!mailTransporter || !emailFrom) {
    throw new Error("SMTP ayarlari eksik. EMAIL_HOST/EMAIL_PORT/EMAIL_USER/EMAIL_PASS/EMAIL_FROM tanimlayin.");
  }

  await mailTransporter.sendMail({
    from: emailFrom,
    to: email,
    subject: "Bakiye Yukleme Dogrulama Kodu",
    text: `Dogrulama kodunuz: ${code}. Bu kod 10 dakika gecerlidir.`
  });
};

router.post("/deposit", requireAuth, async (req: AuthRequest, res) => {
  try {
    const amount = Number(req.body.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ message: "Gecersiz tutar" });
    }

    const userId = req.user?._id;
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

  // Basic client-side-like validation on server as a safeguard.
  if (String(cardNumber).replace(/\s+/g, "").length < 12 || String(cvv).length < 3) {
    return res.status(400).json({ message: "Kart bilgileri gecersiz." });
  }

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: "Kullanıcı bulunamadı." });
  }

  // Generate a 6-digit verification code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = Date.now() + 10 * 60 * 1000; // 10 minutes

  verificationCodes[userId] = { code, amount: parsedAmount, expires };

  try {
    await sendVerificationEmail(user.email, code);
    res.status(200).json({ message: "Doğrulama kodu gönderildi." });
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
