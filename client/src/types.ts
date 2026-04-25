export type MembershipTier = "free" | "bronze" | "silver" | "gold";

export interface AuthUser {
  id: string;
  fullName: string;
  role: "user" | "expert";
  membership: MembershipTier;
}

export interface MarketInstrument {
  symbol: string;
  name: string;
  category: "forex" | "gold" | "silver" | "crypto";
  price: number;
  change30d: number;
  history30d: number[];
  popular: boolean;
}

export interface PortfolioHolding {
  symbol: string;
  quantity: number;
  avgBuyPrice: number;
  currentPrice: number;
  marketValue: number;
  pnl: number;
  pnlPercent: number;
}

export interface PortfolioSummary {
  balance: number;
  holdings: PortfolioHolding[];
  investmentValue: number;
  currentValue: number;
  totalValue: number;
  totalPnl: number;
  totalPnlPercent: number;
}

export interface ChatMessage {
  _id: string;
  userId: string;
  expertTier: "bronze" | "silver" | "gold";
  senderRole: "user" | "expert";
  senderName: string;
  message: string;
  createdAt: string;
  readAt?: string | null;
}

export interface ExpertProfile {
  _id: string;
  fullName: string;
  expertTier: "bronze" | "silver" | "gold";
}

export interface TransactionItem {
  _id: string;
  symbol: string;
  type: "buy" | "sell" | "deposit";
  quantity: number;
  price: number;
  total: number;
  createdAt: string;
}

export interface ExpertConversationItem {
  userId: string;
  userName: string;
  latestMessage: string;
  latestAt: string | null;
}

export interface NewsItem {
  title: string;
  summary: string;
  url: string;
  imageUrl: string | null;
  publishedAt: string;
  source: string;
}
