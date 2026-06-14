import React, { useState, useEffect } from 'react';
import { Box, Button, TextField, Stack, Paper, Typography, Grid, Chip, Tabs, Tab, useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { api } from '../api';
import { AccountBalanceWallet, Lock, CheckCircle, VerifiedUser, AccountBalance } from '@mui/icons-material';
import CheckoutModal from '../components/CheckoutModal';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../contexts/CurrencyContext';
import { useMarket } from '../contexts/MarketContext';

interface BalanceLoadPageProps {
  onBalanceChange?: () => void;
}

const BalanceLoadPage: React.FC<BalanceLoadPageProps> = ({ onBalanceChange }) => {
  const [tab, setTab] = useState(0); // 0: Deposit, 1: Withdraw
  const [amount, setAmount] = useState('10000');
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentBalance, setCurrentBalance] = useState(0);
  
  // Withdraw specific state
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [iban, setIban] = useState('TR');
  const [accountName, setAccountName] = useState('');

  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { t } = useTranslation();
  const { formatMoney, convertPrice, currency } = useCurrency();
  const { instruments } = useMarket();

  const usdtry = instruments.find(i => i.symbol === "USDTRY")?.price || 37;
  const eurtry = instruments.find(i => i.symbol === "EURTRY")?.price || 40;

  const getTryValue = (val: number) => {
    if (currency === "USD") return val * usdtry;
    if (currency === "EUR") return val * eurtry;
    return val;
  };

  const currencySymbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : "₺";

  const quickAmounts = [1000, 5000, 10000, 25000, 50000];

  useEffect(() => {
    // Fetch balance on mount to validate withdraw amount
    const fetchBalance = async () => {
      try {
        const res = await api.get('/wallet/balance');
        setCurrentBalance(res.data.balance);
      } catch (err) {
        console.error("Failed to fetch balance", err);
      }
    };
    fetchBalance();
  }, []);

  const handleOpenCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!val || val <= 0) {
      enqueueSnackbar(t('wallet.error_invalid_amount'), { variant: 'error' });
      return;
    }
    setCheckoutOpen(true);
  };

  const handlePaymentSuccess = async () => {
    setCheckoutOpen(false);
    const tryVal = getTryValue(parseFloat(amount));
    enqueueSnackbar(t('wallet.success_deposit', { val: formatMoney(tryVal, "TRY") }), { variant: 'success' });
    if (onBalanceChange) onBalanceChange();
    setTimeout(() => navigate('/portfolio'), 1500);
  };

  const handleIbanChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    let raw = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (!raw.startsWith('TR')) {
      raw = 'TR' + raw.replace(/^TR/i, '');
    }
    let rest = raw.substring(2).replace(/[^0-9]/g, '');
    if (rest.length > 24) {
      rest = rest.substring(0, 24);
    }
    const combined = 'TR' + rest;
    const groups = combined.match(/.{1,4}/g);
    setIban(groups ? groups.join(' ') : 'TR');
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(withdrawAmount);
    
    if (!val || val <= 0) {
      enqueueSnackbar(t('wallet.error_invalid_amount'), { variant: 'error' });
      return;
    }
    
    const tryValue = getTryValue(val);
    
    if (tryValue > currentBalance) {
      enqueueSnackbar(t('wallet.error_insufficient_balance'), { variant: 'error' });
      return;
    }
    const rawIban = iban.replace(/\s/g, '');
    if (rawIban.length !== 26) {
      enqueueSnackbar(t('wallet.error_invalid_iban'), { variant: 'error' });
      return;
    }
    if (accountName.trim().length < 3) {
      enqueueSnackbar(t('wallet.error_invalid_name'), { variant: 'error' });
      return;
    }

    setLoading(true);
    try {
      await api.post('/wallet/withdraw', {
        amount: tryValue,
        iban,
        accountName
      });
      enqueueSnackbar(t('wallet.success_withdraw'), { variant: 'success' });
      setWithdrawAmount('');
      setIban('TR');
      setAccountName('');
      if (onBalanceChange) onBalanceChange();
      const res = await api.get('/wallet/balance');
      setCurrentBalance(res.data.balance);
    } catch (err: any) {
      enqueueSnackbar(err.response?.data?.message || t('wallet.error_withdraw_failed'), { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 520, mx: 'auto', py: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 5 }}>
        <Box sx={{
          width: 64, height: 64, borderRadius: '20px', mx: 'auto', mb: 2.5,
          background: 'linear-gradient(135deg, #00d4ff 0%, #0082ff 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 30px rgba(0, 212, 255, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <AccountBalanceWallet sx={{ color: '#fff', fontSize: 32 }} />
        </Box>
        <Typography variant="h3" sx={{ fontWeight: 900, mb: 1, background: isDark ? 'linear-gradient(90deg, #fff, #94a3b8)' : 'linear-gradient(90deg, #1e293b, #475569)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          {t('wallet.title')}
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 400, mx: 'auto' }}>
          {t('wallet.subtitle')}
        </Typography>
      </Box>

      <Paper elevation={0} sx={{ 
        p: 0, 
        borderRadius: '24px',
        background: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(255, 255, 255, 0.85)', 
        backdropFilter: 'blur(10px)',
        border: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.06)',
        boxShadow: isDark ? '0 20px 40px rgba(0,0,0,0.2)' : '0 20px 40px rgba(0,0,0,0.06)',
        overflow: 'hidden'
      }}>
        <Tabs 
          value={tab} 
          onChange={(_, newValue) => setTab(newValue)}
          variant="fullWidth"
          sx={{
            borderBottom: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.06)',
            '& .MuiTab-root': { py: 2.5, fontWeight: 700, fontSize: '1rem', color: 'text.secondary' },
            '& .Mui-selected': { color: '#00d4ff !important' },
            '& .MuiTabs-indicator': { backgroundColor: '#00d4ff', height: 3 }
          }}
        >
          <Tab label={t('wallet.tab_deposit')} />
          <Tab label={t('wallet.tab_withdraw')} />
        </Tabs>

        <Box sx={{ p: 4 }}>
          {tab === 0 ? (
            <form onSubmit={handleOpenCheckout}>
          <Stack spacing={4}>
            {/* Quick Amounts */}
            <Box>
              <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                {t('wallet.quick_amount')}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                {quickAmounts.map(a => {
                  return (
                    <Chip 
                      key={a} 
                      label={formatMoney(a, currency)} 
                      clickable 
                      onClick={() => setAmount(a.toString())}
                      sx={{
                        height: 40,
                        px: 1,
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        background: amount === a.toString() ? 'rgba(0, 212, 255, 0.15)' : isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)',
                        color: amount === a.toString() ? '#00d4ff' : 'text.secondary',
                        border: `1px solid ${amount === a.toString() ? 'rgba(0, 212, 255, 0.3)' : isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
                        '&:hover': { 
                          background: 'rgba(0, 212, 255, 0.1)', 
                          borderColor: 'rgba(0, 212, 255, 0.2)',
                          transform: 'translateY(-2px)'
                        },
                        transition: 'all 0.2s'
                      }} 
                    />
                  );
                })}
              </Box>
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 700, mb: 1.5 }}>
                {t('wallet.deposit_amount')}
              </Typography>
              <TextField 
                fullWidth
                variant="outlined"
                type="number" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)} 
                placeholder="0.00"
                slotProps={{
                  input: {
                    startAdornment: <Typography sx={{ mr: 1, fontWeight: 700, color: 'text.secondary' }}>{currencySymbol}</Typography>,
                    sx: { fontSize: '1.5rem', fontWeight: 800, borderRadius: '16px' }
                  }
                }}
              />
            </Box>

            <Button 
              type="submit" 
              variant="contained" 
              fullWidth 
              disabled={loading}
              sx={{
                height: 60,
                borderRadius: '16px',
                fontSize: '1.1rem',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #00d4ff 0%, #0082ff 100%)',
                boxShadow: '0 8px 20px rgba(0, 212, 255, 0.25)',
                '&:hover': { 
                  background: 'linear-gradient(135deg, #33dcff 0%, #00d4ff 100%)',
                  boxShadow: '0 12px 25px rgba(0, 212, 255, 0.35)',
                  transform: 'translateY(-2px)'
                },
                transition: 'all 0.2s'
              }}
            >
              {loading ? t('wallet.processing') : t('wallet.btn_proceed_payment')}
            </Button>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, pt: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Lock sx={{ fontSize: 16, color: 'success.main' }} />
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>{t('wallet.secure_ssl')}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <VerifiedUser sx={{ fontSize: 16, color: 'success.main' }} />
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>3D Secure</Typography>
              </Box>
            </Box>
          </Stack>
          </form>
          ) : (
          <form onSubmit={handleWithdraw}>
            <Stack spacing={3}>
              <Box sx={{ mb: 2, p: 2, borderRadius: '16px', background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: isDark ? '1px dashed rgba(255,255,255,0.1)' : '1px dashed rgba(0,0,0,0.1)' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>{t('wallet.withdrawable_balance')}</Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#10b981' }}>
                  {formatMoney(currentBalance, "TRY")}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 700, mb: 1 }}>{t('wallet.withdraw_amount')}</Typography>
                <TextField 
                  fullWidth type="number" value={withdrawAmount} 
                  onChange={(e) => setWithdrawAmount(e.target.value)} 
                  placeholder="0.00"
                  slotProps={{
                    input: {
                      startAdornment: <Typography sx={{ mr: 1, fontWeight: 700, color: 'text.secondary' }}>{currencySymbol}</Typography>,
                      sx: { fontSize: '1.2rem', fontWeight: 700, borderRadius: '12px' }
                    }
                  }}
                />
              </Box>

              <Box>
                <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 700, mb: 1 }}>IBAN</Typography>
                <TextField 
                  fullWidth value={iban} 
                  onChange={handleIbanChange} 
                  placeholder="TR00 0000 0000 0000 0000 0000 00"
                  slotProps={{
                    input: {
                      startAdornment: <AccountBalance sx={{ mr: 1.5, color: 'text.secondary' }} />,
                      sx: { borderRadius: '12px', fontFamily: 'monospace', letterSpacing: 1 }
                    }
                  }}
                />
              </Box>

              <Box>
                <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 700, mb: 1 }}>{t('wallet.account_holder')}</Typography>
                <TextField 
                  fullWidth value={accountName} 
                  onChange={(e) => setAccountName(e.target.value)} 
                  placeholder={t('wallet.placeholder_name')}
                  slotProps={{
                    input: { sx: { borderRadius: '12px' } }
                  }}
                />
              </Box>

              <Button 
                type="submit" variant="contained" fullWidth disabled={loading || currentBalance <= 0}
                sx={{
                  mt: 2, height: 60, borderRadius: '16px', fontSize: '1.1rem', fontWeight: 800,
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  boxShadow: '0 8px 20px rgba(16, 185, 129, 0.25)',
                  '&:hover': { background: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)', transform: 'translateY(-2px)' },
                  transition: 'all 0.2s'
                }}
              >
                {loading ? t('wallet.processing') : t('wallet.btn_withdraw')}
              </Button>
            </Stack>
          </form>
          )}
        </Box>
      </Paper>

      {/* Checkout Modal Simulation */}
      <CheckoutModal 
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        tier={t('wallet.tier_load')}
        price={getTryValue(parseFloat(amount)) || 0}
        onSuccess={handlePaymentSuccess}
      />
    </Box>
  );
};

export default BalanceLoadPage;
