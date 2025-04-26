import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useBalance } from '../context/BalanceContext';
import './Components.css';

const Navbar = () => {
  const location = useLocation();
  const [username, setUsername] = useState("Trainer");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { balance, loading } = useBalance();
  
  useEffect(() => {
    // Get user information from localStorage or API
    const token = localStorage.getItem('token');
    const storedUsername = localStorage.getItem('username');
    
    if (storedUsername) {
      setUsername(storedUsername);
    } else if (token) {
      fetchUserProfile(token);
    }
    
    // Close mobile menu when route changes
    setMobileMenuOpen(false);
  }, [location.pathname]);
  
  const fetchUserProfile = (token) => {
    fetch('https://pokejackets-93oe.onrender.com/api/user/profile/', {
      headers: {
        'Authorization': `Token ${token}`
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.username) {
        setUsername(data.username);
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
      localStorage.removeItem("username");
      window.location.href = '/';
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className="navbar">
      <div className="logo-container">
        <Link to="/" className="logo-link">
          <div className="logo-icon"></div>
          <span className="logo-text">PokeJackets</span>
        </Link>
      </div>
      
      <button className="mobile-menu-toggle" onClick={toggleMobileMenu} aria-label="Toggle menu">
        <span className="burger-icon"></span>
      </button>
      
      <nav className={`navigation ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <Link 
          to="/dailyshop" 
          className={`nav-button ${location.pathname === '/dailyshop' ? 'active' : ''}`}
        >
          Daily Shop
        </Link>
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
          className={`nav-button ${location.pathname === '/PokemonStatsPage' || location.pathname.includes('/pokemon/') ? 'active' : ''}`}
        >
          Stats
        </Link>
      </nav>
      
      <div className="user-info">
        <div className="balance-display">
          <span className="currency-symbol">P</span>
          {loading ? (
            <span className="balance-loading">...</span>
          ) : (
            <span className="balance-amount">{balance.toLocaleString()}</span>
          )}
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