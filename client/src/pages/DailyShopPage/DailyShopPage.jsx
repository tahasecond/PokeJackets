import React, { useState, useEffect } from 'react';
import './DailyShopPage.css';
import Navbar from '../../components/Navbar';
import { useBalance } from '../../context/BalanceContext';
import { useNavigate } from 'react-router-dom';

const DailyShopPage = () => {
  const [shopItems, setShopItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [purchasing, setPurchasing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { balance, updateBalance } = useBalance();

  useEffect(() => {
    fetchShopItems();
  }, []);

  // Format the remaining time
  const formatTimeLeft = () => {
    if (timeLeft <= 0) return 'Ready to refresh';
    
    const hours = Math.floor(timeLeft / 3600);
    const minutes = Math.floor((timeLeft % 3600) / 60);
    const seconds = timeLeft % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeLeft]);

  const fetchShopItems = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      const response = await fetch('https://pokejackets-93oe.onrender.com/api/dailyshop/', {
        headers: {
          'Authorization': `Token ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch shop items');
      }

      const data = await response.json();
      setShopItems(data.shop_items || []);
      setTimeLeft(data.next_refresh_in_seconds || 0);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching shop items:', err);
      setError('Failed to load daily shop. Please try again later.');
      setLoading(false);
    }
  };

  const handlePurchase = async (itemId) => {
    if (purchasing) return;
    
    setPurchasing(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Authentication required');
        setPurchasing(false);
        return;
      }
      
      const response = await fetch('https://pokejackets-93oe.onrender.com/api/dailyshop/purchase/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({
          shop_item_id: itemId
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        alert(data.error || 'Failed to purchase item');
      } else {
        alert(data.message || 'Item purchased successfully!');
        updateBalance(data.new_balance);
        
        // Remove the purchased item from the display
        setShopItems(prevItems => prevItems.filter(item => item.id !== itemId));
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setPurchasing(false);
    }
  };

  const handleRefreshShop = async () => {
    if (refreshing) return;
    
    // Confirm with user because this costs money
    if (!confirm(`Refreshing the shop costs 500 PD. Your current balance is ${balance} PD. Continue?`)) {
      return;
    }
    
    setRefreshing(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Authentication required');
        setRefreshing(false);
        return;
      }
      
      const response = await fetch('https://pokejackets-93oe.onrender.com/api/dailyshop/refresh/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        alert(data.error || 'Failed to refresh shop');
      } else {
        alert(data.message || 'Shop refreshed successfully!');
        setShopItems(data.shop_items || []);
        setTimeLeft(data.next_refresh_in_seconds || 0);
        updateBalance(data.new_balance);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="daily-shop-container">
      <Navbar />
      <main className="daily-shop-main">
        <header className="daily-shop-header">
          <h1>Daily Shop</h1>
          <div className="shop-controls">
            <div className="refresh-timer">
              Next refresh: {formatTimeLeft()}
            </div>
            <button 
              className="refresh-shop-button" 
              onClick={handleRefreshShop}
              disabled={refreshing}
            >
              {refreshing ? 'Refreshing...' : 'Refresh Shop (500 PD)'}
            </button>
          </div>
        </header>

        {loading ? (
          <div className="loading">Loading daily shop items...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : shopItems.length === 0 ? (
          <div className="empty-shop">
            <p>The shop is currently empty. Check back later or refresh the shop for new items!</p>
          </div>
        ) : (
          <div className="shop-items-grid">
            {shopItems.map(item => (
              <ShopItem 
                key={item.id}
                item={item}
                onPurchase={handlePurchase}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

// Shop Item Component
const ShopItem = ({ item, onPurchase }) => {
  const [cardDetails, setCardDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchCardDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`https://pokejackets-93oe.onrender.com/api/pokemon/${item.pokemon_id}/`);
        if (response.ok) {
          const data = await response.json();
          setCardDetails(data.data);
        }
      } catch (err) {
        console.error(`Error fetching details for ${item.pokemon_id}:`, err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCardDetails();
  }, [item.pokemon_id]);
  
  const handleCardClick = () => {
    navigate(`/pokemon/${item.pokemon_id}?source=dailyshop&listingId=${item.id}&price=${item.price}`);
  };
  
  const handlePurchaseClick = (e) => {
    e.stopPropagation(); // Prevent navigating to details
    onPurchase(item.id);
  };
  
  return (
    <div className="shop-item" onClick={handleCardClick}>
      <div className="shop-item-image">
        {!loading && cardDetails?.images?.small ? (
          <img 
            src={cardDetails.images.small} 
            alt={item.pokemon_name} 
          />
        ) : (
          <div className="placeholder-image"></div>
        )}
      </div>
      <div className="shop-item-details">
        <h3 className="shop-item-name">{item.pokemon_name}</h3>
        <p className="shop-item-price">PD {item.price}</p>
        <p className="shop-item-rarity">{item.rarity}</p>
        {cardDetails && (
          <p className="shop-item-type">
            Type: {cardDetails.types ? cardDetails.types[0] : "Normal"}
          </p>
        )}
      </div>
      <button 
        className="purchase-button"
        onClick={handlePurchaseClick}
      >
        Purchase
      </button>
    </div>
  );
};

export default DailyShopPage;
