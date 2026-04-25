import { useEffect, useState } from "react";
import { Socket, io } from "socket.io-client";
import { api } from "../api";
import type { ChatMessage, ExpertConversationItem, AuthUser } from "../types";
import {
  Avatar,
  Box,
  Button,
  Grid,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  TextField,
  Typography,
  Alert,
  Divider,
} from "@mui/material";

interface ExpertPanelPageProps {
  user: AuthUser | null;
  token: string | null;
}

const formatDateTime = (value: string | null): string => {
  if (!value) return "-";
  return new Date(value).toLocaleString("tr-TR", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatMessageTime = (value: string): string => {
  return new Date(value).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatReadStatus = (readAt?: string | null): string => {
  if (!readAt) {
    return "Gonderildi";
  }

  return `Okundu ${new Date(readAt).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
};

export default function ExpertPanelPage({ user, token }: ExpertPanelPageProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatText, setChatText] = useState("");
  const [chatSocket, setChatSocket] = useState<Socket | null>(null);
  const [expertQueue, setExpertQueue] = useState<ExpertConversationItem[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !user || user.role !== "expert") return;

    const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";
    const instance = io(socketUrl, { auth: { token } });

    instance.on("chat:new", (incoming: ChatMessage) => {
      setExpertQueue((prev) => {
        const filtered = prev.filter((item) => item.userId !== incoming.userId);
        const current = prev.find((item) => item.userId === incoming.userId);
        const userName = current?.userName || incoming.senderName || "Kullanıcı";
        return [
          { userId: incoming.userId, userName, latestMessage: incoming.message, latestAt: incoming.createdAt },
          ...filtered,
        ];
      });

      if (selectedUserId && incoming.userId === selectedUserId) {
        setMessages((prev) => (prev.some((item) => item._id === incoming._id) ? prev : [...prev, incoming]));
      }
    });

    setChatSocket(instance);
    return () => {
      instance.disconnect();
    };
  }, [token, user, selectedUserId]);

  useEffect(() => {
    const loadData = async () => {
      if (!user || user.role !== "expert") return;
      try {
        setError(null);
        const res = await api.get<ExpertConversationItem[]>("/chat/expert/conversations");
        setExpertQueue(res.data);
        if (!selectedUserId && res.data.length > 0) {
          setSelectedUserId(res.data[0].userId);
        }
      } catch {
        setError("Konuşma kuyruğu yüklenemedi.");
      }
    };

    loadData();
  }, [user, selectedUserId]);

  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedUserId || !user || user.role !== "expert") return;
      try {
        setError(null);
        const expertTier = user.membership;
        const res = await api.get<ChatMessage[]>(`/chat/messages?tier=${expertTier}&userId=${selectedUserId}`);
        setMessages(res.data);
      } catch {
        setError("Mesajlar yüklenemedi.");
      }
    };

    loadMessages();
  }, [selectedUserId, user]);

  const sendMessage = async () => {
    if (!chatText.trim() || !user || !selectedUserId || user.role !== "expert") return;

    const expertTier = user.membership;
    const payload = { tier: expertTier, message: chatText, targetUserId: selectedUserId };

    try {
      setError(null);
      // Optimistic update
      const tempId = `temp-${Date.now()}`;
      const newMessage: ChatMessage = {
        _id: tempId,
        senderId: user._id,
        senderName: user.name,
        senderRole: "expert",
        message: chatText,
        tier: expertTier,
        userId: selectedUserId,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, newMessage]);
      setChatText("");

      const savedRes = await api.post<ChatMessage>("/chat/messages", payload);
      chatSocket?.emit("chat:message", { ...payload, messageId: savedRes.data._id });

      // Refresh messages to get actual _id
      const res = await api.get<ChatMessage[]>(`/chat/messages?tier=${expertTier}&userId=${selectedUserId}`);
      setMessages(res.data);

      // Refresh queue
      const queueRes = await api.get<ExpertConversationItem[]>("/chat/expert/conversations");
      setExpertQueue(queueRes.data);
    } catch {
      setError("Mesaj gönderilemedi. Lütfen tekrar deneyin.");
      setMessages((prev) => prev.filter((m) => m._id !== tempId)); // Rollback optimistic update
    }
  };

  if (!user || user.role !== "expert") {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Bu panel sadece uzmanlar için kullanılabilir.</Alert>
      </Box>
    );
  }

  return (
    <Grid container spacing={2} sx={{ height: "calc(100vh - 100px)", p: 2 }}>
      {/* Conversation Queue */}
      <Grid xs={12} md={4} sx={{ display: "flex", flexDirection: "column" }}>
        <Paper sx={{ p: 2, flex: 1, display: "flex", flexDirection: "column" }}>
          <Typography variant="h6" gutterBottom>
            Konuşma Kuyruğu ({user.membership?.toUpperCase()})
          </Typography>
          {error && <Alert severity="warning">{error}</Alert>}
          <List sx={{ overflow: "auto", flex: 1 }}>
            {expertQueue.length === 0 ? (
              <ListItem>
                <ListItemText primary="Şu an bekleyen kullanıcı yok." />
              </ListItem>
            ) : (
              expertQueue.map((item, index) => (
                <div key={item.userId}>
                  <ListItem
                    button
                    selected={selectedUserId === item.userId}
                    onClick={() => setSelectedUserId(item.userId)}
                    sx={{
                      "&.Mui-selected": {
                        backgroundColor: "action.selected",
                        borderLeft: (theme) => `4px solid ${theme.palette.primary.main}`,
                      },
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar>{item.userName.charAt(0).toUpperCase()}</Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={item.userName}
                      secondary={
                        <Typography component="span" variant="body2" color="text.secondary" noWrap>
                          {item.latestMessage || "Yeni konuşma"}
                        </Typography>
                      }
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 1, whiteSpace: "nowrap" }}>
                      {formatDateTime(item.latestAt)}
                    </Typography>
                  </ListItem>
                  {index < expertQueue.length - 1 && <Divider variant="inset" component="li" />}
                </div>
              ))
            )}
          </List>
        </Paper>
      </Grid>

      {/* Chat Panel */}
      <Grid xs={12} md={8} sx={{ display: "flex", flexDirection: "column" }}>
        <Paper sx={{ p: 2, flex: 1, display: "flex", flexDirection: "column" }}>
          <Typography variant="h6" gutterBottom>
            Uzman Canlı Mesajlaşma
          </Typography>
          {!selectedUserId ? (
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
              <Typography color="text.secondary">Kuyruktan bir kullanıcı seçin.</Typography>
            </Box>
          ) : (
            <>
              <Box
                sx={{
                  flex: 1,
                  overflowY: "auto",
                  mb: 2,
                  p: 2,
                  bgcolor: "grey.100",
                  borderRadius: 1,
                }}
              >
                {messages.map((msg) => (
                  (() => {
                    const selectedConversation = expertQueue.find((item) => item.userId === selectedUserId);
                    const displayName = msg.senderRole === "user"
                      ? (selectedConversation?.userName || msg.senderName)
                      : msg.senderName;
                    return (
                  <Box
                    key={msg._id}
                    sx={{
                      display: "flex",
                      justifyContent: msg.senderRole === "expert" ? "flex-end" : "flex-start",
                      mb: 1.5,
                    }}
                  >
                    <Paper
                      elevation={2}
                      sx={{
                        p: 1.5,
                        maxWidth: "70%",
                        bgcolor: msg.senderRole === "expert" ? "primary.light" : "background.paper",
                        color: msg.senderRole === "expert" ? "primary.contrastText" : "text.primary",
                        border: msg.senderRole === "expert" ? "none" : "1px solid",
                        borderColor: msg.senderRole === "expert" ? "transparent" : "grey.300",
                        boxShadow: msg.senderRole === "expert" ? 2 : 1,
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {displayName}
                      </Typography>
                      <Typography variant="body1">{msg.message}</Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          mt: 0.5,
                          display: "block",
                          opacity: 0.8,
                          textAlign: msg.senderRole === "expert" ? "right" : "left",
                          color: msg.senderRole === "expert" ? "primary.contrastText" : "text.secondary",
                        }}
                      >
                        {formatMessageTime(msg.createdAt)}
                        {msg.senderRole === "expert" ? ` • ${formatReadStatus(msg.readAt)}` : ""}
                      </Typography>
                    </Paper>
                  </Box>
                    );
                  })()
                ))}
              </Box>
              <Box
                component="form"
                sx={{ display: "flex", gap: 1 }}
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage();
                }}
              >
                <TextField
                  fullWidth
                  variant="outlined"
                  size="small"
                  value={chatText}
                  onChange={(e) => setChatText(e.target.value)}
                  placeholder="Kullanıcıya mesaj yazın..."
                />
                <Button type="submit" variant="contained" disabled={!chatText.trim()}>
                  Gönder
                </Button>
              </Box>
            </>
          )}
        </Paper>
      </Grid>
    </Grid>
  );
}

