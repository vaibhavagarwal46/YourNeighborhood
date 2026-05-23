// frontend/src/components/UI/Navbar.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import '../../styles/glassmorphism.css';

const socket = io("http://127.0.0.1:5000");

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  const fetchUnreadChatCount = async (token) => {
    try {
      const res = await axios.get('http://127.0.0.1:5000/api/chats/unread-count', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnreadChatCount(res.data.unread_count);
    } catch (err) {
      console.error("Error fetching unread counts", err);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    axios.get('http://127.0.0.1:5000/api/profile', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        socket.emit("join", { email: res.data.email });
      }).catch(console.error);

    fetchUnreadChatCount(token);

    axios.get('http://127.0.0.1:5000/api/notifications', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        setNotifications(res.data);
        setUnreadCount(res.data.filter(n => !n.is_read).length);
      }).catch(console.error);

    const handleNewNotification = (notif) => {
      setNotifications(prev => [notif, ...prev]);
      setUnreadCount(prev => prev + 1);
    };

    const handleUnreadChatUpdate = () => {
      fetchUnreadChatCount(token);
    };

    socket.on("new_notification", handleNewNotification);
    socket.on("unread_chat_update", handleUnreadChatUpdate);
    socket.on("receive_message", handleUnreadChatUpdate);

    return () => {
      socket.off("new_notification", handleNewNotification);
      socket.off("unread_chat_update", handleUnreadChatUpdate);
      socket.off("receive_message", handleUnreadChatUpdate);
    };
  }, []);

  useEffect(() => {
    if (location.pathname === '/inbox' && unreadChatCount > 0) {
      setUnreadChatCount(0);
    }
  }, [location.pathname, unreadChatCount]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const handleBellClick = () => {
    setShowNotifs(!showNotifs);
    if (!showNotifs && unreadCount > 0) {
      const token = localStorage.getItem('token');
      axios.put('http://127.0.0.1:5000/api/notifications/read', {}, { headers: { Authorization: `Bearer ${token}` } })
        .then(() => {
          setUnreadCount(0);
          setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        })
        .catch(console.error);
    }
  };

  return (
    <div className="glass-card" style={{ 
      maxWidth: '100%', margin: '2rem auto', 
      padding: '1rem 1.5rem', 
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '16px', position: 'relative',
      /* The overflowX rule has been removed from here so the dropdown can escape the container */
    }}>
      
      {/* --- LEFT SIDE: LOGO & NAVIGATION LINKS --- */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2.4rem' }}> 
        
        {/* Logo */}
        <div 
          onClick={() => navigate('/dashboard')} 
          style={{ fontWeight: '700', fontSize: '1.5rem', letterSpacing: '-0.02em', color: '#fff', cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          Your<span style={{ color: '#00c896' }}>Neighborhood</span>
        </div>
        
        {/* Navigation Links Group */}
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}> 
          
          <span onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem', color: location.pathname === '/dashboard' ? '#00c896' : '#a0aec0', transition: 'color 0.2s', whiteSpace: 'nowrap' }}>
            Dashboard
          </span>

          <span onClick={() => navigate('/feed')} style={{ cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem', color: location.pathname === '/feed' ? '#00c896' : '#a0aec0', transition: 'color 0.2s', whiteSpace: 'nowrap' }}>
            Community Feed
          </span>

          <span onClick={() => navigate('/businesses')} style={{ cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem', color: location.pathname === '/businesses' ? '#00c896' : '#a0aec0', transition: 'color 0.2s', whiteSpace: 'nowrap' }}>
            Local Directory
          </span>

          <span onClick={() => navigate('/marketplace')} style={{ cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem', color: location.pathname === '/marketplace' ? '#00c896' : '#a0aec0', transition: 'color 0.2s', whiteSpace: 'nowrap' }}>
            Marketplace
          </span>

          <span onClick={() => navigate('/community')} style={{ cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem', color: location.pathname === '/community' ? '#00c896' : '#a0aec0', transition: 'color 0.2s', whiteSpace: 'nowrap' }}>
            Discover Neighbors
          </span>

          <div style={{ position: 'relative', display: 'inline-block' }}>
            <span onClick={() => navigate('/inbox')} style={{ cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem', color: location.pathname === '/inbox' ? '#00c896' : '#a0aec0', transition: 'color 0.2s', whiteSpace: 'nowrap' }}>
              Inbox
            </span>
            {unreadChatCount > 0 && (
              <span style={{ position: 'absolute', top: '-8px', right: '-14px', background: '#ef4444', color: 'white', borderRadius: '50%', width: '16px', height: '16px', fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', border: '1.5px solid #050816' }}>
                {unreadChatCount}
              </span>
            )}
          </div>

          <span onClick={() => navigate('/profile')} style={{ cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem', color: location.pathname === '/profile' ? '#00c896' : '#a0aec0', transition: 'color 0.2s', whiteSpace: 'nowrap' }}>
            My Profile
          </span>
        </div>
      </div>

      {/* --- RIGHT SIDE: NOTIFICATIONS & LOGOUT --- */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        

        {/* Bell & Notifications */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <button onClick={handleBellClick} style={{ background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer', position: 'relative', padding: '0' }}>
            🔔
            {unreadCount > 0 && (
              <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#ef4444', color: 'white', borderRadius: '50%', width: '16px', height: '16px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', border: '2px solid #050816' }}>
                {unreadCount}
              </span>
            )}
          </button>

          {/* DROPDOWN MENU */}
          {showNotifs && (
            <div className="glass-card" style={{ background: '#060708', position: 'absolute', top: '250%', right: '-20px', width: '320px', padding: '1rem', zIndex: 99999, display: 'flex', flexDirection: 'column', gap: '0.8rem', maxHeight: '400px', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.8)' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#fff', fontSize: '1.1rem', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Activity</h4>
              {notifications.length === 0 ? (
                <p style={{ color: '#07090b', fontSize: '0.9rem', margin: '1rem 0', textAlign: 'center' }}>You're all caught up!</p>
              ) : (
                notifications.map(notif => (
                  <div key={notif.id} style={{ padding: '0.8rem 1rem', background: notif.is_read ? 'rgba(255,255,255,0.03)' : 'rgba(0,200,150,0.1)', borderRadius: '8px', borderLeft: notif.is_read ? '3px solid transparent' : '3px solid #00c896' }}>
                    <p style={{ margin: '0 0 0.4rem 0', fontSize: '0.9rem', color: '#fff', lineHeight: '1.4' }}>{notif.message}</p>
                    <span style={{ fontSize: '0.75rem', color: '#fff', fontWeight: '600' }}>{notif.created_at}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        
        <button onClick={handleLogout} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '0.35rem 0.8rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
          Log Out
        </button>
      </div>

    </div>
  );
}