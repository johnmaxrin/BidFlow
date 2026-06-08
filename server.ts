import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { Auction, Bid, WhatsAppNotification, WhatsAppApiConfig, SimMessage } from "./src/types";

dotenv.config();

// Initialize Express
const app = express();
const PORT = 3000;

app.use(express.json());

// In-Memory Database (mock local persistence for demo & simulation)
let auctions: Auction[] = [
  {
    id: "#BID-101",
    title: "MacBook Pro M2 (16-inch)",
    description: "Mint condition, 16GB RAM, 512GB SSD. Gray color. Includes original charger and box. Minimal battery cycles.",
    minPrice: 800,
    currentPrice: 870,
    currentWinnerPhone: "+2348039281144",
    currentWinnerName: "Amara K.",
    createdAt: new Date(Date.now() - 36 * 3600000).toISOString(), // 36 hours ago
    endsAt: new Date(Date.now() + 12 * 3600000).toISOString(), // 12 hours left
    sellerPhone: "+15550199",
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=800",
    status: "active",
    bidsCount: 3
  },
  {
    id: "#BID-102",
    title: "Vintage Seiko Sports 150",
    description: "Rare 1980s retro chronograph quartz timepiece. Fully functional, dynamic bezel, with gorgeous leather straps.",
    minPrice: 150,
    currentPrice: 195,
    currentWinnerPhone: "+447911123456",
    currentWinnerName: "Dexter L.",
    createdAt: new Date(Date.now() - 12 * 3600000).toISOString(), // 12 hours ago
    endsAt: new Date(Date.now() + 24 * 3600000).toISOString(), // 24 hours left
    sellerPhone: "+15555102",
    image: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&q=80&w=800",
    status: "active",
    bidsCount: 4
  },
  {
    id: "#BID-103",
    title: "Classic Herman Miller Aeron (Size B)",
    description: "Fully loaded black ergonomic chair. PostureFit, fully adjustable armrests, clean mesh, standard casters.",
    minPrice: 450,
    currentPrice: 450,
    currentWinnerPhone: null,
    currentWinnerName: null,
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(), // 2 hours ago
    endsAt: new Date(Date.now() + 48 * 3600000).toISOString(), // 48 hours left
    sellerPhone: "+15550220",
    image: "https://images.unsplash.com/photo-1580481072645-022f9a6dbf27?auto=format&fit=crop&q=80&w=800",
    status: "active",
    bidsCount: 0
  }
];

let bids: Bid[] = [
  {
    id: "b1",
    auctionId: "#BID-101",
    bidderPhone: "+2348011223344",
    bidderName: "Korede",
    amount: 820,
    timestamp: new Date(Date.now() - 30 * 3600000).toISOString(),
    channel: "whatsapp_sim"
  },
  {
    id: "b2",
    auctionId: "#BID-101",
    bidderPhone: "+14155552675",
    bidderName: "Robert S.",
    amount: 850,
    timestamp: new Date(Date.now() - 15 * 3600000).toISOString(),
    channel: "whatsapp_sim"
  },
  {
    id: "b3",
    auctionId: "#BID-101",
    bidderPhone: "+2348039281144",
    bidderName: "Amara K.",
    amount: 870,
    timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
    channel: "whatsapp_sim"
  },
  {
    id: "b4",
    auctionId: "#BID-102",
    bidderPhone: "+447911123456",
    bidderName: "Dexter L.",
    amount: 195,
    timestamp: new Date(Date.now() - 4 * 3600000).toISOString(),
    channel: "whatsapp_sim"
  }
];

let notifications: WhatsAppNotification[] = [
  {
    id: "n1",
    recipient: "+14155552675",
    recipientName: "Robert S.",
    type: "outbid",
    message: "🚨 *OUTBID NOTICE* 🚨\n\nYou have been outbid on the *MacBook Pro M2 (16-inch)* (#BID-101)!\n\nNew High Bid: *$870* by Amara K.\n\nReply with a higher price directly to place your counterbid!",
    timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
    status: "delivered",
    auctionId: "#BID-101"
  },
  {
    id: "n2",
    recipient: "+2348039281144",
    recipientName: "Amara K.",
    type: "bid_confirmed",
    message: "✅ *BID CONFIRMED* ✅\n\nYour bid of *$870* has been successfully logged for the *MacBook Pro M2 (16-inch)* (#BID-101).\n\nYou are currently the highest bidder. We'll update you if anyone bids higher!",
    timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
    status: "delivered",
    auctionId: "#BID-101"
  }
];

