"use client";

import { Handle, Position, NodeProps } from "@xyflow/react";
import { WebhooksLogo } from "@phosphor-icons/react";
import { Check, AlertCircle, Copy, Link2 } from "lucide-react";
import { useFlowStore } from "@/store/flow-store";
import { useState } from "react";

export function WebhookNode({ id, data, selected }: NodeProps) {
  const status = useFlowStore((state) => state.nodeStatuses[id] || "idle");
  const webhookId = (data?.webhookId as string) || id;
  const [copied, setCopied] = useState(false);

  const webhookUrl = `/api/webhooks/${webhookId}`;

  const copyWebhookUrl = () => {
    const fullUrl = `${window.location.origin}${webhookUrl}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`min-w-[240px] max-w-[290px] bg-card border border-warm-border shadow-sm rounded-xl relative transition-all duration-200 ${
        selected ? "ring-2 ring-gold/40 border-gold" : ""
      } ${status === "running" ? "node-running-active" : status === "success" ? "node-success-pop" : ""}`}
      style={{ borderLeft: "3px solid var(--family-trigger-accent)" }}
    >
      {/* Node Header */}
      <div className="flex items-start justify-between gap-3 p-3.5 pb-2">
        <div className="flex items-start gap-2.5 min-w-0 text-left">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
            style={{ backgroundColor: "var(--family-trigger-icon-bg)" }}
          >
            <WebhooksLogo size={18} weight="fill" style={{ color: "var(--family-trigger-icon-color)" }} />
          </div>
          <div className="min-w-0 flex-1 text-left">
            <h3 className="text-[14px] font-medium text-foreground truncate text-left">
              {(data?.label as string) || "Webhook Trigger"}
            </h3>
            <p className="text-[12px] font-normal text-muted-foreground leading-tight mt-0.5 text-left">
              Incoming HTTP POST
            </p>
          </div>
        </div>

        {/* Category Tag & Status */}
        <div className="flex items-center gap-1.5 shrink-0">
          {status === "success" && (
            <div className="w-4 h-4 rounded-full bg-green-500/20 text-green-600 flex items-center justify-center">
              <Check className="h-2.5 w-2.5" />
            </div>
          )}
          {status === "error" && (
            <div className="w-4 h-4 rounded-full bg-destructive/20 text-destructive flex items-center justify-center">
              <AlertCircle className="h-2.5 w-2.5" />
            </div>
          )}
          <span
            className="px-2 py-0.5 rounded-full text-[11px] font-medium"
            style={{ backgroundColor: "var(--family-trigger-tag-bg)", color: "var(--family-trigger-tag-text)" }}
          >
            webhook
          </span>
        </div>
      </div>

      {/* Detail Chip & Copy Link */}
      <div className="px-3.5 pb-3.5 pt-1 text-left">
        <div className="p-2 rounded-lg bg-muted/40 font-mono text-[11px] text-muted-foreground flex items-center justify-between text-left">
          <div className="flex items-center gap-1.5 truncate">
            <Link2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">{webhookUrl}</span>
          </div>
          <button
            onClick={copyWebhookUrl}
            className="p-1 hover:bg-background rounded text-muted-foreground hover:text-foreground transition-colors shrink-0 ml-1"
            title="Copy Webhook URL"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Source Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !border-2 !border-background hover:!scale-125 transition-transform"
        style={{ backgroundColor: "var(--family-trigger-accent)" }}
      />
    </div>
  );
}
