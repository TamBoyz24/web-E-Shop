import React, { useState } from 'react';

const SearchBar = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    console.log(`Search Query: ${searchQuery}`);
    alert(`Tìm kiếm: ${searchQuery} (demo).`);
    setSearchQuery(''); // Clear search field
  };

  return (
    <form onSubmit={handleSearch} className="d-flex">
      <input
        className="form-control me-2"
        type="search"
        placeholder="Tìm kiếm..."
        aria-label="Search"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <button className="btn btn-outline-success" type="submit">Tìm</button>
    </form>
  );
};

export default SearchBar;
