import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './HistorialPedido.css';

function HistorialPedido({ pedidoId, onClose }) {
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarHistorial();
  }, [pedidoId]);

  const cargarHistorial = async () => {
    try {
      setLoading(true);
      const data = await api.get(`/pedidos/${pedidoId}/historial`);
      setHistorial(data);
    } catch (err) {
      setError(err.message || 'Error cargando historial');
    } finally {
      setLoading(false);
    }
  };

  const getAccionIcon = (accion) => {
    const icons = {
      creado: '+',
      editado: '/',
      estado_pendiente: 'P',
      estado_preparado: 'R',
      estado_en_camino: 'C',
      estado_entregado: 'E',
      estado_cancelado: 'X',
      repartidor_asignado: 'A',
      repartidor_cambiado: 'A',
      pago_registrado: '$',
      abono_registrado: '$',
      nota_agregada: 'N'
    };
    return icons[accion] || '?';
  };

  const getAccionClass = (accion) => {
    const classes = {
      creado: 'success',
      estado_entregado: 'success',
      estado_cancelado: 'danger',
      pago_registrado: 'primary',
      abono_registrado: 'primary',
      estado_preparado: 'warning',
      estado_en_camino: 'info'
    };
    return classes[accion] || 'secondary';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal historial-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Historial del Pedido #{pedidoId}</h3>
          <button className="modal-close" onClick={onClose}>x</button>
        </div>

        <div className="modal-content historial-content">
          {loading ? (
            <p className="loading-text">Cargando historial...</p>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : historial.length === 0 ? (
            <p className="empty-message">No hay historial registrado</p>
          ) : (
            <div className="historial-timeline">
              {historial.map((item) => (
                <div key={item.id} className={`historial-item ${getAccionClass(item.accion)}`}>
                  <div className="historial-icon">
                    {getAccionIcon(item.accion)}
                  </div>
                  <div className="historial-info">
                    <div className="historial-header">
                      <span className="historial-accion">{item.accionLabel}</span>
                      <span className="historial-fecha">{item.fechaFormateada}</span>
                    </div>
                    <p className="historial-descripcion">{item.descripcion}</p>
                    {item.usuarioRol && (
                      <span className="historial-usuario-rol">
                        ({item.usuarioRol})
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

export default HistorialPedido;
