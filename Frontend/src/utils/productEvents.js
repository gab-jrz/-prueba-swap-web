// Sistema de eventos para sincronizar cambios de productos en toda la aplicación

class ProductEventManager {
  constructor() {
    this.listeners = new Map();
  }

  // Suscribirse a eventos de productos
  subscribe(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType).add(callback);

    // Retornar función para desuscribirse
    return () => {
      const callbacks = this.listeners.get(eventType);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.listeners.delete(eventType);
        }
      }
    };
  }

  // Emitir evento
  emit(eventType, data) {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error en callback de evento ${eventType}:`, error);
        }
      });
    }
  }

  // Limpiar todos los listeners
  clear() {
    this.listeners.clear();
  }
}

// Instancia singleton
const productEvents = new ProductEventManager();

// Tipos de eventos
export const PRODUCT_EVENTS = {
  UPDATED: 'product:updated',
  DELETED: 'product:deleted',
  CREATED: 'product:created',
  IMAGE_UPDATED: 'product:image_updated'
};

// Funciones de conveniencia
export const emitProductUpdated = (productData) => {
  productEvents.emit(PRODUCT_EVENTS.UPDATED, productData);
};

export const emitProductDeleted = (productId) => {
  productEvents.emit(PRODUCT_EVENTS.DELETED, { id: productId });
};

export const emitProductCreated = (productData) => {
  productEvents.emit(PRODUCT_EVENTS.CREATED, productData);
};

export const emitProductImageUpdated = (productId, images) => {
  productEvents.emit(PRODUCT_EVENTS.IMAGE_UPDATED, { id: productId, images });
};

// Hook personalizado para suscribirse a eventos de productos
export const useProductEvents = () => {
  return {
    subscribe: productEvents.subscribe.bind(productEvents),
    emit: productEvents.emit.bind(productEvents),
    emitProductUpdated,
    emitProductDeleted,
    emitProductCreated,
    emitProductImageUpdated
  };
};

export default productEvents;
