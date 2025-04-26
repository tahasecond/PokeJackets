import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './MarketplacePage.css';
import Navbar from '../../components/Navbar';
import ListingCard from './ListingCard';

const MarketplacePage = () => {
  const [balance, setBalance] = useState(2500);
  const [listings, setListings] = useState([]);
  const [listingsLoading, setListingsLoading] = useState(true);

  // Fetch user balance on component mount
  useEffect(() => {
    const fetchUserBalance = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        const response = await fetch('https://pokejackets-93oe.onrender.com/api/user/balance/', {
          headers: {
            'Authorization': `Token ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setBalance(data.balance);
        }
      } catch (error) {
        console.error('Error fetching user balance:', error);
      }
    };
    
    fetchUserBalance();
  }, []);

  // Fetch marketplace listings
  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      setListingsLoading(true);
      const response = await fetch('https://pokejackets-93oe.onrender.com/api/marketplace/listings/');
      
      if (!response.ok) {
        throw new Error('Failed to fetch listings');
      }
      
      const data = await response.json();
      setListings(data.listings || []);
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setListingsLoading(false);
    }
  };

  const handleListingPurchase = async (listingId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('You must be logged in to purchase listings');
        return;
      }

      const response = await fetch('https://pokejackets-93oe.onrender.com/api/marketplace/buy-listing/', {
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
        alert(`Purchase failed: ${data.message || 'Unknown error'}`);
      } else {
        alert(data.message || 'Purchase successful!');
        setBalance(data.balance);
        fetchListings();
      }
    } catch (err) {
      alert(`Purchase failed: ${err.message || 'Unknown error'}`);
    }
  };

  return (
    <div className="marketplace-container">
      <Navbar balance={balance} />
      <main className="marketplace-main">
        <div className="marketplace-controls">
          <Link to="/collection" className="sell-card-btn">Sell a Card</Link>
        </div>
        
        {/* User Listings Section */}
        <section className="user-listings-section">
          <h2 className="section-title">User Listings</h2>
          {listingsLoading ? (
            <div className="loading">Loading listings...</div>
          ) : listings.length === 0 ? (
            <div className="empty-listings">No cards are currently for sale</div>
          ) : (
            <div className="user-listings-grid">
              {listings.map(listing => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  onPurchase={handleListingPurchase}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default MarketplacePage;
