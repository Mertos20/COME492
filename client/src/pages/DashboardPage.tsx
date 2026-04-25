import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { api } from "../api";
import type { PortfolioSummary } from "../types";
import { Grid, Paper, Typography, Box, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Card, CardContent, CardActionArea } from "@mui/material";
import { ArrowUpward, ArrowDownward, AccountBalanceWallet, ShowChart, Receipt, People, WorkspacePremium, AddCard } from '@mui/icons-material';

const formatMoney = (value: number): string =>
  new Intl.NumberFormat("tr-TR", { style: 'currency', currency: 'TRY' }).format(value);

function StatCard({ title, value, pnl, pnlPercent }: { title: string, value: string, pnl?: number, pnlPercent?: number }) {
    const isPositive = pnl !== undefined && pnl >= 0;
    const isNegative = pnl !== undefined && pnl < 0;

    return (
        <Grid xs={12} sm={6} md={3} key={title}>
            <Paper elevation={3} sx={{ p: 2, textAlign: 'center', height: '100%', borderColor: isPositive ? 'success.main' : isNegative ? 'error.main' : 'transparent', borderWidth: 1, borderStyle: 'solid' }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>{title}</Typography>
                <Typography variant="h5" component="p" fontWeight="bold">{value}</Typography>
                {pnl !== undefined && pnlPercent !== undefined && (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: isPositive ? 'success.main' : 'error.main' }}>
                        {isPositive ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />}
                        <Typography variant="body2" sx={{ ml: 0.5 }}>
                            {pnl.toFixed(2)} TRY ({pnlPercent.toFixed(2)}%)
                        </Typography>
                    </Box>
                )}
            </Paper>
        </Grid>
    );
}

function ActionCard({ title, description, to, icon }: { title: string, description: string, to: string, icon: React.ReactNode }) {
    return (
        <Grid xs={12} sm={6} md={4}>
            <Card elevation={2} sx={{ height: '100%' }}>
                <CardActionArea component={RouterLink} to={to} sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', height: '100%' }}>
                    {icon}
                    <CardContent>
                        <Typography gutterBottom variant="h6" component="div">
                            {title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {description}
                        </Typography>
                    </CardContent>
                </CardActionArea>
            </Card>
        </Grid>
    );
}

export default function DashboardPage() {
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
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}><CircularProgress /></Box>;
  }

  if (!portfolio) {
    return <Typography color="error">Portföy bilgileri yüklenemedi.</Typography>;
  }

  const quickActions = [
      { title: "Bakiye Yükle", to: "/load-balance", description: "Cüzdanınıza para ekleyin", icon: <AccountBalanceWallet color="primary" sx={{ fontSize: 40 }}/> },
      { title: "Al / Sat", to: "/trading", description: "Enstrüman ticareti yapın", icon: <ShowChart color="primary" sx={{ fontSize: 40 }}/> },
      { title: "Portföy", to: "/portfolio", description: "Varlıklarınızı inceleyin", icon: <Receipt color="primary" sx={{ fontSize: 40 }}/> },
      { title: "İşlem Geçmişi", to: "/transactions", description: "Tüm işlemlerinizi görün", icon: <Receipt color="primary" sx={{ fontSize: 40 }}/> },
      { title: "Danışmanlar", to: "/chat", description: "Uzmanlarla iletişim kurun", icon: <People color="primary" sx={{ fontSize: 40 }}/> },
      { title: "Üyelikler", to: "/subscriptions", description: "Premium özellikler için", icon: <WorkspacePremium color="primary" sx={{ fontSize: 40 }}/> },
  ]

  return (
    <Grid container spacing={4}>
        <Grid xs={12}>
            <Typography variant="h4" gutterBottom>Portföy Özeti</Typography>
            <Grid container spacing={3}>
                <StatCard title="Toplam Bakiye" value={formatMoney(portfolio.balance)} />
                <StatCard title="Yatırım Değeri" value={formatMoney(portfolio.investmentValue)} />
                <StatCard title="Anlık Değer" value={formatMoney(portfolio.currentValue)} />
                <StatCard title="Kar/Zarar" value={formatMoney(portfolio.totalPnl)} pnl={portfolio.totalPnl} pnlPercent={portfolio.totalPnlPercent} />
            </Grid>
        </Grid>

        <Grid xs={12}>
            <Typography variant="h4" gutterBottom>Hızlı Erişim</Typography>
            <Grid container spacing={3}>
                {quickActions.map(action => <ActionCard key={action.to} {...action} />)}
            </Grid>
        </Grid>

        <Grid xs={12}>
            <Typography variant="h4" gutterBottom>Son Varlıklarınız</Typography>
            {portfolio.holdings.length === 0 ? (
                <Typography>
                    Henüz varlık edinmemişsiniz. <Button component={RouterLink} to="/trading">Al/Sat</Button> panelinden başlayın.
                </Typography>
            ) : (
                <TableContainer component={Paper}>
                    <Table aria-label="simple table">
                        <TableHead>
                            <TableRow>
                                <TableCell>Sembol</TableCell>
                                <TableCell align="right">Miktar</TableCell>
                                <TableCell align="right">Ort. Alış</TableCell>
                                <TableCell align="right">Anlık Fiyat</TableCell>
                                <TableCell align="right">Kar/Zarar</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {portfolio.holdings.slice(0, 5).map((row) => (
                                <TableRow key={row.symbol}>
                                    <TableCell component="th" scope="row">{row.symbol}</TableCell>
                                    <TableCell align="right">{row.quantity}</TableCell>
                                    <TableCell align="right">{formatMoney(row.avgBuyPrice)}</TableCell>
                                    <TableCell align="right">{formatMoney(row.currentPrice)}</TableCell>
                                    <TableCell align="right" sx={{ color: row.pnl >= 0 ? 'success.main' : 'error.main' }}>
                                        {formatMoney(row.pnl)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Grid>
    </Grid>
  );
}
