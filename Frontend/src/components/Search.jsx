import React, { useState } from 'react';

const Search = ({ onSearch }) => {
  const [query, setQuery] = useState('');

  const handleSearch = (e) => {
    setQuery(e.target.value);
    onSearch(e.target.value);  // Envia la consulta al componente padre
  };

  return (
    <input 
      type="text" 
      value={query}
      onChange={handleSearch}
      placeholder="Buscar producto..."
    />
  );
};

export default Search;
