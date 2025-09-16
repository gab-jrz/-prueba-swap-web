import React from "react";
import "../styles/StepperIntercambio.css";

/**
 * Stepper de progreso para el intercambio de productos entre dos usuarios.
 * Props:
 *   steps: Array de pasos [{ label, icon, completed, active, userName }]
 *   onConfirm: función a ejecutar al confirmar (solo si es tu turno)
 *   canConfirm: booleano, si el usuario puede confirmar
 *   completed: booleano, si el intercambio está completado
 */
export default function StepperIntercambio({ steps, onConfirm, canConfirm, completed }) {
  return (
    <div className="stepper-intercambio-container">
      <div className="stepper-track">
        {steps.map((step, idx) => (
          <div key={idx} className={`stepper-step${step.completed ? " completed" : ""}${step.active ? " active" : ""}`}> 
            {/* Avatar o icono */}
            {step.avatarUrl ? (
              <a href={step.profileUrl} target="_blank" rel="noopener noreferrer" className="stepper-avatar-link">
                <img
                  src={step.avatarUrl}
                  alt={step.userName || step.label}
                  className="stepper-avatar"
                  onError={(e) => {
                    // Si falla la imagen, crear avatar con iniciales
                    e.target.style.display = 'none';
                    const fallbackDiv = document.createElement('div');
                    fallbackDiv.className = 'stepper-avatar';
                    fallbackDiv.style.cssText = `
                      background: linear-gradient(135deg, #b0e0ff 0%, #92d1fa 100%);
                      color: #2d9cdb;
                      font-size: 16px;
                      font-weight: bold;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                    `;
                    const iniciales = (step.userName || 'U').substring(0, 2).toUpperCase();
                    fallbackDiv.textContent = iniciales;
                    e.target.parentNode.insertBefore(fallbackDiv, e.target.nextSibling);
                  }}
                />
              </a>
            ) : step.userName ? (
              <a href={step.profileUrl} target="_blank" rel="noopener noreferrer" className="stepper-avatar-link">
                <div 
                  className="stepper-avatar"
                  style={{
                    background: 'linear-gradient(135deg, #b0e0ff 0%, #92d1fa 100%)',
                    color: '#2d9cdb',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {step.userName.substring(0, 2).toUpperCase()}
                </div>
              </a>
            ) : (
              <div className="stepper-icon">{step.icon}</div>
            )}
            <div className="stepper-label">{step.label}</div>
            {idx < steps.length - 1 && <div className="stepper-bar" />}
          </div>
        ))}
      </div>
      <div className="stepper-actions">
        {completed ? (
          <div className="stepper-success">¡Intercambio completado! 🎉</div>
        ) : canConfirm ? (
          <button className="stepper-confirm-btn" onClick={onConfirm}>
            Confirmar intercambio
          </button>
        ) : null}
      </div>
    </div>
  );
}

