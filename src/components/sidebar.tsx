"use client";

import React, { useEffect, useState } from "react";
import {
  Blocks,
  Brain,
  MessageSquare,
  Play,
  Terminal,
  Settings,
  Moon,
  Sun,
  History,
  LayoutGrid,
  ChevronRight,
  ChevronDown,
  Globe,
  Split,
  Search
} from "lucide-react";
import { useTheme } from "next-themes";

const nodeCategories = [
  {
    id: "core",
    name: "Core Nodes",
    items: [
      { type: "trigger", label: "Trigger", icon: Play, color: "#22C55E", bg: "rgba(34, 197, 94, 0.15)" },
      { type: "llm", label: "LLM Node", icon: Brain, color: "#A855F7", bg: "rgba(168, 85, 247, 0.15)" },
      { type: "prompt", label: "Prompt", icon: MessageSquare, color: "#3B82F6", bg: "rgba(59, 130, 246, 0.15)" },
    ],
  },
  {
    id: "logic",
    name: "Logic & Flow",
    items: [
      { type: "condition", label: "Condition", icon: Split, color: "#F59E0B", bg: "rgba(245, 158, 11, 0.15)" },
    ],
  },
  {
    id: "integration",
    name: "Integrations",
    items: [
      { type: "api", label: "API Request", icon: Globe, color: "#EC4899", bg: "rgba(236, 72, 153, 0.15)" },
    ],
  },
];

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  isConsoleOpen: boolean;
  onToggleConsole: () => void;
  onDragStart: (event: React.DragEvent, nodeType: string) => void;
}

export function Sidebar({
  activeView,
  onViewChange,
  isConsoleOpen,
  onToggleConsole,
  onDragStart,
}: SidebarProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Track which categories are expanded. Default to only 'core'
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    core: true,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleCategory = (id: string) => {
    setExpandedCategories(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredCategories = nodeCategories.map(cat => ({
    ...cat,
    items: cat.items.filter(item => 
      item.label.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(cat => cat.items.length > 0);

  // If searching, force expand all categories that have matches
  const isSearching = searchQuery.length > 0;

  return (
    <aside className="w-[220px] shrink-0 flex flex-col h-full bg-sidebar text-sidebar-foreground border-r border-sidebar-border/50 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 h-16 shrink-0 border-b border-sidebar-border/50">
        <div className="rounded-xl bg-gold p-1.5 shadow-sm">
          <Blocks className="h-5 w-5 text-gold-foreground" />
        </div>
        <span className="text-[15px] font-bold tracking-tight text-white drop-shadow-sm">
          AgentForge
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1 px-3 pt-4 overflow-y-auto custom-scrollbar">
        {/* General Section */}
        <p className="text-[10px] uppercase tracking-[0.15em] text-sidebar-foreground/40 font-bold px-2 pb-2">
          Workspace
        </p>

        <SidebarItem
          icon={LayoutGrid}
          label="Canvas"
          active={activeView === "canvas"}
          onClick={() => onViewChange("canvas")}
        />
        <SidebarItem
          icon={History}
          label="History"
          active={activeView === "history"}
          onClick={() => onViewChange("history")}
          badge="Soon"
        />

        <div className="h-px bg-sidebar-border/50 mx-2 my-4" />

        {/* Nodes Section */}
        <div className="flex flex-col gap-2 mb-2">
          <div className="flex items-center justify-between px-2">
            <p className="text-[10px] uppercase tracking-[0.15em] text-sidebar-foreground/40 font-bold">
              Nodes
            </p>
          </div>
          
          <div className="px-2 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-sidebar-foreground/40 group-focus-within:text-sidebar-foreground/80 transition-colors" />
            <input
              type="text"
              placeholder="Search nodes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-8 pr-3 rounded-lg bg-sidebar-accent/30 border border-sidebar-border/50 
                text-xs text-sidebar-foreground placeholder:text-sidebar-foreground/40
                focus:outline-none focus:ring-1 focus:ring-sidebar-foreground/20 focus:bg-sidebar-accent/50 transition-all"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1 pb-4">
          {filteredCategories.map((category) => {
            const isExpanded = isSearching || expandedCategories[category.id];
            
            return (
              <div key={category.id} className="flex flex-col gap-0.5">
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="flex items-center justify-between px-2 py-1.5 rounded-lg
                    text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/40
                    transition-colors group"
                >
                  <span className="text-xs font-semibold">{category.name}</span>
                  {isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100" />
                  )}
                </button>
                
                <div className={`flex flex-col gap-0.5 overflow-hidden transition-all duration-200 ${isExpanded ? 'opacity-100 max-h-[500px] mt-0.5' : 'opacity-0 max-h-0'}`}>
                  {category.items.map((item) => (
                    <div
                      key={item.type}
                      draggable
                      onDragStart={(e) => onDragStart(e, item.type)}
                      className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl cursor-grab active:cursor-grabbing
                        text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent hover:shadow-sm
                        transition-all duration-150 group select-none ml-1"
                    >
                      <div
                        className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-transform duration-150 group-hover:scale-110 shadow-sm"
                        style={{ backgroundColor: item.bg }}
                      >
                        <item.icon className="h-3 w-3" style={{ color: item.color }} />
                      </div>
                      <span className="text-[12px] font-medium flex-1">{item.label}</span>
                      <Blocks className="h-3 w-3 opacity-0 group-hover:opacity-20 transition-opacity" />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          
          {filteredCategories.length === 0 && (
            <div className="px-3 py-4 text-center">
              <p className="text-xs text-sidebar-foreground/40">No nodes found</p>
            </div>
          )}
        </div>

        <div className="h-px bg-sidebar-border/50 mx-2 mb-4" />

        {/* Tools Section */}
        <p className="text-[10px] uppercase tracking-[0.15em] text-sidebar-foreground/40 font-bold px-2 pb-2">
          Tools
        </p>

        <SidebarItem
          icon={Terminal}
          label="Console"
          active={isConsoleOpen}
          onClick={onToggleConsole}
        />
        <SidebarItem
          icon={Settings}
          label="Settings"
          active={false}
          onClick={() => {}}
          badge="Soon"
        />
      </nav>

      {/* Bottom: Theme Toggle */}
      <div className="px-3 pb-4 pt-3 border-t border-sidebar-border/50 bg-sidebar">
        {mounted && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl w-full
              text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent hover:shadow-sm
              transition-all duration-150"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4 text-yellow-500/80" />
            ) : (
              <Moon className="h-4 w-4 text-blue-500/80" />
            )}
            <span className="text-[13px] font-medium">
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </span>
          </button>
        )}
      </div>
    </aside>
  );
}

function SidebarItem({
  icon: Icon,
  label,
  active,
  onClick,
  badge,
}: {
  icon: React.ElementType;
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl w-full text-left transition-all duration-150
        ${
          active
            ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm ring-1 ring-sidebar-border/50"
            : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
        }`}
    >
      <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-sidebar-accent-foreground' : 'opacity-70'}`} />
      <span className="text-[13px] font-medium flex-1">{label}</span>
      {badge && (
        <span className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-full bg-sidebar-foreground/10 text-sidebar-foreground/50">
          {badge}
        </span>
      )}
    </button>
  );
}
