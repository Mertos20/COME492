import { Router } from "express";
import { AuthRequest, requireAuth } from "../middleware/auth";
import User from "../models/User";
import Transaction from "../models/Transaction";

const router = Router();

router.post("/deposit", requireAuth, async (req: AuthRequest, res) => {
  const amount = Number(req.body.amount);

  if (!Number.isFinite(amount) || amount <= 0) {
    res.status(400).json({ message: "Gecersiz tutar" });
    return;
  }

  const user = await User.findById(req.user?.id);
  if (!user) {
    res.status(404).json({ message: "Kullanici bulunamadi" });
    return;
  }

  user.balance += amount;
  await user.save();

  await Transaction.create({
    userId: user._id,
    symbol: "TRY",
    type: "deposit",
    quantity: 1,
    price: amount,
    total: amount
  });

  res.json({ balance: user.balance });
});

router.get("/balance", requireAuth, async (req: AuthRequest, res) => {
  const user = await User.findById(req.user?.id).lean();
  if (!user) {
    res.status(404).json({ message: "Kullanici bulunamadi" });
    return;
  }

  res.json({ balance: user.balance });
});

export default router;
