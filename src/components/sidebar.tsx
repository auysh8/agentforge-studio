"use client";

import React from "react";
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
} from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const nodeItems = [
  {
    type: "trigger",
    label: "Trigger",
    icon: Play,
    color: "#22C55E",
    bg: "rgba(34, 197, 94, 0.15)",
  },
  {
    type: "llm",
    label: "LLM Node",
    icon: Brain,
    color: "#A855F7",
    bg: "rgba(168, 85, 247, 0.15)",
  },
  {
    type: "prompt",
    label: "Prompt",
    icon: MessageSquare,
    color: "#3B82F6",
    bg: "rgba(59, 130, 246, 0.15)",
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

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <aside className="w-[220px] shrink-0 flex flex-col h-full bg-sidebar text-sidebar-foreground">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 h-16 shrink-0">
        <div className="rounded-xl bg-gold p-1.5">
          <Blocks className="h-5 w-5 text-gold-foreground" />
        </div>
        <span className="text-[15px] font-bold tracking-tight text-white">
          AgentForge
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1 px-3 pt-2 overflow-y-auto">
        {/* General Section */}
        <p className="text-[10px] uppercase tracking-[0.12em] text-sidebar-foreground/40 font-semibold px-2 pt-3 pb-1.5">
          General
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

        {/* Nodes Section */}
        <p className="text-[10px] uppercase tracking-[0.12em] text-sidebar-foreground/40 font-semibold px-2 pt-5 pb-1.5">
          Nodes
        </p>

        {nodeItems.map((item) => (
          <div
            key={item.type}
            draggable
            onDragStart={(e) => onDragStart(e, item.type)}
            className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl cursor-grab active:cursor-grabbing
              text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent
              transition-all duration-150 group select-none"
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-150 group-hover:scale-110"
              style={{ backgroundColor: item.bg }}
            >
              <item.icon className="h-3.5 w-3.5" style={{ color: item.color }} />
            </div>
            <span className="text-[13px] font-medium flex-1">{item.label}</span>
            <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-40 transition-opacity" />
          </div>
        ))}

        {/* Tools Section */}
        <p className="text-[10px] uppercase tracking-[0.12em] text-sidebar-foreground/40 font-semibold px-2 pt-5 pb-1.5">
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
      <div className="px-3 pb-4 pt-2 border-t border-sidebar-border">
        {mounted && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl w-full
              text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent
              transition-all duration-150"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
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
      className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl w-full text-left transition-all duration-150
        ${
          active
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
        }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="text-[13px] font-medium flex-1">{label}</span>
      {badge && (
        <span className="text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded-full bg-sidebar-foreground/10 text-sidebar-foreground/40">
          {badge}
        </span>
      )}
    </button>
  );
}
