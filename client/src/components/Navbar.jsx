import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Components.css';

const Navbar = ({ balance = 2500 }) => {
  const location = useLocation();
  const [username, setUsername] = useState("Trainer");
  
  useEffect(() => {
    // Get user information from localStorage or API
    const token = localStorage.getItem('token');
    const storedUsername = localStorage.getItem('username');
    
    if (storedUsername) {
      setUsername(storedUsername);
    } else {
      // If no username in localStorage, fetch from API if token exists
      if (token) {
        fetchUserProfile(token);
      }
    }
  }, []);
  
  const fetchUserProfile = (token) => {
    fetch('http://127.0.0.1:8000/api/user/profile/', {
      headers: {
        'Authorization': `Token ${token}`
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.username) {
        setUsername(data.username);
        // Store for future use
        localStorage.setItem('username', data.username);
      }
    })
    .catch(error => {
      console.error('Error fetching user profile:', error);
    });
  };
  
  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('');
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("username"); // Also remove username
      window.location.href = '/';
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <header className="navbar">
      <div className="logo-container">
        <Link to="/" className="logo-link">
          <div className="logo-icon"></div>
          <span className="logo-text">PokeJackets</span>
        </Link>
      </div>
      
      <nav className="navigation">
        <Link 
          to="/marketplace" 
          className={`nav-button ${location.pathname === '/marketplace' ? 'active' : ''}`}
        >
          Marketplace
        </Link>
        <Link 
          to="/aigeneration" 
          className={`nav-button ${location.pathname === '/aigeneration' ? 'active' : ''}`}
        >
          AI Creation
        </Link>
        <Link 
          to="/trading" 
          className={`nav-button ${location.pathname === '/trading' ? 'active' : ''}`}
        >
          Trading
        </Link>
        <Link 
          to="/collection" 
          className={`nav-button ${location.pathname === '/collection' ? 'active' : ''}`}
        >
          My Pokemon
        </Link>
        <Link 
          to="/PokemonStatsPage" 
          className={`nav-button ${location.pathname === '/PokemonStatsPage' ? 'active' : ''}`}
        >
          Stats
        </Link>
      </nav>
      
      <div className="user-info">
        <div className="balance-display">
          <span className="currency-symbol">P</span>
          <span className="balance-amount">{balance.toLocaleString()}</span>
        </div>
        <div className="user-profile">
          <span className="username">{username}</span>
          <div className="profile-avatar">{getInitials(username)}</div>
        </div>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </div>
    </header>
  );
};

export default Navbar;