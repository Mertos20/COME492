import { Box, Typography, Button, Paper, Stack } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { keyframes } from "@mui/system";
import { ArrowBack, AccountBalanceWallet, TrendingDown } from "@mui/icons-material";

// Grafiğin çakılma animasyonu: Yeşil (yükseliş) başlar, kırmızıya döner ve aşağı düşer
const marketDropAnimation = keyframes`
  0% { transform: translateY(0) rotate(0deg); color: #10b981; } 
  15% { transform: translateY(-10px) rotate(-10deg); color: #10b981; } 
  25% { transform: translateY(0) rotate(0deg); color: #ef4444; } 
  70% { transform: translateY(50px) rotate(35deg); opacity: 0; color: #ef4444; }
  100% { transform: translateY(50px) rotate(35deg); opacity: 0; color: #ef4444; }
`;

// 404 yazısı için hafif ve ciddi bir nabız/parlama efekti
const subtlePulse = keyframes`
  0% { text-shadow: 0 0 15px rgba(0, 212, 255, 0.2); }
  50% { text-shadow: 0 0 30px rgba(0, 212, 255, 0.6); }
  100% { text-shadow: 0 0 15px rgba(0, 212, 255, 0.2); }
`;

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: "flex",
        position: "relative",
        overflow: "hidden",
        background: "linear-gradient(135deg, #0a0e27 0%, #111638 50%, #0a0e27 100%)",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
      }}
    >
      {/* Arka plan ışıkları */}
      <div className="floating-orb floating-orb-1" />
      <div className="floating-orb floating-orb-2" />

      <Paper
        elevation={6}
        sx={{
          p: { xs: 4, md: 6 },
          maxWidth: 540,
          width: '100%',
          background: 'rgba(17, 22, 56, 0.85)',
          backdropFilter: 'blur(40px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '24px',
          textAlign: 'center',
          animation: 'fadeIn 0.5s ease-out',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Box
          sx={{
            width: 100,
            height: 100,
            mx: 'auto',
            borderRadius: '24px',
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 3,
            overflow: 'hidden', // Okun kutunun dışına taşmasını engeller
            boxShadow: 'inset 0 4px 20px rgba(0,0,0,0.5)'
          }}
        >
          <TrendingDown 
            sx={{ 
              fontSize: 56, 
              animation: `${marketDropAnimation} 3s infinite cubic-bezier(0.4, 0, 0.2, 1)` 
            }} 
          />
        </Box>

        <Typography
          variant="h1"
          sx={{
            fontWeight: 900,
            fontSize: { xs: '3.5rem', md: '4.5rem' },
            background: 'linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 1,
            lineHeight: 1,
            animation: `${subtlePulse} 3s infinite ease-in-out`,
          }}
        >
          404
        </Typography>

        <Typography variant="h4" sx={{ fontWeight: 800, mb: 2, color: '#e2e8f0' }}>
          Varlık Bulunamadı
        </Typography>

        <Typography variant="body1" sx={{ color: '#94a3b8', mb: 4, lineHeight: 1.6 }}>
          Erişmeye çalıştığınız sayfa piyasa dışı kalmış, taşınmış veya geçersiz bir bağlantı içeriyor olabilir. Lütfen güvenli alana geri dönün.
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => navigate(-1)}
            sx={{
              py: 1.5,
              px: 3,
              fontWeight: 700,
              borderRadius: '12px',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              color: 'text.secondary',
              '&:hover': {
                borderColor: '#00d4ff',
                color: '#00d4ff',
                background: 'rgba(0, 212, 255, 0.05)',
              },
              transition: 'all 0.2s',
            }}
          >
            Geri Dön
          </Button>
          <Button
            variant="contained"
            startIcon={<AccountBalanceWallet />}
            onClick={() => navigate("/")}
            sx={{
              py: 1.5,
              px: 3,
              fontWeight: 700,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%)',
              boxShadow: '0 8px 25px rgba(0, 212, 255, 0.25)',
              "&:hover": {
                background: 'linear-gradient(135deg, #33ddff 0%, #9655f5 100%)',
                transform: 'translateY(-2px)',
                boxShadow: '0 12px 30px rgba(0, 212, 255, 0.35)',
              },
              transition: 'all 0.2s',
            }}
          >
            Portföye Dön
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}