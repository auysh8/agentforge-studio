"use client";

import React, { useState, useEffect } from "react";
import { X, Key, Cpu, Check, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [openaiKey, setOpenaiKey] = useState("");
  const [mistralKey, setMistralKey] = useState("");
  const [ollamaUrl, setOllamaUrl] = useState("http://localhost:11434/api");
  const [savedToast, setSavedToast] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedSettings = localStorage.getItem("agentforge-settings");
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          if (parsed.openaiKey) setOpenaiKey(parsed.openaiKey);
          if (parsed.mistralKey) setMistralKey(parsed.mistralKey);
          if (parsed.ollamaUrl) setOllamaUrl(parsed.ollamaUrl);
        } catch {
          // Ignore parse errors
        }
      }
    }
  }, [isOpen]);

  const handleSave = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "agentforge-settings",
        JSON.stringify({
          openaiKey,
          mistralKey,
          ollamaUrl,
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
      <div className="w-full max-w-lg bg-card border border-warm-border rounded-2xl shadow-2xl overflow-hidden animate-slide-up flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-warm-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gold/15 flex items-center justify-center text-gold">
              <Key className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">API Settings</h2>
              <p className="text-xs text-muted-foreground">Manage your provider credentials & endpoints</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-600 dark:text-blue-400">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span>API keys are stored securely in your browser&apos;s LocalStorage.</span>
          </div>

          {/* OpenAI Key */}
          <div className="space-y-1.5">
            <Label htmlFor="openai-key" className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span>OpenAI API Key</span>
              <span className="text-[10px] text-muted-foreground font-normal">sk-...</span>
            </Label>
            <Input
              id="openai-key"
              type="password"
              placeholder="sk-proj-..."
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              className="rounded-xl bg-cream border-warm-border h-10 text-sm font-mono"
            />
          </div>

          {/* Mistral Key */}
          <div className="space-y-1.5">
            <Label htmlFor="mistral-key" className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span>Mistral API Key</span>
              <span className="text-[10px] text-muted-foreground font-normal">Optional</span>
            </Label>
            <Input
              id="mistral-key"
              type="password"
              placeholder="Enter Mistral API Key"
              value={mistralKey}
              onChange={(e) => setMistralKey(e.target.value)}
              className="rounded-xl bg-cream border-warm-border h-10 text-sm font-mono"
            />
          </div>

          {/* Ollama Base URL */}
          <div className="space-y-1.5">
            <Label htmlFor="ollama-url" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5 text-purple-500" />
              <span>Ollama Local Endpoint</span>
            </Label>
            <Input
              id="ollama-url"
              type="text"
              placeholder="http://localhost:11434/api"
              value={ollamaUrl}
              onChange={(e) => setOllamaUrl(e.target.value)}
              className="rounded-xl bg-cream border-warm-border h-10 text-sm font-mono"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-muted/30 border-t border-warm-border flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:bg-muted/60 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold
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
