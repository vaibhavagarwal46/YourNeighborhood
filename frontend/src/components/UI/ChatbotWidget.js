// frontend/src/components/UI/ChatbotWidget.js
import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import '../../styles/glassmorphism.css';

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'model', text: 'Hi! I am your guide. How can I help you navigate YourNeighborhood today?' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || isTyping) return;

    const userText = inputText.trim();
    setInputText('');
    
    // Add user message to UI immediately
    const newMessages = [...messages, { role: 'user', text: userText }];
    setMessages(newMessages);
    setIsTyping(true);

    try {
      // Format history exactly how the Gemini API expects it: { role: 'user'/'model', parts: [{ text: '...' }] }
      const formattedHistory = messages.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      }));

      // Send to backend
      const response = await axios.post('http://127.0.0.1:5000/api/chatbot', {
        message: userText,
        history: formattedHistory
      });

      // Add AI reply to UI
      setMessages([...newMessages, { role: 'model', text: response.data.reply }]);
    } catch (error) {
      setMessages([...newMessages, { role: 'model', text: "Sorry, my connection to the network dropped. Try again!" }]);
    }
    
    setIsTyping(false);
  };

  return (
    <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999 }}>
      
      {/* The Chat Window */}
      {isOpen && (
        <div className="glass-card" style={{ 
          width: '350px', height: '500px', marginBottom: '1rem', 
          display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
        }}>
          {/* Header */}
          <div style={{ 
            background: 'linear-gradient(90deg, #7c3aed, #00c896)', 
            padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' 
          }}>
            <strong style={{ color: 'white', fontSize: '1.1rem' }}>🤵 Neighborhood Guide</strong>
            <button 
              onClick={() => setIsOpen(false)}
              style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.2rem' }}
            >
              ✕
            </button>
          </div>

          {/* Message Stream */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {messages.map((msg, idx) => {
              const isUser = msg.role === 'user';
              return (
                <div key={idx} style={{ alignSelf: isUser ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                  <div style={{ 
                    background: isUser ? '#00c896' : 'rgba(255,255,255,0.1)', 
                    color: isUser ? '#050816' : '#fff',
                    padding: '0.8rem 1rem', borderRadius: '16px',
                    borderBottomRightRadius: isUser ? '4px' : '16px', borderBottomLeftRadius: !isUser ? '4px' : '16px',
                    fontSize: '0.95rem', lineHeight: '1.4'
                  }}>
                    {msg.text}
                  </div>
                </div>
              );
            })}
            {isTyping && (
              <div style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.1)', padding: '0.8rem', borderRadius: '16px', color: '#a0aec0', fontSize: '0.85rem' }}>
                Shakti is thinking...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)' }}>
            <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.5rem', margin: 0 }}>
              <input 
                type="text" 
                className="custom-input" 
                placeholder="Ask me anything..." 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                style={{ flex: 1, padding: '0.75rem', margin: 0 }}
              />
              <button type="submit" className="primary-btn" style={{ margin: 0, padding: '0 1rem', width: 'auto' }}>
                ➤
              </button>
            </form>
          </div>
        </div>
      )}

      {/* The Floating Toggle Button */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          style={{
            width: '60px', height: '60px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #7c3aed, #00c896)',
            border: 'none', color: 'white', fontSize: '1.8rem',
            cursor: 'pointer', boxShadow: '0 10px 20px rgba(0,0,0,0.4)',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            transition: 'transform 0.2s'
          }}
          onMouseOver={(e) => e.target.style.transform = 'scale(1.1)'}
          onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
        >
          🤵
        </button>
      )}
    </div>
  );
}