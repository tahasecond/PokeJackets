import React from 'react';
import './Components.css';

const Card = ({ title, price, bodyText, imageSrc, rarity, type }) => {
  return (
    <div className="card">
      <div className="card-image">
        {imageSrc ? (
          <img src={imageSrc} alt={title} />
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
            {title} - {rarity} - {type}
          </p>
        )}
      </div>
      {rarity && (
        <button className="buy-now-btn">Buy Now</button>
      )}
    </div>
  );
};

export default Card; 