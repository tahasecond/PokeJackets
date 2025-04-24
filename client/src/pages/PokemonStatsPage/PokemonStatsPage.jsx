import React, { useState, useEffect } from 'react';
import "./PokemonStatsPage.css"
import { Link, useParams } from 'react-router-dom';
import Navbar from '../../components/Navbar';


const PokemonStatsPage = () => {
  const { id } = useParams();
  const [pokemon, setPokemon] = useState([]);
  const [filteredPokemon, setFilteredPokemon] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPokemon, setSelectedPokemon] = useState(null);
  const [carouselPokemon, setCarouselPokemon] = useState([]);

  useEffect(() => {
    if (id) {
      setLoading(true);
      
      // Determine which API endpoint to use based on the card ID
      const fetchUrl = id.startsWith('ai-')
        ? `http://127.0.0.1:8000/api/aigen/cards/${id}/`  // AI-generated card endpoint
        : `http://127.0.0.1:8000/api/pokemon/`; // Regular Pokemon endpoint
        
      fetch(fetchUrl)
        .then(res => res.json())
        .then(data => {
          // For AI cards, the data format is different (it has a 'data' property)
          if (id.startsWith('ai-')) {
            const pokemonData = data.data;
            setSelectedPokemon(pokemonData);
            setSearchTerm(pokemonData.name);
          } else {
            // For regular Pokemon cards, find the one that matches the ID
            const allPokemon = data.data;
            setPokemon(allPokemon);
            setFilteredPokemon(allPokemon);
            
            const pokemonById = allPokemon.find(p => p.id === id);
            if (pokemonById) {
              setSelectedPokemon(pokemonById);
              setSearchTerm(pokemonById.name);
            }
          }
          
          setLoading(false);
        })
        .catch(err => {
          console.error('Error fetching Pokémon:', err);
          setLoading(false);
        });
    } else {
      // No ID provided, fetch all cards (original behavior)
      fetch('http://127.0.0.1:8000/api/pokemon/')
        .then(res => res.json())
        .then(data => {
          setPokemon(data.data);
          setFilteredPokemon(data.data);
          
          const shuffled = [...data.data].sort(() => 0.5 - Math.random());
          setCarouselPokemon(shuffled.slice(0, 10));
          
          setLoading(false);
        })
        .catch(err => {
          console.error('Error fetching Pokémon:', err);
          setLoading(false);
        });
    }
  }, [id]);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    const filtered = pokemon.filter((poke) =>
      poke.name.toLowerCase().includes(value.toLowerCase())
    );

    setFilteredPokemon(filtered);
    setSelectedPokemon(null); // Clear selection when searching
  };

  const handlePokemonSelect = (poke) => {
    setSelectedPokemon(poke);
    setSearchTerm(poke.name);
  };

  const handleCarouselSelect = (poke) => {
    setSelectedPokemon(poke);
    setSearchTerm(poke.name);
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
            {filteredPokemon.length > 0 ? (
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
                No Pokémon found matching "{searchTerm}"
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
        )}
      </div>
    </div>
  );
};

export default PokemonStatsPage;