import React, { useState, useEffect } from 'react';
import { Badge, IconButton, Popover, Box, Typography, List, ListItem, ListItemText, Divider, Alert } from '@mui/material';
import { Notifications, NotificationsActive, ShowChart } from '@mui/icons-material';
import { io, Socket } from 'socket.io-client';
import { useSnackbar } from 'notistack';

interface NotificationBellProps {
  token: string | null;
}

interface AlertNotification {
  id: string;
  symbol: string;
  targetPrice: number;
  condition: string;
  currentPrice: number;
  timestamp: string;
}

export default function NotificationBell() {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [notifications, setNotifications] = useState<AlertNotification[]>([]);
  const { enqueueSnackbar } = useSnackbar();
  
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const socket: Socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000', {
      auth: { token }
    });

    socket.on('alert:triggered', (alert: AlertNotification) => {
      setNotifications(prev => [alert, ...prev]);
      const dir = alert.condition === 'above' ? 'üstüne çıktı' : 'altına düştü';
      enqueueSnackbar(`🚨 ALARM: ${alert.symbol} fiyatı ${alert.targetPrice} ${dir}! (Güncel: ${alert.currentPrice})`, { 
        variant: 'info',
        autoHideDuration: 6000 
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [enqueueSnackbar]);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const clearNotifications = () => {
    setNotifications([]);
    handleClose();
  };

  const open = Boolean(anchorEl);
  const id = open ? 'notification-popover' : undefined;
  const unreadCount = notifications.length;

  return (
    <>
      <IconButton 
        onClick={handleClick} 
        sx={{ 
          color: unreadCount > 0 ? '#f59e0b' : 'text.secondary',
          background: unreadCount > 0 ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
          '&:hover': { background: unreadCount > 0 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.05)' }
        }}
      >
        <Badge badgeContent={unreadCount} color="error">
          {unreadCount > 0 ? <NotificationsActive /> : <Notifications />}
        </Badge>
      </IconButton>

      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            width: 320,
            maxHeight: 400,
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
            borderRadius: '16px',
            mt: 1
          }
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Bildirimler</Typography>
          {notifications.length > 0 && (
            <Typography 
              variant="caption" 
              sx={{ color: '#00d4ff', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
              onClick={clearNotifications}
            >
              Tümünü Temizle
            </Typography>
          )}
        </Box>
        
        <List sx={{ p: 0 }}>
          {notifications.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Notifications sx={{ fontSize: 40, color: 'text.secondary', opacity: 0.5, mb: 1 }} />
              <Typography variant="body2" color="text.secondary">Yeni bildiriminiz yok</Typography>
            </Box>
          ) : (
            notifications.map((notif, i) => (
              <React.Fragment key={`${notif.id}-${i}`}>
                <ListItem sx={{ py: 1.5 }}>
                  <Box sx={{ mr: 2, p: 1, borderRadius: '50%', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                    <ShowChart fontSize="small" />
                  </Box>
                  <ListItemText 
                    primary={
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#f59e0b' }}>
                        {notif.symbol} Alarmı Tetiklendi
                      </Typography>
                    }
                    secondary={
                      <React.Fragment>
                        <Typography variant="caption" display="block" sx={{ color: 'text.primary', mt: 0.5 }}>
                          Fiyat {notif.targetPrice} ₺ {notif.condition === 'above' ? 'üstüne çıktı' : 'altına düştü'}.
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
                          Güncel: {notif.currentPrice} ₺ • {new Date(notif.timestamp).toLocaleTimeString()}
                        </Typography>
                      </React.Fragment>
                    }
                  />
                </ListItem>
                {i < notifications.length - 1 && <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />}
              </React.Fragment>
            ))
          )}
        </List>
      </Popover>
    </>
  );
}
