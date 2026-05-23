// frontend/src/pages/Inbox.js
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import io from 'socket.io-client';
import Navbar from '../components/UI/Navbar';
import FloatingCity from '../components/3D/FloatingCity';
import '../styles/glassmorphism.css';

const socket = io("http://127.0.0.1:5000");

export default function Inbox() {
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const [chatList, setChatList] = useState([]); 
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  
  const [activeChat, setActiveChat] = useState(''); // Stores email internally for backend requests
  const [activeChatName, setActiveChatName] = useState(''); // Displays Name in UI
  const [activeChatAvatar, setActiveChatAvatar] = useState('');
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();
  const messagesEndRef = useRef(null);
  const activeChatRef = useRef(activeChat);

  useEffect(() => { activeChatRef.current = activeChat; }, [activeChat]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  useEffect(() => {
    if (location.state?.targetEmail) {
      openChat(location.state.targetEmail, location.state.targetAvatar, location.state.targetName);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const fetchChats = async (token) => {
    try {
      const response = await axios.get('http://127.0.0.1:5000/api/chats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChatList(response.data);
    } catch (error) { console.error("Error fetching chat list", error); }
  };

  useEffect(() => {
    const initInbox = async () => {
      const token = localStorage.getItem('token');
      if (!token) { navigate('/'); return; }
      try {
        const response = await axios.get('http://127.0.0.1:5000/api/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCurrentUserEmail(response.data.email);
        socket.emit("join", { email: response.data.email });
        fetchChats(token); 
      } catch (error) { if (error.response?.status === 401) navigate('/'); }
    };
    initInbox();

    socket.on("receive_message", (data) => {
      const token = localStorage.getItem('token');
      const formattedData = { ...data, timestamp: new Date().toLocaleString() };
      if (data.sender === activeChatRef.current || data.receiver === activeChatRef.current) {
        setMessages((prev) => [...prev, formattedData]);
      }
      fetchChats(token); 
    });

    return () => { socket.off("receive_message"); };
  }, [navigate]);

  const handleSearch = async (e) => {
    setSearchQuery(e.target.value);
    if (e.target.value.length < 2) { setSearchResults([]); return; }
    
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get(`http://127.0.0.1:5000/api/users/search?q=${e.target.value}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSearchResults(response.data);
    } catch (error) { console.error("Search error", error); }
  };

  const openChat = async (email, avatar = "", name = "Neighbor") => {
    setActiveChat(email);
    setActiveChatAvatar(avatar);
    setActiveChatName(name);
    setSearchResults([]); 
    setSearchQuery('');
    
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get(`http://127.0.0.1:5000/api/messages/${email}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(response.data);
    } catch (error) { console.error("Error fetching chat history", error); }
  };

  const handleDeleteChat = async (e, email) => {
    e.stopPropagation();
    if (!window.confirm("Delete this chat history?")) return;
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`http://127.0.0.1:5000/api/messages/${email}`, { headers: { Authorization: `Bearer ${token}` } });
      if (activeChat === email) { setActiveChat(''); setActiveChatAvatar(''); setActiveChatName(''); setMessages([]); }
      fetchChats(token);
    } catch (error) { console.error("Error deleting chat", error); }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;
    socket.emit("send_message", { sender: currentUserEmail, receiver: activeChat, text: newMessage });
    
    setMessages(prev => [...prev, {
      sender: currentUserEmail,
      receiver: activeChat,
      text: newMessage,
      timestamp: 'Just now'
    }]);
    
    setNewMessage('');
  };

  return (
    <div className="page-container" style={{ flexDirection: 'column', alignItems: 'center', padding: '0 2rem 4rem 0' }}>
      <FloatingCity />
      
      <div style={{ zIndex: 2, width: '100%', maxWidth: '1100px', padding: '0 2rem', margin: '0 auto' }}>
        <Navbar />
        
        <div style={{ display: 'flex', gap: '2rem', height: '600px', marginTop: '2rem' }}>
          
          <div className="glass-card" style={{ flex: '0 0 350px', padding: '1.5rem', display: 'flex', flexDirection: 'column', overflowY: 'visible', position: 'relative' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', marginTop: 0 }}>Messages</h2>
            
            <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
              <input 
                type="text" className="custom-input" placeholder="Search name, city, state..." 
                value={searchQuery} onChange={handleSearch} 
                style={{ padding: '0.75rem', width: '100%', boxSizing: 'border-box' }} 
              />
              {searchResults.length > 0 && (
                <div style={{ position: 'absolute', top: '110%', left: 0, width: '100%', background: '#050816', border: '1px solid #00c896', borderRadius: '8px', zIndex: 10, maxHeight: '200px', overflowY: 'auto' }}>
                  {searchResults.map(user => (
                    <div key={user.email} onClick={() => openChat(user.email, user.avatar, user.name)} style={{ padding: '0.8rem', cursor: 'pointer', borderBottom: '1px solid #333' }}>
                      <div style={{ color: '#fff', fontWeight: 'bold' }}>{user.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#00c896' }}>{user.city}, {user.country}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
              {chatList.length === 0 ? (
                <p style={{ color: '#a0aec0', fontSize: '0.9rem', textAlign: 'center' }}>No recent chats.</p>
              ) : (
                chatList.map((chat, idx) => (
                  <div key={idx} onClick={() => openChat(chat.email, chat.avatar, chat.name)} style={{ padding: '1rem', background: activeChat === chat.email ? 'rgba(0, 200, 150, 0.1)' : 'rgba(255,255,255,0.03)', border: activeChat === chat.email ? '1px solid #00c896' : '1px solid transparent', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: '#00c896', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', color: '#050816', fontWeight: 'bold', fontSize: '1.2rem', flexShrink: 0 }}>
                      {chat.avatar ? <img src={chat.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : chat.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ fontWeight: '600', color: '#fff', fontSize: '0.95rem' }}>{chat.name}</div>
                      <div style={{ color: '#a0aec0', fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{chat.last_message}</div>
                    </div>
                    <button onClick={(e) => handleDeleteChat(e, chat.email)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}>✕</button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="glass-card" style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column' }}>
            {!activeChat ? (
              <div style={{ margin: 'auto', textAlign: 'center', color: '#a0aec0' }}>Select a chat to start messaging.</div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#00c896', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', color: '#050816', fontWeight: 'bold', flexShrink: 0 }}>
                    {activeChatAvatar ? <img src={activeChatAvatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : activeChatName.charAt(0).toUpperCase()}
                  </div>
                  <h3 style={{ margin: 0, color: '#00c896' }}>{activeChatName}</h3>
                </div>
                
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '1rem', marginBottom: '1.5rem' }}>
                  {messages.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#a0aec0', margin: 'auto' }}>No messages yet. Say hello!</p>
                  ) : (
                    messages.map((msg, idx) => {
                      const isMe = msg.sender === currentUserEmail;
                      return (
                        <div key={idx} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
                          <div style={{ background: isMe ? '#00c896' : 'rgba(255,255,255,0.1)', color: isMe ? '#050816' : '#fff', padding: '1rem', borderRadius: '16px', borderBottomRightRadius: isMe ? '4px' : '16px', borderBottomLeftRadius: !isMe ? '4px' : '16px', fontWeight: '500' }}>
                            {msg.text}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#718096', marginTop: '0.3rem', textAlign: isMe ? 'right' : 'left' }}>{msg.timestamp}</div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <form onSubmit={sendMessage} style={{ display: 'flex', gap: '1rem' }}>
                  <input type="text" className="custom-input" placeholder="Type a message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} style={{ flex: 1 }} />
                  <button type="submit" className="primary-btn" style={{ width: 'auto', marginTop: 0, padding: '0 2rem' }}>Send</button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}