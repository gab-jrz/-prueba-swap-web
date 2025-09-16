import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/PerfilUsuario.css";
import "../styles/PerfilUsuario-Remodelado.css";
import BackButton from "../components/BackButton";
import Header from "../components/Header.jsx";
import ArticuloCard from "../components/ArticuloCard.jsx";
import Footer from "../components/Footer.jsx";
import DeleteModal from "../components/DeleteModal.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";
import StepperIntercambio from "../components/StepperIntercambio.jsx";
import "../styles/StepperIntercambio.css";
import ChatBubble from "../components/ChatBubble.jsx";
import TransactionCard from "../components/TransactionCard.jsx";
import RatingModal from "../components/RatingModal";
import DonationCard from "../components/DonationCard.jsx";
import "../styles/DonationsList.css";
import { useDarkMode } from "../hooks/useDarkMode";
import { getProductImageUrl } from "../utils/getProductImageUrl";
import { normalizeImageUrl } from "../utils/normalizeImageUrl";
import ProductCard from "../components/ProductCard.jsx";
import "../styles/Home.css";
import PerfilDetallesBox from "../components/PerfilDetallesBox.jsx";
import { useToast } from "../components/ToastProvider.jsx";
import { API_URL } from "../config";

// API_URL importado desde config.js

// Función para obtener URL de imágenes de donaciones
const getDonationImageUrl = (imageName) => {
  if (!imageName) return null;
  if (imageName.startsWith("http")) return imageName;
  return `${API_URL.replace("/api", "")}/uploads/products/${imageName}`;
};

// Helper para convertir un File a data URL (base64) para envío de imágenes
const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    } catch (e) {
      reject(e);
    }
  });

