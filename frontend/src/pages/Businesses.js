// frontend/src/pages/Businesses.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/UI/Navbar';
import FloatingCity from '../components/3D/FloatingCity';
import '../styles/glassmorphism.css';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

function LocationPicker({ position, setPosition }) {
  useMapEvents({ click(e) { setPosition([e.latlng.lat, e.latlng.lng]); } });
  return position === null ? null : <Marker position={position} icon={customIcon}></Marker>;
}

function ChangeMapView({ center }) {
  const map = useMap();
  useEffect(() => { if (center) map.setView(center, 15); }, [center, map]);
  return null;
}

export default function Businesses() {
  const [businesses, setBusinesses] = useState([]);
  const [currentUserEmail, setCurrentUserEmail] = useState('');

  const [name, setName] = useState('');
  const [category, setCategory] = useState('Food & Dining');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]); 
  
  // Modal States
  const [editingBiz, setEditingBiz] = useState(null);
  const [viewingBiz, setViewingBiz] = useState(null); 
  const [fullscreenImage, setFullscreenImage] = useState(null); 

  // --- NEW REVIEW SUBMISSION STATE ---
  const [submitRating, setSubmitRating] = useState(5);
  const [submitText, setSubmitText] = useState('');

  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [newPinPosition, setNewPinPosition] = useState(null);
  const [mapCenter, setMapCenter] = useState([28.6139, 77.2090]); 
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) { navigate('/'); return; }
      try {
        const profileRes = await axios.get('http://127.0.0.1:5000/api/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCurrentUserEmail(profileRes.data.email);
      } catch (error) {
        if (error.response?.status === 401) navigate('/');
      }
    };
    fetchProfile();
    fetchBusinesses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const fetchBusinesses = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get('http://127.0.0.1:5000/api/businesses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBusinesses(response.data);
      
      // Keep viewing data fresh if the modal is currently open
      if (viewingBiz) {
        const updated = response.data.find(b => b.id === viewingBiz.id);
        if (updated) setViewingBiz(updated);
      }
    } catch (error) {
      console.error('Error fetching directory entries', error);
    }
  };

  const filteredBusinesses = businesses.filter((biz) => {
    const matchesCategory = selectedCategory === 'All' || biz.category === selectedCategory;
    const searchTarget = `${biz.name} ${biz.address} ${biz.description || ''}`.toLowerCase();
    const matchesSearch = searchTarget.includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleImageUpload = async (e, setTargetImagesArray) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    setIsUploadingImages(true);
    const base64Promises = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = () => resolve(reader.result);
      });
    });

    const base64Strings = await Promise.all(base64Promises);
    setTargetImagesArray(prev => [...(prev || []), ...base64Strings]);
    setIsUploadingImages(false);
  };

  const handleAutoLocate = async (e, addressText, setPinAndCenter) => {
    e.preventDefault(); 
    if (!addressText.trim()) { alert("Please enter an address to locate!"); return; }
    setIsSearchingAddress(true);
    try {
      const response = await axios.get(`https://photon.komoot.io/api/?q=${encodeURIComponent(addressText)}&limit=1`);
      if (response.data && response.data.features && response.data.features.length > 0) {
        const [lng, lat] = response.data.features[0].geometry.coordinates;
        setPinAndCenter([lat, lng]);
      } else { alert("Location not found."); }
    } catch (error) { alert("Could not reach search servers."); }
    setIsSearchingAddress(false);
  };

  const handleAIEnhance = async (e, descText, setDescFunc) => {
    e.preventDefault();
    if (!descText.trim()) { alert("Type a few keywords in the description box first!"); return; }
    setIsGenerating(true);
    const token = localStorage.getItem('token');
    try {
      const response = await axios.post('http://127.0.0.1:5000/api/generate-description', { keywords: descText }, { headers: { Authorization: `Bearer ${token}` } });
      setDescFunc(response.data.generated_text);
    } catch (error) { alert("AI Error: Generation failed."); }
    setIsGenerating(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!newPinPosition) { alert("Please drop a pin on the map or click 'Locate on Map' before saving!"); return; }
    const token = localStorage.getItem('token');
    try {
      await axios.post('http://127.0.0.1:5000/api/businesses', 
        { name, category, address, description, lat: newPinPosition[0], lng: newPinPosition[1], images: images },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setName(''); setAddress(''); setDescription(''); setNewPinPosition(null); setImages([]);
      fetchBusinesses();
    } catch (error) { alert('Failed to register business profile card'); }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      await axios.put(`http://127.0.0.1:5000/api/businesses/${editingBiz.id}`, 
        { 
          name: editingBiz.name, category: editingBiz.category, address: editingBiz.address, 
          description: editingBiz.description, images: editingBiz.images,
          lat: editingBiz.lat, lng: editingBiz.lng
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditingBiz(null); 
      fetchBusinesses(); 
    } catch (error) { alert('Failed to update business listing.'); }
  };

  const handleDelete = async (businessId) => {
    const confirmDelete = window.confirm("Are you sure you want to permanently delete this business listing?");
    if (!confirmDelete) return;
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`http://127.0.0.1:5000/api/businesses/${businessId}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchBusinesses(); 
    } catch (error) { alert(error.response?.data?.error || "Failed to delete business."); }
  };

  // --- SUBMIT BRAND NEW REVIEW ---
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      await axios.post(`http://127.0.0.1:5000/api/businesses/${viewingBiz.id}/reviews`, 
        { rating: submitRating, review_text: submitText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSubmitText('');
      setSubmitRating(5);
      fetchBusinesses(); // Triggers hot reload on current view metrics
    } catch (error) {
      alert("Failed to record score entry.");
    }
  };

  // Inline dynamic rendering utility to print rating stars smoothly
  const displayStars = (ratingScore) => {
    const rounded = Math.round(ratingScore);
    return "⭐".repeat(rounded) || "❌ No reviews";
  };

  return (
    <div className="page-container" style={{ flexDirection: 'column', alignItems: 'center', padding: '0 2rem 4rem 0' }}>
      <FloatingCity />

      {/* FULLSCREEN LIGHTBOX */}
      {fullscreenImage && (
        <div onClick={() => setFullscreenImage(null)} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.92)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out', padding: '2rem' }}>
          <img src={fullscreenImage} alt="Fullscreen" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '8px' }} />
        </div>
      )}

      {/* --- EXPANDED DETAILED VIEW MODAL --- */}
      {viewingBiz && !editingBiz && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '1000px', maxHeight: '90vh', overflowY: 'auto', padding: '3rem' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1.5rem' }}>
              <button onClick={() => setViewingBiz(null)} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                🔙 Back to Directory
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ color: '#ffb900', fontWeight: '700', fontSize: '1.1rem' }}>
                  {viewingBiz.average_rating > 0 ? `★ ${viewingBiz.average_rating} / 5` : 'No rating'}
                </span>
                <span style={{ fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', color: '#00c896', background: 'rgba(0,200,150,0.1)', padding: '0.5rem 1rem', borderRadius: '4px' }}>
                  {viewingBiz.category}
                </span>
              </div>
            </div>

            <h1 style={{ fontSize: '3rem', margin: '0 0 1rem 0', color: '#fff', fontWeight: '800' }}>{viewingBiz.name}</h1>
            <div style={{ fontSize: '1.1rem', color: '#718096', marginBottom: '2rem' }}>📍 {viewingBiz.address}</div>
            
            {viewingBiz.description && (
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '12px', borderLeft: '4px solid #7c3aed', marginBottom: '2.5rem' }}>
                <p style={{ fontSize: '1.15rem', color: '#e2e8f0', margin: 0, lineHeight: '1.7' }}>{viewingBiz.description}</p>
              </div>
            )}

            {/* Showcase Gallery */}
            {viewingBiz.images && viewingBiz.images.length > 0 && (
              <div style={{ marginBottom: '3rem' }}>
                <h3 style={{ fontSize: '1.3rem', color: '#fff', marginBottom: '1rem' }}>Photo Gallery</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
                  {viewingBiz.images.map((img, idx) => (
                    <img key={idx} src={img} alt="showcase" onClick={() => setFullscreenImage(img)} style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '12px', cursor: 'zoom-in' }} />
                  ))}
                </div>
              </div>
            )}

            {/* --- REVIEWS LOG & SUBMISSION PANEL --- */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2.5rem' }}>
              <h3 style={{ fontSize: '1.5rem', color: '#fff', marginBottom: '1.5rem' }}>Reviews & Feedback ({viewingBiz.review_count})</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', alignItems: 'start' }}>
                
                {/* Left Side: Submit New Review */}
                <div className="glass-card" style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.2)', margin: 0 }}>
                  <h4 style={{ margin: '0 0 1rem 0', color: '#00c896' }}>Write a Review</h4>
                  <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', color: '#a0aec0' }}>Rating Score</label>
                      <select className="custom-input" value={submitRating} onChange={(e) => setSubmitRating(parseInt(e.target.value))} style={{ width: '100%' }}>
                        <option value="5">⭐⭐⭐⭐⭐ 5 Stars (Excellent)</option>
                        <option value="4">⭐⭐⭐⭐ 4 Stars (Good)</option>
                        <option value="3">⭐⭐⭐ 3 Stars (Average)</option>
                        <option value="2">⭐⭐ 2 Stars (Poor)</option>
                        <option value="1">⭐ 1 Star (Terrible)</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', color: '#a0aec0' }}>Your Comment</label>
                      <textarea className="custom-input" rows="3" placeholder="Share your experience with the community..." value={submitText} onChange={(e) => setSubmitText(e.target.value)} required style={{ resize: 'none' }} />
                    </div>
                    <button type="submit" className="primary-btn" style={{ margin: 0 }}>Post Review</button>
                  </form>
                </div>

                {/* Right Side: Existing Reviews Feed List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '400px', overflowY: 'auto' }}>
                  {viewingBiz.reviews && viewingBiz.reviews.length === 0 ? (
                    <p style={{ fontStyle: 'italic', color: '#a0aec0', padding: '1rem', textAlign: 'center' }}>No feedback registered yet. Be the first to leave a review!</p>
                  ) : (
                    viewingBiz.reviews.map((rev, index) => (
                      <div key={index} style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <strong style={{ color: '#fff', fontSize: '0.95rem' }}>{rev.author_name}</strong>
                          <span style={{ fontSize: '0.8rem', color: '#718096' }}>{rev.created_at}</span>
                        </div>
                        <div style={{ color: '#ffb900', fontSize: '0.85rem', marginBottom: '0.5rem' }}>{"★".repeat(rev.rating)}</div>
                        <p style={{ margin: 0, color: '#e2e8f0', fontSize: '0.95rem', lineHeight: '1.4' }}>{rev.review_text}</p>
                      </div>
                    ))
                  )}
                </div>

              </div>
            </div>

          </div>
        </div>
      )}
      
      {/* EDIT MODAL OVERLAY */}
      {editingBiz && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-card" style={{ width: '90%', maxWidth: '800px', padding: '2.5rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 className="card-title" style={{ fontSize: '1.5rem', margin: 0 }}>Edit Business Profile</h2>
              <button onClick={() => setEditingBiz(null)} style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '1.5rem' }}>✕</button>
            </div>
            <form onSubmit={handleUpdate}>
              <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <input type="text" className="custom-input" value={editingBiz.name} onChange={(e) => setEditingBiz({...editingBiz, name: e.target.value})} required style={{ flex: 1 }} />
                <select className="custom-input" value={editingBiz.category} onChange={(e) => setEditingBiz({...editingBiz, category: e.target.value})} style={{ flex: 1 }}>
                  <option value="Food & Dining">Food & Dining</option>
                  <option value="Home Services">Home Services</option>
                  <option value="Retail & Shopping">Retail & Shopping</option>
                  <option value="Health & Beauty">Health & Beauty</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <input type="text" className="custom-input" value={editingBiz.address} onChange={(e) => setEditingBiz({...editingBiz, address: e.target.value})} required style={{ flex: 1 }} />
                <button onClick={(e) => handleAutoLocate(e, editingBiz.address, (coords) => setEditingBiz({...editingBiz, lat: coords[0], lng: coords[1]}))} className="primary-btn" style={{ width: 'auto', margin: 0, padding: '0 1.5rem', background: 'rgba(255, 255, 255, 0.05)', color: '#00c896', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
                  Auto-Locate
                </button>
              </div>
              <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                <textarea className="custom-input" rows="4" value={editingBiz.description} onChange={(e) => setEditingBiz({...editingBiz, description: e.target.value})} style={{ resize: 'none', paddingBottom: '3.5rem' }} />
                <button onClick={(e) => handleAIEnhance(e, editingBiz.description, (text) => setEditingBiz({...editingBiz, description: text}))} style={{ position: 'absolute', bottom: '1rem', right: '1rem', background: 'linear-gradient(90deg, #7c3aed, #00c896)', color: 'white', border: 'none', borderRadius: '8px', padding: '0.5rem 1rem', fontWeight: 'bold' }}>
                  ✨ Magic Write
                </button>
              </div>
              <div style={{ marginBottom: '2rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <span style={{ color: '#e2e8f0', fontWeight: '600' }}>Manage Photos</span>
                  <label style={{ cursor: 'pointer', background: '#00c896', color: '#050816', padding: '0.4rem 1rem', borderRadius: '8px', fontWeight: 'bold' }}>
                    📸 Add More Photos
                    <input type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={(e) => handleImageUpload(e, (updater) => setEditingBiz(prev => ({...prev, images: updater(prev.images)})))} />
                  </label>
                </div>
                {editingBiz.images && editingBiz.images.length > 0 && (
                  <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                    {editingBiz.images.map((imgStr, idx) => (
                      <div key={idx} style={{ position: 'relative', flexShrink: 0 }}>
                        <img src={imgStr} alt="preview" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
                        <button onClick={(e) => { e.preventDefault(); setEditingBiz({...editingBiz, images: editingBiz.images.filter((_, i) => i !== idx)}); }} style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer' }}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button type="submit" className="primary-btn">Save Changes</button>
            </form>
          </div>
        </div>
      )}

      {/* MAIN CONTENT BLOCK */}
      <div style={{ zIndex: 2, width: '100%', maxWidth: '1100px', padding: '0 2rem', margin: '0 auto' }}>
        <Navbar />
        <h1 style={{ textAlign: 'center', marginBottom: '3rem' }}>Local Directory</h1>

        {/* Leaflet Mapping Window */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#a0aec0' }}>Explore Neighborhood Spots</h2>
          <MapContainer center={mapCenter} zoom={13} scrollWheelZoom={false}>
            <TileLayer attribution='&copy; CartoDB' url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
            <ChangeMapView center={mapCenter} />
            {filteredBusinesses.map((biz) => (
              biz.lat && biz.lng && (
                <Marker key={biz.id} position={[biz.lat, biz.lng]} icon={customIcon}>
                  <Popup><strong style={{ color: '#00c896' }}>{biz.name}</strong><br/>{biz.category}<br/>{biz.address}</Popup>
                </Marker>
              )
            ))}
            <LocationPicker position={newPinPosition} setPosition={setNewPinPosition} />
          </MapContainer>
        </div>

        {/* CREATION LOG BOX */}
        <div className="glass-card" style={{ maxWidth: '100%', marginBottom: '4rem', padding: '2.5rem' }}>
          <h2 className="card-title" style={{ fontSize: '1.35rem', marginBottom: '1.5rem' }}>Register Your Business Card</h2>
          <form onSubmit={handleRegister}>
            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <input type="text" className="custom-input" placeholder="Business Name" value={name} onChange={(e) => setName(e.target.value)} required style={{ flex: 1 }} />
              <select className="custom-input" value={category} onChange={(e) => setCategory(e.target.value)} style={{ flex: 1 }}>
                <option value="Food & Dining"style={{ backgroundColor: '#05020a' }}>Food & Dining</option>
                <option value="Home Services"style={{ backgroundColor: '#05020a' }}>Home Services</option>
                <option value="Retail & Shopping"style={{ backgroundColor: '#05020a' }}>Retail & Shopping</option>
                <option value="Health & Beauty"style={{ backgroundColor: '#05020a' }}>Health & Beauty</option>
                <option value="Others"style={{ backgroundColor: '#05020a' }}>Others</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              <input type="text" className="custom-input" placeholder="Business Address" value={address} onChange={(e) => setAddress(e.target.value)} required style={{ flex: 1 }} />
              <button onClick={(e) => handleAutoLocate(e, address, (coords) => { setNewPinPosition(coords); setMapCenter(coords); })} disabled={isSearchingAddress} className="primary-btn" style={{ width: 'auto', margin: 0, padding: '0 1.5rem', background: 'rgba(255, 255, 255, 0.05)', color: '#00c896', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
                Locate on Map
              </button>
            </div>
            <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
              <textarea className="custom-input" rows="4" placeholder="Type keywords and click Magic Write..." value={description} onChange={(e) => setDescription(e.target.value)} style={{ resize: 'none', paddingBottom: '3.5rem' }} />
              <button onClick={(e) => handleAIEnhance(e, description, setDescription)} disabled={isGenerating} style={{ position: 'absolute', bottom: '1rem', right: '1rem', background: 'linear-gradient(90deg, #7c3aed, #00c896)', color: 'white', border: 'none', borderRadius: '8px', padding: '0.5rem 1rem', fontWeight: 'bold' }}>
                 Magic Write
              </button>
            </div>
            <div style={{ marginBottom: '2rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ color: '#e2e8f0', fontWeight: '600' }}>Showcase Your Business</span>
                <label style={{ cursor: 'pointer', background: '#00c896', color: '#050816', padding: '0.4rem 1rem', borderRadius: '8px', fontWeight: 'bold' }}>
                  Add Photos
                  <input type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={(e) => handleImageUpload(e, setImages)} />
                </label>
              </div>
              {images.length > 0 && (
                <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                  {images.map((imgStr, idx) => (
                    <div key={idx} style={{ position: 'relative', flexShrink: 0 }}>
                      <img src={imgStr} alt="preview" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
                      <button onClick={(e) => { e.preventDefault(); setImages(images.filter((_, i) => i !== idx)); }} style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px' }}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button type="submit" className="primary-btn">List Business</button>
          </form>
        </div>

        {/* SEARCH & FILTERS DASHBOARD */}
        <div className="glass-card" style={{ maxWidth: '100%', marginBottom: '2.5rem', padding: '1.5rem 2rem' }}>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <input type="text" className="custom-input" placeholder="Search by name, street keyword, or services..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ flex: 2, margin: 0, padding: '0.75rem 1rem' }} />
            <select className="custom-input" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} style={{ flex: 1, margin: 0, padding: '0.75rem 1rem' }}>
              <option value="All"style={{ backgroundColor: '#05020a' }}>All Categories</option>
              <option value="Food & Dining"style={{ backgroundColor: '#05020a' }}>Food & Dining</option>
              <option value="Home Services"style={{ backgroundColor: '#05020a' }}>Home Services</option>
              <option value="Retail & Shopping"style={{ backgroundColor: '#05020a' }}>Retail & Shopping</option>
              <option value="Health & Beauty"style={{ backgroundColor: '#05020a' }}>Health & Beauty</option>
            </select>
          </div>
        </div>

        {/* LISTINGS DISPLAY GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          {filteredBusinesses.map((biz) => (
            <div 
              key={biz.id} 
              className="glass-card" 
              onClick={() => setViewingBiz(biz)}
              style={{ maxWidth: '100%', padding: '2rem', display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'transform 0.2s' }}
              onMouseOver={e => e.currentTarget.style.transform = 'translateY(-5px)'}
              onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#00c896', letterSpacing: '0.05em', background: 'rgba(0,200,150,0.1)', padding: '0.4rem 0.8rem', borderRadius: '4px' }}>
                  {biz.category}
                </span>
                
                {currentUserEmail === biz.owner_email && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={(e) => { e.stopPropagation(); setEditingBiz(biz); }} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '4px', padding: '0.3rem 0.6rem', fontSize: '0.8rem', cursor: 'pointer' }}>✏️ Edit</button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(biz.id); }} style={{ background: 'transparent', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#ef4444', borderRadius: '4px', padding: '0.3rem 0.6rem', fontSize: '0.8rem', cursor: 'pointer' }}>🗑️ Delete</button>
                  </div>
                )}
              </div>

              <h3 style={{ fontSize: '1.4rem', margin: '1rem 0 0.2rem 0', fontWeight: '600' }}>{biz.name}</h3>
              
              {/* --- CARD SCORE DISPLAY OVERLAY --- */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem', fontSize: '0.9rem', color: '#ffb900' }}>
                <span>{displayStars(biz.average_rating)}</span>
                {biz.review_count > 0 && (
                  <span style={{ color: '#a0aec0', fontSize: '0.8rem' }}>({biz.review_count} reviews)</span>
                )}
              </div>

              <div style={{ fontSize: '0.85rem', color: '#718096', marginBottom: '1rem' }}>Address:- {biz.address}</div>
              {biz.description && <p style={{ fontSize: '0.95rem', color: '#a0aec0', margin: 0, lineHeight: '1.5', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{biz.description}</p>}
              
              {biz.images && biz.images.length > 0 && (
                <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'hidden', marginTop: '1.5rem', paddingBottom: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
                  {biz.images.slice(0, 4).map((img, idx) => (
                    <img key={idx} src={img} alt="showcase" onClick={(e) => { e.stopPropagation(); setFullscreenImage(img); }} style={{ width: '120px', height: '90px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0, cursor: 'zoom-in' }} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}