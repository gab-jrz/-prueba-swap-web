import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDarkMode } from '../hooks/useDarkMode';

const Logo = ({ className = "", style = {} }) => {
  const navigate = useNavigate();
  const [darkMode] = useDarkMode();

  return (
    <h2
      className={`brand-logo-custom ${className}`}
      onClick={() => navigate("/")}
      style={{
        cursor: "pointer",
        fontFamily: "'Poppins', 'Roboto', sans-serif !important",
        fontWeight: "700 !important",
        fontSize: "2.6rem !important",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        display: "flex !important",
        alignItems: "baseline",
        gap: "0",
        margin: "0 !important",
        padding: "0 !important",
        border: "none !important",
        background: "none !important",
        lineHeight: "1 !important",
        ...style
      }}
    >
      <span
        className="logo-swap"
        style={{
          color: darkMode ? "#ffffff" : "#1e293b",
          fontWeight: "800",
          fontSize: "2.3rem",
          letterSpacing: "-0.8px",
          display: "inline-block",
          fontFamily: "'Poppins', sans-serif",
          textShadow: darkMode 
            ? "0 0 20px rgba(139, 92, 246, 0.6), 0 0 40px rgba(139, 92, 246, 0.4)"
            : "none",
        }}
      >
        Swap
      </span>
      <span
        className="logo-web"
        style={{
          color: darkMode ? "#06b6d4" : "#3b82f6",
          fontWeight: "800",
          fontSize: "2.8rem",
          letterSpacing: "-0.5px",
          fontFamily: "'Poppins', sans-serif",
          marginLeft: "0",
          lineHeight: "1",
          verticalAlign: "baseline",
          textShadow: darkMode 
            ? "0 0 20px rgba(6, 182, 212, 0.6), 0 0 40px rgba(6, 182, 212, 0.4)"
            : "none",
        }}
      >
        Web
      </span>
    </h2>
  );
};

export default Logo;
