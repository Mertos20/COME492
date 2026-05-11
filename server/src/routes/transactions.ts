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

  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  const skip = (page - 1) * limit;

  const [transactions, total] = await Promise.all([
    Transaction.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Transaction.countDocuments(query)
  ]);

  res.json({
    transactions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
});

export default router;
