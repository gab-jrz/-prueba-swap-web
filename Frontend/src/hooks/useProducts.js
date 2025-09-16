import { useState, useEffect, useCallback } from 'react';
import { PRODUCT_EVENTS, useProductEvents } from '../utils/productEvents';
import { API_URL } from '../config';

// Hook personalizado para manejar productos con sincronización automática
export const useProducts = (initialProducts = []) => {
  const [productos, setProductos] = useState(initialProducts);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { subscribe } = useProductEvents();

  // Función para actualizar un producto específico en la lista
  const updateProductInList = useCallback((updatedProduct) => {
    setProductos(prevProductos => 
      prevProductos.map(producto => 
        (producto.id === updatedProduct.id || producto._id === updatedProduct.id)
          ? { ...producto, ...updatedProduct }
          : producto
      )
    );
  }, []);

  // Función para eliminar un producto de la lista
  const removeProductFromList = useCallback((productId) => {
    setProductos(prevProductos => 
      prevProductos.filter(producto => 
        producto.id !== productId && producto._id !== productId
      )
    );
  }, []);

  // Función para agregar un nuevo producto a la lista
  const addProductToList = useCallback((newProduct) => {
    setProductos(prevProductos => [newProduct, ...prevProductos]);
  }, []);

  // Suscribirse a eventos de productos
  useEffect(() => {
    const unsubscribeUpdated = subscribe(PRODUCT_EVENTS.UPDATED, (productData) => {
      console.log('🔄 Producto actualizado:', productData);
      updateProductInList(productData);
    });

    const unsubscribeDeleted = subscribe(PRODUCT_EVENTS.DELETED, ({ id }) => {
      console.log('🗑️ Producto eliminado:', id);
      removeProductFromList(id);
    });

    const unsubscribeCreated = subscribe(PRODUCT_EVENTS.CREATED, (productData) => {
      console.log('✨ Producto creado:', productData);
      addProductToList(productData);
    });

    const unsubscribeImageUpdated = subscribe(PRODUCT_EVENTS.IMAGE_UPDATED, ({ id, images }) => {
      console.log('🖼️ Imágenes actualizadas:', id, images);
      updateProductInList({ id, images });
    });

    // Cleanup: desuscribirse cuando el componente se desmonte
    return () => {
      unsubscribeUpdated();
      unsubscribeDeleted();
      unsubscribeCreated();
      unsubscribeImageUpdated();
    };
  }, [subscribe, updateProductInList, removeProductFromList, addProductToList]);

  // Función para cargar productos desde la API
  const fetchProducts = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      let url = `${API_URL}/products`;
      const queryParams = new URLSearchParams();
      
      if (filters.ownerId) {
        // Backend espera 'owner' como query param (ver backend/src/routes/products.js)
        queryParams.append('owner', filters.ownerId);
      }
      if (filters.categoria) {
        queryParams.append('categoria', filters.categoria);
      }
      
      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Error al cargar productos');
      }
      
      const data = await response.json();

      // Normalizar productos para asegurar campos consistentes de imagen y metadatos
      const normalized = Array.isArray(data) ? data.map(raw => {
        const id = raw?.id || raw?._id;
        const title = raw?.title || raw?.titulo || raw?.nombre || 'Sin título';
        const description = raw?.description || raw?.descripcion || raw?.detalle || '';
        const categoria = raw?.categoria || raw?.category || 'General';

        // Unificar imágenes: preferir array, luego campos sueltos
        let images = [];
        if (Array.isArray(raw?.images)) images = raw.images.filter(Boolean);
        if (!images.length && raw?.image) images = [raw.image];
        if (!images.length && raw?.imagen) images = [raw.imagen];
        if (!images.length && raw?.imagenNombre) images = [raw.imagenNombre];

        const image = images[0] || '';

        const fechaPublicacion = raw?.fechaPublicacion || raw?.createdAt || raw?.fecha || null;
        const provincia = raw?.provincia || raw?.zona || raw?.ubicacion || '';
        const ownerId = raw?.ownerId || raw?.owner || raw?.userId || raw?.usuarioId || null;

        // Mantener otros campos originales pero con overrides de los normalizados
        return {
          ...raw,
          id,
          title,
          description,
          categoria,
          images,
          image,
          fechaPublicacion,
          provincia,
          ownerId,
        };
      }) : [];

      setProductos(normalized);
      return normalized;
    } catch (err) {
      setError(err.message);
      console.error('Error al cargar productos:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Función para refrescar productos
  const refreshProducts = useCallback(() => {
    return fetchProducts();
  }, [fetchProducts]);

  return {
    productos,
    loading,
    error,
    setProductos,
    updateProductInList,
    removeProductFromList,
    addProductToList,
    fetchProducts,
    refreshProducts
  };
};

export default useProducts;
