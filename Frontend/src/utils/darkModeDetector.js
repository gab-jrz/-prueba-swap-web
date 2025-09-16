// Detector de modo oscuro para aplicar clase CSS
// Solo cambia el color de los labels a blanco en modo oscuro

function initDarkModeDetector() {
  // Función para aplicar o quitar la clase dark-mode
  function updateDarkMode(isDark) {
    const container = document.querySelector('.publicar-producto-container');
    if (container) {
      if (isDark) {
        container.classList.add('dark-mode');
      } else {
        container.classList.remove('dark-mode');
      }
    }
  }

  // Detectar modo oscuro inicial
  const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
  updateDarkMode(darkModeQuery.matches);

  // Escuchar cambios en el modo oscuro
  darkModeQuery.addEventListener('change', (e) => {
    updateDarkMode(e.matches);
  });
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDarkModeDetector);
} else {
  initDarkModeDetector();
}

export { initDarkModeDetector };
