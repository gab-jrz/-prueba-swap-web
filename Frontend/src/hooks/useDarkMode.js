import { useState, useEffect } from 'react';

export const useDarkMode = () => {
  // Obtener el valor inicial del localStorage o usar false como default
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? JSON.parse(savedMode) : false;
  });

  // Efecto para guardar el estado en localStorage y aplicar la clase al body
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    
    // Aplicar o remover la clase 'dark-mode' del body
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  // Función para alternar el modo oscuro
  const toggleDarkMode = () => {
    setDarkMode(prevMode => !prevMode);
  };

  return [darkMode, setDarkMode, toggleDarkMode];
};

export default useDarkMode;
