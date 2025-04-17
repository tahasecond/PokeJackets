import React, { useState, useEffect } from 'react';
import "./PokemonStatsPage.css"
import { Link, useParams } from 'react-router-dom';

const PokemonStatsPage = () => {
  const { id } = useParams();
  const [pokemon, setPokemon] = useState([]);
  const [filteredPokemon, setFilteredPokemon] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPokemon, setSelectedPokemon] = useState(null);
  const [carouselPokemon, setCarouselPokemon] = useState([]);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/pokemon/')
      .then((res) => res.json())
      .then((data) => {
        setPokemon(data.data);
        setFilteredPokemon(data.data);
        
        // If we have an ID from the URL, find and select that Pokemon
        if (id) {
          const pokemonById = data.data.find(p => p.id === id);
          if (pokemonById) {
            setSelectedPokemon(pokemonById);
            setSearchTerm(pokemonById.name);
          }
        } else {
          // If no ID, select random Pokemon for the carousel
          const shuffled = [...data.data].sort(() => 0.5 - Math.random());
          setCarouselPokemon(shuffled.slice(0, 10));
        }
        
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching Pokémon:', err);
        setLoading(false);
      });
  }, [id]);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    const filtered = pokemon.filter((poke) =>
      poke.name.toLowerCase().includes(value.toLowerCase())
    );

    setFilteredPokemon(filtered);
    
    // If there's an exact match, select that Pokémon
    if (value) {
      const exactMatch = pokemon.find(poke => 
        poke.name.toLowerCase() === value.toLowerCase()
      );
      if (exactMatch) {
        setSelectedPokemon(exactMatch);
      }
    }
  };

  const handleCarouselSelect = (poke) => {
    setSelectedPokemon(poke);
    setSearchTerm(poke.name);
  };

  const renderAttack = (attack, index) => (
    <div key={index} className="attack-item">
      <div className="attack-header">
        <span className="attack-name">{attack.name}</span>
        <span className="attack-cost">
          {attack.cost && attack.cost.map((type, i) => (
            <span key={i} className={`energy-symbol ${type.toLowerCase()}`}>{type}</span>
          ))}
        </span>
      </div>
      <div className="attack-details">
        <span className="attack-damage">{attack.damage}</span>
        <p className="attack-text">{attack.text}</p>
      </div>
    </div>
  );

  const renderWeaknessResistance = () => {
    const weaknesses = selectedPokemon.weaknesses || [];
    const resistances = selectedPokemon.resistances || [];
    
    return (
      <div className="weakness-resistance-container">
        {weaknesses.length > 0 && (
          <div className="weakness-item">
            <span className="wr-label">Weakness: </span>
            {weaknesses.map((wk, i) => (
              <span key={i}>
                <span className={`energy-symbol ${wk.type.toLowerCase()}`}>{wk.type}</span>
                <span>{wk.value}</span>
              </span>
            ))}
          </div>
        )}
        {resistances.length > 0 && (
          <div className="resistance-item">
            <span className="wr-label">Resistance: </span>
            {resistances.map((res, i) => (
              <span key={i}>
                <span className={`energy-symbol ${res.type.toLowerCase()}`}>{res.type}</span>
                <span>{res.value}</span>
              </span>
            ))}
          </div>
        )}
        <div className="retreat-cost">
          <span className="wr-label">Retreat Cost: </span>
          {selectedPokemon.retreatCost && selectedPokemon.retreatCost.map((type, i) => (
            <span key={i} className={`energy-symbol ${type.toLowerCase()}`}>{type}</span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="main-container">
      <div className="header-container">
        <div className="title-container">
          <div id="return-btn"><Link to="/">Return to Home</Link></div>
          <div id="title"><h3>Pokémon TCG Cards</h3></div>
          <div id="subtitle"><p>Explore Pokémon Trading Card Game cards</p></div>
        </div>
        <div className="search-bar-container">
          <input
            type="text"
            placeholder="Search Pokémon cards..."
            value={searchTerm}
            onChange={handleSearch}
            className="search-input"
          />
        </div>
      </div>
      
      {loading ? (
        <div className="loading">Loading Pokémon cards...</div>
      ) : !selectedPokemon ? (
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
      ) : (
        <div className="pokemon-detail-container">
          <div className="image-container">
            <img src={selectedPokemon.images.large} alt={selectedPokemon.name} className="pokemon-image" />
            <div className="card-info">
              <h2>{selectedPokemon.name}</h2>
              <p><strong>Set:</strong> {selectedPokemon.set.name}</p>
              <p><strong>Rarity:</strong> {selectedPokemon.rarity}</p>
              <p><strong>Card #:</strong> {selectedPokemon.number}/{selectedPokemon.set.printedTotal}</p>
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
      )}
    </div>
  );
};

export default PokemonStatsPage;