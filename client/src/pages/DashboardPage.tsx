import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { api } from "../api";
import type { PortfolioSummary } from "../types";
import { Grid, Paper, Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Card, CardContent, CardActionArea } from "@mui/material";
import { AccountBalanceWallet, ShowChart, Receipt, People, WorkspacePremium, AddCard, TrendingUp, TrendingDown, Radar } from '@mui/icons-material';
import LoadingSkeleton from "../components/LoadingSkeleton";
import { useTranslation } from "react-i18next";

const formatMoney = (value: number): string =>
  new Intl.NumberFormat("tr-TR", { style: 'currency', currency: 'TRY' }).format(value);

const statGradients = [
  'linear-gradient(135deg, rgba(0, 212, 255, 0.12) 0%, rgba(0, 212, 255, 0.03) 100%)',
  'linear-gradient(135deg, rgba(124, 58, 237, 0.12) 0%, rgba(124, 58, 237, 0.03) 100%)',
  'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(59, 130, 246, 0.03) 100%)',
  'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0.03) 100%)',
];

const statBorders = [
  'rgba(0, 212, 255, 0.2)',
  'rgba(124, 58, 237, 0.2)',
  'rgba(59, 130, 246, 0.2)',
  'rgba(16, 185, 129, 0.2)',
];

const statIconColors = ['#00d4ff', '#7c3aed', '#3b82f6', '#10b981'];

function StatCard({ title, value, pnl, pnlPercent, index }: { title: string, value: string, pnl?: number, pnlPercent?: number, index: number }) {
    const isPositive = pnl !== undefined && pnl >= 0;
    const grad = statGradients[index % 4];
    const borderColor = pnl !== undefined ? (isPositive ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)') : statBorders[index % 4];

    return (
        <Grid item xs={12} sm={6} md={3}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                textAlign: 'center',
                height: '100%',
                background: grad,
                border: `1px solid ${borderColor}`,
                borderRadius: '16px',
                animation: 'slideUp 0.5s ease-out forwards',
                animationDelay: `${index * 0.1}s`,
                opacity: 0,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-3px)',
                  boxShadow: `0 8px 32px rgba(0, 0, 0, 0.3)`,
                },
              }}
            >
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem' }}>
                  {title}
                </Typography>
                <Typography variant="h5" component="p" sx={{ fontWeight: 800, mt: 1, mb: 0.5, color: 'text.primary' }}>
                  {value}
                </Typography>
                {pnl !== undefined && pnlPercent !== undefined && (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: isPositive ? 'success.main' : 'error.main', gap: 0.5 }}>
                        {isPositive ? <TrendingUp sx={{ fontSize: 18 }} /> : <TrendingDown sx={{ fontSize: 18 }} />}
                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                            {pnl.toFixed(2)} TRY ({pnlPercent.toFixed(2)}%)
                        </Typography>
                    </Box>
                )}
            </Paper>
        </Grid>
    );
}

const actionGradients = [
  { bg: 'rgba(16, 185, 129, 0.08)', border: 'rgba(16, 185, 129, 0.15)', iconColor: '#10b981' },
  { bg: 'rgba(0, 212, 255, 0.08)', border: 'rgba(0, 212, 255, 0.15)', iconColor: '#00d4ff' },
  { bg: 'rgba(124, 58, 237, 0.08)', border: 'rgba(124, 58, 237, 0.15)', iconColor: '#7c3aed' },
  { bg: 'rgba(59, 130, 246, 0.08)', border: 'rgba(59, 130, 246, 0.15)', iconColor: '#3b82f6' },
  { bg: 'rgba(245, 158, 11, 0.08)', border: 'rgba(245, 158, 11, 0.15)', iconColor: '#f59e0b' },
  { bg: 'rgba(236, 72, 153, 0.08)', border: 'rgba(236, 72, 153, 0.15)', iconColor: '#ec4899' },
];

