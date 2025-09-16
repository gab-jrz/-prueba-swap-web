import { API_URL } from '../config';

class DonationService {
  async getAllDonations() {
    const response = await fetch(`${API_URL}/donations`);
    if (!response.ok) {
      throw new Error('Error al obtener donaciones');
    }
    return response.json();
  }

  async getDonationById(id) {
    const response = await fetch(`${API_URL}/donations/${id}`);
    if (!response.ok) {
      throw new Error('Error al obtener donación');
    }
    return response.json();
  }

  async createDonation(donationData) {
    const response = await fetch(`${API_URL}/donations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(donationData),
    });
    if (!response.ok) {
      throw new Error('Error al crear donación');
    }
    return response.json();
  }

  async updateDonation(id, donationData) {
    const response = await fetch(`${API_URL}/donations/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(donationData),
    });
    if (!response.ok) {
      throw new Error('Error al actualizar donación');
    }
    return response.json();
  }

  async updateDonationStatus(id, status) {
    const response = await fetch(`${API_URL}/donations/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) {
      throw new Error('Error al actualizar estado de donación');
    }
    return response.json();
  }

  async deleteDonation(id) {
    const response = await fetch(`${API_URL}/donations/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Error al eliminar donación');
    }
    return response.json();
  }

  async assignDonationToRequest(donationId, requestId) {
    const response = await fetch(`${API_URL}/donations/${donationId}/assign/${requestId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error('Error al asignar donación');
    }
    return response.json();
  }

  // Métodos para solicitudes de donación
  async getAllRequests() {
    const response = await fetch(`${API_URL}/donation-requests`);
    if (!response.ok) {
      throw new Error('Error al obtener solicitudes');
    }
    return response.json();
  }

  async getRequestById(id) {
    const response = await fetch(`${API_URL}/donation-requests/${id}`);
    if (!response.ok) {
      throw new Error('Error al obtener solicitud');
    }
    return response.json();
  }

  async createRequest(requestData) {
    const response = await fetch(`${API_URL}/donation-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });
    if (!response.ok) {
      throw new Error('Error al crear solicitud');
    }
    return response.json();
  }

  async updateRequest(id, requestData) {
    const response = await fetch(`${API_URL}/donation-requests/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });
    if (!response.ok) {
      throw new Error('Error al actualizar solicitud');
    }
    return response.json();
  }

  async updateRequestStatus(id, status) {
    const response = await fetch(`${API_URL}/donation-requests/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) {
      throw new Error('Error al actualizar estado de solicitud');
    }
    return response.json();
  }

  // Métodos para matches
  async completeMatch(matchId) {
    const response = await fetch(`${API_URL}/matches/${matchId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error('Error al completar match');
    }
    return response.json();
  }
}

export default new DonationService();
