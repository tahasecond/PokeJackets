import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './MarketplacePage.css';
import SearchBar from '../../components/SearchBar';
import Card from '../../components/Card';

const MarketplacePage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [balance] = useState(2500);

  // Featured cards data
  const featuredCards = [
    { id: 1, title: 'Text', price: 0, bodyText: 'Body text.' },
    { id: 2, title: 'Text', price: 0, bodyText: 'Body text.' },
    { id: 3, title: 'Text', price: 0, bodyText: 'Body text.' },
    { id: 4, title: 'Text', price: 0, bodyText: 'Body text.' }
  ];

  // Browse cards data
  const browseCards = [
    { id: 1, title: 'Text', price: 0, bodyText: 'Body text.' },
    { id: 2, title: 'Text', price: 0, bodyText: 'Body text.' },
    { id: 3, title: 'Text', price: 0, bodyText: 'Body text.' },
    { id: 4, title: 'Text', price: 0, bodyText: 'Body text.' },
    { id: 5, title: 'JigglyPuff', price: 25, bodyText: 'Body text.', rarity: 'Common', type: 'Fairy' }
  ];

  const handleSearch = (query) => {
    setSearchQuery(query);
    // Implement search functionality here
  };

  return (
    <div className="marketplace-container">
      <header className="marketplace-header">
        <div className="logo-container">
          <Link to="/" className="logo">PokeJackets</Link>
        </div>
        
        <SearchBar 
          placeholder="Search for Cards" 
          onSearch={handleSearch} 
        />
        
        <div className="user-actions">
          <span className="balance">${balance.toFixed(0)}</span>
          <button className="sign-in-btn">Sign In</button>
          <button className="register-btn">Register</button>
        </div>
      </header>

      <main className="marketplace-main">
        <div className="sell-card-container">
          <button className="sell-card-btn">Sell a Card</button>
        </div>
        
        <section className="featured-section">
          <h2 className="section-title">Featured</h2>
          <div className="featured-cards">
            {featuredCards.map(card => (
              <Card 
                key={card.id} 
                title={card.title} 
                price={card.price} 
                bodyText={card.bodyText}
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
            <button className="nav-btn prev-btn">←</button>
            <div className="browse-cards">
              {browseCards.map(card => (
                <Card 
                  key={card.id} 
                  title={card.title} 
                  price={card.price} 
                  bodyText={card.bodyText}
                  rarity={card.rarity}
                  type={card.type}
                />
              ))}
            </div>
            <button className="nav-btn next-btn">→</button>
          </div>
        </section>
        
        <section className="daily-card-section">
          <div className="daily-card-container">
            <h3 className="daily-card-title">claim your daily card!</h3>
            <Card 
              title="Text" 
              price={0} 
              bodyText="Body text."
            />
          </div>
        </section>
      </main>
    </div>
  );
};

export default MarketplacePage;
