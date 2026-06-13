import { useState } from 'react';
import { api } from '../api';
import type { AuthUser } from '../types';
import {
  Box, Typography, Paper, TextField, Button, Stack, Alert, Avatar, Chip, Divider, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { Person, Email, Edit, Save, WorkspacePremium, Cancel, Lock } from '@mui/icons-material';

interface ProfilePageProps {
  user: AuthUser | null;
  onProfileUpdate: (user: AuthUser, token: string) => void;
  onMembershipCancel: (token: string) => void;
}

const tierColors: Record<string, { color: string; bg: string; border: string }> = {
  free: { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.2)' },
  bronze: { color: '#cd7f32', bg: 'rgba(205,127,50,0.1)', border: 'rgba(205,127,50,0.2)' },
  silver: { color: '#c0c0c0', bg: 'rgba(192,192,192,0.1)', border: 'rgba(192,192,192,0.2)' },
  gold: { color: '#ffd700', bg: 'rgba(255,215,0,0.1)', border: 'rgba(255,215,0,0.2)' },
};

export default function ProfilePage({ user, onProfileUpdate, onMembershipCancel }: ProfilePageProps) {
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [cancelDialog, setCancelDialog] = useState(false);
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  if (!user) return <Alert severity="warning">Giriş yapmanız gerekiyor.</Alert>;

  const tier = tierColors[user.membership] || tierColors.free;

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.put<{ user: AuthUser; token: string; message: string }>('/auth/profile', { fullName, email });
      onProfileUpdate(res.data.user, res.data.token);
      setSuccess(res.data.message);
      setEditing(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Profil güncellenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelMembership = async () => {
    setCancelLoading(true);
    setError('');
    try {
      const res = await api.post<{ token: string; message: string }>('/auth/cancel-membership');
      onMembershipCancel(res.data.token);
      setSuccess(res.data.message);
      setCancelDialog(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Üyelik iptal edilemedi');
    } finally {
      setCancelLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    setPasswordLoading(true);
    setPasswordError('');
    setPasswordSuccess('');

    if (!passwordData.currentPassword || !passwordData.newPassword) {
      setPasswordError('Tüm alanlar zorunludur');
      setPasswordLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('Yeni şifre en az 6 karakter olmalıdır');
      setPasswordLoading(false);
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Yeni şifreler eşleşmiyor');
      setPasswordLoading(false);
      return;
    }

    try {
      const res = await api.post<{ message: string }>('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setPasswordSuccess(res.data.message);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || 'Şifre değiştirilemedi');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <Person sx={{ color: '#00d4ff', fontSize: 28 }} />
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>Profil</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>Hesap bilgilerinizi yönetin</Typography>
        </Box>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Profile Card */}
      <Paper elevation={0} sx={{
        p: 4, mb: 3,
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, mb: 3 }}>
          <Avatar sx={{
            width: 64, height: 64, fontSize: '1.5rem', fontWeight: 700,
            background: `linear-gradient(135deg, ${tier.color}, #7c3aed)`,
          }}>
            {user.fullName.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>{user.fullName}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <Chip
                icon={<WorkspacePremium sx={{ fontSize: '0.9rem !important' }} />}
                label={(user.membership || 'free').toUpperCase()}
                size="small"
                sx={{
                  fontWeight: 700, fontSize: '0.65rem',
                  background: tier.bg, color: tier.color,
                  border: `1px solid ${tier.border}`,
                  '& .MuiChip-icon': { color: tier.color },
                }}
              />
              <Chip
                label={user.role === 'expert' ? 'Uzman' : 'Kullanıcı'}
                size="small"
                sx={{
                  fontWeight: 600, fontSize: '0.65rem',
                  background: 'rgba(0,212,255,0.08)', color: '#00d4ff',
                  border: '1px solid rgba(0,212,255,0.15)',
                }}
              />
            </Box>
          </Box>
          <Button
            variant="outlined"
            size="small"
            startIcon={editing ? <Cancel /> : <Edit />}
            onClick={() => { setEditing(!editing); setError(''); setSuccess(''); }}
            sx={{
              borderColor: 'rgba(255,255,255,0.1)', color: 'text.secondary',
              '&:hover': { borderColor: 'rgba(0,212,255,0.3)', color: '#00d4ff' },
            }}
          >
            {editing ? 'İptal' : 'Düzenle'}
          </Button>
        </Box>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mb: 3 }} />

        <Stack spacing={2.5}>
          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, mb: 0.5, display: 'block', textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.05em' }}>
              Ad Soyad
            </Typography>
            {editing ? (
              <TextField
                fullWidth size="small" value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                slotProps={{ input: { startAdornment: <Person sx={{ mr: 1, color: 'text.secondary', fontSize: '1.1rem' }} /> } }}
              />
            ) : (
              <Typography variant="body1" sx={{ fontWeight: 600 }}>{user.fullName}</Typography>
            )}
          </Box>

          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, mb: 0.5, display: 'block', textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.05em' }}>
              E-posta Adresi
            </Typography>
            {editing ? (
              <TextField
                fullWidth size="small" value={email} type="email"
                onChange={(e) => setEmail(e.target.value)}
                slotProps={{ input: { startAdornment: <Email sx={{ mr: 1, color: 'text.secondary', fontSize: '1.1rem' }} /> } }}
              />
            ) : (
              <Typography variant="body1" sx={{ fontWeight: 600 }}>{user.email}</Typography>
            )}
          </Box>

          {editing && (
            <Button
              variant="contained" startIcon={loading ? <CircularProgress size={16} /> : <Save />}
              onClick={handleSave} disabled={loading}
              sx={{
                py: 1.2, fontWeight: 700,
                background: 'linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%)',
                '&:hover': { background: 'linear-gradient(135deg, #33ddff 0%, #9655f5 100%)' },
              }}
            >
              Kaydet
            </Button>
          )}
        </Stack>
      </Paper>

      {/* Membership Cancel */}
      {user.role === 'user' && user.membership !== 'free' && (
        <Paper elevation={0} sx={{
          p: 3,
          background: 'rgba(239,68,68,0.03)',
          border: '1px solid rgba(239,68,68,0.12)',
        }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#ef4444', mb: 1 }}>
            Üyelik İptali
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, lineHeight: 1.6 }}>
            Mevcut {user.membership.toUpperCase()} üyeliğinizi iptal edip ücretsiz plana geçebilirsiniz.
            Bu işlem uzman danışman erişiminizi kaldırır.
          </Typography>
          <Button
            variant="outlined"
            color="error"
            size="small"
            onClick={() => setCancelDialog(true)}
            sx={{ fontWeight: 600 }}
          >
            Üyeliği İptal Et
          </Button>
        </Paper>
      )}

      {/* Password Change */}
      <Paper elevation={0} sx={{
        p: 3, mb: 3,
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
          <Lock sx={{ color: '#7c3aed', fontSize: 20 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Şifre Değiştir</Typography>
        </Box>

        {passwordSuccess && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setPasswordSuccess('')}>{passwordSuccess}</Alert>}
        {passwordError && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setPasswordError('')}>{passwordError}</Alert>}

        <Stack spacing={2}>
          <TextField
            fullWidth size="small" type="password" label="Mevcut Şifre"
            value={passwordData.currentPassword}
            onChange={(e) => setPasswordData(p => ({ ...p, currentPassword: e.target.value }))}
            slotProps={{ input: { startAdornment: <Lock sx={{ mr: 1, color: 'text.secondary', fontSize: '1.1rem' }} /> } }}
          />
          <TextField
            fullWidth size="small" type="password" label="Yeni Şifre"
            value={passwordData.newPassword}
            onChange={(e) => setPasswordData(p => ({ ...p, newPassword: e.target.value }))}
            slotProps={{ input: { startAdornment: <Lock sx={{ mr: 1, color: 'text.secondary', fontSize: '1.1rem' }} /> } }}
          />
          <TextField
            fullWidth size="small" type="password" label="Yeni Şifre (Tekrar)"
            value={passwordData.confirmPassword}
            onChange={(e) => setPasswordData(p => ({ ...p, confirmPassword: e.target.value }))}
            slotProps={{ input: { startAdornment: <Lock sx={{ mr: 1, color: 'text.secondary', fontSize: '1.1rem' }} /> } }}
          />
          <Button
            variant="contained"
            onClick={handlePasswordChange}
            disabled={passwordLoading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
            startIcon={passwordLoading ? <CircularProgress size={16} /> : <Save />}
            sx={{
              py: 1.2, fontWeight: 700, alignSelf: 'flex-start',
              background: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)',
              '&:hover': { background: 'linear-gradient(135deg, #6d28d9 0%, #2563eb 100%)' },
            }}
          >
            Şifreyi Değiştir
          </Button>
        </Stack>
      </Paper>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelDialog} onClose={() => setCancelDialog(false)}>
        <DialogTitle sx={{ fontWeight: 700 }}>Üyelik İptali</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {user.membership.toUpperCase()} üyeliğinizi iptal etmek istediğinize emin misiniz?
            Uzman danışman erişiminiz kaldırılacaktır.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCancelDialog(false)} sx={{ color: 'text.secondary' }}>Vazgeç</Button>
          <Button
            onClick={handleCancelMembership}
            color="error" variant="contained"
            disabled={cancelLoading}
            startIcon={cancelLoading ? <CircularProgress size={16} /> : undefined}
          >
            Evet, İptal Et
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
