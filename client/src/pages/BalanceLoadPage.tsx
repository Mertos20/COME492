import React, { useState } from 'react';
import { Box, Button, TextField, Stack, Paper, Typography, Grid, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { api } from '../api';
import { AccountBalanceWallet, Lock, CheckCircle, VerifiedUser } from '@mui/icons-material';
import CheckoutModal from '../components/CheckoutModal';

interface BalanceLoadPageProps {
  onBalanceChange?: () => void;
}

const BalanceLoadPage: React.FC<BalanceLoadPageProps> = ({ onBalanceChange }) => {
  const [amount, setAmount] = useState('10000');
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();

  const quickAmounts = [1000, 5000, 10000, 25000, 50000];

  const handleOpenCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!val || val <= 0) {
      enqueueSnackbar('Lütfen geçerli bir tutar girin.', { variant: 'error' });
      return;
    }
    setCheckoutOpen(true);
  };

  const handlePaymentSuccess = async () => {
    setCheckoutOpen(false);
    const val = parseFloat(amount);
    enqueueSnackbar(`${val.toLocaleString('tr-TR')} ₺ başarıyla yüklendi!`, { variant: 'success' });
    if (onBalanceChange) onBalanceChange();
    // Wait a bit to show success before redirecting
    setTimeout(() => navigate('/portfolio'), 1500);
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
        <Typography variant="h3" sx={{ fontWeight: 900, mb: 1, background: 'linear-gradient(90deg, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Bakiye Yükle
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 400, mx: 'auto' }}>
          Güvenli ödeme altyapımızla cüzdanınıza anında bakiye ekleyin.
        </Typography>
      </Box>

      <Paper elevation={0} sx={{ 
        p: 4, 
        borderRadius: '24px',
        background: 'rgba(15, 23, 42, 0.6)', 
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
      }}>
        <form onSubmit={handleOpenCheckout}>
          <Stack spacing={4}>
            {/* Quick Amounts */}
            <Box>
              <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                Hızlı Tutar Seçimi
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                {quickAmounts.map(a => (
                  <Chip 
                    key={a} 
                    label={`₺${a.toLocaleString('tr-TR')}`} 
                    clickable 
                    onClick={() => setAmount(String(a))}
                    sx={{
                      height: 40,
                      px: 1,
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      background: amount === String(a) ? 'rgba(0, 212, 255, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      color: amount === String(a) ? '#00d4ff' : 'text.secondary',
                      border: `1px solid ${amount === String(a) ? 'rgba(0, 212, 255, 0.3)' : 'rgba(255, 255, 255, 0.08)'}`,
                      '&:hover': { 
                        background: 'rgba(0, 212, 255, 0.1)', 
                        borderColor: 'rgba(0, 212, 255, 0.2)',
                        transform: 'translateY(-2px)'
                      },
                      transition: 'all 0.2s'
                    }} 
                  />
                ))}
              </Box>
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 700, mb: 1.5 }}>
                Yüklenecek Tutar
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
                    startAdornment: <Typography sx={{ mr: 1, fontWeight: 700, color: 'text.secondary' }}>₺</Typography>,
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
              {loading ? 'İşleniyor...' : 'Ödeme Adımına Geç'}
            </Button>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, pt: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Lock sx={{ fontSize: 16, color: 'success.main' }} />
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>Güvenli SSL</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <VerifiedUser sx={{ fontSize: 16, color: 'success.main' }} />
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>3D Secure</Typography>
              </Box>
            </Box>
          </Stack>
        </form>
      </Paper>

      {/* Checkout Modal Simulation */}
      <CheckoutModal 
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        tier="Bakiye Yükleme"
        price={parseFloat(amount) || 0}
        onSuccess={handlePaymentSuccess}
      />
    </Box>
  );
};

export default BalanceLoadPage;
