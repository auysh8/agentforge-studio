"use client";

import React, { useState, useRef } from "react";
import { FlowBuilder } from "@/components/flow-builder";
import { PropertiesPanel } from "@/components/properties-panel";
import { Sidebar } from "@/components/sidebar";
import { ConsolePanel } from "@/components/console-panel";
import { useFlowStore } from "@/store/flow-store";
import { ExportModal } from "@/components/export-modal";
import { SettingsModal } from "@/components/settings-modal";
import { RunModal } from "@/components/run-modal";
import {
  Download,
  Play,
  Save,
  X,
  PanelRightClose,
  FolderOpen,
  FileJson,
  RotateCcw,
} from "lucide-react";

export default function Home() {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRunModalOpen, setIsRunModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [activeView, setActiveView] = useState("canvas");
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [isPropertiesOpen, setIsPropertiesOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedNode = useFlowStore((state) => state.selectedNode);
  const nodes = useFlowStore((state) => state.nodes);
  const edges = useFlowStore((state) => state.edges);
  const loadGraph = useFlowStore((state) => state.loadGraph);
  const resetGraph = useFlowStore((state) => state.resetGraph);
  const setNodeStatus = useFlowStore((state) => state.setNodeStatus);
  const resetNodeStatuses = useFlowStore((state) => state.resetNodeStatuses);
  const setEdgeActive = useFlowStore((state) => state.setEdgeActive);
  const resetEdgeStatuses = useFlowStore((state) => state.resetEdgeStatuses);

  // Auto-open properties panel when a node is selected
  React.useEffect(() => {
    if (selectedNode) {
      setTimeout(() => setIsPropertiesOpen(true), 0);
    }
  }, [selectedNode]);

  const handleSave = () => {
    setToastMessage("Saved to LocalStorage!");
    setTimeout(() => setToastMessage(""), 3000);
  };

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ nodes, edges }, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `agentforge-workflow-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setToastMessage("Exported workflow JSON!");
    setTimeout(() => setToastMessage(""), 3000);
  };

  const handleImportJson = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (event.target.files && event.target.files[0]) {
      fileReader.readAsText(event.target.files[0], "UTF-8");
      fileReader.onload = (e) => {
        try {
          const parsed = JSON.parse(e.target?.result as string);
          if (parsed && Array.isArray(parsed.nodes) && Array.isArray(parsed.edges)) {
            loadGraph(parsed);
            setToastMessage("Loaded workflow from JSON!");
            setTimeout(() => setToastMessage(""), 3000);
          } else {
            alert("Invalid workflow JSON file format.");
          }
        } catch {
          alert("Could not parse JSON file.");
        }
      };
    }
    // Reset file input so re-importing same file works
    if (event.target) event.target.value = "";
  };

  const handleClearCanvas = () => {
    if (nodes.length === 0 || confirm("Are you sure you want to clear the canvas?")) {
      resetGraph();
      setToastMessage("Cleared canvas");
      setTimeout(() => setToastMessage(""), 3000);
    }
  };

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  const [completion, setCompletion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>(undefined);
  const pendingStatusTimeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});

  const getExecutableGraph = useFlowStore((state) => state.getExecutableGraph);

  const handleRunSkill = async () => {
    const graph = getExecutableGraph();
    if (!graph) {
      alert("Graph must contain at least a Trigger node.");
      return;
    }
    // Clear any pending node status timeouts from previous runs
    Object.values(pendingStatusTimeoutsRef.current).forEach(clearTimeout);
    pendingStatusTimeoutsRef.current = {};

    resetNodeStatuses();
    resetEdgeStatuses();
    setIsConsoleOpen(true);
    setIsLoading(true);
    setCompletion("");
    setError(undefined);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (typeof window !== "undefined") {
      const savedSettings = localStorage.getItem("agentforge-settings");
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          if (parsed.openaiKey) headers["x-openai-api-key"] = parsed.openaiKey;
          if (parsed.googleKey) headers["x-google-api-key"] = parsed.googleKey;
          if (parsed.mistralKey) headers["x-mistral-api-key"] = parsed.mistralKey;
        } catch {
          // ignore error
        }
      }
    }

    // Timing parameters for playful visual relay sequencing
    const HANDOFF_DOT_DURATION = 450;  // ms for single Messenger Orb dot to travel along edge
    const MIN_NODE_VISUAL_DURATION = 700; // ms minimum execution visual floor per node
    // Pause between node A finishing (success pop) and the dot leaving toward node B.
    // Gives the success pop animation (0.4s) room to breathe before the next hop begins.
    const POST_SUCCESS_PAUSE = 350;    // ms

    const serverCompletedNodes = new Set<string>();
    const visualNodeRunTimes: Record<string, number> = {};

    // Helper to queue visual running state of a node (playing handoff dot animation first if connected)
    const scheduleVisualNodeRun = (nodeId: string) => {
      const incomingEdge = graph.edges.find((e) => e.target === nodeId);
      if (incomingEdge && graph.nodes.some((n) => n.id === incomingEdge.source)) {
        // Step 3: Downstream node enters pending visual hold while dot travels along the line
        setNodeStatus(nodeId, "pending");

        // 1. Activate incoming edge to send single one-shot Messenger Orb dot
        setEdgeActive(incomingEdge.id, true);

        // 2. Schedule dot arrival: when dot finishes traveling (450ms), deactivate edge and start node running
        const handoffTimeout = setTimeout(() => {
          setEdgeActive(incomingEdge.id, false);
          visualNodeRunTimes[nodeId] = Date.now();
          // Step 4: Dot lands -> node transitions to visually 'running'
          setNodeStatus(nodeId, "running");

          // If server already finished this node while dot was traveling, trigger completion check now
          if (serverCompletedNodes.has(nodeId)) {
            scheduleNodeSuccess(nodeId);
          }
        }, HANDOFF_DOT_DURATION);
        pendingStatusTimeoutsRef.current[`handoff_${nodeId}`] = handoffTimeout;
      } else {
        // Entry node (Trigger): no incoming edge, starts running immediately
        visualNodeRunTimes[nodeId] = Date.now();
        setNodeStatus(nodeId, "running");
      }
    };

    // Helper to schedule node completion and handoff to downstream node
    const scheduleNodeSuccess = (nodeId: string) => {
      const startTime = visualNodeRunTimes[nodeId] || Date.now();
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, MIN_NODE_VISUAL_DURATION - elapsed);

      const successTimeout = setTimeout(() => {
        // Step 1: Node finishes work -> set status to success (plays pop/bounce animation)
        setNodeStatus(nodeId, "success");
        delete pendingStatusTimeoutsRef.current[`success_${nodeId}`];

        // Step 2 & 5: After a short pause (letting the success pop settle),
        // trigger the handoff dot toward all downstream nodes.
        const outgoingEdges = graph.edges.filter((e) => e.source === nodeId);
        if (outgoingEdges.length > 0) {
          const relayTimeout = setTimeout(() => {
            outgoingEdges.forEach((outgoingEdge) => {
              scheduleVisualNodeRun(outgoingEdge.target);
            });
            delete pendingStatusTimeoutsRef.current[`relay_${nodeId}`];
          }, POST_SUCCESS_PAUSE);
          pendingStatusTimeoutsRef.current[`relay_${nodeId}`] = relayTimeout;
        }
      }, remaining);
      pendingStatusTimeoutsRef.current[`success_${nodeId}`] = successTimeout;
    };

    try {
      const response = await fetch("/api/execute", {
        method: "POST",
        headers,
        body: JSON.stringify(graph),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Execution failed (${response.status}): ${errText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Failed to read execution stream");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";

        for (const part of parts) {
          const trimmed = part.trim();
          if (trimmed.startsWith("data: ")) {
            try {
              const event = JSON.parse(trimmed.slice(6));
              if (event.type === "node_start") {
                // If it's the trigger entry node, schedule visual run immediately
                const isTrigger = graph.nodes.find((n) => n.id === event.nodeId)?.type === "trigger";
                if (isTrigger) {
                  scheduleVisualNodeRun(event.nodeId);
                }
              } else if (event.type === "node_success") {
                serverCompletedNodes.add(event.nodeId);
                // If node is already visually running, schedule its completion
                if (visualNodeRunTimes[event.nodeId]) {
                  scheduleNodeSuccess(event.nodeId);
                }
              } else if (event.type === "node_error") {
                setNodeStatus(event.nodeId, "error");
                if (event.error) {
                  setError(new Error(event.error));
                }
              } else if (event.type === "done") {
                setCompletion(event.output || "");
              } else if (event.type === "error") {
                setError(new Error(event.error || "Execution failed"));
                graph.nodes.forEach((n) => setNodeStatus(n.id, "error"));
              }
            } catch (e) {
              console.error("Error parsing stream event:", e);
            }
          }
        }
      }
    } catch (err: unknown) {
      console.error("Execution error:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      graph.nodes.forEach((n) => setNodeStatus(n.id, "error"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Hidden file input for JSON import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportJson}
        accept=".json"
        className="hidden"
      />

      {/* Sidebar */}
      <Sidebar
        activeView={activeView}
        onViewChange={setActiveView}
        isConsoleOpen={isConsoleOpen}
        onToggleConsole={() => setIsConsoleOpen((v) => !v)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onDragStart={onDragStart}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="flex items-center justify-between h-16 px-6 shrink-0 bg-background">
          {/* Greeting + Search */}
          <div className="flex items-center gap-4 min-w-0 pr-4">
            <h1 className="text-xl font-bold text-foreground tracking-tight truncate">
              Build something amazing
            </h1>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleClearCanvas}
              title="Clear Canvas"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium
                bg-muted/60 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Import Workflow JSON"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium
                bg-card text-foreground border border-warm-border hover:bg-muted/40 transition-all shadow-sm"
            >
              <FolderOpen className="h-3.5 w-3.5 text-blue-500" />
              Import
            </button>
            <button
              onClick={handleExportJson}
              title="Export Workflow JSON"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium
                bg-card text-foreground border border-warm-border hover:bg-muted/40 transition-all shadow-sm"
            >
              <FileJson className="h-3.5 w-3.5 text-amber-500" />
              Export JSON
            </button>
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium
                bg-card text-foreground border border-warm-border hover:bg-muted/40 transition-all shadow-sm"
            >
              <Save className="h-3.5 w-3.5" />
              Save
            </button>
            <button
              onClick={() => setIsPropertiesOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium
                bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
            >
              <PanelRightClose className="h-3.5 w-3.5" />
              Properties
            </button>
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium
                bg-card text-foreground border border-warm-border hover:bg-muted/40 transition-all shadow-sm"
            >
              <Download className="h-3.5 w-3.5" />
              Export MCP
            </button>
            <button
              onClick={() => setIsRunModalOpen(true)}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold
                bg-gold text-gold-foreground hover:brightness-105 transition-all shadow-sm
                disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Play className="h-3.5 w-3.5" />
              {isLoading ? "Running..." : "Run Skill"}
            </button>
          </div>
        </header>

        {/* Canvas Area */}
        <div className="flex-1 relative mx-3 mb-3 rounded-2xl overflow-hidden bg-card border border-warm-border shadow-sm">
          <FlowBuilder />

          {/* Console (floating at bottom) */}
          <ConsolePanel
            isOpen={isConsoleOpen}
            onClose={() => setIsConsoleOpen(false)}
            completion={completion}
            error={error}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Properties Panel (slide-out from right) */}
      {isPropertiesOpen && (
        <div className="w-[320px] shrink-0 h-full border-l border-warm-border bg-card animate-slide-in-right flex flex-col">
          <div className="flex items-center justify-between px-5 h-16 shrink-0 border-b border-warm-border">
            <h2 className="text-sm font-semibold text-foreground">Properties</h2>
            <button
              onClick={() => setIsPropertiesOpen(false)}
              className="p-1.5 rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-5">
            <PropertiesPanel />
          </div>
        </div>
      )}

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Run Modal */}
      <RunModal
        isOpen={isRunModalOpen}
        onClose={() => setIsRunModalOpen(false)}
        onRun={() => handleRunSkill()}
        isLoading={isLoading}
      />

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-[200] bg-gold text-gold-foreground px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium animate-slide-up">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
