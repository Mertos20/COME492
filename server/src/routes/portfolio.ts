import { Router } from "express";
import { AuthRequest, requireAuth } from "../middleware/auth";
import User from "../models/User";
import { getBySymbol } from "../utils/marketData";

const router = Router();

router.get("/summary", requireAuth, async (req: AuthRequest, res) => {
  const user = await User.findById(req.user?.id).lean();
  if (!user) {
    res.status(404).json({ message: "Kullanici bulunamadi" });
    return;
  }

  const holdings = await Promise.all((user.holdings || []).map(async (holding: { symbol: string; quantity: number; avgBuyPrice: number }) => {
    const market = await getBySymbol(holding.symbol);
    const currentPrice = market?.price || 0;
    const marketValue = currentPrice * holding.quantity;
    const cost = holding.avgBuyPrice * holding.quantity;
    const pnl = marketValue - cost;

    return {
      ...holding,
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
    totalValue,
    totalPnl,
    totalPnlPercent: totalCost === 0 ? 0 : (totalPnl / totalCost) * 100
  });
});

export default router;
