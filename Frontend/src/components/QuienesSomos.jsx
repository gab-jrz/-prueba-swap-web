import React from "react";
import { Link } from "react-router-dom";
import "../styles/QuienesSomos.css";

const QuienesSomos = () => (
  <section className="quienes-somos-modern" id="sobre-nosotros">
    <div className="qs-wave-top">
      <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
        <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25" className="qs-wave-fill"></path>
        <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5" className="qs-wave-fill"></path>
        <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" className="qs-wave-fill"></path>
      </svg>
    </div>
    
    <div className="qs-content">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-10">
            <div className="qs-hero">
              <div className="qs-brand">
                <div className="qs-logo">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                    <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="7" cy="7" r="3" fill="currentColor"/>
                    <circle cx="17" cy="17" r="3" fill="currentColor"/>
                  </svg>
                </div>
                <h1 className="qs-title">SwapWeb</h1>
              </div>
              
              <p className="qs-tagline">
                Comunidad para intercambios y donaciones seguras entre particulares
              </p>
            </div>
            
            <div className="qs-features">
              <div className="row g-4">
                <div className="col-md-4">
                  <div className="qs-feature-card">
                    <div className="qs-feature-icon">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2"/>
                        <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <h3 className="qs-feature-title">100% Gratis</h3>
                    <p className="qs-feature-desc">Publicá e intercambiá sin costo alguno. Sin comisiones ocultas.</p>
                  </div>
                </div>
                
                <div className="col-md-4">
                  <div className="qs-feature-card">
                    <div className="qs-feature-icon">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                        <circle cx="12" cy="16" r="1" fill="currentColor"/>
                        <path d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </div>
                    <h3 className="qs-feature-title">Seguro</h3>
                    <p className="qs-feature-desc">Intercambios protegidos con verificación de usuarios y sistema de reputación.</p>
                  </div>
                </div>
                
                <div className="col-md-4">
                  <div className="qs-feature-card">
                    <div className="qs-feature-icon">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                        <path d="M21 16V8C20.9996 7.64928 20.9071 7.30481 20.7315 7.00116C20.556 6.69751 20.3037 6.44536 20 6.27L13 2.27C12.696 2.09446 12.3511 2.00205 12 2.00205C11.6489 2.00205 11.304 2.09446 11 2.27L4 6.27C3.69626 6.44536 3.44398 6.69751 3.26846 7.00116C3.09294 7.30481 3.00036 7.64928 3 8V16C3.00036 16.3507 3.09294 16.6952 3.26846 16.9988C3.44398 17.3025 3.69626 17.5546 4 17.73L11 21.73C11.304 21.9055 11.6489 21.9979 12 21.9979C12.3511 21.9979 12.696 21.9055 13 21.73L20 17.73C20.3037 17.5546 20.556 17.3025 20.7315 16.9988C20.9071 16.6952 20.9996 16.3507 21 16Z" stroke="currentColor" strokeWidth="2"/>
                        <polyline points="7.5,4.21 12,6.81 16.5,4.21" stroke="currentColor" strokeWidth="2"/>
                        <polyline points="7.5,19.79 7.5,14.6 3,12" stroke="currentColor" strokeWidth="2"/>
                        <polyline points="21,12 16.5,14.6 16.5,19.79" stroke="currentColor" strokeWidth="2"/>
                        <polyline points="12,22.81 12,17" stroke="currentColor" strokeWidth="2"/>
                        <line x1="12" y1="6.81" x2="12" y2="12" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </div>
                    <h3 className="qs-feature-title">Variedad</h3>
                    <p className="qs-feature-desc">Intercambiá tecnología, ropa, electrodomésticos y mucho más.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="qs-cta">
              <div className="qs-cta-content">
                <h2 className="qs-cta-title">¿Listo para intercambiar?</h2>
                <p className="qs-cta-desc">Sumate a nuestra comunidad y dale una segunda vida a tus objetos</p>
                <div className="qs-cta-buttons">
                  <Link to="/publicarproducto#form" className="btn-cta-primary">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Publicar producto
                  </Link>
                  <Link to="/como-funciona#top" className="btn-cta-secondary">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                      <path d="M9.09 9C9.3251 8.33167 9.78915 7.76811 10.4 7.40913C11.0108 7.05016 11.7289 6.91894 12.4272 7.03871C13.1255 7.15849 13.7588 7.52152 14.2151 8.06353C14.6713 8.60553 14.9211 9.29152 14.92 10C14.92 12 11.92 13 11.92 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 17H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Cómo funciona
                  </Link>
                </div>
              </div>
            </div>
            
            <div className="qs-cards">
              {/* Más contenido si aplica */}
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div className="qs-wave-bottom">
      <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
        <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25" className="qs-wave-fill"></path>
        <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5" className="qs-wave-fill"></path>
        <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" className="qs-wave-fill"></path>
      </svg>
    </div>
  </section>
);

export default QuienesSomos;