function ActionCard({ title, description, to, icon, index }: { title: string, description: string, to: string, icon: React.ReactNode, index: number }) {
    const style = actionGradients[index % actionGradients.length];
    return (
        <Grid item xs={6} sm={4} md={4}>
            <Card
              elevation={0}
              sx={{
                height: '100%',
                background: style.bg,
                border: `1px solid ${style.border}`,
                animation: 'slideUp 0.5s ease-out forwards',
                animationDelay: `${0.3 + index * 0.08}s`,
                opacity: 0,
                '&:hover': {
                  borderColor: style.iconColor,
                  boxShadow: `0 0 20px ${style.bg}`,
                },
              }}
            >
                <CardActionArea
                  component={RouterLink}
                  to={to}
                  sx={{
                    p: 2.5,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    height: '100%',
                  }}
                >
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: '14px',
                        background: style.bg,
                        border: `1px solid ${style.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 1.5,
                        '& .MuiSvgIcon-root': { color: style.iconColor, fontSize: 26 },
                      }}
                    >
                      {icon}
                    </Box>
                    <CardContent sx={{ p: '0 !important' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5, color: 'text.primary' }}>
                            {title}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.4 }}>
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
  const { t } = useTranslation();

  useEffect(() => {
    const loadPortfolio = async () => {
      try {
        const res = await api.get<PortfolioSummary>("/portfolio/summary");
        setPortfolio(res.data);
      } catch {
        console.error(t('dashboard.error_console'));
      } finally {
        setLoading(false);
      }
    };

    loadPortfolio();

    const interval = setInterval(loadPortfolio, 60_000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <LoadingSkeleton type="dashboard" />;
  }

  if (!portfolio) {
    return <Typography color="error">{t('dashboard.error_loading')}</Typography>;
  }

  const quickActions = [
      { title: t('nav.load_balance'), to: "/load-balance", description: t('dashboard.quick_action_wallet'), icon: <AddCard /> },
      { title: t('nav.trading'), to: "/trading", description: t('dashboard.quick_action_trade'), icon: <ShowChart /> },
      { title: t('nav.portfolio'), to: "/portfolio", description: t('dashboard.quick_action_portfolio'), icon: <AccountBalanceWallet /> },
      { title: t('nav.transactions'), to: "/transactions", description: t('dashboard.quick_action_transactions'), icon: <Receipt /> },
      { title: t('nav.chat'), to: "/chat", description: t('dashboard.quick_action_chat'), icon: <People /> },
      { title: t('nav.subscriptions'), to: "/subscriptions", description: t('dashboard.quick_action_subscriptions'), icon: <WorkspacePremium /> },
      { title: t('nav.game'), to: "/game", description: t('dashboard.quick_action_game'), icon: <Radar /> },
  ]

  return (
    <Grid container spacing={3}>
        <Grid item xs={12}>
            <Box sx={{ mb: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
                {t('dashboard.summary_title')}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {t('dashboard.summary_desc')}
              </Typography>
            </Box>
            <Grid container spacing={2} sx={{ mt: 1 }}>
                <StatCard title={t('dashboard.total_balance')} value={formatMoney(portfolio.balance)} index={0} />
                <StatCard title={t('dashboard.investment_value')} value={formatMoney(portfolio.investmentValue)} index={1} />
                <StatCard title={t('dashboard.current_value')} value={formatMoney(portfolio.currentValue)} index={2} />
                <StatCard title={t('dashboard.pnl')} value={formatMoney(portfolio.totalPnl)} pnl={portfolio.totalPnl} pnlPercent={portfolio.totalPnlPercent} index={3} />
            </Grid>
        </Grid>

        <Grid item xs={12}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, mt: 1 }}>
              {t('dashboard.quick_access')}
            </Typography>
            <Grid container spacing={2}>
                {quickActions.map((action, i) => <ActionCard key={action.to} {...action} index={i} />)}
            </Grid>
        </Grid>

        <Grid item xs={12}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, mt: 1 }}>
              {t('dashboard.recent_assets')}
            </Typography>
            {portfolio.holdings.length === 0 ? (
                <Paper elevation={0} sx={{ p: 4, textAlign: 'center', background: 'rgba(255,255,255,0.02)' }}>
                    <Typography sx={{ color: 'text.secondary', mb: 2 }}>
                        {t('dashboard.no_assets')}
                    </Typography>
                    <Button
                      component={RouterLink}
                      to="/trading"
                      variant="contained"
                      sx={{
                        background: 'linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%)',
                        '&:hover': { background: 'linear-gradient(135deg, #33ddff 0%, #9655f5 100%)' },
                      }}
                    >
                      {t('dashboard.go_trade')}
                    </Button>
                </Paper>
            ) : (
                <TableContainer
                  component={Paper}
                  elevation={0}
                  sx={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    animation: 'slideUp 0.6s ease-out forwards',
                    animationDelay: '0.4s',
                    opacity: 0,
                  }}
                >
                    <Table aria-label="holdings table">
                        <TableHead>
                            <TableRow>
                                <TableCell>{t('dashboard.table_symbol')}</TableCell>
                                <TableCell align="right">{t('dashboard.table_amount')}</TableCell>
                                <TableCell align="right">{t('dashboard.table_avg_buy')}</TableCell>
                                <TableCell align="right">{t('dashboard.table_current_price')}</TableCell>
                                <TableCell align="right">{t('dashboard.table_pnl')}</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {portfolio.holdings.slice(0, 5).map((row) => (
                                <TableRow key={row.symbol}>
                                    <TableCell component="th" scope="row">
                                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#00d4ff' }}>{row.symbol}</Typography>
                                    </TableCell>
                                    <TableCell align="right">{row.quantity}</TableCell>
                                    <TableCell align="right">{formatMoney(row.avgBuyPrice)}</TableCell>
                                    <TableCell align="right">{formatMoney(row.currentPrice)}</TableCell>
                                    <TableCell align="right">
                                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5, color: row.pnl >= 0 ? 'success.main' : 'error.main' }}>
                                        {row.pnl >= 0 ? <TrendingUp sx={{ fontSize: 16 }} /> : <TrendingDown sx={{ fontSize: 16 }} />}
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                          {formatMoney(row.pnl)}
                                        </Typography>
                                      </Box>
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