let simMessages: SimMessage[] = [
  {
    id: "m0",
    senderPhone: "+2348039281144",
    senderName: "Amara K.",
    messageText: "I want to bid $870 on the macbook (#BID-101)",
    timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
    isBot: false
  },
  {
    id: "m0-bot",
    senderPhone: "Bot",
    senderName: "Bidding Bot",
    messageText: "✅ Amara K., your bid of $870 on MacBook Pro M2 (16-inch) (#BID-101) is CONFIRMED! You are the high bidder.",
    timestamp: new Date(Date.now() - 2 * 3600000 + 1000).toISOString(),
    isBot: true
  }
];

let apiConfig: WhatsAppApiConfig = {
  accessToken: "",
  phoneId: "",
  verifyToken: "whatsapp_bidding_token_123",
  twilioSid: "",
  twilioToken: "",
  twilioFrom: "",
  integrationType: "none"
};

// Initialize Gemini Client Lazily if requested
let geminiClient: any = null;

function getGemini(): any {
  if (!geminiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== "MY_GEMINI_API_KEY") {
      geminiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          }
        }
      });
    }
  }
  return geminiClient;
}

// Helper to send real WhatsApp message via Meta Cloud API or Twilio if credentials exist
async function sendExternalWhatsAppNotification(recipient: string, message: string) {
  try {
    if (apiConfig.integrationType === "cloud_api" && apiConfig.phoneId && apiConfig.accessToken) {
      console.log(`[REAL META API] Posting WhatsApp message to ${recipient}...`);
      const response = await fetch(`https://graph.facebook.com/v18.0/${apiConfig.phoneId}/messages`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiConfig.accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: recipient,
          type: "text",
          text: {
            preview_url: false,
            body: message
          }
        })
      });
      if (!response.ok) {
        const errJson = await response.json();
        console.error("[REAL META API ERROR]", errJson);
        return false;
      }
      return true;
    } else if (apiConfig.integrationType === "twilio" && apiConfig.twilioSid && apiConfig.twilioToken && apiConfig.twilioFrom) {
      console.log(`[REAL TWILIO API] Sending WhatsApp to WhatsApp:${recipient}...`);
      const basicAuth = Buffer.from(`${apiConfig.twilioSid}:${apiConfig.twilioToken}`).toString("base64");
      const url = `https://api.twilio.com/2010-04-01/Accounts/${apiConfig.twilioSid}/Messages.json`;
      
      const payload = new URLSearchParams({
        To: `whatsapp:${recipient}`,
        From: `whatsapp:${apiConfig.twilioFrom}`,
        Body: message
      });
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${basicAuth}`,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: payload.toString()
      });
      
      if (!response.ok) {
        const errText = await response.text();
        console.error("[REAL TWILIO API ERROR]", errText);
        return false;
      }
      return true;
    }
  } catch (error) {
    console.error("[E-WhatsApp Send Error]", error);
  }
  return false;
}

// Central handler for automated outgoing updates
async function triggerNotifications(auction: Auction, newBid: Bid, previousWinnerPhone: string | null, previousWinnerName: string | null) {
  // 1. Confirm Success to New Bidder
  const bidderMsg = `✅ *BID CONFIRMED* ✅\n\nYour bid of *$${newBid.amount}* has been logged for *${auction.title}* (${auction.id}).\n\nYou are now the highest bidder. We'll alert you if someone places a higher bid!`;
  
  const okBidder = await sendExternalWhatsAppNotification(newBid.bidderPhone, bidderMsg);
  notifications.unshift({
    id: "n_" + Math.random().toString(36).substr(2, 9),
    recipient: newBid.bidderPhone,
    recipientName: newBid.bidderName,
    type: "bid_confirmed",
    message: bidderMsg,
    timestamp: new Date().toISOString(),
    status: okBidder ? "sent" : "delivered",
    auctionId: auction.id
  });

  // 2. Alert Previous Bidder they have been outbid
  if (previousWinnerPhone && previousWinnerPhone !== newBid.bidderPhone) {
    const outbidMsg = `🚨 *OUTBID NOTICE* 🚨\n\nYou have been outbid on *${auction.title}* (${auction.id})!\n\nNew High Bid: *$${newBid.amount}* by *${newBid.bidderName}*.\n\nReply with a higher price directly to place a counterbid!`;
    const okOutbid = await sendExternalWhatsAppNotification(previousWinnerPhone, outbidMsg);
    
    notifications.unshift({
      id: "n_" + Math.random().toString(36).substr(2, 9),
      recipient: previousWinnerPhone,
      recipientName: previousWinnerName || "Previous Bidder",
      type: "outbid",
      message: outbidMsg,
      timestamp: new Date().toISOString(),
      status: okOutbid ? "sent" : "delivered",
      auctionId: auction.id
    });
  }
}

