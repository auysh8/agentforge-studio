export type NodeFamily = "trigger" | "ai" | "logic" | "integration" | "data" | "output";

export interface FamilyColors {
  accent: string;
  iconBg: string;
  iconColor: string;
  tagBg: string;
  tagText: string;
}

export const NODE_FAMILY_TOKENS: Record<NodeFamily, { light: FamilyColors; dark: FamilyColors }> = {
  trigger: {
    light: { iconBg: "#EAF3DE", iconColor: "#27500A", tagBg: "#EAF3DE", tagText: "#27500A", accent: "#3B6D11" },
    dark:  { iconBg: "#1E3610", iconColor: "#8FD65C", tagBg: "#1E3610", tagText: "#8FD65C", accent: "#6BAF35" },
  },
  ai: {
    light: { iconBg: "#EEEDFE", iconColor: "#3C3489", tagBg: "#EEEDFE", tagText: "#3C3489", accent: "#3C3489" },
    dark:  { iconBg: "#2A2564", iconColor: "#B3A8FF", tagBg: "#2A2564", tagText: "#B3A8FF", accent: "#8B7FE8" },
  },
  logic: {
    light: { iconBg: "#FAEEDA", iconColor: "#854F0B", tagBg: "#FAEEDA", tagText: "#854F0B", accent: "#854F0B" },
    dark:  { iconBg: "#3D2A0B", iconColor: "#F0B429", tagBg: "#3D2A0B", tagText: "#F0B429", accent: "#D89B2E" },
  },
  integration: {
    light: { iconBg: "#E6F1FB", iconColor: "#0C447C", tagBg: "#E6F1FB", tagText: "#0C447C", accent: "#185FA5" },
    dark:  { iconBg: "#12294A", iconColor: "#6CB4F0", tagBg: "#12294A", tagText: "#6CB4F0", accent: "#4A93D8" },
  },
  data: {
    light: { iconBg: "#E1F5EE", iconColor: "#085041", tagBg: "#E1F5EE", tagText: "#085041", accent: "#085041" },
    dark:  { iconBg: "#0E3529", iconColor: "#5EEAB8", tagBg: "#0E3529", tagText: "#5EEAB8", accent: "#3BC895" },
  },
  output: {
    light: { iconBg: "#FAECE7", iconColor: "#712B13", tagBg: "#FAECE7", tagText: "#712B13", accent: "#712B13" },
    dark:  { iconBg: "#3A1B10", iconColor: "#F2977A", tagBg: "#3A1B10", tagText: "#F2977A", accent: "#D97E5F" },
  },
};

export const NODE_TYPE_TO_FAMILY: Record<string, NodeFamily> = {
  trigger: "trigger",
  llm: "ai",
  prompt: "ai",
  condition: "logic",
  parallel: "logic",
  join: "logic",
  foreach: "logic",
  api: "integration",
  code: "data",
  json: "data",
  output: "output",
};

export function getFamilyColors(family: NodeFamily, isDark: boolean): FamilyColors {
  return NODE_FAMILY_TOKENS[family][isDark ? "dark" : "light"];
}

export function getNodeTypeColors(nodeType: string, isDark: boolean): FamilyColors {
  const family = NODE_TYPE_TO_FAMILY[nodeType] || "ai";
  return getFamilyColors(family, isDark);
}
