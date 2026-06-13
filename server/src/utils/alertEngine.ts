import { Server } from "socket.io";
import Alert from "../models/Alert";
import { MarketInstrument } from "../types";

export const processAlerts = async (snapshot: Record<string, MarketInstrument>, io: Server) => {
  try {
    const activeAlerts = await Alert.find({ isTriggered: false });
    
    for (const alert of activeAlerts) {
      const market = snapshot[alert.symbol];
      if (!market) continue;

      let triggered = false;
      if (alert.condition === "above" && market.price >= alert.targetPrice) {
        triggered = true;
      } else if (alert.condition === "below" && market.price <= alert.targetPrice) {
        triggered = true;
      }

      if (triggered) {
        alert.isTriggered = true;
        await alert.save();
        
        // Emit to specific user room
        io.to(`user:${alert.userId.toString()}`).emit("alert:triggered", {
          id: alert._id,
          symbol: alert.symbol,
          targetPrice: alert.targetPrice,
          condition: alert.condition,
          currentPrice: market.price,
          timestamp: new Date()
        });
      }
    }
  } catch (error) {
    console.error("Alert engine error:", error);
  }
};
