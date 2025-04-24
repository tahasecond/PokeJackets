import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './MarketplacePage.css';
import SearchBar from '../../components/SearchBar';
import Card from '../../components/Card';
import Navbar from '../../components/Navbar';


const MarketplacePage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [balance] = useState(2500);
  const [pokemon, setPokemon] = useState([]);
  const [filteredPokemon, setFilteredPokemon] = useState([]);
  const [featuredPokemon, setFeaturedPokemon] = useState([]);
  const [carouselPokemon, setCarouselPokemon] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const cardsPerPage = 5;

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/pokemon/')
      .then((res) => res.json())
      .then((data) => {
        const pokemonData = data.data;
        setPokemon(pokemonData);
        setFilteredPokemon(pokemonData);
        
        // Select random Pokémon for featured section
        const shuffled = [...pokemonData].sort(() => 0.5 - Math.random());
        setFeaturedPokemon(shuffled.slice(0, 4));
        
        // Select different random Pokémon for carousel
        const carouselShuffle = [...pokemonData].sort(() => 0.5 - Math.random());
        setCarouselPokemon(carouselShuffle.slice(0, 10));
        
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching Pokémon:', err);
        setLoading(false);
      });
  }, []);

  const handleSearch = (query) => {
    setSearchQuery(query);
    
    const filtered = pokemon.filter((poke) =>
      poke.name.toLowerCase().includes(query.toLowerCase())
    );
    
    setFilteredPokemon(filtered);
  };

  // Get current cards for pagination
  const indexOfLastCard = currentPage * cardsPerPage;
  const indexOfFirstCard = indexOfLastCard - cardsPerPage;
  const currentCards = filteredPokemon.slice(indexOfFirstCard, indexOfLastCard);

  // Change page
  const nextPage = () => {
    if (currentPage < Math.ceil(filteredPokemon.length / cardsPerPage)) {
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

  return (
    <div className="marketplace-container">
      <Navbar balance={balance} />
      <main className="marketplace-main">
        <div className="marketplace-controls">
          <SearchBar 
            placeholder="Search for Cards" 
            onSearch={handleSearch} 
          />
          <button className="sell-card-btn">Sell a Card</button>
        </div>
        
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
                    />
                  ))}
                </div>
                <button 
                  className="nav-btn next-btn" 
                  onClick={nextPage}
                  disabled={currentPage >= Math.ceil(filteredPokemon.length / cardsPerPage)}
                >
                  →
                </button>
              </div>
            </section>
            
            <section className="daily-card-section">
              <div className="daily-card-container">
                <h3 className="daily-card-title">Claim your daily card!</h3>
                <Card 
                  title={pokemon[0]?.name || "Mystery Card"} 
                  price={0} 
                  bodyText="Free daily card!"
                  imageSrc={pokemon[0]?.images.small}
                  id={pokemon[0]?.id}
                />
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
