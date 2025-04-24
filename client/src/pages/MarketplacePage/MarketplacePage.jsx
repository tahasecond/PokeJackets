import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './MarketplacePage.css';
import SearchBar from '../../components/SearchBar';
import Card from '../../components/Card';
import Navbar from '../../components/Navbar';
import ListingCard from './ListingCard';

const MarketplacePage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [balance, setBalance] = useState(2500);
  const [pokemon, setPokemon] = useState([]);
  const [filteredPokemon, setFilteredPokemon] = useState([]);
  const [featuredPokemon, setFeaturedPokemon] = useState([]);
  const [carouselPokemon, setCarouselPokemon] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const cardsPerPage = 5;
  const apiPageSize = 20;

  // Fetch user balance on component mount
  useEffect(() => {
    const fetchUserBalance = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        const response = await fetch('http://127.0.0.1:8000/api/user/balance/', {
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
    const fetchListings = async () => {
      try {
        setListingsLoading(true);
        const response = await fetch('http://127.0.0.1:8000/api/marketplace/listings/');
        
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
    
    fetchListings();
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch(`http://127.0.0.1:8000/api/pokemon/?page=1&pageSize=${apiPageSize}${searchQuery ? `&q=${searchQuery}` : ''}`)
      .then((res) => res.json())
      .then((data) => {
        const pokemonData = data.data;
        setPokemon(pokemonData);
        setFilteredPokemon(pokemonData);
        
        // Calculate total pages based on total count from API
        const total = data.totalCount || pokemonData.length;
        setTotalPages(Math.ceil(total / cardsPerPage));
        
        // Select random Pokémon for featured and carousel sections
        const shuffled = [...pokemonData].sort(() => 0.5 - Math.random());
        setFeaturedPokemon(shuffled.slice(0, 4));
        
        const carouselShuffle = [...pokemonData].sort(() => 0.5 - Math.random());
        setCarouselPokemon(carouselShuffle.slice(0, 10));
        
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching Pokémon:', err);
        setLoading(false);
      });
  }, [searchQuery]);

  const handleSearch = (query) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Handle successful card purchase
  const handleCardPurchased = (newBalance) => {
    setBalance(newBalance);
    // Reload listings after purchase
    fetchListings();
  };

  const fetchListings = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/marketplace/listings/');
      
      if (!response.ok) {
        throw new Error('Failed to fetch listings');
      }
      
      const data = await response.json();
      setListings(data.listings || []);
    } catch (error) {
      console.error('Error fetching listings:', error);
    }
  };

  // Keep pagination logic client-side for the retrieved data
  const indexOfLastCard = currentPage * cardsPerPage;
  const indexOfFirstCard = indexOfLastCard - cardsPerPage;
  const currentCards = filteredPokemon.slice(indexOfFirstCard, indexOfLastCard);

  // Next/previous page navigation
  const nextPage = () => {
    // If we're at the end of our current data but not at the last page,
    // we might need to fetch more data (not implementing this for simplicity)
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Function to generate random price based on rarity
  const getPriceFromRarity = (rarity) => {
    switch(rarity) {
      case 'Common':
        return Math.floor(Math.random() * 20) + 5;
      case 'Uncommon':
        return Math.floor(Math.random() * 30) + 20;
      case 'Rare':
        return Math.floor(Math.random() * 50) + 50;
      case 'Rare Holo':
        return Math.floor(Math.random() * 100) + 100;
      case 'Rare Ultra':
        return Math.floor(Math.random() * 200) + 200;
      default:
        return Math.floor(Math.random() * 50) + 25;
    }
  };

  const handleListingPurchase = async (listingId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('You must be logged in to purchase listings');
        return;
      }

      const response = await fetch('http://127.0.0.1:8000/api/marketplace/buy-listing/', {
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
          <SearchBar 
            placeholder="Search for Cards" 
            onSearch={handleSearch} 
          />
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

        {loading ? (
          <div className="loading">Loading Pokémon cards...</div>
        ) : (
          <>
            <section className="featured-section">
              <h2 className="section-title">Featured</h2>
              <div className="featured-cards">
                {featuredPokemon.map(card => (
                  <Card 
                    key={card.id} 
                    id={card.id}
                    title={card.name} 
                    price={getPriceFromRarity(card.rarity)} 
                    bodyText={card.flavorText || `${card.name} - ${card.set.name}`} 
                    imageSrc={card.images.small}
                    rarity={card.rarity}
                    type={card.types ? card.types[0] : "Normal"}
                    onCardPurchased={handleCardPurchased}
                  />
                ))}
              </div>
            </section>
            
            <section className="browse-section">
              <div className="browse-header">
                <h2 className="section-title">Browse Cards</h2>
                <div className="filters">
                  <button className="filter-btn new-btn">New</button>
                  <button className="filter-btn">Price ascending</button>
                  <button className="filter-btn">Price descending</button>
                  <button className="filter-btn">Rarity</button>
                </div>
              </div>
              
              <div className="browse-cards-container">
                <button 
                  className="nav-btn prev-btn" 
                  onClick={prevPage}
                  disabled={currentPage === 1}
                >
                  ←
                </button>
                <div className="browse-cards">
                  {currentCards.map(card => (
                    <Card 
                      key={card.id} 
                      id={card.id}
                      title={card.name} 
                      price={getPriceFromRarity(card.rarity)} 
                      bodyText={card.flavorText || `${card.name} - ${card.set.name}`}
                      imageSrc={card.images.small}
                      rarity={card.rarity}
                      type={card.types ? card.types[0] : "Normal"}
                      onCardPurchased={handleCardPurchased}
                    />
                  ))}
                </div>
                <button 
                  className="nav-btn next-btn" 
                  onClick={nextPage}
                  disabled={currentPage >= totalPages}
                >
                  →
                </button>
              </div>
              <div className="pagination-info">
                Page {currentPage} of {totalPages}
              </div>
            </section>
            
            <section className="carousel-section">
              <h2 className="section-title">Popular Cards</h2>
              <div className="cards-carousel">
                {carouselPokemon.map(card => (
                  <div key={card.id} className="carousel-item">
                    <img src={card.images.small} alt={card.name} className="carousel-image" />
                    <div className="carousel-info">
                      <p className="carousel-name">{card.name}</p>
                      <p className="carousel-rarity">{card.rarity}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default MarketplacePage;
