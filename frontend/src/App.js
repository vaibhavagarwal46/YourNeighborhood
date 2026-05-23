// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard'; // <-- Import the new landing page
import Feed from './pages/Feed';
import Profile from './pages/Profile';
import Businesses from './pages/Businesses';
import Inbox from './pages/Inbox';
import ChatbotWidget from './components/UI/ChatbotWidget';
import Marketplace from './pages/Marketplace';
import Community from './pages/Community';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/feed" element={<Feed />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/businesses" element={<Businesses />} />
        <Route path="/inbox" element={<Inbox />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/community" element={<Community />} />
      </Routes>
      
      <ChatbotWidget /> 
    </Router>
  );
}

export default App;