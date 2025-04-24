import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './AiGenerationPage.css';
import Navbar from '../../components/Navbar';
import { useBalance } from '../../context/BalanceContext';

const AiGenerationPage = () => {
  console.log("Component rendering start");

  const { updateBalance } = useBalance();
  const [balance] = useState(2500);
  console.log("State initialized");
  const [pokemonName, setPokemonName] = useState('');
  const [description, setDescription] = useState('');
  const [primaryType, setPrimaryType] = useState('Fire');
  const [secondaryType, setSecondaryType] = useState('');
  const [rarity, setRarity] = useState('Rare');
  const [artStyle, setArtStyle] = useState('3D Render');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCard, setGeneratedCard] = useState(null);
  const [recentlyGenerated, setRecentlyGenerated] = useState([
    { id: 1, name: 'Flamifox', image: '', primaryType: 'Fire' },
    { id: 2, name: 'Aquafill', image: '', primaryType: 'Water' },
    { id: 3, name: 'Vineleaf', image: '', primaryType: 'Grass' },
    { id: 4, name: 'Zapwing', image: '', primaryType: 'Electric' },
    { id: 5, name: 'Dreamorb', image: '', primaryType: 'Psychic' },
    { id: 6, name: 'Terradon', image: '', primaryType: 'Ground' },
    { id: 7, name: 'Pixiebell', image: '', primaryType: 'Fairy' }
  ]);

  const pokemonTypes = [
    'Fire', 'Water', 'Grass', 'Electric', 'Psychic', 
    'Fighting', 'Rock', 'Ground', 'Flying', 'Bug', 
    'Poison', 'Normal', 'Ghost', 'Dark', 'Steel', 'Fairy', 'Dragon', 'Ice'
  ];

  const rarityOptions = ['Common', 'Uncommon', 'Rare', 'Rare Holo', 'Rare Ultra', 'Legendary'];
  const artStyleOptions = ['3D Render', 'Anime Style', 'Watercolor', 'Pixel Art', 'Realistic', 'Comic Book'];

  // Load recently generated cards when component mounts
  useEffect(() => {
    loadRecentCards();
  }, []);

  const loadRecentCards = () => {
    console.log("Loading recent cards");
    fetch('http://127.0.0.1:8000/api/aigen/recent/')
      .then(response => response.json())
      .then(data => {
        console.log("Received recent cards:", data);
        if (data.cards && Array.isArray(data.cards)) {
          setRecentlyGenerated(data.cards);
        }
      })
      .catch(error => {
        console.error('Error loading recent cards:', error);
      });
  };

  const handleGenerate = () => {
    if (!pokemonName) {
      alert('Please enter a name for your Pokémon');
      return;
    }

    setIsGenerating(true);
    console.log("Generating Pokémon with API...");
    
    // Call the backend API
    fetch('http://127.0.0.1:8000/api/aigen/generate/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        name: pokemonName,
        description: description,
        primaryType: primaryType,
        secondaryType: secondaryType,
        rarity: rarity,
        artStyle: artStyle,
      }),
    })
    .then(response => {
      console.log("API response status:", response.status);
      if (!response.ok) {
        return response.json().then(err => {
          throw new Error(err.error || 'Failed to generate Pokémon');
        });
      }
      return response.json();
    })
    .then(data => {
      console.log("Generated card data:", data);
      setGeneratedCard({
        id: data.id,
        name: data.name,
        description: data.description,
        primaryType: data.primaryType,
        secondaryType: data.secondaryType,
        rarity: data.rarity,
        hp: data.hp,
        attack: data.attack,
        defense: data.defense,
        imageUrl: data.imageUrl,
        uniqueId: data.uniqueId
      });
      
      // Update the global balance
      if (data.newBalance !== undefined) {
        updateBalance(data.newBalance);
      }
      
      setIsGenerating(false);
      loadRecentCards();
    })
    .catch(error => {
      console.error('Error generating Pokémon:', error);
      alert(`Failed to generate Pokémon: ${error.message}`);
      setIsGenerating(false);
    });
  };

  const handleSaveToCollection = async () => {
    if (generatedCard) {
      console.log("Generated card data:", generatedCard); // Debug log to see what's available
      
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          alert('You must be logged in to save cards to your collection');
          return;
        }
        
        // Make sure we're sending the correct ID
        // The ID might be in different properties depending on your API response
        const cardId = generatedCard.id || generatedCard.card_id;
        
        if (!cardId) {
          alert('Card ID not found. Cannot save to collection.');
          console.error('Card ID missing from:', generatedCard);
          return;
        }
        
        const response = await fetch('http://127.0.0.1:8000/api/aigen/save-to-collection/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${token}`
          },
          body: JSON.stringify({
            card_id: cardId
          })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Failed to save card to collection');
        }
        
        alert(data.message || 'Card saved to your collection!');
        
      } catch (err) {
        alert(`Error: ${err.message || 'Failed to save card'}`);
      }
    } else {
      alert('No card generated yet. Generate a card first!');
    }
  };

  // Add this function to get the cost based on selected rarity
  const getGenerationCost = (selectedRarity) => {
    const rarityCosts = {
      'Common': 50,
      'Uncommon': 100,
      'Rare': 250,
      'Rare Holo': 400,
      'Rare Ultra': 600,
      'Legendary': 750
    };
    
    return rarityCosts[selectedRarity] || 100;
  };

  console.log("About to return JSX");
  return (
    <div className="ai-generation-container">
      <Navbar balance={balance} />
      
      <main className="generation-main">
        <div className="generation-title-container">
          <h1 className="generation-title">Create Your Own Pokémon</h1>
          <p className="generation-subtitle">Use our AI generator to design unique Pokémon cards for your collection</p>
        </div>

        <div className="generation-content">
          <div className="options-panel">
            <h2 className="panel-title">AI Generation Options</h2>
            
            <div className="form-group">
              <label htmlFor="pokemon-name">Pokémon Name</label>
              <input 
                type="text" 
                id="pokemon-name" 
                placeholder="Enter a name for your Pokémon..." 
                value={pokemonName}
                onChange={(e) => setPokemonName(e.target.value)}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="description">Description (Optional)</label>
              <textarea 
                id="description" 
                placeholder="Describe your Pokémon's appearance and abilities..." 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              ></textarea>
            </div>
            
            <div className="type-selection">
              <div className="form-group half-width">
                <label htmlFor="primary-type">Primary Type</label>
                <select 
                  id="primary-type"
                  value={primaryType}
                  onChange={(e) => setPrimaryType(e.target.value)}
                >
                  {pokemonTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group half-width">
                <label htmlFor="secondary-type">Secondary Type (Optional)</label>
                <select 
                  id="secondary-type"
                  value={secondaryType}
                  onChange={(e) => setSecondaryType(e.target.value)}
                >
                  <option value="">Select type...</option>
                  {pokemonTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="rarity">Rarity</label>
              <select 
                id="rarity"
                value={rarity}
                onChange={(e) => setRarity(e.target.value)}
              >
                {rarityOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="art-style">Art Style</label>
              <select 
                id="art-style"
                value={artStyle}
                onChange={(e) => setArtStyle(e.target.value)}
              >
                {artStyleOptions.map(style => (
                  <option key={style} value={style}>{style}</option>
                ))}
              </select>
            </div>
            
            <div className="generation-cost-info">
              <p>Generation cost: <span className="cost-amount">{getGenerationCost(rarity)} PD</span></p>
              <p className="cost-explanation">Higher rarity cards cost more to generate</p>
            </div>
            
            <button 
              className="generate-button" 
              onClick={handleGenerate}
              disabled={isGenerating || !pokemonName}
            >
              {isGenerating ? 'Generating...' : 'Generate Pokémon'}
            </button>
          </div>
          
          <div className="preview-panel">
            <h2 className="panel-title">Preview</h2>
            <div className="card-preview">
              {isGenerating ? (
                <div className="generating-overlay">
                  <div className="loading-spinner"></div>
                  <p>Generating your Pokémon...</p>
                </div>
              ) : generatedCard ? (
                <div className="generated-card">
                  <div className="card-image">
                    {generatedCard.imageUrl && (
                      <img 
                        src={generatedCard.imageUrl} 
                        alt={generatedCard.name} 
                        className="generated-pokemon-image" 
                      />
                    )}
                  </div>
                  <div className="card-info">
                    <h3 className="card-name">{generatedCard.name}</h3>
                    <div className="card-type-badge">{generatedCard.primaryType}</div>
                    <div className="card-stats">
                      HP {generatedCard.hp} • ATK {generatedCard.attack} • DEF {generatedCard.defense}
                    </div>
                    <div className="card-abilities">
                      {generatedCard.description || "[Abilities will appear here]"}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="placeholder-card">
                  <div className="placeholder-image">
                    <div className="placeholder-face"></div>
                  </div>
                  <p className="placeholder-text">[Name Your Pokémon]</p>
                  <div className="placeholder-type">Type</div>
                  <p className="placeholder-stats">HP ??? • ATK ??? • DEF ???</p>
                  <p className="placeholder-abilities">[Abilities will appear here]</p>
                </div>
              )}
            </div>
            <button 
              className="save-button" 
              onClick={handleSaveToCollection}
              disabled={!generatedCard}
            >
              Save to Collection
            </button>
          </div>
        </div>
        
        <div className="recent-generations">
          <h2 className="section-title">Recently Generated by Community</h2>
          <div className="recent-cards">
            {recentlyGenerated.map(card => (
              <div key={card.id} className="recent-card">
                {card.imageUrl ? (
                  <img
                    src={card.imageUrl}
                    alt={card.name}
                    className="recent-card-image"
                  />
                ) : (
                  <div className={`recent-card-image ${card.primaryType?.toLowerCase() || 'normal'}`}></div>
                )}
                <p className="recent-card-name">{card.name}</p>
              </div>
            ))}
            <div className="more-cards">
              <span>...</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AiGenerationPage;
