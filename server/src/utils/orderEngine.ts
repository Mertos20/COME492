import Order from "../models/Order";
import User, { IHolding } from "../models/User";
import Transaction from "../models/Transaction";
import { MarketInstrument } from "./marketData";

export const processPendingOrders = async (liveMarkets: MarketInstrument[]) => {
  try {
    const pendingOrders = await Order.find({ status: "pending" });
    if (pendingOrders.length === 0) return;

    // Convert liveMarkets to a map for O(1) lookups
    const marketMap = new Map<string, number>();
    for (const m of liveMarkets) {
      marketMap.set(m.symbol, m.price);
    }

    for (const order of pendingOrders) {
      const currentPrice = marketMap.get(order.symbol);
      if (!currentPrice) continue;

      let execute = false;

      // Match logic
      if (order.type === "limit") {
        if (order.side === "buy" && currentPrice <= (order.targetPrice || 0)) execute = true;
        if (order.side === "sell" && currentPrice >= (order.targetPrice || 0)) execute = true;
      } else if (order.type === "stop") {
        if (order.side === "buy" && currentPrice >= (order.targetPrice || 0)) execute = true;
        if (order.side === "sell" && currentPrice <= (order.targetPrice || 0)) execute = true;
      }

      if (execute) {
        // Execute the order
        const user = await User.findById(order.userId);
        if (!user) {
          order.status = "cancelled";
          await order.save();
          continue;
        }

        const total = Number((order.quantity * currentPrice).toFixed(4));
        const originalTotal = Number((order.quantity * (order.targetPrice || currentPrice)).toFixed(4));

        if (order.side === "buy") {
          // Refund the locked balance, then charge the actual total
          user.lockedBalance -= originalTotal;
          // We assume user has the balance locked, but what if they don't?
          if (user.lockedBalance < 0) user.lockedBalance = 0; // fallback

          // If the actual total is less than what was locked, refund the difference
          const difference = originalTotal - total;
          user.balance += difference; // They bought it cheaper!

          let holding = user.holdings.find((h: IHolding) => h.symbol === order.symbol);
          if (!holding) {
            user.holdings.push({ symbol: order.symbol, quantity: order.quantity, avgBuyPrice: currentPrice });
          } else {
            const newQty = holding.quantity + order.quantity;
            holding.avgBuyPrice = (holding.quantity * holding.avgBuyPrice + order.quantity * currentPrice) / newQty;
            holding.quantity = newQty;
          }
        } else {
          // Sell: Remove from lockedHoldings
          let lockedHolding = user.lockedHoldings.find((h: IHolding) => h.symbol === order.symbol);
          if (lockedHolding) {
            lockedHolding.quantity -= order.quantity;
            if (lockedHolding.quantity <= 0.0000001) {
              user.lockedHoldings = user.lockedHoldings.filter((h: IHolding) => h.symbol !== order.symbol);
            }
          }

          // Add cash to balance
          user.balance += total;
        }

        order.status = "executed";
        await Promise.all([user.save(), order.save()]);

        await Transaction.create({
          userId: user._id,
          symbol: order.symbol,
          type: order.side,
          quantity: order.quantity,
          price: currentPrice,
          total
        });
      }
    }
  } catch (error) {
    console.error("Order Engine Error:", error);
  }
};
