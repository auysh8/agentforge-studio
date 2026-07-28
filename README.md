# AgentForge Studio 🛠️

A visual workflow builder and execution environment for designing, testing, and deploying custom AI agent orchestration pipelines.

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)

---

## 📸 Visual Preview

> 💡 Add a screenshot at `docs/preview.png` to display it here.
![Preview](https://placehold.co/800x420/1e1e2e/cdd6f4?text=Add+App+Screenshot)

---

## ✨ Features

- 🎨 **Visual Flow Builder**: Drag and drop node-based canvas to seamlessly map complex multi-step agent workflows.
- 🤖 **LLM & Agent Nodes**: Integrate Large Language Models into pipeline execution paths with granular parameter management.
- 🔀 **Conditional Branching**: Build decision trees with dedicated condition and logic evaluation nodes.
- 🌐 **External API Nodes**: Connect external services and HTTP endpoints directly into your workflow execution loop.
- 💻 **Live Console Output**: Monitor execution steps, real-time outputs, and system logs with an integrated console panel.
- 📦 **Workflow Exporting**: Modular export modal to export and integrate workflow configurations into external applications.

---

## 📂 Repository Structure

```
agentforge-studio/
├── public/
│   ├── file.svg
│   ├── globe.svg
│   └── window.svg
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── execute/
│   │   │       └── route.ts
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── nodes/
│   │   │   ├── api-node.tsx
│   │   │   ├── condition-node.tsx
│   │   │   ├── llm-node.tsx
│   │   │   ├── prompt-node.tsx
│   │   │   └── trigger-node.tsx
│   │   ├── ui/
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── resizable.tsx
│   │   │   └── scroll-area.tsx
│   │   ├── console-panel.tsx
│   │   ├── export-modal.tsx
│   │   ├── flow-builder.tsx
│   │   ├── properties-panel.tsx
│   │   └── sidebar.tsx
│   └── store/
│       └── flow-store.ts
├── components.json
├── next.config.ts
├── package.json
└── tsconfig.json
```

---

## 🛠️ Tech Stack

| Category | Technologies |
| :--- | :--- |
| **Framework** | Next.js (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS, PostCSS |
| **UI Components** | Radix UI / Shadcn UI |
| **State Management** | Zustand (`flow-store.ts`) |
| **Execution** | Next.js Serverless API Routes (`/api/execute`) |

---

## 🚀 Quick Start

### Prerequisites

Ensure you have the following installed on your machine:
- **Node.js**: `v18.x` or higher
- **npm**: `v9.x` or higher (or `pnpm` / `yarn`)

### Installation & Local Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/auysh8/agentforge-studio.git
   cd agentforge-studio
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   Navigate to [http://localhost:3000](http://localhost:3000) to view the application.

---

## 📖 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Launches the local development server with hot-reloading |
| `npm run build` | Compiles and builds the production application |
| `npm run start` | Runs the production build server |
| `npm run lint` | Runs ESLint to check for code formatting and quality issues |

---

## 🤝 Contributing

Contributions are welcome! Follow these steps to contribute:

1. **Fork** the repository.
2. **Create** a new feature branch (`git checkout -b feature/amazing-feature`).
3. **Commit** your changes (`git commit -m 'Add some amazing feature'`).
4. **Push** to the branch (`git push origin feature/amazing-feature`).
5. **Open** a Pull Request against the `main` branch.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
