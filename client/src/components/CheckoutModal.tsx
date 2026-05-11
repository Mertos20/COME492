import React, { useState } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, Button, 
  TextField, Typography, Box, CircularProgress, IconButton, 
  InputAdornment, Grid 
} from '@mui/material';
import { Close, CreditCard, Lock } from '@mui/icons-material';
import { api } from '../api';

interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
  tier: string;
  price: number;
  onSuccess: () => void;
}

const formatCardNumber = (value: string) => {
  const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
  const matches = v.match(/\d{4,16}/g);
  const match = matches && matches[0] || '';
  const parts = [];
  for (let i = 0, len = match.length; i < len; i += 4) {
    parts.push(match.substring(i, i + 4));
  }
  if (parts.length) {
    return parts.join(' ');
  } else {
    return value;
  }
};

const formatExpiry = (value: string) => {
  const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
  if (v.length >= 3) {
    return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
  }
  return v;
};

export default function CheckoutModal({ open, onClose, tier, price, onSuccess }: CheckoutModalProps) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Card, 2: Verification
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [simulationCode, setSimulationCode] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (cardNumber.length < 19 || expiry.length < 5 || cvc.length < 3 || !cardName) return;
      
      setLoading(true);
      try {
        // Call request-load on backend
        const res = await api.post('/wallet/request-load', { 
          amount: price, 
          cardNumber, cardHolder: cardName, expiryDate: expiry, cvv: cvc 
        });
        setSimulationCode(res.data.simulationCode || '');
        setStep(2);
      } catch (err) {
        console.error("Payment request failed");
      } finally {
        setLoading(false);
      }
    } else {
      if (verificationCode.length < 6) return;
      
      setLoading(true);
      try {
        // Call verify-load on backend
        await api.post('/wallet/verify-load', { code: verificationCode });
        onSuccess();
      } catch (err) {
        console.error("Verification failed");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleClose = () => {
    if (loading) return;
    setCardName('');
    setCardNumber('');
    setExpiry('');
    setCvc('');
    setVerificationCode('');
    setStep(1);
    onClose();
  };

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      PaperProps={{
        sx: {
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          maxWidth: 450,
          width: '100%',
          overflow: 'hidden'
        }
      }}
    >
      <Box sx={{ 
        p: 2, 
        background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.2) 0%, rgba(0, 212, 255, 0.1) 100%)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between' 
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 40, height: 40, borderRadius: '12px', background: 'rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CreditCard sx={{ color: '#00d4ff' }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 800, m: 0 }}>
              Güvenli Ödeme
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {capitalize(tier)} Plan • {price.toLocaleString('tr-TR')} ₺/ay
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={handleClose} disabled={loading} size="small" sx={{ color: 'text.secondary', '&:hover': { color: '#fff', background: 'rgba(255, 255, 255, 0.1)' } }}>
          <Close />
        </IconButton>
      </Box>

      {/* Interactive Card Preview */}
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', background: 'rgba(0, 0, 0, 0.2)' }}>
        <Box sx={{ 
          width: 320, height: 190, borderRadius: '16px', p: 3, position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255,255,255,0.05)'
        }}>
          {/* Card Chip */}
          <Box sx={{ width: 45, height: 35, background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)', borderRadius: '6px', mb: 3, position: 'relative' }}>
            <Box sx={{ position: 'absolute', top: '50%', left: 0, width: '100%', height: '1px', background: 'rgba(0,0,0,0.2)' }} />
            <Box sx={{ position: 'absolute', top: 0, left: '50%', width: '1px', height: '100%', background: 'rgba(0,0,0,0.2)' }} />
          </Box>
          <Typography sx={{ fontFamily: 'monospace', fontSize: '1.25rem', letterSpacing: '0.15em', mb: 2, color: cardNumber ? '#fff' : 'rgba(255,255,255,0.3)' }}>
            {cardNumber || '•••• •••• •••• ••••'}
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <Box>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.6rem', textTransform: 'uppercase' }}>Kart Sahibi</Typography>
              <Typography sx={{ fontFamily: 'monospace', fontSize: '0.9rem', color: cardName ? '#fff' : 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>
                {cardName || 'AD SOYAD'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.6rem', textTransform: 'uppercase' }}>SKT</Typography>
              <Typography sx={{ fontFamily: 'monospace', fontSize: '0.9rem', color: expiry ? '#fff' : 'rgba(255,255,255,0.3)' }}>
                {expiry || 'AA/YY'}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ p: 3 }}>
          {step === 1 ? (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Kart Üzerindeki İsim"
                  variant="outlined"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  disabled={loading}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Kart Numarası"
                  variant="outlined"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  inputProps={{ maxLength: 19 }}
                  disabled={loading}
                  required
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Son Kullanma (AA/YY)"
                  variant="outlined"
                  value={expiry}
                  onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                  inputProps={{ maxLength: 5 }}
                  disabled={loading}
                  required
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="CVC"
                  variant="outlined"
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value.replace(/\D/g, ''))}
                  inputProps={{ maxLength: 4 }}
                  disabled={loading}
                  required
                />
              </Grid>
            </Grid>
          ) : (
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                Lütfen e-posta adresinize gönderilen 6 haneli güvenlik kodunu giriniz.
              </Typography>
              {simulationCode && (
                <Box sx={{ p: 1, mb: 2, background: 'rgba(16, 185, 129, 0.1)', border: '1px dashed #10b981', borderRadius: '8px' }}>
                  <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 700 }}>
                    SIMÜLASYON KODU: {simulationCode}
                  </Typography>
                </Box>
              )}
              <TextField
                fullWidth
                label="Güvenlik Kodu"
                variant="outlined"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                slotProps={{
                  htmlInput: { 
                    maxLength: 6,
                    style: { textAlign: 'center', letterSpacing: '0.5em', fontSize: '1.2rem', fontWeight: 700 }
                  }
                }}
                disabled={loading}
                required
              />
            </Box>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 3, justifyContent: 'center' }}>
            <Lock sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              Ödemeniz 256-bit SSL sertifikası ile şifrelenmektedir.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button 
            type="submit"
            fullWidth 
            variant="contained" 
            disabled={loading || (step === 1 ? (cardNumber.length < 19 || expiry.length < 5 || cvc.length < 3 || !cardName) : verificationCode.length < 6)}
            sx={{ 
              height: 52,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)',
              fontSize: '1rem',
              fontWeight: 700,
              textTransform: 'none',
              boxShadow: '0 4px 14px 0 rgba(124, 58, 237, 0.39)',
              '&:hover': {
                background: 'linear-gradient(135deg, #6d28d9 0%, #2563eb 100%)',
                boxShadow: '0 6px 20px rgba(124, 58, 237, 0.4)',
              }
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : (step === 1 ? `Ödemeyi Onayla (${price.toLocaleString('tr-TR')} ₺)` : "Doğrula ve Bitir")}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
