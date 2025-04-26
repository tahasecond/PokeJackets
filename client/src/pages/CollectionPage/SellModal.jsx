import React, { useState } from 'react';
import './SellModal.css';
import { useBalance } from '../../context/BalanceContext';

const SellModal = ({ card, onClose, onListingCreated }) => {
  const [price, setPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { fetchBalance } = useBalance();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      setError('Please enter a valid price');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch('https://pokejackets-93oe.onrender.com/api/marketplace/create-listing/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({
          pokemon_id: card.id,
          pokemon_name: card.name,
          price: parseFloat(price),
          notes: notes
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create listing');
      }
      
      alert('Your card has been listed for sale in the marketplace!');
      
      // Refresh the balance in case there was a listing fee
      fetchBalance();
      
      onListingCreated();
      
    } catch (err) {
      setError(err.message || 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sell-modal-overlay">
      <div className="sell-modal">
        <div className="sell-modal-header">
          <h2>Sell Card</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="sell-modal-content">
          <div className="card-preview">
            <img 
              src={card.images?.small} 
              alt={card.name} 
              className="card-image" 
            />
            <div className="card-details">
              <h3>{card.name}</h3>
              <p>Rarity: {card.rarity}</p>
              <p>Type: {card.types ? card.types[0] : "Normal"}</p>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="sell-form">
            <div className="form-group">
              <label htmlFor="price">Price (PD):</label>
              <input
                type="number"
                id="price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Enter price"
                min="1"
                step="1"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="notes">Notes (optional):</label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about your card..."
                rows="3"
              />
            </div>
            
            {error && <div className="error-message">{error}</div>}
            
            <div className="form-actions">
              <button 
                type="button" 
                className="cancel-button" 
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="confirm-button"
                disabled={loading}
              >
                {loading ? 'Listing...' : 'List for Sale'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SellModal; 