# Phase 1: Gemini Backend Integration - Setup Guide

## ✅ What's Been Implemented

### Core Files Created:
1. **`src/gemini/client.ts`** - Gemini API client wrapper
2. **`src/gemini/state-manager.ts`** - Session persistence (save/load)
3. **`src/gemini/prompt-builder.ts`** - Build prompts with design context
4. **`src/gemini/system-prompt.ts`** - System instruction for Gemini
5. **`src/gemini/types.ts`** - TypeScript type definitions
6. **`src/gemini/http-routes.ts`** - HTTP API endpoints for chat
7. **`src/start-gemini-http.ts`** - Standalone HTTP server entry point
8. **`.env.example`** - Environment configuration template

### Updated Files:
- `package.json` - Added Gemini dependencies and new scripts

## 🚀 Getting Started

### Step 1: Install Dependencies
```bash
npm install
```

This installs:
- `@google/generative-ai` - Gemini API SDK
- `dotenv` - Environment variable management
- `uuid` - Session ID generation

### Step 2: Get Gemini API Key
1. Go to https://ai.google.dev/
2. Click "Get API key" button
3. Select or create a Google Cloud project
4. Copy the API key

### Step 3: Configure Environment
```bash
# Copy example file
cp .env.example .env

# Edit .env and add your API key
GOOGLE_GEMINI_API_KEY=your_actual_key_here
```

**⚠️ IMPORTANT: Never commit .env to git!**

### Step 4: Build TypeScript
```bash
npm run build
```

### Step 5: Run HTTP Server
```bash
# Development (watch mode)
npm run dev:gemini

# Or production
npm run start:gemini
```

Expected output:
```
🚀 Starting Gemini HTTP Server...
📍 Port: 8765
🔌 Initializing Gemini client...
✅ Gemini connection verified
💾 Initializing state manager...
🛠️  Initializing Figma tools...

╔════════════════════════════════════════╗
║  ✅ Gemini HTTP Server is Running!    ║
║  🌐 http://localhost:8765              ║
╚════════════════════════════════════════╝
```

## 📡 API Endpoints

### Health Check
```bash
curl http://localhost:8765/health
```

### Create New Session
```bash
curl -X POST http://localhost:8765/api/session/create
```

Response:
```json
{
  "sessionId": "uuid-here",
  "timestamp": "2026-02-06T..."
}
```

### Send Chat Message
```bash
curl -X POST http://localhost:8765/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "your-session-id",
    "userMessage": "Tạo button đỏ 100x40px"
  }'
```

Response:
```json
{
  "success": true,
  "sessionId": "...",
  "explanation": "Tôi đã tạo...",
  "actions": [
    {
      "tool": "createRectangle",
      "params": { "width": 100, "height": 40 }
    }
  ]
}
```

### Get Session Details
```bash
curl http://localhost:8765/api/session/your-session-id
```

### List All Sessions
```bash
curl http://localhost:8765/api/sessions
```

### Get Available Tools
```bash
curl http://localhost:8765/api/tools
```

### Test Gemini Connection
```bash
curl -X POST http://localhost:8765/api/debug/test-gemini
```

## 📂 Data Storage

Sessions are saved as JSON files:
```
data/
└── sessions/
    ├── session-id-1.json
    ├── session-id-2.json
    └── ...
```

Each session file contains:
```json
{
  "sessionId": "uuid",
  "timestamp": "2026-02-06T...",
  "designState": {
    "frames": [],
    "nodes": [],
    "styles": {}
  },
  "conversationHistory": [
    {
      "role": "user",
      "content": "User message",
      "timestamp": "..."
    },
    {
      "role": "assistant",
      "content": "Assistant response",
      "actions": [...]
    }
  ]
}
```

## 🧪 Testing

### Basic Test Flow
```bash
# 1. Create session
SESSION_ID=$(curl -s -X POST http://localhost:8765/api/session/create | jq -r '.sessionId')
echo "Created session: $SESSION_ID"

# 2. Send a design request
curl -X POST http://localhost:8765/api/chat \
  -H "Content-Type: application/json" \
  -d "{
    \"sessionId\": \"$SESSION_ID\",
    \"userMessage\": \"Create a login button\"
  }"

# 3. Check session
curl http://localhost:8765/api/session/$SESSION_ID

# 4. List all sessions
curl http://localhost:8765/api/sessions
```

