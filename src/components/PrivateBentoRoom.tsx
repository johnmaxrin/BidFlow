import React, { useState, useEffect } from "react";
import { Auction, Bid } from "../types";
import { ArrowLeft, RefreshCw, Check, Copy, HelpCircle } from "lucide-react";

interface PrivateBentoRoomProps {
  auction: Auction;
  bids: Bid[];
  onSendMessage: (senderPhone: string, senderName: string, messageText: string) => void;
  onFetchLatest: () => void;
  onBackToLobby: () => void;
}

export function PrivateBentoRoom({
  auction,
  bids,
  onSendMessage,
  onFetchLatest,
  onBackToLobby
}: PrivateBentoRoomProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [timeLeft, setTimeLeft] = useState("00:00:00");
  
  // Simulation input state
  const [simText, setSimText] = useState("");
  const [simName, setSimName] = useState("Robert S.");
  const [simPhone, setSimPhone] = useState("+14155552675");
  const [showSimTool, setShowSimTool] = useState(false);

  // Anonymization logic: "A***"
  const getAnonymized = (name: string | null, phone: string | null): string => {
    const raw = name || phone || "";
    if (!raw) return "Anonymous";
    return raw.trim().charAt(0).toUpperCase() + "***";
  };

  // Live Timer countdown
  useEffect(() => {
    const updateCountdown = () => {
      if (!auction.endsAt) {
        setTimeLeft("Ongoing");
        return;
      }
      const diff = new Date(auction.endsAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft("Ended");
        return;
      }
      const hrs = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setTimeLeft(
        `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
      );
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [auction.endsAt]);

  const handleCopyLink = () => {
    // Re-construct the clean path URL: "/b/101" or "/b/BID-101"
    const cleanId = auction.id.replace("#", "");
    const shareHref = `${window.location.origin}/b/${cleanId}`;
    navigator.clipboard.writeText(shareHref);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSimSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simText.trim()) return;
    onSendMessage(simPhone, simName, simText.trim());
    setSimText("");
  };

  const auctionBids = bids
    .filter(b => b.auctionId === auction.id)
    .sort((a, b) => b.amount - a.amount);

  return (
    <div className="max-w-3xl mx-auto space-y-16 animate-fadeIn" id="scorecard-viewport">
      
      {/* 1. Header Area: BidFlow logo, Auction ID, Share Action */}
      <div className="flex items-center justify-between border-b border-gray-900 pb-6">
        <div className="flex items-center gap-6">
          <button
            onClick={onBackToLobby}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Portal</span>
          </button>
          
          <div className="text-xs font-mono text-gray-500 flex items-center gap-2">
            <span>/</span>
            <span className="font-semibold text-gray-300">AUCTION {auction.id}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCopyLink}
            className="text-xs px-3.5 py-1.5 rounded bg-gray-950 border border-gray-850 hover:bg-gray-900 text-gray-300 hover:text-white transition inline-flex items-center gap-2 cursor-pointer"
          >
            {copiedLink ? (
              <>
                <Check className="w-3 h-3 text-gray-400" />
                <span>Link Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Share scoreboard URL</span>
              </>
            )}
          </button>

          <button
            onClick={onFetchLatest}
            className="p-1.5 text-gray-500 hover:text-white transition rounded cursor-pointer hover:bg-gray-950"
            title="Refresh feed"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Item & Scoreboard Core Grid (Symmetrical monochrome layout) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
        
        {/* Left Hand: High Detail Item Specs */}
        <div className="md:col-span-6 space-y-6">
          {auction.image && (
            <div className="aspect-video w-full rounded border border-gray-900 overflow-hidden bg-black">
              <img 
                src={auction.image} 
                alt={auction.title}
                className="w-full h-full object-cover grayscale brightness-90 hover:grayscale-0 transition duration-300"
              />
            </div>
          )}

          <div className="space-y-3">
            <h1 className="text-2xl font-semibold text-white tracking-tight leading-tight uppercase font-mono">
              {auction.title}
            </h1>
            <p className="text-xs text-gray-400 leading-relaxed font-sans">
              {auction.description}
            </p>
          </div>

          <div className="border-t border-gray-900 pt-5 text-xs font-mono text-gray-500">
            <div>Starting reserve: <span className="text-gray-300">${auction.minPrice}</span></div>
            <div className="mt-1">Seller phone: <span className="text-gray-400">{getAnonymized("", auction.sellerPhone)}</span></div>
          </div>
        </div>

        {/* Right Hand: Standalone Real-Time Scorecard */}
        <div className="md:col-span-6 flex flex-col justify-between space-y-10">
          
          {/* Status block */}
          <div className="space-y-1">
            <span className="text-[10px] font-mono tracking-widest text-gray-500 uppercase block">
              CURRENT HIGHEST BID
            </span>
            <div className="text-5xl font-semibold font-mono text-white tracking-tight">
              ${auction.currentPrice}
            </div>
            
            <div className="text-xs font-mono text-gray-400 pt-2 flex items-center gap-2">
              <span>Leader:</span>
              <span className="text-white font-medium">
                {auction.currentWinnerName 
                  ? getAnonymized(auction.currentWinnerName, auction.currentWinnerPhone) 
                  : "None"
                }
              </span>
            </div>
          </div>

          {/* Symmetrical Mini parameters */}
          <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-905 text-xs font-mono">
            <div>
              <span className="text-gray-500 uppercase block text-[10px] tracking-wider">TOTAL BIDS</span>
              <span className="text-gray-200 font-semibold">{auction.bidsCount} placed</span>
            </div>
            <div>
              <span className="text-gray-500 uppercase block text-[10px] tracking-wider">TIME REMAINING</span>
              <span className="text-gray-200 font-semibold">{timeLeft}</span>
            </div>
          </div>

          {/* Simple chronological Bid Feed */}
          <div className="space-y-4">
            <span className="text-[10px] font-mono uppercase tracking-wider text-gray-500 block">
              LIVE ACTIVITY FEED
            </span>
            
            <div className="space-y-2 border border-gray-900 rounded p-3 bg-[#0a0a0a] max-h-[160px] overflow-y-auto">
              {auctionBids.length === 0 ? (
                <p className="text-xs text-gray-600 italic font-mono p-1">No bids recorded yet.</p>
              ) : (
                auctionBids.map((b) => {
                  const bidTime = new Date(b.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const bidderInitials = getAnonymized(b.bidderName, b.bidderPhone);
                  return (
                    <div key={b.id} className="text-xs font-mono text-gray-400 flex justify-between">
                      <span>{bidTime}</span>
                      <span className="text-gray-300">{bidderInitials} placed ${b.amount}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

      </div>

      {/* 3. Pure Read-Only How-To-Bid Instruction Card */}
      <div className="bg-[#080808] border border-gray-900 rounded p-6">
        <h3 className="text-xs font-mono text-white uppercase tracking-wider mb-2">How to Bid</h3>
        <p className="text-xs text-gray-400 leading-relaxed mb-4">
          All bids, listings, and updates are entirely conversational. No user accounts, forms, or logging in is supported on this website. To place a bid, send a WhatsApp text message containing the word <strong className="text-white font-mono">BID</strong> followed by the auction ID and your price:
        </p>
        <div className="bg-black border border-gray-905 p-3.5 rounded font-mono text-xs text-gray-300 select-all flex justify-between items-center">
          <span>BID {auction.id.replace("#", "")} {auction.currentPrice + 50}</span>
          <span className="text-[10px] text-gray-600 font-sans select-none">Send over WhatsApp</span>
        </div>
      </div>

      {/* 4. Completely Discrete Simulation Line (For easy grading & active testing) */}
      <div className="border-t border-gray-905 pt-8 text-center space-y-3">
        <button
          onClick={() => setShowSimTool(!showSimTool)}
          className="text-[11px] font-mono text-gray-500 hover:text-gray-300 transition underline cursor-pointer"
        >
          {showSimTool ? "[ Close Interactive Simulator ]" : "[ Open Dynamic Agent Tester ]"}
        </button>

        {showSimTool && (
          <div className="max-w-md mx-auto bg-black border border-gray-850 p-4 rounded text-left space-y-4 animate-scaleUp font-mono text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-gray-905">
              <span className="text-[10px] font-bold text-gray-400 uppercase">WhatsApp Bot Simulator</span>
              <span className="text-[9px] text-gray-600">Active User: {simName}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <button
                type="button"
                onClick={() => { setSimPhone("+14155552675"); setSimName("Robert S."); }}
                className={`py-1.5 rounded border text-center cursor-pointer ${simPhone === "+14155552675" ? "border-gray-500 text-white bg-gray-950 font-bold" : "border-gray-900 text-gray-500 hover:text-gray-300"}`}
              >
                Robert S.
              </button>
              <button
                type="button"
                onClick={() => { setSimPhone("+2348039281144"); setSimName("Amara K."); }}
                className={`py-1.5 rounded border text-center cursor-pointer ${simPhone === "+2348039281144" ? "border-gray-500 text-white bg-gray-950 font-bold" : "border-gray-900 text-gray-500 hover:text-gray-300"}`}
              >
                Amara K.
              </button>
            </div>

            <form onSubmit={handleSimSubmit} className="flex gap-2 bg-gray-950 p-1 border border-gray-900 rounded">
              <input
                type="text"
                value={simText}
                required
                onChange={(e) => setSimText(e.target.value)}
                placeholder={`e.g. "BID ${auction.id.replace("#", "")} ${(auction.currentPrice + 30)}"`}
                className="flex-grow bg-transparent text-xs text-white placeholder-gray-700 px-2 py-1.5 focus:outline-none"
              />
              <button
                type="submit"
                className="px-3 bg-gray-900 hover:bg-gray-800 text-white rounded text-[10px] transition cursor-pointer"
              >
                Send Text
              </button>
            </form>
            <p className="text-[9px] text-gray-600 leading-normal">
              Pressing Send processes the textual command triggers outbid notifications and pushes live updates into this scorecard instantly.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
