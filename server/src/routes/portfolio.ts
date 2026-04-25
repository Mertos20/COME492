import { Router } from "express";
import { AuthRequest, requireAuth } from "../middleware/auth";
import User from "../models/User";
import Transaction from "../models/Transaction";
import { getBySymbol } from "../utils/marketData";

const router = Router();

const computeCostFromTransactions = async (userId: string, symbol: string): Promise<{ quantity: number; avgBuyPrice: number }> => {
  const txs = await Transaction.find({
    userId,
    symbol,
    type: { $in: ["buy", "sell"] }
  })
    .sort({ createdAt: 1 })
    .lean();

  let quantity = 0;
  let avgBuyPrice = 0;

  for (const tx of txs) {
    const txQty = Number(tx.quantity) || 0;
    const txPrice = Number(tx.price) || 0;

    if (tx.type === "buy") {
      const newQty = quantity + txQty;
      avgBuyPrice = newQty > 0 ? ((quantity * avgBuyPrice) + (txQty * txPrice)) / newQty : 0;
      quantity = newQty;
      continue;
    }

    // Sell reduces position size while keeping weighted average of remaining lots.
    quantity = Math.max(0, quantity - txQty);
    if (quantity === 0) {
      avgBuyPrice = 0;
    }
  }

  return { quantity, avgBuyPrice };
};

router.get("/summary", requireAuth, async (req: AuthRequest, res) => {
  const user = await User.findById(req.user?.id).lean();
  if (!user) {
    res.status(404).json({ message: "Kullanici bulunamadi" });
    return;
  }

  const holdings = await Promise.all((user.holdings || []).map(async (holding: { symbol: string; quantity: number; avgBuyPrice: number }) => {
    const market = await getBySymbol(holding.symbol);
    const currentPrice = Number(market?.price) || 0;
    const holdingQty = Number(holding.quantity) || 0;
    let avgBuyPrice = Number(holding.avgBuyPrice) || 0;

    if (holdingQty > 0 && avgBuyPrice <= 0) {
      const rebuilt = await computeCostFromTransactions(String(user._id), holding.symbol);
      if (rebuilt.quantity > 0 && rebuilt.avgBuyPrice > 0) {
        avgBuyPrice = rebuilt.avgBuyPrice;
      }
    }

    const marketValue = currentPrice * holdingQty;
    const cost = avgBuyPrice * holdingQty;
    const pnl = marketValue - cost;

    return {
      ...holding,
      quantity: holdingQty,
      avgBuyPrice,
      currentPrice,
      marketValue,
      cost,
      pnl,
      pnlPercent: cost === 0 ? 0 : (pnl / cost) * 100
    };
  }));

  const totalValue = holdings.reduce((sum, item) => sum + item.marketValue, 0);
  const totalCost = holdings.reduce((sum, item) => sum + item.cost, 0);
  const totalPnl = totalValue - totalCost;

  res.json({
    balance: user.balance,
    holdings,
    investmentValue: totalCost,
    currentValue: totalValue,
    totalValue,
    totalPnl,
    totalPnlPercent: totalCost === 0 ? 0 : (totalPnl / totalCost) * 100
  });
});

export default router;