const PerfilUsuario = () => {
  const toast = useToast();
  const [darkMode] = useDarkMode();
  const [usuario, setUsuario] = useState(() =>
    JSON.parse(localStorage.getItem("usuarioActual"))
  );
  // Modal de felicitación al marcar donación como entregada
  const [showDonationCongrats, setShowDonationCongrats] = useState(false);
  useEffect(() => {
    if (!usuario || !usuario.id) {
      window.location.href = "/login";
      return;
    }
  }, [usuario]);

  // Cargar donaciones al iniciar el perfil (para que aparezcan en "Mis Intercambios")
  useEffect(() => {
    const u = JSON.parse(localStorage.getItem("usuarioActual"));
    if (u && (u.id || u._id)) {
      loadDonaciones?.();
    }
  }, []);
  // --- DECLARACIÓN DE ESTADOS ---

  // Sincronización global de usuario tras edición (todos los datos)
  useEffect(() => {
    const handleProfileUpdated = async (event) => {
      const payload = event.detail || {};
      // Si llega solo un id (payload mínimo), usar usuarioActual de localStorage como fuente de verdad
      const isSparse =
        payload && Object.keys(payload).length <= 2 && payload.id; // id y quizá provincia
      let updatedUser = payload;
      if (isSparse) {
        try {
          const fromLS =
            JSON.parse(localStorage.getItem("usuarioActual")) || {};
          // Si LS coincide con el id, preferirlo; de lo contrario mantener payload
          if (fromLS && fromLS.id === payload.id) {
            updatedUser = fromLS;
          }
        } catch {}
      }
      // Persistir y actualizar estado base
      setUsuario(updatedUser);
      try {
        localStorage.setItem("usuarioActual", JSON.stringify(updatedUser));
      } catch {}
      // Imagen de perfil robusta
      let imagenUrl = "/images/fotoperfil.jpg";
      if (updatedUser.imagen) {
        if (updatedUser.imagen.startsWith("data:image")) {
          imagenUrl = updatedUser.imagen;
        } else if (updatedUser.imagen.startsWith("http")) {
          imagenUrl = updatedUser.imagen;
        } else {
          imagenUrl = updatedUser.imagen.startsWith("/")
            ? `${API_URL}${updatedUser.imagen}`
            : `${API_URL}/${updatedUser.imagen}`;
        }
      }
      setImagenPerfil(imagenUrl);
    };
    window.addEventListener("userProfileUpdated", handleProfileUpdated);
    // Al montar, sincronizar desde localStorage si existe actualización pendiente
    const usuarioLS = JSON.parse(localStorage.getItem("usuarioActual"));
    if (usuarioLS && usuarioLS.id) {
      setUsuario(usuarioLS);
      let imagenUrl = "/images/fotoperfil.jpg";
      if (usuarioLS.imagen) {
        if (usuarioLS.imagen.startsWith("data:image")) {
          imagenUrl = usuarioLS.imagen;
        } else if (usuarioLS.imagen.startsWith("http")) {
          imagenUrl = usuarioLS.imagen;
        } else {
          imagenUrl = usuarioLS.imagen.startsWith("/")
            ? `${API_URL}${usuarioLS.imagen}`
            : `${API_URL}/${usuarioLS.imagen}`;
        }
      }
      setImagenPerfil(imagenUrl);
    }
    return () =>
      window.removeEventListener("userProfileUpdated", handleProfileUpdated);
  }, []);

  // Pestaña activa ('articulos', 'transacciones', 'mensajes', 'favoritos', 'donaciones')
  const [activeTab, setActiveTab] = useState("articulos");

  // Estados para donaciones
  const [donaciones, setDonaciones] = useState([]);
  const [loadingDonaciones, setLoadingDonaciones] = useState(false);

  useEffect(() => {
    const usuarioActual = JSON.parse(
      localStorage.getItem("usuarioActual") || "{}"
    );
    if (!usuarioActual?.id) return;
    const token = localStorage.getItem("token");
    fetch(`${API_URL}/users/${usuarioActual.id}/favoritos`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((favs) => setFavoritos(favs))
      .catch(() => setFavoritos([]));
  }, []);

  // Función para eliminar producto de favoritos
  const handleRemoveFromFavorites = async (productId) => {
    const usuarioActual = JSON.parse(
      localStorage.getItem("usuarioActual") || "{}"
    );
    if (!usuarioActual?.id) return;
    const token = localStorage.getItem("token");
    await fetch(`${API_URL}/users/${usuarioActual.id}/favoritos/${productId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    // Vuelve a cargar los favoritos desde el backend
    fetch(`${API_URL}/users/${usuarioActual.id}/favoritos`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((favs) => setFavoritos(favs))
      .catch(() => setFavoritos([]));
  };

  // Datos del usuario y sus productos

  const [productos, setProductos] = useState([]);
  const [transacciones, setTransacciones] = useState([]);
  const [favoritos, setFavoritos] = useState([]);

  // Imagen de perfil sincronizada globalmente
  const [imagenPerfil, setImagenPerfil] = useState("/images/fotoperfil.jpg");

  // Gestión de chats y mensajes
  const [chats, setChats] = useState({});
  const [chatSeleccionado, setChatSeleccionado] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editText, setEditText] = useState("");
  // Donación asociada al chat seleccionado
  const [chatDonation, setChatDonation] = useState(null);
  const [chatDonationLoading, setChatDonationLoading] = useState(false);
  const [chatDonationError, setChatDonationError] = useState(null);
  // Refs para scroll inteligente

  // Para saber si el usuario envió el último mensaje
  const lastMessageFromMeRef = useRef(false);
  // Track último mensaje para animación de llegada
  const lastRenderedMessageIdRef = useRef(null);

  // Avatar del otro usuario para el Stepper
  const [avatarOtro, setAvatarOtro] = useState("/images/fotoperfil.jpg");

  // Actualizar avatar del otro usuario cuando cambian chatSeleccionado o chats
  useEffect(() => {
    const usuarioActual = JSON.parse(
      localStorage.getItem("usuarioActual") || "{}"
    );
    if (!chatSeleccionado || !chats[chatSeleccionado] || !usuarioActual?.id) {
      setAvatarOtro("/images/fotoperfil.jpg");
      return;
    }

    const mensajeIntercambio = chats[chatSeleccionado].find(
      (m) => m.productoId && m.productoOfrecidoId
    );
    if (!mensajeIntercambio) {
      setAvatarOtro("/images/fotoperfil.jpg");
      return;
    }

    const idOtro =
      mensajeIntercambio.deId === usuarioActual.id
        ? mensajeIntercambio.paraId
        : mensajeIntercambio.deId;
    const url =
      mensajeIntercambio.paraId === usuarioActual.id
        ? mensajeIntercambio.deImagen
        : mensajeIntercambio.paraImagen;

    if (url) {
      const normalized = normalizeImageUrl(url);
      console.log(
        "[AvatarOtro] url cruda:",
        url,
        " normalizada:",
        normalized,
        " idOtro:",
        idOtro
      );
      setAvatarOtro(normalized);
    } else if (idOtro) {
      import("../utils/getUserProfileImage").then((mod) =>
        mod.getUserProfileImage(idOtro).then(setAvatarOtro)
      );
    } else {
      setAvatarOtro("/images/fotoperfil.jpg");
    }
  }, [chatSeleccionado, chats]);

  // Cargar detalles de la donación cuando el chat seleccionado está asociado a una donación
  useEffect(() => {
    try {
      setChatDonationError(null);
      if (
        !chatSeleccionado ||
        !chats[chatSeleccionado] ||
        chats[chatSeleccionado].length === 0
      ) {
        setChatDonation(null);
        return;
      }
      const base = chats[chatSeleccionado][0];
      const did = base?.donacionId;
      if (!did) {
        setChatDonation(null);
        return;
      }
      setChatDonationLoading(true);
      fetch(`${API_URL}/donations/${did}`)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then((data) => setChatDonation(data))
        .catch((err) =>
          setChatDonationError(err.message || "Error al cargar donación")
        )
        .finally(() => setChatDonationLoading(false));
    } catch (e) {
      setChatDonationError(e.message);
      setChatDonationLoading(false);
    }
  }, [chatSeleccionado, chats]);

  // Modales y confirmaciones
  const [showConfirmDeleteTrans, setShowConfirmDeleteTrans] = useState(false);
  const [transToDelete, setTransToDelete] = useState(null);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    productId: null,
    productTitle: "",
  });
  // Confirmación para eliminar donación (en pestaña Mis Intercambios)
  const [showConfirmDeleteDonation, setShowConfirmDeleteDonation] =
    useState(false);
  const [donationToDelete, setDonationToDelete] = useState(null);
  // Confirmación para eliminar chat desde el menú contextual
  const [showConfirmChatDelete, setShowConfirmChatDelete] = useState(false);
  const [chatToDelete, setChatToDelete] = useState(null);

  // Deduplicar mensajes usando firma compuesta (
  // combina remitente, receptor, texto, producto y timestamp
  const uniqMessages = (msgs) => {
    const unique = [];
    const map = new Map();
    for (const msg of msgs) {
      if (!map.has(msg._id)) {
        map.set(msg._id, true);
        unique.push(msg);
      }
    }
    return unique;
  };

  // Agrupar mensajes en chats (separados por artículo y usuario)
  const agruparMensajes = (mensajes, userId) => {
    const chatsAgrupados = {};
    const noLeidosPorChat = {};

    const makeKey = (parts) => parts.filter(Boolean).join("::");

    mensajes.forEach((msg) => {
      // Determinar el ID del otro usuario en el chat
      const otroUsuarioId = msg.deId === userId ? msg.paraId : msg.deId;

      // Identificador robusto de producto
      const productId =
        msg.productoId ||
        msg.producto_ofrecido_id ||
        msg.productoOfrecidoId ||
        msg.producto?.id ||
        msg.producto?.productoId ||
        null;
      const productTitle =
        msg.productoTitle ||
        msg.producto_ofrecido ||
        msg.productoOfrecido ||
        msg.producto?.title ||
        msg.producto?.nombre ||
        null;

      // Crear chatId robusto por contexto
      let chatId;
      if (msg.donacionId) {
        // Donaciones: separar por donacionId y usuario contraparte (sin ordenar)
        chatId = makeKey(["don", msg.donacionId, otroUsuarioId]);
      } else if (productId) {
        // Productos: separar por productId y usuario contraparte
        chatId = makeKey(["prod", productId, otroUsuarioId]);
      } else if (productTitle) {
        // Fallback: separar por título cuando no hay id (evita mezclar artículos distintos)
        chatId = makeKey([
          "prodt",
          productTitle.trim().toLowerCase(),
          otroUsuarioId,
        ]);
      } else {
        // Último recurso: separar por usuario (misceláneo)
        chatId = makeKey(["usr", otroUsuarioId]);
      }

      // Inicializar el chat si no existe
      if (!chatsAgrupados[chatId]) {
        chatsAgrupados[chatId] = [];
        noLeidosPorChat[chatId] = 0;
      }

      // Agregar mensaje al chat
      chatsAgrupados[chatId].push(msg);

      // Contar mensajes no leídos
      if (!msg.leidoPor?.includes(userId) && msg.deId !== userId) {
        noLeidosPorChat[chatId] = (noLeidosPorChat[chatId] || 0) + 1;
      }
    });

    // Ordenar mensajes por fecha en cada chat y asegurar consistencia de nombres
    Object.keys(chatsAgrupados).forEach((chatId) => {
      const chatMensajes = chatsAgrupados[chatId];
      chatMensajes.sort(
        (a, b) =>
          new Date(a.createdAt || a.fecha) - new Date(b.createdAt || b.fecha)
      );

      if (chatMensajes.length > 0) {
        const primerMensaje = chatMensajes[0];
        const nombreConsistente =
          primerMensaje.deId === userId
            ? primerMensaje.paraNombre || primerMensaje.para || "Usuario"
            : primerMensaje.deNombre || primerMensaje.de || "Usuario";

        chatMensajes.forEach((msg) => {
          if (msg.deId === userId) {
            msg.paraNombre = nombreConsistente;
          } else {
            msg.deNombre = nombreConsistente;
          }
        });
      }
    });

    return { chatsAgrupados, noLeidosPorChat };
  };

  const navigate = useNavigate();
  const location = useLocation();

  // Sincronizar pestaña activa según la ruta (/chat) o estado de navegación
  useEffect(() => {
    if (location?.pathname === "/chat") {
      setActiveTab("mensajes");
      return;
    }
    if (location?.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location?.pathname, location?.state]);

  const [userData, setUserData] = useState({
    transacciones: [],
    nombre: "",
    apellido: "",
    ubicacion: "",
    email: "",
    telefono: "",
    calificacion: 0,
    mostrarContacto: true,
    id: null,
  });

  const [userListings, setUserListings] = useState([]);
  const [mensajes, setMensajes] = useState([]);
  const [unreadByChat, setUnreadByChat] = useState({});
  const [showChatMenu, setShowChatMenu] = useState(null);
  const [showConfirmMessageDelete, setShowConfirmMessageDelete] =
    useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [imagenAdjunta, setImagenAdjunta] = useState(null);
  const [nuevoTexto, setNuevoTexto] = useState("");
  // Confirmar intercambio
  const [showConfirmExchange, setShowConfirmExchange] = useState(false);
  const [mensajeIntercambio, setMensajeIntercambio] = useState(null);
  const [intercambioCompletado, setIntercambioCompletado] = useState(null);

  // Menú contextual global para lista de chats
  const [chatListMenu, setChatListMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    key: null,
  });
  const chatListMenuRef = useRef(null);

  useEffect(() => {
    if (!chatListMenu.visible) return;
    const handleClick = (e) => {
      if (
        chatListMenuRef.current &&
        !chatListMenuRef.current.contains(e.target)
      ) {
        setChatListMenu((p) => ({ ...p, visible: false }));
      }
    };
    const handleKey = (e) => {
      if (e.key === "Escape")
        setChatListMenu((p) => ({ ...p, visible: false }));
    };
    const handleScrollOrResize = () =>
      setChatListMenu((p) => ({ ...p, visible: false }));
    document.addEventListener("mousedown", handleClick, true);
    window.addEventListener("keydown", handleKey, true);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize, true);
    return () => {
      document.removeEventListener("mousedown", handleClick, true);
      window.removeEventListener("keydown", handleKey, true);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize, true);
    };
  }, [chatListMenu.visible]);

  useEffect(() => {
    const mensajesDelChat = chats[chatSeleccionado] || [];
    const mensajeDeSistema = mensajesDelChat.find(
      (m) => m.system || m.de === "system" || m.tipo === "system"
    );

    if (mensajeDeSistema) {
      const fecha = new Date(
        mensajeDeSistema.fecha || mensajeDeSistema.createdAt
      ).toLocaleString("es-AR", {
        dateStyle: "long",
        timeStyle: "short",
      });
      setIntercambioCompletado(fecha);
    } else {
      setIntercambioCompletado(null);
    }
  }, [chatSeleccionado, chats]);

  // Manejar cierre del menú contextual de chat
  const handleCloseChatMenu = React.useCallback((e) => {
    if (!e.target.closest(".chat-list-item")) {
      setShowChatMenu(null);
      document.removeEventListener("mousedown", handleCloseChatMenu);
    }
  }, []);

  // Agrupar mensajes en chats y contar no leídos
  // Reemplazá TODO el cuerpo de updateChatsAndUnread por esto:
  const updateChatsAndUnread = React.useCallback(() => {
    const uid =
      userData?.id || JSON.parse(localStorage.getItem("usuarioActual"))?.id;
    if (!uid) return;

    const { chatsAgrupados, noLeidosPorChat } = agruparMensajes(mensajes, uid);

    setChats(chatsAgrupados);
    setUnreadByChat(noLeidosPorChat);
  }, [mensajes, userData?.id]);

  // Efecto para actualizar chats cuando cambian los mensajes
  useEffect(() => {
    if (mensajes.length === 0) return;
    const { chatsAgrupados, noLeidosPorChat } = agruparMensajes(
      mensajes,
      userData?.id
    );
    setChats(chatsAgrupados);
    setUnreadByChat(noLeidosPorChat);
  }, [mensajes, userData?.id]);

  // --- SCROLL INTELIGENTE ---
  // Guardar si el usuario estaba abajo ANTES del update
  const wasUserAtBottomRef = useRef(true);
  useLayoutEffect(() => {
    if (activeTab !== "mensajes") return;
    wasUserAtBottomRef.current = isUserAtBottom();
  }, [chatSeleccionado]);

  // Scroll inteligente: solo baja si el usuario estaba abajo o si envió mensaje propio
  useLayoutEffect(() => {
    if (activeTab !== "mensajes") return;
    const mensajes = chats[chatSeleccionado] || [];
    const usuarioActual = JSON.parse(localStorage.getItem("usuarioActual"));
    const ultimoMensaje = mensajes[mensajes.length - 1];
    // Detectar si el último mensaje es del usuario actual
    const fromMe =
      ultimoMensaje && usuarioActual && ultimoMensaje.deId === usuarioActual.id;
    // Si el usuario estaba abajo o envió mensaje propio, scrollea
    if (wasUserAtBottomRef.current || fromMe) {
      scrollToBottom();
    }
    // Actualizar ref para la próxima
    lastMessageFromMeRef.current = !!fromMe;
    // Guardar último id para animación
    if (ultimoMensaje) {
      lastRenderedMessageIdRef.current =
        ultimoMensaje._id || ultimoMensaje.id || null;
    }
  }, [chats, chatSeleccionado, activeTab]);

  // ===== IntersectionObserver: scroll-reveal para mensajes y tarjetas =====
  useEffect(() => {
    // Solo observar cuando la pestaña relevante está activa
    const root = null;
    const chatContainer = mensajesSectionRef?.current || null;
    const transContainer =
      document?.querySelector?.(".transacciones-grid") || null;

    const options = { root, rootMargin: "0px 0px -10% 0px", threshold: 0.2 };
    const onIntersect = (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("reveal-visible");
          entry.target.classList.remove("reveal-hidden");
          obs.unobserve(entry.target);
        }
      });
    };

    const io = new IntersectionObserver(onIntersect, options);

    const observeIn = (container) => {
      if (!container) return;
      const nodes = container.querySelectorAll(".reveal-hidden");
      nodes.forEach((el) => io.observe(el));
    };

    // Observar según pestaña
    if (activeTab === "mensajes" && chatContainer) {
      observeIn(chatContainer);
    }
    if (activeTab === "transacciones" && transContainer) {
      observeIn(transContainer);
    }

    return () => io.disconnect();
  }, [activeTab, chats, chatSeleccionado]);

  // Marcar como leídos los mensajes del chat seleccionado y limpiar notificaciones
  useEffect(() => {
    if (activeTab !== "mensajes" || !chatSeleccionado) return;
    const uid =
      userData?.id ||
      JSON.parse(localStorage.getItem("usuarioActual") || "{}")?.id;
    if (!uid) return;

    // Solo si hay no leídos en el chat seleccionado
    if (!unreadByChat[chatSeleccionado] || unreadByChat[chatSeleccionado] <= 0)
      return;

    const markAsRead = async () => {
      try {
        // Backend: marcar mensajes como leídos para este usuario
        await fetch(`${API_URL}/messages/mark-read/${uid}`, { method: "PUT" });

        // Actualizar estado local: agregar uid a leidoPor de los mensajes recibidos
        setMensajes((prev) =>
          prev.map((m) => {
            const already =
              Array.isArray(m.leidoPor) && m.leidoPor.includes(uid);
            if (m.paraId === uid && !already) {
              return { ...m, leidoPor: [...(m.leidoPor || []), uid] };
            }
            return m;
          })
        );

        // Limpiar contador de no leídos del chat actual
        setUnreadByChat((prev) => ({ ...prev, [chatSeleccionado]: 0 }));

        // Backend: marcar todas las notificaciones como leídas para este usuario
        try {
          await fetch(`${API_URL}/notifications/user/${uid}/read-all`, {
            method: "PUT",
          });
        } catch (e) {
          // No bloquear si falla notificaciones
          console.warn("No se pudieron marcar notificaciones como leídas:", e);
        }
      } catch (e) {
        console.error("Error marcando mensajes como leídos:", e);
      }
    };

    markAsRead();
  }, [activeTab, chatSeleccionado, unreadByChat, userData?.id]);

  const fetchMensajes = (uid) => {
    const idToUse = uid || userData?.id;
    if (!idToUse) {
      console.log("❌ No hay ID de usuario");
      return;
    }

    fetch(`${API_URL}/messages/${idToUse}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const mapped = data.map((m) => ({
          ...m,
          descripcion: m.descripcion || m.texto || "",
          deId: m.deId || m.de || null,
          paraId: m.paraId || m.para || null,
          deNombre: m.deNombre || m.de || "",
          paraNombre: m.paraNombre || m.para || "",
          fecha: m.createdAt || m.fecha || new Date().toISOString(),
        }));

        // Actualizar mensajes
        const mensajesUnicos = uniqMessages(mapped);
        setMensajes(mensajesUnicos);

        // Agrupar mensajes en chats
        const { chatsAgrupados, noLeidosPorChat } = agruparMensajes(
          mensajesUnicos,
          idToUse
        );

        setChats(chatsAgrupados);
        setUnreadByChat(noLeidosPorChat);

        // Seleccionar el primer chat si no hay uno seleccionado
        if (!chatSeleccionado && Object.keys(chatsAgrupados).length > 0) {
          setChatSeleccionado(Object.keys(chatsAgrupados)[0]);
        }
      })
      .catch((err) => {
        console.error("❌ Error en fetchMensajes:", err);
      });
  };

  async function handleEnviarMensaje() {
    if (!chatSeleccionado || !chats[chatSeleccionado]?.length) return;

    const base = chats[chatSeleccionado][0];
    const otherId = base.deId === userData.id ? base.paraId : base.deId;
    const paraNombre =
      base.deId === userData.id
        ? base.de || base.deNombre || ""
        : `${userData.nombre} ${userData.apellido}`;
    const hasContextOnly =
      (!nuevoTexto || !nuevoTexto.trim()) &&
      !imagenAdjunta &&
      (base.productoId || base.productoOfrecidoId || base.donacionId);
    // Si no hay texto ni imagen ni contexto, no enviar
    if (!nuevoTexto?.trim() && !imagenAdjunta && !hasContextOnly) return;
    // Mongoose requiere 'descripcion'. Determinar placeholder adecuado
    const descripcionFinal =
      nuevoTexto && nuevoTexto.trim()
        ? nuevoTexto.trim()
        : imagenAdjunta
        ? "[imagen]"
        : "[propuesta]";

    const tempId = `temp-${Date.now()}`;
    const mensajeOptimista = {
      _id: tempId,
      deId: userData.id,
      paraId: otherId,
      de: `${userData.nombre} ${userData.apellido}`,
      paraNombre,
      // 🔴 usar el campo que renderiza el chat:
      descripcion: descripcionFinal,
      // copiar contexto del intercambio para que caiga en el mismo chat
      productoId: base.productoId,
      productoOfrecidoId: base.productoOfrecidoId,
      productoTitle: base.productoTitle,
      productoOfrecido: base.productoOfrecido,
      donacionId: base.donacionId,
      donacionTitle: base.donacionTitle,
      fecha: new Date().toISOString(),
      esTemporal: true,
    };

    setMensajes((prev) => [...prev, mensajeOptimista]);
    setNuevoTexto("");
    setImagenAdjunta(null);

    try {
      let imagenBase64 = null;
      if (imagenAdjunta instanceof File) {
        imagenBase64 = await fileToDataUrl(imagenAdjunta); // o tu lector actual
      }

      const payload = {
        deId: userData.id,
        paraId: otherId,
        de: `${userData.nombre} ${userData.apellido}`,
        paraNombre,
        // 🔴 enviar como descripcion (si tu backend espera "texto", mandá ambos):
        descripcion: descripcionFinal,
        texto: descripcionFinal,
        imagenNombre: imagenBase64,
        // contexto del intercambio:
        productoId: base.productoId,
        productoOfrecidoId: base.productoOfrecidoId,
        productoTitle: base.productoTitle,
        productoOfrecido: base.productoOfrecido,
        donacionId: base.donacionId,
        donacionTitle: base.donacionTitle,
        leido: false,
      };

      const res = await fetch(`${API_URL}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let serverMsg = "";
        try {
          serverMsg = await res.text();
        } catch (_) {}
        throw new Error(serverMsg || `Error al enviar (HTTP ${res.status})`);
      }

      const saved = await res.json();
      // normalizá el mensaje que vuelve del backend
      const normalizado = {
        ...saved,
        descripcion: saved.descripcion ?? saved.texto ?? "",
        fecha: saved.createdAt ?? saved.fecha ?? new Date().toISOString(),
      };

      setMensajes((prev) =>
        prev.map((m) => (m._id === tempId ? normalizado : m))
      );
    } catch (err) {
      // revertir optimista
      setMensajes((prev) => prev.filter((m) => m._id !== tempId));
      alert(`Error al enviar el mensaje. ${err?.message || ""}`.trim());
    }
  }

  // Mantener el chat seleccionado tras polling/fetch
  useEffect(() => {
    // Si el chat seleccionado ya no existe tras un fetch, selecciona el primero disponible
    if (chatSeleccionado && chats[chatSeleccionado]) {
      // El chat seleccionado sigue existiendo, no hacer nada
      return;
    }
    const chatKeys = Object.keys(chats);
    if (chatKeys.length > 0) {
      setChatSeleccionado(chatKeys[0]);
    } else {
      setChatSeleccionado(null); // No hay chats disponibles
    }
  }, [chats, chatSeleccionado]);

  // Eliminar un chat completo (todos los mensajes)
  const handleDeleteChat = async (chatKey) => {
    const mensajesChat = chats[chatKey];
    if (!mensajesChat || mensajesChat.length === 0) return;
    if (!window.confirm("¿Eliminar este chat y todos sus mensajes?")) return;
    // 1) Eliminar en backend en paralelo (no bloquear UI)
    try {
      const ids = mensajesChat.map((m) => m._id || m.id).filter(Boolean);
      await Promise.all(
        ids.map((id) =>
          fetch(`${API_URL}/messages/${id}`, { method: "DELETE" })
        )
      );
    } catch (e) {
      console.warn(
        "Error eliminando mensajes en backend (se continuará con UI):",
        e
      );
    }

    // 2) Quitar mensajes del estado local inmediatamente
    setMensajes((prev) =>
      prev.filter(
        (m) => !mensajesChat.some((x) => (x._id || x.id) === (m._id || m.id))
      )
    );

    // 3) Quitar el chat del estado local
    setChats((prev) => {
      const nuevo = { ...prev };
      delete nuevo[chatKey];
      return nuevo;
    });

    // 4) Actualizar contadores de no leídos
    setUnreadByChat((prev) => {
      const nuevo = { ...prev };
      delete nuevo[chatKey];
      return nuevo;
    });

    // 5) Si el chat eliminado era el seleccionado, seleccionar otro disponible
    const remainingKeys = Object.keys(chats).filter((key) => key !== chatKey);
    setChatSeleccionado(remainingKeys.length > 0 ? remainingKeys[0] : null);
  };

  // Efecto para recargar productos y transacciones tras un intercambio
  useEffect(() => {
    const handleProductsUpdated = () => {
      // Vuelve a cargar los datos del usuario (productos y transacciones)
      if (typeof loadUserData === "function") {
        loadUserData();
      }
    };

    const handleProfileUpdated = async (event) => {
      console.log("🔄 Perfil actualizado detectado, sincronizando datos...");
      console.log("📦 Datos del evento:", event.detail);
      const payload = event.detail || {};
      // Si el payload es mínimo (solo id), recuperar el usuario completo desde localStorage
      const isSparse =
        payload && Object.keys(payload).length <= 2 && payload.id;
      let updatedUser = payload;
      if (isSparse) {
        try {
          const fromLS =
            JSON.parse(localStorage.getItem("usuarioActual")) || {};
          if (fromLS && fromLS.id === payload.id) {
            updatedUser = fromLS;
          }
        } catch {}
      }
      const normalized = {
        ...updatedUser,
        provincia: updatedUser.provincia || updatedUser.zona || "Tucumán",
      };
      // Actualizar el estado del usuario con los nuevos datos
      console.log("🔄 Actualizando userData con:", normalized);
      setUserData(normalized);
      // Actualizar la imagen de perfil si cambió
      if (updatedUser.imagen) {
        let imagenUrl = "";
        if (updatedUser.imagen.startsWith("data:")) {
          imagenUrl = updatedUser.imagen;
        } else if (updatedUser.imagen.startsWith("http")) {
          imagenUrl = updatedUser.imagen;
        } else {
          imagenUrl = updatedUser.imagen.startsWith("/")
            ? `${API_URL}${updatedUser.imagen}`
            : `${API_URL}/${updatedUser.imagen}`;
        }
        console.log("🖼️ Actualizando imagen de perfil a:", imagenUrl);
        setImagenPerfil(imagenUrl);
      }
      console.log("✅ Datos del perfil sincronizados exitosamente");
    };
    // Cuando hay cambios en donaciones en otras vistas, recargar donaciones aquí
    const handleDonationsUpdated = () => {
      // Refrescar donaciones y perfil (transacciones) para mantener lista combinada actualizada
      if (typeof loadDonaciones === "function") {
        loadDonaciones();
      }
      if (typeof loadUserData === "function") {
        loadUserData();
      }
    };

    window.addEventListener("productsUpdated", handleProductsUpdated);
    window.addEventListener("userProfileUpdated", handleProfileUpdated);
    window.addEventListener("donationsUpdated", handleDonationsUpdated);

    console.log(
      "🎧 Event listeners registrados: productsUpdated, userProfileUpdated y donationsUpdated"
    );

    // Verificar si hay actualizaciones pendientes en localStorage
    const checkPendingUpdates = () => {
      console.log(
        "🔍 Verificando actualizaciones pendientes en localStorage..."
      );
      const pendingUpdate = localStorage.getItem("profileUpdatePending");
      console.log("💾 Contenido de profileUpdatePending:", pendingUpdate);

      if (pendingUpdate) {
        try {
          const updateData = JSON.parse(pendingUpdate);
          const timeDiff = Date.now() - updateData.timestamp;

          // Si la actualización es reciente (menos de 30 segundos)
          if (timeDiff < 30000) {
            console.log(
              "🔄 Actualización pendiente encontrada en localStorage"
            );
            console.log("📦 Aplicando datos pendientes:", updateData.userData);

            // Aplicar la actualización
            setUserData(updateData.userData);

            // Actualizar imagen si es necesario
            if (updateData.userData.imagen) {
              let imagenUrl = "";
              if (updateData.userData.imagen.startsWith("data:")) {
                imagenUrl = updateData.userData.imagen;
              } else if (updateData.userData.imagen.startsWith("http")) {
                imagenUrl = updateData.userData.imagen;
              } else {
                const base = API_URL; // usar constante importada desde '../config'
                imagenUrl = updateData.userData.imagen.startsWith("/")
                  ? `${base}${updateData.userData.imagen}`
                  : `${base}/${updateData.userData.imagen}`;
              }
              setImagenPerfil(imagenUrl);
            }

            console.log("✅ Actualización pendiente aplicada exitosamente");
          }

          // Limpiar la actualización pendiente
          localStorage.removeItem("profileUpdatePending");
          console.log("🧹 Actualización pendiente limpiada de localStorage");
        } catch (error) {
          console.error("❌ Error procesando actualización pendiente:", error);
          localStorage.removeItem("profileUpdatePending");
        }
      }
    };

    // Verificar actualizaciones pendientes al montar el componente
    console.log("🚀 Llamando a checkPendingUpdates...");
    checkPendingUpdates();
    console.log("✅ checkPendingUpdates ejecutado");

    return () => {
      console.log("🧹 Removiendo event listeners");
      window.removeEventListener("productsUpdated", handleProductsUpdated);
      window.removeEventListener("userProfileUpdated", handleProfileUpdated);
      window.removeEventListener("donationsUpdated", handleDonationsUpdated);
    };
  }, []);

  // Efecto para cargar datos del usuario al iniciar
  useEffect(() => {
    console.log("🔍 Iniciando carga de datos del perfil...");

    // Verificar autenticación antes de cargar datos
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      const usuario = JSON.parse(localStorage.getItem("usuarioActual"));

      if (!token || !usuario || !usuario.id) {
        console.error("❌ Usuario no autenticado o sesión expirada");
        // Limpiar datos de sesión inconsistentes
        localStorage.removeItem("token");
        localStorage.removeItem("usuarioActual");
        navigate("/login", { state: { from: location.pathname } });
        return null;
      }
      return usuario;
    };

    const loadUserData = async () => {
      const usuario = checkAuth();
      if (!usuario) return;

      try {
        console.log("🔑 Cargando datos del perfil para el usuario:", {
          id: usuario.id,
          email: usuario.email,
        });

        // Configurar imagen de perfil
        let imagenUrl = "/images/fotoperfil.jpg";
        if (usuario.imagen) {
          if (usuario.imagen.startsWith("data:image")) {
            imagenUrl = usuario.imagen;
          } else {
            imagenUrl = usuario.imagen.startsWith("/images/")
              ? usuario.imagen
              : `/images/${usuario.imagen}`;
          }
        }

        try {
          console.log(
            `🌐 Solicitando datos del usuario a ${API_URL}/users/${usuario.id}...`
          );
          const userResponse = await fetch(`${API_URL}/users/${usuario.id}`);

          if (!userResponse.ok) {
            throw new Error(
              `Error HTTP ${userResponse.status} al obtener datos del usuario`
            );
          }

          const dataUser = await userResponse.json();
          console.log("✅ Datos del usuario recibidos:", dataUser);

          if (!dataUser) {
            throw new Error("No se recibieron datos del usuario");
          }

          // Enriquecer transacciones con nombres de productos
          console.log("🔄 Procesando transacciones...");
          if (
            Array.isArray(dataUser.transacciones) &&
            dataUser.transacciones.length > 0
          ) {
            console.log(
              `📊 ${dataUser.transacciones.length} transacciones encontradas`
            );
            const enriched = await Promise.all(
              dataUser.transacciones.map(async (t) => {
                const prodIds = [
                  t.productoOfrecidoId,
                  t.productoSolicitadoId,
                ].filter(Boolean);
                const names = {};

                await Promise.all(
                  prodIds.map(async (pid) => {
                    try {
                      const res = await fetch(`${API_URL}/products/${pid}`);
                      if (res.ok) {
                        const p = await res.json();
                        names[pid] =
                          p.title || p.nombre || "Producto desconocido";
                      }
                    } catch (error) {
                      console.error("Error al cargar producto:", error);
                    }
                  })
                );

                return {
                  ...t,
                  productoOfrecido:
                    names[t.productoOfrecidoId] || t.productoOfrecido,
                  productoSolicitado:
                    names[t.productoSolicitadoId] || t.productoSolicitado,
                };
              })
            );
            dataUser.transacciones = enriched;
          }

          // Actualizar estado local y almacenamiento
          const updatedUserData = {
            ...dataUser,
            nombre: dataUser.nombre || usuario.nombre,
            apellido: dataUser.apellido || usuario.apellido,
            provincia:
              dataUser.zona ||
              dataUser.provincia ||
              usuario.zona ||
              usuario.provincia ||
              "Tucumán",
            email: dataUser.email || usuario.email,
            imagen: imagenUrl,
            telefono: dataUser.telefono || usuario.telefono,
            calificacion: dataUser.calificacion || usuario.calificacion || 0,
            transacciones: dataUser.transacciones || [],
            mostrarContacto:
              dataUser.mostrarContacto !== undefined
                ? dataUser.mostrarContacto
                : usuario.mostrarContacto !== undefined
                ? usuario.mostrarContacto
                : true,
            id: dataUser.id || usuario.id,
          };

          // Actualizar estado local
          setUserData(updatedUserData);

          // Actualizar localStorage
          localStorage.setItem(
            "usuarioActual",
            JSON.stringify(updatedUserData)
          );

          // Cargar productos del usuario
          console.log("🛍️ Cargando productos del usuario...");
          try {
            if (
              updatedUserData &&
              Array.isArray(updatedUserData.productos) &&
              updatedUserData.productos.length > 0
            ) {
              const token = localStorage.getItem("token");
              const productObjects = await Promise.all(
                updatedUserData.productos
                  .filter((id) => typeof id === "string" && id.length === 24)
                  .map((id) =>
                    fetch(`${API_URL}/products/${id}`, {
                      headers: { Authorization: `Bearer ${token}` },
                    })
                      .then((res) => (res.ok ? res.json() : null))
                      .catch(() => null)
                  )
              );
              // Filtrar productos no intercambiados y válidos
              const productosActivos = productObjects.filter(
                (p) =>
                  p &&
                  !p.intercambiado &&
                  typeof p._id === "string" &&
                  p._id.length === 24
              );
              console.log(
                `✅ ${productosActivos.length} productos activos cargados por ID`
              );
              setUserListings(productosActivos);

              if (productosActivos.length === 0) {
                console.log("ℹ️ El usuario no tiene productos publicados");
              }
            } else {
              setUserListings([]);
              console.log(
                "ℹ️ El usuario no tiene productos publicados (array vacío)"
              );
            }
          } catch (error) {
            console.error("❌ Error al cargar productos:", error);
            setUserListings([]);
          }

          // Cargar mensajes
          fetchMensajes(updatedUserData.id);
        } catch (error) {
          console.error("❌ Error al cargar datos del usuario:", error);

          // Verificar si el error es de autenticación
          if (error.message.includes("401") || error.message.includes("403")) {
            console.error("🔒 Error de autenticación, redirigiendo a login...");
            localStorage.removeItem("token");
            localStorage.removeItem("usuarioActual");
            navigate("/login", {
              state: {
                from: location.pathname,
                error:
                  "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.",
              },
            });
            return;
          }

          // Usar datos del localStorage como respaldo solo si son válidos
          if (usuario && usuario.id) {
            console.log("🔄 Usando datos del localStorage como respaldo...");
            setUserData({
              ...usuario,
              transacciones: Array.isArray(usuario.transacciones)
                ? usuario.transacciones
                : [],
              mostrarContacto: usuario.mostrarContacto !== false,
            });
          } else {
            throw new Error("Datos de usuario no disponibles");
          }
        }
      } catch (error) {
        console.error("❌ Error crítico al cargar el perfil:", error);

        // Mostrar mensaje de error específico
        const errorMessage = error.message.includes("Failed to fetch")
          ? "No se pudo conectar con el servidor. Verifica tu conexión a internet."
          : "Error al cargar el perfil. Por favor, intente recargar la página.";

        alert(errorMessage);

        // Redirigir a login solo si es un error de autenticación
        if (error.message.includes("401") || error.message.includes("403")) {
          localStorage.removeItem("token");
          localStorage.removeItem("usuarioActual");
          navigate("/login", {
            state: {
              from: location.pathname,
              error:
                "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.",
            },
          });
        }
      }
    };

    // Pequeño retraso para asegurar que el componente esté montado
    const loadTimer = setTimeout(() => {
      loadUserData();
    }, 100);

    return () => {
      console.log("🧹 Limpiando efectos del perfil");
      clearTimeout(loadTimer);
    };
  }, [navigate, location.pathname]); // Añadir location.pathname a las dependencias

  useEffect(() => {
    if (location.state?.nuevoMensaje) {
      const nuevoMensaje = location.state.nuevoMensaje;
      setMensajes((prevMensajes) => {
        const existe = prevMensajes.some(
          (msg) =>
            msg.productoOfrecido === nuevoMensaje.productoOfrecido &&
            msg.descripcion === nuevoMensaje.descripcion &&
            msg.condiciones === nuevoMensaje.condiciones &&
            msg.imagen === nuevoMensaje.imagen
        );
        return existe ? prevMensajes : [...prevMensajes, nuevoMensaje];
      });
    }
  }, [location.state]);

  useEffect(() => {
    const usuarioActual = JSON.parse(localStorage.getItem("usuarioActual"));
    if (usuarioActual) {
      localStorage.setItem(
        "usuarioActual",
        JSON.stringify({
          ...usuarioActual,
          transacciones: userData.transacciones,
          mostrarContacto: userData.mostrarContacto,
        })
      );
    }
  }, [userData.transacciones]);

  const capitalize = (text) =>
    text ? text.charAt(0).toUpperCase() + text.slice(1).toLowerCase() : "";

  // Calificación
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingTarget, setRatingTarget] = useState(null);
  const [ratingLoading, setRatingLoading] = useState(false);

  const confirmDelete = async () => {
    if (!deleteModal.productId) return;

    try {
      const response = await fetch(
        `${API_URL}/products/${deleteModal.productId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        // Actualizar la lista de productos eliminando el producto borrado
        setUserListings((prev) =>
          prev.filter((p) => p._id !== deleteModal.productId)
        );

        // Cerrar el modal
        setDeleteModal({ isOpen: false, productId: null, productTitle: "" });

        // Mostrar mensaje de éxito
        alert("Producto eliminado correctamente");
      } else {
        throw new Error("Error al eliminar el producto");
      }
    } catch (error) {
      console.error("Error al eliminar producto:", error);
      alert("No se pudo eliminar el producto. Por favor, inténtalo de nuevo.");
    }
  };

  const handleEliminarProducto = (producto) => {
    setDeleteModal({
      isOpen: true,
      productId: producto.id,
      productTitle: producto.title,
    });
  };

  const handleEditarProducto = (producto) => {
    navigate(`/editar-producto/${producto._id}`);
  };

  // NUEVA FUNCIÓN: Limpiar productos huérfanos del home
  const limpiarProductosHuerfanos = async () => {
    if (
      !window.confirm(
        '¿Estás seguro de que quieres limpiar productos huérfanos del home? Esto eliminará productos que no aparecen en "Mis Artículos" pero siguen en el home.'
      )
    ) {
      return;
    }

    try {
      console.log("🧹 Iniciando limpieza de productos huérfanos...");

      const usuarioActual = JSON.parse(localStorage.getItem("usuarioActual"));
      if (!usuarioActual || !usuarioActual.id) {
        console.error("❌ No se encontró usuario actual");
        return;
      }

      // Obtener datos frescos del usuario
      const resUser = await fetch(`${API_URL}/users/${usuarioActual.id}`);
      if (!resUser.ok) {
        throw new Error("Error al obtener datos del usuario");
      }

      const userData = await resUser.json();
      const productosActuales = userData.productos || [];
      const transaccionesActuales = userData.transacciones || [];

      console.log("📊 Productos actuales en BD:", productosActuales.length);
      console.log("📊 Transacciones actuales:", transaccionesActuales.length);

      // Identificar productos que fueron intercambiados (aparecen en transacciones completadas)
      const productosIntercambiados = transaccionesActuales
        .filter((t) => t.estado === "completado")
        .map((t) => t.productoOfrecido)
        .filter(Boolean);

      console.log(
        "🔄 Productos intercambiados encontrados:",
        productosIntercambiados
      );

      // Filtrar productos que NO fueron intercambiados (productos huérfanos)
      const productosLimpios = productosActuales.filter((producto) => {
        const esHuerfano = productosIntercambiados.includes(producto.titulo);
        if (esHuerfano) {
          console.log(
            `🗑️ Producto huérfano identificado: "${producto.titulo}"`
          );
        }
        return !esHuerfano;
      });

      const productosEliminados =
        productosActuales.length - productosLimpios.length;

      if (productosEliminados > 0) {
        // Actualizar la lista de productos sin los huérfanos
        const updateResponse = await fetch(
          `${API_URL}/users/${usuarioActual.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productos: productosLimpios }),
          }
        );

        if (updateResponse.ok) {
          console.log(
            `✅ ${productosEliminados} productos huérfanos eliminados del home`
          );

          // Actualizar datos locales
          setUserData((prev) => ({ ...prev, productos: productosLimpios }));
          localStorage.setItem(
            "usuarioActual",
            JSON.stringify({ ...userData, productos: productosLimpios })
          );

          // Forzar actualización del home
          window.dispatchEvent(new CustomEvent("productsUpdated"));

          alert(
            `✅ Limpieza completada: ${productosEliminados} productos huérfanos eliminados del home.`
          );
        } else {
          throw new Error("Error al actualizar productos en el servidor");
        }
      } else {
        console.log("✨ No se encontraron productos huérfanos para eliminar");
        alert("✨ No se encontraron productos huérfanos. El home está limpio.");
      }
    } catch (error) {
      console.error("❌ Error en limpieza de productos huérfanos:", error);
      alert(
        "❌ Error al limpiar productos huérfanos. Revisa la consola para más detalles."
      );
    }
  };

  // Hacer las funciones accesibles globalmente para la consola
  useEffect(() => {
    window.limpiarProductosHuerfanos = limpiarProductosHuerfanos;

    return () => {
      delete window.limpiarProductosHuerfanos;
    };
  }, []);

  // Función para marcar producto como intercambiado
  const handleMarkAsExchanged = async (producto) => {
    if (
      !window.confirm(
        `¿Estás seguro de que quieres marcar "${producto.title}" como intercambiado?`
      )
    ) {
      return;
    }

    try {
      console.log("🔄 Marcando producto como intercambiado:", producto.title);

      // 1. Actualizar estado local inmediatamente
      setUserListings((prev) => prev.filter((p) => p.id !== producto.id));

      // 2. Crear nueva transacción para "Mis Intercambios"
      const usuarioActualLS = JSON.parse(
        localStorage.getItem("usuarioActual") || "{}"
      );
      const miId =
        userData?.id || usuarioActualLS?.id || usuarioActualLS?._id || null;
      const tempId = `temp-${Date.now().toString()}`;
      const nuevaTransaccion = {
        id: tempId,
        productoOfrecido: producto.title,
        productoOfrecidoId: producto.id,
        productoSolicitado: "Intercambio directo",
        productoSolicitadoId: null,
        // Doble confirmación: estado inicial pendiente y confirmación unilateral del emisor
        estado: "pendiente_confirmacion",
        fecha: new Date().toISOString(),
        tipo: "intercambio_directo",
        descripcion: `Producto "${producto.title}" marcado como intercambiado (pendiente de confirmación)`,
        confirmedBy: miId ? [miId] : [],
      };

      // 3. Actualizar transacciones localmente (optimista)
      setUserData((prev) => ({
        ...prev,
        transacciones: [...(prev.transacciones || []), nuevaTransaccion],
      }));
      // UX: llevar al usuario a la pestaña de Intercambios y hacer scroll
      try {
        setActiveTab("transacciones");
        setTimeout(() => {
          try {
            transaccionesSectionRef?.current?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          } catch {}
        }, 0);
      } catch {}

      // 4. Refrescar el usuario desde el backend para obtener la transacción canónica y reconciliar estado local
      try {
        const usuarioActual = JSON.parse(localStorage.getItem("usuarioActual"));
        const uid = usuarioActual?.id || userData?.id;
        if (uid) {
          const resUser = await fetch(`${API_URL}/users/${uid}`);
          if (resUser.ok) {
            const freshUser = await resUser.json();
            const serverTrans = Array.isArray(freshUser?.transacciones)
              ? freshUser.transacciones
              : [];
            // Si el backend creó una transacción para este producto, preferir la versión con _id estable
            const canonical = serverTrans.find(
              (t) =>
                (t.productoOfrecidoId &&
                  t.productoOfrecidoId === producto.id) ||
                t.productoOfrecido === producto.title
            );
            // Tomar SIEMPRE el estado autoritativo del servidor; si aún no existe canónica, mantener temporal mientras tanto
            const authoritative = canonical
              ? serverTrans
              : [
                  ...serverTrans,
                  // conservar temporal si no hay canónica todavía
                  ...(!canonical ? [{ ...nuevaTransaccion }] : []),
                ];
            const nextUser = { ...freshUser, transacciones: authoritative };
            setUserData(nextUser);
            try {
              localStorage.setItem("usuarioActual", JSON.stringify(nextUser));
            } catch {}
            try {
              window.dispatchEvent(
                new CustomEvent("userProfileUpdated", {
                  detail: { id: freshUser.id || freshUser._id },
                })
              );
            } catch {}

            // Si aún no hay transacción en el servidor, crearla (una sola vez) y volver a cargar
            if (!canonical && (freshUser?.id || freshUser?._id)) {
              console.log(
                "ℹ️ No se encontró transacción canónica en el servidor. Creando registro de intercambio..."
              );
              try {
                const uId = freshUser.id || freshUser._id;
                const serverPayload = {
                  transacciones: [
                    ...serverTrans,
                    {
                      productoOfrecido: producto.title,
                      productoOfrecidoId: producto.id || producto._id || null,
                      productoSolicitado: "Intercambio directo",
                      productoSolicitadoId: null,
                      estado: "pendiente_confirmacion",
                      fecha: new Date().toISOString(),
                      tipo: "intercambio_directo",
                      descripcion: `Producto "${producto.title}" marcado como intercambiado (pendiente de confirmación)`,
                      confirmedBy: miId ? [miId] : [],
                    },
                  ],
                };
                const putRes = await fetch(`${API_URL}/users/${uId}`, {
                  method: "PUT",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                  },
                  body: JSON.stringify(serverPayload),
                });
                if (putRes.ok) {
                  console.log(
                    "✅ Transacción creada en servidor. Refrescando usuario..."
                  );
                  const again = await fetch(`${API_URL}/users/${uId}`);
                  if (again.ok) {
                    const refreshed = await again.json();
                    const withCanonical = Array.isArray(
                      refreshed?.transacciones
                    )
                      ? refreshed.transacciones
                      : [];
                    const newCanonical = withCanonical.find(
                      (t) =>
                        (t.productoOfrecidoId &&
                          t.productoOfrecidoId ===
                            (producto.id || producto._id)) ||
                        t.productoOfrecido === producto.title
                    );
                    setUserData((prev) => {
                      const prevTrans2 = Array.isArray(prev?.transacciones)
                        ? prev.transacciones
                        : [];
                      const base2 = prevTrans2.filter((t) => t.id !== tempId);
                      const next2 = newCanonical
                        ? [...base2, newCanonical]
                        : base2;
                      const mergedUser = {
                        ...prev,
                        ...refreshed,
                        transacciones: next2,
                      };
                      try {
                        localStorage.setItem(
                          "usuarioActual",
                          JSON.stringify(mergedUser)
                        );
                      } catch {}
                      return mergedUser;
                    });
                  }
                } else {
                  console.warn(
                    "⚠️ No se pudo crear la transacción en el servidor. Manteniendo optimista local."
                  );
                }
              } catch (e2) {
                console.warn("⚠️ Error creando transacción en servidor:", e2);
              }
            }
          }
        }
      } catch (e) {
        console.warn(
          "⚠️ No se pudo reconciliar transacciones tras marcar como intercambiado:",
          e
        );
      }

      console.log("✅ Intercambio registrado como pendiente de confirmación");
      alert(
        `"${producto.title}" ahora figura como pendiente de confirmación en "Mis Intercambios"`
      );
    } catch (error) {
      console.error("❌ Error al marcar como intercambiado:", error);
      alert(
        "Hubo un error al marcar el producto como intercambiado. Por favor, inténtalo de nuevo."
      );

      // Revertir cambios locales en caso de error
      setUserListings((prev) => [...prev, producto]);
      setUserData((prev) => ({
        ...prev,
        transacciones: prev.transacciones.filter(
          (t) => t.id !== nuevaTransaccion.id
        ),
      }));
    }
  };

  // Confirmar intercambio (segunda confirmación completa el intercambio y marca producto)
  const handleConfirmExchange = async (transaccion) => {
    console.log("[CONFIRMAR INTERCAMBIO] Click detectado", transaccion);
    try {
      const usuarioActual = JSON.parse(
        localStorage.getItem("usuarioActual") || "{}"
      );
      const myId = userData?.id || usuarioActual?.id || usuarioActual?._id;
      if (!myId) return;
      // ID del mensaje ancla (para /messages/:id/confirm)
      const anchorMsgId = transaccion?._id || transaccion?.id || null;

      // 1. Limpiar campos innecesarios y dejar solo los válidos
      const cleanTrans = (t) => {
        return {
          _id: t._id,
          id: t.id,
          de: t.de,
          deId: t.deId,
          paraId: t.paraId,
          paraNombre: t.paraNombre,
          productoId: t.productoId,
          productoTitle: t.productoTitle,
          productoOfrecidoId: t.productoOfrecidoId,
          productoOfrecido: t.productoOfrecido,
          tipoPeticion: t.tipoPeticion || "intercambio",
          descripcion: t.descripcion,
          condiciones: t.condiciones,
          leidoPor: t.leidoPor || [],
          confirmaciones: Array.isArray(t.confirmaciones)
            ? t.confirmaciones
            : [],
          estado:
            t.estado || (t.completed ? "completado" : "pendiente_confirmacion"),
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
        };
      };
      let transId = transaccion._id || transaccion.id;
      let transaccionFinal = cleanTrans(transaccion);
      console.log(
        "[CONFIRMAR INTERCAMBIO] Transacción limpia:",
        transaccionFinal
      );
      if (!transId || String(transId).startsWith("temp")) {
        console.log(
          "[CONFIRMAR INTERCAMBIO] POST /transactions",
          transaccionFinal
        );
        const res = await fetch(`${API_URL}/transactions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
          body: JSON.stringify(transaccionFinal),
        });
        console.log(
          "[CONFIRMAR INTERCAMBIO] Respuesta POST /transactions",
          res.status
        );
        if (!res.ok)
          throw new Error("No se pudo crear la transacción en el backend");
        const nueva = await res.json();
        transaccionFinal = cleanTrans(nueva);
        transId = nueva._id || nueva.id;
      }

      // Helper: verificar si ambas partes (yo y la contraparte) están confirmadas
      const bothSidesConfirmed = (t, confirmedList) => {
        const myS = String(myId || "");
        const other = t.deId === myId ? t.paraId : t.deId;
        const otherS = String(other || "");
        const set = new Set(
          (confirmedList || []).map((x) => String(x)).filter(Boolean)
        );
        return myS && otherS && set.has(myS) && set.has(otherS);
      };

      // 2. Optimista: agregar mi confirmación si no está. NO marcar como completado hasta tener ambas confirmaciones
      const addMyConfirm = (t) => {
        const confirmedRaw = Array.isArray(t.confirmaciones)
          ? t.confirmaciones
          : Array.isArray(t.confirmedBy)
          ? t.confirmedBy
          : [];
        const confirmed = confirmedRaw.map((x) => String(x)).filter(Boolean);
        const myS = String(myId);
        const nextConfirmed = confirmed.includes(myS)
          ? confirmed
          : [...confirmed, myS];
        const completed = bothSidesConfirmed(t, nextConfirmed);
        return {
          ...t,
          confirmedBy: nextConfirmed,
          confirmaciones: nextConfirmed,
          estado: completed
            ? "completado"
            : t.estado && t.estado === "completado" && completed
            ? "completado"
            : "pendiente_confirmacion",
        };
      };
      const optimistic = addMyConfirm(transaccionFinal);
      console.log(
        "[CONFIRMAR INTERCAMBIO] Actualizando estado local con:",
        optimistic
      );
      setUserData((prev) => ({
        ...prev,
        transacciones: [
          ...(prev.transacciones || []).filter(
            (t) => t._id !== transId && t.id !== transId
          ),
          optimistic,
        ],
      }));

      // Actualizar inmediatamente los mensajes del chat para que el Stepper no vuelva a datos viejos del mensaje
      try {
        setChats((prev) => {
          if (!prev || !chatSeleccionado || !prev[chatSeleccionado])
            return prev;
          const mensajesPrev = prev[chatSeleccionado];
          const myS = String(myId || "");
          const confirmed = (
            Array.isArray(optimistic.confirmedBy)
              ? optimistic.confirmedBy
              : Array.isArray(optimistic.confirmaciones)
              ? optimistic.confirmaciones
              : []
          ).map(String);
          const unique = Array.from(new Set(confirmed.filter(Boolean)));
          const completed =
            bothSidesConfirmed(optimistic, unique) ||
            optimistic.estado === "completado";
          const actualizados = mensajesPrev.map((m) => {
            const samePair =
              m.productoId === optimistic.productoId &&
              m.productoOfrecidoId === optimistic.productoOfrecidoId;
            if (!samePair) return m;
            const baseConf = (
              Array.isArray(m.confirmedBy)
                ? m.confirmedBy
                : Array.isArray(m.confirmaciones)
                ? m.confirmaciones
                : []
            ).map((x) => String(x));
            const union = Array.from(new Set([...(baseConf || []), ...unique]));
            return {
              ...m,
              confirmedBy: union,
              confirmaciones: union,
              estado: completed
                ? "completado"
                : m.estado || "pendiente_confirmacion",
            };
          });
          return { ...prev, [chatSeleccionado]: actualizados };
        });
      } catch {}

      // Importante: actualizar también el documento del mensaje en el backend para que la contraparte vea la confirmación
      try {
        if (anchorMsgId) {
          await fetch(`${API_URL}/messages/${anchorMsgId}/confirm`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: myId }),
          });
        }
      } catch (e) {
        console.warn(
          "No se pudo actualizar confirmación en el mensaje (backend). Continuando...",
          e
        );
      }

      // 3. Construir lista a persistir tomando el estado más reciente y agregando si no existe aún
      const current = JSON.parse(localStorage.getItem("usuarioActual") || "{}");
      const stateTrans = Array.isArray(userData?.transacciones)
        ? userData.transacciones
        : current.transacciones || [];
      let foundTx = false;
      const nextTrans = (stateTrans || [])
        .filter(
          (t) =>
            t && (t._id || t.id) && !String(t._id || t.id).startsWith("temp")
        )
        .map((t) => {
          const tid = String(t._id || t.id || "");
          if (tid && tid === String(transId)) {
            foundTx = true;
            return optimistic;
          }
          // También reemplazar por pareja de producto en caso de IDs inconsistentes
          const samePair =
            t.productoId === optimistic.productoId &&
            t.productoOfrecidoId === optimistic.productoOfrecidoId;
          if (!foundTx && samePair) {
            foundTx = true;
            return optimistic;
          }
          return t;
        });
      const finalTrans = foundTx ? nextTrans : [...nextTrans, optimistic];

      // 4. Persistir en backend solo transacciones válidas
      const uid = userData?.id || usuarioActual?.id || usuarioActual?._id;
      if (uid) {
        console.log("[CONFIRMAR INTERCAMBIO] PUT /users (self)", {
          transacciones: finalTrans,
        });
        const putRes = await fetch(`${API_URL}/users/${uid}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
          body: JSON.stringify({ transacciones: finalTrans }),
        });
        console.log(
          "[CONFIRMAR INTERCAMBIO] Respuesta PUT /users",
          putRes.status
        );

        // 5. Si quedó completado (ambas partes), marcar producto como intercambiado
        const finalT =
          finalTrans.find?.((t) => (t._id || t.id) === transId) || optimistic;
        const confirmedList =
          (Array.isArray(finalT.confirmedBy)
            ? finalT.confirmedBy
            : Array.isArray(finalT.confirmaciones)
            ? finalT.confirmaciones
            : []) || [];
        const isTrulyCompleted = bothSidesConfirmed(finalT, confirmedList);
        if (
          isTrulyCompleted &&
          (finalT.productoOfrecidoId || finalT.productoId)
        ) {
          // 5.1 Crear mensaje de sistema persistente para ambos usuarios
          try {
            const sysPayload = {
              descripcion: "Intercambio completado",
              system: true,
              tipo: "system",
              de: "system",
              deId: myId, // mantener relación con el usuario para el feed de mensajes
              paraId:
                transaccionFinal.deId === myId
                  ? transaccionFinal.paraId
                  : transaccionFinal.deId,
              productoId: finalT.productoId,
              productoOfrecidoId: finalT.productoOfrecidoId,
            };
            const sysRes = await fetch(`${API_URL}/messages`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(sysPayload),
            });
            if (sysRes.ok) {
              const sysMsg = await sysRes.json();
              const enriched = {
                ...sysMsg,
                system: true,
                descripcion: sysMsg.descripcion || "Intercambio completado",
                fecha: sysMsg.createdAt || new Date().toISOString(),
              };
              // reflejar localmente de inmediato
              setMensajes((prev) => [...prev, enriched]);
              setChats((prev) => {
                try {
                  const current = prev?.[chatSeleccionado] || [];
                  return {
                    ...prev,
                    [chatSeleccionado]: [...current, enriched],
                  };
                } catch {
                  return prev;
                }
              });
            }
          } catch (e) {
            console.warn("No se pudo crear mensaje de sistema de cierre", e);
          }
          try {
            console.log(
              "[CONFIRMAR INTERCAMBIO] Marcando productos como intercambiados"
            );
            const token = localStorage.getItem("token") || "";
            const markExchanged = async (pid) => {
              if (!pid) return;
              try {
                await fetch(`${API_URL}/products/${pid}`, {
                  method: "PUT",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    intercambiado: true,
                    disponible: false,
                  }),
                });
              } catch (e) {
                console.warn("No se pudo actualizar producto", pid, e);
              }
            };
            await Promise.all([
              markExchanged(finalT.productoOfrecidoId),
              markExchanged(finalT.productoId),
            ]);
            // Remover optimistamente el producto de mis publicaciones
            try {
              setUserListings?.((prev) =>
                Array.isArray(prev)
                  ? prev.filter(
                      (p) =>
                        String(p.id || p._id) !==
                        String(finalT.productoOfrecidoId)
                    )
                  : prev
              );
            } catch {}
            // Enriquecer nombres de productos en la transacción si faltan
            try {
              const fetchTitle = async (pid) => {
                if (!pid) return null;
                const r = await fetch(`${API_URL}/products/${pid}`, {
                  headers: { Authorization: `Bearer ${token}` },
                });
                if (!r.ok) return null;
                const p = await r.json();
                return p?.title || p?.nombre || null;
              };
              const tProd =
                finalT.productoTitle || (await fetchTitle(finalT.productoId));
              const oProd =
                finalT.productoOfrecido ||
                (await fetchTitle(finalT.productoOfrecidoId));
              const patched = { ...finalT };
              if (tProd && !patched.productoTitle)
                patched.productoTitle = tProd;
              if (oProd && !patched.productoOfrecido)
                patched.productoOfrecido = oProd;
              // Persistir en userData si hubo cambios
              const needsPersist =
                (tProd && !finalT.productoTitle) ||
                (oProd && !finalT.productoOfrecido);
              if (needsPersist) {
                setUserData((prev) => {
                  const list = Array.isArray(prev?.transacciones)
                    ? [...prev.transacciones]
                    : [];
                  const idx = list.findIndex(
                    (t) =>
                      String(t._id || t.id) === String(finalT._id || finalT.id)
                  );
                  if (idx >= 0)
                    list[idx] = {
                      ...list[idx],
                      productoTitle: patched.productoTitle,
                      productoOfrecido: patched.productoOfrecido,
                    };
                  const next = { ...prev, transacciones: list };
                  try {
                    localStorage.setItem("usuarioActual", JSON.stringify(next));
                  } catch {}
                  return next;
                });
                try {
                  await fetch(`${API_URL}/users/${uid}`, {
                    method: "PUT",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                      transacciones: Array.isArray(userData?.transacciones)
                        ? userData.transacciones.map((t) =>
                            String(t._id || t.id) ===
                            String(finalT._id || finalT.id)
                              ? {
                                  ...t,
                                  productoTitle: tProd || t.productoTitle,
                                  productoOfrecido: oProd || t.productoOfrecido,
                                }
                              : t
                          )
                        : [],
                    }),
                  });
                } catch (e) {
                  console.warn(
                    "No se pudo persistir transacción enriquecida",
                    e
                  );
                }
              }
            } catch {}

            // Notificar a Home y demás vistas para refrescar listados
            try {
              window.dispatchEvent(new CustomEvent("productsUpdated"));
              window.dispatchEvent(
                new CustomEvent("userProfileUpdated", { detail: { id: uid } })
              );
              window.dispatchEvent(
                new CustomEvent("transactionsUpdated", { detail: { id: uid } })
              );
            } catch {}
          } catch (e) {
            console.warn(
              "No se pudo marcar producto como intercambiado aún:",
              e
            );
          }
        }

        // 6. Reconciliar desde servidor
        const resUser = await fetch(`${API_URL}/users/${uid}`);
        if (resUser.ok) {
          const userBD = await resUser.json();
          // Unir confirmaciones optimistas con las del backend para evitar regresión visual
          const merged = Array.isArray(userBD?.transacciones)
            ? userBD.transacciones.map((t) => {
                const tid = t._id || t.id;
                if (tid === transId) {
                  const serverConf = (
                    Array.isArray(t.confirmedBy)
                      ? t.confirmedBy
                      : Array.isArray(t.confirmaciones)
                      ? t.confirmaciones
                      : []
                  ).map((x) => String(x));
                  const localConf = (
                    Array.isArray(optimistic?.confirmedBy)
                      ? optimistic.confirmedBy
                      : Array.isArray(optimistic?.confirmaciones)
                      ? optimistic.confirmaciones
                      : []
                  ).map((x) => String(x));
                  const union = Array.from(
                    new Set(
                      [...(serverConf || []), ...(localConf || [])].filter(
                        Boolean
                      )
                    )
                  );
                  const completed =
                    bothSidesConfirmed(optimistic, union) ||
                    t.estado === "completado";
                  return {
                    ...t,
                    confirmedBy: union,
                    confirmaciones: union,
                    estado: completed
                      ? "completado"
                      : t.estado || "pendiente_confirmacion",
                  };
                }
                return t;
              })
            : userBD?.transacciones;
          const userMerged = merged
            ? { ...userBD, transacciones: merged }
            : userBD;
          setUserData(userMerged);
          try {
            localStorage.setItem("usuarioActual", JSON.stringify(userMerged));
          } catch {}
          window.dispatchEvent(
            new CustomEvent("userProfileUpdated", {
              detail: { id: userMerged.id || userMerged._id },
            })
          );
          // Si la transacción reconciliada difiere de la devuelta por el servidor, persistirla para evitar regresión
          try {
            const originalT =
              (Array.isArray(userBD?.transacciones)
                ? userBD.transacciones
                : []
              ).find((t) => (t._id || t.id) === transId) || {};
            const mergedT =
              (Array.isArray(userMerged?.transacciones)
                ? userMerged.transacciones
                : []
              ).find((t) => (t._id || t.id) === transId) || {};
            const origSet = new Set(
              (
                (Array.isArray(originalT.confirmedBy)
                  ? originalT.confirmedBy
                  : Array.isArray(originalT.confirmaciones)
                  ? originalT.confirmaciones
                  : []) || []
              ).map(String)
            );
            const mergeSet = new Set(
              (
                (Array.isArray(mergedT.confirmedBy)
                  ? mergedT.confirmedBy
                  : Array.isArray(mergedT.confirmaciones)
                  ? mergedT.confirmaciones
                  : []) || []
              ).map(String)
            );
            const sameSize = origSet.size === mergeSet.size;
            const sameMembers =
              sameSize && [...origSet].every((x) => mergeSet.has(x));
            const estadoChanged = originalT.estado !== mergedT.estado;
            if (!sameMembers || estadoChanged) {
              await fetch(`${API_URL}/users/${uid}`, {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${
                    localStorage.getItem("token") || ""
                  }`,
                },
                body: JSON.stringify({
                  transacciones: userMerged.transacciones,
                }),
              });
            }
          } catch {}
        }

        // 7. Sincronizar confirmación con la contraparte para evitar estados divergentes
        try {
          const counterpartId =
            transaccionFinal.deId === myId
              ? transaccionFinal.paraId
              : transaccionFinal.deId;
          if (counterpartId) {
            const resOther = await fetch(`${API_URL}/users/${counterpartId}`);
            if (resOther.ok) {
              const otherUser = await resOther.json();
              const baseTrans = Array.isArray(otherUser?.transacciones)
                ? otherUser.transacciones
                : [];
              // Unificar confirmaciones con la versión más reciente conocida (optimista)
              const mapTrans = (t) => {
                const tid = t._id || t.id;
                if (!tid || tid !== transId) return t;
                const serverConf = (
                  Array.isArray(t.confirmedBy)
                    ? t.confirmedBy
                    : Array.isArray(t.confirmaciones)
                    ? t.confirmaciones
                    : []
                ).map((x) => String(x));
                const localConf = (
                  Array.isArray(optimistic?.confirmedBy)
                    ? optimistic.confirmedBy
                    : Array.isArray(optimistic?.confirmaciones)
                    ? optimistic.confirmaciones
                    : []
                ).map((x) => String(x));
                const union = Array.from(
                  new Set(
                    [...(serverConf || []), ...(localConf || [])].filter(
                      Boolean
                    )
                  )
                );
                const completed = union.length >= 2; // Para contraparte solo validar que sean dos IDs distintos
                return {
                  ...t,
                  confirmedBy: union,
                  confirmaciones: union,
                  estado: completed
                    ? "completado"
                    : t.estado || "pendiente_confirmacion",
                };
              };

              // Intentar reemplazar por id; si no existe, intentar por pair de productoId/productoOfrecidoId; si tampoco, agregar
              let found = false;
              const nextOtherTrans = baseTrans.map((t) => {
                if ((t._id || t.id) === transId) {
                  found = true;
                  return mapTrans(t);
                }
                if (
                  !found &&
                  t.productoId === transaccionFinal.productoId &&
                  t.productoOfrecidoId === transaccionFinal.productoOfrecidoId
                ) {
                  found = true;
                  return mapTrans(t);
                }
                return t;
              });
              const finalOtherTrans = found
                ? nextOtherTrans
                : [...nextOtherTrans, { ...optimistic }];

              console.log("[CONFIRMAR INTERCAMBIO] PUT /users (counterpart)", {
                userId: counterpartId,
                transacciones: finalOtherTrans,
              });
              const putOther = await fetch(
                `${API_URL}/users/${counterpartId}`,
                {
                  method: "PUT",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${
                      localStorage.getItem("token") || ""
                    }`,
                  },
                  body: JSON.stringify({ transacciones: finalOtherTrans }),
                }
              );
              console.log(
                "[CONFIRMAR INTERCAMBIO] Respuesta PUT /users (counterpart)",
                putOther.status
              );
            }
          }
        } catch (e) {
          console.warn(
            "No se pudo sincronizar confirmación con la contraparte:",
            e
          );
        }
      }
    } catch (e) {
      console.error("❌ Error al confirmar intercambio:", e);
      alert("No se pudo confirmar el intercambio. Intenta nuevamente.");
    }
  };

  // Función para volver a publicar producto desde intercambios
  const handleRepublish = async (transaccion) => {
    if (
      !window.confirm(
        `¿Estás seguro de que quieres volver a publicar "${transaccion.productoOfrecido}"?`
      )
    ) {
      return;
    }

    try {
      console.log(
        "🔄 Volviendo a publicar producto:",
        transaccion.productoOfrecido
      );

      // 1. Buscar el producto en el backend usando el ID de la transacción
      const productResponse = await fetch(
        `${API_URL}/products/${transaccion.productoOfrecidoId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!productResponse.ok) {
        throw new Error("No se pudo encontrar el producto");
      }

      const producto = await productResponse.json();

      // 2. Marcar producto como NO intercambiado en el backend
      const updateResponse = await fetch(
        `${API_URL}/products/${transaccion.productoOfrecidoId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ intercambiado: false }),
        }
      );

      if (!updateResponse.ok) {
        throw new Error("Error al actualizar el producto");
      }

      // 3. Actualizar estado local inmediatamente
      // Agregar producto de vuelta a "Mis Artículos"
      setUserListings((prev) => [
        ...prev,
        {
          ...producto,
          intercambiado: false,
          estado: "activo",
        },
      ]);

      // Remover transacción de "Mis Intercambios"
      setUserData((prev) => ({
        ...prev,
        transacciones: prev.transacciones.filter(
          (t) => t.id !== transaccion.id
        ),
      }));

      // 4. Actualizar transacciones del usuario en el backend
      const usuarioActual = JSON.parse(localStorage.getItem("usuarioActual"));
      const updatedTransacciones = usuarioActual.transacciones.filter(
        (t) => t.id !== transaccion.id
      );

      const userResponse = await fetch(`${API_URL}/users/${usuarioActual.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ transacciones: updatedTransacciones }),
      });

      if (userResponse.ok) {
        const updatedUser = await userResponse.json();
        localStorage.setItem("usuarioActual", JSON.stringify(updatedUser));
        console.log("✅ Producto republicado exitosamente");

        // Mostrar mensaje de éxito
        alert(
          `"${transaccion.productoOfrecido}" ha sido republicado y aparecerá en "Mis Artículos"`
        );

        // Cambiar automáticamente a la pestaña de artículos
        setActiveTab("articulos");
      }
    } catch (error) {
      console.error("❌ Error al republicar producto:", error);
      alert(
        "Hubo un error al republicar el producto. Por favor, inténtalo de nuevo."
      );
    }
  };

  const handleEditClick = () => navigate("/editar");

  // Maneja el cambio de texto en la respuesta de un mensaje
  const handleRespuestaChange = (id, texto) => {
    setRespuestaMensaje((prev) => ({ ...prev, [id]: texto }));
  };

  // Maneja el envío de la respuesta a un mensaje
  const handleEnviarRespuesta = (id) => {
    const respuesta = respuestaMensaje[id];
    if (!respuesta || respuesta.trim() === "") {
      alert("Por favor, escribe una respuesta antes de enviar.");
      return;
    }

    const usuario = JSON.parse(localStorage.getItem("usuarioActual"));
    const mensajeOriginal = mensajes.find((m) => m.id === id);

    const nuevoMensaje = {
      de: usuario.nombre + " " + usuario.apellido,
      deId: usuario.id,
      paraId: mensajeOriginal.deId,
      paraNombre: mensajeOriginal.de,
      productoOfrecido: `Respuesta a: ${mensajeOriginal.productoOfrecido}`,
      descripcion: respuesta,
      condiciones: "",
      imagenNombre: "",
    };

    fetch(`${API_URL}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(nuevoMensaje),
    })
      .then((response) => response.json())
      .then((data) => {
        setMensajes((prev) => [
          ...prev,
          {
            ...data,
            nombreRemitente: nuevoMensaje.de,
            fecha: new Date().toLocaleString(),
          },
        ]);
        setRespuestaMensaje((prev) => ({ ...prev, [id]: "" }));
      })
      .catch((error) => {
        console.error("Error al enviar mensaje:", error);
        alert("Error al enviar el mensaje. Por favor, intenta nuevamente.");
      });
  };

  const handleRefreshMensaje = React.useCallback(() => {
    // Solo refrescar si realmente es necesario (ej: después de enviar un mensaje)
    if (userData?.id) {
      fetchMensajes(userData.id);
    }
  }, [userData?.id]);

  // Estado para controlar si el usuario está en la pestaña de mensajes y la visibilidad
  const [isMessagesTabActive, setIsMessagesTabActive] = useState(false);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsMessagesTabActive(
        document.visibilityState === "visible" && activeTab === "mensajes"
      );
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [activeTab]);

  // Refrescar perfil cuando se vuelve a la pestaña de mensajes y la transacción del stepper aún no está completada
  useEffect(() => {
    try {
      if (activeTab !== "mensajes") return;
      if (!isMessagesTabActive) return; // solo cuando la pestaña está visible
      const usuarioActual = JSON.parse(
        localStorage.getItem("usuarioActual") || "{}"
      );
      const uid = usuarioActual?.id || userData?.id;
      if (!uid) return;
      const mensajesSel = chats[chatSeleccionado] || [];
      // Tomar SIEMPRE el mensaje de intercambio más reciente del chat.
      // Si aún no existe productoOfrecidoId (propuesta recién enviada), caer al más reciente con solo productoId.
      const ordenados = [...mensajesSel].sort(
        (a, b) =>
          new Date(b.createdAt || b.fecha || b.timestamp || 0) -
          new Date(a.createdAt || a.fecha || a.timestamp || 0)
      );
      let mensajeIntercambio = ordenados.find(
        (m) => m.productoId && m.productoOfrecidoId
      );
      if (!mensajeIntercambio)
        mensajeIntercambio = ordenados.find((m) => m.productoId);
      if (!mensajeIntercambio) return;

      // Buscar transacción fresca local (priorizar por _id/id del mensaje).
      let transFresca = null;
      if (Array.isArray(userData?.transacciones)) {
        const porIdMsg = userData.transacciones.filter(
          (t) =>
            String(t._id || t.id || "") ===
            String(mensajeIntercambio._id || mensajeIntercambio.id || "")
        );
        const porPair = porIdMsg.length
          ? []
          : userData.transacciones.filter(
              (t) =>
                t.productoId &&
                t.productoId === mensajeIntercambio.productoId &&
                t.productoOfrecidoId &&
                t.productoOfrecidoId === mensajeIntercambio.productoOfrecidoId
            );
        // Fallback: si aún no hay productoOfrecidoId, comparar solo por productoId PERO
        // solo considerar transacciones NO completadas y recientes para evitar heredar estados viejos.
        const nowMsgTs = new Date(
          mensajeIntercambio.createdAt ||
            mensajeIntercambio.fecha ||
            mensajeIntercambio.timestamp ||
            Date.now()
        ).getTime();
        const porSoloProducto =
          porIdMsg.length || porPair.length
            ? []
            : userData.transacciones.filter((t) => {
                if (
                  !(
                    t.productoId &&
                    t.productoId === mensajeIntercambio.productoId
                  )
                )
                  return false;
                const tTime = new Date(
                  t.updatedAt || t.createdAt || 0
                ).getTime();
                const isRecent = Math.abs(nowMsgTs - tTime) <= 1000 * 60 * 30; // 30 minutos
                const notCompleted = t.estado !== "completado";
                return notCompleted && isRecent;
              });
        const porTitulo =
          porIdMsg.length || porPair.length || porSoloProducto.length
            ? []
            : userData.transacciones.filter(
                (t) =>
                  t.productoTitle &&
                  t.productoTitle === mensajeIntercambio.productoTitle &&
                  t.productoOfrecido &&
                  t.productoOfrecido === mensajeIntercambio.productoOfrecido
              );
        const pool = porIdMsg.length
          ? porIdMsg
          : porPair.length
          ? porPair
          : porSoloProducto.length
          ? porSoloProducto
          : porTitulo;
        if (pool.length) {
          transFresca = pool.reduce((a, b) => {
            const da = new Date(a.updatedAt || a.createdAt || 0).getTime();
            const db = new Date(b.updatedAt || b.createdAt || 0).getTime();
            return db > da ? b : a;
          });
          // Si la transacción seleccionada está completada pero es claramente más vieja que este mensaje nuevo, ignorarla
          const tSelTime = new Date(
            transFresca.updatedAt || transFresca.createdAt || 0
          ).getTime();
          const tooOldCompleted =
            transFresca.estado === "completado" &&
            nowMsgTs - tSelTime > 1000 * 60 * 2; // 2 minutos
          if (tooOldCompleted) transFresca = null;
        }
      }
      // Si no logramos matchear una transacción (p.ej., propuesta nueva), fijar estado base pendiente para que el Stepper no muestre "Listo"
      if (!transFresca) {
        transFresca = {
          confirmedBy: [],
          confirmaciones: [],
          estado: "pendiente_confirmacion",
          productoId: mensajeIntercambio.productoId,
          productoOfrecidoId: mensajeIntercambio.productoOfrecidoId,
        };
      }

      const conf =
        (Array.isArray(transFresca?.confirmedBy) && transFresca.confirmedBy) ||
        (Array.isArray(transFresca?.confirmaciones) &&
          transFresca.confirmaciones) ||
        [];
      const uniqueCount = new Set(conf.filter(Boolean)).size;
      const completed =
        transFresca?.estado === "completado" ||
        mensajeIntercambio.estado === "completado" ||
        uniqueCount >= 2;
      if (!completed) {
        // Obtener estado autoritativo del servidor
        fetch(`${API_URL}/users/${uid}`)
          .then((r) => (r.ok ? r.json() : null))
          .then((data) => {
            if (!data) return;
            setUserData(data);
            try {
              localStorage.setItem("usuarioActual", JSON.stringify(data));
            } catch {}
            window.dispatchEvent(
              new CustomEvent("userProfileUpdated", {
                detail: { id: data.id || data._id },
              })
            );
          })
          .catch(() => {});
      }
    } catch (_) {}
  }, [activeTab, isMessagesTabActive, chatSeleccionado, chats, userData?.id]);

  // Heurística de conciliación cruzada: si yo ya confirmé pero el stepper no está completo, consultar a la contraparte y unir confirmaciones
  const crossMergeGuardRef = React.useRef({});
  useEffect(() => {
    try {
      if (activeTab !== "mensajes") return;
      const mensajesSel = chats[chatSeleccionado] || [];
      const mensajeIntercambio = mensajesSel.find(
        (m) => m.productoId && m.productoOfrecidoId
      );
      if (!mensajeIntercambio) return;
      const me =
        userData?.id ||
        JSON.parse(localStorage.getItem("usuarioActual") || "{}")?.id;
      const other =
        mensajeIntercambio.deId === me
          ? mensajeIntercambio.paraId
          : mensajeIntercambio.deId;
      if (!me || !other) return;

      // Buscar transacción local más fresca
      let transLocal = null;
      if (Array.isArray(userData?.transacciones)) {
        const byId = userData.transacciones.filter(
          (t) =>
            String(t._id || t.id || "") ===
            String(mensajeIntercambio._id || mensajeIntercambio.id || "")
        );
        const byPair = byId.length
          ? []
          : userData.transacciones.filter(
              (t) =>
                t.productoId === mensajeIntercambio.productoId &&
                t.productoOfrecidoId === mensajeIntercambio.productoOfrecidoId
            );
        const byTitle =
          byId.length || byPair.length
            ? []
            : userData.transacciones.filter(
                (t) =>
                  t.productoTitle === mensajeIntercambio.productoTitle &&
                  t.productoOfrecido === mensajeIntercambio.productoOfrecido
              );
        const pool = byId.length ? byId : byPair.length ? byPair : byTitle;
        if (pool.length) {
          transLocal = pool.reduce((a, b) => {
            const da = new Date(a.updatedAt || a.createdAt || 0).getTime();
            const db = new Date(b.updatedAt || b.createdAt || 0).getTime();
            return db > da ? b : a;
          });
        }
      }
      if (!transLocal) return;
      const confLocal = (
        Array.isArray(transLocal.confirmedBy)
          ? transLocal.confirmedBy
          : Array.isArray(transLocal.confirmaciones)
          ? transLocal.confirmaciones
          : []
      ).map(String);
      const myS = String(me);
      const otherS = String(other);
      const iConfirmed = confLocal.includes(myS);
      const otherConfirmed = confLocal.includes(otherS);
      const alreadyCompleted =
        transLocal.estado === "completado" || new Set(confLocal).size >= 2;
      const txKey = String(
        transLocal._id ||
          transLocal.id ||
          `${transLocal.productoId}-${transLocal.productoOfrecidoId}`
      );
      if (!iConfirmed || alreadyCompleted) return;
      // Evitar loops: procesar cada transacción solo una vez por sesión
      if (crossMergeGuardRef.current[txKey]) return;
      crossMergeGuardRef.current[txKey] = true;

      // Si falta la confirmación del otro, consultar a la contraparte
      fetch(`${API_URL}/users/${other}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (!data) return;
          const list = Array.isArray(data.transacciones)
            ? data.transacciones
            : [];
          const pool = list.filter(
            (t) =>
              String(t._id || t.id || "") ===
                String(transLocal._id || transLocal.id || "") ||
              (t.productoId === transLocal.productoId &&
                t.productoOfrecidoId === transLocal.productoOfrecidoId)
          );
          const tOther = pool.reduce((a, b) => {
            const da = new Date(a?.updatedAt || a?.createdAt || 0).getTime();
            const db = new Date(b?.updatedAt || b?.createdAt || 0).getTime();
            return db > da ? b : a;
          }, null);
          const confOther = (
            Array.isArray(tOther?.confirmedBy)
              ? tOther.confirmedBy
              : Array.isArray(tOther?.confirmaciones)
              ? tOther.confirmaciones
              : []
          ).map(String);
          if (!confOther.includes(otherS)) return; // la contraparte aún no confirmó
          const union = Array.from(
            new Set([...(confLocal || []), ...(confOther || [])])
          );
          const completed = union.length >= 2;

          // Actualizar estado local (userData)
          setUserData((prev) => {
            const base = Array.isArray(prev?.transacciones)
              ? prev.transacciones
              : [];
            const next = base.map((t) => {
              const same =
                String(t._id || t.id || "") ===
                  String(transLocal._id || transLocal.id || "") ||
                (t.productoId === transLocal.productoId &&
                  t.productoOfrecidoId === transLocal.productoOfrecidoId);
              if (!same) return t;
              return {
                ...t,
                confirmedBy: union,
                confirmaciones: union,
                estado: completed
                  ? "completado"
                  : t.estado || "pendiente_confirmacion",
              };
            });
            const merged = { ...prev, transacciones: next };
            try {
              localStorage.setItem("usuarioActual", JSON.stringify(merged));
            } catch {}
            return merged;
          });

          // Actualizar mensajes del chat para que el Stepper no lea datos viejos
          setChats((prev) => {
            const msgs = prev[chatSeleccionado] || [];
            const patched = msgs.map((m) => {
              const same =
                m.productoId === transLocal.productoId &&
                m.productoOfrecidoId === transLocal.productoOfrecidoId;
              if (!same) return m;
              return {
                ...m,
                confirmedBy: union,
                confirmaciones: union,
                estado: completed
                  ? "completado"
                  : m.estado || "pendiente_confirmacion",
              };
            });
            return { ...prev, [chatSeleccionado]: patched };
          });

          // Persistir en backend en mi usuario
          const meId =
            userData?.id ||
            JSON.parse(localStorage.getItem("usuarioActual") || "{}")?.id;
          if (meId) {
            const after = JSON.parse(
              localStorage.getItem("usuarioActual") || "{}"
            );
            const trans = Array.isArray(after?.transacciones)
              ? after.transacciones
              : [];
            fetch(`${API_URL}/users/${meId}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
              },
              body: JSON.stringify({ transacciones: trans }),
            }).catch(() => {});
          }
        })
        .catch(() => {});
    } catch (_) {}
  }, [activeTab, chatSeleccionado, chats, userData?.transacciones]);

  // Eliminado useEffect con polling inteligente
  // useEffect(() => {
  //   if (!userData?.id || activeTab !== 'mensajes') return;
  //   let timeoutId;
  //   let isMounted = true;
  //   // Eliminado fetchWithBackoff - causaba re-renders constantes
  //   // const fetchWithBackoff = async (attempt = 0) => {
  //   //   if (!isMounted) return;
  //   //   try {
  //   //     await fetchMensajes(userData.id);
  //   //     const delay = 15000; // 15 segundos entre fetchs exitosos
  //   //     timeoutId = setTimeout(() => fetchWithBackoff(0), delay);
  //   //   } catch (error) {
  //   //     // Si hay error, esperar más tiempo antes de reintentar
  //   //     const delay = Math.min(1000 * (2 ** (attempt + 1)), 60000);
  //   //     timeoutId = setTimeout(() => fetchWithBackoff(attempt + 1), delay);
  //   //   }
  //   // };
  //   // fetchWithBackoff();
  //   return () => {
  //     isMounted = false;
  //     if (timeoutId) clearTimeout(timeoutId);
  //   };
  // }, [userData?.id, activeTab, isMessagesTabActive]);

  // Scroll inteligente: solo bajar automáticamente cuando corresponde
  const [autoScroll, setAutoScroll] = React.useState(true);
  const [userSentMessage, setUserSentMessage] = React.useState(false);
  const chatMessagesEndRef = React.useRef(null);
  const chatContainerRef = React.useRef(null);
  const mensajesSectionRef = React.useRef(null);
  const articulosSectionRef = React.useRef(null);
  const transaccionesSectionRef = React.useRef(null);
  const favoritosSectionRef = React.useRef(null);
  const donacionesSectionRef = React.useRef(null);

  // Detectar si el usuario está al final del chat
  const isUserAtBottom = React.useCallback(() => {
    if (!chatContainerRef.current) return false;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    return scrollHeight - scrollTop - clientHeight < 50; // 50px de tolerancia
  }, []);

  const scrollToBottom = React.useCallback(
    (force = false) => {
      // Deshabilitar scroll automático al enviar mensajes
      if (!force) return;

      const container = chatContainerRef.current;
      if (!container) return;

      // Solo hacer scroll suave cuando se fuerza explícitamente
      const behavior = force ? "smooth" : "auto";

      requestAnimationFrame(() => {
        container.scrollTo({ top: container.scrollHeight, behavior });
        setUserSentMessage(false);
      });
    },
    [userSentMessage, isUserAtBottom]
  );

  // Evitar forzar scroll al fondo al entrar a mensajes: solo alineamos la sección
  useEffect(() => {
    if (activeTab === "mensajes") {
      // reset flag de envío manual
      setUserSentMessage(false);
    }
  }, [activeTab]);

  // Scroll de ventana: alinear el contenedor de la sección activa con el viewport
  useEffect(() => {
    const sectionRefMap = {
      mensajes: mensajesSectionRef,
      articulos: articulosSectionRef,
      transacciones: transaccionesSectionRef,
      favoritos: favoritosSectionRef,
    };
    const offsetMap = {
      mensajes: 90,
      articulos: 120,
      transacciones: 120,
      favoritos: 120,
    };
    const refObj = sectionRefMap[activeTab];
    const el = refObj?.current;
    if (!el) return;
    const offset = offsetMap[activeTab] ?? 120;
    const y = el.getBoundingClientRect().top + window.pageYOffset - offset;
    const behavior = activeTab === "mensajes" ? "auto" : "smooth";
    const t = setTimeout(() => {
      window.scrollTo({ top: y, behavior });
    }, 0);
    return () => clearTimeout(t);
  }, [activeTab]);

  // Reforzar scroll cuando los chats se cargan o cambia el chat seleccionado
  useEffect(() => {
    if (activeTab === "mensajes") {
      const t = setTimeout(() => {
        // Solo hacer scroll automático si el usuario está al final del chat
        if (userSentMessage && autoScroll) {
          scrollToBottom(false);
        }
      }, 50);
      return () => clearTimeout(t);
    }
  }, [
    chats,
    chatSeleccionado,
    activeTab,
    userSentMessage,
    scrollToBottom,
    autoScroll,
  ]);

  // Optimizar renderizado de mensajes del chat
  const chatMessages = React.useMemo(() => {
    if (!chatSeleccionado || !chats[chatSeleccionado]) return [];
    return chats[chatSeleccionado];
  }, [chatSeleccionado, chats]);

  // Detectar si el usuario está al final del chat
  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    // Solo activar autoScroll si está a menos de 100px del fondo
    setAutoScroll(scrollHeight - scrollTop - clientHeight < 100);
  };

  // Efecto: solo hacer scroll automático si el usuario está al final
  React.useEffect(() => {
    if (!autoScroll) return;
    const container = chatContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  }, [chatMessages, autoScroll]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Si se cambia a la pestaña de mensajes, forzar una actualización
    if (tab === "mensajes" && userData?.id) {
      console.log("🔄 Cambiando a pestaña de mensajes, actualizando...");
      fetchMensajes(userData.id);
    }
    // Si se cambia a la pestaña de donaciones, cargar donaciones
    if (tab === "donaciones") {
      loadDonaciones();
    }
    // Si se cambia a la pestaña de intercambios, refrescar donaciones para incluir entregadas
    if (tab === "transacciones") {
      loadDonaciones();
    }
  };

  // Función para cargar donaciones del usuario
  const loadDonaciones = async () => {
    const usuario = JSON.parse(localStorage.getItem("usuarioActual"));
    if (!usuario) return;

    setLoadingDonaciones(true);
    try {
      console.log("📦 Cargando donaciones del usuario:", usuario.id);
      const uid = (usuario._id || usuario.id || "").toString();
      const isMongoId = /^[a-fA-F0-9]{24}$/.test(uid);
      let response;
      if (isMongoId) {
        // Intento 1: endpoint por donor SOLO si el uid parece un ObjectId válido
        response = await fetch(`${API_URL}/donations?donor=${uid}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
        });
        if (!response.ok) {
          console.warn(
            "⚠️ /donations?donor= falló, intentando fallback /donations. Status:",
            response.status
          );
        }
      }
      if (!response || !response.ok) {
        // Fallback: traer todas y filtrar en frontend (también para uids no-ObjectId)
        response = await fetch(`${API_URL}/donations`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
        });
        if (!response.ok) throw new Error(`Error HTTP ${response.status}`);
      }

      const data = await response.json();
      const seen = new Set();
      const listaBase = Array.isArray(data) ? data : [];
      const porUsuario = listaBase.filter((d) => {
        const donorId =
          d.donorId ||
          d.ownerId ||
          d.userId ||
          d.donor?._id ||
          d.donor?.id ||
          d.user?._id ||
          d.user?.id;
        return donorId && donorId.toString() === uid;
      });
      const normalizadas = porUsuario
        .map((d) => ({
          ...d,
          id: d._id || d.id,
          title: d.title || d.itemName,
          status: d.status || d.estado || d.state || "",
          donorId:
            d.donorId ||
            d.ownerId ||
            d.userId ||
            d.donor?._id ||
            d.donor?.id ||
            d.user?._id ||
            d.user?.id,
        }))
        .filter((d) => !!d.id)
        .filter((d) => {
          if (seen.has(d.id)) return false;
          seen.add(d.id);
          return true;
        });
      console.log(
        "✅ Donaciones filtradas (propias, únicas; incluye activas y entregadas):",
        normalizadas
      );
      setDonaciones(normalizadas);
    } catch (error) {
      console.error("❌ Error al cargar donaciones:", error);
      setDonaciones([]);
    } finally {
      setLoadingDonaciones(false);
    }
  };

  // Marcar donación como entregada y refrescar datos/eventos globales
  const handleMarkDonationDelivered = async (donacion) => {
    if (!donacion?._id && !donacion?.id) return;
    const donationId = donacion._id || donacion.id;
    if (
      !window.confirm(
        `¿Confirmás que la donación "${
          donacion.title || donacion.itemName
        }" fue entregada?`
      )
    )
      return;
    try {
      // Backend: cambiar estado a delivered
      const res = await fetch(`${API_URL}/donations/${donationId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: JSON.stringify({ status: "delivered" }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Error HTTP ${res.status}`);
      }
      const updated = await res.json();
      // Actualizar estado local de lista
      setDonaciones((prev) =>
        prev.map((d) =>
          (d._id || d.id) === donationId ? { ...d, status: updated.status } : d
        )
      );
      // Si el chat seleccionado está vinculado a esta donación, refrescar detalle
      if (
        chatDonation &&
        (chatDonation._id === donationId || chatDonation.id === donationId)
      ) {
        try {
          const ref = await fetch(`${API_URL}/donations/${donationId}`);
          if (ref.ok) setChatDonation(await ref.json());
        } catch {}
      }
      // Refrescar datos del usuario (transacciones y contadores) después de marcar como entregada
      try {
        const usuarioActual = JSON.parse(localStorage.getItem("usuarioActual"));
        const uid = usuarioActual?.id || userData?.id;
        if (uid) {
          const userRes = await fetch(`${API_URL}/users/${uid}`);
          if (userRes.ok) {
            const freshUser = await userRes.json();
            // Normalizar para asegurar presencia de id
            const normalizedUser = {
              ...freshUser,
              id: freshUser.id || freshUser._id,
            };
            setUserData((prev) => ({
              ...prev,
              ...normalizedUser,
              imagen: prev?.imagen || normalizedUser?.imagen,
            }));
            localStorage.setItem(
              "usuarioActual",
              JSON.stringify({
                ...(JSON.parse(localStorage.getItem("usuarioActual")) || {}),
                ...normalizedUser,
                imagen:
                  (JSON.parse(localStorage.getItem("usuarioActual")) || {})
                    .imagen || normalizedUser?.imagen,
              })
            );
          }
        }
      } catch (e) {
        console.warn(
          "No se pudo refrescar el usuario tras entregar donación:",
          e
        );
      }
      // Forzar recarga de donaciones para mantener contador y listado al día
      loadDonaciones();
      // Emitir evento global para que otras vistas se actualicen
      window.dispatchEvent(
        new CustomEvent("donationsUpdated", {
          detail: { id: donationId, status: "delivered" },
        })
      );
      // Enviar el usuario completo normalizado para evitar cerrar sesión en listeners
      try {
        const uLS = JSON.parse(localStorage.getItem("usuarioActual")) || {};
        const payloadUser = { ...uLS, id: uLS.id || uLS._id };
        window.dispatchEvent(
          new CustomEvent("userProfileUpdated", { detail: payloadUser })
        );
      } catch {}
      // Feedback visual: modal de felicitación auto-cerrable
      setShowDonationCongrats(true);
      setTimeout(() => setShowDonationCongrats(false), 3000);
      // Navegar/cambiar a la pestaña de Intercambios inmediatamente
      setActiveTab("transacciones");
    } catch (e) {
      console.error("❌ Error al marcar donación como entregada:", e);
      alert(e.message || "No se pudo actualizar la donación");
    }
  };

  // Escuchar evento global para refrescar donaciones (también el contador en header)
  useEffect(() => {
    const onDonationsUpdated = () => {
      loadDonaciones();
    };
    window.addEventListener("donationsUpdated", onDonationsUpdated);
    return () =>
      window.removeEventListener("donationsUpdated", onDonationsUpdated);
  }, []);

  const handleEliminarTransaccion = () => {
    const idx = transToDelete.idx;
    const nuevaLista = [...userData.transacciones];
    nuevaLista.splice(idx, 1);
    setUserData((prev) => ({ ...prev, transacciones: nuevaLista }));
    setShowConfirmDeleteTrans(false);
  };

  // Función para manejar la eliminación de un mensaje
  // Confirmar intercambio de un mensaje
  const realizarConfirmacionIntercambio = async () => {
    if (!mensajeIntercambio) return;
    try {
      const idMsg = mensajeIntercambio._id || mensajeIntercambio.id;
      const res = await fetch(`${API_URL}/messages/${idMsg}/confirm`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userData.id }),
      });

      if (res.ok) {
        const data = await res.json();

        // Actualizar el estado local del mensaje para que la UI refleje la confirmación inmediatamente
        setMensajeIntercambio((prev) => ({
          ...prev,
          confirmaciones: [...(prev.confirmaciones || []), userData.id],
          completed: data.completed,
        }));

        // Si el intercambio se completó (ambos confirmaron), refrescar todo
        if (data.completed) {
          console.log(
            "Intercambio completado! Refrescando mensajes y productos..."
          );
          fetchMensajes(userData.id);
          window.dispatchEvent(new Event("productsUpdated"));
        }

        // Siempre ocultar el modal de confirmación
        setShowConfirmExchange(false);
      } else {
        const errorData = await res.json();
        console.error("Error al confirmar el intercambio:", errorData.message);
        alert(
          `Error: ${
            errorData.message || "No se pudo confirmar el intercambio."
          }`
        );
      }
    } catch (err) {
      console.error("Error de red al confirmar:", err);
      alert("Error de red. No se pudo conectar con el servidor.");
    }
  };

  const handleDeleteMessage = async () => {
    if (!messageToDelete) return;
    try {
      await fetch(
        `${API_URL}/messages/${messageToDelete._id || messageToDelete.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setMensajes((prev) =>
        prev.filter(
          (m) => (m._id || m.id) !== (messageToDelete._id || messageToDelete.id)
        )
      );
      setShowConfirmMessageDelete(false);
    } catch (error) {
      console.error("Error al eliminar el mensaje:", error);
      alert("No se pudo eliminar el mensaje. Inténtalo de nuevo.");
    }
  };

  return (
    <div className="perfil-usuario-container">
      <Header search={false} />
      {/* Contenedor del botón de regresar */}
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "0 1rem",
          marginBottom: "1rem",
        }}
      >
        <BackButton
          className="icon-back-btn"
          to="/"
          aria-label="Volver al inicio"
          style={{
            position: "relative",
            left: "0",
            top: "0",
            transform: "none",
            margin: "1rem 0 0 0",
          }}
        />
      </div>

      {/* Cabecera Premium (Stacked, centered) */}
      <div className="perfil-header-premium">
        <div className="perfil-card-premium">
          {/* Avatar Premium */}
          <div className="avatar-container-premium">
            <div className="avatar-wrapper-premium">
              <img
                src={imagenPerfil}
                alt="Foto de perfil"
                className="avatar-image-premium"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/images/fotoperfil.jpg";
                }}
              />
            </div>
            <div className="avatar-ring-premium"></div>
          </div>

          {/* Información Principal */}
          <div className="perfil-main-info-premium">
            <h1
              className="perfil-nombre-premium"
              style={{
                color: "#475569",
                background: "none",
                WebkitTextFillColor: "initial",
                WebkitBackgroundClip: "initial",
                textShadow: "none",
              }}
            >
              {`${capitalize(userData.nombre)} ${capitalize(
                userData.apellido
              )}`}
            </h1>

            {/* Stats Premium */}
            <div className="perfil-stats-premium">
              <div
                className="stat-card-premium"
                onClick={() => navigate(`/calificaciones/${userData.id}`)}
                aria-label="Ver calificaciones"
                role="button"
              >
                <div className="stat-number-premium stat-number-rating">
                  {(userData?.calificacion ?? 0).toFixed(1)}
                </div>
                <span className="stat-label-premium">Calificación</span>
              </div>

              <div className="stat-card-premium">
                <div className="stat-number-premium">
                  {Array.isArray(userData?.transacciones)
                    ? userData.transacciones
                        .filter((t) => !t?.deleted)
                        .filter((t) => {
                          const tipo = (t?.tipo ?? t?.type ?? "")
                            .toString()
                            .toLowerCase();
                          const isDonationish = tipo.includes("donac"); // donacion/donación/donation
                          if (isDonationish || t?.isDonation === true)
                            return false;
                          const estado = (t?.estado ?? t?.status ?? "")
                            .toString()
                            .toLowerCase();
                          const hasProduct = !!(
                            t?.productoOfrecidoId ||
                            t?.productoSolicitadoId ||
                            t?.productoOfrecido ||
                            t?.productoSolicitado
                          );
                          const finals = [
                            "complet",
                            "finaliz",
                            "cerrad",
                            "hech",
                            "done",
                          ];
                          const matchesFinal = finals.some((k) =>
                            estado.includes(k)
                          );
                          // Si no hay estado, pero es un intercambio válido con producto, contarlo igual
                          return matchesFinal || (!estado && hasProduct);
                        }).length
                    : 0}
                </div>
                <span className="stat-label-premium">Intercambios</span>
              </div>

              <div className="stat-card-premium">
                <div className="stat-number-premium">
                  {Array.isArray(donaciones)
                    ? donaciones.filter(
                        (d) => (d.status || "").toLowerCase() === "delivered"
                      ).length
                    : 0}
                </div>
                <span className="stat-label-premium">Donaciones</span>
              </div>
            </div>
          </div>

          {/* Caja inferior estilo público: SOLO Detalles */}
          <PerfilDetallesBox
            provincia={userData.provincia || userData.zona || "Tucumán"}
            email={userData.email}
            mostrarContacto={!!userData.mostrarContacto}
          />

          {/* Botones de Acción, fuera de la caja de datos personales */}
          <div
            className="perfil-acciones-premium"
            style={{ marginTop: "1rem" }}
          >
            <button className="btn-editar-premium" onClick={handleEditClick}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              Editar Perfil
            </button>
            <button
              className="btn-configuracion-premium"
              onClick={() => navigate("/configuracion")}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                focusable="false"
              >
                <circle cx="17" cy="7" r="3" />
                <circle cx="7" cy="17" r="3" />
                <path d="M20 7H11" />
                <path d="M14 17H5" />
              </svg>
              Configuración
            </button>
          </div>
        </div>
      </div>

      <div className="perfil-usuario-content">
        {/* Tabs Premium */}
        <div className="perfil-tabs-premium">
          <button
            className={`tab-btn-premium ${
              activeTab === "articulos" ? "active" : ""
            }`}
            onClick={() => handleTabChange("articulos")}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14,2 14,8 20,8"></polyline>
            </svg>
            Mis Artículos
          </button>
          <button
            className={`tab-btn-premium ${
              activeTab === "transacciones" ? "active" : ""
            }`}
            onClick={() => handleTabChange("transacciones")}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M7 7h10v10"></path>
              <path d="M7 17 17 7"></path>
            </svg>
            Mis Intercambios
          </button>
          <button
            className={`tab-btn-premium ${
              activeTab === "mensajes" ? "active" : ""
            }`}
            onClick={() => handleTabChange("mensajes")}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            Mensajes
          </button>
          <button
            className={`tab-btn-premium ${
              activeTab === "favoritos" ? "active" : ""
            }`}
            onClick={() => handleTabChange("favoritos")}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            Favoritos
          </button>
          <button
            className={`tab-btn-premium ${
              activeTab === "donaciones" ? "active" : ""
            }`}
            onClick={() => handleTabChange("donaciones")}
          >
            {/* Gift icon to represent donations */}
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              focusable="false"
            >
              <polyline points="20 12 20 22 4 22 4 12" />
              <rect x="2" y="7" width="20" height="5" rx="1" />
              <path d="M12 22V7" />
              <path d="M12 7c.5-2.5-2-5-4-3.5C6 4.5 7.5 7 10 7h2" />
              <path d="M12 7c-.5-2.5 2-5 4-3.5C18 4.5 16.5 7 14 7h-2" />
            </svg>
            Mis Donaciones
          </button>
        </div>

        <div className="perfil-tab-content">
          {activeTab === "favoritos" && (
            <div className="mis-favoritos" ref={favoritosSectionRef}>
              <h2>Favoritos</h2>
              <div className="product-list">
                {Array.isArray(favoritos) && favoritos.length > 0 ? (
                  favoritos.map((producto) => (
                    <ProductCard
                      key={producto.id}
                      id={producto.id}
                      title={producto.title}
                      description={producto.description}
                      categoria={producto.categoria}
                      image={producto.image}
                      images={producto.images}
                      fechaPublicacion={
                        producto.fechaPublicacion || producto.createdAt
                      }
                      provincia={producto.provincia || producto.ubicacion}
                      ownerName={producto.ownerName}
                      ownerId={producto.ownerId}
                      condicion={producto.condicion}
                      valorEstimado={producto.valorEstimado}
                      disponible={producto.disponible}
                      onConsultar={() => navigate(`/producto/${producto._id}`)}
                      hideFavoriteButton
                      showRemoveFavorite
                      onRemoveFavorite={() =>
                        handleRemoveFromFavorites(producto._id)
                      }
                    />
                  ))
                ) : (
                  <p>No tienes productos favoritos aún.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === "donaciones" && (
            <div className="mis-articulos" ref={donacionesSectionRef}>
              <h2>Mis Donaciones</h2>
              <button
                className="btn-publicar"
                onClick={() => navigate("/donaciones/publicar")}
              >
                + Nueva Donación
              </button>
              {loadingDonaciones ? (
                <div className="loading-spinner">Cargando donaciones...</div>
              ) : (
                (() => {
                  const visibles = Array.isArray(donaciones) ? donaciones : [];
                  if (visibles.length === 0) {
                    return <p>No tienes donaciones activas.</p>;
                  }
                  return (
                    <div className={`donations-grid list`}>
                      {visibles.map((donacion) => {
                        const id = donacion._id || donacion.id;
                        const donor = donacion.donor || {};
                        const donorName =
                          `${userData.nombre || donor.nombre || ""} ${
                            userData.apellido || donor.apellido || ""
                          }`.trim() ||
                          donor.name ||
                          "Yo";
                        const ownerId =
                          userData.id || donor._id || donor.id || null;
                        const location =
                          userData.zona ||
                          userData.provincia ||
                          donor.ubicacion ||
                          donor.provincia ||
                          donor.location ||
                          donacion.location ||
                          "Tucumán";

                        return (
                          <div key={id} className={`donation-item list`}>
                            {donacion.status === "delivered" && (
                              <span
                                className="donacion-entregada-indicador"
                                style={{
                                  display: "inline-block",
                                  background:
                                    "linear-gradient(90deg,#38a169,#a0e9a0)",
                                  color: "#fff",
                                  fontWeight: "bold",
                                  borderRadius: "8px",
                                  padding: "4px 12px",
                                  marginBottom: "6px",
                                  fontSize: "0.95rem",
                                  boxShadow: "0 2px 8px rgba(56,161,105,0.12)",
                                }}
                              >
                                Entregada
                              </span>
                            )}
                            <DonationCard
                              title={donacion.title || donacion.itemName}
                              description={donacion.description}
                              category={donacion.category || donacion.categoria}
                              location={location}
                              condition={donacion.condition}
                              images={donacion.images}
                              status={donacion.status}
                              createdAt={donacion.createdAt}
                              donorName={donorName}
                              ownerId={ownerId}
                              viewMode={"list"}
                              donationId={id}
                              onEdit={
                                donacion.status === "delivered"
                                  ? undefined
                                  : () => navigate(`/donation-edit/${id}`)
                              }
                              onDelete={
                                donacion.status === "delivered"
                                  ? async () => {
                                      const donationId =
                                        donacion._id || donacion.id;
                                      if (!donationId) {
                                        console.error(
                                          "No se pudo resolver el ID de la donación a eliminar:",
                                          donacion
                                        );
                                        alert(
                                          "No se pudo eliminar: no se encontró el ID de la donación."
                                        );
                                        return;
                                      }
                                      try {
                                        const res = await fetch(
                                          `${API_URL}/donations/${donationId}`,
                                          {
                                            method: "DELETE",
                                            headers: {
                                              Authorization: `Bearer ${
                                                localStorage.getItem("token") ||
                                                ""
                                              }`,
                                              "Content-Type":
                                                "application/json",
                                            },
                                          }
                                        );
                                        if (!res.ok)
                                          throw new Error(`HTTP ${res.status}`);
                                        setDonaciones((prev) =>
                                          prev.filter(
                                            (d) =>
                                              (d._id || d.id) !== donationId
                                          )
                                        );
                                        window.dispatchEvent(
                                          new CustomEvent("donationsUpdated", {
                                            detail: {
                                              id: donationId,
                                              action: "deleted",
                                            },
                                          })
                                        );
                                        // Opcional: recargar donaciones
                                        try {
                                          loadDonaciones && loadDonaciones();
                                        } catch {}
                                      } catch (err) {
                                        console.error(
                                          "Error al eliminar donación:",
                                          err
                                        );
                                        alert("Error al eliminar la donación");
                                      }
                                    }
                                  : undefined
                              }
                              onMarkDelivered={() =>
                                handleMarkDonationDelivered(donacion)
                              }
                            />
                          </div>
                        );
                      })}
                    </div>
                  );
                })()
              )}
            </div>
          )}

          {activeTab === "articulos" && (
            <div className="mis-articulos" ref={articulosSectionRef}>
              <h2>Mis Artículos</h2>
              <button
                className="btn-publicar"
                onClick={() => navigate("/publicarproducto")}
                style={{ marginBottom: "1rem" }}
              >
                + Publicar Nuevo Producto
              </button>
              {/* Filtrar productos válidos antes de mapear */}
              {(() => {
                const productosValidos = userListings.filter(
                  (p) => typeof p._id === "string" && p._id.length === 24
                );
                return productosValidos.length === 0 ? (
                  <p>No has publicado ningún artículo aún.</p>
                ) : (
                  <div className="articulos-grid">
                    {productosValidos.map((producto) => {
                      const normalized = {
                        id: producto.id || producto._id,
                        _id: producto._id || producto.id,
                        title:
                          producto.title ||
                          producto.titulo ||
                          producto.nombre ||
                          "Sin título",
                        description:
                          producto.description ||
                          producto.descripcion ||
                          producto.detalle ||
                          "Sin descripción",
                        categoria:
                          producto.categoria || producto.category || "General",
                        ownerName:
                          `${userData.nombre || ""} ${
                            userData.apellido || ""
                          }`.trim() ||
                          userData.username ||
                          "Usuario",
                        ownerId: userData.id || userData._id,
                        images: Array.isArray(producto.images)
                          ? producto.images
                          : producto.image
                          ? [producto.image]
                          : [],
                        image:
                          producto.image ||
                          (Array.isArray(producto.images) &&
                          producto.images.length > 0
                            ? producto.images[0]
                            : ""),
                        fechaPublicacion:
                          producto.fechaPublicacion ||
                          producto.createdAt ||
                          producto.fecha ||
                          null,
                        provincia:
                          userData.zona ||
                          userData.provincia ||
                          producto.provincia ||
                          producto.zona ||
                          "Tucumán",
                        zona:
                          userData.zona ||
                          userData.provincia ||
                          producto.zona ||
                          producto.provincia ||
                          "Tucumán",
                        estado: producto.intercambiado
                          ? "intercambiado"
                          : "activo",
                        ...producto,
                      };
                      return (
                        <ArticuloCard
                          key={normalized.id || normalized._id}
                          producto={normalized}
                          onEdit={handleEditarProducto}
                        />
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          {activeTab === "transacciones" && (
            <div className="mis-transacciones" ref={transaccionesSectionRef}>
              <h2>Mis Intercambios</h2>
              {(() => {
                // Construir lista combinada: intercambios reales + donaciones entregadas.
                // 1) Intercambios reales del usuario (excluir soft-deleted y transacciones de donación para evitar duplicidad)
                const all = Array.isArray(userData.transacciones)
                  ? userData.transacciones
                  : [];
                const notDeleted = all.filter((t) => !t?.deleted);
                const exchanges = notDeleted
                  .filter((t) => {
                    const tipo = (t?.tipo ?? t?.type ?? "")
                      .toString()
                      .toLowerCase();
                    const hasProduct = !!(
                      t?.productoOfrecidoId ||
                      t?.productoSolicitadoId ||
                      t?.productoOfrecido ||
                      t?.productoSolicitado
                    );
                    const isDonationish =
                      tipo === "donacion" ||
                      tipo === "donación" ||
                      tipo === "donation" ||
                      t?.isDonation === true;
                    if (isDonationish) return false; // excluir para no duplicar con donaciones reales
                    return hasProduct;
                  })
                  .map((t) => ({ __kind: "exchange", ...t }));

                // 2) Donaciones entregadas del estado de donaciones (fuente de verdad) + dedupe
                const donationsArray = Array.isArray(donaciones)
                  ? donaciones
                  : [];
                // Diagnóstico rápido de estados
                try {
                  const distinctStatuses = Array.from(
                    new Set(
                      donationsArray.map((x) => (x.status ?? "").toString())
                    )
                  );
                  console.log(
                    "[Donaciones] estados distintos:",
                    distinctStatuses
                  );
                } catch {}
                const deliveredDonationsRaw = donationsArray.filter((d) => {
                  const st = (d.status || d.estado || d.state || "")
                    .toString()
                    .toLowerCase();
                  const isDeliveredFlag =
                    d.delivered === true ||
                    d.isDelivered === true ||
                    d.status === true ||
                    d.estado === true ||
                    d.state === true;
                  const hasDeliveryDate = !!d.deliveryDate;
                  return (
                    hasDeliveryDate ||
                    isDeliveredFlag ||
                    st === "delivered" ||
                    st === "entregado" ||
                    st === "entregada" ||
                    st === "entrega" ||
                    st === "hecho" ||
                    st === "completado" ||
                    st === "completed" ||
                    st === "finalizado" ||
                    st === "cerrado"
                  );
                });
                // Dedupe por ID únicamente (más robusto). Si no hay id, no deduplicar aquí.
                const seenDonIds = new Set();
                const deliveredDonations = deliveredDonationsRaw
                  .map((d) => ({
                    __kind: "donation",
                    fecha: d.deliveryDate || d.updatedAt || d.createdAt,
                    title: d.title || d.itemName || "Donación",
                    raw: d,
                  }))
                  .filter((item) => {
                    const rid = item.raw?._id || item.raw?.id;
                    if (!rid) return true;
                    if (seenDonIds.has(rid)) return false;
                    seenDonIds.add(rid);
                    return true;
                  });

                // Debug en consola para diagnóstico
                try {
                  console.log(
                    "[Intercambios] transacciones totales:",
                    all.length,
                    "sin eliminados:",
                    notDeleted.length,
                    "exchanges:",
                    exchanges.length,
                    "donaciones entregadas:",
                    deliveredDonations.length
                  );
                } catch {}

                const getDate = (x) =>
                  new Date(
                    x.__kind === "donation"
                      ? x.fecha ||
                        x.raw?.deliveryDate ||
                        x.raw?.updatedAt ||
                        x.raw?.createdAt
                      : x.fecha || x.date || x.updatedAt || x.createdAt || 0
                  ).getTime();
                // 3) Combinar y deduplicar de forma conservadora:
                //    - Donaciones: dedupe por id estable
                //    - Intercambios: dedupe SOLO si tienen _id/id; si no, mantener todos
                const stabilityRank = (x) => {
                  if (x.__kind === "donation") return 2; // donations unaffected
                  const hasStable = !!(
                    x._id ||
                    (typeof x.id === "string" &&
                      !x.id.startsWith("temp-") &&
                      x.id.length > 10)
                  );
                  return hasStable ? 1 : 0;
                };
                const combinedRaw = [...exchanges]
                  // Estabilizar: primero los elementos con id estable, luego por fecha desc
                  .sort((a, b) => {
                    const sr = stabilityRank(b) - stabilityRank(a);
                    if (sr !== 0) return sr;
                    return getDate(b) - getDate(a);
                  });
                const seenDon = new Set();
                const seenExIds = new Set();
                const seenByProduct = new Map(); // productoOfrecidoId -> kept key
                const combined = combinedRaw.filter((x) => {
                  if (x.__kind === "donation") {
                    const dkey = `don|${x.raw?._id || x.raw?.id || ""}`;
                    if (seenDon.has(dkey)) return false;
                    seenDon.add(dkey);
                    return true;
                  }
                  const exId = x._id || x.id;
                  if (exId) {
                    const k = `exid|${exId}`;
                    if (seenExIds.has(k)) return false;
                    seenExIds.add(k);
                  }
                  // Filtro extra: si comparten el mismo productoOfrecidoId, mantener el que tenga _id (estable) y descartar el temporal
                  const pid = x.productoOfrecidoId || x.productoId || null;
                  if (pid) {
                    const prevKey = seenByProduct.get(pid);
                    const hasStable = !!(
                      x._id ||
                      (typeof x.id === "string" &&
                        !x.id.startsWith("temp-") &&
                        x.id.length > 10)
                    );
                    if (!prevKey) {
                      seenByProduct.set(pid, hasStable ? "stable" : "temp");
                      return true;
                    }
                    // Si ya vimos uno para este producto, preferimos el estable
                    if (prevKey === "stable") {
                      // Ya hay estable, descartar este
                      return false;
                    }
                    // Si el previo era temp y este es estable, reemplazar: permitir este y marcar como estable, pero necesitamos
                    // filtrar el anterior. Como no reordenamos aquí, estrategia: permitir este y dejar que la key por id evite duplicado visual
                    // y además retornamos true y registramos estable; la anterior temp quedará en el array pero no deducible aquí.
                    // Para minimizar, si es estable y previo temp, marcamos estable y permitimos; la temp seguirá pero será distinta id.
                    seenByProduct.set(pid, hasStable ? "stable" : "temp");
                    return true;
                  }
                  // Si no hay id ni productoOfrecidoId, no deduplicar
                  return true;
                });

                if (combined.length === 0) {
                  return <p>No tienes intercambios aún.</p>;
                }

                return (
                  <div className="transacciones-grid">
                    {combined.map((item, idx) => {
                      if (item.__kind === "donation") {
                        // Renderizar donación como tarjeta en el historial de intercambios
                        return (
                          <div
                            className="reveal-hidden reveal-stagger-1"
                            key={`don-${
                              (item.raw && (item.raw._id || item.raw.id)) ||
                              `idx-${idx}`
                            }`}
                          >
                            <TransactionCard
                              transaccion={{
                                productoOfrecido: item.title,
                                estado: "completado",
                                fecha: item.fecha,
                              }}
                              currentUserId={userData.id}
                              isDonation={true}
                              deliveryDate={item.fecha}
                              onDelete={() => {
                                const raw = item.raw || {};
                                const did = raw._id || raw.id;
                                setDonationToDelete({
                                  id: did,
                                  title:
                                    raw.title ||
                                    raw.itemName ||
                                    item.title ||
                                    "Donación",
                                });
                                setShowConfirmDeleteDonation(true);
                              }}
                            />

                            {/* Modal de confirmación para eliminar un mensaje */}
                            <ConfirmModal
                              isOpen={showConfirmMessageDelete}
                              onCancel={() => {
                                setShowConfirmMessageDelete(false);
                                setMessageToDelete(null);
                              }}
                              onConfirm={async () => {
                                try {
                                  await handleDeleteMessage();
                                } finally {
                                  setShowConfirmMessageDelete(false);
                                  setMessageToDelete(null);
                                }
                              }}
                              title="Eliminar mensaje"
                              message="¿Seguro que deseas eliminar este mensaje?"
                            />
                          </div>
                        );
                      }
                      // Intercambio normal
                      return (
                        <div
                          className="reveal-hidden reveal-stagger-1"
                          key={`ex-${item._id || item.id || `idx-${idx}`}`}
                        >
                          <TransactionCard
                            transaccion={item}
                            currentUserId={userData.id}
                            onDelete={() => {
                              setTransToDelete({ ...item, idx });
                              setShowConfirmDeleteTrans(true);
                            }}
                            onRate={(ratingData) => {
                              setRatingTarget(ratingData);
                              setShowRatingModal(true);
                            }}
                            onRepublish={handleRepublish}
                            onConfirm={handleConfirmExchange}
                          />
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
              {/* Modal de confirmación para eliminar transacción */}
              <ConfirmModal
                isOpen={showConfirmDeleteTrans}
                onCancel={() => {
                  setShowConfirmDeleteTrans(false);
                  setTransToDelete(null);
                }}
                onConfirm={async () => {
                  if (!transToDelete) return;
                  try {
                    // Actualización optimista: remover de la UI inmediatamente
                    const prevTrans = Array.isArray(userData?.transacciones)
                      ? userData.transacciones
                      : [];
                    const transIdOptim =
                      transToDelete._id || transToDelete.id || null;
                    const filteredOptim = prevTrans.filter((t) => {
                      const idKey = t && (t._id || t.id);
                      if (idKey && transIdOptim) return idKey !== transIdOptim;
                      return !(
                        t.fecha === transToDelete.fecha &&
                        t.productoOfrecido === transToDelete.productoOfrecido
                      );
                    });
                    setUserData((prev) => ({
                      ...prev,
                      transacciones: filteredOptim,
                    }));
                    try {
                      window.dispatchEvent(
                        new CustomEvent("userProfileUpdated", {
                          detail: { id: userData?.id || userData?._id },
                        })
                      );
                    } catch {}

                    // Obtener usuario actual al inicio
                    const usuarioActual = JSON.parse(
                      localStorage.getItem("usuarioActual")
                    );

                    // Siempre usar _id de MongoDB para la eliminación
                    let backendEliminado = false;
                    const transId = transToDelete._id;
                    if (transId) {
                      const res = await fetch(
                        `${API_URL}/transactions/${transId}`,
                        { method: "DELETE" }
                      );
                      if (res.ok) backendEliminado = true;
                    }

                    // Opción A: no eliminar productos asociados al borrar un intercambio
                    // Mantener el inventario del usuario intacto; solo se elimina el registro de intercambio

                    // Si no hubo _id o la eliminación directa falló, marcar la transacción como deleted en el usuario
                    if (usuarioActual && usuarioActual.id) {
                      if (!backendEliminado) {
                        const nuevas = (usuarioActual.transacciones || []).map(
                          (t) => {
                            if (
                              (t._id && t._id === transId) ||
                              (!t._id &&
                                t.fecha === transToDelete.fecha &&
                                t.productoOfrecido ===
                                  transToDelete.productoOfrecido)
                            ) {
                              return { ...t, deleted: true };
                            }
                            return t;
                          }
                        );
                        await fetch(`${API_URL}/users/${usuarioActual.id}`, {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ transacciones: nuevas }),
                        });
                      }
                      // Obtener datos frescos y actualizar estado
                      const resUser = await fetch(
                        `${API_URL}/users/${usuarioActual.id}`
                      );
                      if (resUser.ok) {
                        const userBD = await resUser.json();
                        // Estado autoritativo: usar SOLO lo del servidor y filtrar la transacción eliminada
                        const serverTrans = Array.isArray(userBD?.transacciones)
                          ? userBD.transacciones
                          : [];
                        const removedId = transId;
                        const serverFiltered = serverTrans.filter((t) => {
                          const idKey = t && (t._id || t.id);
                          if (idKey && removedId) return idKey !== removedId;
                          return !(
                            t.fecha === transToDelete.fecha &&
                            t.productoOfrecido ===
                              transToDelete.productoOfrecido
                          );
                        });
                        const nextUser = {
                          ...userBD,
                          transacciones: serverFiltered,
                        };
                        setUserData(nextUser);
                        localStorage.setItem(
                          "usuarioActual",
                          JSON.stringify(nextUser)
                        );
                      }
                    }

                    // Mostrar toast de confirmación
                    const toast = document.createElement("div");
                    toast.textContent =
                      "Registro de intercambio eliminado exitosamente";
                    toast.style.cssText = `
                      position: fixed;
                      top: 20px;
                      right: 20px;
                      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                      color: white;
                      padding: 12px 20px;
                      border-radius: 8px;
                      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
                      z-index: 10000;
                      font-weight: 600;
                      font-size: 14px;
                      animation: slideInRight 0.3s ease-out;
                    `;
                    document.body.appendChild(toast);
                    setTimeout(() => {
                      if (toast.parentNode) {
                        toast.style.animation = "slideOutRight 0.3s ease-out";
                        setTimeout(() => {
                          if (toast.parentNode)
                            document.body.removeChild(toast);
                        }, 300);
                      }
                    }, 3000);
                  } catch (err) {
                    console.error("❌ Error al eliminar transacción:", err);
                    // Rollback de la optimista si algo falla
                    try {
                      const prevTrans = Array.isArray(userData?.transacciones)
                        ? userData.transacciones
                        : [];
                      // Nota: si ya se fusionó con servidor puede no ser exacto; aceptable para recuperar el item visible
                      setUserData((prev) => ({
                        ...prev,
                        transacciones: prevTrans,
                      }));
                    } catch {}
                    // Toast de error
                    const errorToast = document.createElement("div");
                    errorToast.textContent = "Error al eliminar el registro";
                    errorToast.style.cssText = `
                      position: fixed;
                      top: 20px;
                      right: 20px;
                      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                      color: white;
                      padding: 12px 20px;
                      border-radius: 8px;
                      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
                      z-index: 10000;
                      font-weight: 600;
                      font-size: 14px;
                    `;
                    document.body.appendChild(errorToast);
                    setTimeout(() => {
                      if (errorToast.parentNode)
                        document.body.removeChild(errorToast);
                    }, 3000);
                  } finally {
                    setShowConfirmDeleteTrans(false);
                    setTransToDelete(null);
                  }
                }}
                title="Eliminar registro de intercambio"
                message="¿Estás seguro que deseas eliminar este registro de intercambio? Esta acción no se puede deshacer."
              />
              {/* Modal de confirmación para eliminar donación */}
              <ConfirmModal
                isOpen={showConfirmDeleteDonation}
                onCancel={() => {
                  setShowConfirmDeleteDonation(false);
                  setDonationToDelete(null);
                }}
                onConfirm={async () => {
                  const donationId =
                    donationToDelete?._id || donationToDelete?.id;
                  if (!donationId) {
                    console.error(
                      "No se pudo resolver el ID de la donación a eliminar:",
                      donationToDelete
                    );
                    alert(
                      "No se pudo eliminar: no se encontró el ID de la donación. Intenta nuevamente desde Mis Donaciones."
                    );
                    return;
                  }
                  try {
                    // Eliminar donación en backend
                    const res = await fetch(
                      `${API_URL}/donations/${donationId}`,
                      {
                        method: "DELETE",
                        headers: {
                          Authorization: `Bearer ${
                            localStorage.getItem("token") || ""
                          }`,
                          "Content-Type": "application/json",
                        },
                      }
                    );
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);

                    // Actualizar estado local (remover de donaciones)
                    setDonaciones((prev) =>
                      prev.filter((d) => (d._id || d.id) !== donationId)
                    );
                    // Emitir evento global
                    window.dispatchEvent(
                      new CustomEvent("donationsUpdated", {
                        detail: { id: donationId, action: "deleted" },
                      })
                    );
                    // Recargar donaciones para asegurar estado consistente
                    try {
                      loadDonaciones && loadDonaciones();
                    } catch {}

                    // Además, limpiar posibles registros relacionados en transacciones (tipo donación) para que no reaparezcan en "Mis Intercambios"
                    try {
                      const usuarioActual = JSON.parse(
                        localStorage.getItem("usuarioActual")
                      );
                      if (usuarioActual?.id) {
                        // 1) Traer transacciones del servidor
                        const resUser = await fetch(
                          `${API_URL}/users/${usuarioActual.id}`
                        );
                        const userBD = resUser.ok ? await resUser.json() : {};
                        const serverTrans = Array.isArray(userBD?.transacciones)
                          ? userBD.transacciones
                          : [];
                        // 2) Tomar transacciones locales vigentes (UI)
                        const localTrans = Array.isArray(
                          usuarioActual.transacciones
                        )
                          ? usuarioActual.transacciones
                          : [];
                        // 3) Merge conservador: deduplicar SOLO por _id/id; mantener todo lo que no tenga ID
                        const byId = new Map();
                        const mergedTrans = [];
                        // Priorizar servidor para IDs; luego completar con locales faltantes
                        serverTrans.forEach((t) => {
                          const idKey = t && (t._id || t.id);
                          if (idKey) {
                            byId.set(idKey, t);
                          } else {
                            mergedTrans.push(t);
                          }
                        });
                        localTrans.forEach((t) => {
                          const idKey = t && (t._id || t.id);
                          if (idKey) {
                            if (!byId.has(idKey)) byId.set(idKey, t);
                          } else {
                            // Mantener entradas sin ID también del lado local
                            mergedTrans.push(t);
                          }
                        });
                        // Añadir todas las con ID
                        mergedTrans.push(...byId.values());
                        // 4) Filtrar SOLO donaciones que referencien EXACTAMENTE el donationId borrado
                        const beforeNonDon = mergedTrans.filter((t) => {
                          const tipo = (t.tipo || t.type || "")
                            .toString()
                            .toLowerCase();
                          return !(tipo === "donacion" || tipo === "donación");
                        });
                        const filtered = mergedTrans.filter((t) => {
                          const tipo = (t.tipo || t.type || "")
                            .toString()
                            .toLowerCase();
                          if (tipo === "donacion" || tipo === "donación") {
                            const donationRef =
                              t.donationId ||
                              t.productoOfrecidoId ||
                              t.productId ||
                              t.productoId;
                            return !(donationRef && donationRef === donationId);
                          }
                          return true;
                        });
                        const afterNonDon = filtered.filter((t) => {
                          const tipo = (t.tipo || t.type || "")
                            .toString()
                            .toLowerCase();
                          return !(tipo === "donacion" || tipo === "donación");
                        });
                        // Diagnóstico y guardas
                        try {
                          const removed = mergedTrans.filter(
                            (x) => !filtered.includes(x)
                          );
                          console.log("[DEL-DON] donationId:", donationId);
                          console.log(
                            "[DEL-DON] mergedTrans (len):",
                            mergedTrans.length
                          );
                          console.log(
                            "[DEL-DON] filtered (len):",
                            filtered.length
                          );
                          console.log(
                            "[DEL-DON] non-donation before/after:",
                            beforeNonDon.length,
                            afterNonDon.length
                          );
                          if (removed.length)
                            console.table(
                              removed.map((t) => ({
                                tipo: (t.tipo || t.type || "").toLowerCase(),
                                _id: t._id,
                                id: t.id,
                                donationId: t.donationId,
                                prodOfrecidoId: t.productoOfrecidoId,
                                productId: t.productId,
                                productoId: t.productoId,
                                titulo:
                                  t.titulo || t.title || t.productoOfrecido,
                                fecha: t.fecha || t.createdAt,
                              }))
                            );
                        } catch {}
                        // Seguridad: nunca reducir intercambios no-donación
                        if (afterNonDon.length < beforeNonDon.length) {
                          console.error(
                            "🚫 Abortando persistencia: se detectó reducción de intercambios no-donación."
                          );
                        } else {
                          // 5) Persistir lista filtrada sin perder intercambios locales
                          const putRes = await fetch(
                            `${API_URL}/users/${usuarioActual.id}`,
                            {
                              method: "PUT",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ transacciones: filtered }),
                            }
                          );
                          if (putRes.ok) {
                            const nextUser = {
                              ...userBD,
                              ...usuarioActual,
                              transacciones: filtered,
                            };
                            setUserData((prev) => ({ ...prev, ...nextUser }));
                            localStorage.setItem(
                              "usuarioActual",
                              JSON.stringify(nextUser)
                            );
                            window.dispatchEvent(
                              new CustomEvent("userProfileUpdated", {
                                detail: { id: usuarioActual.id },
                              })
                            );
                          }
                        }
                      }
                    } catch {}

                    // Toast éxito
                    const toast = document.createElement("div");
                    toast.textContent = "Donación eliminada exitosamente";
                    toast.style.cssText = `
                      position: fixed;
                      top: 20px;
                      right: 20px;
                      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                      color: white;
                      padding: 12px 20px;
                      border-radius: 8px;
                      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
                      z-index: 10000;
                      font-weight: 600;
                      font-size: 14px;
                      animation: slideInRight 0.3s ease-out;
                    `;
                    document.body.appendChild(toast);
                    setTimeout(() => {
                      if (toast.parentNode) {
                        toast.style.animation = "slideOutRight 0.3s ease-out";
                        setTimeout(() => {
                          if (toast.parentNode)
                            document.body.removeChild(toast);
                        }, 300);
                      }
                    }, 3000);
                    // Cerrar modal y limpiar selección
                    setShowConfirmDeleteDonation(false);
                    setDonationToDelete(null);
                  } catch (err) {
                    console.error("❌ Error al eliminar donación:", err);
                    const errorToast = document.createElement("div");
                    errorToast.textContent = "Error al eliminar la donación";
                    errorToast.style.cssText = `
                      position: fixed;
                      top: 20px;
                      right: 20px;
                      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                      color: white;
                      padding: 12px 20px;
                      border-radius: 8px;
                      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
                      z-index: 10000;
                      font-weight: 600;
                      font-size: 14px;
                    `;
                    document.body.appendChild(errorToast);
                    setTimeout(() => {
                      if (errorToast.parentNode)
                        document.body.removeChild(errorToast);
                    }, 3000);
                    // Asegurar cierre del modal aunque falle
                    setShowConfirmDeleteDonation(false);
                    setDonationToDelete(null);
                  }
                }}
                title="Eliminar donación"
                message={`¿Estás seguro que deseas eliminar la donación "${
                  donationToDelete?.title || ""
                }"? Esta acción no se puede deshacer.`}
              />
              {/* Modal de confirmación para eliminar chat */}
              <ConfirmModal
                isOpen={showConfirmChatDelete}
                onCancel={() => {
                  setShowConfirmChatDelete(false);
                  setChatToDelete(null);
                }}
                onConfirm={async () => {
                  try {
                    const chatKey = chatToDelete;
                    if (!chatKey) return;
                    const mensajesChat = chats[chatKey] || [];
                    const ids = mensajesChat
                      .map((m) => m._id || m.id)
                      .filter(Boolean);
                    await Promise.all(
                      ids.map(async (id) => {
                        try {
                          await fetch(`${API_URL}/messages/${id}`, {
                            method: "DELETE",
                          });
                        } catch {}
                      })
                    );
                    setChats((prev) => {
                      const next = { ...prev };
                      delete next[chatKey];
                      // Si era el seleccionado, elegir otro
                      if (chatSeleccionado === chatKey) {
                        const remaining = Object.keys(next);
                        setChatSeleccionado(remaining[0] || null);
                      }
                      return next;
                    });
                    setUnreadByChat((prev) => {
                      const n = { ...prev };
                      delete n[chatKey];
                      return n;
                    });
                  } finally {
                    setShowConfirmChatDelete(false);
                    setChatToDelete(null);
                  }
                }}
                title="Eliminar chat"
                message="¿Seguro que deseas eliminar este chat y todos sus mensajes?"
              />
            </div>
          )}

          {activeTab === "mensajes" && (
            <div className="mis-mensajes" ref={mensajesSectionRef}>
              <h2>Mensajes</h2>
              {Object.keys(chats).length === 0 && mensajes.length === 0 ? (
                <p>No tienes mensajes nuevos.</p>
              ) : Object.keys(chats).length === 0 && mensajes.length > 0 ? (
                <p>Cargando mensajes...</p>
              ) : (
                <div
                  className="chat-layout"
                  style={{ display: "flex", gap: "1rem" }}
                >
                  {/* lista de chats */}
                  <div
                    className="chat-list"
                    style={{ width: "220px", borderRight: "1px solid #ddd" }}
                  >
                    {Object.keys(chats).map((key) => {
                      const mensajesChat = chats[key];
                      const ultimoMensaje =
                        mensajesChat[mensajesChat.length - 1];
                      const usuarioActual = JSON.parse(
                        localStorage.getItem("usuarioActual")
                      );

                      // Nombre del otro usuario
                      let otherUserName = "";
                      if (ultimoMensaje) {
                        if (ultimoMensaje.deId === usuarioActual.id) {
                          otherUserName =
                            ultimoMensaje.paraNombre || otherUserName;
                        } else {
                          otherUserName =
                            ultimoMensaje.deNombre || otherUserName;
                        }
                        if (!otherUserName) {
                          otherUserName =
                            ultimoMensaje.deId === usuarioActual.id
                              ? ultimoMensaje.paraNombre ||
                                ultimoMensaje.para ||
                                "Usuario"
                              : ultimoMensaje.deNombre ||
                                ultimoMensaje.de ||
                                "Usuario";
                        }
                      }

                      // Preview de texto
                      const textoUltimo = ultimoMensaje
                        ? ultimoMensaje.descripcion || ultimoMensaje.texto || ""
                        : "";
                      const preview =
                        typeof textoUltimo === "string"
                          ? textoUltimo.length > 60
                            ? textoUltimo.slice(0, 60) + "…"
                            : textoUltimo
                          : "";
                      const noLeidos = unreadByChat[key] > 0;

                      return (
                        <div
                          key={key}
                          onClick={() => {
                            setChatSeleccionado(key);
                            const usuario = JSON.parse(
                              localStorage.getItem("usuarioActual")
                            );
                            if (usuario) {
                              fetch(
                                `${API_URL}/messages/mark-read/${usuario.id}`,
                                { method: "PUT" }
                              )
                                .then(() => {
                                  if (window.refreshUnread)
                                    window.refreshUnread();
                                })
                                .catch(() => {});
                            }
                          }}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            setChatToDelete(key);
                            const menuW = 200;
                            const menuH = 160;
                            let x = e.clientX;
                            let y = e.clientY;
                            if (x + menuW > window.innerWidth)
                              x = Math.max(8, window.innerWidth - menuW - 8);
                            if (y + menuH > window.innerHeight)
                              y = Math.max(8, window.innerHeight - menuH - 8);
                            setChatListMenu({ visible: true, x, y, key });
                          }}
                          style={{
                            padding: "0.7rem 0.8rem",
                            cursor: "pointer",
                            background:
                              chatSeleccionado === key
                                ? "#e9ecef"
                                : "transparent",
                            borderBottom: "1px solid #f1f1f1",
                            fontWeight: noLeidos ? "bold" : "normal",
                            position: "relative",
                            transition: "background 0.2s",
                            minHeight: 54,
                          }}
                          className={
                            chatSeleccionado === key
                              ? "chat-list-item selected"
                              : "chat-list-item"
                          }
                        >
                          <div className="chat-row">
                            {(() => {
                              let avatarUrl = "";
                              let iniciales = "";
                              if (ultimoMensaje) {
                                if (ultimoMensaje.deId === usuarioActual.id) {
                                  avatarUrl = ultimoMensaje.paraImagen
                                    ? normalizeImageUrl(
                                        ultimoMensaje.paraImagen
                                      )
                                    : "";
                                  iniciales = (
                                    ultimoMensaje.paraNombre ||
                                    ultimoMensaje.para ||
                                    "U"
                                  )
                                    .substring(0, 2)
                                    .toUpperCase();
                                } else {
                                  avatarUrl = ultimoMensaje.deImagen
                                    ? normalizeImageUrl(ultimoMensaje.deImagen)
                                    : "";
                                  iniciales = (
                                    ultimoMensaje.deNombre ||
                                    ultimoMensaje.de ||
                                    "U"
                                  )
                                    .substring(0, 2)
                                    .toUpperCase();
                                }
                              }
                              return avatarUrl ? (
                                <img
                                  className="chat-avatar"
                                  src={avatarUrl}
                                  alt="avatar"
                                  onError={(e) => {
                                    const fallbackDiv =
                                      document.createElement("div");
                                    fallbackDiv.className = "chat-avatar";
                                    fallbackDiv.style.cssText = `
                                      display: flex; align-items: center; justify-content: center;
                                      background: linear-gradient(135deg, #b0e0ff 0%, #92d1fa 100%);
                                      color: #2d9cdb; font-size: 14px; font-weight: bold;
                                      width: ${
                                        e.target.width || 40
                                      }px; height: ${
                                      e.target.height || 40
                                    }px; border-radius: 50%;`;
                                    fallbackDiv.textContent = iniciales;
                                    e.target.parentNode.replaceChild(
                                      fallbackDiv,
                                      e.target
                                    );
                                  }}
                                />
                              ) : (
                                <div
                                  className="chat-avatar"
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    background:
                                      "linear-gradient(135deg, #b0e0ff 0%, #92d1fa 100%)",
                                    color: "#2d9cdb",
                                    fontSize: "14px",
                                    fontWeight: "bold",
                                  }}
                                >
                                  {iniciales}
                                </div>
                              );
                            })()}
                            <div className="chat-name">{otherUserName}</div>
                            {noLeidos && (
                              <span className="chat-badge">
                                {unreadByChat[key]}
                              </span>
                            )}
                          </div>
                          <div className="chat-preview">{preview}</div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Portal global del menú contextual de la lista de chats */}
                  {chatListMenu.visible &&
                    ReactDOM.createPortal(
                      <div
                        ref={chatListMenuRef}
                        style={{
                          position: "fixed",
                          top: chatListMenu.y,
                          left: chatListMenu.x,
                          zIndex: 10000,
                          background: "#fff",
                          border: "1px solid #eee",
                          borderRadius: 10,
                          boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
                          padding: 0,
                          minWidth: 180,
                          display: "flex",
                          flexDirection: "column",
                        }}
                      >
                        <div
                          style={{
                            padding: "13px 22px",
                            cursor: "pointer",
                            color: "#1976d2",
                            fontWeight: 600,
                            fontSize: 15,
                            outline: "none",
                            border: "none",
                            background: "none",
                            textAlign: "left",
                          }}
                          onClick={() => {
                            try {
                              const usuarioActual = JSON.parse(
                                localStorage.getItem("usuarioActual")
                              );
                              const mensajesDelChat =
                                chats[chatListMenu.key] || [];
                              const base = mensajesDelChat[0] || null;
                              if (usuarioActual && base) {
                                const otherId =
                                  base.deId === usuarioActual.id
                                    ? base.paraId
                                    : base.deId;
                                if (otherId)
                                  window.open(`/perfil/${otherId}`, "_blank");
                              }
                            } catch {}
                            setChatListMenu((p) => ({ ...p, visible: false }));
                          }}
                        >
                          Ver perfil
                        </div>
                        <div
                          style={{
                            height: 1,
                            background: "#eee",
                            margin: "0 12px",
                          }}
                        />
                        <div
                          style={{
                            padding: "13px 22px",
                            cursor: "pointer",
                            color: "#e65100",
                            fontWeight: 600,
                            fontSize: 15,
                            outline: "none",
                            border: "none",
                            background: "none",
                            textAlign: "left",
                          }}
                          onClick={() => {
                            const toast = document.createElement("div");
                            toast.textContent =
                              "Reporte enviado. Nuestro equipo revisará el chat.";
                            toast.style.cssText = `
                              position: fixed;
                              top: 20px;
                              right: 20px;
                              background: linear-gradient(135deg, #ff8a65 0%, #ff7043 100%);
                              color: white;
                              padding: 10px 16px;
                              border-radius: 8px;
                              box-shadow: 0 4px 12px rgba(255, 112, 67, 0.3);
                              z-index: 10000;
                              font-weight: 700;
                              font-size: 13px;
                            `;
                            document.body.appendChild(toast);
                            setTimeout(() => {
                              if (toast.parentNode)
                                document.body.removeChild(toast);
                            }, 2200);
                            setChatListMenu((p) => ({ ...p, visible: false }));
                          }}
                        >
                          Reportar
                        </div>
                        <div
                          style={{
                            height: 1,
                            background: "#eee",
                            margin: "0 12px",
                          }}
                        />
                        <div
                          style={{
                            padding: "13px 22px",
                            cursor: "pointer",
                            color: "#dc3545",
                            fontWeight: 600,
                            fontSize: 15,
                            outline: "none",
                            border: "none",
                            background: "none",
                            textAlign: "left",
                          }}
                          onClick={() => {
                            setChatToDelete(chatListMenu.key);
                            setShowConfirmChatDelete(true);
                            setChatListMenu((p) => ({ ...p, visible: false }));
                          }}
                        >
                          Eliminar chat
                        </div>
                      </div>,
                      document.body
                    )}

                  {/* Modal de confirmación para eliminar chat (visible en pestaña Mensajes) */}
                  <ConfirmModal
                    isOpen={showConfirmChatDelete}
                    onCancel={() => {
                      setShowConfirmChatDelete(false);
                      setChatToDelete(null);
                    }}
                    onConfirm={async () => {
                      try {
                        const chatKey = chatToDelete;
                        if (!chatKey) return;
                        const mensajesChat = chats[chatKey] || [];
                        const ids = mensajesChat
                          .map((m) => m._id || m.id)
                          .filter(Boolean);
                        await Promise.all(
                          ids.map(async (id) => {
                            try {
                              await fetch(`${API_URL}/messages/${id}`, {
                                method: "DELETE",
                              });
                            } catch {}
                          })
                        );
                        setChats((prev) => {
                          const next = { ...prev };
                          delete next[chatKey];
                          if (chatSeleccionado === chatKey) {
                            const remaining = Object.keys(next);
                            setChatSeleccionado(remaining[0] || null);
                          }
                          return next;
                        });
                        setUnreadByChat((prev) => {
                          const n = { ...prev };
                          delete n[chatKey];
                          return n;
                        });
                      } finally {
                        setShowConfirmChatDelete(false);
                        setChatToDelete(null);
                      }
                    }}
                    title="Eliminar chat"
                    message="¿Seguro que deseas eliminar este chat y todos sus mensajes?"
                  />

                  {/* mensajes del chat seleccionado */}
                  <div
                    className="chat-messages"
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      maxHeight: "78vh",
                    }}
                  >
                    {!chatSeleccionado ||
                    !chats[chatSeleccionado] ||
                    chats[chatSeleccionado].length === 0 ? (
                      <p>Selecciona un chat</p>
                    ) : (
                      <div>
                        <div
                          className="chat-header-premium"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 16,
                            background:
                              "linear-gradient(135deg, #f7faff 0%, #e6f2fb 100%)",
                            borderRadius: 16,
                            padding: "12px 20px",
                            marginBottom: "1rem",
                            boxShadow: "0 4px 12px rgba(146, 209, 250, 0.15)",
                            border: "1px solid #b0e0ff",
                          }}
                        >
                          {/* Avatar del usuario actual (con fallback a iniciales) */}
                          {(() => {
                            const nameParts = [
                              userData?.nombre,
                              userData?.apellido,
                            ].filter(Boolean);
                            const initials = nameParts.length
                              ? nameParts
                                  .map((n) => n.trim()[0])
                                  .slice(0, 2)
                                  .join("")
                                  .toUpperCase()
                              : userData?.email
                              ? userData.email.trim()[0].toUpperCase()
                              : "U";
                            const myImg = userData?.imagen
                              ? normalizeImageUrl(userData.imagen)
                              : "";
                            return myImg ? (
                              <img
                                src={myImg}
                                alt="Tu avatar"
                                style={{
                                  width: 42,
                                  height: 42,
                                  borderRadius: "50%",
                                  border: "2px solid #92d1fa",
                                  boxShadow:
                                    "0 2px 6px rgba(146, 209, 250, 0.3)",
                                  objectFit: "cover",
                                }}
                                onError={(e) => {
                                  // Reemplazar imagen rota por un círculo con iniciales
                                  e.target.style.display = "none";
                                  const fallbackDiv =
                                    document.createElement("div");
                                  fallbackDiv.className = "chat-avatar";
                                  fallbackDiv.style.cssText = `
                                    width: 42px;
                                    height: 42px;
                                    border-radius: 50%;
                                    border: 2px solid #92d1fa;
                                    box-shadow: 0 2px 6px rgba(146, 209, 250, 0.3);
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    background: linear-gradient(135deg, #b0e0ff 0%, #92d1fa 100%);
                                    color: #2d9cdb;
                                    font-size: 14px;
                                    font-weight: bold;
                                  `;
                                  fallbackDiv.textContent = initials;
                                  e.target.parentNode.insertBefore(
                                    fallbackDiv,
                                    e.target.nextSibling
                                  );
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: 42,
                                  height: 42,
                                  borderRadius: "50%",
                                  border: "2px solid #92d1fa",
                                  boxShadow:
                                    "0 2px 6px rgba(146, 209, 250, 0.3)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  background:
                                    "linear-gradient(135deg, #b0e0ff 0%, #92d1fa 100%)",
                                  color: "#2d9cdb",
                                  fontSize: "14px",
                                  fontWeight: "bold",
                                }}
                              >
                                {initials}
                              </div>
                            );
                          })()}

                          {/* Icono de intercambio */}
                          <div
                            style={{
                              background:
                                "linear-gradient(135deg, #2d9cdb 0%, #38a3e2 100%)",
                              borderRadius: "50%",
                              width: 28,
                              height: 28,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "white",
                              fontSize: 14,
                              fontWeight: "bold",
                              boxShadow: "0 2px 6px rgba(45, 156, 219, 0.3)",
                            }}
                          >
                            ⇄
                          </div>

                          {/* Avatar del otro usuario */}
                          {(() => {
                            const mensajesChat = chats[chatSeleccionado];
                            if (!mensajesChat || mensajesChat.length === 0)
                              return null;
                            const usuarioActual = JSON.parse(
                              localStorage.getItem("usuarioActual")
                            );

                            // Buscar en todos los mensajes para encontrar la imagen del otro usuario
                            let otherUserImage = "";
                            let otherUserName = "";
                            let iniciales = "";

                            for (const mensaje of mensajesChat) {
                              if (mensaje.deId === usuarioActual.id) {
                                // El otro usuario es el destinatario
                                if (mensaje.paraImagen) {
                                  otherUserImage = normalizeImageUrl(
                                    mensaje.paraImagen
                                  );
                                }
                                if (!otherUserName && mensaje.paraNombre) {
                                  otherUserName = mensaje.paraNombre;
                                }
                              } else {
                                // El otro usuario es el remitente
                                if (mensaje.deImagen) {
                                  otherUserImage = normalizeImageUrl(
                                    mensaje.deImagen
                                  );
                                }
                                if (!otherUserName && mensaje.deNombre) {
                                  otherUserName = mensaje.deNombre;
                                }
                              }

                              // Si ya tenemos imagen y nombre, salir del loop
                              if (otherUserImage && otherUserName) break;
                            }

                            // Fallback para el nombre
                            if (!otherUserName) {
                              const ultimoMensaje =
                                mensajesChat[mensajesChat.length - 1];
                              if (ultimoMensaje.deId === usuarioActual.id) {
                                otherUserName =
                                  ultimoMensaje.paraNombre ||
                                  ultimoMensaje.para ||
                                  "Usuario";
                              } else {
                                otherUserName =
                                  ultimoMensaje.deNombre ||
                                  ultimoMensaje.de ||
                                  "Usuario";
                              }
                            }

                            // Generar iniciales de forma segura
                            const safeName =
                              otherUserName && typeof otherUserName === "string"
                                ? otherUserName
                                : "Usuario";
                            iniciales = safeName.substring(0, 2).toUpperCase();
                            // Texto del último mensaje para el preview (con fallback y truncado)
                            let textoUltimo = "";
                            try {
                              textoUltimo = ultimoMensaje
                                ? ultimoMensaje.descripcion ||
                                  ultimoMensaje.texto ||
                                  ""
                                : "";
                            } catch (_) {
                              textoUltimo = "";
                            }
                            const preview =
                              typeof textoUltimo === "string"
                                ? textoUltimo.length > 60
                                  ? textoUltimo.slice(0, 60) + "…"
                                  : textoUltimo
                                : "";

                            return otherUserImage ? (
                              <img
                                src={otherUserImage}
                                alt={`Avatar de ${otherUserName}`}
                                style={{
                                  width: 42,
                                  height: 42,
                                  borderRadius: "50%",
                                  border: "2px solid #92d1fa",
                                  boxShadow:
                                    "0 2px 6px rgba(146, 209, 250, 0.3)",
                                  objectFit: "cover",
                                }}
                                onError={(e) => {
                                  // Si falla la imagen, crear avatar con iniciales
                                  e.target.style.display = "none";
                                  const fallbackDiv =
                                    document.createElement("div");
                                  fallbackDiv.className = "chat-avatar";
                                  fallbackDiv.style.cssText = `
                                    width: 42px;
                                    height: 42px;
                                    border-radius: 50%;
                                    border: 2px solid #92d1fa;
                                    box-shadow: 0 2px 6px rgba(146, 209, 250, 0.3);
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    background: linear-gradient(135deg, #b0e0ff 0%, #92d1fa 100%);
                                    color: #2d9cdb;
                                    font-size: 14px;
                                    font-weight: bold;
                                  `;
                                  fallbackDiv.textContent = iniciales;
                                  e.target.parentNode.insertBefore(
                                    fallbackDiv,
                                    e.target.nextSibling
                                  );
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: 42,
                                  height: 42,
                                  borderRadius: "50%",
                                  border: "2px solid #92d1fa",
                                  boxShadow:
                                    "0 2px 6px rgba(146, 209, 250, 0.3)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  background:
                                    "linear-gradient(135deg, #b0e0ff 0%, #92d1fa 100%)",
                                  color: "#2d9cdb",
                                  fontSize: "14px",
                                  fontWeight: "bold",
                                }}
                              >
                                {iniciales}
                              </div>
                            );
                          })()}

                          {/* Información del chat */}
                          <div style={{ flex: 1, marginLeft: 8 }}>
                            <div
                              style={{
                                fontWeight: 700,
                                fontSize: 18,
                                color: "#2d9cdb",
                                marginBottom: 2,
                              }}
                            >
                              {(() => {
                                const mensajesChat = chats[chatSeleccionado];
                                if (!mensajesChat || mensajesChat.length === 0)
                                  return "Chat";
                                const ultimoMensaje =
                                  mensajesChat[mensajesChat.length - 1];
                                const usuarioActual = JSON.parse(
                                  localStorage.getItem("usuarioActual")
                                );
                                if (ultimoMensaje) {
                                  if (ultimoMensaje.deId === usuarioActual.id) {
                                    return (
                                      ultimoMensaje.paraNombre ||
                                      ultimoMensaje.para ||
                                      "Usuario"
                                    );
                                  } else {
                                    return (
                                      ultimoMensaje.deNombre ||
                                      ultimoMensaje.de ||
                                      "Usuario"
                                    );
                                  }
                                }
                                return "Chat";
                              })()}
                            </div>
                          </div>

                          {/* Acciones del chat: Ver Perfil y, si aplica, Marcar Donación Entregada */}
                          {(() => {
                            const mensajesChat = chats[chatSeleccionado];
                            if (!mensajesChat || mensajesChat.length === 0)
                              return null;
                            const base = mensajesChat[0];
                            const usuarioActual = JSON.parse(
                              localStorage.getItem("usuarioActual")
                            );
                            const otherId =
                              base.deId === usuarioActual.id
                                ? base.paraId
                                : base.deId;

                            // Evaluar si el usuario actual es dueño de la donación del chat
                            let canMarkDelivered = false;
                            let alreadyDelivered = false;
                            if (chatDonation) {
                              const donorId =
                                typeof chatDonation.donor === "object"
                                  ? chatDonation.donor?._id ||
                                    chatDonation.donor?.id
                                  : chatDonation.donor;
                              const currentId =
                                usuarioActual?._id || usuarioActual?.id;
                              const status = chatDonation.status || "available";
                              alreadyDelivered = [
                                "delivered",
                                "completed",
                                "removed",
                              ].includes(status);
                              canMarkDelivered = !!(
                                chatDonation &&
                                donorId &&
                                currentId &&
                                donorId === currentId &&
                                !alreadyDelivered
                              );
                            }

                            return (
                              <div style={{ display: "flex", gap: 8 }}>
                                <button
                                  onClick={() =>
                                    window.open(`/perfil/${otherId}`, "_blank")
                                  }
                                  style={{
                                    background:
                                      "linear-gradient(135deg, #2d9cdb 0%, #38a3e2 100%)",
                                    color: "white",
                                    border: "none",
                                    borderRadius: 20,
                                    padding: "8px 16px",
                                    fontSize: 14,
                                    cursor: "pointer",
                                    fontWeight: 600,
                                    boxShadow:
                                      "0 2px 8px rgba(45, 156, 219, 0.3)",
                                    transition: "all 0.2s",
                                  }}
                                  title="Ver perfil del usuario"
                                  onMouseEnter={(e) => {
                                    e.target.style.transform =
                                      "translateY(-1px)";
                                    e.target.style.boxShadow =
                                      "0 4px 12px rgba(45, 156, 219, 0.4)";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.target.style.transform = "translateY(0)";
                                    e.target.style.boxShadow =
                                      "0 2px 8px rgba(45, 156, 219, 0.3)";
                                  }}
                                >
                                  Ver Perfil
                                </button>
                              </div>
                            );
                          })()}
                        </div>

                        {/* Stepper clásico de intercambio (arriba del hilo) */}
                        {(() => {
                          const usuarioActual = JSON.parse(
                            localStorage.getItem("usuarioActual")
                          );
                          const mensajes = chats[chatSeleccionado] || [];
                          // 1) Anclar al ÚLTIMO mensaje de propuesta de este chat
                          //    Preferimos el que esté marcado explícitamente como propuesta ("[propuesta]", esSolicitudOferta, isOfferInit)
                          let anchor = null;
                          for (let i = mensajes.length - 1; i >= 0; i--) {
                            const m = mensajes[i];
                            if (m && m.productoId && m.productoOfrecidoId) {
                              const raw = (m.descripcion || "")
                                .trim()
                                .toLowerCase();
                              const isInit =
                                raw === "[propuesta]" ||
                                m.esSolicitudOferta === true ||
                                m.isOfferInit === true;
                              if (isInit) {
                                anchor = m;
                                break;
                              }
                            }
                          }
                          // Fallback: si no hay marcada, usar el último que tenga ambos IDs
                          if (!anchor) {
                            for (let i = mensajes.length - 1; i >= 0; i--) {
                              const m = mensajes[i];
                              if (m && m.productoId && m.productoOfrecidoId) {
                                anchor = m;
                                break;
                              }
                            }
                          }
                          if (!anchor) return null;

                          const myId =
                            userData?.id ||
                            usuarioActual?.id ||
                            usuarioActual?._id;
                          const otherId =
                            anchor.deId === myId ? anchor.paraId : anchor.deId;
                          const otherName =
                            anchor.deId === myId
                              ? anchor.paraNombre || anchor.para || "el usuario"
                              : anchor.deNombre || anchor.de || "el usuario";

                          // 2) Confirmaciones SOLO de este anchor; usar transacción solo si refiere al mismo mensaje
                          let listaConfirm = [];
                          if (Array.isArray(anchor.confirmedBy))
                            listaConfirm = anchor.confirmedBy;
                          else if (Array.isArray(anchor.confirmaciones))
                            listaConfirm = anchor.confirmaciones;

                          if (
                            listaConfirm.length === 0 &&
                            Array.isArray(userData?.transacciones)
                          ) {
                            const tIdMsg = String(
                              anchor._id || anchor.id || ""
                            );
                            const directa = userData.transacciones.find(
                              (t) => String(t._id || t.id || "") === tIdMsg
                            );
                            if (directa) {
                              if (Array.isArray(directa.confirmedBy))
                                listaConfirm = directa.confirmedBy;
                              else if (Array.isArray(directa.confirmaciones))
                                listaConfirm = directa.confirmaciones;
                            }
                          }

                          const myS = String(myId || "");
                          const otherS = String(otherId || "");
                          const confirmaciones = Array.from(
                            new Set(
                              (listaConfirm || [])
                                .filter(Boolean)
                                .map((x) => String(x))
                            )
                          );
                          const yoConfirmado = myS
                            ? confirmaciones.includes(myS)
                            : false;
                          const otroConfirmado = otherS
                            ? confirmaciones.includes(otherS)
                            : false;
                          const completadoPorEstado =
                            anchor.estado === "completado" ||
                            anchor.completed === true;
                          const completadoPorConfirm =
                            new Set(confirmaciones).size >= 2;
                          const completado =
                            completadoPorEstado || completadoPorConfirm;

                          return (
                            <div
                              className="stepper-card"
                              style={{ marginBottom: 20 }}
                            >
                              {/* Línea de pasos */}
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 12,
                                  justifyContent: "space-between",
                                }}
                              >
                                {/* Paso 1: Propuesta */}
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 12,
                                    flex: 1,
                                  }}
                                >
                                  <div
                                    title="Propuesta enviada"
                                    style={{
                                      width: 42,
                                      height: 42,
                                      borderRadius: "50%",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      background:
                                        "linear-gradient(135deg, #34d399 0%, #10b981 100%)",
                                      color: "#fff",
                                      boxShadow:
                                        "0 4px 12px rgba(16,185,129,.35)",
                                      fontSize: 20,
                                      fontWeight: 800,
                                    }}
                                  >
                                    ⚡
                                  </div>
                                  <div
                                    style={{
                                      flex: 1,
                                      height: 6,
                                      background: "#e2e8f0",
                                      borderRadius: 9999,
                                    }}
                                  >
                                    <div
                                      style={{
                                        width:
                                          yoConfirmado ||
                                          otroConfirmado ||
                                          completado
                                            ? "100%"
                                            : "35%",
                                        height: 6,
                                        borderRadius: 9999,
                                        background:
                                          "linear-gradient(135deg,#2d9cdb,#38a3e2)",
                                      }}
                                    />
                                  </div>
                                </div>
                                {/* Paso 2: Tu confirmación */}
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 12,
                                    flex: 1,
                                  }}
                                >
                                  <div
                                    title="Tu confirmación"
                                    style={{ position: "relative" }}
                                  >
                                    <div
                                      style={{
                                        width: 44,
                                        height: 44,
                                        borderRadius: "50%",
                                        border: yoConfirmado
                                          ? "2px solid #22c55e"
                                          : "2px solid #cbd5e1",
                                        boxShadow: "0 2px 8px rgba(0,0,0,.08)",
                                        overflow: "hidden",
                                        background: "#f8fafc",
                                      }}
                                    >
                                      {userData?.imagen ? (
                                        <img
                                          src={normalizeImageUrl(
                                            userData.imagen
                                          )}
                                          alt="Tú"
                                          style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                          }}
                                        />
                                      ) : null}
                                    </div>
                                  </div>
                                  <div
                                    style={{
                                      flex: 1,
                                      height: 6,
                                      background: "#e2e8f0",
                                      borderRadius: 9999,
                                    }}
                                  >
                                    <div
                                      style={{
                                        width:
                                          otroConfirmado || completado
                                            ? "100%"
                                            : yoConfirmado
                                            ? "55%"
                                            : "20%",
                                        height: 6,
                                        borderRadius: 9999,
                                        background:
                                          "linear-gradient(135deg,#2d9cdb,#38a3e2)",
                                      }}
                                    />
                                  </div>
                                </div>
                                {/* Paso 3: Confirmación del otro usuario */}
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 12,
                                    flex: 1,
                                  }}
                                >
                                  <div
                                    title={`Confirmación de ${otherName}`}
                                    style={{ position: "relative" }}
                                  >
                                    <div
                                      style={{
                                        width: 44,
                                        height: 44,
                                        borderRadius: "50%",
                                        border: otroConfirmado
                                          ? "2px solid #22c55e"
                                          : "2px solid #cbd5e1",
                                        boxShadow: "0 2px 8px rgba(0,0,0,.08)",
                                        overflow: "hidden",
                                        background: "#f8fafc",
                                      }}
                                    >
                                      {(() => {
                                        const mensajesSel =
                                          chats[chatSeleccionado] || [];
                                        let img = "";
                                        for (const m of mensajesSel) {
                                          if (m.deId === myId) {
                                            if (m.paraImagen) {
                                              img = normalizeImageUrl(
                                                m.paraImagen
                                              );
                                              break;
                                            }
                                          } else {
                                            if (m.deImagen) {
                                              img = normalizeImageUrl(
                                                m.deImagen
                                              );
                                              break;
                                            }
                                          }
                                        }
                                        return img ? (
                                          <img
                                            src={img}
                                            alt={otherName}
                                            style={{
                                              width: "100%",
                                              height: "100%",
                                              objectFit: "cover",
                                            }}
                                          />
                                        ) : null;
                                      })()}
                                    </div>
                                  </div>
                                  <div
                                    style={{
                                      flex: 1,
                                      height: 6,
                                      background: "#e2e8f0",
                                      borderRadius: 9999,
                                    }}
                                  >
                                    <div
                                      style={{
                                        width: completado
                                          ? "100%"
                                          : otroConfirmado
                                          ? "65%"
                                          : "25%",
                                        height: 6,
                                        borderRadius: 9999,
                                        background:
                                          "linear-gradient(135deg,#2d9cdb,#38a3e2)",
                                      }}
                                    />
                                  </div>
                                </div>
                                {/* Paso 4: Completado */}
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 12,
                                  }}
                                >
                                  <div
                                    title="Intercambio completado"
                                    style={{
                                      width: 42,
                                      height: 42,
                                      borderRadius: "50%",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      background: completado
                                        ? "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)"
                                        : "#e2e8f0",
                                      color: completado ? "#fff" : "#64748b",
                                      boxShadow: completado
                                        ? "0 4px 12px rgba(34,197,94,.35)"
                                        : "none",
                                      fontSize: 20,
                                      fontWeight: 800,
                                    }}
                                  >
                                    ★
                                  </div>
                                </div>
                              </div>

                              {/* Etiquetas bajo los pasos */}
                              <div
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: "1fr 1fr 1fr 1fr",
                                  gap: 12,
                                  marginTop: 12,
                                }}
                              >
                                <div style={{ textAlign: "center" }}>
                                  <div
                                    style={{
                                      fontWeight: 700,
                                      color: "#0f172a",
                                    }}
                                  >
                                    Propuesta enviada
                                  </div>
                                  <div
                                    style={{ fontSize: 12, color: "#64748b" }}
                                  >
                                    Tu
                                  </div>
                                </div>
                                <div style={{ textAlign: "center" }}>
                                  <div
                                    style={{
                                      fontWeight: 700,
                                      color: yoConfirmado
                                        ? "#0f172a"
                                        : "#64748b",
                                    }}
                                  >
                                    Tu confirmación
                                  </div>
                                  <div
                                    style={{ fontSize: 12, color: "#94a3b8" }}
                                  >
                                    {yoConfirmado ? "Confirmado" : "Pendiente"}
                                  </div>
                                </div>
                                <div style={{ textAlign: "center" }}>
                                  <div
                                    style={{
                                      fontWeight: 700,
                                      color: otroConfirmado
                                        ? "#0f172a"
                                        : "#64748b",
                                    }}
                                  >{`Confirmación de ${otherName}`}</div>
                                  <div
                                    style={{ fontSize: 12, color: "#94a3b8" }}
                                  >
                                    {otroConfirmado
                                      ? "Confirmado"
                                      : "Pendiente"}
                                  </div>
                                </div>
                                <div style={{ textAlign: "center" }}>
                                  <div
                                    style={{
                                      fontWeight: 700,
                                      color: completado ? "#0f172a" : "#64748b",
                                    }}
                                  >
                                    Intercambio completado
                                  </div>
                                  <div
                                    style={{ fontSize: 12, color: "#94a3b8" }}
                                  >
                                    {completado ? "Listo" : "En progreso"}
                                  </div>
                                </div>
                              </div>

                              {/* Banda de estado: solo cuando esté completado */}
                              {completado && (
                                <div
                                  className="stepper-status"
                                  style={{ marginTop: 8 }}
                                >
                                  <span className="stepper-status-pill">
                                    Intercambio completado
                                  </span>
                                </div>
                              )}

                              {/* CTA confirmar */}
                              {!completado && !yoConfirmado && (
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "center",
                                    marginTop: 18,
                                  }}
                                >
                                  <button
                                    onClick={() =>
                                      handleConfirmExchange(anchor)
                                    }
                                    style={{
                                      background:
                                        "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
                                      color: "#ffffff",
                                      border: "none",
                                      borderRadius: 12,
                                      padding: "12px 22px",
                                      fontWeight: 800,
                                      boxShadow:
                                        "0 6px 16px rgba(34,197,94,.35)",
                                      cursor: "pointer",
                                    }}
                                  >
                                    Confirmar intercambio
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        {/* Lista de mensajes del chat */}
                        <div
                          className="chat-thread"
                          ref={chatContainerRef}
                          onScroll={handleScroll}
                          style={{
                            flex: 1,
                            overflowY: "auto",
                            paddingRight: 6,
                            paddingBottom: 8,
                          }}
                        >
                          {(() => {
                            const mensajesChat = chats[chatSeleccionado] || [];
                            const myId =
                              userData?.id ||
                              JSON.parse(
                                localStorage.getItem("usuarioActual") || "{}"
                              )?.id;
                            const currentUserImage =
                              (userData?.imagen
                                ? normalizeImageUrl(userData.imagen)
                                : imagenPerfil) || "/images/fotoperfil.jpg";
                            const handleStartEdit = (id) => {
                              try {
                                const msg = mensajesChat.find(
                                  (x) => (x._id || x.id) === id
                                );
                                const text =
                                  msg?.descripcion || msg?.texto || "";
                                setEditingMessageId(id);
                                setEditText(text);
                              } catch {}
                            };
                            const handleSaveEdit = async (msg) => {
                              const mid = msg._id || msg.id;
                              if (!mid) return setEditingMessageId(null);
                              try {
                                const res = await fetch(
                                  `${API_URL}/messages/${mid}`,
                                  {
                                    method: "PUT",
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                      descripcion: editText,
                                    }),
                                  }
                                );
                                if (!res.ok)
                                  throw new Error(`HTTP ${res.status}`);
                                // Actualizar en estado local
                                setMensajes((prev) =>
                                  prev.map((m) =>
                                    (m._id || m.id) === mid
                                      ? {
                                          ...m,
                                          descripcion: editText,
                                          updatedAt: new Date().toISOString(),
                                        }
                                      : m
                                  )
                                );
                              } catch (e) {
                                alert(
                                  "No se pudo guardar la edición del mensaje"
                                );
                              } finally {
                                setEditingMessageId(null);
                              }
                            };
                            return mensajesChat.map((m, idx) => {
                              const fromMe = m.deId === myId;
                              const senderProfileImage = fromMe
                                ? m.paraImagen
                                  ? normalizeImageUrl(m.paraImagen)
                                  : ""
                                : m.deImagen
                                ? normalizeImageUrl(m.deImagen)
                                : "";
                              return (
                                <ChatBubble
                                  key={m._id || m.id || idx}
                                  mensaje={m}
                                  fromMe={fromMe}
                                  currentUserId={myId}
                                  onRefresh={(action, id) => {
                                    if (action === "edit" && id) {
                                      handleStartEdit(id);
                                    } else {
                                      fetchMensajes(myId);
                                    }
                                  }}
                                  onDeleteMessage={(msg) => {
                                    setMessageToDelete(msg);
                                    setShowConfirmMessageDelete(true);
                                  }}
                                  confirmExchange={handleConfirmExchange}
                                  productoTitle={m.productoTitle}
                                  productoOfrecido={m.productoOfrecido}
                                  isEditing={
                                    editingMessageId === (m._id || m.id)
                                  }
                                  editText={editText}
                                  onEditTextChange={setEditText}
                                  onEditCancel={() => setEditingMessageId(null)}
                                  onEditSave={() => handleSaveEdit(m)}
                                  scrollToBottom={() =>
                                    chatContainerRef.current &&
                                    chatContainerRef.current.scrollTo({
                                      top: chatContainerRef.current
                                        .scrollHeight,
                                      behavior: "smooth",
                                    })
                                  }
                                  senderProfileImage={senderProfileImage}
                                  currentUserProfileImage={currentUserImage}
                                  isFirstMessageInChat={idx === 0}
                                />
                              );
                            });
                          })()}
                        </div>

                        {/* Composer al final del chat */}
                        <div style={{ marginTop: 8 }}>
                          <div className="chat-composer">
                            <button
                              type="button"
                              title="Adjuntar imagen"
                              className="composer-attach-btn"
                              onClick={() =>
                                alert(
                                  "Adjuntar imagen: pendiente de implementar"
                                )
                              }
                            >
                              📷
                            </button>
                            <input
                              type="text"
                              className="composer-input"
                              value={nuevoTexto}
                              onChange={(e) => setNuevoTexto(e.target.value)}
                              placeholder="Escribe un mensaje..."
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  handleEnviarMensaje();
                                }
                              }}
                            />
                            <button
                              type="button"
                              className="composer-send-btn"
                              onClick={handleEnviarMensaje}
                              title="Enviar"
                            >
                              ➤
                            </button>
                          </div>
                        </div>

                        {/* Banner de calificación debajo del composer + RatingModal */}
                        {(() => {
                          const usuarioActual = JSON.parse(
                            localStorage.getItem("usuarioActual")
                          );
                          const mensajes = chats[chatSeleccionado] || [];
                          const mensajeIntercambio = mensajes.find(
                            (m) => m.productoId && m.productoOfrecidoId
                          );
                          if (!mensajeIntercambio) return null;

                          const myId = usuarioActual?.id;
                          const completado =
                            mensajeIntercambio.completed === true ||
                            mensajeIntercambio.estado === "completado";
                          const yaCalificado =
                            !!mensajeIntercambio.calificado ||
                            typeof mensajeIntercambio.rating === "number";
                          if (!(completado && !yaCalificado)) return null;

                          const otherName =
                            mensajeIntercambio.deId === myId
                              ? mensajeIntercambio.paraNombre ||
                                mensajeIntercambio.para ||
                                "el usuario"
                              : mensajeIntercambio.deNombre ||
                                mensajeIntercambio.de ||
                                "el usuario";
                          const msgId =
                            mensajeIntercambio._id || mensajeIntercambio.id;

                          const submitRating = async ({ stars, comment }) => {
                            try {
                              const res = await fetch(
                                `${API_URL}/messages/${msgId}/rating`,
                                {
                                  method: "PUT",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({
                                    rating: stars,
                                    raterId: myId,
                                    comment,
                                  }),
                                }
                              );
                              if (!res.ok)
                                throw new Error(`HTTP ${res.status}`);
                              setMensajes((prev) =>
                                prev.map((m) =>
                                  m._id === msgId || m.id === msgId
                                    ? { ...m, rating: stars, calificado: true }
                                    : m
                                )
                              );
                              setShowRatingModal(false);
                            } catch {
                              alert("No se pudo enviar la calificación.");
                            }
                          };

                          return (
                            <>
                              <div style={{ marginTop: 12 }}>
                                <div className="rate-banner">
                                  <div>
                                    <div className="rate-text">
                                      ¡Intercambio completado con éxito! 🎉
                                    </div>
                                    <span className="rate-subtext">
                                      Calificá tu experiencia con{" "}
                                      <span className="rate-username">
                                        {otherName}
                                      </span>
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    className="rate-cta"
                                    style={{ color: "#ffffff" }}
                                    onClick={() => setShowRatingModal(true)}
                                  >
                                    ⭐ Calificar Ahora
                                  </button>
                                </div>
                              </div>

                              {showRatingModal && (
                                <RatingModal
                                  open={showRatingModal}
                                  onClose={() => setShowRatingModal(false)}
                                  onSubmit={submitRating}
                                  userName={otherName}
                                />
                              )}
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PerfilUsuario;
