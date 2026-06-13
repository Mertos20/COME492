import { Box, Typography, Button, Paper, Stack } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { ArrowBack, Home, TrendingDown } from "@mui/icons-material";

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
      {/* Arka plan ışıkları (login sayfasındaki orblara benzer) */}
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
          animation: 'scaleIn 0.5s ease-out',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Box
          sx={{
            width: 96,
            height: 96,
            mx: 'auto',
            borderRadius: '24px',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(245, 158, 11, 0.1) 100%)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 3,
            animation: 'pulse 3s infinite ease-in-out',
          }}
        >
          <TrendingDown sx={{ fontSize: 48, color: '#ef4444' }} />
        </Box>

        <Typography
          variant="h1"
          sx={{
            fontWeight: 900,
            fontSize: { xs: '4rem', md: '5rem' },
            background: 'linear-gradient(135deg, #ef4444 0%, #f59e0b 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 1,
            lineHeight: 1,
          }}
        >
          404
        </Typography>

        <Typography variant="h4" sx={{ fontWeight: 800, mb: 2, color: '#e2e8f0' }}>
          Kayıp Yatırım
        </Typography>

        <Typography variant="body1" sx={{ color: '#94a3b8', mb: 4, lineHeight: 1.6 }}>
          Aradığınız sayfa değer kaybetmiş, piyasadan kaldırılmış veya hiç var olmamış olabilir. Portföyünüze güvenli bir şekilde geri dönün.
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
            startIcon={<Home />}
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
            Ana Sayfaya Dön
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}