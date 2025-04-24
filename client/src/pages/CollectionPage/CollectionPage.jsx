import React, { useState, useEffect } from 'react';
import './CollectionPage.css';
import Navbar from '../../components/Navbar';
import Card from '../../components/Card';

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

  useEffect(() => {
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

    fetchCollection();
  }, []);

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
            {collection.map(card => (
              <Card
                key={card.id}
                id={card.id}
                title={card.name}
                price={0} // Not for sale
                bodyText={card.flavorText || `${card.name} - ${card.set?.name || 'Collection'}`}
                imageSrc={card.images?.small}
                rarity={card.rarity}
                type={card.types ? card.types[0] : "Normal"}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default CollectionPage;
