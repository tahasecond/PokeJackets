import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Components.css';

const Card = ({ id, title, price, bodyText, imageSrc, rarity, type }) => {
  const navigate = useNavigate();
  
  const handleCardClick = () => {
    navigate(`/pokemon/${id}`);
  };
  
  return (
    <div className="card" onClick={handleCardClick}>
      <div className="card-image">
        {imageSrc ? (
          <img src={imageSrc} alt={title} className="card-pokemon-image" />
        ) : (
          <div className="placeholder-image"></div>
        )}
      </div>
      <div className="card-content">
        <p className="card-title">{title}</p>
        <p className="card-price">${price}</p>
        <p className="card-body">{bodyText}</p>
        {rarity && type && (
          <p className="card-details">
            {rarity} - {type}
          </p>
        )}
      </div>
      {rarity && (
        <button 
          className="buy-now-btn"
          onClick={(e) => {
            e.stopPropagation(); // Stop the event from bubbling up to parent
          }}
        >
          Buy Now
        </button>
      )}
    </div>
  );
};

export default Card; 