// Bidding Engine: Processes a clean text entry
async function placeBidEngine(auctionId: string, bidderPhone: string, bidderName: string, amount: number, channel: Bid["channel"]): Promise<{ success: boolean; error?: string }> {
  const auction = auctions.find(a => a.id.toLowerCase() === auctionId.toLowerCase());
  if (!auction) {
    return { success: false, error: `Auction code *${auctionId}* not found.` };
  }
  if (auction.status === "ended") {
    return { success: false, error: `Auction for *${auction.title}* has already ended.` };
  }
  if (amount <= auction.currentPrice) {
    const errorMsg = `Bid of *$${amount}* rejected. It must be higher than the current price of *$${auction.currentPrice}*.`;
    return { success: false, error: errorMsg };
  }
  if (amount <= auction.minPrice && auction.bidsCount === 0) {
    const errorMsg = `Bid of *$${amount}* rejected. Starting bids must meet or exceed minimum price of *$${auction.minPrice}*.`;
    return { success: false, error: errorMsg };
  }

  const previousWinnerPhone = auction.currentWinnerPhone;
  const previousWinnerName = auction.currentWinnerName;

  // Record Bid
  const newBid: Bid = {
    id: "b_" + Math.random().toString(36).substr(2, 9),
    auctionId: auction.id,
    bidderPhone,
    bidderName,
    amount,
    timestamp: new Date().toISOString(),
    channel
  };

  bids.unshift(newBid);

  // Update Auction
  auction.currentPrice = amount;
  auction.currentWinnerPhone = bidderPhone;
  auction.currentWinnerName = bidderName;
  auction.bidsCount += 1;

  // Process alert WhatsApp rules
  await triggerNotifications(auction, newBid, previousWinnerPhone, previousWinnerName);

  return { success: true };
}

