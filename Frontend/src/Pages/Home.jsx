import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "../components/Header";
import ProductCard from "../components/ProductCard";
import Footer from "../components/Footer";
import Carousel from "../components/Carousel";
import QuienesSomos from "../components/QuienesSomos";
import Pagination from "../components/Pagination";
import ProductsPerPage from "../components/ProductsPerPage";
import { getProducts } from "../services/api";
import useProducts from "../hooks/useProducts";
import { categorias } from "../categorias";
import { API_URL } from "../config";
import "../styles/Home.css";
import "../styles/PremiumFilters.css";

const Home = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // Usar hook personalizado para productos con sincronización automática
  const { productos, loading, error, fetchProducts } = useProducts([]);
  // Ref para hacer scroll a la sección de artículos
  const productSectionRef = useRef(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage, setProductsPerPage] = useState(16);
  const [favoritos, setFavoritos] = useState([]);
  
  // Estados para filtros avanzados
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState(""); // "recent", "week", "month", ""
  const [userFilter, setUserFilter] = useState(""); // nombre de usuario
  const [provinceFilter, setProvinceFilter] = useState(""); // provincia específica
  const [sortBy, setSortBy] = useState(""); // "date", "title", ""

  // Cargar productos desde la API usando el hook con sincronización automática
  useEffect(() => {
    const loadProducts = async () => {
      console.log('🔄 Iniciando carga de productos...');
      const data = await fetchProducts();
      console.log('✅ Productos obtenidos:', data);
      console.log(' Cantidad de productos:', data.length);
      
      // Analizar categorías únicas en los productos
      const categoriasUnicas = [...new Set(data.map(p => p.categoria).filter(Boolean))];
      console.log('🏷️ Categorías encontradas en productos:', categoriasUnicas);
      
      console.log('🏁 Finalizando carga de productos');
    };

    loadProducts();

    // Escuchar evento global para refrescar productos tras intercambio
    const handleProductsUpdated = () => {
      fetchProducts();
    };
    window.addEventListener('productsUpdated', handleProductsUpdated);
    return () => {
      window.removeEventListener('productsUpdated', handleProductsUpdated);
    };
  }, []);

  // Obtener favoritos del usuario actual desde backend
  useEffect(() => {
    const usuarioActual = JSON.parse(localStorage.getItem('usuarioActual') || '{}');
    if (!usuarioActual?.id) return;
    const token = localStorage.getItem('token');
    fetch(`${API_URL}/users/${usuarioActual.id}/favoritos`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(favs => {
        // favs puede ser array de productos, obtener solo los IDs
        setFavoritos(favs.map(fav => fav._id));
      })
      .catch(() => setFavoritos([]));
  }, []);

  // Filtrado avanzado por búsqueda, categoría, fecha, usuario y provincia
  const productosFiltrados = productos.filter((producto) => {
    // Ocultar productos intercambiados o no disponibles
    if (producto?.intercambiado === true) return false;
    if (producto?.disponible === false) return false;
    // Utilidad: normalizar para comparar sin acentos y en minúsculas
    const normalize = (s) =>
      (s || "")
        .toString()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();

    // Filtro por término de búsqueda (título y descripción)
    const matchSearch = searchTerm === "" || 
      normalize(producto.title).includes(normalize(searchTerm)) ||
      normalize(producto.description).includes(normalize(searchTerm));
    
    // Filtro por categoría mejorado y más robusto
    let matchCategoria = selectedCategory === "";
    
    if (!matchCategoria && selectedCategory && producto.categoria) {
      const selectedCat = normalize(selectedCategory);
      const productCat = normalize(producto.categoria);
      
      // Obtener el objeto de categoría seleccionada
      const categoryObj = categorias.find(cat => cat.id === selectedCategory);
      
      if (categoryObj) {
        const fullName = normalize(categoryObj.name);
        
        // Múltiples formas de hacer match:
        matchCategoria = 
          // 1. Match exacto por ID
          productCat === selectedCat ||
          // 2. Match exacto por nombre completo
          productCat === fullName ||
          // 3. El producto contiene el ID de la categoría
          productCat.includes(selectedCat) ||
          // 4. El producto contiene el nombre de la categoría
          productCat.includes(fullName) ||
          // 5. El nombre de la categoría contiene la categoría del producto
          fullName.includes(productCat) ||
          // 6. Match por palabras clave específicas
          (selectedCat === 'tecnologia' && (productCat.includes('tecnolog') || productCat.includes('electronic') || productCat.includes('comput'))) ||
          (selectedCat === 'electrodomesticos' && (productCat.includes('electrodom') || productCat.includes('hogar') || productCat.includes('cocina'))) ||
          (selectedCat === 'moda' && (productCat.includes('ropa') || productCat.includes('vestir') || productCat.includes('fashion'))) ||
          (selectedCat === 'deportes' && (productCat.includes('deport') || productCat.includes('sport') || productCat.includes('ejercicio'))) ||
          (selectedCat === 'libros' && (productCat.includes('libro') || productCat.includes('revista') || productCat.includes('comic'))) ||
          (selectedCat === 'juegos' && (productCat.includes('juego') || productCat.includes('juguete') || productCat.includes('game'))) ||
          (selectedCat === 'motor' && (productCat.includes('motor') || productCat.includes('vehiculo') || productCat.includes('auto') || productCat.includes('moto'))) ||
          (selectedCat === 'belleza' && (productCat.includes('belleza') || productCat.includes('cosmet') || productCat.includes('beauty'))) ||
          (selectedCat === 'otros' && (productCat.includes('otro') || productCat.includes('vario') || productCat.includes('misc')));
      }
    }
    
    // Debug detallado para ver las categorías
    if (selectedCategory !== "") {
      console.log('🔍 Filtro activo:', selectedCategory);
      console.log('📦 Producto:', producto.title);
      console.log('🏷️ Categoría del producto:', `"${producto.categoria}"`);
      console.log('🎯 Categoría seleccionada:', `"${selectedCategory}"`);
      console.log('✅ Match:', matchCategoria);
      console.log('---');
    }
    
    // Filtro por fecha
    let matchDate = true;
    if (dateFilter && producto.fechaPublicacion) {
      const productDate = new Date(producto.fechaPublicacion);
      const now = new Date();
      const diffTime = Math.abs(now - productDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      switch (dateFilter) {
        case "recent":
          matchDate = diffDays <= 3;
          break;
        case "week":
          matchDate = diffDays <= 7;
          break;
        case "month":
          matchDate = diffDays <= 30;
          break;
        default:
          matchDate = true;
      }
    }
    
    // Filtro por usuario
    const matchUser = userFilter === "" || 
      producto.owner?.nombre?.toLowerCase().includes(userFilter.toLowerCase()) ||
      producto.ownerName?.toLowerCase().includes(userFilter.toLowerCase());
    
    // Filtro por provincia
    const matchProvince = provinceFilter === "" || 
      producto.provincia?.toLowerCase().includes(provinceFilter.toLowerCase()) ||
      producto.ubicacion?.toLowerCase().includes(provinceFilter.toLowerCase());
    
    return matchSearch && matchCategoria && matchDate && matchUser && matchProvince;
  });
  
  // Ordenamiento de productos
  const productosOrdenados = [...productosFiltrados].sort((a, b) => {
    switch (sortBy) {
      case "date":
        return new Date(b.fechaPublicacion || b.createdAt) - new Date(a.fechaPublicacion || a.createdAt);
      case "title":
        return a.title.localeCompare(b.title);
      case "user":
        return (a.owner?.nombre || a.ownerName || "").localeCompare(b.owner?.nombre || b.ownerName || "");
      default:
        return 0;
    }
  });

  // Lógica de paginación
  const totalProducts = productosOrdenados.length;
  const totalPages = Math.ceil(totalProducts / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const endIndex = startIndex + productsPerPage;
  const productosParaMostrar = productosOrdenados.slice(startIndex, endIndex);
  
  // Funciones de paginación
  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Scroll suave hacia arriba cuando cambie la página
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;
  
  // Función para cambiar productos por página
  const handleProductsPerPageChange = (newLimit) => {
    setProductsPerPage(newLimit);
    setCurrentPage(1); // Reset a la primera página cuando cambie el límite
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reset página cuando cambien los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, dateFilter, userFilter, provinceFilter, sortBy, productsPerPage]);

  // Scroll a productos cuando la URL trae hash #productos o ?scroll=productos
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const shouldScroll = location.hash === "#productos" || params.get("scroll") === "productos";
    if (!shouldScroll) return;
    const t = setTimeout(() => {
      const target = document.getElementById('productos') || document.querySelector('.product-list') || productSectionRef.current;
      if (!target) return;
      const headerEl = document.querySelector('header');
      const offset = (headerEl ? headerEl.offsetHeight : 80) + 10;
      const rect = target.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const top = rect.top + scrollTop - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }, 200);
    return () => clearTimeout(t);
  }, [location.hash, location.search]);

  // Scroll automático usando el ID del buscador como ancla cuando se elige una categoría
  useEffect(() => {
    if (!selectedCategory) return;
    // Esperar a que cierre el menú y se renderice el layout
    const t = setTimeout(() => {
      // Asegurar que el body no esté bloqueado por el sidebar
      document.body.classList.remove('no-scroll');
      const anchor = document.getElementById('search-anchor');
      const grid = document.querySelector('.product-list');
      const target = anchor || grid || productSectionRef.current;
      const headerEl = document.querySelector('header');
      const offset = (headerEl ? headerEl.offsetHeight : 100) + 10;
      if (!target) {
        console.warn('⚠️ Scroll: no se encontró ancla ni grilla ni ref');
        return;
      }
      const doScroll = (label = 'primario') => {
        const rect = target.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const top = rect.top + scrollTop - offset;
        console.log(`🧭 Scroll ${label} hacia`, { top, offset, headerHeight: headerEl?.offsetHeight, targetId: target.id, haveGrid: !!grid });
        window.scrollTo({ top, behavior: 'smooth' });
      };
      // rAF doble para asegurar que el DOM esté libre y el overlay removido
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          doScroll('rAF');
          // Fallback adicional: si por alguna razón no se movió, intentar scrollIntoView respetando scroll-margin-top
          setTimeout(() => {
            const current = Math.abs((window.pageYOffset || document.documentElement.scrollTop) - (target.getBoundingClientRect().top + (window.pageYOffset || document.documentElement.scrollTop) - offset));
            if (current < 2) {
              try {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                console.log('↪️ Fallback scrollIntoView aplicado');
              } catch (e) {
                console.warn('scrollIntoView no disponible:', e);
              }
            }
          }, 180);
        });
      });
      // Reintento tardío por si el header cambia de tamaño tras cerrar el menú
      setTimeout(() => doScroll('retry'), 600);
    }, 300);
    return () => clearTimeout(t);
  }, [selectedCategory]);
  
  // Escuchar el evento global desde Header para forzar el scroll incluso si la categoría es la misma
  useEffect(() => {
    const handler = (evt) => {
      console.log('📣 categorySelected recibido', evt?.detail);
      // Pequeña espera por cierre de menú y repintado
      setTimeout(() => {
        // Asegurar desbloqueo de scroll del body
        document.body.classList.remove('no-scroll');
        const anchor = document.getElementById('search-anchor');
        const grid = document.querySelector('.product-list');
        const target = anchor || grid || productSectionRef.current;
        const headerEl = document.querySelector('header');
        const offset = (headerEl ? headerEl.offsetHeight : 100) + 10;
        if (!target) {
          console.warn('⚠️ [evento] No se encontró target para scroll. anchor?', !!anchor, 'grid?', !!grid, 'ref?', !!productSectionRef.current);
          return;
        }
        console.log('🔗 [evento] Target de scroll:', {
          haveAnchor: !!anchor,
          haveGrid: !!grid,
          refIsSet: !!productSectionRef.current,
          headerHeight: headerEl?.offsetHeight,
          offset
        });
        const doScroll = (label = 'evt') => {
          const rect = target.getBoundingClientRect();
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          const top = rect.top + scrollTop - offset;
          console.log(`🧭 Scroll ${label} (evento)`, { top, offset, headerHeight: headerEl?.offsetHeight, targetId: target.id, haveGrid: !!grid });
          window.scrollTo({ top, behavior: 'smooth' });
        };
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            doScroll('rAF');
          });
        });
        // Reintentos escalonados por si el header cambia altura después
        setTimeout(() => doScroll('retry-400'), 400);
        setTimeout(() => doScroll('retry-800'), 800);
        // Fallback final con scrollIntoView
        setTimeout(() => {
          try {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            console.log('↪️ Fallback final scrollIntoView (evento)');
          } catch {}
        }, 1000);
      }, 200);
    };
    console.log('🧩 Registrando listener categorySelected en Home.jsx');
    window.addEventListener('categorySelected', handler);
    return () => window.removeEventListener('categorySelected', handler);
  }, []);
  
  // Obtener nombre de categoría seleccionada
  const getCategoryName = (categoryId) => {
    const category = categorias.find(cat => cat.id === categoryId);
    return category ? category.name : 'Todas las categorías';
  };

  // Scroll a sección "Sobre nosotros" cuando la ruta sea /sobre-nosotros
  useEffect(() => {
    if (location.pathname !== "/sobre-nosotros") return;
    const t = setTimeout(() => {
      const target = document.getElementById("sobre-nosotros");
      if (!target) return;
      const headerEl = document.querySelector('header');
      const offset = (headerEl ? headerEl.offsetHeight : 80) + 10;
      const rect = target.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const top = rect.top + scrollTop - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }, 200);
    return () => clearTimeout(t);
  }, [location.pathname]);

  return (
    <div className="home-container">
      <Header
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        advancedFiltersOpen={advancedFiltersOpen}
        setAdvancedFiltersOpen={setAdvancedFiltersOpen}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        userFilter={userFilter}
        setUserFilter={setUserFilter}
        provinceFilter={provinceFilter}
        setProvinceFilter={setProvinceFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
        productosOrdenados={productosOrdenados}
      />



      {/* Carousel */}
      <Carousel />

      {/* Selector de productos por página */}
      <div className="container">
        <div className="d-flex justify-content-center">
          {!loading && !error && totalProducts > 0 && (
            <div className="d-flex align-items-center bg-white p-2 rounded-lg shadow-sm">
              <ProductsPerPage
                currentLimit={productsPerPage}
                onLimitChange={handleProductsPerPageChange}
                options={[16, 20, 24, 32, 50]}
              />
            </div>
          )}
        </div>
      </div>

      {/* Indicador de categoría seleccionada removido por redundancia */}

      {/* Buscador del header movido aquí */}
      <div id="search-anchor" className="search-section-moved" style={{ 
        background: 'linear-gradient(135deg, #f8faff 0%, #f0f4ff 100%)',
        padding: '20px',
        margin: '20px 0',
        borderRadius: '12px',
        border: '1px solid rgba(123, 47, 242, 0.1)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
      }}>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-8">
              <div className="search-wrapper-premium-v2">
                <div className="search-container-premium-v2">
                  <div className="search-input-wrapper-v2">
                    <div className="search-icon-container">
                      <svg
                        className="search-icon-v2"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <input
                      type="text"
                      className="search-input-premium-v2"
                      placeholder="Buscar productos, marcas y más..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <div className="search-divider"></div>
                    <button
                      className="btn-filters-premium-v2"
                      onClick={() =>
                        setAdvancedFiltersOpen &&
                        setAdvancedFiltersOpen(!advancedFiltersOpen)
                      }
                      title="Filtros avanzados"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "0",
                        background:
                          "linear-gradient(135deg, #6d28d9 0%, #4f46e5 100%)",
                        color: "white",
                        border: "none",
                        borderRadius: "0 25px 25px 0",
                        cursor: "pointer",
                        width: "52px",
                        height: "48px",
                        flexShrink: "0",
                      }}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M22 3H2L10 12.46V19L14 21V12.46L22 3Z"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Filtros activos */}
          {(searchTerm || selectedCategory || dateFilter || userFilter || provinceFilter || sortBy) && (
            <div className="row mt-3">
              <div className="col-12">
                <div className="active-filters d-flex flex-wrap gap-2 justify-content-center">
                  {searchTerm && (
                    <span className="badge bg-primary px-3 py-2">
                      Búsqueda: "{searchTerm}"
                      <button 
                        className="btn-close ms-2" 
                        style={{ fontSize: '10px' }}
                        onClick={() => setSearchTerm("")}
                      ></button>
                    </span>
                  )}
                  {selectedCategory && (
                    <span className="badge bg-success px-3 py-2">
                      Categoría: {getCategoryName(selectedCategory)}
                      <button 
                        className="btn-close ms-2" 
                        style={{ fontSize: '10px' }}
                        aria-label="Borrar filtro de categoría"
                        title="Borrar filtro de categoría"
                        onClick={() => setSelectedCategory("")}
                      ></button>
                    </span>
                  )}
                  {provinceFilter && (
                    <span className="badge bg-info px-3 py-2">
                      Provincia: {provinceFilter}
                      <button 
                        className="btn-close ms-2" 
                        style={{ fontSize: '10px' }}
                        onClick={() => setProvinceFilter("")}
                      ></button>
                    </span>
                  )}
                  {dateFilter && (
                    <span className="badge bg-warning px-3 py-2">
                      Fecha: {dateFilter === 'recent' ? 'Últimos 3 días' : 
                              dateFilter === 'week' ? 'Última semana' : 
                              dateFilter === 'month' ? 'Último mes' : dateFilter}
                      <button 
                        className="btn-close ms-2" 
                        style={{ fontSize: '10px' }}
                        onClick={() => setDateFilter("")}
                      ></button>
                    </span>
                  )}
                  {userFilter && (
                    <span className="badge bg-secondary px-3 py-2">
                      Usuario: {userFilter}
                      <button 
                        className="btn-close ms-2" 
                        style={{ fontSize: '10px' }}
                        onClick={() => setUserFilter("")}
                      ></button>
                    </span>
                  )}
                  {sortBy && (
                    <span className="badge bg-dark px-3 py-2">
                      Orden: {sortBy === 'date' ? 'Fecha' : 
                             sortBy === 'title' ? 'Título' : 
                             sortBy === 'user' ? 'Usuario' : sortBy}
                      <button 
                        className="btn-close ms-2" 
                        style={{ fontSize: '10px' }}
                        onClick={() => setSortBy("")}
                      ></button>
                    </span>
                  )}
                  {/* Global clear filters button removed as requested */}
                </div>
              </div>
            </div>
          )}
          
          {/* Panel de filtros avanzados */}
          {advancedFiltersOpen && (
            <div className="row mt-3">
              <div className="col-12">
                <div className="advanced-filters-panel premium" style={{
                  background: 'linear-gradient(135deg, #f8faff 0%, #f0f4ff 100%)',
                  borderRadius: '18px',
                  padding: '28px 28px 22px 28px',
                  boxShadow: '0 8px 32px rgba(123,47,242,0.10)',
                  border: '1.5px solid #e0e7ff',
                  maxWidth: 900,
                  margin: '0 auto',
                  marginBottom: 18
                }}>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold" style={{color:'#7b2ff2', fontWeight:700, fontSize:15}}>
                        Fecha de publicación
                      </label>
                      <select 
                        className="form-select premium-input"
                        style={{background:'#f4f7fe', border:'1.5px solid #d1d5fa', borderRadius:10, color:'#222', fontWeight:500, fontSize:15}}
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                      >
                        <option value="">Cualquier fecha</option>
                        <option value="recent">Últimos 3 días</option>
                        <option value="week">Última semana</option>
                        <option value="month">Último mes</option>
                      </select>
                    </div>
                    
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold" style={{color:'#7b2ff2', fontWeight:700, fontSize:15}}>
                        Categoría
                      </label>
                      <div className="position-relative">
                        <select 
                          className="form-select premium-input"
                          style={{background:'#f4f7fe', border:'1.5px solid #d1d5fa', borderRadius:10, color:'#222', fontWeight:500, fontSize:15, paddingRight:'36px'}}
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                          <option value="">Todas las categorías</option>
                          {categorias.map((categoria) => (
                            <option key={categoria.id} value={categoria.id}>
                              {categoria.icon} {categoria.name}
                            </option>
                          ))}
                        </select>
                        {selectedCategory && (
                          <button
                            type="button"
                            aria-label="Limpiar categoría"
                            title="Limpiar categoría"
                            onClick={() => setSelectedCategory("")}
                            style={{
                              position:'absolute',
                              right:10,
                              top:'50%',
                              transform:'translateY(-50%)',
                              background:'transparent',
                              border:'none',
                              padding:4,
                              cursor:'pointer',
                              color:'#111'
                            }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="18" y1="6" x2="6" y2="18"></line>
                              <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold" style={{color:'#7b2ff2', fontWeight:700, fontSize:15}}>
                        Provincia
                      </label>
                      <input
                        type="text"
                        className="form-control premium-input"
                        style={{background:'#f4f7fe', border:'1.5px solid #d1d5fa', borderRadius:10, color:'#222', fontWeight:500, fontSize:15}}
                        placeholder="Buscar por provincia..."
                        value={provinceFilter}
                        onChange={(e) => setProvinceFilter(e.target.value)}
                      />
                    </div>
                    
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold" style={{color:'#7b2ff2', fontWeight:700, fontSize:15}}>
                        Ordenar por
                      </label>
                      <select 
                        className="form-select premium-input"
                        style={{background:'#f4f7fe', border:'1.5px solid #d1d5fa', borderRadius:10, color:'#222', fontWeight:500, fontSize:15}}
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                      >
                        <option value="">Sin ordenar</option>
                        <option value="date">Fecha de publicación</option>
                        <option value="title">Título (A-Z)</option>
                        <option value="user">Usuario (A-Z)</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <div className="text-muted" style={{fontSize:14, fontWeight:500, color:'#7b2ff2'}}>
                      <span style={{marginRight:6}}></span>{productosOrdenados.length} resultados encontrados
                    </div>
                    <div className="d-flex gap-2">
                      <button 
                        className="btn premium-btn-outline"
                        style={{background:'#fff', color:'#7b2ff2', border:'1.5px solid #7b2ff2', borderRadius:8, fontWeight:600, padding:'8px 18px', fontSize:15}}
                        onClick={() => {
                          setDateFilter("");
                          setSelectedCategory("");
                          setProvinceFilter("");
                          setSortBy("");
                        }}
                      >
                        Limpiar filtros
                      </button>
                      <button 
                        className="btn premium-btn-primary"
                        style={{background:'linear-gradient(90deg,#7b2ff2 0%,#f357a8 100%)', color:'#fff', border:'none', borderRadius:8, fontWeight:600, padding:'8px 18px', fontSize:15, boxShadow:'0 2px 8px rgba(123,47,242,0.07)'}}
                        onClick={() => setAdvancedFiltersOpen(false)}
                      >
                        Cerrar filtros
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <main id="productos" className="main-content" ref={productSectionRef} style={{ scrollMarginTop: 90 }}>
        
        {/* Mostrar mensaje de carga o error */}
        {loading && <p className="text-center">Cargando productos...</p>}
        {error && <p className="text-center text-danger">{error}</p>}
        

        {/* Mostrar los productos */}
        {!loading && !error && (
          <div className="product-list">
            {productosParaMostrar.length > 0 ? (
              productosParaMostrar.map((producto) => {
                // Usar _id si existe, sino id, y comparar como string
                const productoId = String(producto._id || producto.id);
                const favoritosIds = favoritos.map(f => String(f));
                const isFavorito = favoritosIds.includes(productoId);
                console.log('🖼️ Producto en Home:', producto);
                return (
                  <ProductCard
                    key={productoId}
                    id={productoId}
                    title={producto.title}
                    description={producto.description}
                    categoria={producto.categoria}
                    image={producto.image}
                    images={producto.images}
                    fechaPublicacion={producto.fechaPublicacion || producto.createdAt}
                    provincia={producto.provincia || producto.ubicacion}
                    ownerName={producto.owner?.nombre || producto.ownerName}
                    ownerId={producto.owner?.id || producto.ownerId}
                    condicion={producto.condicion}
                    valorEstimado={producto.valorEstimado}
                    disponible={producto.disponible}
                    // Hacer toda la tarjeta clickeable
                    onConsultar={() => navigate(`/producto/${productoId}`)}
                    isFavorito={isFavorito}
                  />
                );
              })
            ) : (
              <p>No se encontraron productos</p>
            )}
          </div>
        )}

        {/* Componente de Paginación */}
        {!loading && !error && totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            hasNextPage={hasNextPage}
            hasPrevPage={currentPage > 1}
          />
        )}
        
        {/* Información de resultados */}
        {!loading && !error && totalProducts > 0 && (
          <div className="results-info text-center mt-3 mb-4">
            <p className="text-muted">
              Mostrando {startIndex + 1}-{Math.min(endIndex, totalProducts)} de {totalProducts} productos
              {searchTerm && ` para "${searchTerm}"`}
              {selectedCategory && ` en ${getCategoryName(selectedCategory)}`}
            </p>
          </div>
        )}
      </main>

      {/* Sección Quiénes Somos */}
      <QuienesSomos />

      <Footer />
    </div>
  );
};

export default Home;

