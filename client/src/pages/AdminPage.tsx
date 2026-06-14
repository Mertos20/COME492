import React, { useEffect, useState } from 'react';
import { api } from '../api';
import type { IUser } from '../types';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  InputAdornment,
  Tooltip as MuiTooltip
} from '@mui/material';
import {
  People,
  AccountBalanceWallet,
  SupervisorAccount,
  Receipt,
  Search,
  Edit,
  Delete,
  AdminPanelSettings,
  FilterAlt,
  Close,
  AttachMoney,
  Person,
  Lock,
  LockOpen
} from '@mui/icons-material';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { useSnackbar } from 'notistack';
import { useCurrency } from '../contexts/CurrencyContext';
import { useTranslation } from 'react-i18next';

interface AdminStats {
  totalUsers: number;
  totalBalance: number;
  expertCount: number;
  membershipDistribution: {
    free: number;
    bronze: number;
    silver: number;
    gold: number;
  };
  totalTransactions: number;
  totalVolume: number;
  recentTransactions: Array<{
    _id: string;
    userId: {
      _id: string;
      fullName: string;
      email: string;
      username: string;
    } | null;
    symbol: string;
    type: "buy" | "sell" | "deposit" | "upgrade";
    quantity: number;
    price: number;
    total: number;
    createdAt: string;
  }>;
}

const MEMBERSHIP_COLORS: Record<string, string> = {
  free: '#94a3b8',
  bronze: '#cd7f32',
  silver: '#c0c0c0',
  gold: '#ffd700',
};

