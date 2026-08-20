"use client";

import React, { useState, useEffect } from "react";
import { X, Key, Check, ShieldCheck, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/* Official SVG logos for providers */
const GoogleGeminiIcon = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 24C12 17.3726 6.62742 12 0 12C6.62742 12 12 6.62742 12 0C12 6.62742 17.3726 12 24 12C17.3726 12 12 17.3726 12 24Z"
      fill="url(#gemini-grad)"
    />
    <defs>
      <linearGradient id="gemini-grad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
        <stop stopColor="#1A73E8" />
        <stop offset="0.5" stopColor="#8AB4F8" />
        <stop offset="1" stopColor="#D2E3FC" />
      </linearGradient>
    </defs>
  </svg>
);

const OpenAIIcon = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.794.794 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.535-3.0137l.142.0852 4.783 2.7582a.794.794 0 0 0 .7854 0l5.833-3.3691v2.3324a.0805.0805 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3423 8.8256a4.485 4.485 0 0 1 2.3655-1.9728V12.44a.7846.7846 0 0 0 .3928.6813l5.8283 3.3644-2.02 1.1686a.0758.0758 0 0 1-.0711 0l-4.8303-2.7913A4.4944 4.4944 0 0 1 2.3423 8.8256zm16.5963 3.8558L13.1038 9.317l2.0199-1.1638a.0758.0758 0 0 1 .0711 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.794.794 0 0 0-.407-.6907zM21.6577 15.1744a4.485 4.485 0 0 1-2.3655 1.9728V11.56a.7846.7846 0 0 0-.3928-.6813l-5.8283-3.3644 2.02-1.1686a.0758.0758 0 0 1 .0711 0l4.8303 2.7913a4.4944 4.4944 0 0 1 1.6652 6.0374zM12 13.6267l-2.7303-1.5759 2.7303-1.5759 2.7303 1.5759L12 13.6267z" />
  </svg>
);

const MistralIcon = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 3h4.5v4.5H3V3zm13.5 0H21v4.5h-4.5V3zM3 16.5h4.5V21H3v-4.5zm13.5 0H21V21h-4.5v-4.5zM7.5 7.5H12V12H7.5V7.5zm4.5 0h4.5V12H12V7.5zm-4.5 4.5H12v4.5H7.5V12zm4.5 0h4.5v4.5H12V12z" />
  </svg>
);

const OllamaIcon = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2a5 5 0 0 0-5 5v3a5 5 0 0 0 10 0V7a5 5 0 0 0-5-5zm-3 8a3 3 0 0 1 6 0V7a3 3 0 0 1-6 0v3zm-4 4a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v4a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4v-4zm4-2a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2H9z" />
  </svg>
);

