import React, { useState } from 'react';
import './Components.css';

const SearchBar = ({ placeholder = 'Search...', onSearch }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    if (onSearch) {
      onSearch('');
    }
  };

  return (
    <div className="search-container">
      <input
        type="text"
        placeholder={placeholder}
        value={searchQuery}
        onChange={handleSearchChange}
        className="search-input"
      />
      {searchQuery && (
        <button onClick={clearSearch} className="clear-search">×</button>
      )}
    </div>
  );
};

export default SearchBar;
