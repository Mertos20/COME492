import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User, { MembershipTier } from "../models/User";
import Transaction from "../models/Transaction";
import { AuthRequest, requireAuth } from "../middleware/auth";
import { sendEmailCode } from "../utils/mailer";

const router = Router();
const getSecret = (): string => process.env.JWT_SECRET || "dev_secret";

const MEMBERSHIP_PRICES: Record<MembershipTier, number> = {
  free: 0,
  bronze: 5,
  silver: 10,
  gold: 20
};

const MEMBERSHIP_LEVELS: Record<MembershipTier, number> = {
  free: 0,
  bronze: 1,
  silver: 2,
  gold: 3
};

const signToken = (user: {
  id: string;
  membership: MembershipTier;
  role: "user" | "expert";
  fullName: string;
  isAdmin?: boolean;
}): string => jwt.sign(user, getSecret(), { expiresIn: "7d" });

router.post("/register", async (req, res) => {
  const { fullName, email, password } = req.body;

  if (!fullName || !email || !password) {
    res.status(400).json({ message: "Tum alanlar zorunlu" });
    return;
  }

  // Input validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({ message: "Gecerli bir e-posta adresi giriniz" });
    return;
  }

  if (String(password).length < 6) {
    res.status(400).json({ message: "Sifre en az 6 karakter olmalidir" });
    return;
  }

  if (String(fullName).trim().length < 2) {
    res.status(400).json({ message: "Ad soyad en az 2 karakter olmalidir" });
    return;
  }

  const exists = await User.findOne({ email });
  if (exists) {
    res.status(400).json({ message: "Bu e-posta zaten kayitli" });
    return;
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ fullName, email, passwordHash: hashed });

  const payload = {
    id: user._id.toString(),
    membership: user.membership,
    role: user.role,
    fullName: user.fullName,
    isAdmin: user.isAdmin
  };

  res.status(201).json({ token: signToken(payload), user: payload, balance: user.balance });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ message: "E-posta ve sifre zorunludur" });
    return;
  }

  const user = await User.findOne({ email });
  if (!user) {
    res.status(401).json({ message: "E-posta veya sifre hatali" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash || (user as any).password);
  if (!valid) {
    res.status(401).json({ message: "E-posta veya sifre hatali" });
    return;
  }

  const payload = {
    id: user._id.toString(),
    membership: user.membership,
    role: user.role,
    fullName: user.fullName,
    isAdmin: user.isAdmin
  };

  res.json({ token: signToken(payload), user: payload, balance: user.balance });
});

// @desc    Get user profile
// @access  Private
router.get("/me", requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await User.findById(req.user?.id).lean();
    if (!user) {
      res.status(404).json({ message: "Kullanici bulunamadi" });
      return;
    }

    res.json({
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        membership: user.membership,
        role: user.role,
        isAdmin: user.isAdmin
      },
      balance: user.balance,
      holdings: user.holdings
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/pricing", (_req, res) => {
  res.json({
    plans: [
      { tier: "bronze", name: "BRONZE", price: 5, description: "Temel uzman konsultasyonu" },
      { tier: "silver", name: "SILVER", price: 10, description: "Gelismis analiz ve danismanlik" },
      { tier: "gold", name: "GOLD", price: 20, description: "Premium danismanlik ve ozel desteği" }
    ]
  });
});

router.post("/membership", requireAuth, async (req: AuthRequest, res) => {
  const { tier } = req.body as { tier: MembershipTier };
  if (!["free", "bronze", "silver", "gold"].includes(tier)) {
    res.status(400).json({ message: "Gecersiz uyelik tipi" });
    return;
  }

  const user = await User.findById(req.user?.id);
  if (!user) {
    res.status(404).json({ message: "Kullanici bulunamadi" });
    return;
  }

  // Check if trying to upgrade to higher tier or same tier
  if (tier === "free") {
    res.status(400).json({ message: "Ucretsiz plandan indirilemezsiniz" });
    return;
  }

  if (user.membership === tier) {
    res.status(400).json({ message: "Zaten bu plana abone siniz" });
    return;
  }

  // Prevent downgrade (e.g., gold -> bronze)
  if (MEMBERSHIP_LEVELS[tier] <= MEMBERSHIP_LEVELS[user.membership]) {
    res.status(400).json({ message: "Mevcut planınızdan daha düşük bir plana geçemezsiniz" });
    return;
  }

  const price = MEMBERSHIP_PRICES[tier];
  if (user.balance < price) {
    res.status(400).json({ message: `Yetersiz bakiye. Gerekli: ${price} TRY, Mevcut: ${user.balance} TRY` });
    return;
  }

  // Deduct balance and update membership
  user.balance -= price;
  user.membership = tier;
  await user.save();

  // Create transaction record
  await Transaction.create({
    userId: user._id,
    symbol: `${tier.toUpperCase()}_MEMBERSHIP`,
    type: "upgrade",
    quantity: 1,
    price: price,
    total: price
  });

  res.json({
    membership: user.membership,
    balance: user.balance,
    message: `${tier.toUpperCase()} planina basarili sekilde gectiniz!`
  });
});

