import React, { useState, useEffect } from 'react';
import './CollectionPage.css';
import Navbar from '../../components/Navbar';
import Card from '../../components/Card';
import SellModal from './SellModal';
import { useNavigate } from 'react-router-dom';

/**
 * Collection Page Component
 * 
 * Displays all Pokemon cards in the user's collection.
 * 
 * How the collection system works:
 * 1. Cards are added to a user's collection in the Django admin
 * 2. Each card is stored by its unique Pokemon TCG API ID (e.g., "ex8-4")
 * 3. This component fetches the user's collection from the backend
 * 4. The backend retrieves the complete card data for each ID
 * 5. Cards are displayed using the same Card component as the marketplace
 * 6. When a card is clicked, it navigates to the Pokemon stats page
 * 
 * Collection data flow:
 * Admin adds card → Django stores user+card_id → Frontend fetches collection → 
 * Backend gets full card data → Frontend displays cards
 */
const CollectionPage = () => {
  const [collection, setCollection] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sellModalOpen, setSellModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [activeListings, setActiveListings] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCollection();
    fetchUserListings();
  }, []);

  const fetchCollection = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      const response = await fetch('http://127.0.0.1:8000/api/collection/', {
        headers: {
          'Authorization': `Token ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch collection');
      }

      const data = await response.json();
      setCollection(data.data || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching collection:', err);
      setError('Failed to load your collection. Please try again later.');
      setLoading(false);
    }
  };

  const fetchUserListings = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://127.0.0.1:8000/api/marketplace/my-listings/', {
        headers: {
          'Authorization': `Token ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user listings');
      }

      const data = await response.json();
      // Filter to only active listings
      const active = data.listings ? data.listings.filter(listing => listing.is_active) : [];
      setActiveListings(active);
    } catch (err) {
      console.error('Error fetching user listings:', err);
    }
  };

  const handleSellClick = (card) => {
    setSelectedCard(card);
    setSellModalOpen(true);
  };

  const handleCloseSellModal = () => {
    setSellModalOpen(false);
    setSelectedCard(null);
  };

  const handleListingCreated = () => {
    // Refresh both the collection and the listings after creating a listing
    fetchCollection();
    fetchUserListings();
    setSellModalOpen(false);
    setSelectedCard(null);
  };

  const handleCancelListing = async (listingId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Authentication required');
        return;
      }

      const response = await fetch('http://127.0.0.1:8000/api/marketplace/cancel-listing/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({
          listing_id: listingId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || 'Failed to cancel listing');
      } else {
        alert('Listing has been removed from the marketplace.');
        // Refresh listings and collection after cancelling
        fetchUserListings();
        fetchCollection();
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const isCardListed = (cardId) => {
    return activeListings.some(listing => listing.pokemon_id === cardId);
  };

  const getListingDetails = (cardId) => {
    return activeListings.find(listing => listing.pokemon_id === cardId);
  };

  const handleViewStats = (card) => {
    navigate(`/pokemon/${card.id}?source=collection&owner=true`);
  };

  return (
    <div className="collection-container">
      <Navbar />
      <main className="collection-main">
        <div className="collection-header">
          <h1>My Pokémon Collection</h1>
        </div>

        {loading ? (
          <div className="loading">Loading your collection...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : collection.length === 0 ? (
          <div className="empty-collection">
            <p>Your collection is empty. Visit the marketplace to get some cards!</p>
          </div>
        ) : (
          <div className="collection-grid">
            {collection.map(card => {
              const isListed = isCardListed(card.id);
              const listingDetails = isListed ? getListingDetails(card.id) : null;
              
              return (
                <div className="card-container" key={card.id}>
                  <Card
                    id={card.id}
                    title={card.name}
                    price={0} // Not for sale in collection view
                    bodyText={card.flavorText || `${card.name} - ${card.set?.name || 'Collection'}`}
                    imageSrc={card.images?.small}
                    rarity={card.rarity}
                    type={card.types ? card.types[0] : "Normal"}
                  />
                  <div className="card-actions">
                    <button 
                      className="view-stats-button" 
                      onClick={() => handleViewStats(card)}
                    >
                      View Stats
                    </button>
                    
                    {isListed ? (
                      <div className="listing-status">
                        <p className="listed-price">Listed for: PD {listingDetails.price}</p>
                        <button 
                          className="cancel-listing-button" 
                          onClick={() => handleCancelListing(listingDetails.id)}
                        >
                          Remove from Marketplace
                        </button>
                      </div>
                    ) : (
                      <button 
                        className="sell-card-button" 
                        onClick={() => handleSellClick(card)}
                      >
                        Sell this Card
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {sellModalOpen && selectedCard && (
          <SellModal 
            card={selectedCard} 
            onClose={handleCloseSellModal} 
            onListingCreated={handleListingCreated}
          />
        )}
      </main>
    </div>
  );
};

export default CollectionPage;
