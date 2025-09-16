import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function Privacidad() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash === '#top') {
      const el = document.getElementById('top');
      if (el && typeof el.scrollIntoView === 'function') {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [location.hash]);

  return (
    <div className="perfil-usuario-container">
      <Header search={false} />

      <main id="top" className="container py-5" style={{ minHeight: "60vh", scrollMarginTop: "80px" }}>
        <section className="mb-4">
          <h1 className="display-6 fw-bold mb-3">Políticas y Términos de Uso</h1>         
        </section>

        {/* Sobre nuestro proyecto */}
        <section className="p-4 rounded-3 border bg-light-subtle mb-4">
          <h2 className="h5 mb-2">Sobre Nuestro Proyecto</h2>
          <p className="text-muted mb-0">
            Este sitio web es un trabajo final desarrollado para la Univeridad del Norte Santo Tomás de Aquino(<a href="https://www.unsta.edu.ar" target="_blank" rel="noopener noreferrer">UNSTA</a>). El sistema está destinado al intercambio de productos entre usuarios.
          </p>
        </section>

        {/* Política de privacidad */}
        <section className="p-4 rounded-3 border bg-light-subtle mb-4">
          <h2 className="h5 mb-2">Política de Privacidad</h2>
          <p className="text-muted mb-0">
            No recopilamos datos personales sensibles de los usuarios fuera de los necesarios. Los datos almacenados no serán compartidos con terceros y se utilizan exclusivamente para el funcionamiento interno del sistema.
          </p>
        </section>

        {/* Propiedad intelectual */}
        <section className="p-4 rounded-3 border bg-light-subtle">
          <h2 className="h5 mb-2">Propiedad Intelectual</h2>
          <p className="text-muted mb-0">
            Todo el contenido, código fuente y documentación asociados a este proyecto son propiedad de sus autores y de la <a href="https://www.unsta.edu.ar" target="_blank" rel="noopener noreferrer">UNSTA</a>. El uso, reproducción o distribución sin autorización está prohibido.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}