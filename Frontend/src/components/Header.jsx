import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/Header.css";
import { 
  FaUserCircle, 
  FaSun, 
  FaMoon, 
  FaBell, 
  FaGift,
  FaUser,
  FaComments,
  FaHeart,
  FaExchangeAlt,
  FaPlusCircle,
  FaCog,
  FaSignOutAlt,
  FaHome
} from "react-icons/fa";
import { FaSignInAlt, FaUserPlus } from "react-icons/fa";
import { FaHandHoldingHeart } from "react-icons/fa";
import { IoMdNotificationsOutline } from "react-icons/io";
import { useNotifications } from "../hooks/useNotifications";
import { useDarkMode } from "../hooks/useDarkMode";
import NotificationDropdown from "./NotificationDropdown";
import { categorias } from "../categorias";
import { API_URL } from "../config";

const Header = ({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  advancedFiltersOpen,
  setAdvancedFiltersOpen,
  dateFilter,
  setDateFilter,
  userFilter,
  setUserFilter,
  provinceFilter,
  setProvinceFilter,
  sortBy,
  setSortBy,
  productosOrdenados,
  search = true,
  isHome,
}) => {
  const [imgError, setImgError] = useState(false);
  const [darkMode, setDarkMode, toggleDarkMode] = useDarkMode();
  const usuarioActual = JSON.parse(localStorage.getItem("usuarioActual"));

  const navigate = useNavigate();
  const location = useLocation();
  const isHomePage =
    typeof isHome === "boolean"
      ? isHome
      : location.pathname === "/" || location.pathname === "/home";

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [donacionesMenuOpen, setDonacionesMenuOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [notificationDropdownOpen, setNotificationDropdownOpen] =
    useState(false);

  // Posicionamiento seguro del flyout de usuario
  const userSectionRef = useRef(null);
  const [userMenuPos, setUserMenuPos] = useState({ top: 0, left: 0 });
  const [userMenuReady, setUserMenuReady] = useState(false);
  // Anchor del ícono de notificaciones
  const notificationIconRef = useRef(null);
  // Anchor del botón de usuario cuando NO está logueado
  const guestUserButtonRef = useRef(null);

  // Refs para auto-scroll de la lista de categorías
  const categoriesSidebarRef = useRef(null);
  const categoriesBottomRef = useRef(null);

  // Hook de notificaciones reales
  const { unreadCount: notificationCount, updateUnreadCount } =
    useNotifications(usuarioActual?.id);

  // Si se quieren íconos, se pueden mapear por nombre o index, pero la lista oficial es la de categorias.

  useEffect(() => {
    if (usuarioActual) {
      console.log("🔍 Header - Usuario actual completo:", usuarioActual);

      setIsLoggedIn(true);
      const primerNombre = usuarioActual.nombre?.split(" ")[0] || "";
      setNombreUsuario(
        primerNombre.charAt(0).toUpperCase() + primerNombre.slice(1)
      );
      fetch(`${API_URL}/messages/unread/${usuarioActual.id}`)
        .then((r) => r.json())
        .then((d) => setUnread(d.total || 0))
        .catch(() => {});
    } else {
      console.log("❌ Header - No hay usuario actual en localStorage");
    }
    setImgError(false); // reset imgError al cargar usuario
  }, [usuarioActual && usuarioActual.imagen]);

  // Cerrar menús al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      let shouldCloseUserMenu = true;
      let shouldCloseDonacionesMenu = true;
      let shouldCloseNotificationsMenu = true;
      let shouldCloseCategoriesMenu = true;
      
      // Verificar si el click está dentro de algún elemento relacionado con cada menú
      const target = event.target;
      
      // Verificar menú de usuario
      if (target.closest('.user-profile-section') || 
          target.closest('.user-dropdown') || 
          target.closest('.user-icon-button')) {
        shouldCloseUserMenu = false;
      }
      
      // Verificar menú de donaciones (nuevo botón y su wrapper)
      if (target.closest('#donacionesMenu') ||
          target.closest('.donate-cta-wrapper') ||
          target.closest('.donate-cta-btn') ||
          target.closest('.dropdown-menu.show') ||
          (target.id === 'donacionesMenu')) {
        shouldCloseDonacionesMenu = false;
      }
      
      // Verificar menú de notificaciones
      if (target.closest('.notification-icon') || 
          target.closest('.notification-dropdown')) {
        shouldCloseNotificationsMenu = false;
      }
      
      // Verificar menú de categorías
      if (target.closest('.btn-categories-horizontal') || 
          target.closest('.categories-sidebar') ||
          target.closest('.categories-overlay')) {
        shouldCloseCategoriesMenu = false;
      }
      
      // Cerrar menús según corresponda
      if (shouldCloseUserMenu) {
        setMenuOpen(false);
      }
      if (shouldCloseDonacionesMenu) {
        setDonacionesMenuOpen(false);
      }
      if (shouldCloseNotificationsMenu) {
        setNotificationDropdownOpen(false);
      }
      if (shouldCloseCategoriesMenu) {
        setCategoryMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Bloquear scroll del fondo cuando el sidebar de categorías está abierto
  useEffect(() => {
    const body = document.body;
    if (categoryMenuOpen) {
      body.classList.add('no-scroll');
    } else {
      body.classList.remove('no-scroll');
    }
    return () => body.classList.remove('no-scroll');
  }, [categoryMenuOpen]);

  // Calcular posición del menú de usuario para que siempre quede visible
  useEffect(() => {
    if (!menuOpen) return;
    // Si no hay sesión, anclar al botón de invitado
    const el = isLoggedIn ? userSectionRef.current : guestUserButtonRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const menuWidth = 280; // coincide con maxWidth
    const padding = 8;
    const left = Math.min(
      Math.max(padding, rect.right - menuWidth),
      window.innerWidth - menuWidth - padding
    );
    const top = Math.min(rect.bottom + 10, window.innerHeight - padding);
    setUserMenuPos({ top, left });
    // ya está posicionado tras abrir
    setUserMenuReady(true);
  }, [menuOpen]);

  // Reposicionar en scroll/resize mientras el menú esté abierto
  useEffect(() => {
    if (!menuOpen) return;
    const handler = () => {
      const el = isLoggedIn ? userSectionRef.current : guestUserButtonRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const menuWidth = 280;
      const padding = 8;
      const left = Math.min(
        Math.max(padding, rect.right - menuWidth),
        window.innerWidth - menuWidth - padding
      );
      const top = Math.min(rect.bottom + 10, window.innerHeight - padding);
      setUserMenuPos({ top, left });
    };
    window.addEventListener('resize', handler);
    window.addEventListener('scroll', handler, { passive: true });
    handler();
    return () => {
      window.removeEventListener('resize', handler);
      window.removeEventListener('scroll', handler);
    };
  }, [menuOpen]);

  // Cerrar el menú de usuario ante scroll/rueda/touchmove fuera del menú
  useEffect(() => {
    if (!menuOpen) return;
    const close = (e) => {
      // si el evento viene desde dentro del menú, no cerrar
      const target = e.target;
      // Excluir también el botón de usuario cuando no hay sesión
      if (target && target.closest) {
        if (
          target.closest('.user-dropdown') ||
          target.closest('.user-profile-section') ||
          target.closest('.user-icon-button')
        ) {
          return;
        }
      }
      // Por seguridad, verificar refs
      const guestBtn = guestUserButtonRef.current;
      const userSection = userSectionRef.current;
      if ((guestBtn && guestBtn.contains(target)) || (userSection && userSection.contains(target))) {
        return;
      }
      setMenuOpen(false);
    };
    // Interacciones que deben cerrar el menú si ocurren fuera del flyout
    window.addEventListener('pointerdown', close, { passive: true });
    window.addEventListener('mousedown', close, { passive: true });
    window.addEventListener('click', close, { passive: true });
    window.addEventListener('wheel', close, { passive: true });
    window.addEventListener('scroll', close, { passive: true });
    window.addEventListener('touchmove', close, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', close);
      window.removeEventListener('mousedown', close);
      window.removeEventListener('click', close);
      window.removeEventListener('wheel', close);
      window.removeEventListener('scroll', close);
      window.removeEventListener('touchmove', close);
    };
  }, [menuOpen]);

  // Helper para calcular posición antes de abrir (evita primer paint en 0,0)
  const computeUserMenuInitialPos = () => {
    const el = isLoggedIn ? userSectionRef.current : guestUserButtonRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const menuWidth = 280;
    const padding = 8;
    const left = Math.min(
      Math.max(padding, rect.right - menuWidth),
      window.innerWidth - menuWidth - padding
    );
    const top = Math.min(rect.bottom + 10, window.innerHeight - padding);
    setUserMenuPos({ top, left });
  };

  // Auto-scroll al fondo cuando se abre el sidebar de categorías
  useEffect(() => {
    if (!categoryMenuOpen) return;
    const id = requestAnimationFrame(() => {
      const sidebar = categoriesSidebarRef.current;
      const bottom = categoriesBottomRef.current;
      if (bottom && typeof bottom.scrollIntoView === 'function') {
        bottom.scrollIntoView({ block: 'end' });
      } else if (sidebar) {
        sidebar.scrollTop = sidebar.scrollHeight;
      }
    });
    return () => cancelAnimationFrame(id);
  }, [categoryMenuOpen]);

  // Abrir menú de categorías si llega ?openCats=1 en la URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('openCats') === '1') {
      setCategoryMenuOpen(true);
      // Asegurar desbloqueo de scroll del body si venimos de overlay
      document.body.classList.remove('no-scroll');
    }
  }, [location.search]);

  // refrescar cada 30s
  useEffect(() => {
    const usuario = JSON.parse(localStorage.getItem("usuarioActual"));
    if (!usuario) return;
    const interval = setInterval(() => {
      fetch(`${API_URL}/messages/unread/${usuario.id}`)
        .then((r) => r.json())
        .then((d) => setUnread(d.total || 0))
        .catch(() => {});
    }, 30000);
    window.refreshUnread = () => {
      fetch(`${API_URL}/messages/unread/${usuario.id}`)
        .then((r) => r.json())
        .then((d) => setUnread(d.total || 0))
        .catch(() => {});
    };
    return () => {
      clearInterval(interval);
      delete window.refreshUnread;
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("usuarioActual");
    setIsLoggedIn(false);
    window.location.href = "/"; // Fuerza recarga total para limpiar estado en memoria
  };

  return (
    <>
      <header
        className="bg-light border-bottom w-100"
        style={{ position: "relative", zIndex: 10 }}
      >
        <div className="container-fluid py-2 px-4">
          <div className="row align-items-center justify-content-between">
            <div className="col-md-3 d-flex align-items-center">
              <h2
                className="brand-logo-custom"
                onClick={() => navigate("/")}
                style={{
                  cursor: "pointer",
                  fontFamily: "'Poppins', 'Roboto', sans-serif !important",
                  fontWeight: "700 !important",
                  fontSize: "3.6rem !important",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  display: "flex !important",
                  alignItems: "baseline",
                  gap: "0",
                  margin: "0 !important",
                  padding: "0 !important",
                  border: "none !important",
                  background: "none !important",
                  lineHeight: "1 !important",
                }}
              >
                <span
                  className="logo-swap"
                  style={{
                    color: darkMode ? "#ffffff" : "#1e293b",
                    fontWeight: "800",
                    fontSize: "3.6rem",
                    letterSpacing: "-0.8px",
                    display: "inline-block",
                    fontFamily: "'Poppins', sans-serif",
                    lineHeight: "1",
                    verticalAlign: "baseline",
                    textShadow: darkMode 
                      ? "0 0 20px rgba(139, 92, 246, 0.6), 0 0 40px rgba(139, 92, 246, 0.4)"
                      : "none",
                  }}
                >
                  Swap
                </span>
                <span
                  className="logo-web"
                  style={{
                    color: darkMode ? "#06b6d4" : "#3b82f6",
                    fontWeight: "800",
                    fontSize: "3.6rem",
                    letterSpacing: "-0.8px",
                    fontFamily: "'Poppins', sans-serif",
                    marginLeft: "0",
                    lineHeight: "1",
                    verticalAlign: "baseline",
                    textShadow: darkMode 
                      ? "0 0 20px rgba(6, 182, 212, 0.6), 0 0 40px rgba(6, 182, 212, 0.4)"
                      : "none",
                  }}
                >
                  Web
                </span>
              </h2>
            </div>

            {/* Navegación central */}
            <div className="col-md-6 d-flex justify-content-center align-items-center">
              <nav className="main-nav d-flex gap-4">
                <div className="position-relative" style={{ display: "inline-block" }}>
                  {/* Donaciones movido al botón Donar (flyout a la derecha) */}
                </div>
                
              </nav>
            </div>

            <div className="col-md-3 d-flex justify-content-end align-items-center position-relative">
              {/* Donar CTA con flyout (a la izquierda del modo oscuro) */}
              <div className="donate-cta-wrapper me-3" style={{ position: 'relative', display: 'inline-block' }}>
                <button
                  className="donate-cta-btn"
                  onClick={() => {
                    const next = !donacionesMenuOpen;
                    setDonacionesMenuOpen(next);
                    if (next) {
                      setMenuOpen(false);
                      setCategoryMenuOpen(false);
                      setNotificationDropdownOpen(false);
                    }
                  }}
                  aria-label="Donar"
                  title="Donar"
                >
                  <FaHandHoldingHeart className="donate-cta-icon" />
                  <span className="donate-cta-text">Donar</span>
                </button>

                {donacionesMenuOpen && (
                  <div
                    className="dropdown-menu show"
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      left: 0,
                      zIndex: 2147483647,
                      minWidth: '180px',
                      background: darkMode 
                        ? 'linear-gradient(to bottom, #1a0f2e 0%, #0a0510 50%, #000000 100%)'
                        : 'linear-gradient(to bottom, #ffffff 0%, #f8f9fa 50%, #e9ecef 100%)',
                      border: darkMode ? '1px solid #444' : '1px solid #dee2e6',
                      borderRadius: '12px',
                      boxShadow: darkMode 
                        ? '0 8px 32px rgba(0, 0, 0, 0.8)'
                        : '0 8px 32px rgba(0, 0, 0, 0.15)',
                      padding: '8px 0',
                      opacity: 1,
                      pointerEvents: 'auto',
                      visibility: 'visible'
                    }}
                  >
                    <button
                      className="dropdown-item user-menu-item"
                      onClick={() => {
                        navigate('/donaciones');
                        setDonacionesMenuOpen(false);
                      }}
                      style={{
                        border: 'none',
                        background: 'none',
                        padding: '10px 20px',
                        width: '100%',
                        textAlign: 'left',
                        color: darkMode ? '#e5e7eb' : '#212529',
                        fontSize: '0.95rem',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = darkMode ? 'rgba(139, 92, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                      }}
                    >
                      <FaGift className="menu-icon" />
                      Explorar Donaciones
                    </button>
                    <button
                      className="dropdown-item user-menu-item"
                      onClick={() => {
                        navigate('/donaciones/publicar');
                        setDonacionesMenuOpen(false);
                      }}
                      style={{
                        border: 'none',
                        background: 'none',
                        padding: '10px 20px',
                        width: '100%',
                        textAlign: 'left',
                        color: darkMode ? '#e5e7eb' : '#212529',
                        fontSize: '0.95rem',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = darkMode ? 'rgba(139, 92, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                      }}
                    >
                      <FaPlusCircle className="menu-icon" />
                      Publicar Donación
                    </button>
                    
                    
                  </div>
                )}
              </div>

              {isLoggedIn && (
                <div className="header-user-section">
                  {/* Icono de notificaciones moderno */}
                  <div
                    className="notification-icon-container"
                    ref={notificationIconRef}
                    onClick={() => {
                      const next = !notificationDropdownOpen;
                      setNotificationDropdownOpen(next);
                      if (next) {
                        // cerrar otros menús para evitar superposición
                        setMenuOpen(false);
                        setCategoryMenuOpen(false);
                      }
                    }}
                    title={
                      notificationCount > 0
                        ? `Tienes ${notificationCount} notificaciones nuevas`
                        : "Notificaciones"
                    }
                    style={{
                      display: "flex !important",
                      alignItems: "center !important",
                      justifyContent: "center !important",
                      width: "52px !important",
                      height: "52px !important",
                      borderRadius: "26px !important",
                      backgroundColor: "white !important",
                      border: "2px solid #7b2ff2 !important",
                      boxShadow:
                        "0 4px 12px rgba(123, 47, 242, 0.15) !important",
                      cursor: "pointer !important",
                      transition: "all 0.3s ease !important",
                      position: "relative !important",
                      "--icon-size": "52px",
                    }}
                  >
                    <FaBell size={24} color={darkMode ? "#e5e7eb" : "#7b2ff2"} />
                    {notificationCount > 0 && (
                      <span
                        className={`notification-badge ${
                          notificationCount > 99
                            ? "three"
                            : notificationCount > 9
                            ? "two"
                            : "one"
                        }`}
                      >
                        {notificationCount > 99 ? "99+" : notificationCount}
                      </span>
                    )}
                  </div>

                  {notificationDropdownOpen && (
                    <NotificationDropdown
                      userId={usuarioActual?.id}
                      isOpen={notificationDropdownOpen}
                      onClose={() => setNotificationDropdownOpen(false)}
                      anchorRef={notificationIconRef}
                      onAfterAction={updateUnreadCount}
                    />
                  )}

                  {/* Sección de usuario con avatar y texto */}
                  <div
                    className="user-profile-section"
                    ref={userSectionRef}
                    role="button"
                    tabIndex={0}
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                    onClick={() => {
                      const next = !menuOpen;
                      if (next) {
                        computeUserMenuInitialPos();
                        setUserMenuReady(true);
                      } else {
                        setUserMenuReady(false);
                      }
                      setMenuOpen(next);
                      if (next) {
                        setNotificationDropdownOpen(false);
                        setCategoryMenuOpen(false);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setMenuOpen((v) => !v);
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="user-avatar-container">
                      {(() => {
                        const imgSrc =
                          usuarioActual?.imagen || "/images/fotoperfil.jpg";
                        return usuarioActual && imgSrc && !imgError ? (
                          <img
                            src={
                              imgSrc.startsWith("data:") ||
                              imgSrc.startsWith("http") ||
                              imgSrc.startsWith("/")
                                ? imgSrc
                                : `/images/${imgSrc}`
                            }
                            alt={`Foto de perfil de ${
                              nombreUsuario || "usuario"
                            }`}
                            className="user-avatar-premium"
                            onError={() => setImgError(true)}
                          />
                        ) : (
                          <div className="user-avatar-fallback">
                            <svg
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <path
                                d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <circle
                                cx="12"
                                cy="7"
                                r="4"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>
                        );
                      })()}
                    </div>
                    <div className="user-info-text">
                      <span 
                        style={{
                          color: darkMode ? '#ffffff' : '#1a1a1a',
                          fontWeight: '600',
                          textShadow: 'none',
                          fontSize: '14px',
                          opacity: '1',
                          visibility: 'visible',
                          display: 'inline-block',
                          fontFamily: 'inherit',
                          lineHeight: '1.4',
                          letterSpacing: '0.01em',
                          WebkitTextFillColor: darkMode ? '#ffffff' : '#1a1a1a',
                          textDecoration: 'none',
                          background: 'transparent'
                        }}
                      >
                        {location.pathname === "/" ? "Hola," : ""}
                      </span>
                      <span 
                        style={{
                          color: darkMode ? '#ffffff' : '#1a1a1a',
                          fontWeight: '600',
                          textShadow: 'none',
                          fontSize: '14px',
                          opacity: '1',
                          visibility: 'visible',
                          display: 'inline-block',
                          fontFamily: 'inherit',
                          lineHeight: '1.4',
                          letterSpacing: '0.01em',
                          WebkitTextFillColor: darkMode ? '#ffffff' : '#1a1a1a',
                          textDecoration: 'none',
                          background: 'transparent'
                        }}
                      >{nombreUsuario}</span>
                    </div>
                    <svg
                      className="user-dropdown-arrow"
                      width="12"
                      height="8"
                      viewBox="0 0 12 8"
                      fill="none"
                    >
                      <path
                        d="M1 1.5L6 6.5L11 1.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              )}

              {!isLoggedIn && (
              <button
                className="user-icon-button"
                ref={guestUserButtonRef}
                onClick={() => {
                  const next = !menuOpen;
                  if (next) {
                    computeUserMenuInitialPos();
                    setUserMenuReady(true);
                  } else {
                    setUserMenuReady(false);
                  }
                  setMenuOpen(next);
                }}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                title="Cuenta"
              >
                <FaUserCircle size={28} color="#bcbcbc" />
              </button>
            )}

              {menuOpen && userMenuReady && (
                <div
                  className="dropdown-menu d-block user-dropdown"
                  style={{ 
                    zIndex: 2147483647,
                    position: 'fixed',
                    top: `${userMenuPos.top}px`,
                    left: `${userMenuPos.left}px`,
                    minWidth: '220px',
                    maxWidth: '280px',
                    maxHeight: 'min(85vh, 700px)',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    overscrollBehavior: 'contain',
                    background: darkMode 
                      ? 'linear-gradient(to bottom, #1a0f2e 0%, #0a0510 50%, #000000 100%)'
                      : 'linear-gradient(to bottom, #ffffff 0%, #f8f9fa 50%, #e9ecef 100%)',
                    border: darkMode ? '1px solid #444' : '1px solid #dee2e6',
                    color: darkMode ? '#e5e7eb' : '#212529',
                    borderRadius: '12px',
                    boxShadow: darkMode 
                      ? '0 8px 32px rgba(0, 0, 0, 0.8)'
                      : '0 8px 32px rgba(0, 0, 0, 0.15)',
                    transform: 'translateY(0)',
                    opacity: 1,
                    pointerEvents: 'auto',
                    visibility: 'visible',
                    marginTop: 0
                  }}
                >
                  {!isLoggedIn ? (
                    <>
                      <button
                        className="dropdown-item user-menu-item"
                        onClick={() => {
                          navigate("/register");
                          setMenuOpen(false);
                        }}
                      >
                        <FaUserPlus className="menu-icon" />
                        Crear cuenta
                      </button>
                      <button
                        className="dropdown-item user-menu-item"
                        onClick={() => {
                          navigate("/login");
                          setMenuOpen(false);
                        }}
                      >
                        <FaSignInAlt className="menu-icon" />
                        Ingresar
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="dropdown-item user-menu-item"
                        onClick={() => {
                          navigate(`/`);
                          setMenuOpen(false);
                        }}
                      >
                        <FaHome className="menu-icon" />
                        Inicio
                      </button>
                      <button
                        className="dropdown-item user-menu-item"
                        onClick={() => {
                          navigate(`/perfil`);
                          setMenuOpen(false);
                        }}
                      >
                        <FaUser className="menu-icon" />
                        Mi Perfil
                      </button>
                      <button
                        className="dropdown-item user-menu-item"
                        onClick={() => {
                          navigate(`/perfil`, {
                            state: { activeTab: "mensajes" },
                          });
                          setMenuOpen(false);
                        }}
                      >
                        <FaComments className="menu-icon" />
                        Mis Mensajes
                      </button>
                      <button
                        className="dropdown-item user-menu-item"
                        onClick={() => {
                          navigate(`/perfil`, {
                            state: { activeTab: "favoritos" },
                          });
                          setMenuOpen(false);
                        }}
                      >
                        <FaHeart className="menu-icon" />
                        Favoritos
                      </button>
                      <button
                        className="dropdown-item user-menu-item"
                        onClick={() => {
                          navigate(`/perfil`, {
                            state: { activeTab: "donaciones" },
                          });
                          setMenuOpen(false);
                        }}
                      >
                        <FaHandHoldingHeart className="menu-icon" />
                        Mis Donaciones
                      </button>
                      <button
                        className="dropdown-item user-menu-item"
                        onClick={() => {
                          navigate(`/perfil`, {
                            state: { activeTab: "transacciones" },
                          });
                          setMenuOpen(false);
                        }}
                      >
                        <FaExchangeAlt className="menu-icon" />
                        Mis Intercambios
                      </button>
                      <button
                        className="dropdown-item user-menu-item"
                        onClick={() => {
                          navigate(`/perfil`, {
                            state: { activeTab: "articulos" },
                          });
                          setMenuOpen(false);
                        }}
                      >
                        <FaPlusCircle className="menu-icon" />
                        Publicar un Producto
                      </button>
                      <button
                        className="dropdown-item user-menu-item"
                        onClick={() => {
                          navigate("/configuracion");
                          setMenuOpen(false);
                        }}
                      >
                        <FaCog className="menu-icon" />
                        Configuración
                      </button>
                      <hr className="menu-divider" />
                      <button
                        className="dropdown-item user-menu-item logout-item"
                        onClick={() => {
                          handleLogout();
                          setMenuOpen(false);
                        }}
                      >
                        <FaSignOutAlt className="menu-icon" />
                        Cerrar sesión
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>


      {/* Barra horizontal de categorías debajo del header - solo en página principal */}
      {search && isHomePage && (
        <div className="categories-bar-horizontal">
          <div className="container-fluid px-4">
            <button
              className="btn-categories-horizontal d-flex align-items-center gap-2 w-100"
              onClick={() => setCategoryMenuOpen(!categoryMenuOpen)}
            >
              <div className="menu-icon-lines">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <span className="categories-text">Todas las categorías</span>
              <svg
                className="dropdown-arrow"
                width="12"
                height="8"
                viewBox="0 0 12 8"
                fill="none"
                style={{
                  transform: categoryMenuOpen
                    ? "rotate(180deg)"
                    : "rotate(0deg)",
                  transition: "transform 0.2s",
                }}
              >
                <path
                  d="M1 1.5L6 6.5L11 1.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {categoryMenuOpen && (
              <>
                {/* Overlay oscuro */}
                <div
                  className="categories-overlay"
                  onClick={() => setCategoryMenuOpen(false)}
                ></div>

                {/* Panel lateral de categorías */}
                <div className="categories-sidebar" ref={categoriesSidebarRef}>
                  <div className="categories-header">
                    <h3 className="categories-title">Categorías</h3>
                    <button
                      className="categories-close-btn"
                      onClick={() => setCategoryMenuOpen(false)}
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M18 6L6 18M6 6L18 18"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>

                  <div className="categories-list">
                    {categorias.map((category) => (
                      <div key={category.id} className="category-item">
                        <button
                          className={`category-button ${selectedCategory === category.id ? 'selected' : ''}`}
                          onClick={() => {
                            console.log('🏷️ Categoría seleccionada:', category.id, category.name);
                            setSelectedCategory(category.id);
                            // Limpiar búsqueda para no filtrar en 0 resultados
                            if (typeof setSearchTerm === 'function') setSearchTerm("");
                            // Cerrar panel de filtros avanzados si estuviera abierto
                            if (typeof setAdvancedFiltersOpen === 'function') setAdvancedFiltersOpen(false);
                            setCategoryMenuOpen(false);
                            // Notificar selección para forzar scroll aunque la categoría sea la misma
                            try {
                              const evt = new CustomEvent('categorySelected', { detail: { id: category.id } });
                              window.dispatchEvent(evt);
                            } catch (e) {
                              console.warn('No se pudo despachar categorySelected:', e);
                            }
                          }}
                        >
                          <span 
                            className="category-icon"
                            style={selectedCategory === category.id ? {
                              textShadow: 'none',
                              WebkitTextShadow: 'none',
                              MozTextShadow: 'none',
                              filter: 'none',
                              color: '#ffffff',
                              background: '#7c3aed',
                              borderRadius: '50%',
                              width: '24px',
                              height: '24px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '12px'
                            } : {}}
                          >
                            {selectedCategory === category.id ? '✓' : category.icon}
                          </span>
                          <span 
                            className="category-name"
                            style={selectedCategory === category.id ? {
                              textShadow: 'none',
                              WebkitTextShadow: 'none', 
                              MozTextShadow: 'none',
                              filter: 'none',
                              color: '#ffffff'
                            } : {}}
                          >
                            {category.name}
                          </span>
                         <svg
                            className="category-expand"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <path
                              d="M12 5V19M5 12H19"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}

                    <div className="category-divider"></div>

                    <div className="category-item">
                      <button
                        className="category-button category-all"
                        onClick={() => {
                          console.log('🔄 Mostrando todas las categorías');
                          setSelectedCategory("");
                          setCategoryMenuOpen(false);
                          try {
                            const evt = new CustomEvent('categorySelected', { detail: { id: '' } });
                            window.dispatchEvent(evt);
                          } catch (e) {
                            console.warn('No se pudo despachar categorySelected (todas):', e);
                          }
                        }}
                      >
                        <span className="category-icon">🔄</span>
                        <span className="category-name">
                          Ver todas las categorías
                        </span>
                      </button>
                    </div>
                    <div ref={categoriesBottomRef} />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
