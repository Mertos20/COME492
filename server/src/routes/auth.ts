import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User, { MembershipTier } from "../models/User";
import Transaction from "../models/Transaction";
import { AuthRequest, requireAuth } from "../middleware/auth";

const router = Router();
const secret = process.env.JWT_SECRET || "dev_secret";

const MEMBERSHIP_PRICES: Record<MembershipTier, number> = {
  free: 0,
  bronze: 5,
  silver: 10,
  gold: 20
};

const signToken = (user: {
  id: string;
  membership: MembershipTier;
  role: "user" | "expert";
  fullName: string;
}): string => jwt.sign(user, secret, { expiresIn: "7d" });

router.post("/register", async (req, res) => {
  const { fullName, email, password } = req.body;

  if (!fullName || !email || !password) {
    res.status(400).json({ message: "Tum alanlar zorunlu" });
    return;
  }

  const exists = await User.findOne({ email });
  if (exists) {
    res.status(400).json({ message: "Bu e-posta zaten kayitli" });
    return;
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ fullName, email, password: hashed });

  const payload = {
    id: user._id.toString(),
    membership: user.membership,
    role: user.role,
    fullName: user.fullName
  };

  res.status(201).json({ token: signToken(payload), user: payload, balance: user.balance });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    res.status(401).json({ message: "E-posta veya sifre hatali" });
    return;
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    res.status(401).json({ message: "E-posta veya sifre hatali" });
    return;
  }

  const payload = {
    id: user._id.toString(),
    membership: user.membership,
    role: user.role,
    fullName: user.fullName
  };

  res.json({ token: signToken(payload), user: payload, balance: user.balance });
});

router.get("/me", requireAuth, async (req: AuthRequest, res) => {
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
      role: user.role
    },
    balance: user.balance,
    holdings: user.holdings
  });
});

router.get("/pricing", (_req, res) => {
  res.json({
    plans: [
      { tier: "bronze", name: "BRONZE", price: 5, description: "Temel uzman konsultasyonu" },
      { tier: "silver", name: "SILVER", price: 10, description: "Gelismis analiz ve danismanlik" },
      { tier: "gold", name: "PLATINUM", price: 20, description: "Premium danismanlik ve ozel desteği" }
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

export default router;
