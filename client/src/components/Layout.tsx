import { Link, useNavigate } from "react-router-dom";
import React, { ReactNode } from "react";
import type { AuthUser } from "../types";
import {
  AppBar,
  Box,
  Button,
  Container,
  Paper,
  Tab,
  Tabs,
  Toolbar,
  Typography,
} from "@mui/material";

const formatMoney = (value: number): string =>
  new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(
    value
  );

interface LayoutProps {
  user: AuthUser | null;
  balance: number;
  onLogout: () => void;
  children: ReactNode;
  activePage: string;
}

export default function Layout({ user, balance, onLogout, children, activePage }: LayoutProps) {
  const navigate = useNavigate();

  const baseLinks = [
    { path: "/", label: "Dashboard" },
    { path: "/markets", label: "Piyasalar" },
  ];

  const userLinks =
    user?.role === "user"
      ? [
          { path: "/portfolio", label: "Portföy" },
          { path: "/transactions", label: "İşlem Geçmişi" },
          { path: "/trading", label: "Al/Sat" },
          { path: "/chat", label: "Danışmanlar" },
        ]
      : user?.role === "expert" ? [{ path: "/expert", label: "Uzman Paneli" }] : [];

  const allLinks = [...baseLinks, ...userLinks];

  return (
    <Box>
        <AppBar position="static" color="default" elevation={0}>
            <Toolbar>
                <Box sx={{ flexGrow: 1, cursor: 'pointer' }} onClick={() => navigate('/')}>
                <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    portfol.io
                </Typography>
               
                </Box>
                {user && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Paper elevation={2} sx={{ p: 1.5, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Typography variant="subtitle2">{user.fullName}</Typography>
                        <Typography variant="body2" color="text.secondary">{(user.membership || "free").toUpperCase()}</Typography>
                        {user.role === "user" && <Typography variant="h6" color="primary">{formatMoney(balance)}</Typography>}
                    </Paper>
                    {user.role === "user" && (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button variant="contained" color="secondary" size="small" onClick={() => navigate('/subscriptions')}>
                                Puan Satın Al
                            </Button>
                            <Button variant="contained" color="primary" size="small" onClick={() => navigate('/deposit')}>
                                Bakiye Yükle
                            </Button>
                        </Box>
                    )}
                    <Button variant="outlined" color="primary" onClick={onLogout}>
                    Çıkış Yap
                    </Button>
                </Box>
                )}
            </Toolbar>
        </AppBar>
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        {user && (
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={activePage} aria-label="nav tabs">
                    {allLinks.map((link) => (
                        <Tab
                            key={link.path}
                            label={link.label}
                            value={link.path}
                            component={Link}
                            to={link.path}
                        />
                    ))}
                </Tabs>
            </Box>
        )}
        <main>{children}</main>
      </Container>
    </Box>
  );
}
