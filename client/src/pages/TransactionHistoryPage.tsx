import { useEffect, useState } from "react";
import { api } from "../api";
import type { TransactionItem } from "../types";
import { Paper, Typography, Grid, TextField, Button, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Alert, Select, MenuItem, FormControl, InputLabel, Chip, Box } from "@mui/material";

const formatMoney = (value: number): string =>
  new Intl.NumberFormat("tr-TR", { style: 'currency', currency: 'TRY' }).format(value);

const formatDateTime = (value: string | null): string => {
  if (!value) return "-";
  return new Date(value).toLocaleString("tr-TR");
};

const typeColors: Record<string, "success" | "error" | "info" | "warning" | "default"> = {
    buy: 'success',
    sell: 'error',
    deposit: 'info',
    upgrade: 'warning'
}

export default function TransactionHistoryPage() {
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ type: "all", symbol: "", from: "", to: "" });

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.type !== "all") params.set("type", filters.type);
      if (filters.symbol.trim()) params.set("symbol", filters.symbol.trim().toUpperCase());
      if (filters.from) params.set("from", new Date(filters.from).toISOString());
      if (filters.to) params.set("to", new Date(filters.to).toISOString());

      const query = params.toString();
      const response = await api.get<TransactionItem[]>(`/transactions/history${query ? `?${query}` : ""}`);
      setTransactions(response.data);
    } catch {
      console.error("İşlemler yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>İşlem Geçmişi</Typography>

      <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth>
            <InputLabel>İşlem Tipi</InputLabel>
            <Select
              value={filters.type}
              label="İşlem Tipi"
              onChange={(e) => setFilters((p) => ({ ...p, type: e.target.value }))}
            >
              <MenuItem value="all">Tüm İşlem Tipleri</MenuItem>
              <MenuItem value="buy">Alış</MenuItem>
              <MenuItem value="sell">Satış</MenuItem>
              <MenuItem value="deposit">Bakiye Yükleme</MenuItem>
              <MenuItem value="upgrade">Üyelik Yükseltme</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            label="Sembol (örn: BTCUSDT)"
            value={filters.symbol}
            onChange={(e) => setFilters((p) => ({ ...p, symbol: e.target.value }))}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <TextField
            fullWidth
            type="date"
            label="Başlangıç Tarihi"
            value={filters.from}
            onChange={(e) => setFilters((p) => ({ ...p, from: e.target.value }))}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <TextField
            fullWidth
            type="date"
            label="Bitiş Tarihi"
            value={filters.to}
            onChange={(e) => setFilters((p) => ({ ...p, to: e.target.value }))}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} md={2}>
          <Button fullWidth variant="contained" onClick={loadTransactions} disabled={loading} sx={{ height: '56px' }}>
            {loading ? <CircularProgress size={24} /> : "Filtrele"}
          </Button>
        </Grid>
      </Grid>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>
      ) : transactions.length === 0 ? (
        <Alert severity="info">Filtrelerinize uygun işlem bulunamadı.</Alert>
      ) : (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Tarih</TableCell>
                <TableCell>Tip</TableCell>
                <TableCell>Sembol</TableCell>
                <TableCell align="right">Miktar</TableCell>
                <TableCell align="right">Fiyat</TableCell>
                <TableCell align="right">Toplam</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx._id}>
                  <TableCell>{formatDateTime(tx.createdAt)}</TableCell>
                  <TableCell>
                    <Chip label={tx.type.toUpperCase()} color={typeColors[tx.type] || 'default'} size="small" />
                  </TableCell>
                  <TableCell>{tx.symbol || '-'}</TableCell>
                  <TableCell align="right">{tx.quantity || '-'}</TableCell>
                  <TableCell align="right">{tx.price ? formatMoney(tx.price) : '-'}</TableCell>
                  <TableCell align="right">{formatMoney(tx.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
}
