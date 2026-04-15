import { useEffect, useState } from "react";
import { api } from "../api";
import type { PortfolioSummary } from "../types";
import { Grid, Paper, Typography, Box, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Alert } from "@mui/material";
import { ArrowUpward, ArrowDownward } from '@mui/icons-material';

const formatMoney = (value: number): string =>
  new Intl.NumberFormat("tr-TR", { style: 'currency', currency: 'TRY' }).format(value);

export default function PortfolioPage() {
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPortfolio = async () => {
      try {
        const res = await api.get<PortfolioSummary>("/portfolio/summary");
        setPortfolio(res.data);
      } catch {
        console.error("Portföy yüklenemedi");
      } finally {
        setLoading(false);
      }
    };

    loadPortfolio();
  }, []);

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  }

  if (!portfolio) {
    return <Alert severity="error">Portföy bilgileri yüklenemedi.</Alert>;
  }

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Portföy Detayları</Typography>

      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6">Genel Durum</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', color: portfolio.totalPnl >= 0 ? 'success.main' : 'error.main' }}>
                    {portfolio.totalPnl >= 0 ? <ArrowUpward /> : <ArrowDownward />}
                    <Typography variant="h5" component="span" sx={{ fontWeight: 'bold', mx: 1 }}>
                        {formatMoney(portfolio.totalPnl)}
                    </Typography>
                    <Typography variant="subtitle1">
                        ({portfolio.totalPnlPercent.toFixed(2)}%)
                    </Typography>
                </Box>
            </Paper>
        </Grid>
        <Grid xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                <Typography><strong>Yatırım Değeri:</strong> {formatMoney(portfolio.investmentValue)}</Typography>
                <Typography><strong>Anlık Değer:</strong> {formatMoney(portfolio.currentValue)}</Typography>
                <Typography><strong>Bakiye:</strong> {formatMoney(portfolio.balance)}</Typography>
            </Paper>
        </Grid>
      </Grid>

      {portfolio.holdings.length === 0 ? (
        <Alert severity="info">Henüz bir varlık edinmemişsiniz.</Alert>
      ) : (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Sembol</TableCell>
                <TableCell align="right">Miktar</TableCell>
                <TableCell align="right">Ort. Alış Fiyatı</TableCell>
                <TableCell align="right">Anlık Fiyat</TableCell>
                <TableCell align="right">Toplam Değer</TableCell>
                <TableCell align="right">Kar/Zarar</TableCell>
                <TableCell align="right">Kar/Zarar %</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {portfolio.holdings.map((row) => {
                const totalValue = row.quantity * row.currentPrice;
                const pnlPercent = row.avgBuyPrice > 0 ? ((row.currentPrice - row.avgBuyPrice) / row.avgBuyPrice) * 100 : 0;
                return (
                  <TableRow key={row.symbol}>
                    <TableCell component="th" scope="row">{row.symbol}</TableCell>
                    <TableCell align="right">{row.quantity}</TableCell>
                    <TableCell align="right">{formatMoney(row.avgBuyPrice)}</TableCell>
                    <TableCell align="right">{formatMoney(row.currentPrice)}</TableCell>
                    <TableCell align="right">{formatMoney(totalValue)}</TableCell>
                    <TableCell align="right" sx={{ color: row.pnl >= 0 ? 'success.main' : 'error.main' }}>
                      {formatMoney(row.pnl)}
                    </TableCell>
                    <TableCell align="right" sx={{ color: pnlPercent >= 0 ? 'success.main' : 'error.main' }}>
                      {pnlPercent.toFixed(2)}%
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
}
