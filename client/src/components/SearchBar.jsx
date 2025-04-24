import React, { useState } from 'react';
import './Components.css';

const SearchBar = ({ placeholder = 'Search...', onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typingTimeout, setTypingTimeout] = useState(null);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Clear previous timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    
    // Set new timeout for search
    setTypingTimeout(setTimeout(() => {
      onSearch(value);
    }, 500));
  };

  const clearSearch = () => {
    setSearchTerm('');
    if (onSearch) {
      onSearch('');
    }
  };

  return (
    <div className="search-container">
      <input
        type="text"
        placeholder={placeholder}
        value={searchTerm}
        onChange={handleInputChange}
        className="search-input"
      />
      {searchTerm && (
        <button onClick={clearSearch} className="clear-search">×</button>
      )}
    </div>
  );
};

export default SearchBar;
