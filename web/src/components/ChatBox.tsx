import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

interface ChatBoxProps {
  messages: Message[];
  loading: boolean;
  onSend: (text: string) => void;
  disabled?: boolean;
}

export default function ChatBox({ messages, loading, onSend, disabled }: ChatBoxProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (input.trim() && !disabled && !loading) {
      onSend(input);
      setInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chatbox">
      <div className="chatbox-header">
        <h2>Chat</h2>
      </div>

      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-state">
            <p>👋 Welcome to Figma Design Assistant!</p>
            <p>Describe your design and I'll help you create it.</p>
            <p className="hint">Try: "Create a login button that's 120x40px and blue"</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className={`message message-${msg.role}`}>
              <div className="message-header">
                <strong>{msg.role === 'user' ? 'You' : 'AI Assistant'}</strong>
                {msg.timestamp && (
                  <span className="timestamp">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                )}
              </div>
              <div className="message-content">
                {msg.content}
              </div>
            </div>
          ))
        )}

        {loading && (
          <div className="message message-loading">
            <div className="loading-spinner"></div>
            <span>Thinking...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="input-area">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Describe your design... (Shift+Enter for new line)"
          disabled={disabled || loading}
          rows={2}
        />
        <button 
          onClick={handleSend} 
          disabled={disabled || loading || !input.trim()}
          className="send-btn"
        >
          {loading ? '⏳' : '➤'}
        </button>
      </div>
    </div>
  );
}
