import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { categorias } from "../categorias";
import "../styles/DonationForm.css";
import "../styles/RequestsList.css";
import { API_URL } from "../config";

const RequestsList = () => {
  const prevTitleRef = React.useRef(document.title);
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedUrgency, setSelectedUrgency] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const urgencyOptions = [
    { value: 'high', label: 'Alta urgencia', color: 'danger' },
    { value: 'med', label: 'Media urgencia', color: 'warning' },
    { value: 'low', label: 'Baja urgencia', color: 'success' }
  ];

  useEffect(() => {
    // set document title for this page
    prevTitleRef.current = document.title;
    document.title = 'Solicitudes de Ayuda — SwapWeb';

    fetchRequests();

    return () => {
      document.title = prevTitleRef.current || 'SwapWeb';
    };
  }, []);

  useEffect(() => {
    filterRequests();
  }, [requests, selectedCategory, selectedUrgency, searchTerm]);

  const fetchRequests = async () => {
    try {
      const response = await fetch(`${API_URL}/donation-requests`);
      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      } else {
        console.error('Error fetching requests:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterRequests = () => {
    let filtered = requests;

    if (selectedCategory) {
      filtered = filtered.filter(request => request.category === selectedCategory);
    }

    if (selectedUrgency) {
      filtered = filtered.filter(request => request.urgency === selectedUrgency);
    }

    if (searchTerm) {
      filtered = filtered.filter(request =>
        request.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.needDescription?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredRequests(filtered);
  };

  const handleDonate = (requestId) => {
    navigate(`/donaciones/solicitudes/${requestId}`);
  };

  const getUrgencyBadgeClass = (urgency) => {
    switch (urgency) {
      case 'high': return 'bg-danger';
      case 'med': return 'bg-warning';
      case 'low': return 'bg-success';
      default: return 'bg-secondary';
    }
  };

  const getUrgencyText = (urgency) => {
    switch (urgency) {
      case 'high': return 'Alta';
      case 'med': return 'Media';
      case 'low': return 'Baja';
      default: return urgency;
    }
  };

  const categoryLabel = (catKey) => {
    if (!catKey) return 'No especificada';
    const found = categorias.find(c => c.id === catKey || c.name === catKey);
    return found ? found.name : catKey;
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
      <div className="container mt-4">
        <div className="row">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h1 className="h2 mb-2">Solicitudes de Ayuda</h1>
                <p className="text-muted">Personas que necesitan tu ayuda</p>
              </div>
              <button
                className="btn btn-primary"
                onClick={() => navigate('/donaciones/solicitar')}
                style={{
                  borderRadius: '12px',
                  padding: '12px 24px',
                  fontWeight: '600',
                  fontSize: '1rem'
                }}
              >
                🙏 Solicitar Ayuda
              </button>
            </div>

            <div className="row mb-3">
              <div className="col-md-4">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Buscar solicitudes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ borderRadius: '10px' }}
                />
              </div>
              <div className="col-md-3">
                <select
                  className="form-select"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  style={{ borderRadius: '10px' }}
                >
                  <option value="">Todas las categorías</option>
                  <option value="Electrónicos">Electrónicos</option>
                  <option value="Ropa">Ropa</option>
                  <option value="Hogar">Hogar</option>
                  <option value="Deportes">Deportes</option>
                  <option value="Libros">Libros</option>
                  <option value="Salud">Salud</option>
                  <option value="Educación">Educación</option>
                  <option value="Otros">Otros</option>
                </select>
              </div>
              <div className="col-md-3">
                <select
                  className="form-select"
                  value={selectedUrgency}
                  onChange={(e) => setSelectedUrgency(e.target.value)}
                  style={{ borderRadius: '10px' }}
                >
                  <option value="">Todas las urgencias</option>
                  <option value="high">Alta urgencia</option>
                  <option value="med">Media urgencia</option>
                  <option value="low">Baja urgencia</option>
                </select>
              </div>
              <div className="col-md-2">
                <span className="badge bg-primary fs-6">
                  {filteredRequests.length} resultado{filteredRequests.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {filteredRequests.length === 0 ? (
              <div className="text-center py-5">
                <div className="mb-3">
                  <i className="fas fa-hands-helping" style={{ fontSize: '4rem', color: '#dee2e6' }}></i>
                </div>
                <h3 className="text-muted">No hay solicitudes disponibles</h3>
                <p className="text-muted">
                  {searchTerm || selectedCategory || selectedUrgency
                    ? 'No se encontraron solicitudes con los filtros aplicados'
                    : 'Aún no hay personas solicitando ayuda'}
                </p>
                <button
                  className="btn btn-outline-primary"
                  onClick={() => navigate('/donaciones/solicitar')}
                >
                  Crear Primera Solicitud
                </button>
              </div>
            ) : (
              <div className="row">
                {filteredRequests.map((request) => (
                  <div key={request._id} className="col-lg-4 col-md-6 mb-4">
                    <div className="card shadow-sm h-100" style={{ borderRadius: '14px', overflow: 'hidden' }}>
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <h5 className="card-title mb-0">{request.title || categoryLabel(request.category)}</h5>
                            {request.title && <small className="text-muted">{categoryLabel(request.category)}</small>}
                          </div>
                          <span className={`badge ${getUrgencyBadgeClass(request.urgency)}`}>
                            {getUrgencyText(request.urgency)}
                          </span>
                        </div>
                        <div className="mb-2 text-muted" style={{ fontSize: '0.95rem' }}>
                          📍 {request.location || 'Ubicación no especificada'}
                        </div>
                        <p className="card-text mb-3" style={{ 
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {request.needDescription}
                        </p>
                        <div className="d-flex justify-content-between align-items-center">
                          <span 
                            className={`badge ${
                              request.status === 'open' ? 'bg-success' : 
                              request.status === 'assigned' ? 'bg-warning text-dark' : 
                              'bg-secondary'
                            }`}
                          >
                            {request.status === 'open' ? 'Abierta' :
                             request.status === 'assigned' ? 'Asignada' : 'Cerrada'}
                          </span>
                          <button 
                            className="btn btn-outline-primary btn-sm"
                            style={{ borderRadius: '8px', fontWeight: 600 }}
                            onClick={() => handleDonate(request._id)}
                            disabled={request.status !== 'open'}
                          >
                            {request.status === 'open' ? '💝 Ayudar' : 'Ver detalles'}
                          </button>
                        </div>
                        <div className="mt-2">
                          <small className="text-muted">
                            Publicado: {new Date(request.createdAt).toLocaleDateString()}
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
  <Footer />
    </>
  );
};

export default RequestsList;
