import { useEffect, useState, useRef } from "react";
import { Socket, io } from "socket.io-client";
import { api } from "../api";
import type { ChatMessage, ExpertProfile, AuthUser } from "../types";
import { Grid, Paper, Typography, TextField, Button, CircularProgress, Alert, Tabs, Tab, Box, List, ListItem, ListItemText, ListItemAvatar, Avatar, Chip } from "@mui/material";
import { Send, SmartToy, Person, Forum } from '@mui/icons-material';
import { useTranslation } from "react-i18next";

interface ChatPageProps { user: AuthUser | null; token: string | null; }

export default function ChatPage({ user, token }: ChatPageProps) {
  const { t } = useTranslation();
  const [activeTier, setActiveTier] = useState<"bronze" | "silver" | "gold">("bronze");
  const [experts, setExperts] = useState<ExpertProfile[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatText, setChatText] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const [chatSocket, setChatSocket] = useState<Socket | null>(null);
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiMessages, setAiMessages] = useState<{ role: "user" | "ai"; content: string }[]>([
    { role: "ai", content: t('chat.ai_greeting') }
  ]);
  const [loadingAi, setLoadingAi] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const aiEndRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); };
  const scrollAiToBottom = () => { aiEndRef.current?.scrollIntoView({ behavior: "smooth" }); };
  useEffect(scrollToBottom, [messages]);
  useEffect(scrollAiToBottom, [aiMessages]);

  useEffect(() => {
    if (!token || !user) return;
    const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";
    const instance = io(socketUrl, { auth: { token } });
    instance.on("connect", () => console.log("✅ Socket.io connected"));
    instance.on("connect_error", (error) => console.error("❌ Socket connect error:", error.message));
    instance.on("chat:new", (incoming: ChatMessage) => {
      setMessages((prev) => prev.some(i => i._id === incoming._id) ? prev : [...prev, incoming]);
    });
    instance.on("error", (error) => console.error("❌ Socket error:", error));
    setChatSocket(instance);
    return () => { instance.disconnect(); };
  }, [token, user]);

  useEffect(() => {
    const loadData = async () => {
      if (!user || user.role !== "user") return;
      try {
        const [expertsRes, msgRes] = await Promise.all([
          api.get<ExpertProfile[]>("/chat/experts"),
          api.get<ChatMessage[]>(`/chat/messages?tier=${activeTier}`)
        ]);
        setExperts(expertsRes.data); setMessages(msgRes.data);
      } catch (error) { console.error("❌ Veri yüklenemedi:", error); }
    };
    loadData();
  }, [user, activeTier]);

  const sendMessage = async () => {
    if (!chatText.trim() || !user) return;
    try {
      setSendError(null);
      const payload = { tier: activeTier, message: chatText.trim() };
      const savedRes = await api.post<ChatMessage>("/chat/messages", payload);
      setMessages((prev) => prev.some(i => i._id === savedRes.data._id) ? prev : [...prev, savedRes.data]);
      if (chatSocket?.connected) chatSocket.emit("chat:message", { ...payload, messageId: savedRes.data._id });
      setChatText("");
    } catch { setSendError(t('chat.error_send')); }
  };

  const askAI = async () => {
    if (!aiQuestion.trim()) return;
    const userMsg = aiQuestion.trim();
    setAiMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setAiQuestion("");
    setLoadingAi(true);
    try {
      const res = await api.post<{ response: string }>("/ai/chat", { message: userMsg });
      setAiMessages(prev => [...prev, { role: "ai", content: res.data.response }]);
    } catch (err: any) {
      const errMsg = err.response?.data?.message || t('chat.error_ai_unavailable');
      setAiMessages(prev => [...prev, { role: "ai", content: errMsg }]);
    } finally {
      setLoadingAi(false);
    }
  };

  if (!user || user.role !== "user") return <Alert severity="warning">{t('chat.error_user_only')}</Alert>;

  const canAccessExperts = user.membership !== "free";
  const tierExperts = experts.filter(e => e.expertTier === activeTier);

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>{t('chat.title')}</Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>{t('chat.subtitle')}</Typography>

      <Grid container spacing={3}>
        {/* AI Chat */}
        <Grid item xs={12}>
          <Paper elevation={0} sx={{
            p: 0, display: 'flex', flexDirection: 'column',
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)',
            overflow: 'hidden',
          }}>
            <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(0,212,255,0.04) 100%)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SmartToy sx={{ color: '#7c3aed' }} />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>{t('chat.ai_advisor_title')}</Typography>
              </Box>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>{t('chat.ai_powered_by')}</Typography>
            </Box>
            <Box sx={{ height: 400, p: 2, overflowY: 'auto', background: 'rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {aiMessages.map((msg, idx) => (
                <Box key={idx} sx={{
                  display: 'flex', gap: 1.5, animation: 'slideUp 0.4s ease-out',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}>
                  {msg.role === 'ai' && (
                    <Avatar sx={{ width: 32, height: 32, background: 'linear-gradient(135deg, #7c3aed, #00d4ff)' }}>
                      <SmartToy sx={{ fontSize: 18 }} />
                    </Avatar>
                  )}
                  <Box sx={{
                    p: 2, maxWidth: '85%',
                    borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '4px 16px 16px 16px',
                    background: msg.role === 'user'
                      ? 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(124,58,237,0.15))'
                      : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${msg.role === 'user' ? 'rgba(0,212,255,0.2)' : 'rgba(255,255,255,0.06)'}`,
                  }}>
                    <Typography variant="caption" sx={{ color: msg.role === 'user' ? '#00d4ff' : '#7c3aed', fontWeight: 700, display: 'block', mb: 0.5 }}>
                      {msg.role === 'user' ? user?.fullName || t('chat.you') : t('chat.ai_advisor')}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.primary', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{msg.content}</Typography>
                  </Box>
                  {msg.role === 'user' && (
                    <Avatar sx={{ width: 32, height: 32, background: 'linear-gradient(135deg, #00d4ff, #7c3aed)' }}>
                      <Person sx={{ fontSize: 16 }} />
                    </Avatar>
                  )}
                </Box>
              ))}
              {loadingAi && (
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  <Avatar sx={{ width: 32, height: 32, background: 'linear-gradient(135deg, #7c3aed, #00d4ff)' }}>
                    <SmartToy sx={{ fontSize: 18 }} />
                  </Avatar>
                  <Box sx={{ p: 2, borderRadius: '4px 16px 16px 16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>{t('chat.thinking')}</Typography>
                  </Box>
                </Box>
              )}
              <div ref={aiEndRef} />
            </Box>
            <Box component="form" onSubmit={(e) => { e.preventDefault(); askAI(); }}
              sx={{ display: 'flex', gap: 1, p: 2, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <TextField fullWidth variant="outlined" size="small" value={aiQuestion} onChange={(e) => setAiQuestion(e.target.value)}
                placeholder={t('chat.placeholder_ai')} disabled={loadingAi} />
              <Button type="submit" variant="contained" disabled={loadingAi} sx={{
                minWidth: 48, background: 'linear-gradient(135deg, #7c3aed, #00d4ff)',
                '&:hover': { background: 'linear-gradient(135deg, #9655f5, #33ddff)' },
              }}>
                {loadingAi ? <CircularProgress size={20} /> : <Send sx={{ fontSize: 18 }} />}
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Expert Chat */}
        {canAccessExperts && (
          <Grid item xs={12}>
            <Paper elevation={0} sx={{
              p: 0, display: 'flex', flexDirection: 'column',
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)',
              overflow: 'hidden',
            }}>
              <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'linear-gradient(135deg, rgba(0,212,255,0.06) 0%, rgba(16,185,129,0.04) 100%)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Forum sx={{ color: '#00d4ff' }} />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>{t('chat.expert_messaging')}</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip size="small" label={t('chat.channel_tier', { tier: activeTier.toUpperCase() })} sx={{ background: 'rgba(0,212,255,0.1)', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.2)', fontWeight: 600, fontSize: '0.65rem' }} />
                  <Chip size="small" label={t('chat.experts_active', { count: tierExperts.length })} sx={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', fontWeight: 600, fontSize: '0.65rem' }} />
                </Box>
              </Box>

              <Box sx={{ px: 2, pt: 1, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <Tabs value={activeTier} onChange={(_e, nv) => setActiveTier(nv)} centered
                  sx={{ '& .MuiTab-root': { fontWeight: 700, textTransform: 'none', minHeight: 40 } }}>
                  <Tab label="Bronze" value="bronze" disabled={getMembershipLevel(user.membership) < 1} />
                  <Tab label="Silver" value="silver" disabled={getMembershipLevel(user.membership) < 2} />
                  <Tab label="Gold" value="gold" disabled={getMembershipLevel(user.membership) < 3} />
                </Tabs>
              </Box>

              <Typography variant="caption" sx={{ px: 2, py: 0.5, color: 'text.secondary', display: 'block', fontSize: '0.65rem' }}>
                {t('chat.available_experts')} {tierExperts.map(e => e.fullName).join(", ") || t('chat.none')}
              </Typography>

              <Box sx={{ height: 400, p: 1.5, overflowY: 'auto', background: 'rgba(0,0,0,0.1)' }}>
                {messages.length === 0 && (
                  <Alert severity="info" sx={{ mx: 1 }}>{t('chat.no_messages')}</Alert>
                )}
                {messages.map(msg => {
                  const isUser = msg.senderRole === 'user';
                  const displayName = isUser ? user.fullName : msg.senderName;
                  return (
                    <Box key={msg._id} sx={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', mb: 1.5, px: 0.5 }}>
                      <Box sx={{ display: 'flex', flexDirection: isUser ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 1, maxWidth: '80%' }}>
                        <Avatar sx={{ width: 28, height: 28, fontSize: '0.7rem', background: isUser ? 'linear-gradient(135deg, #00d4ff, #7c3aed)' : 'linear-gradient(135deg, #10b981, #059669)' }}>
                          {isUser ? <Person sx={{ fontSize: 16 }} /> : displayName.charAt(0)}
                        </Avatar>
                        <Box sx={{
                          p: 1.5, borderRadius: isUser ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                          background: isUser ? 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(124,58,237,0.15))' : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${isUser ? 'rgba(0,212,255,0.2)' : 'rgba(255,255,255,0.06)'}`,
                        }}>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: isUser ? '#00d4ff' : '#10b981', display: 'block', mb: 0.3 }}>{displayName}</Typography>
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: 'text.primary', fontSize: '0.8rem' }}>{msg.message}</Typography>
                          <Typography variant="caption" sx={{ mt: 0.5, display: 'block', opacity: 0.6, textAlign: isUser ? 'right' : 'left', fontSize: '0.6rem' }}>
                            {formatMessageTime(msg.createdAt)}{isUser ? ` • ${formatReadStatus(msg.readAt, t)}` : ''}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  );
                })}
                <div ref={messagesEndRef} />
              </Box>

              {sendError && <Alert severity="error" sx={{ mx: 2, mb: 1 }}>{sendError}</Alert>}
              <Box component="form" onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
                sx={{ display: 'flex', gap: 1, p: 2, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <TextField fullWidth variant="outlined" size="small" value={chatText} onChange={(e) => setChatText(e.target.value)} placeholder={t('chat.placeholder_expert')} />
                <Button type="submit" variant="contained" sx={{
                  minWidth: 48, background: 'linear-gradient(135deg, #00d4ff, #7c3aed)',
                  '&:hover': { background: 'linear-gradient(135deg, #33ddff, #9655f5)' },
                }}>
                  <Send sx={{ fontSize: 18 }} />
                </Button>
              </Box>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}

const getMembershipLevel = (tier: string): number => ({ free: 0, bronze: 1, silver: 2, gold: 3 }[tier] || 0);
const formatMessageTime = (value: string): string => new Date(value).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
const formatReadStatus = (readAt: string | undefined | null, t: any): string => {
  if (!readAt) return t('chat.status_sent');
  return `${t('chat.status_read')} ${new Date(readAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}`;
};
