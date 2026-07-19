"use client";

import { Terminal, ChevronDown, ChevronUp, X } from "lucide-react";

interface ConsolePanelProps {
  isOpen: boolean;
  onClose: () => void;
  completion: string;
  error: Error | undefined;
  isLoading: boolean;
}

export function ConsolePanel({
  isOpen,
  onClose,
  completion,
  error,
  isLoading,
}: ConsolePanelProps) {
  if (!isOpen) return null;

  return (
    <div className="absolute bottom-4 left-4 right-4 z-30 animate-slide-up">
      <div className="bg-card border border-warm-border rounded-2xl shadow-lg overflow-hidden max-h-[240px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-muted/40 border-b border-warm-border shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-foreground/10 flex items-center justify-center">
              <Terminal className="h-3.5 w-3.5 text-foreground/70" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Console
            </span>
            {isLoading && (
              <div className="flex items-center gap-1 ml-2">
                <div className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
                <span className="text-[10px] text-gold font-medium">Running...</span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 font-mono text-sm whitespace-pre-wrap overflow-y-auto leading-relaxed">
          {error && (
            <span className="text-destructive">{error.message}</span>
          )}
          {!completion && !error && !isLoading && (
            <span className="text-muted-foreground/60">
              Ready. Click &quot;Run Skill&quot; to execute.
            </span>
          )}
          {completion && (
            <span className="text-foreground/80">{completion}</span>
          )}
        </div>
      </div>
    </div>
  );
}
