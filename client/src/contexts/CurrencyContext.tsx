import React, { createContext, useContext, useState, useEffect } from "react";
import { useMarket } from "./MarketContext";

export type Currency = "TRY" | "USD" | "EUR";

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  convertPrice: (value: number, baseCurrency: "TRY" | "USD") => number;
  formatMoney: (value: number, baseCurrency?: "TRY" | "USD") => string;
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: "TRY",
  setCurrency: () => {},
  convertPrice: (v) => v,
  formatMoney: (v) => `₺${v.toFixed(2)}`,
});

export const useCurrency = () => useContext(CurrencyContext);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<Currency>(() => {
    const saved = localStorage.getItem("portfol_currency");
    if (saved === "USD" || saved === "EUR" || saved === "TRY") return saved;
    return "TRY";
  });
  
  const { instruments } = useMarket();

  const setCurrency = (c: Currency) => {
    localStorage.setItem("portfol_currency", c);
    setCurrencyState(c);
  };

  const usdtry = instruments.find(i => i.symbol === "USDTRY")?.price || 37;
  const eurtry = instruments.find(i => i.symbol === "EURTRY")?.price || 40;

  // Converts a value FROM its baseCurrency TO the user's selected currency
  const convertPrice = (value: number, baseCurrency: "TRY" | "USD" = "TRY"): number => {
    if (value === undefined || value === null || isNaN(value)) return 0;
    
    // First convert to TRY as the universal base
    let tryValue = value;
    if (baseCurrency === "USD") {
      tryValue = value * usdtry;
    }

    // Now convert from TRY to target currency
    if (currency === "TRY") return tryValue;
    if (currency === "USD") return tryValue / usdtry;
    if (currency === "EUR") return tryValue / eurtry;
    
    return tryValue;
  };

  const formatMoney = (value: number, baseCurrency: "TRY" | "USD" = "TRY"): string => {
    if (value === undefined || value === null || isNaN(value)) value = 0;
    
    const converted = convertPrice(value, baseCurrency);
    
    let prefix = "₺";
    let locale = "tr-TR";
    if (currency === "USD") { prefix = "$"; locale = "en-US"; }
    if (currency === "EUR") { prefix = "€"; locale = "de-DE"; }

    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(converted);
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, convertPrice, formatMoney }}>
      {children}
    </CurrencyContext.Provider>
  );
};
