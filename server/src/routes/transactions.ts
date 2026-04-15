import { Router } from "express";
import { AuthRequest, requireAuth } from "../middleware/auth";
import Transaction from "../models/Transaction";

const router = Router();

router.get("/history", requireAuth, async (req: AuthRequest, res) => {
  const { type, symbol, from, to } = req.query as {
    type?: "buy" | "sell" | "deposit";
    symbol?: string;
    from?: string;
    to?: string;
  };

  if (!req.user) {
    res.status(401).json({ message: "Yetkisiz istek" });
    return;
  }

  const query: {
    userId: string;
    type?: "buy" | "sell" | "deposit";
    symbol?: string;
    createdAt?: { $gte?: Date; $lte?: Date };
  } = { userId: req.user.id };

  if (type && ["buy", "sell", "deposit"].includes(type)) {
    query.type = type;
  }

  if (symbol?.trim()) {
    query.symbol = symbol.trim().toUpperCase();
  }

  if (from || to) {
    query.createdAt = {};
    if (from) {
      query.createdAt.$gte = new Date(from);
    }
    if (to) {
      query.createdAt.$lte = new Date(to);
    }
  }

  const transactions = await Transaction.find(query).sort({ createdAt: -1 }).lean();
  res.json(transactions);
});

export default router;
