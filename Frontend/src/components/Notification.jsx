import React, { useEffect } from 'react';
import '../styles/Notification.css';

const Notification = ({ message, type = 'info', onClose, duration = 5000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div className={`notification ${type}`}>
      <div className="notification-content">
        <span>{message}</span>
        <button onClick={onClose} className="notification-close">×</button>
      </div>
    </div>
  );
};

export default Notification;