export default function AdminPage() {
  const [users, setUsers] = useState<IUser[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { enqueueSnackbar } = useSnackbar();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [membershipFilter, setMembershipFilter] = useState('all');

  // Edit modal state
  const [editOpen, setEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
  const [editForm, setEditForm] = useState({
    fullName: '',
    username: '',
    balance: 0,
    role: 'user',
    membership: 'free',
    expertTier: 'bronze'
  });

  const { t } = useTranslation();
  const { formatMoney, currency } = useCurrency();
  const currencySymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '₺';

  const fetchData = async () => {
    try {
      const [usersRes, statsRes] = await Promise.all([
        api.get<IUser[]>('/admin/users'),
        api.get<AdminStats>('/admin/stats')
      ]);
      setUsers(usersRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error(err);
      enqueueSnackbar(t('admin.error_fetch'), { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEditClick = (user: IUser) => {
    setSelectedUser(user);
    setEditForm({
      fullName: user.fullName || '',
      username: user.username || '',
      balance: user.balance || 0,
      role: user.role || 'user',
      membership: user.membership || 'free',
      expertTier: user.expertTier || 'bronze'
    });
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    if (!selectedUser) return;
    try {
      const res = await api.put<IUser>(`/admin/users/${selectedUser._id}`, editForm);
      enqueueSnackbar(t('admin.success_update'), { variant: 'success' });
      setEditOpen(false);
      
      // Update local state
      setUsers(users.map(u => u._id === selectedUser._id ? res.data : u));
      // Refresh stats in background
      api.get<AdminStats>('/admin/stats').then(statsRes => setStats(statsRes.data));
    } catch (err) {
      console.error(err);
      enqueueSnackbar(t('admin.error_update'), { variant: 'error' });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm(t('admin.confirm_delete'))) {
      try {
        await api.delete(`/admin/users/${userId}`);
        enqueueSnackbar(t('admin.success_delete'), { variant: 'success' });
        setUsers(users.filter(u => u._id !== userId));
        // Refresh stats
        api.get<AdminStats>('/admin/stats').then(statsRes => setStats(statsRes.data));
      } catch (err) {
        console.error(err);
        enqueueSnackbar(t('admin.error_delete'), { variant: 'error' });
      }
    }
  };

  const handleToggleFreeze = async (user: IUser) => {
    try {
      const res = await api.put(`/admin/users/${user._id}/freeze`);
      const isFrozen = res.data.isFrozen;
      enqueueSnackbar(isFrozen ? t('admin.success_freeze') : t('admin.success_unfreeze'), { variant: 'success' });
      setUsers(users.map(u => u._id === user._id ? { ...u, isFrozen } : u));
    } catch (err) {
      console.error(err);
      enqueueSnackbar(t('admin.error_freeze'), { variant: 'error' });
    }
  };

  // Prepare volume chart data (mock 30 days)
  const volumeChartData = React.useMemo(() => {
    return Array.from({ length: 30 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      const base = 50000;
      const wave = Math.sin(i / 3) * 20000;
      const noise = Math.random() * 30000;
      return {
        date: d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' }),
        Hacim: Math.floor(base + wave + noise)
      };
    });
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Typography variant="h5" sx={{ color: 'text.secondary' }}>{t('admin.loading')}</Typography>
      </Box>
    );
  }

  // Filtered users
  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesMembership = membershipFilter === 'all' || user.membership === membershipFilter;

    return matchesSearch && matchesRole && matchesMembership;
  });

  // Prepare chart data for user balances
  const balanceChartData = users
    .slice(0, 15)
    .map(u => ({
      name: u.username || u.fullName.split(' ')[0],
      Bakiye: u.balance
    }));

  // Prepare pie chart data
  const pieData = stats
    ? Object.entries(stats.membershipDistribution).map(([tier, count]) => ({
        name: tier.toUpperCase(),
        value: count,
        color: MEMBERSHIP_COLORS[tier] || '#ffffff'
      }))
    : [];

  return (
    <Grid container spacing={3} className="animate-fadeIn">
      {/* HEADER SECTION */}
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <AdminPanelSettings sx={{ fontSize: 35, color: '#00d4ff' }} />
              {t('admin.title')}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {t('admin.subtitle')}
            </Typography>
          </Box>
        </Box>
      </Grid>

      {/* STAT CARDS */}
      <Grid item xs={12} sm={6} md={3}>
        <Paper
          elevation={0}
          className="glass-card"
          sx={{
            p: 3,
            textAlign: 'center',
            height: '100%',
            background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.12) 0%, rgba(0, 212, 255, 0.03) 100%)',
            border: '1px solid rgba(0, 212, 255, 0.2)',
            borderRadius: '16px'
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.5 }}>
            <Box sx={{ p: 1, borderRadius: '12px', background: 'rgba(0, 212, 255, 0.15)', display: 'flex' }}>
              <People sx={{ color: '#00d4ff', fontSize: 28 }} />
            </Box>
          </Box>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {t('admin.total_users')}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, mt: 1, color: 'text.primary' }}>
            {stats?.totalUsers}
          </Typography>
        </Paper>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Paper
          elevation={0}
          className="glass-card"
          sx={{
            p: 3,
            textAlign: 'center',
            height: '100%',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0.03) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: '16px'
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.5 }}>
            <Box sx={{ p: 1, borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex' }}>
              <AccountBalanceWallet sx={{ color: '#10b981', fontSize: 28 }} />
            </Box>
          </Box>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {t('admin.total_balance')}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, mt: 1, color: 'text.primary' }}>
            {formatMoney(stats?.totalBalance || 0)}
          </Typography>
        </Paper>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Paper
          elevation={0}
          className="glass-card"
          sx={{
            p: 3,
            textAlign: 'center',
            height: '100%',
            background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.12) 0%, rgba(124, 58, 237, 0.03) 100%)',
            border: '1px solid rgba(124, 58, 237, 0.2)',
            borderRadius: '16px'
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.5 }}>
            <Box sx={{ p: 1, borderRadius: '12px', background: 'rgba(124, 58, 237, 0.15)', display: 'flex' }}>
              <SupervisorAccount sx={{ color: '#7c3aed', fontSize: 28 }} />
            </Box>
          </Box>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {t('admin.active_experts')}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, mt: 1, color: 'text.primary' }}>
            {stats?.expertCount}
          </Typography>
        </Paper>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Paper
          elevation={0}
          className="glass-card"
          sx={{
            p: 3,
            textAlign: 'center',
            height: '100%',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(245, 158, 11, 0.03) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            borderRadius: '16px'
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.5 }}>
            <Box sx={{ p: 1, borderRadius: '12px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex' }}>
              <Receipt sx={{ color: '#f59e0b', fontSize: 28 }} />
            </Box>
          </Box>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {t('admin.total_tx_volume')}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, mt: 1, color: 'text.primary' }}>
            {stats?.totalTransactions} <span style={{ fontSize: '1rem', fontWeight: 500, color: '#94a3b8' }}>/ {formatMoney(stats?.totalVolume || 0)}</span>
          </Typography>
        </Paper>
      </Grid>

      {/* CHARTS SECTION */}
      <Grid item xs={12} md={8}>
        <Paper
          elevation={0}
          className="glass-card"
          sx={{ p: 3, background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '16px', display: 'flex', flexDirection: 'column', height: 420 }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'text.primary' }}>
            {t('admin.user_balances')}
          </Typography>
          <Box sx={{ flexGrow: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={balanceChartData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorBakiye" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `${currencySymbol}${val}`} />
              <ChartTooltip
                contentStyle={{ background: '#111638', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                labelStyle={{ color: '#ffffff', fontWeight: 700 }}
                itemStyle={{ color: '#00d4ff' }}
                formatter={(val: number) => [formatMoney(val), t('admin.balance')]}
              />
              <Area type="monotone" dataKey="Bakiye" stroke="#00d4ff" strokeWidth={2} fillOpacity={1} fill="url(#colorBakiye)" />
            </AreaChart>
          </ResponsiveContainer>
          </Box>
        </Paper>
      </Grid>

      <Grid item xs={12} md={4}>
        <Paper
          elevation={0}
          className="glass-card"
          sx={{ p: 3, background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '16px', height: 420, display: 'flex', flexDirection: 'column' }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'text.primary' }}>
            {t('admin.membership_dist')}
          </Typography>
          <Box sx={{ flexGrow: 1, minHeight: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip
                  contentStyle={{ background: '#111638', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  labelStyle={{ color: '#ffffff' }}
                  itemStyle={{ color: '#ffffff' }}
                />
                <Legend formatter={(value) => <span style={{ color: '#94a3b8', fontSize: '12px' }}>{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      </Grid>

      {/* VOLUME CHART SECTION */}
      <Grid item xs={12}>
        <Paper
          elevation={0}
          className="glass-card"
          sx={{ p: 3, background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '16px', display: 'flex', flexDirection: 'column', height: 380 }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'text.primary' }}>
            {t('admin.volume_30d')}
          </Typography>
          <Box sx={{ flexGrow: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volumeChartData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorHacim" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.2}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickMargin={10} minTickGap={30} />
                <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `${currencySymbol}${val >= 1000 ? val / 1000 + 'k' : val}`} />
                <ChartTooltip
                  contentStyle={{ background: '#111638', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  labelStyle={{ color: '#ffffff', fontWeight: 700, marginBottom: '8px' }}
                  itemStyle={{ color: '#10b981' }}
                  formatter={(val: number) => [formatMoney(val), t('admin.volume')]}
                />
                <Bar dataKey="Hacim" fill="url(#colorHacim)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      </Grid>

      {/* USER MANAGEMENT SECTION */}
      <Grid item xs={12}>
        <Paper
          elevation={0}
          className="glass-card-static"
          sx={{ p: 3, background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '16px' }}
        >
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', lg: 'center' }, gap: 2, mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
              {t('admin.user_management')} ({filteredUsers.length} {t('admin.listed')})
            </Typography>
            
            {/* SEARCH AND FILTERS TOOLBAR */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', width: { xs: '100%', lg: 'auto' } }}>
              <TextField
                size="small"
                placeholder={t('admin.search_placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: 'text.secondary', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  flex: { xs: 1, sm: 'none' },
                  minWidth: { xs: '100%', sm: '260px' },
                  '& .MuiOutlinedInput-root': {
                    color: 'text.primary',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '10px',
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.08)' },
                    '&:hover fieldset': { borderColor: 'rgba(0, 212, 255, 0.3)' },
                    '&.Mui-focused fieldset': { borderColor: '#00d4ff' }
                  }
                }}
              />

              <FormControl size="small" sx={{ minWidth: '130px', flex: { xs: 1, sm: 'none' } }}>
                <InputLabel id="role-filter-label" sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>{t('admin.role_filter')}</InputLabel>
                <Select
                  labelId="role-filter-label"
                  value={roleFilter}
                  label={t('admin.role_filter')}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  sx={{
                    color: 'text.primary',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.03)',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.08)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0, 212, 255, 0.3)' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#00d4ff' }
                  }}
                >
                  <MenuItem value="all">{t('admin.all')}</MenuItem>
                  <MenuItem value="user">User</MenuItem>
                  <MenuItem value="expert">Expert</MenuItem>
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: '140px', flex: { xs: 1, sm: 'none' } }}>
                <InputLabel id="membership-filter-label" sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>{t('admin.membership_filter')}</InputLabel>
                <Select
                  labelId="membership-filter-label"
                  value={membershipFilter}
                  label={t('admin.membership_filter')}
                  onChange={(e) => setMembershipFilter(e.target.value)}
                  sx={{
                    color: 'text.primary',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.03)',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.08)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0, 212, 255, 0.3)' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#00d4ff' }
                  }}
                >
                  <MenuItem value="all">{t('admin.all')}</MenuItem>
                  <MenuItem value="free">FREE</MenuItem>
                  <MenuItem value="bronze">BRONZE</MenuItem>
                  <MenuItem value="silver">SILVER</MenuItem>
                  <MenuItem value="gold">GOLD</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>

          {/* USERS TABLE */}
          <TableContainer sx={{ background: 'transparent', maxHeight: '550px' }}>
            <Table stickyHeader size="medium">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ background: '#111638 !important', color: 'text.secondary', fontWeight: 700 }}>{t('admin.table_user')}</TableCell>
                  <TableCell sx={{ background: '#111638 !important', color: 'text.secondary', fontWeight: 700 }}>{t('admin.table_email')}</TableCell>
                  <TableCell sx={{ background: '#111638 !important', color: 'text.secondary', fontWeight: 700 }}>{t('admin.table_role')}</TableCell>
                  <TableCell sx={{ background: '#111638 !important', color: 'text.secondary', fontWeight: 700 }}>{t('admin.table_plan')}</TableCell>
                  <TableCell sx={{ background: '#111638 !important', color: 'text.secondary', fontWeight: 700 }} align="right">{t('admin.balance')}</TableCell>
                  <TableCell sx={{ background: '#111638 !important', color: 'text.secondary', fontWeight: 700 }} align="center">{t('admin.table_actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ color: 'text.secondary', py: 4 }}>
                      {t('admin.no_users_found')}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow
                      key={user._id}
                      sx={{
                        transition: 'all 0.2s',
                        '&:hover': { background: 'rgba(255,255,255,0.02)' }
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box sx={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(0, 212, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Person sx={{ color: '#00d4ff', fontSize: 18 }} />
                          </Box>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: user.isFrozen ? 'text.secondary' : 'text.primary', textDecoration: user.isFrozen ? 'line-through' : 'none' }}>
                              {user.fullName}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              @{user.username || 'username'} {user.isFrozen && <span style={{ color: '#ef4444', fontWeight: 'bold' }}>({t('admin.frozen')})</span>}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ color: 'text.primary' }}>{user.email}</TableCell>
                      <TableCell>
                        {user.isAdmin ? (
                          <Chip
                            icon={<AdminPanelSettings sx={{ fontSize: '1rem !important' }} />}
                            label="Admin"
                            size="small"
                            sx={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', fontWeight: 600 }}
                          />
                        ) : user.role === 'expert' ? (
                          <Chip
                            label={`Expert (${user.expertTier?.toUpperCase() || 'BRONZE'})`}
                            size="small"
                            sx={{ background: 'rgba(124, 58, 237, 0.15)', color: '#7c3aed', border: '1px solid rgba(124, 58, 237, 0.3)', fontWeight: 600 }}
                          />
                        ) : (
                          <Chip
                            label="User"
                            size="small"
                            sx={{ background: 'rgba(0, 212, 255, 0.1)', color: '#00d4ff', border: '1px solid rgba(0, 212, 255, 0.2)', fontWeight: 500 }}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.membership.toUpperCase()}
                          size="small"
                          sx={{
                            background: 'transparent',
                            color: MEMBERSHIP_COLORS[user.membership],
                            border: `1px solid ${MEMBERSHIP_COLORS[user.membership]}`,
                            fontWeight: 600,
                            fontSize: '0.75rem'
                          }}
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: '#10b981' }}>
                        {formatMoney(user.balance)}
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                          <MuiTooltip title={t('admin.edit_user')}>
                            <IconButton
                              size="small"
                              onClick={() => handleEditClick(user)}
                              sx={{ color: '#00d4ff', '&:hover': { background: 'rgba(0, 212, 255, 0.1)' } }}
                            >
                              <Edit sx={{ fontSize: 20 }} />
                            </IconButton>
                          </MuiTooltip>
                          {!user.isAdmin && (
                            <>
                              <MuiTooltip title={user.isFrozen ? t('admin.unfreeze_account') : t('admin.freeze_account')}>
                                <IconButton
                                  size="small"
                                  onClick={() => handleToggleFreeze(user)}
                                  sx={{ color: user.isFrozen ? '#10b981' : '#f59e0b', '&:hover': { background: user.isFrozen ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)' } }}
                                >
                                  {user.isFrozen ? <LockOpen sx={{ fontSize: 20 }} /> : <Lock sx={{ fontSize: 20 }} />}
                                </IconButton>
                              </MuiTooltip>
                              <MuiTooltip title={t('admin.delete_user')}>
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteUser(user._id)}
                                  sx={{ color: '#ef4444', '&:hover': { background: 'rgba(239, 68, 68, 0.1)' } }}
                                >
                                  <Delete sx={{ fontSize: 20 }} />
                                </IconButton>
                              </MuiTooltip>
                            </>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Grid>

      {/* RECENT TRANSACTIONS ACTIVITY LOG */}
      <Grid item xs={12}>
        <Paper
          elevation={0}
          className="glass-card-static"
          sx={{ p: 3, background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '16px' }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: 'text.primary' }}>
            {t('admin.system_logs')}
          </Typography>
          <TableContainer>
            <Table size="medium">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ background: '#111638 !important', color: 'text.secondary', fontWeight: 700 }}>Kullanıcı</TableCell>
                  <TableCell sx={{ background: '#111638 !important', color: 'text.secondary', fontWeight: 700 }}>{t('admin.table_tx_type')}</TableCell>
                  <TableCell sx={{ background: '#111638 !important', color: 'text.secondary', fontWeight: 700 }}>{t('admin.table_asset')}</TableCell>
                  <TableCell sx={{ background: '#111638 !important', color: 'text.secondary', fontWeight: 700 }} align="right">{t('admin.table_amount')}</TableCell>
                  <TableCell sx={{ background: '#111638 !important', color: 'text.secondary', fontWeight: 700 }} align="right">{t('admin.table_unit_price')}</TableCell>
                  <TableCell sx={{ background: '#111638 !important', color: 'text.secondary', fontWeight: 700 }} align="right">{t('admin.table_total_amount')}</TableCell>
                  <TableCell sx={{ background: '#111638 !important', color: 'text.secondary', fontWeight: 700 }} align="right">{t('admin.table_date')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stats?.recentTransactions && stats.recentTransactions.length > 0 ? (
                  stats.recentTransactions.map((tx) => (
                    <TableRow key={tx._id} sx={{ '&:hover': { background: 'rgba(255,255,255,0.01)' } }}>
                      <TableCell>
                        {tx.userId ? (
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                              {tx.userId.fullName}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {tx.userId.email}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                            {t('admin.deleted_user')}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {tx.type === 'deposit' ? (
                          <Chip label={t('admin.tx_deposit')} size="small" sx={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', fontWeight: 600 }} />
                        ) : tx.type === 'upgrade' ? (
                          <Chip label={t('admin.tx_upgrade')} size="small" sx={{ background: 'rgba(124, 58, 237, 0.15)', color: '#7c3aed', border: '1px solid rgba(124, 58, 237, 0.3)', fontWeight: 600 }} />
                        ) : tx.type === 'buy' ? (
                          <Chip label={t('admin.tx_buy')} size="small" sx={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)', fontWeight: 600 }} />
                        ) : (
                          <Chip label={t('admin.tx_sell')} size="small" sx={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', fontWeight: 600 }} />
                        )}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>{tx.symbol}</TableCell>
                      <TableCell align="right" sx={{ color: 'text.primary' }}>{tx.quantity}</TableCell>
                      <TableCell align="right" sx={{ color: 'text.primary' }}>
                        {formatMoney(tx.price, tx.symbol && ["BTCUSDT", "ETHUSDT", "SOLUSDT", "XAUUSD", "XAGUSD"].includes(tx.symbol) ? "USD" : "TRY")}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: tx.type === 'sell' || tx.type === 'deposit' ? '#10b981' : '#ef4444' }}>
                        {tx.type === 'sell' || tx.type === 'deposit' ? '+' : '-'}{formatMoney(tx.total, "TRY")}
                      </TableCell>
                      <TableCell align="right" sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                        {new Date(tx.createdAt).toLocaleString('tr-TR')}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ color: 'text.secondary', py: 4 }}>
                      {t('admin.no_tx_found')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Grid>

      {/* USER EDIT DIALOG */}
      <Dialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        PaperProps={{
          sx: {
            background: '#111638',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
            color: 'text.primary',
            minWidth: { xs: '90%', sm: '460px' }
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{t('admin.edit_user')}</Typography>
          <IconButton onClick={() => setEditOpen(false)} sx={{ color: 'text.secondary' }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: 'rgba(255,255,255,0.08)', py: 2.5 }}>
          <Grid container spacing={2.5}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                disabled
                label={t('admin.fullname')}
                value={editForm.fullName}
                onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& label': { color: 'text.secondary' },
                  '& label.Mui-focused': { color: '#00d4ff' },
                  '& .MuiOutlinedInput-root': {
                    color: '#ffffff',
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                    '&:hover fieldset': { borderColor: 'rgba(0, 212, 255, 0.3)' },
                    '&.Mui-focused fieldset': { borderColor: '#00d4ff' }
                  }
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                disabled
                label={t('admin.username')}
                value={editForm.username}
                onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                sx={{
                  '& label': { color: 'text.secondary' },
                  '& label.Mui-focused': { color: '#00d4ff' },
                  '& .MuiOutlinedInput-root': {
                    color: '#ffffff',
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                    '&:hover fieldset': { borderColor: 'rgba(0, 212, 255, 0.3)' },
                    '&.Mui-focused fieldset': { borderColor: '#00d4ff' }
                  }
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                disabled
                label="Bakiye"
                type="number"
                value={editForm.balance}
                onChange={(e) => setEditForm({ ...editForm, balance: Number(e.target.value) })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AttachMoney sx={{ color: '#10b981' }} />
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& label': { color: 'text.secondary' },
                  '& label.Mui-focused': { color: '#00d4ff' },
                  '& .MuiOutlinedInput-root': {
                    color: '#ffffff',
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                    '&:hover fieldset': { borderColor: 'rgba(0, 212, 255, 0.3)' },
                    '&.Mui-focused fieldset': { borderColor: '#00d4ff' }
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="edit-role-label" sx={{ color: 'text.secondary' }}>Rol</InputLabel>
                <Select
                  labelId="edit-role-label"
                  value={editForm.role}
                  label="Rol"
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  sx={{
                    color: '#ffffff',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0, 212, 255, 0.3)' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#00d4ff' }
                  }}
                >
                  <MenuItem value="user">User</MenuItem>
                  <MenuItem value="expert">Expert</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="edit-membership-label" sx={{ color: 'text.secondary' }}>{t('admin.membership_plan')}</InputLabel>
                <Select
                  labelId="edit-membership-label"
                  value={editForm.membership}
                  label={t('admin.membership_plan')}
                  onChange={(e) => setEditForm({ ...editForm, membership: e.target.value })}
                  sx={{
                    color: '#ffffff',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0, 212, 255, 0.3)' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#00d4ff' }
                  }}
                >
                  <MenuItem value="free">FREE</MenuItem>
                  <MenuItem value="bronze">BRONZE</MenuItem>
                  <MenuItem value="silver">SILVER</MenuItem>
                  <MenuItem value="gold">GOLD</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {editForm.role === 'expert' && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel id="edit-expert-tier-label" sx={{ color: 'text.secondary' }}>{t('admin.expert_tier')}</InputLabel>
                  <Select
                    labelId="edit-expert-tier-label"
                    value={editForm.expertTier}
                    label={t('admin.expert_tier')}
                    onChange={(e) => setEditForm({ ...editForm, expertTier: e.target.value })}
                    sx={{
                      color: '#ffffff',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0, 212, 255, 0.3)' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#00d4ff' }
                    }}
                  >
                    <MenuItem value="bronze">BRONZE</MenuItem>
                    <MenuItem value="silver">SILVER</MenuItem>
                    <MenuItem value="gold">GOLD</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => setEditOpen(false)}
            sx={{ color: 'text.secondary', fontWeight: 600 }}
          >
            {t('admin.cancel')}
          </Button>
          <Button
            onClick={handleEditSave}
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%)',
              fontWeight: 700,
              px: 3,
              borderRadius: '8px',
              '&:hover': { background: 'linear-gradient(135deg, #33ddff 0%, #9655f5 100%)' }
            }}
          >
            {t('admin.save_changes')}
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
}