// Parse unstructured input query using Gemini API
async function parseWhatsAppMessageWithGemini(messageText: string, senderPhone: string): Promise<{ auctionId: string | null; amount: number | null; feedback?: string; requestType: 'bid' | 'list' | 'create' | 'unrecognized'; creationData?: any }> {
  const ai = getGemini();
  if (!ai) {
    // If Gemini client NOT available (no API key was shared), fall back to exact regex or substring parsing!
    console.log("[GEMINI PATH] No API key, fallback parser running.");
    
    // Fallback 1: Is it a LIST request?
    if (messageText.toLowerCase().includes("list") || messageText.toLowerCase().includes("active") || messageText.toLowerCase() === "help") {
      return { auctionId: null, amount: null, requestType: 'list' };
    }

    // Fallback 2: Standard #BID-\d+ and number format
    const codeMatch = messageText.match(/(#BID-\d+)/i);
    const amountMatch = messageText.match(/\b(\d+)\b/);
    
    if (codeMatch) {
      const code = codeMatch[1].toUpperCase();
      let amt: number | null = null;
      if (amountMatch) {
        amt = parseInt(amountMatch[1], 10);
      } else {
        // Look for values near '$' or just random numbers
        const moneyMatch = messageText.match(/\$\s*(\d+)/);
        if (moneyMatch) amt = parseInt(moneyMatch[1], 10);
      }
      return { auctionId: code, amount: amt, requestType: amt ? 'bid' : 'unrecognized' };
    }

    return { auctionId: null, amount: null, requestType: 'unrecognized' };
  }

  try {
    const activeList = auctions.map(a => `ID: ${a.id}, Title: ${a.title}, MinPrice: ${a.minPrice}, CurrentPrice: ${a.currentPrice}`).join("\n");
    const systemPrompt = `You are the backend message interpreter for a WhatsApp Bidding Bot.
Your goal is to parse unstructured natural-language incoming WhatsApp messages and identify:
1. What the user is trying to do: Place a bid ('bid'), list active items ('list'), create/list a new item for auction ('create'), or something unrecognized/questions ('unrecognized').
2. If bidding, find which Auction ID and Bid Amount they want to specify. Note that the Auction ID has a prefix '#' e.g., '#BID-101'. Let them map words like "macbook" or "watch" to the correct ID based on active auctions.
3. If they are creating/listing an item, extract the item 'title', 'description', and 'minPrice'.

Active auctions for context:
${activeList}

Output values STRICTLY in valid JSON with schema matching exactly:
{
  "requestType": "bid" | "list" | "create" | "unrecognized",
  "auctionId": string or null,
  "amount": number or null,
  "creationData": { "title": string, "description": string, "minPrice": number } or null,
  "feedback": "A helpful text response for the user if the command is confusing, e.g., asking for target code."
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: messageText,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            requestType: { type: Type.STRING, description: "Action determined" },
            auctionId: { type: Type.STRING, description: "Parsed #BID-XXX ID" },
            amount: { type: Type.NUMBER, description: "Parsed numeric offer amount" },
            creationData: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                minPrice: { type: Type.NUMBER }
              }
            },
            feedback: { type: Type.STRING, description: "Response prompt message" }
          },
          required: ["requestType"]
        }
      }
    });

    const parsed = JSON.parse(response.text.trim());
    console.log("[GEMINI INTERPRETED RESPONSE]", parsed);
    return {
      requestType: parsed.requestType || 'unrecognized',
      auctionId: parsed.auctionId || null,
      amount: parsed.amount || null,
      feedback: parsed.feedback,
      creationData: parsed.creationData
    };
  } catch (err) {
    console.error("[GEMINI PARSE FAILURE]", err);
    return { auctionId: null, amount: null, requestType: 'unrecognized' };
  }
}

// Unified Webhook or Simulation processor
async function processIncomingMsg(senderPhone: string, senderName: string, text: string, channel: Bid["channel"], hostUrl?: string): Promise<string> {
  const result = await parseWhatsAppMessageWithGemini(text, senderPhone);
  const baseHost = hostUrl || "https://ais-pre-fgibxuwxfwujixqxstjdx4-622397689960.asia-east1.run.app";
  
  if (result.requestType === 'list') {
    const listMsg = `📋 *ACTIVE AUCTIONS* 📋\n\n` + 
      auctions.map(a => {
        const statsLink = `${baseHost}/?item=${encodeURIComponent(a.id)}`;
        return `📦 *${a.title}* (${a.id})\n` +
               `💵 Start: $${a.minPrice} | *Current Bid: $${a.currentPrice}*\n` +
               `👤 Winner: ${a.currentWinnerName || "None yet"}\n` +
               `🖥️ Live Room: ${statsLink}\n` +
               `---------------------`;
      }).join("\n\n") + 
      `\n\nTo place a bid, reply with: e.g. *#BID-101 900*`;
    return listMsg;
  }

  if (result.requestType === 'create' && result.creationData) {
    const newId = `#BID-${100 + auctions.length + 1}`;
    const statsLink = `${baseHost}/?item=${encodeURIComponent(newId)}`;
    
    const newAuction: Auction = {
      id: newId,
      title: result.creationData.title,
      description: result.creationData.description || "Listed via WhatsApp Chat bot",
      minPrice: result.creationData.minPrice || 10,
      currentPrice: result.creationData.minPrice || 10,
      currentWinnerPhone: null,
      currentWinnerName: null,
      createdAt: new Date().toISOString(),
      endsAt: new Date(Date.now() + 24 * 3600000).toISOString(), // 24h by default
      sellerPhone: senderPhone,
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800", // Default beautiful electronic
      status: "active",
      bidsCount: 0
    };
    auctions.push(newAuction);
    
    return `🎉 *AUCTION CREATED* 🎉\n\nYour item *${newAuction.title}* has been listed successfully!\n\n🔑 *Code:* ${newAuction.id}\n💵 *Starting Price:* $${newAuction.minPrice}\n🖥️ *Private Stats Room:* ${statsLink}\n\nHere is your shareable broadcast card to copy and paste into groups:\n\n📢 *NEW LISTING* 📢\n📦 *Item:* ${newAuction.title}\n💵 *Reserve/Start:* $${newAuction.minPrice}\n🔑 *Code to bid:* \`${newAuction.id}\`\n🖥️ *Live Stats Room:* ${statsLink}\n\n👉 Bidders: Reply with \`${newAuction.id} [price]\` directly to participate!`;
  }

  if (result.requestType === 'bid' && result.auctionId && result.amount) {
    const bidResult = await placeBidEngine(result.auctionId, senderPhone, senderName, result.amount, channel);
    if (bidResult.success) {
      const parentAuction = auctions.find(a => a.id.toLowerCase() === result.auctionId!.toLowerCase());
      const statsLink = `${baseHost}/?item=${encodeURIComponent(parentAuction?.id || result.auctionId)}`;
      return `✅ *BID PLACED* ✅\n\nThanks ${senderName}! Your bid of *$${result.amount}* on *${parentAuction?.title}* (${result.auctionId}) is locked in.\n\nYou are currently the highest bidder!\n\n🖥️ *Live Stats Room:* ${statsLink}`;
    } else {
      return `❌ *BID ERROR* ❌\n\n${bidResult.error || "Could not place bid."}`;
    }
  }

  // Unrecognized
  if (result.feedback) {
    return `❔ *Bidding Assistant* ❔\n\n${result.feedback}\n\n💡 _Tip: Write list to see active bids, or e.g. '#BID-101 250' to make an offer!_`;
  }

  return `❔ *WhatsApp Auction Assistant* ❔\n\nI couldn't quite construct a bid from your message. \n\n*Format your bid like:* \`#BID-101 900\`\n*To view active items, reply with:* \`list\`\n*To list/create an item, say:* e.g. \`Create item Vintage Camera starting at 70\``;
}


// --- API SERVER ROUTES ---

// 1. Get List of Auctions
app.get("/api/auctions", (req, res) => {
  res.json(auctions);
});

// 2. Post New Auction (seller lists an item from Web panel)
app.post("/api/auctions", (req, res) => {
  const { title, description, minPrice, sellerPhone, image, endsAtHours } = req.body;
  if (!title || !minPrice) {
    return res.status(400).json({ error: "Missing required fields: title or minimum price" });
  }

  const generatedId = `#BID-${100 + auctions.length + 1}`;
  const endsAt = endsAtHours ? new Date(Date.now() + endsAtHours * 3600000).toISOString() : null;

  const newAuction: Auction = {
    id: generatedId,
    title,
    description: description || "No detailed description provided.",
    minPrice: Number(minPrice),
    currentPrice: Number(minPrice),
    currentWinnerPhone: null,
    currentWinnerName: null,
    createdAt: new Date().toISOString(),
    endsAt,
    sellerPhone: sellerPhone || "+15550230",
    image: image || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800",
    status: "active",
    bidsCount: 0
  };

  auctions.push(newAuction);
  res.status(201).json(newAuction);
});

// End an Auction Manually
app.post("/api/auctions/:id/end", async (req, res) => {
  const auction = auctions.find(a => a.id === req.params.id);
  if (!auction) return res.status(404).json({ error: "Auction not found" });
  
  auction.status = "ended";
  
  // Send closing notice to winner
  if (auction.currentWinnerPhone) {
    const notifyMsg = `🏆 *CONGRATULATIONS* 🏆\n\nYou've won the bidding for *${auction.title}* (${auction.id})!\n\nFinal Locked Price: *$${auction.currentPrice}*\n\nPlease get in touch with the seller at ${auction.sellerPhone} to complete your transaction. Thanks for utilizing WhatsApp Bidding!`;
    const okWinner = await sendExternalWhatsAppNotification(auction.currentWinnerPhone, notifyMsg);
    notifications.unshift({
      id: "n_" + Math.random().toString(36).substr(2, 9),
      recipient: auction.currentWinnerPhone,
      recipientName: auction.currentWinnerName || "Winner",
      type: "auction_ended",
      message: notifyMsg,
      timestamp: new Date().toISOString(),
      status: okWinner ? "sent" : "delivered",
      auctionId: auction.id
    });
  }

  res.json(auction);
});

// Delete empty/test auctions
app.delete("/api/auctions/:id", (req, res) => {
  const index = auctions.findIndex(a => a.id === req.params.id);
  if (index !== -1) {
    auctions.splice(index, 1);
    return res.json({ success: true });
  }
  res.status(404).json({ error: "Not found" });
});

// 3. Get Bids history
app.get("/api/bids", (req, res) => {
  res.json(bids);
});

// 4. Get Messaging & Notification Logs for Dashboard
app.get("/api/notifications", (req, res) => {
  res.json(notifications);
});

app.get("/api/messages", (req, res) => {
  res.json(simMessages);
});

// Clear logs for simulation sanity
app.post("/api/logs/clear", (req, res) => {
  simMessages = [];
  notifications = [];
  res.json({ success: true });
});

// 5. Simulate Incoming WhatsApp Chat Message (Web Sandbox simulator)
app.post("/api/whatsapp/simulate", async (req, res) => {
  const { senderPhone, senderName, messageText } = req.body;
  if (!senderPhone || !messageText) {
    return res.status(400).json({ error: "Missing senderPhone or messageText" });
  }

  const name = senderName || `WhatsApp User ${senderPhone.slice(-4)}`;
  
  // Store original message
  const userMsg: SimMessage = {
    id: "m_" + Math.random().toString(36).substr(2, 9),
    senderPhone,
    senderName: name,
    messageText,
    timestamp: new Date().toISOString(),
    isBot: false
  };
  simMessages.unshift(userMsg);

  // Core Engine processes message
  const hostUrl = `${req.protocol}://${req.get("host")}`;
  const replyMessage = await processIncomingMsg(senderPhone, name, messageText, "whatsapp_sim", hostUrl);

  // Send back reply message block
  const botReply: SimMessage = {
    id: "m_bot_" + Math.random().toString(36).substr(2, 9),
    senderPhone: "Bot",
    senderName: "Bidding Bot",
    messageText: replyMessage,
    timestamp: new Date().toISOString(),
    isBot: true
  };
  simMessages.unshift(botReply);

  res.status(200).json({
    userMessage: userMsg,
    botReply
  });
});

// 6. Config Handlers (Save credentials)
app.get("/api/whatsapp/config", (req, res) => {
  // Return config with masked values for security!
  res.json({
    accessToken: apiConfig.accessToken ? "••••••••••••" : "",
    phoneId: apiConfig.phoneId,
    verifyToken: apiConfig.verifyToken,
    twilioSid: apiConfig.twilioSid,
    twilioToken: apiConfig.twilioToken ? "••••••••••••" : "",
    twilioFrom: apiConfig.twilioFrom,
    integrationType: apiConfig.integrationType
  });
});

app.post("/api/whatsapp/config", (req, res) => {
  const { accessToken, phoneId, verifyToken, twilioSid, twilioToken, twilioFrom, integrationType } = req.body;
  
  if (accessToken && accessToken !== "••••••••••••") apiConfig.accessToken = accessToken;
  if (phoneId !== undefined) apiConfig.phoneId = phoneId;
  if (verifyToken !== undefined) apiConfig.verifyToken = verifyToken;
  if (twilioSid !== undefined) apiConfig.twilioSid = twilioSid;
  if (twilioToken && twilioToken !== "••••••••••••") apiConfig.twilioToken = twilioToken;
  if (twilioFrom !== undefined) apiConfig.twilioFrom = twilioFrom;
  if (integrationType !== undefined) apiConfig.integrationType = integrationType;

  res.json({ success: true, message: "Configuration loaded successfully!" });
});


// 7. REAL META WEBHOOK ENDPOINTS
// Verification webhook for Meta (GET)
app.get("/api/whatsapp/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token) {
    if (mode === "subscribe" && token === apiConfig.verifyToken) {
      console.log("[META WEBHOOK] Successfully verified GET request!");
      return res.status(200).send(challenge);
    }
    return res.status(403).send("Verification token mismatch");
  }
  return res.status(400).send("Bad request");
});

