import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  TextField,
  Stack,
  Container,
  Paper,
  Typography,
  Grid,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { api } from '../api';

const BalanceLoadPage: React.FC = () => {
  const [amount, setAmount] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState(1); // 1 for card details, 2 for verification
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();

  const handleCardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/wallet/request-load', {
        amount: parseFloat(amount),
        cardNumber,
        cardHolder,
        expiryDate,
        cvv,
      });
      setStep(2);
      enqueueSnackbar('Doğrulama Kodu Gönderildi. Lütfen e-postanızı kontrol edin.', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Bakiye yükleme isteği gönderilemedi.', { variant: 'error' });
    }
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/wallet/verify-load', {
        code: verificationCode,
      });
      enqueueSnackbar('Bakiye başarıyla yüklendi.', { variant: 'success' });
      navigate('/portfolio');
    } catch (error) {
      enqueueSnackbar('Geçersiz doğrulama kodu.', { variant: 'error' });
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 8 }}>
        {step === 1 ? (
          <form onSubmit={handleCardSubmit}>
            <Stack spacing={3}>
              <Typography variant="h4" component="h1" gutterBottom>
                Bakiye Yükle
              </Typography>
              <TextField
                label="Tutar"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Yüklenecek tutarı girin"
                required
                fullWidth
              />
              <TextField
                label="Kart Numarası"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                placeholder="---- ---- ---- ----"
                required
                fullWidth
              />
              <TextField
                label="Kart Sahibi"
                value={cardHolder}
                onChange={(e) => setCardHolder(e.target.value)}
                placeholder="Ad Soyad"
                required
                fullWidth
              />
              <Grid container spacing={2}>
                <Grid xs={6}>
                  <TextField
                    label="Son Kullanma Tarihi"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    placeholder="AA/YY"
                    required
                    fullWidth
                  />
                </Grid>
                <Grid xs={6}>
                  <TextField
                    label="CVV"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                    placeholder="---"
                    required
                    fullWidth
                  />
                </Grid>
              </Grid>
              <Button type="submit" variant="contained" color="primary" fullWidth>
                Devam
              </Button>
            </Stack>
          </form>
        ) : (
          <form onSubmit={handleVerificationSubmit}>
            <Stack spacing={3}>
              <Typography variant="h4" component="h1" gutterBottom>
                Doğrulama
              </Typography>
              <Typography>
                E-posta adresinize gönderilen doğrulama kodunu girin.
              </Typography>
              <TextField
                label="Doğrulama Kodu"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="------"
                required
                fullWidth
              />
              <Button type="submit" variant="contained" color="primary" fullWidth>
                Bakiye Yükle
              </Button>
            </Stack>
          </form>
        )}
      </Paper>
    </Container>
  );
};

export default BalanceLoadPage;
