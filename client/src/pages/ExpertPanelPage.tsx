import { useEffect, useState } from "react";
import { Socket, io } from "socket.io-client";
import { api } from "../api";
import type { ChatMessage, ExpertConversationItem, AuthUser } from "../types";
import { Avatar, Box, Button, Grid, List, ListItem, ListItemAvatar, ListItemText, Paper, TextField, Typography, Alert, Divider, Chip } from "@mui/material";
import { Send, Person, AdminPanelSettings } from "@mui/icons-material";
import { useTranslation } from "react-i18next";

interface ExpertPanelPageProps { user: AuthUser | null; token: string | null; }

const formatDateTime = (value: string | null): string => {
  if (!value) return "-";
  return new Date(value).toLocaleString("tr-TR", { year: "numeric", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
};
const formatMessageTime = (value: string): string => new Date(value).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
const formatReadStatus = (readAt: string | undefined | null, t: any): string => {
  if (!readAt) return t('chat.status_sent');
  return `${t('chat.status_read')} ${new Date(readAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}`;
};

export default function ExpertPanelPage({ user, token }: ExpertPanelPageProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatText, setChatText] = useState("");
  const [chatSocket, setChatSocket] = useState<Socket | null>(null);
  const [expertQueue, setExpertQueue] = useState<ExpertConversationItem[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (!token || !user || user.role !== "expert") return;
    const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";
    const instance = io(socketUrl, { auth: { token } });
    instance.on("chat:new", (incoming: ChatMessage) => {
      setExpertQueue(prev => {
        const filtered = prev.filter(i => i.userId !== incoming.userId);
        const current = prev.find(i => i.userId === incoming.userId);
        const userName = current?.userName || incoming.senderName || "Kullanıcı";
        return [{ userId: incoming.userId, userName, latestMessage: incoming.message, latestAt: incoming.createdAt }, ...filtered];
      });
      if (selectedUserId && incoming.userId === selectedUserId) {
        setMessages(prev => prev.some(i => i._id === incoming._id) ? prev : [...prev, incoming]);
      }
    });
    setChatSocket(instance);
    return () => { instance.disconnect(); };
  }, [token, user, selectedUserId]);

  useEffect(() => {
    const loadData = async () => {
      if (!user || user.role !== "expert") return;
      try {
        setError(null);
        const res = await api.get<ExpertConversationItem[]>("/chat/expert/conversations");
        setExpertQueue(res.data);
        if (!selectedUserId && res.data.length > 0) setSelectedUserId(res.data[0].userId);
      } catch { setError(t('expertPanel.error_queue')); }
    };
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedUserId || !user || user.role !== "expert") return;
      try {
        setError(null);
        const res = await api.get<ChatMessage[]>(`/chat/messages?tier=${user.membership}&userId=${selectedUserId}`);
        setMessages(res.data);
      } catch { setError(t('expertPanel.error_messages')); }
    };
    loadMessages();
  }, [selectedUserId, user]);

  const sendMessage = async () => {
    if (!chatText.trim() || !user || !selectedUserId || user.role !== "expert") return;
    const payload = { tier: user.membership, message: chatText, targetUserId: selectedUserId };
    const tempId = `temp-${Date.now()}`;
    try {
      setError(null);
      const newMessage: ChatMessage = { _id: tempId, senderName: user.fullName, senderRole: "expert", message: chatText, expertTier: user.membership as "bronze" | "silver" | "gold", userId: selectedUserId, createdAt: new Date().toISOString() };
      setMessages(prev => [...prev, newMessage]);
      setChatText("");
      const savedRes = await api.post<ChatMessage>("/chat/messages", payload);
      chatSocket?.emit("chat:message", { ...payload, messageId: savedRes.data._id });
      const res = await api.get<ChatMessage[]>(`/chat/messages?tier=${user.membership}&userId=${selectedUserId}`);
      setMessages(res.data);
      const queueRes = await api.get<ExpertConversationItem[]>("/chat/expert/conversations");
      setExpertQueue(queueRes.data);
    } catch {
      setError(t('expertPanel.error_send'));
      setMessages(prev => prev.filter(m => m._id !== tempId));
    }
  };

  if (!user || user.role !== "expert") return <Alert severity="error">{t('expertPanel.error_expert_only')}</Alert>;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <AdminPanelSettings sx={{ color: '#7c3aed', fontSize: 28 }} />
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>{t('expertPanel.title')}</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('expertPanel.subtitle', { tier: user.membership?.toUpperCase() })}
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={2} sx={{ height: "calc(100vh - 180px)" }}>
        {/* Queue */}
        <Grid xs={12} md={4} sx={{ display: "flex", flexDirection: "column" }}>
          <Paper elevation={0} sx={{ flex: 1, display: "flex", flexDirection: "column", background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
            <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {t('expertPanel.queue_title')}
                <Chip size="small" label={expertQueue.length} sx={{ ml: 1, height: 20, fontSize: '0.65rem', fontWeight: 700, background: 'rgba(0,212,255,0.1)', color: '#00d4ff' }} />
              </Typography>
            </Box>
            {error && <Alert severity="warning" sx={{ m: 1 }}>{error}</Alert>}
            <List sx={{ overflow: "auto", flex: 1 }}>
              {expertQueue.length === 0 ? (
                <ListItem><ListItemText primary={t('expertPanel.queue_empty')} primaryTypographyProps={{ color: 'text.secondary', fontSize: '0.85rem' }} /></ListItem>
              ) : expertQueue.map((item, index) => (
                <Box key={item.userId}>
                  <ListItem
                    component="div"
                    onClick={() => setSelectedUserId(item.userId)}
                    sx={{
                      cursor: 'pointer', mx: 1, borderRadius: '10px', mb: 0.5,
                      background: selectedUserId === item.userId ? 'rgba(0,212,255,0.08)' : 'transparent',
                      borderLeft: selectedUserId === item.userId ? '3px solid #00d4ff' : '3px solid transparent',
                      '&:hover': { background: 'rgba(255,255,255,0.03)' },
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ width: 36, height: 36, fontSize: '0.8rem', background: selectedUserId === item.userId ? 'linear-gradient(135deg, #00d4ff, #7c3aed)' : 'rgba(255,255,255,0.08)' }}>
                        {item.userName.charAt(0).toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={<Typography variant="body2" sx={{ fontWeight: 600 }}>{item.userName}</Typography>}
                      secondary={<Typography variant="caption" sx={{ color: 'text.secondary' }} noWrap>{item.latestMessage || t('expertPanel.new_conversation')}</Typography>}
                    />
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.6rem', whiteSpace: 'nowrap' }}>{formatDateTime(item.latestAt)}</Typography>
                  </ListItem>
                </Box>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Chat */}
        <Grid xs={12} md={8} sx={{ display: "flex", flexDirection: "column" }}>
          <Paper elevation={0} sx={{ flex: 1, display: "flex", flexDirection: "column", background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
            <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {selectedUserId ? t('expertPanel.chat_title') : t('expertPanel.chat_select')}
              </Typography>
            </Box>
            {!selectedUserId ? (
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", flexDirection: 'column', gap: 2 }}>
                <Person sx={{ fontSize: 48, color: 'rgba(255,255,255,0.1)' }} />
                <Typography color="text.secondary">{t('expertPanel.chat_select_desc')}</Typography>
              </Box>
            ) : (
              <>
                <Box sx={{ flex: 1, overflowY: "auto", p: 2, background: 'rgba(0,0,0,0.1)' }}>
                  {messages.map(msg => {
                    const isExpert = msg.senderRole === "expert";
                    const selectedConversation = expertQueue.find(i => i.userId === selectedUserId);
                    const displayName = isExpert ? msg.senderName : (selectedConversation?.userName || msg.senderName);
                    return (
                      <Box key={msg._id} sx={{ display: "flex", justifyContent: isExpert ? "flex-end" : "flex-start", mb: 1.5 }}>
                        <Box sx={{
                          p: 1.5, maxWidth: "70%", borderRadius: isExpert ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                          background: isExpert ? 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(0,212,255,0.1))' : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${isExpert ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.06)'}`,
                        }}>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: isExpert ? '#7c3aed' : '#00d4ff' }}>{displayName}</Typography>
                          <Typography variant="body2" sx={{ mt: 0.3 }}>{msg.message}</Typography>
                          <Typography variant="caption" sx={{ mt: 0.5, display: "block", opacity: 0.6, textAlign: isExpert ? "right" : "left", fontSize: '0.6rem' }}>
                            {formatMessageTime(msg.createdAt)}{isExpert ? ` • ${formatReadStatus(msg.readAt, t)}` : ""}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
                <Box component="form" sx={{ display: "flex", gap: 1, p: 2, borderTop: '1px solid rgba(255,255,255,0.06)' }}
                  onSubmit={(e) => { e.preventDefault(); sendMessage(); }}>
                  <TextField fullWidth variant="outlined" size="small" value={chatText} onChange={(e) => setChatText(e.target.value)} placeholder={t('expertPanel.chat_placeholder')} />
                  <Button type="submit" variant="contained" disabled={!chatText.trim()} sx={{
                    minWidth: 48, background: 'linear-gradient(135deg, #7c3aed, #00d4ff)',
                    '&:hover': { background: 'linear-gradient(135deg, #9655f5, #33ddff)' },
                  }}>
                    <Send sx={{ fontSize: 18 }} />
                  </Button>
                </Box>
              </>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
