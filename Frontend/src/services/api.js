import { API_URL } from '../config';

export const getProducts = async () => {
  try {
    const response = await fetch(`${API_URL}/products`);
    if (!response.ok) {
      throw new Error('Error al obtener productos');
    }
    const data = await response.json();
    return data.filter(p => !p.intercambiado);
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

export const getUserProducts = async (userId) => {
  try {
    const response = await fetch(`${API_URL}/products?owner=${userId}`);
    if (!response.ok) {
      throw new Error('Error al obtener productos del usuario');
    }
    return await response.json();
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

export const getProduct = async (id) => {
  try {
    const response = await fetch(`${API_URL}/products/${id}`);
    if (!response.ok) {
      throw new Error('Error al obtener el producto');
    }
    return await response.json();
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

export const getUsers = async () => {
  try {
    const response = await fetch(`${API_URL}/users`);
    if (!response.ok) {
      throw new Error('Error al obtener usuarios');
    }
    return await response.json();
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}; 