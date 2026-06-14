import { useState } from 'react';
import { api } from '../api';
import type { AuthUser } from '../types';
import {
  Box, Typography, Paper, TextField, Button, Stack, Alert, Avatar, Chip, Divider, CircularProgress, Grid,
  Dialog, DialogTitle, DialogContent, DialogActions, LinearProgress
} from '@mui/material';
import { Person, Email, Edit, Save, WorkspacePremium, Cancel, Lock, Memory, Contactless, VerifiedUser, RocketLaunch, Shield, GppGood, Fingerprint } from '@mui/icons-material';
import { useTranslation, Trans } from 'react-i18next';

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

const vipStyles: Record<string, { bg: string, text: string, shadow: string }> = {
  free: { bg: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.01) 100%)', text: '#e2e8f0', shadow: 'rgba(0,0,0,0.3)' },
  bronze: { bg: 'linear-gradient(135deg, #cd7f32 0%, #8b4513 100%)', text: '#fff', shadow: 'rgba(205,127,50,0.4)' },
  silver: { bg: 'linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%)', text: '#0f172a', shadow: 'rgba(192,192,192,0.4)' },
  gold: { bg: 'linear-gradient(135deg, #ffd700 0%, #ff8c00 100%)', text: '#000', shadow: 'rgba(255,215,0,0.5)' },
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
  const [tilt, setTilt] = useState({ x: 0, y: 0, active: false });
  const [shine, setShine] = useState({ x: 50, y: 50 });
  const { t } = useTranslation();

  if (!user) return <Alert severity="warning">{t('profile.error_login')}</Alert>;

  const tier = tierColors[user.membership] || tierColors.free;
  const vipStyle = vipStyles[user.membership] || vipStyles.free;
  const vCardNum = `•••• •••• •••• ${user.id.substring(user.id.length - 4).toUpperCase()}`;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -15; // Max 15 derece tilt
    const rotateY = ((x - centerX) / centerX) * 15;

    setTilt({ x: rotateX, y: rotateY, active: true });
    setShine({ x: (x / rect.width) * 100, y: (y / rect.height) * 100 });
  };

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
      setError(err.response?.data?.message || t('profile.error_update'));
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
      setError(err.response?.data?.message || t('profile.error_cancel'));
    } finally {
      setCancelLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    setPasswordLoading(true);
    setPasswordError('');
    setPasswordSuccess('');

    if (!passwordData.currentPassword || !passwordData.newPassword) {
      setPasswordError(t('profile.error_password_fields'));
      setPasswordLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError(t('profile.error_password_length'));
      setPasswordLoading(false);
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError(t('profile.error_password_match'));
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
      setPasswordError(err.response?.data?.message || t('profile.error_password_change'));
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
      <style>
        {`
          @keyframes spinBorder {
            100% { transform: rotate(360deg); }
          }
          @keyframes radarPulse {
            0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
            100% { box-shadow: 0 0 0 15px rgba(16, 185, 129, 0); }
          }
        `}
      </style>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <Person sx={{ color: '#00d4ff', fontSize: 28 }} />
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>{t('profile.title')}</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>{t('profile.subtitle')}</Typography>
        </Box>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Grid container spacing={4}>
        {/* Left Side: VIP Card & Destructive Actions */}
        <Grid item xs={12} md={5}>
          {/* 3D Holographic VIP Card */}
          <Box sx={{ perspective: '1000px', width: '100%', mb: 3 }}>
            <Box
              onMouseMove={handleMouseMove}
              onMouseLeave={() => { setTilt({ x: 0, y: 0, active: false }); setShine({ x: 50, y: 50 }); }}
              sx={{
                width: '100%',
                height: 230,
                position: 'relative',
                transition: tilt.active ? 'none' : 'all 0.5s ease',
                transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
                transformStyle: 'preserve-3d',
                borderRadius: '20px',
                background: vipStyle.bg,
                boxShadow: `0 20px 40px ${vipStyle.shadow}`,
                border: '1px solid rgba(255,255,255,0.15)',
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                overflow: 'hidden',
                cursor: 'default',
              }}
            >
              {/* Holographic Shine Layer */}
              <Box sx={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                background: `radial-gradient(circle at ${shine.x}% ${shine.y}%, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 60%)`,
                pointerEvents: 'none',
                mixBlendMode: user.membership === 'free' ? 'overlay' : 'soft-light',
                opacity: tilt.active ? 1 : 0,
                transition: 'opacity 0.3s ease',
                zIndex: 1
              }} />

              {/* Card Top (Chip & Signal) */}
              <Box sx={{ zIndex: 2, position: 'relative', transform: 'translateZ(30px)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Memory sx={{ fontSize: 44, color: vipStyle.text, opacity: 0.9 }} />
                <Contactless sx={{ fontSize: 32, color: vipStyle.text, opacity: 0.8 }} />
              </Box>

              {/* Card Bottom (Number & Details) */}
              <Box sx={{ zIndex: 2, position: 'relative', transform: 'translateZ(40px)' }}>
                <Typography sx={{ fontFamily: 'monospace', fontSize: '1.25rem', letterSpacing: '0.15em', color: vipStyle.text, mb: 2, textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                  {vCardNum}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: vipStyle.text, opacity: 0.8, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {user.role === 'expert' ? t('profile.role_expert') : t('profile.role_trader')}
                    </Typography>
                    <Typography sx={{ fontFamily: 'monospace', fontSize: '1.1rem', color: vipStyle.text, textTransform: 'uppercase', fontWeight: 800, textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                      {user.fullName}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="caption" sx={{ color: vipStyle.text, opacity: 0.8, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {t('profile.tier_label')}
                    </Typography>
                    <Typography sx={{ fontFamily: 'monospace', fontSize: '1.1rem', color: vipStyle.text, textTransform: 'uppercase', fontWeight: 800, textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                      {user.membership}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Badges & Achievements */}
          <Paper elevation={0} sx={{
            p: 3, mb: 3,
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '20px'
          }}>
            <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 700, mb: 2, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.65rem' }}>
              {t('profile.achievements_title')}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '16px', transition: 'all 0.3s', '&:hover': { background: 'rgba(16,185,129,0.1)', transform: 'translateY(-2px)' } }}>
                  <Box sx={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                    <VerifiedUser sx={{ color: '#10b981', fontSize: 20 }} />
                  </Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#e2e8f0', lineHeight: 1.2, whiteSpace: 'pre-line' }}>{t('profile.badge_verified')}</Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', background: `${tier.bg}`, border: `1px solid ${tier.border}`, borderRadius: '16px', transition: 'all 0.3s', '&:hover': { transform: 'translateY(-2px)' } }}>
                  <Box sx={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                    <Shield sx={{ color: tier.color, fontSize: 20 }} />
                  </Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#e2e8f0', lineHeight: 1.2, whiteSpace: 'pre-line' }}>{user.membership === 'free' ? t('profile.badge_standard') : t('profile.badge_elite')}</Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: '16px', transition: 'all 0.3s', '&:hover': { background: 'rgba(124,58,237,0.1)', transform: 'translateY(-2px)' } }}>
                  <Box sx={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(124,58,237,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                    <RocketLaunch sx={{ color: '#7c3aed', fontSize: 20 }} />
                  </Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#e2e8f0', lineHeight: 1.2, whiteSpace: 'pre-line' }}>{t('profile.badge_early')}</Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* Membership Cancel */}
          {user.role === 'user' && user.membership !== 'free' && (
            <Paper elevation={0} sx={{
              p: 3,
              background: 'rgba(239,68,68,0.03)',
              border: '1px solid rgba(239,68,68,0.12)',
            }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#ef4444', mb: 1 }}>
                {t('profile.cancel_title')}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, lineHeight: 1.6 }}>
                {t('profile.cancel_desc', { membership: user.membership.toUpperCase() })}
              </Typography>
              <Button
                variant="outlined"
                color="error"
                size="small"
                onClick={() => setCancelDialog(true)}
                sx={{ fontWeight: 600 }}
              >
                {t('profile.btn_cancel_membership')}
              </Button>
            </Paper>
          )}
        </Grid>

        {/* Right Side: Forms */}
        <Grid item xs={12} md={7}>
          {/* Profile Settings Card */}
          <Paper elevation={0} sx={{
            p: 4, mb: 4,
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, mb: 3 }}>
              <Box sx={{ position: 'relative', width: 72, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {/* Rotating Border Glow */}
                <Box sx={{ 
                  position: 'absolute', inset: -2, borderRadius: '50%', 
                  background: `conic-gradient(from 0deg, transparent, ${tier.color}, transparent)`, 
                  animation: 'spinBorder 3s linear infinite' 
                }} />
                {/* Avatar Background Mask */}
                <Box sx={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#0a0e27' }} />
                <Avatar sx={{
                  width: 64, height: 64, fontSize: '1.5rem', fontWeight: 700, position: 'relative', zIndex: 1,
                  background: `linear-gradient(135deg, ${tier.color}, ${user.membership === 'gold' ? '#ff8c00' : '#7c3aed'})`,
                }}>
                  {user.fullName.charAt(0).toUpperCase()}
                </Avatar>
              </Box>
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
                    label={user.role === 'expert' ? t('profile.chip_expert') : t('profile.chip_user')}
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
                {editing ? t('profile.btn_cancel') : t('profile.btn_edit')}
              </Button>
            </Box>

            <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mb: 3 }} />

            <Stack spacing={2.5}>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, mb: 0.5, display: 'block', textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.05em' }}>
                  {t('profile.label_name')}
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
                  {t('profile.label_email')}
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
                  {t('profile.btn_save')}
                </Button>
              )}
            </Stack>
          </Paper>

          {/* Password Change */}
          <Paper elevation={0} sx={{
            p: 4, mb: 3,
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
              <Lock sx={{ color: '#7c3aed', fontSize: 20 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{t('profile.password_title')}</Typography>
            </Box>

            {passwordSuccess && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setPasswordSuccess('')}>{passwordSuccess}</Alert>}
            {passwordError && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setPasswordError('')}>{passwordError}</Alert>}

            <Stack spacing={2}>
              <TextField
                fullWidth size="small" type="password" label={t('profile.label_current_password')}
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData(p => ({ ...p, currentPassword: e.target.value }))}
                slotProps={{ input: { startAdornment: <Lock sx={{ mr: 1, color: 'text.secondary', fontSize: '1.1rem' }} /> } }}
              />
              <TextField
                fullWidth size="small" type="password" label={t('profile.label_new_password')}
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData(p => ({ ...p, newPassword: e.target.value }))}
                slotProps={{ input: { startAdornment: <Lock sx={{ mr: 1, color: 'text.secondary', fontSize: '1.1rem' }} /> } }}
              />
              <TextField
                fullWidth size="small" type="password" label={t('profile.label_confirm_password')}
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
                {t('profile.btn_change_password')}
              </Button>
            </Stack>
          </Paper>

          {/* Security Center */}
          <Paper elevation={0} sx={{
            p: 4, mb: 3,
            background: 'linear-gradient(135deg, rgba(16,185,129,0.03) 0%, rgba(0,0,0,0) 100%)',
            border: '1px solid rgba(16,185,129,0.2)',
            borderRadius: '20px'
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <GppGood sx={{ color: '#10b981', fontSize: 24 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#10b981' }}>{t('profile.security_title')}</Typography>
                </Box>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>{t('profile.security_desc')}</Typography>
              </Box>
              <Box sx={{ 
                width: 48, height: 48, borderRadius: '50%', background: 'rgba(16,185,129,0.1)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: 'radarPulse 2s infinite'
              }}>
                <Fingerprint sx={{ color: '#10b981', fontSize: 28 }} />
              </Box>
            </Box>
            
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>{t('profile.shield_score')}</Typography>
                <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 800 }}>{t('profile.shield_status')}</Typography>
              </Box>
              <LinearProgress variant="determinate" value={85} sx={{ 
                height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.05)',
                '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, #10b981, #34d399)', borderRadius: 4 }
              }} />
            </Box>

            <Grid container spacing={2}>
              {[
                { label: t('profile.sec_email'), status: t('profile.status_active'), color: '#10b981' },
                { label: t('profile.sec_device'), status: t('profile.status_active'), color: '#10b981' },
                { label: t('profile.sec_2fa'), status: t('profile.status_passive'), color: '#f59e0b' },
              ].map((sec, i) => (
                <Grid item xs={12} sm={4} key={i}>
                  <Box sx={{ p: 1.5, borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>{sec.label}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: sec.color }}>{sec.status}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelDialog} onClose={() => setCancelDialog(false)}>
        <DialogTitle sx={{ fontWeight: 700 }}>{t('profile.dialog_cancel_title')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('profile.dialog_cancel_desc', { membership: user.membership.toUpperCase() })}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCancelDialog(false)} sx={{ color: 'text.secondary' }}>{t('profile.dialog_btn_no')}</Button>
          <Button
            onClick={handleCancelMembership}
            color="error" variant="contained"
            disabled={cancelLoading}
            startIcon={cancelLoading ? <CircularProgress size={16} /> : undefined}
          >
            {t('profile.dialog_btn_yes')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
