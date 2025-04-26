import React, { useState, useEffect, useRef, useCallback } from 'react';
import "./PokemonStatsPage.css"
import { Link, useParams, useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { useBalance } from '../../context/BalanceContext';

const PokemonStatsPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { balance, updateBalance } = useBalance();
  const [pokemon, setPokemon] = useState([]);
  const [filteredPokemon, setFilteredPokemon] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedPokemon, setSelectedPokemon] = useState(null);
  const [carouselPokemon, setCarouselPokemon] = useState([]);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [purchasing, setPurchasing] = useState(false);
  const [listingId, setListingId] = useState(null);
  const [price, setPrice] = useState(null);
  const [sourceType, setSourceType] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const observer = useRef();

  useEffect(() => {
    if (id) {
      // If we have an ID parameter, just fetch that specific card
      fetchSinglePokemon(id);
      
      // Check if we came from a marketplace or daily shop item
      const params = new URLSearchParams(location.search);
      const source = params.get('source');
      const lid = params.get('listingId');
      const p = params.get('price');
      
      if (source) {
        setSourceType(source);
        if (lid) setListingId(lid);
        if (p) setPrice(parseInt(p, 10));
      }
    } else {
      // Just load featured/random cards for initial view
      fetchFeaturedPokemon();
      // Clear search term when on the landing page
      setSearchTerm('');
      setSelectedPokemon(null);
      setFilteredPokemon([]);
      // Reset pagination for infinite scroll
      setPage(1);
      setHasMore(true);
    }
  }, [id, location]);

  const fetchSinglePokemon = async (pokemonId) => {
    setLoading(true);
    try {
      // Determine which API endpoint to use based on the card ID
      const fetchUrl = pokemonId.startsWith('ai-')
        ? `http://127.0.0.1:8000/api/aigen/cards/${pokemonId}/`  // AI-generated card
        : `http://127.0.0.1:8000/api/pokemon/${pokemonId}/`;     // Regular Pokemon card
        
      const response = await fetch(fetchUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch card details');
      }
      
      const data = await response.json();
      
      // For both API and AI cards, the data is in a 'data' property
      setSelectedPokemon(data.data);
      setSearchTerm(data.data.name);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching card:', error);
      setLoading(false);
    }
  };

  const fetchFeaturedPokemon = async () => {
    setLoading(true);
    try {
      // Load just the first page of Pokemon for the carousel
      const response = await fetch('http://127.0.0.1:8000/api/pokemon/?page=1&pageSize=20');
      if (!response.ok) {
        throw new Error('Failed to fetch featured Pokemon');
      }
      
      const data = await response.json();
      const pokemonData = data.data;
      
      // Create a carousel of random Pokemon
      const shuffled = [...pokemonData].sort(() => 0.5 - Math.random());
      setCarouselPokemon(shuffled.slice(0, 10));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching featured Pokemon:', error);
      setLoading(false);
    }
  };

  const fetchMorePokemon = async () => {
    if (loadingMore || !hasMore || searchTerm.trim()) return;
    
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const response = await fetch(`http://127.0.0.1:8000/api/pokemon/?page=${nextPage}&pageSize=20`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch more Pokemon');
      }
      
      const data = await response.json();
      const newPokemon = data.data;
      
      if (newPokemon.length === 0) {
        setHasMore(false);
      } else {
        setCarouselPokemon(prev => [...prev, ...newPokemon]);
        setPage(nextPage);
      }
    } catch (error) {
      console.error('Error fetching more Pokemon:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  // Intersection Observer to detect when user scrolls to bottom
  const lastCardElementRef = useCallback(node => {
    if (loadingMore) return;
    
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !searchTerm.trim()) {
        fetchMorePokemon();
      }
    }, { threshold: 0.5 });
    
    if (node) observer.current.observe(node);
  }, [loadingMore, hasMore, searchTerm, fetchMorePokemon]);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    // Clear previous timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    // Don't search if the input is empty
    if (!value.trim()) {
      setFilteredPokemon([]);
      return;
    }

    // Set new timeout for search debouncing
    setTypingTimeout(setTimeout(() => {
      performSearch(value);
    }, 500));
  };

  const performSearch = async (query) => {
    if (!query.trim()) return;
    
    setSearchLoading(true);
    try {
      // Use server-side search with the query parameter
      const response = await fetch(`http://127.0.0.1:8000/api/pokemon/?q=${query}&pageSize=20`);
      if (!response.ok) {
        throw new Error('Failed to search Pokemon');
      }
      
      const data = await response.json();
      setPokemon(data.data);
      setFilteredPokemon(data.data);
      setSelectedPokemon(null); // Clear selection when searching
      setSearchLoading(false);
    } catch (error) {
      console.error('Error searching Pokemon:', error);
      setSearchLoading(false);
    }
  };

  const handlePokemonSelect = (poke) => {
    navigate(`/pokemon/${poke.id}`);
  };

  const handleCarouselSelect = (poke) => {
    navigate(`/pokemon/${poke.id}`);
  };

  // Define renderAttack function properly
  const renderAttack = (attack, index) => {
    if (!attack) return null;
    
    return (
      <div key={index} className="attack-item">
        <div className="attack-header">
          <span className="attack-name">{attack.name}</span>
          <span className="attack-damage">{attack.damage || ""}</span>
        </div>
        <div className="attack-cost">
          {attack.cost && attack.cost.map((type, i) => (
            <span key={i} className={`energy-symbol ${type.toLowerCase()}`}>{type}</span>
          ))}
        </div>
        <p className="attack-text">{attack.text}</p>
      </div>
    );
  };

  // Define renderWeaknessResistance function properly
  const renderWeaknessResistance = () => {
    if (!selectedPokemon) return null;
    
    return (
      <div className="weakness-resistance">
        {selectedPokemon.weaknesses && (
          <div className="weakness-section">
            <h4>Weakness</h4>
            {selectedPokemon.weaknesses.map((weakness, i) => (
              <div key={i} className="type-with-value">
                <span className={`type-symbol ${weakness.type.toLowerCase()}`}>
                  {weakness.type}
                </span>
                <span className="value">{weakness.value}</span>
              </div>
            ))}
          </div>
        )}
        
        {selectedPokemon.resistances && (
          <div className="resistance-section">
            <h4>Resistance</h4>
            {selectedPokemon.resistances.map((resistance, i) => (
              <div key={i} className="type-with-value">
                <span className={`type-symbol ${resistance.type.toLowerCase()}`}>
                  {resistance.type}
                </span>
                <span className="value">{resistance.value}</span>
              </div>
            ))}
          </div>
        )}
        
        {selectedPokemon.retreatCost && (
          <div className="retreat-section">
            <h4>Retreat Cost</h4>
            <div className="retreat-cost">
              {selectedPokemon.retreatCost.map((type, i) => (
                <span key={i} className={`energy-symbol ${type.toLowerCase()}`}>{type}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const handlePurchase = async () => {
    if (purchasing) return;
    setPurchasing(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('You must be logged in to purchase cards');
        setPurchasing(false);
        return;
      }
      
      let response;
      let endpoint;
      
      // Different purchase endpoints based on source
      switch (sourceType) {
        case 'dailyshop':
          endpoint = 'http://127.0.0.1:8000/api/dailyshop/purchase/';
          response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Token ${token}`
            },
            body: JSON.stringify({
              shop_item_id: listingId
            })
          });
          break;
        
        case 'marketplace':
          endpoint = 'http://127.0.0.1:8000/api/marketplace/buy-listing/';
          response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Token ${token}`
            },
            body: JSON.stringify({
              listing_id: listingId
            })
          });
          break;
        
        default:
          // Regular purchase
          endpoint = 'http://127.0.0.1:8000/api/purchase/';
          response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Token ${token}`
            },
            body: JSON.stringify({
              card_id: id,
              price: price || 0
            })
          });
          break;
      }
      
      const data = await response.json();
      
      if (!response.ok) {
        alert(`Purchase failed: ${data.message || 'Unknown error'}`);
      } else {
        alert(data.message || 'Card purchased successfully!');
        
        // Update the global balance
        if (data.balance !== undefined || data.new_balance !== undefined) {
          updateBalance(data.balance || data.new_balance);
        }
        
        // Clear the purchase info since it's been used
        setSourceType(null);
        setListingId(null);
        setPrice(null);
      }
    } catch (err) {
      alert(`Purchase failed: ${err.message || 'Unknown error'}`);
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <div className="main-container">
      <Navbar />
      
      <div className="pokemon-stats-content">
        <div className="search-bar-container">
          <input
            type="text"
            placeholder="Search Pokémon cards..."
            value={searchTerm}
            onChange={handleSearch}
            className="search-input"
          />
          {searchLoading && <span className="search-loading">Searching...</span>}
        </div>
        
        {loading ? (
          <div className="loading">Loading Pokémon cards...</div>
        ) : selectedPokemon ? (
          <div className="pokemon-detail-container">
            <div className="image-container">
              <img src={selectedPokemon.images.large} alt={selectedPokemon.name} className="pokemon-image" />
              <div className="card-info">
                <h2>{selectedPokemon.name}</h2>
                <p><strong>Set:</strong> {selectedPokemon.set?.name || "AI Generated"}</p>
                <p><strong>Rarity:</strong> {selectedPokemon.rarity}</p>
                <p><strong>Card #:</strong> {selectedPokemon.number || selectedPokemon.id}</p>
                {selectedPokemon.flavorText && (
                  <p className="flavor-text">"{selectedPokemon.flavorText}"</p>
                )}
                
                {/* Purchase button conditionally shown if we have source and price */}
                {sourceType && price && (
                  <div className="purchase-container">
                    <p className="card-price"><strong>Price:</strong> PD {price}</p>
                    <button 
                      className="purchase-button"
                      onClick={handlePurchase}
                      disabled={purchasing}
                    >
                      {purchasing ? 'Processing...' : 'Purchase Card'}
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="stats-details-container">
              <div className="card-stats">
                <div className="hp-type">
                  <span className="hp">{selectedPokemon.hp} HP</span>
                  <span className="pokemon-type">
                    {selectedPokemon.types && selectedPokemon.types.map((type, i) => (
                      <span key={i} className={`type-symbol ${type.toLowerCase()}`}>{type}</span>
                    ))}
                  </span>
                </div>
                
                {selectedPokemon.evolvesFrom && (
                  <div className="evolution-info">
                    <p>Evolves from: {selectedPokemon.evolvesFrom}</p>
                  </div>
                )}
                
                {selectedPokemon.abilities && selectedPokemon.abilities.map((ability, i) => (
                  <div key={i} className="ability-item">
                    <div className="ability-header">
                      <span className="ability-name">{ability.name}</span>
                      <span className="ability-type">{ability.type}</span>
                    </div>
                    <p className="ability-text">{ability.text}</p>
                  </div>
                ))}
                
                {selectedPokemon.attacks && selectedPokemon.attacks.map((attack, i) => 
                  renderAttack(attack, i)
                )}
                
                {renderWeaknessResistance()}
              </div>
            </div>
          </div>
        ) : searchTerm ? (
          <div className="search-results-container">
            <h3>Search Results</h3>
            {searchLoading ? (
              <div className="loading">Searching...</div>
            ) : filteredPokemon.length > 0 ? (
              <div className="pokemon-grid">
                {filteredPokemon.map((poke) => (
                  <div 
                    key={poke.id} 
                    className="pokemon-card"
                    onClick={() => handlePokemonSelect(poke)}
                  >
                    <img src={poke.images.small} alt={poke.name} className="grid-image" />
                    <p>{poke.name}</p>
                    <p className="card-set">{poke.set.name}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-results">
                <p>No Pokémon found matching "{searchTerm}"</p>
                <p className="search-tip">Try using the full name or a different spelling</p>
                <div className="carousel-container">
                  <h3>Featured Pokémon Cards</h3>
                  <div className="carousel">
                    {carouselPokemon.map((poke) => (
                      <div 
                        key={poke.id} 
                        className="carousel-card"
                        onClick={() => handleCarouselSelect(poke)}
                      >
                        <img src={poke.images.small} alt={poke.name} className="carousel-image" />
                        <p>{poke.name}</p>
                        <p className="card-set">{poke.set.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="carousel-container">
            <h3>Featured Pokémon Cards</h3>
            <div className="infinite-scroll-container">
              <div className="pokemon-grid">
                {carouselPokemon.map((poke, index) => {
                  if (carouselPokemon.length === index + 1) {
                    return (
                      <div 
                        ref={lastCardElementRef}
                        key={poke.id} 
                        className="pokemon-card"
                        onClick={() => handleCarouselSelect(poke)}
                      >
                        <img src={poke.images.small} alt={poke.name} className="grid-image" />
                        <p>{poke.name}</p>
                        <p className="card-set">{poke.set?.name || "Unknown"}</p>
                      </div>
                    );
                  } else {
                    return (
                      <div 
                        key={poke.id} 
                        className="pokemon-card"
                        onClick={() => handleCarouselSelect(poke)}
                      >
                        <img src={poke.images.small} alt={poke.name} className="grid-image" />
                        <p>{poke.name}</p>
                        <p className="card-set">{poke.set?.name || "Unknown"}</p>
                      </div>
                    );
                  }
                })}
              </div>
              {loadingMore && (
                <div className="loading-more">Loading more cards...</div>
              )}
              {!hasMore && !loadingMore && carouselPokemon.length > 0 && (
                <div className="end-message">You've seen all available cards</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PokemonStatsPage;