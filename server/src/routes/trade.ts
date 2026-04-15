import { Router } from "express";
import { AuthRequest, requireAuth } from "../middleware/auth";
import User from "../models/User";
import Transaction from "../models/Transaction";
import { getBySymbol } from "../utils/marketData";

const router = Router();

router.post("/order", requireAuth, async (req: AuthRequest, res) => {
  const { side, symbol, quantity } = req.body as {
    side: "buy" | "sell";
    symbol: string;
    quantity: number;
  };

  const market = await getBySymbol(symbol);
  if (!market) {
    res.status(404).json({ message: "Yatirim urunu bulunamadi" });
    return;
  }

  const qty = Number(quantity);
  if (!Number.isFinite(qty) || qty <= 0) {
    res.status(400).json({ message: "Gecersiz miktar" });
    return;
  }

  const user = await User.findById(req.user?.id);
  if (!user) {
    res.status(404).json({ message: "Kullanici bulunamadi" });
    return;
  }

  const total = Number((qty * market.price).toFixed(4));
  const holding = user.holdings.find((item: { symbol: string; quantity: number; avgBuyPrice: number }) => item.symbol === symbol);

  if (side === "buy") {
    if (user.balance < total) {
      res.status(400).json({ message: "Yetersiz bakiye" });
      return;
    }

    user.balance -= total;

    if (!holding) {
      user.holdings.push({ symbol, quantity: qty, avgBuyPrice: market.price });
    } else {
      const newQty = holding.quantity + qty;
      holding.avgBuyPrice = (holding.quantity * holding.avgBuyPrice + qty * market.price) / newQty;
      holding.quantity = newQty;
    }
  } else {
    if (!holding || holding.quantity < qty) {
      res.status(400).json({ message: "Yetersiz varlik miktari" });
      return;
    }

    holding.quantity -= qty;
    user.balance += total;

    if (holding.quantity <= 0.0000001) {
      user.holdings = user.holdings.filter((item: { symbol: string }) => item.symbol !== symbol);
    }
  }

  await user.save();

  await Transaction.create({
    userId: user._id,
    symbol,
    type: side,
    quantity: qty,
    price: market.price,
    total
  });

  res.json({ balance: user.balance, holdings: user.holdings });
});

export default router;
