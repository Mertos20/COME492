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

// GET /api/portfolio/realized-pnl — FIFO-based realized PnL from sell transactions
router.get("/realized-pnl", requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Yetkisiz" });
    }

    const txs = await Transaction.find({
      userId,
      type: { $in: ["buy", "sell"] },
    })
      .sort({ createdAt: 1 })
      .lean();

    // Group transactions by symbol and compute realized PnL via FIFO
    const symbolTxs: Record<string, typeof txs> = {};
    for (const tx of txs) {
      if (!symbolTxs[tx.symbol]) symbolTxs[tx.symbol] = [];
      symbolTxs[tx.symbol].push(tx);
    }

    let totalRealizedPnl = 0;
    let totalRealizedCount = 0;
    const realizedBySymbol: {
      symbol: string;
      pnl: number;
      totalSold: number;
      tradeCount: number;
      trades: { quantity: number; buyPrice: number; sellPrice: number; pnl: number; date: string }[];
    }[] = [];

    for (const [symbol, stxs] of Object.entries(symbolTxs)) {
      // FIFO lot queue: { quantity, price }[]
      const lots: { quantity: number; price: number }[] = [];
      let symbolPnl = 0;
      let symbolSold = 0;
      let symbolTradeCount = 0;
      const trades: { quantity: number; buyPrice: number; sellPrice: number; pnl: number; date: string }[] = [];

      for (const tx of stxs) {
        const qty = Number(tx.quantity) || 0;
        const price = Number(tx.price) || 0;

        if (tx.type === "buy") {
          lots.push({ quantity: qty, price });
        } else {
          // Sell: match against FIFO lots
          let remaining = qty;
          while (remaining > 0 && lots.length > 0) {
            const lot = lots[0];
            const matched = Math.min(remaining, lot.quantity);
            const pnl = matched * (price - lot.price);
            symbolPnl += pnl;
            symbolSold += matched * price;
            symbolTradeCount++;
            trades.push({
              quantity: matched,
              buyPrice: lot.price,
              sellPrice: price,
              pnl,
              date: (tx as any).createdAt?.toISOString?.() || String((tx as any).createdAt) || "",
            });
            lot.quantity -= matched;
            remaining -= matched;
            if (lot.quantity <= 0.0000001) lots.shift();
          }
        }
      }

      if (symbolTradeCount > 0) {
        totalRealizedPnl += symbolPnl;
        totalRealizedCount += symbolTradeCount;
        realizedBySymbol.push({
          symbol,
          pnl: symbolPnl,
          totalSold: symbolSold,
          tradeCount: symbolTradeCount,
          trades,
        });
      }
    }

    res.json({
      totalRealizedPnl,
      totalRealizedCount,
      bySymbol: realizedBySymbol,
    });
  } catch (error) {
    console.error("Realized PnL error:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
});

// GET Watchlist
router.get("/watchlist", requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await User.findById(req.user?.id).lean();
    if (!user) {
      return res.status(404).json({ message: "Kullanici bulunamadi" });
    }
    res.json({ watchlist: user.watchlist || [] });
  } catch (error) {
    res.status(500).json({ message: "Sunucu hatasi" });
  }
});

// POST Watchlist (Toggle)
router.post("/watchlist", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { symbol } = req.body;
    if (!symbol) {
      return res.status(400).json({ message: "Sembol gerekli" });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Yetkisiz" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Kullanici bulunamadi" });
    }

    // Initialize if undefined
    if (!user.watchlist) user.watchlist = [];

    const isWatching = user.watchlist.includes(symbol);
    if (isWatching) {
      // Remove
      user.watchlist = user.watchlist.filter(s => s !== symbol);
    } else {
      // Add
      user.watchlist.push(symbol);
    }

    await user.save();

    res.json({ watchlist: user.watchlist, isWatching: !isWatching });
  } catch (error) {
    console.error("Watchlist error:", error);
    res.status(500).json({ message: "Sunucu hatasi" });
  }
});

export default router;
