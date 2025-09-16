import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

const Step = ({ number, title, children }) => (
  <div className="card h-100 shadow-sm border-0">
    <div className="card-body">
      <div className="d-flex align-items-center gap-3 mb-2">
        <div className="badge bg-primary rounded-pill" style={{ fontSize: 16 }}>{number}</div>
        <h3 className="h5 m-0">{title}</h3>
      </div>
      <div className="text-muted" style={{ lineHeight: 1.6 }}>{children}</div>
    </div>
  </div>
);

export default function ComoFunciona() {
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

      <main id="top" className="container py-5" style={{ minHeight: "60vh" }}>
        <section className="text-center mb-5">
          <h1 className="display-6 fw-bold mb-3">¿Cómo funciona SwapWeb?</h1>
          <p className="text-muted mx-auto" style={{ maxWidth: 760 }}>
            Intercambia productos y servicios de forma segura y sencilla. Publica lo que tienes, 
            encuentra lo que necesitas y coordina un intercambio justo con otros usuarios.
          </p>
          <div className="d-flex gap-3 justify-content-center mt-3">
            <Link className="btn btn-primary" to="/#productos">Ver productos</Link>
            <Link className="btn btn-outline-primary" to="/publicarproducto#form">Publicar producto</Link>
          </div>
        </section>

        <section className="row g-4 mb-5">
          <div className="col-12 col-md-6 col-lg-3"><Step number={1} title="Crea tu cuenta">Regístrate en minutos con tu correo o y completa tu perfil para generar confianza.</Step></div>
          <div className="col-12 col-md-6 col-lg-3"><Step number={2} title="Publica o busca">Publica lo que quieres intercambiar o usa filtros y categorías para encontrar lo que necesitas.</Step></div>
          <div className="col-12 col-md-6 col-lg-3"><Step number={3} title="Coordina el trato">Chatea con otros usuarios, acuerden condiciones y definan el lugar o envío del intercambio.</Step></div>
          <div className="col-12 col-md-6 col-lg-3"><Step number={4} title="Califica la experiencia">Luego del intercambio, califica y deja comentarios para ayudar a la comunidad.</Step></div>
        </section>

        <section className="row g-4">
          <div className="col-12 col-lg-6">
            <div className="p-4 rounded-3 border h-100">
              <h3 className="h5">Consejos de seguridad</h3>
              <ul className="mt-3 text-muted" style={{ marginBottom: 0 }}>
                <li>Reúnete en lugares públicos y concurridos.</li>
                <li>Revisa bien el producto antes de confirmar.</li>
                <li>Usa el chat de la plataforma para mantener registro.</li>
                <li>Reporta comportamientos sospechosos.</li>
              </ul>
            </div>
          </div>
          <div className="col-12 col-lg-6">
            <div className="p-4 rounded-3 border h-100">
              <h3 className="h5">¿Qué se puede intercambiar?</h3>
              <p className="text-muted mb-0">
                Productos en buen estado y servicios. Evita publicar artículos prohibidos por la ley o que
                infrinjan derechos de terceros.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
