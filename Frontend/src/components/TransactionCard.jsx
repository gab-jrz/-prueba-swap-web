import React from 'react';
import '../styles/TransactionCard.css';

const TransactionCard = ({ transaccion, currentUserId, onDelete, onRate, onRepublish, onConfirm, isDonation = false, deliveryDate = null }) => {
  // Debug: ver estructura de la transacción
  console.log('🔍 Estructura de transacción:', transaccion);
  console.log('🔍 Campos disponibles:', Object.keys(transaccion));
  console.log('🔍 Valores de campos:', {
    userIdPropietario: transaccion.userIdPropietario,
    userIdSolicitante: transaccion.userIdSolicitante,
    nombrePropietario: transaccion.nombrePropietario,
    nombreSolicitante: transaccion.nombreSolicitante,
    nombreOtro: transaccion.nombreOtro,
    para: transaccion.para,
    de: transaccion.de,
    paraNombre: transaccion.paraNombre,
    deNombre: transaccion.deNombre
  });
  
  // Determinar si el usuario fue quien ofreció o quien recibió
  const esPropietario = transaccion.userIdPropietario === currentUserId;
  // Para donaciones, mostrar siempre el título de la donación (independiente de propietario)
  const miProducto = isDonation
    ? (transaccion.productoOfrecido || transaccion.title)
    : (esPropietario ? transaccion.productoOfrecido : transaccion.productoSolicitado);
  const productoOtro = esPropietario ? transaccion.productoSolicitado : transaccion.productoOfrecido;
  let nombreOtro = transaccion.otroUserNombre || 'Usuario';
  
  // Si no hay otroUserNombre, intentar obtener el nombre del otroUserId
  if (!nombreOtro || nombreOtro.trim() === '') {
    nombreOtro = 'Usuario';
  }
  const fechaBase = deliveryDate || transaccion.fecha;
  const fecha = new Date(fechaBase);
  const fechaStr = `${fecha.toLocaleDateString()} a las ${fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  
  // Estado y confirmaciones
  const estado = transaccion.estado || (isDonation ? 'completado' : 'pendiente_confirmacion');
  const confirmedBy = Array.isArray(transaccion.confirmedBy) ? transaccion.confirmedBy.filter(Boolean) : [];
  const confirmedCount = new Set(confirmedBy).size;
  const hasConfirmedMe = currentUserId ? confirmedBy.includes(currentUserId) : false;
  const isCompleted = estado === 'completado' || confirmedCount >= 2;
  const isPending = !isCompleted && !isDonation;

  // Determinar si se puede calificar (intercambio completado y no calificado aún)
  const puedeCalificar = isCompleted && !transaccion.calificado;
  
  const handleRateClick = () => {
    if (onRate && puedeCalificar) {
      onRate({
        otroId: transaccion.otroUserId,
        otroNombre: nombreOtro,
        transId: transaccion._id
      });
    }
  };
  return (
    <div className="transaction-card"
      style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #fafbff 100%)',
        borderRadius: 16,
        border: '1px solid rgba(102, 126, 234, 0.12)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.1)',
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
        // Altura mínima consistente para alinear donaciones e intercambios
        minHeight: 330,
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.15)';
        e.currentTarget.style.borderColor = 'rgba(102, 126, 234, 0.2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.1)';
        e.currentTarget.style.borderColor = 'rgba(102, 126, 234, 0.12)';
      }}
    >
      {/* Borde decorativo superior */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        background: 'linear-gradient(90deg, #667eea 0%, #764ba2 50%, #009688 100%)',
        borderRadius: '16px 16px 0 0'
      }}></div>
      <div className="transaction-icon" style={{
        width: 48,
        height: 48,
        marginTop: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: isDonation ? '#ff4757' : '#7b2ff2',
        background: isDonation
          ? 'linear-gradient(135deg, #ff6b81 0%, #ff4757 100%)'
          : 'linear-gradient(135deg, #7b2ff2 0%, #1e90ff 100%)',
        borderRadius: '50%',
        padding: 12,
        boxShadow: isDonation
          ? '0 4px 18px rgba(255,71,87,0.15), 0 2px 8px rgba(255,107,129,0.15)'
          : '0 4px 18px rgba(123,47,242,0.12), 0 2px 8px rgba(30,144,255,0.12)'
      }} aria-label={isDonation ? 'donación' : 'intercambio'}>
        {isDonation ? (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.001 21s-7.001-4.35-7.001-9.5C5 8.57 6.79 7 8.75 7c1.36 0 2.33.73 3.251 1.91C12.919 7.73 13.889 7 15.249 7 17.21 7 19 8.57 19 11.5c0 5.15-6.999 9.5-6.999 9.5z" fill="#fff"/>
          </svg>
        ) : (
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="11" fill="#fff" />
            <path d="M7 7h10v10" stroke="#7b2ff2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M7 17L17 7" stroke="#1e90ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
      <div className="transaction-info" style={{flex:1,minWidth:0}}>
        {/* Título del intercambio */}
        <div style={{
          fontWeight: 700,
          fontSize: 17,
          color: '#1a237e',
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <span style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>{isDonation ? 'Donación entregada' : (isCompleted ? 'Intercambio Completado' : 'Pendiente de confirmación')}</span>
        </div>
        
        {/* Información de productos */}
        <div style={{
          background: 'linear-gradient(135deg, #f8faff 0%, #f0f4ff 100%)',
          borderRadius: 10,
          padding: isDonation ? '10px 12px' : '12px 14px',
          margin: isDonation ? '0 auto 10px' : '0 0 10px 0',
          width: isDonation ? '82%' : '100%',
          border: '1px solid rgba(33, 150, 243, 0.15)',
          boxShadow: '0 2px 8px rgba(33, 150, 243, 0.08)',
          position: 'relative',
          // Altura mínima del bloque de detalles para igualar donación vs intercambio
          minHeight: 120
        }}>
          {/* Borde decorativo izquierdo */}
          <div style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 4,
            background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
            borderRadius: '0 4px 4px 0'
          }}></div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 8
          }}>
            <div style={{
              width: 6,
              height: 18,
              background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
              borderRadius: 3,
              boxShadow: '0 1px 3px rgba(33, 150, 243, 0.3)'
            }}></div>
            <span style={{
              fontSize: 13,
              fontWeight: 700,
              color: '#1565c0',
              textTransform: 'uppercase',
              letterSpacing: '0.8px'
            }}>{isDonation ? 'Tu artículo donado' : 'Tu Producto'}</span>
          </div>
          <div style={{
            fontSize: 15,
            fontWeight: 600,
            color: '#1a1a1a',
            marginBottom: 8,
            lineHeight: 1.4,
            textAlign: 'center'
          }}>
            {miProducto || 'Producto no especificado'}
          </div>
          
          {!isDonation && (
            <>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 8
              }}>
                <div style={{
                  width: 6,
                  height: 18,
                  background: 'linear-gradient(135deg, #009688 0%, #00695c 100%)',
                  borderRadius: 3,
                  boxShadow: '0 1px 3px rgba(0, 150, 136, 0.3)'
                }}></div>
                <span style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#00695c',
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px'
                }}>Producto Recibido</span>
              </div>
              <div style={{
                fontSize: 15,
                fontWeight: 600,
                color: '#1a1a1a',
                lineHeight: 1.4
              }}>
                {productoOtro || 'Producto no especificado'}
              </div>
            </>
          )}
          {isDonation && (
            // Placeholder invisible para reservar el mismo alto que la sección "Producto Recibido"
            <>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 8,
                visibility: 'hidden'
              }}>
                <div style={{
                  width: 6,
                  height: 18,
                  background: 'linear-gradient(135deg, #009688 0%, #00695c 100%)',
                  borderRadius: 3
                }}></div>
                <span style={{
                  fontSize: 13,
                  fontWeight: 700
                }}>Producto Recibido</span>
              </div>
              <div style={{
                fontSize: 15,
                fontWeight: 600,
                lineHeight: 1.4,
                visibility: 'hidden'
              }}>
                Placeholder
              </div>
            </>
          )}
        </div>
        
        {/* Información del usuario o estado según tipo */}
        {!isDonation && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            marginBottom: 10,
            padding: '12px 16px',
            background: 'linear-gradient(135deg, rgba(123,47,242,0.07) 0%, rgba(30,144,255,0.07) 100%)',
            borderRadius: 12,
            border: '1.5px solid rgba(123,47,242,0.13)',
            // Altura fija para alinear con placeholder en donaciones
            minHeight: 64
          }}>
            {transaccion.otroUserImagen ? (
              <img src={transaccion.otroUserImagen} alt={nombreOtro} style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2.5px solid #7b2ff2',
                boxShadow: '0 2px 10px rgba(123,47,242,0.13)'
              }} />
            ) : (
              <div style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: 18,
                fontWeight: 700,
                fontFamily: 'Montserrat, Inter, sans-serif',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                border: '2.5px solid rgba(255, 255, 255, 0.3)'
              }}>
                {(nombreOtro || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div style={{
                fontSize: 13,
                fontWeight: 600,
                color: '#666',
                marginBottom: 2,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Intercambiado con
              </div>
              <div style={{
                fontSize: 16,
                fontWeight: 800,
                color: '#667eea',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
              }}>
                {nombreOtro || 'Usuario no identificado'}
              </div>
            </div>
          </div>
        )}
        {isDonation && (
          // Placeholder invisible dentro de la tarjeta para alinear con el bloque de usuario
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            marginBottom: 10,
            padding: '12px 16px',
            borderRadius: 12,
            visibility: 'hidden',
            minHeight: 64
          }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%' }} />
            <div>
              <div style={{ height: 16, marginBottom: 2 }} />
              <div style={{ height: 18 }} />
            </div>
          </div>
        )}
        
        {/* Eliminado: confirmaciones y botón de confirmar. El flujo de intercambio ahora se gestiona únicamente por el stepper del chat. */}

        {/* Fecha y hora mejorada */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginTop: 12,
          padding: '8px 12px',
          background: 'rgba(158, 158, 158, 0.08)',
          borderRadius: 8,
          border: '1px solid rgba(158, 158, 158, 0.15)'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #9e9e9e 0%, #757575 100%)',
            borderRadius: '50%',
            padding: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2"/>
              <polyline points="12,6 12,12 16,14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{
            fontSize: 13,
            color: '#666',
            fontWeight: 600
          }}>
            {isDonation ? `Entregada el ${fechaStr}` : fechaStr}
          </span>
        </div>
      </div>
      
      {/* Botón de eliminar si existe handler (aplica también a donaciones) */}
      {typeof onDelete === 'function' && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
          <button
            onClick={onDelete}
            style={{
              background: 'linear-gradient(135deg, #ff4757 0%, #ff3742 100%)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: 12,
              padding: '10px',
              fontWeight: 700,
              fontSize: 12,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 8px 25px rgba(255, 71, 87, 0.3), 0 4px 15px rgba(255, 71, 87, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
              minWidth: '38px',
              width: '38px',
              height: '38px',
              backdropFilter: 'blur(10px)',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px) scale(1.02)';
              e.target.style.boxShadow = '0 12px 35px rgba(255, 71, 87, 0.4), 0 6px 20px rgba(255, 71, 87, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0) scale(1)';
              e.target.style.boxShadow = '0 8px 25px rgba(255, 71, 87, 0.3), 0 4px 15px rgba(255, 71, 87, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            }}
            title={isDonation ? 'Eliminar donación' : 'Eliminar intercambio'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M10 11v6M14 11v6" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      )}
      {/* Eliminado placeholder externo para que el botón quede alineado */}
    </div>
  );
};

export default TransactionCard;
