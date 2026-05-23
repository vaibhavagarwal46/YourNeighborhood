// frontend/src/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/UI/Navbar';
import FloatingCity from '../components/3D/FloatingCity';
import '../styles/glassmorphism.css';

export default function Dashboard() {
  const [userName, setUserName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) { navigate('/'); return; }
      try {
        const response = await axios.get('http://127.0.0.1:5000/api/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUserName(response.data.name || 'Neighbor');
      } catch (error) {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/');
        }
      }
    };
    fetchProfile();
  }, [navigate]);

  return (
    <div className="page-container" style={{ 
      flexDirection: 'column', 
      alignItems: 'center', 
      padding: '0 2rem 6rem 0',
      height: 'auto', 
      minHeight: '100vh', 
      overflowY: 'visible' 
    }}>
      <FloatingCity />
      
      <div style={{ zIndex: 2, width: '100%', maxWidth: '1100px', padding: '0 2rem', margin: '0 auto' }}>
        <Navbar />

        {/* Dashboard Welcome Header */}
        <div style={{ textAlign: 'center', margin: '4rem 0 3.5rem 0' }}>
          <h1 style={{ fontSize: '3.5rem', color: '#fff', marginBottom: '1rem', fontWeight: '800' }}>
            Welcome back, <span style={{ color: '#00c896' }}>{userName}</span>
          </h1>
          <p style={{ fontSize: '1.2rem', color: '#a0aec0' }}>What would you like to explore in your neighborhood today?</p>
        </div>

        {/* 3x2 Grid Container with 6 perfect cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: '2.5rem', 
          maxWidth: '1000px', 
          margin: '0 auto',
          height: 'auto',
          alignItems: 'stretch'
        }}>
          
          {/* Card 1: Community Feed */}
          <div 
            className="glass-card" 
            onClick={() => navigate('/feed')} 
            style={{ padding: '2.5rem', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', height: 'auto', display: 'block', margin: 0 }} 
            onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 15px 30px rgba(0,0,0,0.4)'; }} 
            onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📰</div>
            <h2 style={{ color: '#fff', fontSize: '1.4rem', marginBottom: '0.5rem', fontWeight: '700' }}>Community Hub</h2>
            <p style={{ color: '#a0aec0', margin: 0, fontSize: '0.95rem', lineHeight: '1.4' }}>See local updates and trade ideas with neighbors.</p>
          </div>

          {/* Card 2: Local Directory */}
          <div 
            className="glass-card" 
            onClick={() => navigate('/businesses')} 
            style={{ padding: '2.5rem', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', height: 'auto', display: 'block', margin: 0 }} 
            onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 15px 30px rgba(0,0,0,0.4)'; }} 
            onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📍</div>
            <h2 style={{ color: '#fff', fontSize: '1.4rem', marginBottom: '0.5rem', fontWeight: '700' }}>Local Directory</h2>
            <p style={{ color: '#a0aec0', margin: 0, fontSize: '0.95rem', lineHeight: '1.4' }}>Find and list neighborhood business services.</p>
          </div>

          {/* Card 3: Marketplace */}
          <div 
            className="glass-card" 
            onClick={() => navigate('/marketplace')} 
            style={{ padding: '2.5rem', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', height: 'auto', display: 'block', margin: 0 }} 
            onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 15px 30px rgba(0, 200, 150, 0.2)'; }} 
            onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛒</div>
            <h2 style={{ color: '#fff', fontSize: '1.4rem', marginBottom: '0.5rem', fontWeight: '700' }}>Marketplace</h2>
            <p style={{ color: '#a0aec0', margin: 0, fontSize: '0.95rem', lineHeight: '1.4' }}>Buy and sell commercial items locally.</p>
          </div>

          {/* Card 4: Discover Neighbors */}
          <div 
            className="glass-card" 
            onClick={() => navigate('/community')} 
            style={{ padding: '2.5rem', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', height: 'auto', display: 'block', margin: 0 }} 
            onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 15px 30px rgba(124, 58, 237, 0.2)'; }} 
            onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
            <h2 style={{ color: '#fff', fontSize: '1.4rem', marginBottom: '0.5rem', fontWeight: '700' }}>Discover Neighbors</h2>
            <p style={{ color: '#a0aec0', margin: 0, fontSize: '0.95rem', lineHeight: '1.4' }}>Search, connect, and view local community members.</p>
          </div>

          {/* Card 5: Inbox */}
          <div 
            className="glass-card" 
            onClick={() => navigate('/inbox')} 
            style={{ padding: '2.5rem', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', height: 'auto', display: 'block', margin: 0 }} 
            onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 15px 30px rgba(0,0,0,0.4)'; }} 
            onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💬</div>
            <h2 style={{ color: '#fff', fontSize: '1.4rem', marginBottom: '0.5rem', fontWeight: '700' }}>Direct Messages</h2>
            <p style={{ color: '#a0aec0', margin: 0, fontSize: '0.95rem', lineHeight: '1.4' }}>Chat with your neighbors securely in real-time.</p>
          </div>

          {/* Card 6: Profile */}
          <div 
            className="glass-card" 
            onClick={() => navigate('/profile')} 
            style={{ padding: '2.5rem', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', height: 'auto', display: 'block', margin: 0 }} 
            onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 15px 30px rgba(0,0,0,0.4)'; }} 
            onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👤</div>
            <h2 style={{ color: '#fff', fontSize: '1.4rem', marginBottom: '0.5rem', fontWeight: '700' }}>My Profile</h2>
            <p style={{ color: '#a0aec0', margin: 0, fontSize: '0.95rem', lineHeight: '1.4' }}>Manage your activity logs, avatars, and settings.</p>
          </div>

        </div>
      </div>
    </div>
  );
}