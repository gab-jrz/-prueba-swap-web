import { API_URL } from '../config';

class DonationsService {
  // Donaciones
  static async getAllDonations() {
    try {
      const response = await fetch(`${API_URL}/donations`);
      if (!response.ok) throw new Error('Error al obtener donaciones');
      return await response.json();
    } catch (error) {
      console.error('Error in getAllDonations:', error);
      throw error;
    }
  }

  static async getDonationById(id) {
    try {
      const response = await fetch(`${API_URL}/donations/${id}`);
      if (!response.ok) throw new Error('Error al obtener donación');
      return await response.json();
    } catch (error) {
      console.error('Error in getDonationById:', error);
      throw error;
    }
  }

  static async createDonation(donationData) {
    try {
      const response = await fetch(`${API_URL}/donations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(donationData)
      });
      if (!response.ok) throw new Error('Error al crear donación');
      return await response.json();
    } catch (error) {
      console.error('Error in createDonation:', error);
      throw error;
    }
  }

  static async updateDonationStatus(id, status) {
    try {
      const response = await fetch(`${API_URL}/donations/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error('Error al actualizar estado de donación');
      return await response.json();
    } catch (error) {
      console.error('Error in updateDonationStatus:', error);
      throw error;
    }
  }

  // Solicitudes de donación
  static async getAllRequests() {
    try {
      const response = await fetch(`${API_URL}/donation-requests`);
      if (!response.ok) throw new Error('Error al obtener solicitudes');
      return await response.json();
    } catch (error) {
      console.error('Error in getAllRequests:', error);
      throw error;
    }
  }

  static async getRequestById(id) {
    try {
      const response = await fetch(`${API_URL}/donation-requests/${id}`);
      if (!response.ok) throw new Error('Error al obtener solicitud');
      return await response.json();
    } catch (error) {
      console.error('Error in getRequestById:', error);
      throw error;
    }
  }

  static async createRequest(requestData) {
    try {
      const response = await fetch(`${API_URL}/donation-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
      if (!response.ok) throw new Error('Error al crear solicitud');
      return await response.json();
    } catch (error) {
      console.error('Error in createRequest:', error);
      throw error;
    }
  }

  static async updateRequestStatus(id, status) {
    try {
      const response = await fetch(`${API_URL}/donation-requests/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error('Error al actualizar estado de solicitud');
      return await response.json();
    } catch (error) {
      console.error('Error in updateRequestStatus:', error);
      throw error;
    }
  }

  // Matches
  static async assignDonationToRequest(donationId, requestId) {
    try {
      const response = await fetch(`${API_URL}/donations/${donationId}/assign/${requestId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Error al asignar donación');
      return await response.json();
    } catch (error) {
      console.error('Error in assignDonationToRequest:', error);
      throw error;
    }
  }

  static async completeMatch(matchId) {
    try {
      const response = await fetch(`${API_URL}/matches/${matchId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Error al completar match');
      return await response.json();
    } catch (error) {
      console.error('Error in completeMatch:', error);
      throw error;
    }
  }
}

export default DonationsService;
