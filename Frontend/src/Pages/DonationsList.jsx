import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import DonationCard from '../components/DonationCard';
import '../styles/DonationsList.css';
import { API_URL } from '../config';

const DonationsList = () => {
  const [donations, setDonations] = useState([]);
  const [filteredDonations, setFilteredDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check for success message in location state
  useEffect(() => {
    if (location.state?.showSuccess) {
      setShowSuccess(true);
      setSuccessMessage(location.state.message || '¡Operación exitosa!');
      // Clear the state to prevent showing the message again on refresh
      window.history.replaceState({}, document.title);
      
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  useEffect(() => {
    fetchDonations();
  }, []);

  useEffect(() => {
    // Mostrar por defecto solo donaciones disponibles
    setFilteredDonations(donations.filter(d => d.status === 'available'));
  }, [donations]);

  const fetchDonations = async () => {
    try {
      const response = await fetch(`${API_URL}/donations`);
      if (response.ok) {
        const data = await response.json();
        setDonations(data);
      }
    } catch (error) {
      console.error('Error fetching donations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignDonation = (donationId) => {
    navigate(`/donaciones/${donationId}`);
  };

  if (loading) {
    return (
      <>
        <Header search={false} />
        <div className="container mt-4">
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header search={false} />
      
      {/* Success Toast (flotante lateral derecho) */}
      {showSuccess && (
        <div className="toast-container">
          <div className="toast-success" role="status" aria-live="polite">
            <i className="fas fa-check-circle" aria-hidden="true"></i>
            <span className="toast-message">{successMessage}</span>
            <button
              type="button"
              className="btn-toast-close"
              onClick={() => setShowSuccess(false)}
              aria-label="Cerrar"
              title="Cerrar"
            >
              <i className="fas fa-times" aria-hidden="true"></i>
            </button>
          </div>
        </div>
      )}
      
      {/* Hero Section */}
      <div className="donations-hero">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-8">
              <h1 className="hero-title">
                <i className="fas fa-heart text-danger me-3"></i>
                Explora Donaciones
              </h1>
              <p className="hero-subtitle">
                Encuentra artículos que otros quieren donar y ayuda a crear un mundo más sostenible
              </p>
              <div className="hero-stats">
                <div className="stat-item">
                  <span className="stat-number">{donations.length}</span>
                  <span className="stat-label">Publicadas</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">{donations.filter(d => d.status === 'available').length}</span>
                  <span className="stat-label">Activas</span>
                </div>
              </div>
            </div>
            <div className="col-lg-4 text-center">
              <button
                className="btn-hero-cta"
                onClick={() => navigate('/donaciones/publicar')}
              >
                <i className="fas fa-plus me-2"></i>
                Publicar Donación
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mt-4">
        <div className="results-header">
          <div className="results-info">
            <h4 className="results-count">
              {filteredDonations.length} donacion{filteredDonations.length !== 1 ? 'es' : ''} encontrada{filteredDonations.length !== 1 ? 's' : ''}
            </h4>
          </div>
          {/* Vista fija en lista; controles eliminados */}
        </div>

        {filteredDonations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <i className="fas fa-search"></i>
            </div>
            <h3>No se encontraron donaciones</h3>
            <p>Sé el primero en publicar una donación en esta plataforma</p>
            <div className="empty-actions">
              <button
                className="btn btn-primary"
                onClick={() => navigate('/donaciones/publicar')}
              >
                <i className="fas fa-plus me-2"></i>
                Publicar Primera Donación
              </button>
            </div>
          </div>
        ) : (
          <div className={`donations-grid list`}>
            {filteredDonations.map((donation) => (
              <div key={donation._id} className={`donation-item list`}>
                <DonationCard
                  title={donation.title}
                  description={donation.description}
                  category={donation.category}
                  location={
                    donation.donor?.provincia ||
                    donation.donor?.zona ||
                    donation.donor?.ubicacion ||
                    donation.donor?.location ||
                    donation.location ||
                    ''
                  }
                  condition={donation.condition}
                  images={donation.images}
                  status={donation.status}
                  createdAt={donation.createdAt}
                  ownerId={ donation.donor?._id || null }
                  donorName={
                    (donation.donor?.nombre && donation.donor?.apellido)
                      ? `${donation.donor.nombre} ${donation.donor.apellido}`
                      : donation.donor?.nombre || donation.donor?.name || 'Usuario'
                  }
                  viewMode={'list'}
                  donationId={donation._id}
                  onAssign={() => handleAssignDonation(donation._id)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default DonationsList;
