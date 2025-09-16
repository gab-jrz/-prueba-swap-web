// Proxy global de fetch para producción
// - Reescribe cualquier llamada a localhost:3001 hacia VITE_API_URL
// - Si se llama al backend de Railway sin "/api", lo agrega automáticamente
// - No afecta a llamadas externas de terceros

import { API_URL as API_BASE } from '../config';
// Derivar el origin del backend quitando el sufijo /api
const BACKEND_ORIGIN = (API_BASE || '').replace(/\/?api\/?$/, '');
const DEBUG = true; // TEMP: habilitar logs para diagnosticar reescrituras en producción

const isLocalhostBackend = (u) => {
  try {
    const url = new URL(u);
    return (
      (url.hostname === 'localhost' || url.hostname === '127.0.0.1') &&
      (url.port === '3001' || url.port === '3000' || url.port === '')
    );
  } catch {
    return false;
  }
};

const needsApiPrefix = (u) => {
  try {
    const url = new URL(u);
    if (!BACKEND_ORIGIN) return false;
    const backend = new URL(BACKEND_ORIGIN);
    // mismo origin del backend y el path no empieza con /api
    return url.origin === backend.origin && !url.pathname.startsWith('/api');
  } catch {
    return false;
  }
};

const buildUrl = (input) => {
  // input puede ser string o Request
  if (typeof input === 'string') {
    let urlStr = input;

    // 0) Reemplazo tosco previo por si el parse falla o hay casos edge
    if (/^http:\/\/(localhost|127\.0\.0\.1):3001\b/i.test(urlStr) && BACKEND_ORIGIN) {
      urlStr = urlStr.replace(/^http:\/\/(localhost|127\.0\.0\.1):3001/i, BACKEND_ORIGIN);
      if (DEBUG) console.log('[fetchProxy] Pre-rewrite localhost->origin:', urlStr);
    }

    // 1) Reescribir localhost -> API_URL (incluyendo /api)
    if (isLocalhostBackend(urlStr)) {
      const original = new URL(urlStr);
      // limpiar posible /api duplicado del path
      const cleanedPath = original.pathname.replace(/^\/api\/?/, '/');
      urlStr = `${API_BASE.replace(/\/$/, '')}/${cleanedPath.replace(/^\//, '')}${original.search || ''}`;
      if (DEBUG) console.log('[fetchProxy] Rewrote localhost to API_BASE:', urlStr);
    }

    // 2) Si llama al origin del backend sin /api, agregarlo
    if (needsApiPrefix(urlStr)) {
      const u = new URL(urlStr);
      u.pathname = '/api' + (u.pathname.startsWith('/') ? u.pathname : '/' + u.pathname);
      urlStr = u.toString();
      if (DEBUG) console.log('[fetchProxy] Added /api prefix:', urlStr);
    }

    // Normalizar dobles barras accidentales (excepto después de https:)
    urlStr = urlStr.replace(/([^:])\/\/+/, '$1/');
    if (DEBUG) console.log('[fetchProxy] URL final:', urlStr);
    return urlStr;
  }

  // Request object
  if (input && typeof input === 'object' && typeof input.url === 'string') {
    const newUrl = buildUrl(input.url);
    if (newUrl !== input.url) {
      // Clonar init para preservar método/headers/body
      const init = { ...arguments[1] };
      return new Request(newUrl, init);
    }
  }

  return input;
};

if (typeof window !== 'undefined' && !window.__SWAPWEB_FETCH_PROXY__) {
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const rewritten = buildUrl(input);
    return originalFetch(rewritten, init);
  };
  window.__SWAPWEB_FETCH_PROXY__ = true;

  // Interceptar también XMLHttpRequest por si alguna librería no usa fetch
  if (typeof window.XMLHttpRequest !== 'undefined' && !window.__SWAPWEB_XHR_PROXY__) {
    const OriginalXHR = window.XMLHttpRequest;
    const open = OriginalXHR.prototype.open;
    OriginalXHR.prototype.open = function(method, url, ...rest) {
      let newUrl = url;
      try {
        // Reescrituras similares a fetch
        if (typeof url === 'string') {
          // Reemplazo tosco previo
          if (/^http:\/\/(localhost|127\.0\.0\.1):3001\b/i.test(newUrl) && BACKEND_ORIGIN) {
            newUrl = newUrl.replace(/^http:\/\/(localhost|127\.0\.0\.1):3001/i, BACKEND_ORIGIN);
            if (DEBUG) console.log('[xhrProxy] Pre-rewrite localhost->origin:', newUrl);
          }
          // Si quedó llamando al origin del backend sin /api, agregarlo
          try {
            const test = new URL(newUrl);
            const backend = new URL(BACKEND_ORIGIN);
            if (test.origin === backend.origin && !test.pathname.startsWith('/api')) {
              test.pathname = '/api' + (test.pathname.startsWith('/') ? test.pathname : '/' + test.pathname);
              newUrl = test.toString();
              if (DEBUG) console.log('[xhrProxy] Added /api prefix:', newUrl);
            }
          } catch {}
        }
      } catch {}
      return open.call(this, method, newUrl, ...rest);
    };
    window.__SWAPWEB_XHR_PROXY__ = true;
  }
}
