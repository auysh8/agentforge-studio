"use client";

import React, { useState, useRef } from "react";
import { FlowBuilder } from "@/components/flow-builder";
import { PropertiesPanel } from "@/components/properties-panel";
import { Sidebar } from "@/components/sidebar";
import { ConsolePanel } from "@/components/console-panel";
import { useFlowStore } from "@/store/flow-store";
import { useCompletion } from "@ai-sdk/react";
import { ExportModal } from "@/components/export-modal";
import { SettingsModal } from "@/components/settings-modal";
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

  const getExecutableGraph = useFlowStore((state) => state.getExecutableGraph);
  const { completion, complete, isLoading, error } = useCompletion({
    api: "/api/execute",
    streamProtocol: "text",
  });

  const handleRunSkill = async () => {
    const graph = getExecutableGraph();
    if (!graph) {
      alert("Graph must contain at least a Trigger node.");
      return;
    }
    setIsConsoleOpen(true);

    const headers: Record<string, string> = {};
    if (typeof window !== "undefined") {
      const savedSettings = localStorage.getItem("agentforge-settings");
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          if (parsed.openaiKey) headers["x-openai-api-key"] = parsed.openaiKey;
          if (parsed.mistralKey) headers["x-mistral-api-key"] = parsed.mistralKey;
        } catch {
          // ignore error
        }
      }
    }

    await complete("", { body: graph, headers });
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
              onClick={handleRunSkill}
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

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-[200] bg-gold text-gold-foreground px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium animate-slide-up">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
