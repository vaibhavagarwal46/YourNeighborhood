// frontend/src/pages/Marketplace.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/UI/Navbar';
import FloatingCity from '../components/3D/FloatingCity';
import '../styles/glassmorphism.css';

export default function Marketplace() {
  const [products, setProducts] = useState([]);
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const [cart, setCart] = useState([]);
  
  // Dashboard Sub-View Controls
  const [activeTab, setActiveTab] = useState('shop'); // Views: 'shop' | 'sales' | 'purchases'
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [isCheckoutView, setIsCheckoutView] = useState(false); 
  
  // Order Backlog State Vectors
  const [sellerOrders, setSellerOrders] = useState([]);
  const [buyerOrders, setBuyerOrders] = useState([]);

  // Expanded View Modal States
  const [viewingProduct, setViewingProduct] = useState(null); 
  const [fullscreenImage, setFullscreenImage] = useState(null); 
  const [editingProduct, setEditingProduct] = useState(null); 

  // Form Parameters
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Home Goods');
  const [images, setImages] = useState([]);
  // eslint-disable-next-line
  const [isUploading, setIsUploading] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery'); 
  const [deliveryAddress, setDeliveryAddress] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const initMarketplace = async () => {
      const token = localStorage.getItem('token');
      if (!token) { navigate('/'); return; }
      try {
        const profileRes = await axios.get('http://127.0.0.1:5000/api/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCurrentUserEmail(profileRes.data.email);
        fetchProducts(token);
        fetchOrders(token);
      } catch (error) {
        if (error.response?.status === 401) navigate('/');
      }
    };
    initMarketplace();
    // eslint-disable-next-line
  }, [navigate]);

  const fetchProducts = async (token = localStorage.getItem('token')) => {
    try {
      const response = await axios.get('http://127.0.0.1:5000/api/products', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(response.data);
    } catch (error) {
      console.error("Failed to load products", error);
    }
  };

  const fetchOrders = async (token = localStorage.getItem('token')) => {
    try {
      const sellerRes = await axios.get('http://127.0.0.1:5000/api/orders/seller', { headers: { Authorization: `Bearer ${token}` } });
      setSellerOrders(sellerRes.data);
      const buyerRes = await axios.get('http://127.0.0.1:5000/api/orders/buyer', { headers: { Authorization: `Bearer ${token}` } });
      setBuyerOrders(buyerRes.data);
    } catch (error) {
      console.error("Failed loading order listings pipeline logs");
    }
  };

  const addToCart = (product) => {
    setCart(prev => [...prev, product]);
    if (viewingProduct) setViewingProduct(null); 
  };

  const removeFromCart = (indexToRemove) => {
    setCart(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const cartTotal = cart.reduce((sum, item) => sum + parseFloat(item.price), 0).toFixed(2);

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;
    setIsCheckingOut(true);
    const token = localStorage.getItem('token');
    try {
      await axios.post('http://127.0.0.1:5000/api/checkout', 
        { cart, total: cartTotal, payment_method: paymentMethod, delivery_address: deliveryAddress },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCart([]);
      setIsCheckoutView(false);
      setDeliveryAddress('');
      fetchOrders(token); // Reload tracking records
      setActiveTab('purchases'); // Bounce buyer automatically to their history logs
      alert(`Order placed successfully via ${paymentMethod}!`);
    } catch (error) {
      alert("Order dispatch failure.");
    }
    setIsCheckingOut(false);
  };

  // --- SELLER FLUID STATUS ADVANCEMENT INTERFACE CONTROL ---
  const handleUpdateStatus = async (orderId, newStatus) => {
    const token = localStorage.getItem('token');
    try {
      await axios.put(`http://127.0.0.1:5000/api/orders/${orderId}/status`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchOrders(token); // Update listing metrics in hot reload view
    } catch (error) {
      alert("Failed to advance shipping metrics.");
    }
  };

  const handleImageUpload = async (e, setTargetArray) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setIsUploading(true);
    const base64Promises = files.map(file => new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => resolve(reader.result);
    }));
    const base64Strings = await Promise.all(base64Promises);
    setTargetArray(prev => [...(prev || []), ...base64Strings]);
    setIsUploading(false);
  };

  const handleListProduct = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      await axios.post('http://127.0.0.1:5000/api/products', 
        { title, description, price, category, images },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsSellModalOpen(false);
      setTitle(''); setPrice(''); setDescription(''); setImages([]);
      fetchProducts();
    } catch (error) {
      alert("Failed to list product.");
    }
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      await axios.put(`http://127.0.0.1:5000/api/products/${editingProduct.id}`, 
        { title: editingProduct.title, category: editingProduct.category, price: editingProduct.price, description: editingProduct.description, images: editingProduct.images },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditingProduct(null); 
      fetchProducts(); 
    } catch (error) {
      alert("Failed to update product changes.");
    }
  };

  const handleDeleteProduct = async (productId) => {
    const confirmDelete = window.confirm("Are you sure you want to permanently delete this listing?");
    if (!confirmDelete) return;
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`http://127.0.0.1:5000/api/products/${productId}`, { headers: { Authorization: `Bearer ${token}` } });
      setCart(prev => prev.filter(item => item.id !== productId));
      fetchProducts();
    } catch (error) {
      alert("Failed to delete product.");
    }
  };

  // Color mapper for statuses
  const getStatusColor = (status) => {
    switch(status) {
      case 'Pending Confirmation': return '#ffb900';
      case 'Preparing': return '#3498db';
      case 'Ready for Pickup': return '#7c3aed';
      case 'Out for Neighborhood Delivery': return '#00c896';
      case 'Completed': return '#a0aec0';
      default: return '#fff';
    }
  };

  return (
    <div className="page-container" style={{ flexDirection: 'column', alignItems: 'center', padding: '0 2rem 4rem 0' }}>
      <FloatingCity />

      {/* FULLSCREEN LIGHTBOX */}
      {fullscreenImage && (
        <div onClick={() => setFullscreenImage(null)} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.95)', zIndex: 10002, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out', padding: '2rem' }}>
          <img src={fullscreenImage} alt="Fullscreen" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '8px' }} />
        </div>
      )}

      {/* EXPANDED DETAILED VIEW MODAL */}
      {viewingProduct && !editingProduct && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '1000px', maxHeight: '90vh', overflowY: 'auto', padding: '3rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1.5rem' }}>
              <button onClick={() => setViewingProduct(null)} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>🔙 Back to Market</button>
              <span style={{ fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', color: '#7c3aed', background: 'rgba(124,58,237,0.1)', padding: '0.5rem 1rem', borderRadius: '4px' }}>{viewingProduct.category}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <h1 style={{ fontSize: '2.5rem', margin: '0', color: '#fff', fontWeight: '800' }}>{viewingProduct.title}</h1>
              <div style={{ textAlign: 'right' }}>
                <span style={{ display: 'block', fontSize: '2.5rem', fontWeight: '800', color: '#00c896' }}>${viewingProduct.price}</span>
                <span style={{ color: '#a0aec0', fontSize: '0.9rem' }}>Sold by: {viewingProduct.seller_name}</span>
              </div>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '12px', borderLeft: '4px solid #00c896', marginBottom: '2.5rem' }}>
              <p style={{ fontSize: '1.15rem', color: '#e2e8f0', margin: 0, lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{viewingProduct.description}</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '3rem' }}>
              {currentUserEmail !== viewingProduct.seller_email ? (
                <button onClick={() => addToCart(viewingProduct)} style={{ background: 'linear-gradient(90deg, #7c3aed, #00c896)', border: 'none', color: '#fff', padding: '1rem 3rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem' }}>+ Add to Cart</button>
              ) : (
                <span style={{ background: 'rgba(255,255,255,0.05)', color: '#7c3aed', padding: '1rem 3rem', borderRadius: '8px', fontWeight: 'bold', border: '1px solid rgba(124,58,237,0.3)' }}>This is your listing</span>
              )}
            </div>
            {viewingProduct.images && viewingProduct.images.length > 0 && (
              <div>
                <h3 style={{ fontSize: '1.5rem', color: '#fff', marginBottom: '1.5rem' }}>Product Gallery</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                  {viewingProduct.images.map((img, idx) => (
                    <img key={idx} src={img} alt="Gallery" onClick={() => setFullscreenImage(img)} style={{ width: '100%', height: '250px', objectFit: 'cover', borderRadius: '12px', cursor: 'zoom-in' }} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* EDIT PRODUCT MODAL */}
      {editingProduct && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-card" style={{ width: '90%', maxWidth: '600px', padding: '2.5rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 className="card-title" style={{ margin: 0 }}>Edit Product Listing</h2>
              <button onClick={() => setEditingProduct(null)} style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleUpdateProduct}>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <input type="text" className="custom-input" value={editingProduct.title} onChange={(e) => setEditingProduct({...editingProduct, title: e.target.value})} required style={{ flex: 2 }} />
                <input type="number" step="0.01" className="custom-input" value={editingProduct.price} onChange={(e) => setEditingProduct({...editingProduct, price: e.target.value})} required style={{ flex: 1 }} />
              </div>
              <select className="custom-input" value={editingProduct.category} onChange={(e) => setEditingProduct({...editingProduct, category: e.target.value})} style={{ marginBottom: '1.5rem', width: '100%' }}>
                <option value="Home Goods">Home Goods & Furniture</option>
                <option value="Electronics">Electronics</option>
                <option value="Clothing">Clothing & Accessories</option>
                <option value="Food & Produce">Local Food & Produce</option>
                <option value="Art & Crafts">Art & Handmade Crafts</option>
              </select>
              <textarea className="custom-input" rows="4" value={editingProduct.description} onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})} required style={{ resize: 'none', marginBottom: '1.5rem' }} />
              <div style={{ marginBottom: '2rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <span style={{ color: '#e2e8f0', fontWeight: '600' }}>Manage Photos</span>
                  <label style={{ cursor: 'pointer', background: '#00c896', color: '#050816', padding: '0.4rem 1rem', borderRadius: '8px', fontWeight: 'bold' }}>
                     Add Photos
                    <input type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={(e) => handleImageUpload(e, (updater) => setEditingProduct(prev => ({...prev, images: updater(prev.images)})))} />
                  </label>
                </div>
                {editingProduct.images && editingProduct.images.length > 0 && (
                  <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto' }}>
                    {editingProduct.images.map((imgStr, idx) => (
                      <div key={idx} style={{ position: 'relative', flexShrink: 0 }}>
                        <img src={imgStr} alt="preview" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
                        <button onClick={(e) => { e.preventDefault(); setEditingProduct({...editingProduct, images: editingProduct.images.filter((_, i) => i !== idx)}); }} style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px' }}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button type="submit" className="primary-btn" style={{ width: '100%' }}>Save Product Changes</button>
            </form>
          </div>
        </div>
      )}

      {/* CORE MARKETPLACE FRAME */}
      <div style={{ zIndex: 2, width: '100%', maxWidth: '1100px', padding: '0 2rem', margin: '0 auto', position: 'relative' }}>
        <Navbar />

        {/* --- VIEW SWITCHER TABS INTERFACE --- */}
        {!isCheckoutView && (
          <div style={{ display: 'flex', gap: '1rem', background: 'rgba(255,255,255,0.03)', padding: '0.4rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '2rem' }}>
            <button onClick={() => setActiveTab('shop')} style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.95rem', background: activeTab === 'shop' ? '#00c896' : 'transparent', color: activeTab === 'shop' ? '#050816' : '#a0aec0', transition: 'all 0.2s' }}> Shop Storefront</button>
            <button onClick={() => setActiveTab('sales')} style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.95rem', background: activeTab === 'sales' ? '#7c3aed' : 'transparent', color: activeTab === 'sales' ? '#fff' : '#a0aec0', transition: 'all 0.2s' }}> Incoming Sales Backlog ({sellerOrders.length})</button>
            <button onClick={() => setActiveTab('purchases')} style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.95rem', background: activeTab === 'purchases' ? 'rgba(255,255,255,0.1)' : 'transparent', color: activeTab === 'purchases' ? '#fff' : '#a0aec0', transition: 'all 0.2s' }}> My Purchase Tracking ({buyerOrders.length})</button>
          </div>
        )}

        {/* CONDITION A: RENDERING RE-ESTABLISHED CHECKOUT DISPATCH */}
        {isCheckoutView ? (
          <div style={{ marginTop: '2rem' }}>
            <div style={{ marginBottom: '2.5rem' }}>
              <button onClick={() => setIsCheckoutView(false)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '0.5rem 1.2rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>🔙 Return to Storefront</button>
              <h1 style={{ fontSize: '2.2rem', color: '#fff', marginTop: '1.5rem' }}>Review & Finalize Order</h1>
            </div>
            <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 500px' }}>
                <form onSubmit={handlePlaceOrder} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  <div className="glass-card" style={{ padding: '2rem', margin: 0 }}>
                    <h3 style={{ margin: '0 0 1rem 0', color: '#00c896' }}>1. Delivery Address / Drop Note</h3>
                    <textarea className="custom-input" rows="3" placeholder="Enter full block, tower code, or pickup parameters..." value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} required style={{ resize: 'none' }} />
                  </div>
                  <div className="glass-card" style={{ padding: '2rem', margin: 0 }}>
                    <h3 style={{ margin: '0 0 1.5rem 0', color: '#00c896' }}>2. Choose Payment Method</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem', background: paymentMethod === 'Cash on Delivery' ? 'rgba(0, 200, 150, 0.08)' : 'rgba(255,255,255,0.02)', border: paymentMethod === 'Cash on Delivery' ? '1px solid #00c896' : '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', cursor: 'pointer' }}>
                        <input type="radio" name="payment" value="Cash on Delivery" checked={paymentMethod === 'Cash on Delivery'} onChange={(e) => setPaymentMethod(e.target.value)} />
                        <div><strong style={{ color: '#fff' }}>💵 Cash on Delivery (COD)</strong></div>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem', background: paymentMethod === 'Online UPI Apps' ? 'rgba(124, 58, 237, 0.08)' : 'rgba(255,255,255,0.02)', border: paymentMethod === 'Online UPI Apps' ? '1px solid #7c3aed' : '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', cursor: 'pointer' }}>
                        <input type="radio" name="payment" value="Online UPI Apps" checked={paymentMethod === 'Online UPI Apps'} onChange={(e) => setPaymentMethod(e.target.value)} />
                        <div><strong style={{ color: '#fff' }}>📱 Online Instant UPI (GPay / PhonePe)</strong></div>
                      </label>
                    </div>
                  </div>
                  <button type="submit" disabled={isCheckingOut} className="primary-btn" style={{ background: 'linear-gradient(90deg, #7c3aed, #00c896)', margin: 0 }}>{isCheckingOut ? 'Fulfilling...' : `Confirm & Place Order ($${cartTotal})`}</button>
                </form>
              </div>
              <div className="glass-card" style={{ flex: '0 1 380px', padding: '2rem', margin: 0 }}>
                <h3 style={{ margin: '0 0 1.2rem 0', color: '#fff' }}>Order Summary</h3>
                {cart.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem', fontSize: '0.95rem', color: '#e2e8f0' }}>
                    <span>{item.title}</span><strong>${item.price}</strong>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: '800', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem', color: '#fff', marginTop: '3rem' }}>
                  <span>Total:</span><span style={{ color: '#00c896' }}>${cartTotal}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: '800', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem', color: '#fff', marginTop: '5rem' }}>
                  <span>Proceed to payout</span><span style={{ color: '#00c896' }}>${cartTotal}</span>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'sales' ? (
          
          /* --- CONDITION B: RENDERING INCOMING SELLER SALES BACKLOG --- */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <h2 style={{ color: '#fff', margin: '1rem 0 0 0' }}>Incoming Sales Fulfillments</h2>
            {sellerOrders.length === 0 ? (
              <p style={{ color: '#a0aec0', fontStyle: 'italic', textAlign: 'center', padding: '3rem' }}>No pending neighbor orders found in your system queue yet.</p>
            ) : (
              sellerOrders.map(order => (
                <div key={order.id} className="glass-card" style={{ padding: '2.5rem', borderLeft: `4px solid ${getStatusColor(order.status)}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div>
                      <span style={{ color: getStatusColor(order.status), fontWeight: '800', textTransform: 'uppercase', fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', padding: '0.3rem 0.8rem', borderRadius: '4px' }}>{order.status}</span>
                      <h3 style={{ color: '#fff', margin: '0.75rem 0 0.2rem 0' }}>Ordered by: {order.buyer_name}</h3>
                      <span style={{ fontSize: '0.85rem', color: '#718096' }}>Received: {order.created_at} | Routing: <strong>{order.payment_method}</strong></span>
                    </div>
                    
                    {/* Interactive Fulfillment Control Panel Deck */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                      <label style={{ fontSize: '0.75rem', color: '#a0aec0', fontWeight: '700' }}>ADVANCE SHIPPING STATE</label>
                      <select 
                        className="custom-input" value={order.status} 
                        onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                        style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', cursor: 'pointer', border: `1px solid ${getStatusColor(order.status)}` }}
                      >
                        <option value="Pending Confirmation"style={{ backgroundColor: '#05020a' }}>Pending Confirmation</option>
                        <option value="Preparing"style={{ backgroundColor: '#05020a' }}>Preparing Order</option>
                        <option value="Ready for Pickup"style={{ backgroundColor: '#05020a' }}>Ready for Pickup</option>
                        <option value="Out for Neighborhood Delivery"style={{ backgroundColor: '#05020a' }}>Out for Delivery</option>
                        <option value="Completed"style={{ backgroundColor: '#05020a' }}>Completed / Handed Over</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ padding: '1rem 1.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', marginBottom: '1.5rem' }}>
                    <div style={{ color: '#718096', fontSize: '0.8rem', fontWeight: '700', marginBottom: '0.4rem' }}>DROP DESK PARCEL NOTE</div>
                    <p style={{ color: '#e2e8f0', margin: 0, fontSize: '0.95rem' }}>{order.delivery_address}</p>
                  </div>

                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
                    {order.items.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', color: '#a0aec0', fontSize: '0.95rem', margin: '0.4rem 0' }}>
                        <span>• {item.title}</span><strong>${item.price}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : activeTab === 'purchases' ? (
          
          /* --- CONDITION C: RENDERING LIVE BUYER PURCHASE TRACKING TRACKS --- */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <h2 style={{ color: '#fff', margin: '1rem 0 0 0' }}>My Outbound Purchases</h2>
            {buyerOrders.length === 0 ? (
              <p style={{ color: '#a0aec0', fontStyle: 'italic', textAlign: 'center', padding: '3rem' }}>You haven't purchased any marketplace items yet.</p>
            ) : (
              buyerOrders.map(order => (
                <div key={order.id} className="glass-card" style={{ padding: '2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: '#718096' }}>Placed on: {order.created_at}</span>
                      <div style={{ marginTop: '0.2rem', fontSize: '1.1rem', color: '#fff' }}>Total Paid: <strong style={{ color: '#00c896' }}>${order.total}</strong></div>
                    </div>
                    
                    {/* Live delivery metric tag overlay layout */}
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.6rem 1.2rem', borderRadius: '8px', border: `1px solid ${getStatusColor(order.status)}` }}>
                      <span style={{ fontSize: '0.75rem', color: '#a0aec0', display: 'block', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '0.2rem' }}>Fulfillment Step</span>
                      <strong style={{ color: getStatusColor(order.status), fontSize: '1rem', backgroundColor: '#05020a' }}>
                        {order.status === 'Pending Confirmation' && '⏳ Awaiting Seller Check'}
                        {order.status === 'Preparing' && '👨‍🍳 Seller Packing Items'}
                        {order.status === 'Ready for Pickup' && '🏬 Ready for neighbour Pickup'}
                        {order.status === 'Out for Delivery' && 'Already Out for delivery !'}
                        {order.status === 'Completed' && '✓ Parcel Delivered'}
                      </strong>
                    </div>
                  </div>

                  <div>
                    {order.items.map((item, idx) => (
                      <div key={idx} style={{ color: '#e2e8f0', fontSize: '0.9rem', margin: '0.3rem 0' }}>
                        🛍️ {item.title} – <span style={{ color: '#718096' }}>Seller Email: {item.seller_email}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          
          /* CONDITION D: STANDARD SHOPPING STOREFRONT GRID WINDOW */
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '2rem 0 3rem 0' }}>
              <div>
                <h1 style={{ fontSize: '2.5rem', color: '#fff', margin: '0 0 0.5rem 0' }}>Neighborhood Market</h1>
                <p style={{ color: '#a0aec0', fontSize: '1.1rem', margin: 0 }}>Shop locally, support your neighbors.</p>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={() => setIsSellModalOpen(true)} style={{ background: 'transparent', border: '1px solid #00c896', color: '#00c896', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}> Sell an Item</button>
                <button onClick={() => setIsCartOpen(true)} style={{ position: 'relative', background: 'linear-gradient(90deg, #7c3aed, #00c896)', border: 'none', color: '#fff', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                   Cart
                  {cart.length > 0 && <span style={{ background: '#050816', color: '#00c896', padding: '0.2rem 0.6rem', borderRadius: '50%', fontSize: '0.8rem' }}>{cart.length}</span>}
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' }}>
              {products.map(product => (
                <div key={product.id} className="glass-card" onClick={() => setViewingProduct(product)} style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative', cursor: 'pointer', transition: 'transform 0.2s' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
                  {currentUserEmail === product.seller_email && (
                    <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '0.5rem', zIndex: 5 }}>
                      <button onClick={(e) => { e.stopPropagation(); setEditingProduct(product); }} style={{ background: 'rgba(5, 8, 22, 0.85)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem' }}>✏️ Edit</button>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteProduct(product.id); }} style={{ background: 'rgba(5, 8, 22, 0.85)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#ef4444', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem' }}>🗑️ Delete</button>
                    </div>
                  )}
                  {product.images.length > 0 ? <img src={product.images[0]} alt="product" style={{ width: '100%', height: '200px', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '200px', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a0aec0' }}>No Image</div>}
                  <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <h3 style={{ margin: 0, color: '#fff', fontSize: '1.2rem', paddingRight: '2.5rem' }}>{product.title}</h3>
                      <span style={{ color: '#00c896', fontWeight: '800', fontSize: '1.2rem' }}>${product.price}</span>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: '#7c3aed', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '1rem' }}>{product.category}</span>
                    <p style={{ color: '#a0aec0', fontSize: '0.9rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{product.description}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                      <span style={{ color: '#718096', fontSize: '0.8rem' }}>By: {product.seller_name}</span>
                      {currentUserEmail !== product.seller_email ? (
                        <button onClick={(e) => { e.stopPropagation(); addToCart(product); }} style={{ background: 'rgba(0,200,150,0.1)', color: '#00c896', border: '1px solid #00c896', padding: '0.4rem 1rem', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.85rem' }}>+ Add</button>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: '#7c3aed', fontStyle: 'italic', fontWeight: '600' }}>Your Item</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* FLOATING CART SLIDE SIDEBAR */}
      {isCartOpen && (
        <div style={{ position: 'fixed', top: 0, right: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', zIndex: 10000, display: 'flex', justifyContent: 'flex-end' }}>
          <div className="glass-card" style={{ width: '400px', height: '100%', margin: 0, borderRadius: '0', display: 'flex', flexDirection: 'column' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, color: '#fff' }}>Your Cart</h2>
              <button onClick={() => setIsCartOpen(false)} style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
            </div>

            {/* Cart Items List */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '0.5rem' }}>
              {cart.length === 0 ? (
                <p style={{ color: '#a0aec0', textAlign: 'center', marginTop: '2rem' }}>Your cart is empty.</p>
              ) : (
                cart.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 0.3rem 0', color: '#fff', fontSize: '1rem' }}>{item.title}</h4>
                      <div style={{ color: '#00c896', fontWeight: 'bold' }}>${item.price}</div>
                    </div>
                    <button onClick={() => removeFromCart(idx)} style={{ background: 'transparent', color: '#718096', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>🗑️</button>
                  </div>
                ))
              )}
            </div>

            {/* Total Summary & Checkout Button Footer Block */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem', marginTop: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
                <span>Total:</span>
                <span style={{ color: '#00c896' }}>${cartTotal}</span>
              </div>
              
              <button 
                onClick={() => { setIsCartOpen(false); setIsCheckoutView(true); }} 
                disabled={cart.length === 0} 
                className="primary-btn" 
                style={{ 
                  width: '100%', 
                  margin: 0, 
                  marginBottom: '5.5rem',
                  padding: '1rem',
                  background: cart.length === 0 ? 'rgba(255, 255, 255, 0.05)' : 'linear-gradient(90deg, #7c3aed, #00c896)',
                  color: cart.length === 0 ? '#718096' : '#fff',
                  cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
                  border: cart.length === 0 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                  opacity: cart.length === 0 ? 0.6 : 1
                }}
              >
                Proceed to Checkout
              </button>
            </div>

          </div>
        </div>
      )}

      {/* SELL AN ITEM MODAL */}
      {isSellModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-card" style={{ width: '90%', maxWidth: '600px', padding: '2.5rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 className="card-title" style={{ margin: 0 }}>List an Item for Sale</h2>
              <button onClick={() => setIsSellModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleListProduct}>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <input type="text" className="custom-input" placeholder="Product Title" value={title} onChange={(e) => setTitle(e.target.value)} required style={{ flex: 2 }} />
                <input type="number" step="0.01" className="custom-input" placeholder="Price ($)" value={price} onChange={(e) => setPrice(e.target.value)} required style={{ flex: 1 }} />
              </div>
              <select className="custom-input" value={category} onChange={(e) => setCategory(e.target.value)} style={{ marginBottom: '1.5rem', width: '100%' }}>
                <option value="Home Goods"style={{ backgroundColor: '#05020a' }}>Home Goods & Furniture</option>
                <option value="Electronics"style={{ backgroundColor: '#05020a' }}>Electronics</option>
                <option value="Clothing"style={{ backgroundColor: '#05020a' }}>Clothing & Accessories</option>
                <option value="Food & Produce"style={{ backgroundColor: '#05020a' }}>Local Food & Produce</option>
                <option value="Art & Crafts"style={{ backgroundColor: '#05020a' }}>Art & Handmade Crafts</option>
              </select>
              <textarea className="custom-input" rows="4" placeholder="Describe your item..." value={description} onChange={(e) => setDescription(e.target.value)} required style={{ resize: 'none', marginBottom: '1.5rem' }} />
              <div style={{ marginBottom: '2rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <span style={{ color: '#e2e8f0', fontWeight: '600' }}>Product Photos</span>
                  <label style={{ cursor: 'pointer', background: '#00c896', color: '#050816', padding: '0.4rem 1rem', borderRadius: '8px', fontWeight: 'bold' }}>
                    📸 Add Photos
                    <input type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={(e) => handleImageUpload(e, setImages)} />
                  </label>
                </div>
                {images.length > 0 && (
                  <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto' }}>
                    {images.map((imgStr, idx) => (
                      <div key={idx} style={{ position: 'relative', flexShrink: 0 }}>
                        <img src={imgStr} alt="preview" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
                        <button onClick={(e) => { e.preventDefault(); setImages(images.filter((_, i) => i !== idx)); }} style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px' }}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button type="submit" className="primary-btn" style={{ width: '100%' }}>Publish to Marketplace</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}