const GroqIcon = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M13 2L3 14h7v8l10-12h-7V2z" />
  </svg>
);

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [openaiKey, setOpenaiKey] = useState("");
  const [googleKey, setGoogleKey] = useState("");
  const [groqKey, setGroqKey] = useState("");
  const [mistralKey, setMistralKey] = useState("");
  const [openrouterKey, setOpenrouterKey] = useState("");
  const [ollamaUrl, setOllamaUrl] = useState("http://localhost:11434/api");
  const [defaultModel, setDefaultModel] = useState("gemini-2.0-flash");
  const [savedToast, setSavedToast] = useState(false);
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedSettings = localStorage.getItem("agentforge-settings");
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          if (parsed.openaiKey) setOpenaiKey(parsed.openaiKey);
          if (parsed.googleKey) setGoogleKey(parsed.googleKey);
          if (parsed.groqKey) setGroqKey(parsed.groqKey);
          if (parsed.mistralKey) setMistralKey(parsed.mistralKey);
          if (parsed.openrouterKey) setOpenrouterKey(parsed.openrouterKey);
          if (parsed.ollamaUrl !== undefined) setOllamaUrl(parsed.ollamaUrl);
          if (parsed.defaultModel) setDefaultModel(parsed.defaultModel);
        } catch {
          // Ignore parse errors
        }
      }
    }
  }, [isOpen]);

  const handleSave = () => {
    // Save-time validation: Ensure at least one provider is configured
    if (!googleKey.trim() && !openaiKey.trim() && !groqKey.trim() && !mistralKey.trim() && !openrouterKey.trim() && !ollamaUrl.trim()) {
      setValidationError("Configure at least one provider key or local endpoint before saving.");
      return;
    }

    setValidationError("");
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "agentforge-settings",
        JSON.stringify({
          openaiKey,
          googleKey,
          groqKey,
          mistralKey,
          openrouterKey,
          ollamaUrl,
          defaultModel,
        })
      );

      setSavedToast(true);
      setTimeout(() => {
        setSavedToast(false);
        onClose();
      }, 1200);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-xl bg-card border border-warm-border rounded-[16px] shadow-2xl overflow-hidden animate-slide-up flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between px-[28px] py-6 border-b border-warm-border">
          <div className="flex items-center gap-3">
            <div className="w-[40px] h-[40px] rounded-[10px] bg-gold/15 flex items-center justify-center text-gold shrink-0">
              <Key className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-[16px] font-semibold text-foreground">API Settings</h2>
              <p className="text-[12.5px] font-normal text-muted-foreground mt-0.5">
                Manage your provider credentials & endpoints
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors mt-0.5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="px-[28px] pt-6 pb-[26px] space-y-[22px]">
          {/* Quiet Info Banner */}
          <div className="flex items-center gap-2.5 p-3.5 rounded-[12px] bg-muted/40 border border-warm-border/60 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span>Keys are stored locally in your browser and never leave your device.</span>
          </div>

          {/* Validation Error Banner */}
          {validationError && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-[12px] bg-destructive/10 border border-destructive/20 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Google AI Studio Key */}
          <div className="space-y-1.5">
            <Label htmlFor="google-key" className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span className="flex items-center gap-[8px]">
                <div className="w-[20px] h-[20px] rounded-[5px] bg-muted/40 flex items-center justify-center shrink-0">
                  <GoogleGeminiIcon className="w-3.5 h-3.5" />
                </div>
                <span>Google AI Studio Key (Gemini)</span>
              </span>
              <span className="text-[11px] text-muted-foreground font-normal">Optional</span>
            </Label>
            <Input
              id="google-key"
              type="password"
              placeholder="AIzaSy..."
              value={googleKey}
              onChange={(e) => setGoogleKey(e.target.value)}
              className="rounded-[9px] bg-cream border-warm-border py-[11px] px-[14px] h-10 text-[13px] font-mono"
            />
          </div>

          {/* OpenAI Key */}
          <div className="space-y-1.5">
            <Label htmlFor="openai-key" className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span className="flex items-center gap-[8px]">
                <div className="w-[20px] h-[20px] rounded-[5px] bg-muted/40 flex items-center justify-center shrink-0">
                  <OpenAIIcon className="w-3.5 h-3.5 text-foreground" />
                </div>
                <span>OpenAI API Key</span>
              </span>
              <span className="text-[11px] text-muted-foreground font-normal">Optional</span>
            </Label>
            <Input
              id="openai-key"
              type="password"
              placeholder="sk-proj-..."
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              className="rounded-[9px] bg-cream border-warm-border py-[11px] px-[14px] h-10 text-[13px] font-mono"
            />
          </div>

          {/* Groq Key */}
          <div className="space-y-1.5">
            <Label htmlFor="groq-key" className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span className="flex items-center gap-[8px]">
                <div className="w-[20px] h-[20px] rounded-[5px] bg-amber-500/10 flex items-center justify-center shrink-0">
                  <GroqIcon className="w-3.5 h-3.5 text-amber-600" />
                </div>
                <span>Groq API Key</span>
              </span>
              <span className="text-[11px] text-muted-foreground font-normal">Optional</span>
            </Label>
            <Input
              id="groq-key"
              type="password"
              placeholder="gsk_..."
              value={groqKey}
              onChange={(e) => setGroqKey(e.target.value)}
              className="rounded-[9px] bg-cream border-warm-border py-[11px] px-[14px] h-10 text-[13px] font-mono"
            />
          </div>

          {/* Mistral Key */}
          <div className="space-y-1.5">
            <Label htmlFor="mistral-key" className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span className="flex items-center gap-[8px]">
                <div className="w-[20px] h-[20px] rounded-[5px] bg-muted/40 flex items-center justify-center shrink-0">
                  <MistralIcon className="w-3.5 h-3.5 text-orange-500" />
                </div>
                <span>Mistral API Key</span>
              </span>
              <span className="text-[11px] text-muted-foreground font-normal">Optional</span>
            </Label>
            <Input
              id="mistral-key"
              type="password"
              placeholder="Enter Mistral API key"
              value={mistralKey}
              onChange={(e) => setMistralKey(e.target.value)}
              className="rounded-[9px] bg-cream border-warm-border py-[11px] px-[14px] h-10 text-[13px] font-mono"
            />
          </div>

          {/* OpenRouter Key */}
          <div className="space-y-1.5">
            <Label htmlFor="openrouter-key" className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span className="flex items-center gap-[8px]">
                <div className="w-[20px] h-[20px] rounded-[5px] bg-purple-500/10 flex items-center justify-center shrink-0">
                  <Key className="w-3.5 h-3.5 text-purple-600" />
                </div>
                <span>OpenRouter API Key</span>
              </span>
              <span className="text-[11px] text-muted-foreground font-normal">Optional</span>
            </Label>
            <Input
              id="openrouter-key"
              type="password"
              placeholder="sk-or-v1-..."
              value={openrouterKey}
              onChange={(e) => setOpenrouterKey(e.target.value)}
              className="rounded-[9px] bg-cream border-warm-border py-[11px] px-[14px] h-10 text-[13px] font-mono"
            />
          </div>

          {/* Ollama Base URL */}
          <div className="space-y-1.5">
            <Label htmlFor="ollama-url" className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span className="flex items-center gap-[8px]">
                <div className="w-[20px] h-[20px] rounded-[5px] bg-muted/40 flex items-center justify-center shrink-0">
                  <OllamaIcon className="w-3.5 h-3.5 text-foreground" />
                </div>
                <span>Ollama Local Endpoint</span>
              </span>
              <span className="text-[11px] text-muted-foreground font-normal">Optional</span>
            </Label>
            <Input
              id="ollama-url"
              type="text"
              placeholder="http://localhost:11434/api"
              value={ollamaUrl}
              onChange={(e) => setOllamaUrl(e.target.value)}
              className="rounded-[9px] bg-cream border-warm-border py-[11px] px-[14px] h-10 text-[13px] font-mono"
            />
          </div>

          {/* Default AI Model */}
          <div className="space-y-1.5 pt-3 border-t border-warm-border/60">
            <Label htmlFor="default-model" className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span>Default AI Model (for background tasks)</span>
              <span className="text-[11px] text-muted-foreground font-normal">Optional</span>
            </Label>
            <Input
              id="default-model"
              type="text"
              placeholder="gemini-2.0-flash"
              value={defaultModel}
              onChange={(e) => setDefaultModel(e.target.value)}
              className="rounded-[9px] bg-cream border-warm-border py-[11px] px-[14px] h-10 text-[13px] font-mono"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-[28px] py-4 bg-muted/30 border-t border-warm-border/60 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-0 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-5 py-[11px] rounded-[9px] text-xs font-semibold
              bg-gold text-gold-foreground hover:brightness-105 transition-all shadow-sm"
          >
            {savedToast ? (
              <>
                <Check className="h-3.5 w-3.5 text-green-700" /> Saved!
              </>
            ) : (
              "Save Settings"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
