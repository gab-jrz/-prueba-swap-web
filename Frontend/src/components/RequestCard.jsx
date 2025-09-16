import React from 'react';

const RequestCard = ({ category, location, urgency, needDescription, status, onDonate }) => (
  <div className="card shadow-sm mb-3" style={{ borderRadius: '14px', overflow: 'hidden' }}>
    <div className="card-body">
      <h5 className="card-title mb-2">{category}</h5>
      <div className="mb-1"><span className="badge bg-warning me-2">Urgencia: {urgency}</span></div>
      <div className="mb-2 text-muted" style={{ fontSize: '0.95rem' }}>📍 {location}</div>
      <p className="mb-2">{needDescription}</p>
      <div className="d-flex justify-content-between align-items-center">
        <span className={`badge ${status === 'open' ? 'bg-success' : status === 'assigned' ? 'bg-warning' : 'bg-secondary'}`}>{status}</span>
        <button className="btn btn-outline-gradient px-3" style={{ borderRadius: '8px', fontWeight: 600 }} onClick={onDonate}>
          Donar
        </button>
      </div>
    </div>
  </div>
);

export default RequestCard;
