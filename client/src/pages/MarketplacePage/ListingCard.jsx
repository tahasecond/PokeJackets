import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ListingCard.css';
import { useBalance } from '../../context/BalanceContext';

const ListingCard = ({ listing, onPurchase }) => {
  const navigate = useNavigate();
  const [cardDetails, setCardDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const { updateBalance } = useBalance();

  useEffect(() => {
    const fetchCardDetails = async () => {
      try {
        // Get card details from Pokemon TCG API
        const response = await fetch(`https://api.pokemontcg.io/v2/cards/${listing.pokemon_id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch card details');
        }
        
        const data = await response.json();
        setCardDetails(data.data);
      } catch (error) {
        console.error('Error fetching card details:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCardDetails();
  }, [listing.pokemon_id]);

  const handleCardClick = () => {
    navigate(`/pokemon/${listing.pokemon_id}`);
  };
  
  const handlePurchase = async (e) => {
    e.stopPropagation(); // Prevent navigating to details
    
    if (purchasing) return;
    setPurchasing(true);
    
    try {
      const response = await onPurchase(listing.id);
      if (!response.ok) {
        alert(`Purchase failed: ${response.message || 'Unknown error'}`);
      } else {
        alert(response.message || 'Purchase successful!');
        
        // Update the global balance
        if (response.balance !== undefined) {
          updateBalance(response.balance);
        }
      }
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="listing-card loading-card">
        <div className="loading-indicator">Loading...</div>
      </div>
    );
  }

  return (
    <div className="listing-card" onClick={handleCardClick}>
      <div className="listing-card-image">
        {cardDetails?.images?.small ? (
          <img 
            src={cardDetails.images.small} 
            alt={listing.pokemon_name} 
            className="listing-pokemon-image"
          />
        ) : (
          <div className="placeholder-image"></div>
        )}
      </div>
      <div className="listing-card-content">
        <p className="listing-card-title">{listing.pokemon_name}</p>
        <p className="listing-card-price">PD {listing.price}</p>
        {cardDetails && (
          <p className="listing-card-details">
            {cardDetails.rarity} - {cardDetails.types?.[0] || "Normal"}
          </p>
        )}
        <p className="listing-card-seller">Seller: {listing.seller}</p>
        {listing.notes && (
          <p className="listing-card-notes">{listing.notes}</p>
        )}
      </div>
      <button 
        className="buy-listing-btn"
        onClick={handlePurchase}
        disabled={purchasing}
      >
        {purchasing ? 'Buying...' : 'Buy Now'}
      </button>
    </div>
  );
};

export default ListingCard; 