// ─── Profile Update ───────────────────────────────────────────────
router.put("/profile", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.user) { res.status(401).json({ message: "Yetkisiz" }); return; }

    const { fullName, email } = req.body;

    if (!fullName && !email) {
      res.status(400).json({ message: "En az bir alan gerekli" });
      return;
    }

    const user = await User.findById(req.user._id);
    if (!user) { res.status(404).json({ message: "Kullanici bulunamadi" }); return; }

    if (fullName) {
      if (String(fullName).trim().length < 2) {
        res.status(400).json({ message: "Ad soyad en az 2 karakter olmalidir" });
        return;
      }
      user.fullName = String(fullName).trim();
    }

    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({ message: "Gecerli bir e-posta adresi giriniz" });
        return;
      }
      const existing = await User.findOne({ email, _id: { $ne: user._id } });
      if (existing) {
        res.status(400).json({ message: "Bu e-posta baska bir hesap tarafindan kullaniliyor" });
        return;
      }
      user.email = email;
    }

    await user.save();

    const token = signToken({
      id: user._id.toString(),
      membership: user.membership,
      role: user.role as "user" | "expert",
      fullName: user.fullName,
      isAdmin: user.isAdmin
    });

    res.json({
      token,
      user: { id: user._id.toString(), fullName: user.fullName, email: user.email, membership: user.membership, role: user.role, isAdmin: user.isAdmin },
      message: "Profil basariyla guncellendi"
    });
  } catch (error: any) {
    console.error("Profile update error:", error);
    res.status(500).json({ message: error.message || "Sunucu hatasi", stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined });
  }
});

// ─── Cancel Membership ────────────────────────────────────────────
router.post("/cancel-membership", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.user) { res.status(401).json({ message: "Yetkisiz" }); return; }

    const user = await User.findById(req.user._id);
    if (!user) { res.status(404).json({ message: "Kullanici bulunamadi" }); return; }

    if (user.membership === "free") {
      res.status(400).json({ message: "Zaten ucretsiz plandas\u0131n\u0131z" });
      return;
    }

    const previousTier = user.membership;
    user.membership = "free";
    await user.save();

    const token = signToken({
      id: user._id.toString(),
      membership: user.membership,
      role: user.role as "user" | "expert",
      fullName: user.fullName,
      isAdmin: user.isAdmin
    });

    res.json({
      token,
      membership: "free",
      message: `${previousTier.toUpperCase()} uyeliginiz iptal edildi`
    });
  } catch (error) {
    console.error("Membership cancel error:", error);
    res.status(500).json({ message: "Sunucu hatasi" });
  }
});

// ─── Forgot Password ──────────────────────────────────────────────
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user) {
      // For security, don't reveal if user exists, but for UX in this demo, let's be helpful
      return res.status(404).json({ message: "Bu e-posta adresi ile kayıtlı bir kullanıcı bulunamadı." });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordCode = code;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    await sendEmailCode(email, code, 'reset');
    
    const response: { message: string; simulationCode?: string } = { 
      message: "Şifre sıfırlama kodu e-posta adresinize gönderildi."
    };
    if (process.env.NODE_ENV !== 'production') {
      response.simulationCode = code;
    }
    res.json(response);
  } catch (error) {
    res.status(500).json({ message: "Sunucu hatası" });
  }
});

// ─── Reset Password ───────────────────────────────────────────────
router.post("/reset-password", async (req, res) => {
  const { email, code, newPassword } = req.body;
  try {
    const user = await User.findOne({ 
      email: String(email).toLowerCase(),
      resetPasswordCode: code,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: "Geçersiz veya süresi dolmuş sıfırlama kodu." });
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    user.resetPasswordCode = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: "Şifreniz başarıyla güncellendi. Yeni şifrenizle giriş yapabilirsiniz." });
  } catch (error) {
    res.status(500).json({ message: "Sunucu hatası" });
  }
});

// ─── Change Password ──────────────────────────────────────────────
router.post("/change-password", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.user) { res.status(401).json({ message: "Yetkisiz" }); return; }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ message: "Mevcut şifre ve yeni şifre gereklidir" });
      return;
    }

    if (String(newPassword).length < 6) {
      res.status(400).json({ message: "Yeni şifre en az 6 karakter olmalıdır" });
      return;
    }

    // Need to fetch user WITH passwordHash for comparison
    const user = await User.findById(req.user._id).select("+passwordHash");
    if (!user) { res.status(404).json({ message: "Kullanıcı bulunamadı" }); return; }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      res.status(400).json({ message: "Mevcut şifreniz hatalı" });
      return;
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Şifreniz başarıyla değiştirildi" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
});

export default router;

