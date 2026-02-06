# Electron + React Full App Build Plan

## Overview

Build a standalone Electron desktop app with embedded React UI.

**Architecture:**
```
┌─────────────────────────────┐
│   Electron Main Process     │
│  - Start Gemini HTTP Server │
│  - Manage IPC to Renderer   │
└──────────────┬──────────────┘
               │
               ├─► Renderer Process (React App)
               │   ├── ChatBox
               │   ├── DesignPreview
               │   └── ActionLog
               │
               └─► Backend (HTTP Server on port 8765)
                   ├── Gemini API
                   ├── Session Manager
                   └── Figma Tools
```

**Timeline:** 4-5 hours

---

## Phase 1: Setup Electron Foundation (1 hour)

### 1.1 Create Electron Structure
```
electron/
├── main.ts              Main process (start server, create window)
├── preload.ts           IPC bridge (secure)
├── env.d.ts             TypeScript definitions
└── package.json         Electron config
```

### 1.2 Install Dependencies
```bash
npm install electron electron-builder concurrently
npm install --save-dev @electron-forge/cli @types/electron
```

### 1.3 Configure electron/main.ts
```typescript
import { app, BrowserWindow } from 'electron';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import isDev from 'electron-is-dev';

let mainWindow: BrowserWindow | null = null;
let geminiServer: ChildProcess | null = null;

const startGeminiServer = async (): Promise<void> => {
  return new Promise((resolve) => {
    geminiServer = spawn('node', [
      path.join(__dirname, '../dist/start-gemini-http.js')
    ], {
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'production' }
    });

    // Wait for server startup
    setTimeout(resolve, 2000);
  });
};

const createWindow = (): void => {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false
    },
    icon: path.join(__dirname, '../public/icon.png')
  });

  const startUrl = isDev
    ? 'http://localhost:5173'
    : `file://${path.join(__dirname, '../dist-web/index.html')}`;

  mainWindow.loadURL(startUrl);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
};

app.on('ready', async () => {
  await startGeminiServer();
  createWindow();
});

app.on('window-all-closed', () => {
  if (geminiServer) {
    geminiServer.kill();
  }
  app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
```

### 1.4 Configure electron/preload.ts
```typescript
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  // IPC methods for future use
  invoke: (channel: string, ...args: any[]) => 
    ipcRenderer.invoke(channel, ...args),
  on: (channel: string, listener: any) => 
    ipcRenderer.on(channel, listener)
});
```

---

## Phase 2: Setup React Frontend (1.5 hours)

### 2.1 Create React Project
```bash
npm create vite@latest web -- --template react-ts
cd web
npm install axios zustand
```

### 2.2 Structure
```
web/
├── src/
│   ├── components/
│   │   ├── ChatBox.tsx         (Message input + history)
│   │   ├── DesignPreview.tsx   (Show design state)
│   │   ├── ActionLog.tsx       (Show executed actions)
│   │   ├── SessionList.tsx     (Manage sessions)
│   │   └── SetupModal.tsx      (API key setup)
│   ├── hooks/
│   │   ├── useSession.ts       (Session management)
│   │   └── useApi.ts           (API calls)
│   ├── styles/
│   │   ├── globals.css
│   │   ├── ChatBox.css
│   │   └── Layout.css
│   ├── App.tsx                 (Main app)
│   └── main.tsx
├── vite.config.ts
└── package.json
```

### 2.3 Create App.tsx
```typescript
import { useEffect, useState } from 'react';
import ChatBox from './components/ChatBox';
import DesignPreview from './components/DesignPreview';
import ActionLog from './components/ActionLog';
import SetupModal from './components/SetupModal';
import { useSession } from './hooks/useSession';
import './App.css';

