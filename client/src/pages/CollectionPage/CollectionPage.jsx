import React, { useState, useEffect } from 'react';
import './CollectionPage.css';
import Navbar from '../../components/Navbar';
import Card from '../../components/Card';

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