### Manual Testing with curl
```bash
# Test health
curl http://localhost:8765/health | jq

# Create session and save ID
SESSION_ID=$(curl -s -X POST http://localhost:8765/api/session/create | jq -r '.sessionId')

# Send chat request
curl -X POST http://localhost:8765/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "'$SESSION_ID'",
    "userMessage": "Tạo frame 800x600px"
  }' | jq
```

## ⚙️ Configuration

### Environment Variables
```bash
# Required
GOOGLE_GEMINI_API_KEY=your_key_here

# Optional (with defaults)
NODE_ENV=development           # development | production
HTTP_PORT=8765                 # Server port
WEB_PORT=3000                  # Frontend port (for Phase 2)
DATA_DIR=./data                # Session data directory
GEMINI_MODEL=gemini-2.0-flash  # gemini-2.0-flash | gemini-1.5-flash
LOG_LEVEL=info                 # error | warn | info | debug
SESSION_TIMEOUT_DAYS=7         # Auto-cleanup old sessions
MAX_HISTORY_MESSAGES=20        # Max messages kept in memory
```

### Customize Port
```bash
# In .env
HTTP_PORT=9000

# Then restart
npm run dev:gemini
# Server will run on http://localhost:9000
```

## 🐛 Troubleshooting

### "GOOGLE_GEMINI_API_KEY is not set"
```bash
# Copy .env.example and add your key
cp .env.example .env
# Edit .env with your actual API key
```

### "Port already in use"
```bash
# Find and kill process using port 8765
# On Windows:
netstat -ano | findstr :8765
taskkill /PID <PID> /F

# On Mac/Linux:
lsof -i :8765
kill -9 <PID>
```

### "Failed to connect to Gemini API"
- Check your API key is correct
- Check internet connection
- Verify API key hasn't expired
- Check https://status.ai.google.dev/ for service status

### "Sessions not persisting"
- Check `data/` directory exists
- Check disk space
- Check file permissions on `data/` folder

## 📊 Gemini API Limits (Free Tier)

- **Rate**: 1,500 requests per day
- **Tokens**: 1,000,000 tokens per minute
- **Context**: Up to 1,000,000 token context window
- **Cost**: $0.00

These limits are **generous** for development and small-scale use.

## 🔄 Workflow

```
User Input
    ↓
POST /api/chat {sessionId, userMessage}
    ↓
StateManager: Load session
    ↓
PromptBuilder: Build prompt with context
    ↓
GeminiClient: Call Gemini API
    ↓
Parse response: Extract actions
    ↓
FigmaTools: Execute actions (create shapes, etc.)
    ↓
StateManager: Save response to session
    ↓
Return: Actions + Explanations
    ↓
Client displays results
```

## 📝 Next Steps (Phase 2)

After Phase 1 is working:
1. Build React Web UI (`web/src/`)
2. Create chat interface
3. Add design preview
4. Connect to this backend

## 💡 Key Files to Know

- **Main entry**: `src/start-gemini-http.ts`
- **Gemini client**: `src/gemini/client.ts`
- **State management**: `src/gemini/state-manager.ts`
- **API routes**: `src/gemini/http-routes.ts`
- **Type definitions**: `src/gemini/types.ts`
- **System prompt**: `src/gemini/system-prompt.ts`

## ✨ Features Implemented

✅ Gemini API integration
✅ Session management (create, load, save)
✅ Conversation history tracking
✅ Design state persistence
✅ Tool execution pipeline
✅ Prompt building with context
✅ REST API endpoints
✅ Error handling
✅ Type-safe with TypeScript
✅ Environment configuration

## 🎯 What's Working

1. **Create sessions** - Each conversation gets a unique session ID
2. **Send messages** - Users can send design requests
3. **Gemini responses** - Model generates design actions
4. **Persist state** - Everything saved to disk automatically
5. **Execute actions** - Tools can be executed to modify Figma

## 🚫 Known Limitations

- No web UI yet (Phase 2)
- No Electron desktop app yet (Phase 3)
- Session history limited to last 20 messages (to keep files small)
- No authentication (not needed for local dev)

---

**Status**: ✅ Phase 1 Complete - Ready for testing!
**Next**: Phase 2 - Build React Web UI
**Timeline**: 3-4 hours for Phase 2
