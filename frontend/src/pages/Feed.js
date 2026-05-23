// frontend/src/pages/Feed.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/UI/Navbar';
import FloatingCity from '../components/3D/FloatingCity';
import '../styles/glassmorphism.css';

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  
  // Creation States
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState('general');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  // Engagement States
  const [activeCommentPost, setActiveCommentPost] = useState(null); // Tracks which comment section is open
  const [commentText, setCommentText] = useState('');

  // --- NEW EDITING STATE ---
  const [editingPost, setEditingPost] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const initFeed = async () => {
      const token = localStorage.getItem('token');
      if (!token) { navigate('/'); return; }
      
      try {
        const profileRes = await axios.get('http://127.0.0.1:5000/api/profile', { headers: { Authorization: `Bearer ${token}` } });
        setCurrentUserEmail(profileRes.data.email);
        fetchPosts(token);
      } catch (error) {
        if (error.response?.status === 401) navigate('/');
      }
    };
    initFeed();
    // eslint-disable-next-line
  }, [navigate]);

  const fetchPosts = async (token = localStorage.getItem('token')) => {
    try {
      const response = await axios.get('http://127.0.0.1:5000/api/posts', { headers: { Authorization: `Bearer ${token}` } });
      setPosts(response.data);
    } catch (error) {
      console.error("Error fetching feed data");
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      await axios.post('http://127.0.0.1:5000/api/posts', 
        { content, post_type: postType, price, location },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setContent(''); setPrice(''); setLocation('');
      fetchPosts();
    } catch (error) {
      alert('Failed to publish post.');
    }
  };

  // --- ENGAGEMENT ACTIONS ---
  const handleLike = async (postId) => {
    const token = localStorage.getItem('token');
    try {
      // Optimistic UI update (makes the heart turn red instantly before server replies)
      setPosts(posts.map(p => {
        if (p.id === postId) {
          const isLiked = p.liked_by && p.liked_by.includes(currentUserEmail);
          return { 
            ...p, 
            liked_by: isLiked ? p.liked_by.filter(e => e !== currentUserEmail) : [...(p.liked_by || []), currentUserEmail] 
          };
        }
        return p;
      }));

      await axios.put(`http://127.0.0.1:5000/api/posts/${postId}/like`, {}, { headers: { Authorization: `Bearer ${token}` } });
      fetchPosts(); // Sync true data quietly
    } catch (error) {
      console.error("Failed to toggle like");
    }
  };

  const handleCommentSubmit = async (e, postId) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const token = localStorage.getItem('token');
    try {
      await axios.post(`http://127.0.0.1:5000/api/posts/${postId}/comment`, 
        { text: commentText }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCommentText('');
      fetchPosts(); 
    } catch (error) {
      alert("Failed to post comment.");
    }
  };

  // --- NEW: UPDATE POST HANDLER ---
  const handleUpdatePost = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      await axios.put(`http://127.0.0.1:5000/api/posts/${editingPost.id}`, 
        { 
          content: editingPost.content, 
          location: editingPost.location,
          post_type: editingPost.post_type,
          price: editingPost.price 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditingPost(null);
      fetchPosts();
    } catch (error) {
      alert("Failed to update post modifications.");
    }
  };

  // --- NEW: DELETE POST HANDLER ---
  const handleDeletePost = async (postId) => {
    const confirmDelete = window.confirm("Are you sure you want to permanently delete this post?");
    if (!confirmDelete) return;

    const token = localStorage.getItem('token');
    try {
      await axios.delete(`http://127.0.0.1:5000/api/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchPosts();
    } catch (error) {
      alert("Failed to discard post listing.");
    }
  };

  const filteredPosts = posts.filter((post) => {
    const matchesType = typeFilter === 'all' || post.post_type === typeFilter;
    const searchTarget = `${post.content} ${post.author_name}`.toLowerCase();
    const matchesSearch = searchTarget.includes(searchQuery.toLowerCase());
    const matchesLocation = locationFilter.trim() === '' || (post.location || '').toLowerCase().includes(locationFilter.toLowerCase());
    return matchesType && matchesSearch && matchesLocation;
  });

  return (
    <div className="page-container" style={{ flexDirection: 'column', alignItems: 'center', padding: '0 2rem 4rem 0' }}>
      <FloatingCity />
      
      {/* --- NEW: EDIT POST LAYOUT OVERLAY MODAL --- */}
      {editingPost && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-card" style={{ width: '90%', maxWidth: '600px', padding: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 className="card-title" style={{ margin: 0, fontSize: '1.4rem' }}>Edit Post Settings</h2>
              <button onClick={() => setEditingPost(null)} style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
            </div>
            
            <form onSubmit={handleUpdatePost} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <textarea 
                className="custom-input" rows="4" value={editingPost.content} 
                onChange={(e) => setEditingPost({...editingPost, content: e.target.value})} required 
                style={{ resize: 'none' }}
              />
              <div style={{ display: 'flex', gap: '1rem' }}>
                <select className="custom-input" value={editingPost.post_type} onChange={(e) => setEditingPost({...editingPost, post_type: e.target.value})} style={{ flex: 1 }}>
                  <option value="general" style={{ backgroundColor: '#05020a' }}>Community Update</option>
                  <option value="sale" style={{ backgroundColor: '#05020a' }}>Item for Sale</option>
                  <option value="service" style={{ backgroundColor: '#05020a' }}>Looking for Service</option>
                  <option value="Others" style={{ backgroundColor: '#05020a' }}>Others</option>
                </select>
                {editingPost.post_type === 'sale' && (
                  <input type="text" className="custom-input" placeholder="Price" value={editingPost.price || ''} onChange={(e) => setEditingPost({...editingPost, price: e.target.value})} style={{ flex: 1 }} required />
                )}
              </div>
              <input type="text" className="custom-input" placeholder="📍 Locality tag" value={editingPost.location || ''} onChange={(e) => setEditingPost({...editingPost, location: e.target.value})} />
              <button type="submit" className="primary-btn" style={{ width: '100%' }}>Save Changes</button>
            </form>
          </div>
        </div>
      )}

      <div style={{ zIndex: 2, width: '100%', maxWidth: '1100px', padding: '0 2rem', margin: '0 auto' }}>
        <Navbar />

        {/* POST CREATION BOX */}
        <div className="glass-card" style={{ maxWidth: '800px', margin: '3rem auto 2.5rem auto', padding: '2rem' }}>
          <h2 style={{ marginTop: 0, color: '#fff', fontSize: '1.3rem', marginBottom: '1.5rem' }}>Create a Post</h2>
          <form onSubmit={handleCreatePost} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <textarea className="custom-input" rows="3" placeholder="What's happening in your neighborhood?" value={content} onChange={(e) => setContent(e.target.value)} required style={{ resize: 'none', fontFamily: 'inherit' }} />
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <select className="custom-input" value={postType} onChange={(e) => setPostType(e.target.value)} style={{ flex: 1 }}>
                <option value="general" style={{ backgroundColor: '#05020a' }}>Community Update</option>
                <option value="sale" style={{ backgroundColor: '#05020a' }}>Item for Sale</option>
                <option value="service" style={{ backgroundColor: '#05020a' }}>Looking for Service</option>
                <option value="Others" style={{ backgroundColor: '#05020a' }}>Others</option>
              </select>
              {postType === 'sale' && <input type="text" className="custom-input" placeholder="Price (e.g. $50)" value={price} onChange={(e) => setPrice(e.target.value)} style={{ flex: 1 }} required />}
            </div>
            <input type="text" className="custom-input" placeholder=" Tag your locality or society (e.g., Cantt, Downtown)" value={location} onChange={(e) => setLocation(e.target.value)} style={{ width: '100%', boxSizing: 'border-box' }} />
            <button type="submit" className="primary-btn">Publish Post</button>
          </form>
        </div>

        {/* SEARCH & FILTER DASHBOARD */}
        <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto 2.5rem auto', padding: '1.5rem 2rem' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#fff', fontWeight: '600', marginTop: 0 }}>Filter Community Feed</h2>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <input type="text" className="custom-input" placeholder="Search posts..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ flex: '1 1 200px', margin: 0, padding: '0.75rem 1rem' }} />
            <input type="text" className="custom-input" placeholder=" Filter by City or Society..." value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} style={{ flex: '1 1 200px', margin: 0, padding: '0.75rem 1rem' }} />
            <select className="custom-input" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{ flex: '0 1 200px', margin: 0, padding: '0.75rem 1rem', cursor: 'pointer' }}>
              <option value="all" style={{ backgroundColor: '#05020a' }}>All Post Types</option>
              <option value="general" style={{ backgroundColor: '#05020a' }}>Community Updates</option>
              <option value="sale" style={{ backgroundColor: '#05020a' }}>Items for Sale</option>
              <option value="service" style={{ backgroundColor: '#05020a' }}>Services Needed</option>
            </select>
          </div>
        </div>

        {/* THE FEED DISPLAY */}
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {filteredPosts.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#a0aec0', padding: '2rem 0' }}>No posts found matching your filters in this area.</p>
          ) : (
            filteredPosts.map(post => {
              const isLiked = post.liked_by && post.liked_by.includes(currentUserEmail);
              const isCommentOpen = activeCommentPost === post.id;

              return (
                <div key={post.id} className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                  
                  {/* Post Content */}
                  <div style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '70px', height: '50px', borderRadius: '50%', background: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', color: '#fff', fontWeight: 'bold', fontSize: '1.4rem' }}>
                          {post.author_avatar ? <img src={post.author_avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : post.author_name ? post.author_name.charAt(0).toUpperCase() : '👤'}
                        </div>
                        <div>
                          <h3 style={{ margin: '0 0 0.2rem 0', color: '#fff', fontSize: '1.15rem' }}>{post.author_name}</h3>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.85rem', color: '#a0aec0' }}>{post.created_at}</span>
                            {post.location && (
                              <span style={{ fontSize: '0.8rem', color: '#00c896', background: 'rgba(0, 200, 150, 0.1)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: '600' }}>
                                📍 {post.location}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* --- ACTIONS FOR POST OWNER --- */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {currentUserEmail === post.author_email && (
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button onClick={() => setEditingPost(post)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '0.25rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}> Edit</button>
                            <button onClick={() => handleDeletePost(post.id)} style={{ background: 'transparent', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '0.25rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}> Delete</button>
                          </div>
                        )}
                        <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: post.post_type === 'sale' ? '#00c896' : '#7c3aed', background: post.post_type === 'sale' ? 'rgba(0,200,150,0.1)' : 'rgba(124,58,237,0.1)', padding: '0.4rem 0.8rem', borderRadius: '4px' }}>
                          {post.post_type} {post.price && `- ${post.price}`}
                        </span>
                      </div>
                    </div>

                    <p style={{ color: '#e2e8f0', fontSize: '1.05rem', lineHeight: '1.6', margin: '0 0 1.5rem 0' }}>{post.content}</p>

                    {/* Engagement Buttons */}
                    <div style={{ display: 'flex', gap: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
                      <button 
                        onClick={() => handleLike(post.id)}
                        style={{ background: 'transparent', border: 'none', color: isLiked ? '#ef4444' : '#a0aec0', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'color 0.2s, transform 0.1s' }}
                        onMouseDown={e => e.currentTarget.style.transform = 'scale(0.9)'}
                        onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        {isLiked ? '❤️' : '🤍'} {post.liked_by?.length || 0} Likes
                      </button>
                      <button 
                        onClick={() => {
                          setActiveCommentPost(isCommentOpen ? null : post.id);
                          setCommentText(''); // Clear draft if switching threads
                        }}
                        style={{ background: 'transparent', border: 'none', color: isCommentOpen ? '#00c896' : '#a0aec0', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'color 0.2s' }}
                      >
                        💬 {post.comments?.length || 0} Comments
                      </button>
                    </div>
                  </div>

                  {/* --- COMMENT THREAD DRAWER --- */}
                  {isCommentOpen && (
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem 2rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      
                      <form onSubmit={(e) => handleCommentSubmit(e, post.id)} style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                        <input 
                          type="text" className="custom-input" placeholder="Write a comment..." 
                          value={commentText} onChange={(e) => setCommentText(e.target.value)}
                          style={{ margin: 0, flex: 1, padding: '0.75rem 1rem' }}
                        />
                        <button type="submit" className="primary-btn" style={{ margin: 0, width: 'auto', padding: '0 1.5rem' }}>Reply</button>
                      </form>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {post.comments && post.comments.length === 0 ? (
                          <p style={{ color: '#718096', fontSize: '0.9rem', margin: 0, textAlign: 'center' }}>Be the first to share your thoughts.</p>
                        ) : (
                          post.comments && post.comments.map((comment) => (
                            <div key={comment.id} style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', borderLeft: '2px solid #00c896' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                                <strong style={{ color: '#fff', fontSize: '0.9rem' }}>{comment.author_name}</strong>
                                <span style={{ color: '#718096', fontSize: '0.75rem' }}>{comment.created_at}</span>
                              </div>
                              <p style={{ margin: 0, color: '#e2e8f0', fontSize: '0.95rem', lineHeight: '1.4' }}>{comment.text}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}