export default function App() {
  const { 
    sessionId, 
    messages, 
    loading, 
    sendMessage, 
    createSession 
  } = useSession();
  
  const [showSetup, setShowSetup] = useState(!sessionId);

  useEffect(() => {
    if (!sessionId) {
      createSession();
    }
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎨 Figma Design Assistant</h1>
        <p>Design with Gemini AI</p>
      </header>

      {showSetup && (
        <SetupModal onClose={() => setShowSetup(false)} />
      )}

      <main className="app-main">
        <div className="chat-section">
          <ChatBox 
            messages={messages}
            loading={loading}
            onSend={sendMessage}
          />
        </div>

        <div className="preview-section">
          <DesignPreview sessionId={sessionId} />
          <ActionLog 
            actions={messages[messages.length - 1]?.actions}
          />
        </div>
      </main>

      <footer>
        Session: {sessionId?.substring(0, 8)}...
      </footer>
    </div>
  );
}
```

### 2.4 Create hooks/useSession.ts
```typescript
import { useState, useCallback } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:8765';

export function useSession() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const createSession = useCallback(async () => {
    try {
      const res = await axios.post(`${API_BASE}/api/session/create`);
      setSessionId(res.data.sessionId);
    } catch (error) {
      console.error('Failed to create session', error);
    }
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!sessionId) return;
    
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/api/chat`, {
        sessionId,
        userMessage: text
      });

      setMessages(prev => [
        ...prev,
        { role: 'user', content: text },
        { 
          role: 'assistant', 
          content: res.data.explanation,
          actions: res.data.actions
        }
      ]);
    } catch (error) {
      console.error('Failed to send message', error);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  return { sessionId, messages, loading, sendMessage, createSession };
}
```

### 2.5 Create components/ChatBox.tsx
```typescript
import { useState } from 'react';
import '../styles/ChatBox.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Props {
  messages: Message[];
  loading: boolean;
  onSend: (text: string) => void;
}

export default function ChatBox({ messages, loading, onSend }: Props) {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim()) {
      onSend(input);
      setInput('');
    }
  };

  return (
    <div className="chatbox">
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={`message message-${msg.role}`}>
            <strong>{msg.role === 'user' ? 'You' : 'Assistant'}</strong>
            <p>{msg.content}</p>
          </div>
        ))}
        {loading && <div className="message-loading">Thinking...</div>}
      </div>

      <div className="input-area">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Describe your design..."
          disabled={loading}
        />
        <button 
          onClick={handleSend} 
          disabled={loading || !input.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
}
```

### 2.6 Create components/DesignPreview.tsx
```typescript
interface Props {
  sessionId: string | null;
}

export default function DesignPreview({ sessionId }: Props) {
  if (!sessionId) return <div>Loading...</div>;

  return (
    <div className="design-preview">
      <h3>Design State</h3>
      <iframe 
        title="Figma Preview"
        src="http://localhost:8765/figma/ping"
        style={{ width: '100%', height: '100%', border: 'none' }}
      />
    </div>
  );
}
```

---

## Phase 3: Build & Package Configuration (1 hour)

### 3.1 Update package.json
```json
{
  "name": "figma-design-assistant",
  "version": "1.0.0",
  "main": "dist-electron/main.js",
  "homepage": "./",
  "scripts": {
    "dev": "concurrently \"npm run dev:web\" \"npm run dev:electron\"",
    "dev:web": "vite --port 5173",
    "dev:electron": "wait-on http://localhost:5173 && electron .",
    "build": "npm run build:web && npm run build:electron && npm run build:app",
    "build:web": "cd web && vite build && cd ..",
    "build:electron": "tsc electron/main.ts --outDir dist-electron",
    "build:app": "electron-builder",
    "package": "npm run build"
  },
  "build": {
    "appId": "com.figma-design-assistant.app",
    "productName": "Figma Design Assistant",
    "files": [
      "dist-electron/**/*",
      "dist-web/**/*",
      "public/**/*",
      "node_modules/**/*"
    ],
    "directories": {
      "buildResources": "public"
    },
    "win": {
      "target": [
        {
          "target": "nsis",
          "arch": ["x64"]
        }
      ],
      "certificateFile": null
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true
    }
  }
}
```

### 3.2 Vite Config (web/vite.config.ts)
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: '../dist-web',
    emptyOutDir: true
  }
});
```

---

## Phase 4: Styling & Polish (1.5 hours)

### 4.1 Create Global Styles
```css
/* web/src/styles/globals.css */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  background: #f5f5f5;
  color: #333;
}

.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.app-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.app-main {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  padding: 20px;
  flex: 1;
  overflow: hidden;
}

@media (max-width: 1200px) {
  .app-main {
    grid-template-columns: 1fr;
  }
}
```

### 4.2 ChatBox Styles
```css
/* web/src/styles/ChatBox.css */
.chatbox {
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  overflow: hidden;
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message {
  padding: 12px;
  border-radius: 8px;
  max-width: 80%;
}

.message-user {
  align-self: flex-end;
  background: #667eea;
  color: white;
}

.message-assistant {
  align-self: flex-start;
  background: #f0f0f0;
  color: #333;
}

.input-area {
  display: flex;
  gap: 8px;
  padding: 16px;
  border-top: 1px solid #eee;
}

.input-area input {
  flex: 1;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
}

.input-area button {
  padding: 12px 24px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}
```

---

## Phase 5: Build & Test (1 hour)

### 5.1 Build Process
```bash
# Install all dependencies
npm install

# Build web UI
cd web && npm install && npm run build && cd ..

# Build Gemini server
npm run build

# Build Electron app
npm run build:app
```

### 5.2 Output
```
dist/
├── main.js          (Electron main process)
├── preload.js       (IPC bridge)
└── start-gemini-http.js

dist-web/
├── index.html
├── assets/
└── ...

release/
└── Figma Design Assistant Setup 1.0.0.exe
```

### 5.3 Testing
```bash
# Development (watch mode)
npm run dev

# Production build
npm run build

# Run packaged app
./release/Figma\ Design\ Assistant\ Setup\ 1.0.0.exe
```

---

## File Structure (Final)

```
MCP_Figma_design/
├── electron/
│   ├── main.ts
│   ├── preload.ts
│   ├── env.d.ts
│   └── package.json
│
├── web/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatBox.tsx
│   │   │   ├── DesignPreview.tsx
│   │   │   ├── ActionLog.tsx
│   │   │   ├── SessionList.tsx
│   │   │   └── SetupModal.tsx
│   │   ├── hooks/
│   │   │   ├── useSession.ts
│   │   │   └── useApi.ts
│   │   ├── styles/
│   │   │   ├── globals.css
│   │   │   ├── ChatBox.css
│   │   │   └── Layout.css
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── vite.config.ts
│   └── package.json
│
├── src/
│   ├── gemini/          (existing)
│   ├── tools/           (existing)
│   └── start-gemini-http.ts  (existing)
│
├── public/
│   └── icon.png         (App icon)
│
├── package.json         (Root - Electron config)
├── tsconfig.json
└── ELECTRON_BUILD_PLAN.md
```

---

## Deliverable

✅ Standalone `.exe` installer
✅ Auto-starts HTTP server
✅ Embedded React UI
✅ Full chat functionality
✅ Design preview
✅ No external dependencies needed

---

## Timeline

| Phase | Duration | Status |
|-------|----------|--------|
| 1. Electron Setup | 1h | ⏳ TODO |
| 2. React Frontend | 1.5h | ⏳ TODO |
| 3. Build Config | 1h | ⏳ TODO |
| 4. Styling | 1.5h | ⏳ TODO |
| 5. Build & Test | 1h | ⏳ TODO |
| **TOTAL** | **~5h** | ⏳ IN PROGRESS |

---

**Next**: Start Phase 1 - Electron Foundation
