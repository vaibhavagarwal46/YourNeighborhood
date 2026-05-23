// frontend/src/pages/Profile.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/UI/Navbar';
import FloatingCity from '../components/3D/FloatingCity';
import '../styles/glassmorphism.css';

export default function Profile() {
  const [user, setUser] = useState({ name: '', email: '', avatar: '', city: '', state: '', country: '', posts: [], blocked_users: [] });
  const [isUploading, setIsUploading] = useState(false);
  const navigate = useNavigate();

  const fetchProfile = async () => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/'); return; }
    try {
      const response = await axios.get('http://127.0.0.1:5000/api/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/');
      }
    }
  };

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line
  }, [navigate]);

  // --- IMAGE UPLOAD LOGIC ---
  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      const img = new Image();
      img.src = reader.result;
      
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const size = 150; 
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        let srcX = 0, srcY = 0, srcWidth = img.width, srcHeight = img.height;
        if (img.width > img.height) {
          srcWidth = img.height;
          srcX = (img.width - img.height) / 2;
        } else {
          srcHeight = img.width;
          srcY = (img.height - img.width) / 2;
        }

        ctx.drawImage(img, srcX, srcY, srcWidth, srcHeight, 0, 0, size, size);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6); 

        try {
          const token = localStorage.getItem('token');
          await axios.put('http://127.0.0.1:5000/api/profile/avatar', 
            { avatar: compressedBase64 },
            { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
          );
          setUser(prev => ({ ...prev, avatar: compressedBase64 }));
        } catch (error) {
          alert("Failed to upload avatar.");
        }
        setIsUploading(false);
      };
    };
  };

  const handleDeleteAvatar = async () => {
    const confirmDelete = window.confirm("Are you sure you want to remove your profile picture?");
    if (!confirmDelete) return;

    const token = localStorage.getItem('token');
    try {
      await axios.delete('http://127.0.0.1:5000/api/profile/avatar', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(prev => ({ ...prev, avatar: "" }));
    } catch (error) {
      alert("Failed to remove profile picture.");
    }
  };

  // --- NEW: UNBLOCK USER HANDLER ---
  const handleUnblock = async (emailToUnblock) => {
    const token = localStorage.getItem('token');
    try {
      // Re-using our social graph block route (it works as a toggle!)
      await axios.post('http://127.0.0.1:5000/api/users/block', 
        { email: emailToUnblock }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Refresh the profile to instantly remove them from the UI list
      fetchProfile(); 
    } catch (error) {
      alert("Failed to unblock user.");
    }
  };

  return (
    <div className="page-container" style={{ flexDirection: 'column', alignItems: 'center', padding: '0 2rem 4rem 0' }}>
      <FloatingCity />
      
      <div style={{ zIndex: 2, width: '100%', maxWidth: '1100px', padding: '0 2rem', margin: '0 auto' }}>
        <Navbar />

        {/* PROFILE HEADER SECTION */}
        <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto 3rem auto', padding: '3rem', textAlign: 'center' }}>
          
          <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto 1.5rem auto' }}>
            {user.avatar ? (
              <img src={user.avatar} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '3px solid #00c896', opacity: isUploading ? 0.5 : 1 }} />
            ) : (
              <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#00c896', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', fontWeight: 'bold', color: '#050816', opacity: isUploading ? 0.5 : 1 }}>
                {user.name ? user.name.charAt(0).toUpperCase() : '👤'}
              </div>
            )}

            <label style={{
              position: 'absolute', bottom: '0', right: '0', background: '#7c3aed', color: 'white', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.5)', border: '3px solid #050816', fontSize: '1.4rem', fontWeight: 'bold', transition: 'transform 0.2s, background 0.2s'
            }} onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'} onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'} title="Upload Profile Picture">
              +<input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} disabled={isUploading} />
            </label>
          </div>

          <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem', color: '#fff' }}>{user.name || 'Member'}</h1>
          <p style={{ margin: '0 0 1.5rem 0', color: '#a0aec0', fontSize: '1.1rem' }}>{user.email}</p>

          {user.avatar && (
            <button onClick={handleDeleteAvatar} style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '0.5rem 1.2rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', marginBottom: '2rem' }}>
              🗑️ Remove Profile Photo
            </button>
          )}

          {/* GEOLOCATION DATA BOXES */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem', textAlign: 'left' }}>
            <div style={{ flex: '1 1 150px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#a0aec0', marginBottom: '0.4rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>City</label>
              <div style={{ color: '#fff', fontSize: '1.05rem', background: 'rgba(0,0,0,0.2)', padding: '0.8rem 1.2rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>{user.city || 'N/A'}</div>
            </div>
            <div style={{ flex: '1 1 150px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#a0aec0', marginBottom: '0.4rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>State</label>
              <div style={{ color: '#fff', fontSize: '1.05rem', background: 'rgba(0,0,0,0.2)', padding: '0.8rem 1.2rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>{user.state || 'N/A'}</div>
            </div>
            <div style={{ flex: '1 1 150px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#a0aec0', marginBottom: '0.4rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Country</label>
              <div style={{ color: '#00c896', fontSize: '1.05rem', background: 'rgba(0, 200, 150, 0.05)', padding: '0.8rem 1.2rem', borderRadius: '8px', border: '1px solid rgba(0, 200, 150, 0.2)', fontWeight: 'bold' }}>{user.country || 'N/A'}</div>
            </div>
          </div>
        </div>

        {/* --- NEW: BLOCKED USERS SECTION --- */}
        <div style={{ maxWidth: '800px', margin: '0 auto 3rem auto' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
            Blocked Users
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {(!user.blocked_users || user.blocked_users.length === 0) ? (
              <p style={{ textAlign: 'center', color: '#a0aec0', padding: '2rem 0', fontStyle: 'italic', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                You haven't blocked any neighbors.
              </p>
            ) : (
              user.blocked_users.map((blockedUser, idx) => (
                <div key={idx} className="glass-card" style={{ padding: '1.25rem 1.5rem', margin: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', color: '#fff', fontWeight: 'bold', fontSize: '1.2rem' }}>
                      {blockedUser.avatar ? <img src={blockedUser.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : blockedUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 style={{ margin: 0, color: '#fff', fontSize: '1.05rem', marginBottom: '0.2rem' }}>{blockedUser.name}</h4>
                      <span style={{ color: '#718096', fontSize: '0.85rem' }}>{blockedUser.email}</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleUnblock(blockedUser.email)}
                    style={{ background: 'rgba(0, 200, 150, 0.1)', color: '#00c896', border: '1px solid rgba(0, 200, 150, 0.3)', padding: '0.6rem 1.2rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.9rem' }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(0, 200, 150, 0.2)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'rgba(0, 200, 150, 0.1)'}
                  >
                    🔓 Unblock
                  </button>

                </div>
              ))
            )}
          </div>
        </div>

        {/* ACTIVITY LOG SECTION */}
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
            Your Activity Log
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {user.posts.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#a0aec0', padding: '2rem 0', fontStyle: 'italic' }}>
                You haven't posted anything yet.
              </p>
            ) : (
              user.posts.map(post => (
                <div key={post.id} className="glass-card" style={{ padding: '1.5rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#7c3aed', background: 'rgba(124,58,237,0.1)', padding: '0.3rem 0.6rem', borderRadius: '4px' }}>
                    {post.post_type}
                  </span>
                  <div style={{ marginTop: '1rem', color: '#e2e8f0', lineHeight: '1.6' }}>{post.content}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', fontSize: '0.85rem', color: '#718096' }}>
                    <span>❤️ {post.likes} Likes • 💬 {post.comments?.length || 0} Comments</span>
                    <span>{post.created_at}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}