// Webhook listener for incoming messages (POST)
app.post("/api/whatsapp/webhook", async (req, res) => {
  try {
    const body = req.body;
    console.log("[META WEBHOOK RECEIVED]", JSON.stringify(body, null, 2));

    if (body.object === "whatsapp_business_account") {
      const entry = body.entry?.[0];
      const change = entry?.changes?.[0];
      const value = change?.value;
      const message = value?.messages?.[0];
      
      if (message) {
        const senderPhone = message.from; // Sender's phone number e.g. "15551234567"
        const senderName = value?.contacts?.[0]?.profile?.name || `user_${senderPhone.slice(-4)}`;
        let messageText = "";

        if (message.type === "text") {
          messageText = message.text?.body;
        } else if (message.type === "button") {
          messageText = message.button?.text;
        } else if (message.type === "interactive") {
          messageText = message.interactive?.button_reply?.title || message.interactive?.list_reply?.title;
        }

        if (messageText) {
          // Log User message
          simMessages.unshift({
            id: message.id || "m_hook_" + Date.now(),
            senderPhone,
            senderName,
            messageText,
            timestamp: new Date().toISOString(),
            isBot: false
          });

          // Process message
          const hostUrl = `${req.protocol}://${req.get("host")}`;
          const reply = await processIncomingMsg(senderPhone, senderName, messageText, "whatsapp_real", hostUrl);

          // Send reply back using WhatsApp Cloud API
          await sendExternalWhatsAppNotification(senderPhone, reply);

          // Log Bot reply
          simMessages.unshift({
            id: "m_reply_" + Date.now(),
            senderPhone: "Bot",
            senderName: "Bidding Bot",
            messageText: reply,
            timestamp: new Date().toISOString(),
            isBot: true
          });
        }
      }
      return res.sendStatus(200);
    }
    res.sendStatus(404);
  } catch (err) {
    console.error("[ERROR IN META WEBHOOK]", err);
    res.sendStatus(500);
  }
});

