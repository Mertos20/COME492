import { useState, useEffect } from "react";
import { api } from "../api";
import type { MarketInstrument } from "../types";
import { Grid, Paper, Typography, TextField, Button, CircularProgress, Select, MenuItem, FormControl, InputLabel, Alert, ToggleButtonGroup, ToggleButton, Box } from "@mui/material";

const formatMoney = (value: number): string =>
  new Intl.NumberFormat("tr-TR", { style: 'currency', currency: 'TRY' }).format(value);

interface TradingPageProps {
  balance: number;
  onTradeComplete: () => void;
}

export default function TradingPage({ onTradeComplete }: TradingPageProps) {
  const [markets, setMarkets] = useState<MarketInstrument[]>([]);
  const [depositAmount, setDepositAmount] = useState("10000");
  const [order, setOrder] = useState({ side: "buy", symbol: "", quantity: "0.05" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadMarkets = async () => {
      try {
        const res = await api.get<MarketInstrument[]>("/markets/all");
        setMarkets(res.data);
        if (res.data.length > 0) {
          setOrder((prev) => ({ ...prev, symbol: res.data[0].symbol }));
        }
      } catch {
        setError("Piyasalar yüklenemedi.");
      }
    };

    loadMarkets();
  }, []);

  const handleDeposit = async () => {
    const amount = Number(depositAmount);
    if (!amount || amount <= 0) {
      setError("Geçerli bir tutar girin.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await api.post("/wallet/deposit", { amount });
      setSuccess(`${formatMoney(amount)} başarıyla yüklendi!`);
      setDepositAmount("10000");
      onTradeComplete();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Bakiye yükleme başarısız.");
    } finally {
      setLoading(false);
    }
  };

  const handleTrade = async () => {
    const quantity = Number(order.quantity);
    if (!quantity || quantity <= 0) {
      setError("Geçerli bir miktar girin.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await api.post("/trade/order", {
        side: order.side,
        symbol: order.symbol,
        quantity
      });
      setSuccess(`${order.side.toUpperCase()} işlemi başarılı!`);
      setOrder((prev) => ({ ...prev, quantity: "0.05" }));
      onTradeComplete();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err: any) {
      setError(err.response?.data?.message || "İşlem başarısız.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Grid container spacing={4}>
      <Grid xs={12} md={6}>
        <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
          <Typography variant="h5" gutterBottom>Hesaba Bakiye Yükle</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Bakiyenize para ekleyerek hemen ticarete başlayın.
          </Typography>
          <TextField
            fullWidth
            type="number"
            label="Tutar (TRY)"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            placeholder="10000"
            step="100"
            sx={{ mb: 2 }}
          />
          <Button fullWidth variant="contained" onClick={handleDeposit} disabled={loading} sx={{ py: 1.5 }}>
            {loading ? <CircularProgress size={24} /> : "Yükle"}
          </Button>
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
        </Paper>
      </Grid>

      <Grid xs={12} md={6}>
        <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
          <Typography variant="h5" gutterBottom>Al / Sat İşlemi</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Yatırım ürünleri ticareti yapın.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <ToggleButtonGroup
              color={order.side === 'buy' ? 'success' : 'error'}
              value={order.side}
              exclusive
              onChange={(e, newSide) => { if(newSide) setOrder(p => ({ ...p, side: newSide }))}}
            >
              <ToggleButton value="buy">AL</ToggleButton>
              <ToggleButton value="sell">SAT</ToggleButton>
            </ToggleButtonGroup>
          </Box>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Ürün</InputLabel>
            <Select
              value={order.symbol}
              label="Ürün"
              onChange={(e) => setOrder((p) => ({ ...p, symbol: e.target.value }))}
            >
              {markets.map((item) => (
                <MenuItem key={item.symbol} value={item.symbol}>
                  {item.symbol} - {item.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            type="number"
            label="Miktar"
            value={order.quantity}
            onChange={(e) => setOrder((p) => ({ ...p, quantity: e.target.value }))}
            placeholder="0.05"
            step="0.01"
            sx={{ mb: 2 }}
          />
          <Button 
            fullWidth 
            variant="contained" 
            color={order.side === 'buy' ? 'success' : 'error'} 
            onClick={handleTrade} 
            disabled={loading} 
            sx={{ py: 1.5 }}
          >
            {loading ? <CircularProgress size={24} /> : `${order.side.toUpperCase()} Onayla`}
          </Button>
        </Paper>
      </Grid>
    </Grid>
  );
}
