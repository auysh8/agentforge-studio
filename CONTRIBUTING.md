# Contributing to AgentForge Studio 🛠️

First off, thank you for considering contributing to **AgentForge Studio**! It's open-source projects like this that make the developer community such an awesome place to build.

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:
- **Node.js**: `v18.x` or higher
- **npm**: `v9.x` or higher (or `pnpm` / `yarn`)
- **Git**

### Local Development Setup

1. **Fork the Repository**: Click the "Fork" button at the top right of the GitHub page.
2. **Clone your fork**:
   ```bash
   git clone https://github.com/YOUR-USERNAME/agentforge-studio.git
   cd agentforge-studio
   ```
3. **Install Dependencies**:
   ```bash
   npm install
   ```
4. **Start Dev Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧩 Project Architecture Overview

AgentForge Studio is built on Next.js 15+ (App Router), TypeScript, `@xyflow/react` (React Flow v12), and Zustand.

- **`src/app/`**: Next.js App Router pages and `/api/execute` endpoint.
- **`src/components/flow-builder.tsx`**: Main visual node canvas using `@xyflow/react`.
- **`src/components/nodes/`**: Custom pipeline nodes (Trigger, Prompt, LLM, Condition, API).
- **`src/store/flow-store.ts`**: Zustand state management for nodes, edges, execution logs, and panel selections.

### Adding a New Node Type

1. Create your component in `src/components/nodes/your-node.tsx`.
2. Register the node type in `src/components/flow-builder.tsx` inside `nodeTypes`.
3. Update state handlers in `src/store/flow-store.ts` if your node introduces new property types.

---

## 🤝 How to Contribute

### 1. Finding an Issue
Check out open [GitHub Issues](https://github.com/auysh8/agentforge-studio/issues). Look for labels like `good first issue` or `help wanted`.

### 2. Creating a Pull Request

1. Create a descriptive feature branch:
   ```bash
   git checkout -b feature/my-cool-node
   ```
2. Make your changes and test thoroughly locally.
3. Ensure formatting and linting pass:
   ```bash
   npm run lint
   ```
4. Commit your changes using conventional commit messages:
   ```bash
   git commit -m "feat(nodes): add support for Vector Store Retrieval node"
   ```
5. Push to your branch and open a Pull Request against the `main` branch.

---

## 📜 Code of Conduct

Please help maintain a respectful, welcoming, and collaborative community environment. 

---

## ⭐️ Support

If you like AgentForge Studio, don't forget to **star the repository**! It helps the project reach more developers.
