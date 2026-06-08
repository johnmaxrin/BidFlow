import React, { useState, useEffect } from "react";
import { WhatsAppApiConfig } from "../types";
import { Save, AlertCircle, CheckCircle2, Shield, Link, HelpCircle, Code, Copy, Check } from "lucide-react";

interface DeveloperTabProps {
  config: WhatsAppApiConfig;
  onSaveConfig: (cfg: WhatsAppApiConfig) => void;
}

export function DeveloperTab({ config, onSaveConfig }: DeveloperTabProps) {
  const [integrationType, setIntegrationType] = useState<WhatsAppApiConfig["integrationType"]>("none");
  const [accessToken, setAccessToken] = useState("");
  const [phoneId, setPhoneId] = useState("");
  const [verifyToken, setVerifyToken] = useState("");
  
  // Twilio
  const [twilioSid, setTwilioSid] = useState("");
  const [twilioToken, setTwilioToken] = useState("");
  const [twilioFrom, setTwilioFrom] = useState("");

  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (config) {
      setIntegrationType(config.integrationType || "none");
      setAccessToken(config.accessToken || "");
      setPhoneId(config.phoneId || "");
      setVerifyToken(config.verifyToken || "whatsapp_bidding_token_123");
      setTwilioSid(config.twilioSid || "");
      setTwilioToken(config.twilioToken || "");
      setTwilioFrom(config.twilioFrom || "");
    }
  }, [config]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig({
      integrationType,
      accessToken,
      phoneId,
      verifyToken,
      twilioSid,
      twilioToken,
      twilioFrom
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  const currentHost = window.location.origin;
  const webhookUrl = `${currentHost}/api/whatsapp/webhook`;
  const twilioUrl = `${currentHost}/api/whatsapp/twilio`;

  const copyToClipboard = (txt: string, isUrl: boolean) => {
    navigator.clipboard.writeText(txt);
    if (isUrl) {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 3000);
    } else {
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 3000);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="dev-tab-root">
      
      {/* Configuration Form */}
      <div className="lg:col-span-6 space-y-4">
        <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
            <Shield className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold text-slate-100 font-display uppercase tracking-wider">Gateway Configuration</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Toggle from custom sandbox models to production WhatsApp APIs</p>
            </div>
          </div>

          {config.isSystemTwilioConfigured ? (
            <div className="bg-emerald-950/20 border border-emerald-900/60 text-emerald-300 p-4.5 rounded-2xl text-xs flex flex-col gap-2 animate-fadeIn">
              <div className="flex items-center gap-2 font-bold text-[11px] uppercase tracking-wider text-emerald-400">
                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-405 shrink-0" />
                <span>Default Twilio Gateway Connected</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                A system-wide Twilio API integration is securely configured by the administrator. Conversations automatically route quotes to cellphones. All interactive bids and listings are fully enabled without further setup!
              </p>
            </div>
          ) : saveSuccess ? (
            <div className="bg-emerald-950/40 border border-emerald-900 text-emerald-300 p-4 rounded-xl text-xs flex items-center gap-2.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>WhatsApp live credentials synchronized and saved to secure node servers!</span>
            </div>
          ) : null}

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase block tracking-wider">Gateway Integration Mode</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                disabled={!!config.isSystemTwilioConfigured}
                onClick={() => setIntegrationType("none")}
                className={`p-3 rounded-xl border text-center font-semibold transition cursor-pointer text-xs ${
                  integrationType === "none"
                    ? "border-emerald-650 bg-emerald-600 text-white font-bold shadow-lg"
                    : "border-slate-800 bg-slate-950 hover:bg-slate-900 text-slate-400"
                } ${config.isSystemTwilioConfigured ? "opacity-40 cursor-not-allowed" : ""}`}
              >
                Sandbox Demo
              </button>
              
              <button
                type="button"
                disabled={!!config.isSystemTwilioConfigured}
                onClick={() => setIntegrationType("cloud_api")}
                className={`p-3 rounded-xl border text-center font-semibold transition cursor-pointer text-xs ${
                  integrationType === "cloud_api"
                    ? "border-emerald-650 bg-emerald-600 text-white font-bold shadow-lg"
                    : "border-slate-800 bg-slate-950 hover:bg-slate-900 text-slate-400"
                } ${config.isSystemTwilioConfigured ? "opacity-40 cursor-not-allowed" : ""}`}
              >
                Meta Cloud API
              </button>

              <button
                type="button"
                disabled={!!config.isSystemTwilioConfigured}
                onClick={() => setIntegrationType("twilio")}
                className={`p-3 rounded-xl border text-center font-semibold transition cursor-pointer text-xs ${
                  integrationType === "twilio"
                    ? "border-emerald-650 bg-emerald-600 text-white font-bold shadow-lg"
                    : "border-slate-800 bg-slate-950 hover:bg-slate-900 text-slate-400"
                } ${config.isSystemTwilioConfigured ? "border-emerald-900/40 bg-emerald-950/20 text-emerald-400 font-bold" : ""}`}
              >
                Twilio WhatsApp
              </button>
            </div>
          </div>

          {integrationType === "none" && (
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs text-slate-400 leading-relaxed space-y-2 animate-fadeIn">
              <p className="font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wide text-[10px]">
                <AlertCircle className="w-4 h-4 text-emerald-400" />
                Active Mode: Offline-First Sandbox (Default)
              </p>
              <p>Under this mode, you do not need real Meta System tokens. You can immediately list items, simulate incoming group replies, and test real-time outbid broadcasts through the interactive <strong>Sandbox</strong> tab.</p>
              <p>Bot responses and outbid dispatch alerts render locally to keep configurations secure and portable.</p>
            </div>
          )}

          {integrationType === "cloud_api" && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex gap-2">
                <AlertCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Meta API secrets are processed server-side only. Environment variables isolate secure phone keys.</span>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase block tracking-wider">Permanent System User Token</label>
                <input
                  type="password"
                  disabled={!!config.isSystemTwilioConfigured}
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder="EAABw..."
                  className="w-full text-xs bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-3 text-slate-200 placeholder:text-slate-705 focus:outline-none disabled:opacity-50"
                />
                <span className="text-[9px] text-slate-500">Acquire from Meta App Dashboard Configuration</span>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Phone ID</label>
                  <input
                    type="text"
                    disabled={!!config.isSystemTwilioConfigured}
                    value={phoneId}
                    onChange={(e) => setPhoneId(e.target.value)}
                    placeholder="e.g. 109823612841"
                    className="w-full text-xs bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-3 text-slate-200 placeholder:text-slate-705 focus:outline-none disabled:opacity-50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Verify Token *</label>
                  <input
                    type="text"
                    required
                    disabled={!!config.isSystemTwilioConfigured}
                    value={verifyToken}
                    onChange={(e) => setVerifyToken(e.target.value)}
                    placeholder="whatsapp_bidding_token_123"
                    className="w-full text-xs bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-3 text-slate-200 placeholder:text-slate-750 focus:outline-none disabled:opacity-50"
                  />
                </div>
              </div>
            </div>
          )}

          {integrationType === "twilio" && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex gap-2">
                <AlertCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Twilio WhatsApp Gateway routes messages dynamically using standard webhooks as endpoints.</span>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Twilio Account SID</label>
                <input
                  type="text"
                  disabled={!!config.isSystemTwilioConfigured}
                  value={twilioSid}
                  onChange={(e) => setTwilioSid(e.target.value)}
                  placeholder="AC..."
                  className="w-full text-xs bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-3 text-slate-200 placeholder:text-slate-705 focus:outline-none disabled:opacity-60 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Auth Token</label>
                <input
                  type="password"
                  disabled={!!config.isSystemTwilioConfigured}
                  value={twilioToken}
                  onChange={(e) => setTwilioToken(e.target.value)}
                  placeholder="••••••••••••••••"
                  className="w-full text-xs bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-3 text-slate-200 placeholder:text-slate-750 focus:outline-none disabled:opacity-60"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">WhatsApp From Number</label>
                <input
                  type="text"
                  disabled={!!config.isSystemTwilioConfigured}
                  value={twilioFrom}
                  onChange={(e) => setTwilioFrom(e.target.value)}
                  placeholder="e.g. +14155238886"
                  className="w-full text-xs bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-3 text-slate-200 placeholder:text-slate-705 focus:outline-none disabled:opacity-60 font-mono"
                />
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-slate-800 flex justify-end">
            {config.isSystemTwilioConfigured ? (
              <span className="flex items-center gap-1.5 px-4 py-2 text-[10px] font-bold font-mono uppercase tracking-wider text-emerald-400 bg-emerald-950/20 border border-emerald-900/30 rounded-xl">
                <Check className="w-3.5 h-3.5" />
                Active & Secured By Environment
              </span>
            ) : (
              <button
                id="save-dev-settings"
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition cursor-pointer shadow-lg"
              >
                <Save className="w-4 h-4" />
                Save Settings
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Meta Webhook instructions */}
      <div className="lg:col-span-6 space-y-4">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
            <Link className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold text-slate-100 font-display uppercase tracking-wider">Webhook Endpoint Synchronizer</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Callback addresses to connect real-time streams</p>
            </div>
          </div>

          <div className="space-y-4 text-xs text-slate-300">
            <div className="space-y-2 bg-slate-950 p-4 rounded-2xl border border-slate-850">
              <span className="font-bold text-slate-200 block text-xs uppercase tracking-wider">Meta Developer Webhook Configuration:</span>
              <p className="text-[11px] text-slate-500 leading-relaxed">Provide this Webhook endpoint inside your Meta WhatsApp setup to enable bi-directional streaming:</p>
              
              <div className="flex gap-2 items-center bg-slate-900 border border-slate-805 p-3 rounded-xl mt-1.5">
                <code className="text-[10px] font-mono break-all text-emerald-400 flex-grow select-all">{webhookUrl}</code>
                <button
                  type="button"
                  onClick={() => copyToClipboard(webhookUrl, true)}
                  className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg cursor-pointer transition shrink-0"
                >
                  {copiedUrl ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex gap-1.5 items-center mt-3 justify-between text-slate-400">
                <span className="text-[11px]">Verification Token: <code className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-200 font-bold font-mono text-xs">{verifyToken || "whatsapp_bidding_token_123"}</code></span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(verifyToken || "whatsapp_bidding_token_123", false)}
                  className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5 cursor-pointer"
                >
                  {copiedToken ? "Copied Token!" : "Copy Token"}
                </button>
              </div>
            </div>

            <div className="space-y-2 bg-slate-950 p-4 rounded-2xl border border-slate-850">
              <span className="font-bold text-slate-200 block text-xs uppercase tracking-wider">Twilio Webhook Target:</span>
              <p className="text-[11px] text-slate-500 leading-relaxed">Set the target webhook mapping under the Twilio Sandbox "When a message comes in" property:</p>
              
              <div className="flex gap-2 items-center bg-slate-900 border border-slate-805 p-3 rounded-xl mt-1.5">
                <code className="text-[10px] font-mono break-all text-emerald-400 flex-grow select-all">{twilioUrl}</code>
                <button
                  type="button"
                  onClick={() => copyToClipboard(twilioUrl, true)}
                  className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg cursor-pointer transition shrink-0"
                >
                  {copiedUrl ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Step guidelines */}
            <div className="space-y-2 pt-1">
              <h4 className="font-bold text-slate-200 text-xs flex items-center gap-1.5 uppercase font-display tracking-wider">
                <HelpCircle className="w-4 h-4 text-emerald-400" /> Quick Setup steps:
              </h4>
              <ol className="list-decimal pl-4.5 space-y-2 text-[11px] leading-relaxed text-slate-400">
                <li>Register a developer account on <a href="https://developers.facebook.com" target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline">Meta Developers Portal</a> and construct a WhatsApp integration.</li>
                <li>Verify your communication gateway with the custom <span className="font-semibold text-slate-200">Verify Token</span> and specify our public <span className="font-semibold text-slate-200">Webhook URL</span>.</li>
                <li>Configure your profile to subscribe to the <span className="text-emerald-400 font-mono">messages</span> event.</li>
                <li>Share interactive item cards to WhatsApp buy-and-sell channels. Bidders reply automatically, and our Gemini agent instantly logs quotes!</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
