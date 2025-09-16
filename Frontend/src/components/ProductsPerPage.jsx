import React from 'react';
import '../styles/ProductsPerPage.css';

const ProductsPerPage = ({ currentLimit, onLimitChange, options = [16, 20, 24, 32, 50] }) => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem'
    }}>
      <span style={{
        color: '#1f2937',
        fontSize: '0.9375rem',
        fontWeight: 600,
        whiteSpace: 'nowrap',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
      }}>
        Productos por página:
      </span>
      <select
        id="products-per-page"
        className="products-per-page-select"
        value={currentLimit}
        onChange={(e) => onLimitChange(parseInt(e.target.value))}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ProductsPerPage;
