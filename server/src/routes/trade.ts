import { Router } from "express";
import { AuthRequest, requireAuth } from "../middleware/auth";
import User, { IHolding } from "../models/User";
import Transaction from "../models/Transaction";
import Order from "../models/Order";
import { getBySymbol } from "../utils/marketData";

const router = Router();

// Endpoint to place an order (Market, Limit, or Stop)
router.post("/order", requireAuth, async (req: AuthRequest, res) => {
  const { side, symbol, quantity, type, targetPrice } = req.body as {
    side: "buy" | "sell";
    symbol: string;
    quantity: number;
    type?: "market" | "limit" | "stop";
    targetPrice?: number;
  };

  const orderType = type || "market";

  if ((orderType === "limit" || orderType === "stop") && (!targetPrice || targetPrice <= 0)) {
    res.status(400).json({ message: "Limit/Stop emirleri için hedef fiyat belirtilmelidir." });
    return;
  }

  const market = await getBySymbol(symbol);
  if (!market) {
    res.status(404).json({ message: "Yatırım ürünü bulunamadı" });
    return;
  }

  const qty = Number(quantity);
  if (!Number.isFinite(qty) || qty <= 0) {
    res.status(400).json({ message: "Geçersiz miktar" });
    return;
  }

  const user = await User.findById(req.user?.id);
  if (!user) {
    res.status(404).json({ message: "Kullanıcı bulunamadı" });
    return;
  }

  const priceToUse = orderType === "market" ? market.price : (targetPrice as number);
  let total = Number((qty * priceToUse).toFixed(4));

  const usdBasedSymbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "XAUUSD", "XAGUSD"];
  if (usdBasedSymbols.includes(symbol)) {
    const usdtryMarket = await getBySymbol("USDTRY");
    if (usdtryMarket) {
      total = Number((total * usdtryMarket.price).toFixed(4));
    }
  }

  const holding = user.holdings.find((item: IHolding) => item.symbol === symbol);

  if (orderType === "market") {
    // Immediate execution for market order
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
        res.status(400).json({ message: "Yetersiz varlık miktarı" });
        return;
      }
      holding.quantity -= qty;
      user.balance += total;

      if (holding.quantity <= 0.0000001) {
        user.holdings = user.holdings.filter((item: IHolding) => item.symbol !== symbol);
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

    res.json({ message: "İşlem başarıyla gerçekleşti", balance: user.balance, holdings: user.holdings });
  } else {
    // Limit or Stop Order -> Reserve balances and create Order
    if (side === "buy") {
      if (user.balance < total) {
        res.status(400).json({ message: "Emir için yetersiz bakiye" });
        return;
      }
      // Lock TRY balance
      user.balance -= total;
      user.lockedBalance += total;
    } else {
      if (!holding || holding.quantity < qty) {
        res.status(400).json({ message: "Emir için yetersiz varlık miktarı" });
        return;
      }
      // Lock holding quantity
      holding.quantity -= qty;
      let lockedHolding = user.lockedHoldings.find((item: IHolding) => item.symbol === symbol);
      if (!lockedHolding) {
        user.lockedHoldings.push({ symbol, quantity: qty, avgBuyPrice: holding.avgBuyPrice });
      } else {
        lockedHolding.quantity += qty;
      }
      if (holding.quantity <= 0.0000001) {
        user.holdings = user.holdings.filter((item: IHolding) => item.symbol !== symbol);
      }
    }

    await user.save();

    const order = await Order.create({
      userId: user._id,
      symbol,
      type: orderType,
      side,
      quantity: qty,
      targetPrice,
      status: "pending"
    });

    res.json({ message: "Emir başarıyla oluşturuldu", order, balance: user.balance, holdings: user.holdings });
  }
});

// Endpoint to get pending orders
router.get("/orders", requireAuth, async (req: AuthRequest, res) => {
  const orders = await Order.find({ userId: req.user?.id, status: "pending" }).sort({ createdAt: -1 });
  res.json(orders);
});

// Endpoint to cancel an order
router.delete("/orders/:id", requireAuth, async (req: AuthRequest, res) => {
  const order = await Order.findOne({ _id: req.params.id, userId: req.user?.id, status: "pending" });
  if (!order) {
    res.status(404).json({ message: "Emir bulunamadı veya zaten işlenmiş" });
    return;
  }

  const user = await User.findById(req.user?.id);
  if (!user) {
    res.status(404).json({ message: "Kullanıcı bulunamadı" });
    return;
  }

  let total = Number((order.quantity * (order.targetPrice || 0)).toFixed(4));

  const usdBasedSymbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "XAUUSD", "XAGUSD"];
  if (usdBasedSymbols.includes(order.symbol)) {
    const usdtryMarket = await getBySymbol("USDTRY");
    if (usdtryMarket) {
      total = Number((total * usdtryMarket.price).toFixed(4));
    }
  }

  // Refund locked balances
  if (order.side === "buy") {
    user.lockedBalance -= total;
    user.balance += total;
  } else {
    let lockedHolding = user.lockedHoldings.find((item: IHolding) => item.symbol === order.symbol);
    if (lockedHolding) {
      lockedHolding.quantity -= order.quantity;
      if (lockedHolding.quantity <= 0.0000001) {
        user.lockedHoldings = user.lockedHoldings.filter((item: IHolding) => item.symbol !== order.symbol);
      }
    }

    let holding = user.holdings.find((item: IHolding) => item.symbol === order.symbol);
    if (!holding) {
      user.holdings.push({ symbol: order.symbol, quantity: order.quantity, avgBuyPrice: lockedHolding?.avgBuyPrice || 0 });
    } else {
      holding.quantity += order.quantity;
    }
  }

  order.status = "cancelled";
  await Promise.all([user.save(), order.save()]);

  res.json({ message: "Emir iptal edildi", balance: user.balance, holdings: user.holdings });
});

export default router;
