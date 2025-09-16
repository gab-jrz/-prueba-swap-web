import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../styles/sobreNosotros.css";

export default function SobreNosotros() {
  const equipo = [
    { nombre: "Gabriela Jerez", rol: "Scrum Master", github: "https://github.com/gab-jrz", foto: "/images/fotoperfil.jpg" },
    { nombre: "Facundo Tapia", rol: "Frontend Developer", github: "https://github.com/facundotapia", foto: "/images/fotoperfil.jpg" },
    { nombre: "Naila Rivero", rol: "Backend Developer", github: "https://github.com/nailarivero", foto: "/images/fotoperfil.jpg" },
    { nombre: "Gabriel Fermoselle", rol: "Backend Developer", github: "https://github.com/gabrielfermoselle", foto: "/images/fotoperfil.jpg" },
    { nombre: "Ignacio Mercado", rol: "QA Tester", github: "https://github.com/ignaciomercado", foto: "/images/fotoperfil.jpg" },
  ];

  const handleImgError = (e) => {
    e.currentTarget.src = "/images/fotoperfil.jpg";
  };

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
    <div className="perfil-usuario-container sobre-nosotros">
      <Header search={false} />

      <main id="top" className="container py-5" style={{ minHeight: "60vh", scrollMarginTop: "80px" }}>
        {/* Nuestra Historia */}
        <section className="mb-5 fade-in-up" style={{ animationDelay: '40ms' }}>
          <h1 className="display-6 fw-bold mb-3 section-title">Nuestra Historia</h1>
          <div className="p-4 rounded-3 border bg-light-subtle" style={{ maxWidth: 980 }}>
            <p className="text-muted mb-3">
              SwapWeb nació con una idea simple: facilitar intercambios seguros entre personas
              para dar una segunda vida a los objetos y promover el consumo responsable.
            </p>
            <p className="text-muted mb-0">
              Identificamos la necesidad de una plataforma moderna y confiable que conecte a usuarios
              de toda Argentina para intercambiar productos y servicios sin costo. Por eso enfocamos la
              experiencia en la comunidad, la seguridad y la transparencia, con perfiles verificados,
              calificaciones y un flujo de publicación muy sencillo.
            </p>
          </div>
        </section>

        {/* Nuestro Equipo */}
        <section className="fade-in-up" style={{ animationDelay: '60ms' }}>
          <h2 className="h3 fw-bold mb-4 section-title">Nuestro Equipo</h2>
          <div className="row g-4">
            {equipo.map((m, idx) => (
              <div className="col-12 col-sm-6 col-lg-4 fade-in-up" key={idx} style={{ animationDelay: `${80 + idx * 60}ms` }}>
                <div
                  className="card h-100 shadow-sm border-0 team-card"
                >
                  <div className="card-body d-flex flex-column align-items-center text-center">
                    <img
                      src={m.foto}
                      alt={`Foto de ${m.nombre}`}
                      onError={handleImgError}
                      style={{
                        width: 96,
                        height: 96,
                        borderRadius: "50%",
                        objectFit: "cover",
                        marginBottom: 12,
                        border: "2px solid #e5e7eb",
                      }}
                      className="avatar"
                    />
                    <h3 className="h5 m-0">{m.nombre}</h3>
                    <span className="text-muted mb-3">{m.rol}</span>
                    <a
                      href={m.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline-dark btn-sm d-inline-flex align-items-center gap-2 github-btn"
                      title={`Ver GitHub de ${m.nombre}`}
                      style={{
                        borderColor: '#333',
                        color: '#333',
                        transition: 'all 0.3s ease',
                        fontWeight: '500'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#333';
                        e.target.style.color = '#fff';
                        e.target.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                        e.target.style.color = '#333';
                        e.target.style.transform = 'translateY(0)';
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path d="M12 .5C5.73.5.9 5.33.9 11.6c0 4.86 3.15 8.97 7.52 10.42.55.1.75-.24.75-.53 0-.26-.01-.95-.02-1.86-3.06.67-3.71-1.48-3.71-1.48-.5-1.27-1.23-1.61-1.23-1.61-.99-.68.08-.67.08-.67 1.1.08 1.68 1.13 1.68 1.13.97 1.67 2.56 1.19 3.18.91.1-.7.38-1.19.69-1.47-2.44-.28-5.01-1.22-5.01-5.45 0-1.2.43-2.19 1.13-2.96-.11-.28-.49-1.41.11-2.95 0 0 .93-.3 3.05 1.13.88-.24 1.83-.36 2.77-.36.94 0 1.89.12 2.77.36 2.12-1.43 3.05-1.13 3.05-1.13.6 1.54.22 2.67.11 2.95.7.77 1.13 1.76 1.13 2.96 0 4.24-2.58 5.17-5.04 5.44.39.34.74 1.01.74 2.04 0 1.47-.01 2.65-.01 3.01 0 .29.2.64.76.53 4.36-1.46 7.51-5.56 7.51-10.42C23.1 5.33 18.27.5 12 .5Z" />
                      </svg>
                      Ver GitHub
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
