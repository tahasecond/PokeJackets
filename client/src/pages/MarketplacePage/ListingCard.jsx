import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ListingCard.css';
import { useBalance } from '../../context/BalanceContext';

const ListingCard = ({ listing, onPurchase }) => {
  const navigate = useNavigate();
  const [cardDetails, setCardDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const { updateBalance } = useBalance();

  // Check if current user is the seller
  useEffect(() => {
    const checkOwnership = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch('http://127.0.0.1:8000/api/user/profile/', {
          headers: {
            'Authorization': `Token ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          // Check if logged in user is the seller
          setIsOwner(data.username === listing.seller);
        }
      } catch (error) {
        console.error('Error checking ownership:', error);
      }
    };

    checkOwnership();
  }, [listing.seller]);

  useEffect(() => {
    const fetchCardDetails = async () => {
      try {
        // Determine which API endpoint to use based on the card ID
        const isAiGenerated = listing.pokemon_id.startsWith('ai-');
        const fetchUrl = isAiGenerated
          ? `http://127.0.0.1:8000/api/aigen/cards/${listing.pokemon_id}/`
          : `http://127.0.0.1:8000/api/pokemon/${listing.pokemon_id}/`;
        
        const response = await fetch(fetchUrl);
        
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
    if (isOwner) {
      // If owner, navigate to the card with owner=true parameter
      navigate(`/pokemon/${listing.pokemon_id}?source=marketplace&listingId=${listing.id}&price=${listing.price}&owner=true`);
    } else {
      navigate(`/pokemon/${listing.pokemon_id}?source=marketplace&listingId=${listing.id}&price=${listing.price}`);
    }
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

  // Helper to determine if a card is AI-generated based on ID or source
  const isAiGenerated = listing.pokemon_id.startsWith('ai-') || cardDetails?.source === 'ai';

  return (
    <div className="listing-card" onClick={handleCardClick}>
      <div className="listing-card-image">
        {cardDetails?.images?.small ? (
          <img 
            src={cardDetails.images.small} 
            alt={listing.pokemon_name} 
            className="listing-pokemon-image"
            onError={(e) => {
              console.error('Image failed to load:', e);
              e.target.onerror = null;
              e.target.src = 'https://via.placeholder.com/245x342?text=Card+Image+Not+Available';
            }}
          />
        ) : (
          <div className="placeholder-image">
            <p>Image not available</p>
          </div>
        )}
        {isAiGenerated && <div className="ai-generated-badge">AI Generated</div>}
        {isOwner && <div className="owner-badge">Your Listing</div>}
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
      {!isOwner ? (
        <button 
          className="buy-listing-btn"
          onClick={handlePurchase}
          disabled={purchasing}
        >
          {purchasing ? 'Buying...' : 'Buy Now'}
        </button>
      ) : (
        <div className="own-listing-notice">Your card is listed for sale</div>
      )}
    </div>
  );
};

export default ListingCard; 