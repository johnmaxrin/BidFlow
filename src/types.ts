export interface Auction {
  id: string; // e.g., "#BID-101"
  title: string;
  description: string;
  minPrice: number;
  currentPrice: number;
  currentWinnerPhone: string | null;
  currentWinnerName: string | null;
  createdAt: string;
  endsAt: string | null; // ISO timestamp or null for manual end
  sellerPhone: string;
  image: string | null;
  status: "active" | "ended";
  bidsCount: number;
}

export interface Bid {
  id: string;
  auctionId: string;
  bidderPhone: string;
  bidderName: string;
  amount: number;
  timestamp: string;
  channel: "whatsapp_sim" | "whatsapp_real" | "web";
}

export interface WhatsAppNotification {
  id: string;
  recipient: string;
  recipientName: string;
  type: "outbid" | "bid_confirmed" | "auction_created" | "bid_invalid" | "auction_ended" | "system_info";
  message: string;
  timestamp: string;
  status: "sent" | "delivered" | "failed";
  auctionId?: string;
}

export interface WhatsAppApiConfig {
  accessToken: string;
  phoneId: string;
  verifyToken: string;
  twilioSid: string;
  twilioToken: string;
  twilioFrom: string;
  integrationType: "none" | "cloud_api" | "twilio";
  isSystemTwilioConfigured?: boolean;
}

export interface SimMessage {
  id: string;
  senderPhone: string;
  senderName: string;
  messageText: string;
  timestamp: string;
  isBot: boolean;
}
