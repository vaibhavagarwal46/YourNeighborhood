// frontend/src/pages/Home.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import FloatingCity from '../components/3D/FloatingCity';
import '../styles/glassmorphism.css';

export default function Home() {
  const [isLoginView, setIsLoginView] = useState(true);
  
  // Core Auth States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // New Location States
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) navigate('/dashboard');
  }, [navigate]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    const endpoint = isLoginView ? '/api/login' : '/api/signup';
    
    // Inject the location data only if the user is creating a new account
    const payload = isLoginView 
      ? { email, password } 
      : { name, email, password, country, state, city };

    try {
      const response = await axios.post(`http://127.0.0.1:5000${endpoint}`, payload);
      localStorage.setItem('token', response.data.token);
      navigate('/dashboard'); 
    } catch (error) {
      setErrorMsg(error.response?.data?.error || 'Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ position: 'relative', overflow: 'hidden', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <FloatingCity />
      
      <div style={{ zIndex: 2, width: '100%', maxWidth: '1200px', padding: '2rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '4rem' }}>
        
        {/* LEFT COLUMN: Hero Text */}
        <div style={{ flex: '1 1 500px', maxWidth: '600px' }}>
          <div style={{ fontWeight: '800', fontSize: '4rem', lineHeight: '1.1', marginBottom: '1.5rem', color: '#ffffff', letterSpacing: '-0.03em' }}>
            Welcome to <br/>
            <span style={{ background: 'linear-gradient(90deg, #00c896, #7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              YourNeighborhood
            </span>
          </div>
          <p style={{ fontSize: '1.25rem', color: '#a0aec0', marginBottom: '2.5rem', lineHeight: '1.6' }}>
            Your premium hyperlocal hub. Connect with neighbors, discover local businesses, and trade effortlessly in a secure, AI-powered environment.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            {['📍 Local Directory', '💬 Real-Time Chat', '✨ AI Assistant', '🤝 Secure Trading'].map((feature, idx) => (
              <span key={idx} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.6rem 1.2rem', borderRadius: '50px', color: '#e2e8f0', fontWeight: '600', fontSize: '0.9rem', backdropFilter: 'blur(10px)' }}>
                {feature}
              </span>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: Auth Form */}
        <div style={{ flex: '1 1 400px', maxWidth: '450px' }}>
          <div className="glass-card" style={{ padding: '3rem', width: '100%' }}>
            <div style={{ display: 'flex', marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <button onClick={() => { setIsLoginView(true); setErrorMsg(''); }} style={{ flex: 1, background: 'transparent', border: 'none', paddingBottom: '1rem', cursor: 'pointer', color: isLoginView ? '#00c896' : '#a0aec0', fontWeight: 'bold', fontSize: '1.1rem', borderBottom: isLoginView ? '2px solid #00c896' : '2px solid transparent', transition: 'all 0.3s' }}>
                Sign In
              </button>
              <button onClick={() => { setIsLoginView(false); setErrorMsg(''); }} style={{ flex: 1, background: 'transparent', border: 'none', paddingBottom: '1rem', cursor: 'pointer', color: !isLoginView ? '#00c896' : '#a0aec0', fontWeight: 'bold', fontSize: '1.1rem', borderBottom: !isLoginView ? '2px solid #00c896' : '2px solid transparent', transition: 'all 0.3s' }}>
                Create Account
              </button>
            </div>

            <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Extra fields only visible during Signup */}
              {!isLoginView && (
                <>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#e2e8f0', fontSize: '0.9rem', fontWeight: '600' }}>Full Name</label>
                    <input type="text" className="custom-input" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required={!isLoginView} style={{ width: '100%', boxSizing: 'border-box' }} />
                  </div>
                  
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: '#e2e8f0', fontSize: '0.9rem', fontWeight: '600' }}>Country</label>
                      <input type="text" className="custom-input" placeholder="e.g. India" value={country} onChange={(e) => setCountry(e.target.value)} required={!isLoginView} style={{ width: '100%', boxSizing: 'border-box' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: '#e2e8f0', fontSize: '0.9rem', fontWeight: '600' }}>State</label>
                      <input type="text" className="custom-input" placeholder="e.g. Uttar Pradesh" value={state} onChange={(e) => setState(e.target.value)} required={!isLoginView} style={{ width: '100%', boxSizing: 'border-box' }} />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#e2e8f0', fontSize: '0.9rem', fontWeight: '600' }}>City</label>
                    <input type="text" className="custom-input" placeholder="e.g. Bareilly" value={city} onChange={(e) => setCity(e.target.value)} required={!isLoginView} style={{ width: '100%', boxSizing: 'border-box' }} />
                  </div>
                </>
              )}

              {/* Standard Email & Password Fields */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#e2e8f0', fontSize: '0.9rem', fontWeight: '600' }}>Email Address</label>
                <input type="email" className="custom-input" placeholder="neighbor@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', boxSizing: 'border-box' }} />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#e2e8f0', fontSize: '0.9rem', fontWeight: '600' }}>Password</label>
                <input type="password" className="custom-input" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%', boxSizing: 'border-box' }} />
              </div>
              
              {errorMsg && <div style={{ color: '#ef4444', fontSize: '0.85rem', textAlign: 'center', background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '8px' }}>{errorMsg}</div>}
              
              <button type="submit" className="primary-btn" disabled={isLoading} style={{ marginTop: '1rem', opacity: isLoading ? 0.7 : 1, width: '100%' }}>
                {isLoading ? 'Processing...' : (isLoginView ? 'Secure Login' : 'Join the Neighborhood')}
              </button>

            </form>
          </div>
        </div>

      </div>
    </div>
  );
}