import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/Intercambiar.css";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { getProductImageUrl } from "../utils/getProductImageUrl";
import BackButton from "../components/BackButton";
import { API_URL } from "../config";


const Intercambiar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    productoId, 
    productoTitle, 
    productoImage,
    productoDescription,
    ownerId, 
    ownerNombre, 
    ownerApellido 
  } = location.state || {};

  const [formData, setFormData] = useState({
    productoOfrecido: "",
    descripcion: "",
    condiciones: "",
  });

  const [selectedProductId, setSelectedProductId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [userProducts, setUserProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 9;
  const [productCategory, setProductCategory] = useState("");

  useEffect(() => {
    // Obtener la categoría del producto objetivo para mostrar en la cabecera
    const fetchProductCategory = async () => {
      try {
        if (!productoId) return;
        const res = await fetch(`${API_URL}/products/${productoId}`);
        if (!res.ok) return;
        const data = await res.json();
        const cat = data.category || data.categoria || "";
        setProductCategory(cat);
      } catch (_) {
        // silencioso, no romper UI si falla
      }
    };

    fetchProductCategory();
  }, [productoId]);

  useEffect(() => {
    const fetchUserProducts = async () => {
      const usuarioActual = JSON.parse(localStorage.getItem("usuarioActual"));
      if (!usuarioActual) {
        navigate("/login");
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/products/user/${usuarioActual.id}`);
        if (!response.ok) {
          throw new Error("Error al obtener los productos del usuario");
        }
        const products = await response.json();
        // Filtrar el producto actual y productos ya intercambiados
        const availableProducts = products.filter(product => 
          product.id !== productoId && !product.intercambiado
        );
        setUserProducts(availableProducts);
        setError(null);
      } catch (error) {
        console.error("Error al obtener productos:", error);
        setError("No se pudieron cargar tus productos. Por favor, intenta nuevamente.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProducts();
  }, [navigate, productoId]);

  const handleProductSelect = (product) => {
    setSelectedProductId(product.id);
    setFormData(prevData => ({
      ...prevData,
      productoOfrecido: product.title,
      descripcion: product.description
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedProductId) {
      alert("Por favor, selecciona un producto para intercambiar");
      return;
    }

    if (isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);
      const usuarioActual = JSON.parse(localStorage.getItem("usuarioActual"));

      if (!usuarioActual) {
        alert("Debes iniciar sesión para enviar una propuesta");
        navigate("/login");
        return;
      }

      const selectedProduct = userProducts.find(p => p.id === selectedProductId);

      const mensaje = {
        de: `${usuarioActual.nombre} ${usuarioActual.apellido}`,
        deId: usuarioActual.id,
        paraId: ownerId,
        paraNombre: `${ownerNombre} ${ownerApellido}`,
        productoId,
        productoTitle,
        productoOfrecido: selectedProduct.title,
        descripcion: formData.condiciones,
        condiciones: formData.condiciones,
        productoOfrecidoId: selectedProduct.id,
        imagenProductoOfrecido: getProductImageUrl(selectedProduct.images || selectedProduct.image)
      };

      const response = await fetch(`${API_URL}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(mensaje),
      });

      if (!response.ok) {
        throw new Error("Error al enviar la propuesta");
      }

      await response.json();
      
      // Mostrar toast de éxito
      setShowToast(true);
      
      // Auto-ocultar toast después de 3 segundos y navegar
      setTimeout(() => {
        setShowToast(false);
        // Redirigir al perfil privado del usuario, pestaña "Mis Mensajes"
        navigate('/perfil', { state: { activeTab: 'mensajes' } });
      }, 3000);

    } catch (error) {
      console.error("Error al enviar el mensaje:", error);
      alert("Error al enviar la propuesta. Por favor, intenta nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!location.state) {
    return (
      <div className="intercambiar-container">
        <Header search={false} />
        <div className="intercambiar-error">
          <h2>Error: No se encontró la información del producto</h2>
          <button className="btn-menu" onClick={() => navigate("/")}>
            Volver al inicio
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <>
      <Header search={false} />
      <div className="intercambiar-container">
        {/* Back button top-left (icon-only) */}
        <div className="intercambiar-header">
          <BackButton className="icon-back-btn" to={-1} aria-label="Volver" />
        </div>
        <div className="intercambiar-hero">
          <div className="hero-content">
            <h1 className="hero-title">
              Enviar propuesta a <span className="user-highlight">{ownerNombre} {ownerApellido}</span>
            </h1>
          </div>
        </div>

        <div className="producto-showcase">
          <div className="producto-card-premium">
            <div className="producto-image-container">
              <img src={getProductImageUrl(productoImage)} alt={productoTitle} className="producto-image" />
            </div>
            <div className="producto-details">
              {productCategory && (() => {
                const cat = String(productCategory).toLowerCase();
                const isDonationCategory = cat.includes('donaci'); // DONACION/DONACIONES
                return (
                  <span className="categoria-badge-premium">
                    {isDonationCategory && (
                      <span className="categoria-icon">🏷️</span>
                    )}
                    {productCategory}
                  </span>
                );
              })()}
              <h2 className="producto-title">{productoTitle}</h2>
              <p className="producto-description">{productoDescription}</p>
            </div>
          </div>
        </div>

        <form className="exchange-form" onSubmit={handleSubmit}>
          <div className="form-section products-section">
            <h2 className="section-title">Selecciona tu producto</h2>
            
            {loading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Cargando tus productos...</p>
              </div>
            ) : error ? (
              <div className="error-state">
                <p className="error-message">{error}</p>
              </div>
            ) : userProducts.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📦</div>
                <h3>No tienes productos disponibles</h3>
                <p>Publica tu primer producto para comenzar a intercambiar</p>
                <button type="button" className="btn-primary" onClick={() => navigate("/publicar")}>
                  Publicar Producto
                </button>
              </div>
            ) : (
              <>
                <div className="products-gallery-fixed">
                  {userProducts.slice((currentPage - 1) * productsPerPage, currentPage * productsPerPage).map((product) => (
                    <div 
                      key={product.id} 
                      className={`product-card-elegant ${selectedProductId === product.id ? 'selected' : ''}`}
                      onClick={() => handleProductSelect(product)}
                    >
                      <div className="product-image-wrapper">
                        <img src={getProductImageUrl(product.images || product.image)} alt={product.title} className="product-image" />
                        {selectedProductId === product.id && (
                          <div className="selection-indicator">
                            <div className="check-icon">✓</div>
                          </div>
                        )}
                      </div>
                      <div className="product-content">
                        <h4 className="product-name">{product.title}</h4>
                        <p className="product-desc">{product.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* PAGINACIÓN */}
                {userProducts.length > productsPerPage && (
                  <div className="pagination-container">
                    <button 
                      className="pagination-btn"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      ← Anterior
                    </button>
                    
                    <div className="pagination-info">
                      Página {currentPage} de {Math.ceil(userProducts.length / productsPerPage)}
                    </div>
                    
                    <button 
                      className="pagination-btn"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(userProducts.length / productsPerPage)))}
                      disabled={currentPage === Math.ceil(userProducts.length / productsPerPage)}
                    >
                      Siguiente →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {selectedProductId && (
            <div className="proposal-section">
              <h2 className="section-title">Detalles de tu propuesta</h2>
              <div className="proposal-container">
                <div className="proposal-input-wrapper">
                  <textarea
                    name="condiciones"
                    value={formData.condiciones}
                    onChange={(e) => setFormData(prev => ({ ...prev, condiciones: e.target.value }))}
                    required
                    className="proposal-textarea"
                    placeholder="Describe tu propuesta de intercambio, lugar de encuentro y condiciones..."
                    rows="5"
                  />
                  <div className="input-decoration"></div>
                </div>
              </div>
            </div>
          )}

          <div className="form-actions">
            <button 
              type="submit" 
              className="btn-primary btn-submit"
              disabled={isSubmitting || !selectedProductId}
            >
              {isSubmitting ? (
                <>
                  <div className="btn-spinner"></div>
                  Enviando...
                </>
              ) : (
                "Enviar Propuesta"
              )}
            </button>
          </div>
        </form>
      </div>
      
      {/* TOAST DE ÉXITO */}
      {showToast && (
        <div className="success-toast">
          <div className="toast-content">
            <div className="toast-icon">✓</div>
            <div className="toast-message">
              <h4>¡Intercambio enviado exitosamente!</h4>
              <p>Tu propuesta ha sido enviada correctamente</p>
            </div>
          </div>
        </div>
      )}
      
      <Footer />
    </>
  );
};

export default Intercambiar;

