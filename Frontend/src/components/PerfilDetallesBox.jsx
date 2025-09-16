import React from 'react';

/*
  Reusable premium details box used in both PerfilUsuario and PerfilPublico.
  Props:
  - provincia (string)
  - email (string)
  - mostrarContacto (bool)
  - actions (ReactNode) optional: render action buttons area (e.g., Editar / Configuración)
*/
const PerfilDetallesBox = ({ provincia, email, mostrarContacto = true, actions = null }) => {
  return (
    <div className="perfil-box-inferior">
      <div className="perfil-detalles-premium">
        <div className="detalle-item-premium">
          <svg className="detalle-icon-premium" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          <span className="detalle-label-premium">Provincia:</span>
          <span className="detalle-value-premium">{provincia || 'Sin especificar'}</span>
        </div>

        {mostrarContacto ? (
          <>
            <div className="detalle-item-premium">
              <svg className="detalle-icon-premium" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v14a2 2 0 0 1-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              <span className="detalle-label-premium">Email:</span>
              <span className="detalle-value-premium">{email || 'No disponible'}</span>
            </div>
          </>
        ) : (
          <div className="detalle-item-premium privacy-notice">
            <svg className="detalle-icon-premium" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <circle cx="12" cy="16" r="1"></circle>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <span className="detalle-value-premium privacy-text">Información de contacto privada</span>
          </div>
        )}
      </div>

      {actions && (
        <div className="perfil-acciones-premium">
          {actions}
        </div>
      )}
    </div>
  );
};

export default PerfilDetallesBox;
