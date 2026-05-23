// frontend/src/pages/Community.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/UI/Navbar';
import FloatingCity from '../components/3D/FloatingCity';
import '../styles/glassmorphism.css';

export default function Community() {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [viewingUser, setViewingUser] = useState(null); 
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers('');
    // eslint-disable-next-line
  }, []);

  const fetchUsers = async (query) => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/'); return; }
    try {
      const response = await axios.get(`http://127.0.0.1:5000/api/users/search?q=${query}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (error) {
      if (error.response?.status === 401) navigate('/');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers(searchQuery);
  };

  const openPublicProfile = async (email) => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get(`http://127.0.0.1:5000/api/users/public/${email}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // We keep the email in state for functional purposes (like blocking) but hide it from the UI
      setViewingUser({ ...response.data, email }); 
    } catch (error) {
      alert(error.response?.data?.error || "Failed to load profile.");
    }
  };

  const toggleBlockStatus = async (email) => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.post('http://127.0.0.1:5000/api/users/block', 
        { email }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setViewingUser(prev => ({ ...prev, is_blocked: response.data.is_blocked }));
      setUsers(users.map(u => u.email === email ? { ...u, is_blocked: response.data.is_blocked } : u));
      
    } catch (error) {
      alert("Failed to update block status.");
    }
  };

  return (
    <div className="page-container" style={{ flexDirection: 'column', alignItems: 'center', padding: '0 2rem 4rem 0' }}>
      <FloatingCity />

      {/* --- PUBLIC PROFILE MODAL --- */}
      {viewingUser && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-card" style={{ width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '3rem', position: 'relative' }}>
            <button onClick={() => setViewingUser(null)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>

            {/* Header / Identity (Email Removed) */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', color: '#fff', fontWeight: 'bold', fontSize: '2.5rem', marginBottom: '1rem', border: '3px solid #00c896' }}>
                {viewingUser.avatar ? <img src={viewingUser.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : viewingUser.name.charAt(0).toUpperCase()}
              </div>
              <h1 style={{ margin: '0', fontSize: '2.2rem', color: '#fff' }}>{viewingUser.name}</h1>
            </div>

            {/* Location Data */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
              <span style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '8px', color: '#e2e8f0', fontSize: '0.9rem', border: '1px solid rgba(255,255,255,0.1)' }}> {viewingUser.city}</span>
              <span style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '8px', color: '#e2e8f0', fontSize: '0.9rem', border: '1px solid rgba(255,255,255,0.1)' }}>🗺️ {viewingUser.state}</span>
              <span style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '8px', color: '#00c896', fontSize: '0.9rem', border: '1px solid rgba(0,200,150,0.2)', fontWeight: 'bold' }}>🌎 {viewingUser.country}</span>
            </div>

            {/* Action Buttons (Pass Name to Inbox) */}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '3rem' }}>
              <button 
                onClick={() => navigate('/inbox', { state: { targetEmail: viewingUser.email, targetName: viewingUser.name, targetAvatar: viewingUser.avatar } })}
                style={{ background: 'linear-gradient(90deg, #7c3aed, #00c896)', border: 'none', color: '#fff', padding: '0.8rem 2rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                💬 Message
              </button>
              <button 
                onClick={() => toggleBlockStatus(viewingUser.email)}
                style={{ background: viewingUser.is_blocked ? 'rgba(255,255,255,0.1)' : 'rgba(239, 68, 68, 0.1)', color: viewingUser.is_blocked ? '#fff' : '#ef4444', border: viewingUser.is_blocked ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(239, 68, 68, 0.3)', padding: '0.8rem 2rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                {viewingUser.is_blocked ? '🔓 Unblock' : '🚫 Block User'}
              </button>
            </div>

            {/* Recent Activity Mini-Feed */}
            <div>
              <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Recent Community Activity</h3>
              {viewingUser.is_blocked ? (
                <p style={{ color: '#ef4444', fontStyle: 'italic', textAlign: 'center', padding: '2rem 0' }}>You have blocked this user. Activity hidden.</p>
              ) : viewingUser.recent_posts.length === 0 ? (
                <p style={{ color: '#a0aec0', fontStyle: 'italic', textAlign: 'center' }}>No recent posts.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {viewingUser.recent_posts.map(post => (
                    <div key={post.id} style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px' }}>
                      <span style={{ fontSize: '0.7rem', color: '#7c3aed', fontWeight: 'bold', textTransform: 'uppercase' }}>{post.post_type}</span>
                      <p style={{ margin: '0.5rem 0', color: '#e2e8f0', fontSize: '0.95rem' }}>{post.content}</p>
                      <div style={{ fontSize: '0.75rem', color: '#718096' }}>{post.created_at}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* --- MAIN PAGE LAYOUT --- */}
      <div style={{ zIndex: 2, width: '100%', maxWidth: '1100px', padding: '0 2rem', margin: '0 auto' }}>
        <Navbar />

        <div style={{ textAlign: 'center', margin: '2rem 0 3rem 0' }}>
          <h1 style={{ fontSize: '2.8rem', color: '#fff', marginBottom: '0.5rem' }}>Neighbor Discovery</h1>
          <p style={{ color: '#a0aec0', fontSize: '1.1rem' }}>Find and connect with people in your area.</p>
        </div>

        <form onSubmit={handleSearch} style={{ maxWidth: '800px', margin: '0 auto 4rem auto', display: 'flex', gap: '1rem' }}>
          <input 
            type="text" 
            className="custom-input" 
            placeholder="Search by name, city, state, or country..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            style={{ flex: 1, margin: 0 }}
          />
          <button type="submit" className="primary-btn" style={{ width: 'auto', margin: 0, padding: '0 2rem' }}>Search</button>
        </form>

        {/* Directory Grid (Email Removed) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' }}>
          {users.length === 0 ? (
            <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#a0aec0', fontSize: '1.1rem' }}>No neighbors found. Try a different search.</p>
          ) : (
            users.map(user => (
              <div 
                key={user.email} 
                className="glass-card" 
                onClick={() => openPublicProfile(user.email)}
                style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s', border: user.is_blocked ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255,255,255,0.07)' }}
                onMouseOver={e => e.currentTarget.style.transform = 'translateY(-5px)'}
                onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: user.is_blocked ? '#ef4444' : '#00c896', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', color: '#050816', fontWeight: 'bold', fontSize: '2rem', marginBottom: '1rem' }}>
                  {user.avatar ? <img src={user.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: user.is_blocked ? 0.3 : 1 }} /> : user.name.charAt(0).toUpperCase()}
                </div>
                
                <h3 style={{ margin: '0 0 1rem 0', color: user.is_blocked ? '#ef4444' : '#fff', fontSize: '1.3rem' }}>
                  {user.name} {user.is_blocked && ' (Blocked)'}
                </h3>
                
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                  {user.city && user.city !== 'N/A' && <span style={{ background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', color: '#e2e8f0' }}>{user.city}</span>}
                  {user.country && user.country !== 'N/A' && <span style={{ background: 'rgba(0,200,150,0.1)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', color: '#00c896' }}>{user.country}</span>}
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}