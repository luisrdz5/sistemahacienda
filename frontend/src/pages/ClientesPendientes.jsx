import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import './ClientesPendientes.css';

function ClientesPendientes() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(null);

  useEffect(() => {
    cargarPendientes();
  }, []);

  const cargarPendientes = async () => {
    try {
      setLoading(true);
      const response = await api.get('/clientes/pendientes');
      setClientes(response.data || response);
    } catch (error) {
      console.error('Error cargando pendientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAprobar = async (clienteId) => {
    if (!confirm('Aprobar este cliente le dara acceso al portal. Continuar?')) return;

    try {
      setProcesando(clienteId);
      await api.put(`/clientes/${clienteId}/aprobar`);
      cargarPendientes();
    } catch (error) {
      alert(error.message || 'Error al aprobar cliente');
    } finally {
      setProcesando(null);
    }
  };

  const handleRechazar = async (clienteId) => {
    const motivo = prompt('Motivo del rechazo (opcional):');
    if (motivo === null) return; // Cancelado

    try {
      setProcesando(clienteId);
      await api.delete(`/clientes/${clienteId}/rechazar`);
      cargarPendientes();
    } catch (error) {
      alert(error.message || 'Error al rechazar cliente');
    } finally {
      setProcesando(null);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="loading">Cargando clientes pendientes...</div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-back">
          <Link to="/clientes" className="btn-back">&larr;</Link>
          <h1 className="page-title">Clientes Pendientes de Aprobacion</h1>
        </div>
      </div>

      {clientes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">&#9989;</div>
          <p>No hay clientes pendientes de aprobacion</p>
          <Link to="/clientes" className="btn btn-primary">Volver a Clientes</Link>
        </div>
      ) : (
        <div className="pendientes-list">
          {clientes.map(cliente => (
            <div key={cliente.id} className="pendiente-card card">
              <div className="pendiente-header">
                <h3>{cliente.nombre}</h3>
                <span className="pendiente-fecha">
                  Registro: {formatDate(cliente.createdAt)}
                </span>
              </div>

              <div className="pendiente-info">
                {cliente.email && (
                  <p>
                    <span className="info-label">Email:</span>
                    <span>{cliente.email}</span>
                  </p>
                )}
                {cliente.telefono && (
                  <p>
                    <span className="info-label">Telefono:</span>
                    <a href={`https://wa.me/52${cliente.telefono.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                      {cliente.telefono}
                    </a>
                  </p>
                )}
                {cliente.direccion && (
                  <p>
                    <span className="info-label">Direccion:</span>
                    <span>{cliente.direccion}</span>
                  </p>
                )}
                {cliente.sucursal && (
                  <p>
                    <span className="info-label">Sucursal:</span>
                    <span>{cliente.sucursal.nombre}</span>
                  </p>
                )}
                <p>
                  <span className="info-label">Limite de credito:</span>
                  <span>${cliente.limiteCredito?.toFixed(2) || '200.00'}</span>
                </p>
              </div>

              <div className="pendiente-actions">
                <button
                  className="btn btn-success"
                  onClick={() => handleAprobar(cliente.id)}
                  disabled={procesando === cliente.id}
                >
                  {procesando === cliente.id ? 'Procesando...' : 'Aprobar'}
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => handleRechazar(cliente.id)}
                  disabled={procesando === cliente.id}
                >
                  Rechazar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ClientesPendientes;
