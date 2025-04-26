import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Components.css';
import { useBalance } from '../context/BalanceContext';

const Card = ({ id, title, price, bodyText, imageSrc, rarity, type, onCardPurchased }) => {
  const navigate = useNavigate();
  const [purchasing, setPurchasing] = useState(false);
  const { updateBalance } = useBalance();
  
  const handleCardClick = () => {
    navigate(`/pokemon/${id}?source=browse&price=${price}`);
  };
  
  const handlePurchase = async (e) => {
    e.stopPropagation(); // Prevent navigating to the card details page
    
    if (purchasing) return;
    setPurchasing(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('You must be logged in to purchase cards');
        setPurchasing(false);
        return;
      }
      
      const response = await fetch('https://pokejackets-93oe.onrender.com/api/purchase/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({
          card_id: id,
          price: price
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        alert(`Purchase failed: ${data.message || 'Unknown error'}`);
      } else {
        alert(data.message || 'Card purchased successfully!');
        
        // Update the global balance
        if (data.balance !== undefined) {
          updateBalance(data.balance);
        }
      }
    } catch (err) {
      alert(`Purchase failed: ${err.message || 'Unknown error'}`);
    } finally {
      setPurchasing(false);
    }
  };
  
  return (
    <div className="card" onClick={handleCardClick}>
      <div className="card-image">
        {imageSrc ? (
          <img src={imageSrc} alt={title} className="card-pokemon-image" />
        ) : (
          <div className="placeholder-image"></div>
        )}
      </div>
      <div className="card-content">
        <p className="card-title">{title}</p>
        <p className="card-price">${price}</p>
        <p className="card-body">{bodyText}</p>
        {rarity && type && (
          <p className="card-details">
            {rarity} - {type}
          </p>
        )}
      </div>
      {rarity && price > 0 && (
        <button 
          className="buy-now-btn"
          onClick={handlePurchase}
          disabled={purchasing}
        >
          {purchasing ? 'Buying...' : 'Buy Now'}
        </button>
      )}
    </div>
  );
};

export default Card; 