import { useEffect, useState } from 'react';
import axios from 'axios';
import ChatBox from './components/ChatBox';
import './App.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  actions?: any[];
}

const API_BASE = 'http://localhost:8765';

function App() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create session on mount
  useEffect(() => {
    const initSession = async () => {
      try {
        const res = await axios.post(`${API_BASE}/api/session/create`);
        setSessionId(res.data.sessionId);
        setError(null);
      } catch (err) {
        console.error('Failed to create session:', err);
        setError('Failed to connect to server. Make sure it\'s running on port 8765.');
      }
    };

    initSession();
  }, []);

  const handleSendMessage = async (text: string) => {
    if (!sessionId || !text.trim()) return;

    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);
    setError(null);

    try {
      const res = await axios.post(`${API_BASE}/api/chat`, {
        sessionId,
        userMessage: text
      });

      if (res.data.success) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: res.data.explanation,
          timestamp: new Date().toISOString(),
          actions: res.data.actions
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        setError(res.data.error || 'Failed to process request');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Unknown error';
      setError(errorMessage);
      console.error('Error sending message:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎨 Figma Design Assistant</h1>
        <p>Design with Gemini AI</p>
        {sessionId && <span className="status">✓ Connected</span>}
      </header>

      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <main className="app-main">
        <ChatBox 
          messages={messages}
          loading={loading}
          onSend={handleSendMessage}
          disabled={!sessionId || loading}
        />
      </main>
    </div>
  );
}

export default App;
