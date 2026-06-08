import React, { useState, useEffect } from "react";
import { DeveloperTab } from "./components/DeveloperTab";
import { PrivateBentoRoom } from "./components/PrivateBentoRoom";
import { Auction, Bid, WhatsAppApiConfig } from "./types";
import { Shield, ChevronRight, HelpCircle } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<"lobby" | "developer">("lobby");
  
  // Track selected campaign based on URL parameter (supporting both /b/101 and ?item=101)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(() => {
    // 1. Support path routing e.g. /b/101 or /b/BID-101
    const p = window.location.pathname;
    const match = p.match(/^\/b\/([^/]+)/);
    if (match) {
      const raw = match[1];
      // Normalize back if they entered 101 or BID-101
      if (!raw.toUpperCase().startsWith("BID-") && !raw.toUpperCase().startsWith("#")) {
        return `#BID-${raw.toUpperCase()}`;
      }
      if (raw.toUpperCase().startsWith("BID-")) {
        return `#${raw.toUpperCase()}`;
      }
      return raw.toUpperCase();
    }
    // 2. Fallback to query param
    const params = new URLSearchParams(window.location.search);
    return params.get("item") || null;
  });

  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [config, setConfig] = useState<WhatsAppApiConfig>({
    accessToken: "",
    phoneId: "",
    verifyToken: "whatsapp_bidding_token_123",
    twilioSid: "",
    twilioToken: "",
    twilioFrom: "",
    integrationType: "none"
  });

  const [roomInput, setRoomInput] = useState("");
  const [lobbyError, setLobbyError] = useState("");
  const [showGuide, setShowGuide] = useState(false);

  // Sync selected campaign status back to URL address bar
  useEffect(() => {
    if (selectedItemId) {
      const urlId = selectedItemId.replace("#", "");
      window.history.pushState(null, "", `/b/${urlId}`);
    } else {
      window.history.pushState(null, "", "/");
    }
  }, [selectedItemId]);

  const fetchAllData = async () => {
    try {
      const [auctionsRes, bidsRes, configRes] = await Promise.all([
        fetch("/api/auctions"),
        fetch("/api/bids"),
        fetch("/api/whatsapp/config")
      ]);

      if (auctionsRes.ok) setAuctions(await auctionsRes.json());
      if (bidsRes.ok) setBids(await bidsRes.json());
      if (configRes.ok) setConfig(await configRes.json());
    } catch (err) {
      console.error("Failed to query data from backend", err);
    }
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = async (senderPhone: string, senderName: string, messageText: string) => {
    try {
      const resp = await fetch("/api/whatsapp/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderPhone, senderName, messageText })
      });
      if (resp.ok) {
        await fetchAllData();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSaveConfig = async (newConfig: WhatsAppApiConfig) => {
    try {
      const resp = await fetch("/api/whatsapp/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newConfig)
      });
      if (resp.ok) {
        await fetchAllData();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleLobbyJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let formatted = roomInput.trim().toUpperCase();
    if (!formatted) return;

    // Support flexible typing: "101" -> "#BID-101", "BID-101" -> "#BID-101"
    if (!formatted.startsWith("#") && !formatted.startsWith("BID-")) {
      formatted = `#BID-${formatted}`;
    } else if (formatted.startsWith("BID-")) {
      formatted = `#${formatted}`;
    }

    const exists = auctions.some(a => a.id.toUpperCase() === formatted);
    if (exists) {
      setSelectedItemId(formatted);
      setLobbyError("");
      setRoomInput("");
    } else {
      setLobbyError(`Passcode "${formatted}" not found. Try typing e.g. "101" or "102".`);
    }
  };

  const activeAuction = selectedItemId 
    ? auctions.find(a => a.id.toUpperCase() === selectedItemId.toUpperCase()) 
    : null;

  return (
    <div className="min-h-screen bg-black text-gray-100 flex flex-col font-sans selection:bg-gray-800" id="app-wrapper">
      
      {/* 1. Symmetrical Top Navigation Bar */}
      <header className="max-w-4xl mx-auto px-6 pt-12 pb-6 w-full flex items-center justify-between border-b border-gray-950">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-sm tracking-wider uppercase text-white">
            BidFlow
          </span>
          <span className="text-[10px] text-gray-600 font-mono">/ Live scoreboard</span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="text-[11px] font-mono tracking-normal text-gray-500 hover:text-gray-300 transition cursor-pointer flex items-center gap-1.5"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Guide</span>
          </button>

          <button
            onClick={() => {
              setActiveTab(activeTab === "developer" ? "lobby" : "developer");
              setSelectedItemId(null);
            }}
            className="text-[11px] font-mono uppercase text-gray-400 hover:text-white transition px-2.5 py-1 rounded bg-gray-950 hover:bg-gray-900 border border-gray-900 cursor-pointer"
          >
            {activeTab === "developer" ? "Scoreboards" : "Settings"}
          </button>
        </div>
      </header>

      {/* 2. Interactive Guide overlay */}
      {showGuide && (
        <div className="bg-[#090909] border-y border-gray-905 w-full">
          <div className="max-w-xl mx-auto px-6 py-8 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-905">
              <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">Conversational Guide</span>
              <button 
                onClick={() => setShowGuide(false)}
                className="text-gray-500 hover:text-white text-xs cursor-pointer"
              >
                [ Hide ]
              </button>
            </div>
            
            <p className="text-xs text-gray-400 leading-relaxed font-sans">
              BidFlow is built wholly on top of standard WhatsApp. Since all transactions happen conversationally, the website is read-only.
            </p>

            <div className="space-y-3 font-mono text-xs text-gray-400 pt-1">
              <div>
                <p className="text-white font-medium">// Create a live auction via WhatsApp bot:</p>
                <code className="text-gray-550 italic block mt-1 pl-3 border-l border-gray-900">
                  "Create item Antique Desk starting at 120"
                </code>
              </div>
              <div>
                <p className="text-white font-medium">// Place counterbids on active campaigns:</p>
                <code className="text-gray-550 italic block mt-1 pl-3 border-l border-gray-900">
                  "BID 101 250" or "MacBook 101 890"
                </code>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Primary Viewport */}
      <main className="flex-grow max-w-4xl mx-auto px-6 py-16 w-full flex flex-col justify-center">
        
        {activeTab === "developer" ? (
          <div className="space-y-4">
            <DeveloperTab
              config={config}
              onSaveConfig={handleSaveConfig}
            />
          </div>
        ) : (
          selectedItemId && activeAuction ? (
            <PrivateBentoRoom
              auction={activeAuction}
              bids={bids}
              onSendMessage={handleSendMessage}
              onFetchLatest={fetchAllData}
              onBackToLobby={() => setSelectedItemId(null)}
            />
          ) : (
            
            /* --- ULTRA CLEAN MINIMAL LOBBY ENTRY PANEL --- */
            <div className="max-w-md w-full mx-auto space-y-12 py-10 animate-fadeIn" id="lobby-gateway-view">
              
              {/* Spacious visual concept */}
              <div className="space-y-4">
                <h1 className="text-3xl font-black font-display text-white tracking-tighter uppercase font-mono">
                  WhatsApp Bidding Scoreboard
                </h1>
                
                <p className="text-xs text-gray-400 leading-relaxed">
                  BidFlow links are generated on-the-fly inside conversation threads. Enter an auction ID passcode below to open its corresponding real-time stats feed.
                </p>
              </div>

              {/* Minimal text input */}
              <form onSubmit={handleLobbyJoinSubmit} className="space-y-3 font-mono">
                <div className="bg-black py-1.5 px-2 rounded border border-gray-900 focus-within:border-gray-700 transition flex items-center">
                  <input
                    type="text"
                    required
                    value={roomInput}
                    onChange={(e) => setRoomInput(e.target.value)}
                    placeholder="Enter ID, e.g. 101"
                    className="flex-grow text-xs font-mono font-bold bg-transparent text-white placeholder-gray-800 px-3.5 py-2.5 focus:outline-none uppercase"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 text-xs font-semibold text-black bg-white hover:bg-gray-200 transition shrink-0 rounded"
                  >
                    Load Scoreboard
                  </button>
                </div>

                {lobbyError && (
                  <p className="text-[11px] text-red-550 font-mono text-left">
                    {lobbyError}
                  </p>
                )}
              </form>

              {/* Minimal Preloaded room list */}
              <div className="space-y-3 text-left font-mono">
                <span className="text-[10px] text-gray-500 uppercase tracking-widest block text-center sm:text-left">
                  ACTIVE LIVE CAMPAIGNS
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {auctions.map(a => {
                    const cleanIdName = a.id.replace("#", "");
                    return (
                      <button
                        key={a.id}
                        onClick={() => {
                          setSelectedItemId(a.id);
                          setLobbyError("");
                        }}
                        className="py-2.5 px-3 rounded border border-gray-950 hover:border-gray-900 hover:bg-gray-950 text-left text-xs transition cursor-pointer flex justify-between items-center"
                      >
                        <div className="flex items-center gap-2 max-w-[70%]">
                          <span className="font-bold text-gray-400 shrink-0">#{cleanIdName}</span>
                          <span className="text-gray-600 truncate">{a.title}</span>
                        </div>
                        <span className="text-[10px] text-white font-mono bg-[#050505] px-2 py-0.5 rounded border border-gray-905">
                          ${a.currentPrice}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          )
        )}

      </main>

      {/* 4. Sleek Monochrome Footer */}
      <footer className="border-t border-gray-950 py-10 bg-black font-mono">
        <div className="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-[10px] text-gray-600">
          <span>BidFlow Isomorphic Telemetry &copy; 2026.</span>
          <span className="flex items-center gap-1.5 ">
            <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
            Sync ready via Twilio & Meta Webhooks
          </span>
        </div>
      </footer>

    </div>
  );
}
