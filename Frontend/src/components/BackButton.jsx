import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/BackButton.css';

/**
 * Reusable icon-only back button with premium styling.
 * Props:
 * - to: string | number (optional). If provided, navigates to this path or history offset. Default: -1
 * - ariaLabel: string (optional). Default: "Volver"
 * - onClick: function (optional). If provided, called before navigation
 * - title: string (optional). Tooltip/title
 */
const BackButton = ({ to = -1, ariaLabel = 'Volver', onClick, title, className = '', style = {} }) => {
  const navigate = useNavigate();

  const handleClick = (e) => {
    if (onClick) onClick(e);
    if (typeof to === 'number') navigate(to);
    else if (typeof to === 'string') navigate(to);
    else navigate(-1);
  };

  const buttonStyle = {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
    border: '2px solid #e2e8f0',
    color: '#475569',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
    transition: 'all 0.2s ease',
    ...style // Spread any additional styles passed as props
  };

  // Ocultar globalmente el botón de regresar (solicitud del usuario)
  return null;
};

export default BackButton;
