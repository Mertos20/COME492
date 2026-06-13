import React, { Component, ErrorInfo, ReactNode } from "react";
import { Box, Typography, Button } from "@mui/material";
import { Warning, Refresh } from "@mui/icons-material";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            background: "linear-gradient(135deg, #0a0e27 0%, #111638 100%)",
            gap: 3,
            p: 4,
          }}
        >
          <Box
            sx={{
              width: 72,
              height: 72,
              borderRadius: "20px",
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              animation: "pulse 2s ease-in-out infinite",
            }}
          >
            <Warning sx={{ color: "#ef4444", fontSize: 36 }} />
          </Box>

          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              color: "#e2e8f0",
              textAlign: "center",
            }}
          >
            Bir Hata Oluştu
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: "#94a3b8",
              textAlign: "center",
              maxWidth: 480,
              lineHeight: 1.6,
            }}
          >
            Beklenmedik bir sorunla karşılaşıldı. Lütfen sayfayı yenileyin veya daha sonra tekrar deneyin.
          </Typography>

          {this.state.error && (
            <Box
              sx={{
                p: 2,
                borderRadius: "12px",
                background: "rgba(239, 68, 68, 0.05)",
                border: "1px solid rgba(239, 68, 68, 0.15)",
                maxWidth: 500,
                width: "100%",
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: "#ef4444",
                  fontFamily: "monospace",
                  wordBreak: "break-all",
                  fontSize: "0.7rem",
                }}
              >
                {this.state.error.message}
              </Typography>
            </Box>
          )}

          <Box sx={{ display: "flex", gap: 2, mt: 1 }}>
            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={() => window.location.reload()}
              sx={{
                background: "linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%)",
                fontWeight: 700,
                px: 3,
                "&:hover": {
                  background: "linear-gradient(135deg, #33ddff 0%, #9655f5 100%)",
                },
              }}
            >
              Sayfayı Yenile
            </Button>
            <Button
              variant="outlined"
              onClick={this.handleReset}
              sx={{
                borderColor: "rgba(255, 255, 255, 0.15)",
                color: "#94a3b8",
                fontWeight: 600,
                "&:hover": {
                  borderColor: "rgba(0, 212, 255, 0.3)",
                  color: "#00d4ff",
                },
              }}
            >
              Tekrar Dene
            </Button>
          </Box>
        </Box>
      );
    }

    return this.props.children;
  }
}
