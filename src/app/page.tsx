"use client";

import React, { useState, useEffect } from "react";
import { Layout, Model, TabNode, IJsonModel } from "flexlayout-react";
import "flexlayout-react/style/dark.css";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Download, Play, Save, Blocks, Terminal, RotateCcw } from "lucide-react";
import { FlowBuilder } from "@/components/flow-builder";
import { PropertiesPanel } from "@/components/properties-panel";
import { useFlowStore } from "@/store/flow-store";
import { useCompletion } from "@ai-sdk/react";
import { ExportModal } from "@/components/export-modal";

const initialLayout: IJsonModel = {
  global: {
    tabEnableClose: false,
    tabSetHeaderHeight: 40,
    tabSetTabStripHeight: 40,
    splitterSize: 6,
    tabEnableRename: false,
    tabEnableFloat: true,
  },
  borders: [],
  layout: {
    type: "row",
    weight: 100,
    children: [
      {
        type: "tabset",
        weight: 15,
        children: [
          {
            type: "tab",
            name: "Toolbox",
            component: "toolbox"
          }
        ]
      },
      {
        type: "row",
        weight: 65,
        children: [
          {
            type: "tabset",
            weight: 75,
            children: [
              {
                type: "tab",
                name: "Canvas",
                component: "canvas"
              }
            ]
          },
          {
            type: "tabset",
            weight: 25,
            children: [
              {
                type: "tab",
                name: "Output Console",
                component: "console"
              }
            ]
          }
        ]
      },
      {
        type: "tabset",
        weight: 20,
        children: [
          {
            type: "tab",
            name: "Properties",
            component: "properties"
          }
        ]
      }
    ]
  }
};

export default function Home() {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [model, setModel] = useState(() => Model.fromJson(initialLayout));

  const handleSave = () => {
    setToastMessage("Saved successfully!");
    setTimeout(() => setToastMessage(""), 3000);
  };
  
  const resetLayout = () => {
    setModel(Model.fromJson(initialLayout));
  };
  
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  const getExecutableGraph = useFlowStore((state) => state.getExecutableGraph);
  const { completion, complete, isLoading, error } = useCompletion({
    api: '/api/execute',
    streamProtocol: 'text',
  });

  const handleRunSkill = async () => {
    const graph = getExecutableGraph();
    if (!graph) {
      alert("Graph must contain at least a Trigger node and an LLM node.");
      return;
    }
    await complete('', { body: graph });
  };

  const factory = (node: TabNode) => {
    const component = node.getComponent();
    
    if (component === "toolbox") {
      return (
        <ScrollArea className="h-full w-full bg-card">
          <div className="p-4 space-y-6">
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Agents</h4>
              <div className="grid gap-2">
                <Button variant="secondary" className="justify-start h-9 text-xs cursor-grab" size="sm" draggable onDragStart={(e) => onDragStart(e, 'llm')}>LLM Node</Button>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Data</h4>
              <div className="grid gap-2">
                <Button variant="secondary" className="justify-start h-9 text-xs cursor-grab" size="sm" draggable onDragStart={(e) => onDragStart(e, 'prompt')}>Prompt</Button>
                <Button variant="secondary" className="justify-start h-9 text-xs cursor-grab" size="sm" draggable onDragStart={(e) => onDragStart(e, 'trigger')}>Trigger</Button>
              </div>
            </div>
          </div>
        </ScrollArea>
      );
    }
    if (component === "canvas") {
      return (
        <div className="h-full w-full relative bg-muted/20">
          <FlowBuilder />
        </div>
      );
    }
    if (component === "console") {
      return (
        <div className="flex h-full w-full flex-col bg-card">
          <div className="flex items-center px-4 py-2 border-b bg-muted/30 gap-2 shrink-0">
            <Terminal className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Console</span>
          </div>
          <div className="flex-1 p-4 font-mono text-sm whitespace-pre-wrap overflow-y-auto">
            {error && <span className="text-red-500">{error.message}</span>}
            {(!completion && !error && !isLoading) && <span className="text-muted-foreground">Ready. Click "Run Skill" to execute.</span>}
            {completion}
          </div>
        </div>
      );
    }
    if (component === "properties") {
      return (
        <ScrollArea className="h-full w-full bg-card">
          <div className="p-4">
            <PropertiesPanel />
          </div>
        </ScrollArea>
      );
    }
    return null;
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Top Navbar */}
      <header className="flex h-14 items-center justify-between border-b px-4 bg-card shrink-0 z-[100]">
        <div className="flex items-center gap-2">
          <div className="rounded-md bg-primary p-1">
            <Blocks className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight">AgentForge</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={resetLayout} title="Reset Window Layout">
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Save
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsExportModalOpen(true)}>
            <Download className="mr-2 h-4 w-4" />
            Export MCP
          </Button>
          <Button size="sm" onClick={handleRunSkill} disabled={isLoading}>
            <Play className="mr-2 h-4 w-4" />
            {isLoading ? "Running..." : "Run Skill"}
          </Button>
        </div>
      </header>

      {/* Main Workspace with FlexLayout */}
      <div className="flex-1 relative w-full overflow-hidden">
        <Layout 
          model={model} 
          factory={factory} 
        />
      </div>

      <ExportModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} />

      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-[200] bg-primary text-primary-foreground px-4 py-2 rounded-md shadow-lg transition-all">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
