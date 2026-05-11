import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import type { MarketInstrument } from "../types";

interface MarketContextType {
  instruments: MarketInstrument[];
  loading: boolean;
  error: string | null;
}

const MarketContext = createContext<MarketContextType>({
  instruments: [],
  loading: true,
  error: null,
});

export const useMarket = () => useContext(MarketContext);

export const MarketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [instruments, setInstruments] = useState<MarketInstrument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Determine backend URL from current origin if in prod, or default to localhost:5000 in dev
    const isDev = import.meta.env.MODE === "development";
    const backendUrl = isDev ? "http://localhost:5000/market" : "/market";

    const socket: Socket = io(backendUrl, {
      transports: ["websocket", "polling"]
    });

    socket.on("connect", () => {
      setError(null);
    });

    socket.on("market:update", (data: MarketInstrument[]) => {
      setInstruments(data);
      setLoading(false);
    });

    socket.on("connect_error", (err) => {
      console.error("Market socket connection error:", err);
      setError("Piyasa verilerine bağlanılamadı.");
      setLoading(false);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <MarketContext.Provider value={{ instruments, loading, error }}>
      {children}
    </MarketContext.Provider>
  );
};