// 8. REAL TWILIO WEBHOOK ENDPOINT
app.post("/api/whatsapp/twilio", async (req, res) => {
  try {
    const body = req.body;
    console.log("[TWILIO WEBHOOK RECEIVED]", body);

    const fromString = body.From || ""; // e.g., "whatsapp:+14155552671"
    const senderPhone = fromString.replace("whatsapp:", "").trim();
    const senderName = body.ProfileName || `user_${senderPhone.slice(-4)}`;
    const messageText = body.Body || "";

    if (senderPhone && messageText) {
      // Log message
      simMessages.unshift({
        id: body.MessageSid || "m_twilio_" + Date.now(),
        senderPhone,
        senderName,
        messageText,
        timestamp: new Date().toISOString(),
        isBot: false
      });

      // Parse and process
      const hostUrl = `${req.protocol}://${req.get("host")}`;
      const reply = await processIncomingMsg(senderPhone, senderName, messageText, "whatsapp_real", hostUrl);

      // Reply back via twilio
      await sendExternalWhatsAppNotification(senderPhone, reply);

      // Log reply
      simMessages.unshift({
        id: "m_tw_rep_" + Date.now(),
        senderPhone: "Bot",
        senderName: "Bidding Bot",
        messageText: reply,
        timestamp: new Date().toISOString(),
        isBot: true
      });
    }

    // Twilio supports returning TwiML or standard 200
    res.type("text/xml").send("<Response></Response>");
  } catch (err) {
    console.error("[ERROR IN TWILIO WEBHOOK]", err);
    res.sendStatus(500);
  }
});


// Hook up Vite Dev Server Middleware or serve compiled Client assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening at http://localhost:${PORT}`);
  });
}

startServer();
