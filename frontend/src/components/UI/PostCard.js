// frontend/src/components/UI/PostCard.js
import React, { useState } from 'react';
import axios from 'axios';
import '../../styles/glassmorphism.css';

export default function PostCard({ post, onInteraction }) {
  const [isLiking, setIsLiking] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Ensure comments array exists, even for older posts
  const comments = post.comments || [];

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    const token = localStorage.getItem('token');
    try {
      await axios.post(`http://127.0.0.1:5000/api/posts/${post.id}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Tell the Feed page to refresh the posts
      if (onInteraction) onInteraction();
    } catch (error) {
      console.error('Error liking post', error);
    }
    setIsLiking(false);
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || isSubmitting) return;
    setIsSubmitting(true);
    const token = localStorage.getItem('token');
    
    try {
      await axios.post(`http://127.0.0.1:5000/api/posts/${post.id}/comment`, 
        { text: commentText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCommentText('');
      // Tell the Feed page to refresh the posts
      if (onInteraction) onInteraction();
    } catch (error) {
      console.error('Error adding comment', error);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="glass-card" style={{ maxWidth: '100%', marginBottom: '2rem', padding: '2.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div style={{ fontWeight: '600', color: '#00c896', fontSize: '1.1rem' }}>{post.author_name}</div>
        <div style={{ fontSize: '0.85rem', color: '#718096', letterSpacing: '0.05em' }}>{post.created_at}</div>
      </div>
      
      <p style={{ color: '#ffffff', fontSize: '1.15rem', marginBottom: '2rem', lineHeight: '1.6' }}>
        {post.content}
      </p>

      {post.post_type === 'trade' && post.price && (
        <div style={{ 
          display: 'inline-block', 
          padding: '0.6rem 1.2rem', 
          background: 'rgba(124, 58, 237, 0.15)', 
          border: '1px solid rgba(124, 58, 237, 0.4)',
          borderRadius: '8px',
          fontWeight: '600',
          marginBottom: '2rem',
          color: '#e9d5ff'
        }}>
          Trade / List Price: ${post.price}
        </div>
      )}

      {/* Interaction Buttons */}
      <div style={{ display: 'flex', gap: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
        <span 
          onClick={handleLike}
          style={{ cursor: 'pointer', color: '#a0aec0', fontSize: '0.95rem', transition: 'color 0.2s' }}
        >
          👍 Like ({post.likes})
        </span>
        <span 
          onClick={() => setShowComments(!showComments)}
          style={{ cursor: 'pointer', color: '#a0aec0', fontSize: '0.95rem', transition: 'color 0.2s' }}
        >
          💬 Comments ({comments.length})
        </span>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
          {comments.map((c, i) => (
            <div key={i} style={{ marginBottom: '1rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.85rem', color: '#00c896', marginBottom: '0.3rem' }}>{c.author_name}</div>
              <div style={{ fontSize: '0.95rem', color: '#e2e8f0' }}>{c.text}</div>
            </div>
          ))}
          
          <form onSubmit={handleCommentSubmit} style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <input 
              type="text" 
              className="custom-input" 
              placeholder="Write a comment..." 
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              style={{ flex: 1, padding: '0.75rem' }}
            />
            <button type="submit" className="primary-btn" style={{ width: 'auto', marginTop: 0, padding: '0.75rem 1.5rem' }}>
              Post
            </button>
          </form>
        </div>
      )}
    </div>
  );
}