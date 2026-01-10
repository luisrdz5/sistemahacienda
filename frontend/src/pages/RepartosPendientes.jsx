import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import './RepartosPendientes.css';

function RepartosPendientes() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const cargarDatos = useCallback(async () => {
    try {
      const result = await api.get(`/pedidos/dashboard/repartos-pendientes?fecha=${fecha}`);
      setData(result);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [fecha]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  useEffect(() => {
    let interval;
    if (autoRefresh) {
      interval = setInterval(cargarDatos, 30000); // 30 segundos
    }
    return () => clearInterval(interval);
  }, [autoRefresh, cargarDatos]);

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const getEstadoBadge = (estado) => {
    const badges = {
      pendiente: 'badge-warning',
      preparado: 'badge-preparado',
      en_camino: 'badge-info'
    };
    return badges[estado] || 'badge-secondary';
  };

  const getEstadoLabel = (estado) => {
    const labels = {
      pendiente: 'Pendiente',
      preparado: 'Preparado',
      en_camino: 'En Camino'
    };
    return labels[estado] || estado;
  };

  if (loading) {
    return <div className="loading">Cargando repartos...</div>;
  }

  return (
    <div className="page repartos-page">
      <div className="page-header">
        <h1 className="page-title">Monitor de Repartos</h1>
        <div className="repartos-controls">
          <input
            type="date"
            className="form-input"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
          <label className="toggle-auto-refresh">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto-actualizar
          </label>
        </div>
      </div>

      {data && (
        <>
          <div className="repartos-stats">
            <div className="stat-card stat-pendientes">
              <span className="stat-value">{data.stats.pendientes}</span>
              <span className="stat-label">Pendientes</span>
            </div>
            <div className="stat-card stat-preparados">
              <span className="stat-value">{data.stats.preparados}</span>
              <span className="stat-label">Preparados</span>
            </div>
            <div className="stat-card stat-en-camino">
              <span className="stat-value">{data.stats.enCamino}</span>
              <span className="stat-label">En Camino</span>
            </div>
            <div className="stat-card stat-total">
              <span className="stat-value">{data.stats.total}</span>
              <span className="stat-label">Total Activos</span>
            </div>
          </div>

          <div className="repartos-columnas">
            {data.pedidos.length === 0 ? (
              <div className="empty-repartos">
                <p>No hay repartos pendientes para esta fecha</p>
              </div>
            ) : (
              <>
                {/* Columna Pendientes */}
                {data.stats.pendientes > 0 && (
                  <div className="reparto-columna columna-pendientes">
                    <div className="columna-titulo">
                      <h2>Por Preparar</h2>
                      <span className="columna-badge">{data.stats.pendientes}</span>
                    </div>
                    <div className="columna-lista">
                      {data.pedidos.filter(p => p.estado === 'pendiente').map(pedido => (
                        <RepartoCard key={pedido.id} pedido={pedido} formatMoney={formatMoney} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Columna Preparados */}
                {data.stats.preparados > 0 && (
                  <div className="reparto-columna columna-preparados">
                    <div className="columna-titulo">
                      <h2>Preparados</h2>
                      <span className="columna-badge">{data.stats.preparados}</span>
                    </div>
                    <div className="columna-lista">
                      {data.pedidos.filter(p => p.estado === 'preparado').map(pedido => (
                        <RepartoCard key={pedido.id} pedido={pedido} formatMoney={formatMoney} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Columna En Camino */}
                {data.stats.enCamino > 0 && (
                  <div className="reparto-columna columna-en-camino">
                    <div className="columna-titulo">
                      <h2>En Camino</h2>
                      <span className="columna-badge">{data.stats.enCamino}</span>
                    </div>
                    <div className="columna-lista">
                      {data.pedidos.filter(p => p.estado === 'en_camino').map(pedido => (
                        <RepartoCard key={pedido.id} pedido={pedido} formatMoney={formatMoney} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}

      {autoRefresh && (
        <div className="refresh-indicator">
          Actualizando cada 30 segundos
        </div>
      )}
    </div>
  );
}

function RepartoCard({ pedido, formatMoney }) {
  return (
    <div className={`reparto-card estado-${pedido.estado}`}>
      <div className="reparto-header">
        <div className="reparto-cliente">
          <h3>{pedido.cliente?.nombre || 'Sin cliente'}</h3>
          {pedido.cliente?.direccion && (
            <span className="reparto-direccion">{pedido.cliente.direccion}</span>
          )}
        </div>
      </div>

      <div className="reparto-productos">
        {pedido.detalles?.map(d => (
          <span key={d.id} className="producto-tag">
            {d.cantidad} {d.producto?.unidad} {d.producto?.nombre}
          </span>
        ))}
      </div>

      <div className="reparto-footer">
        <div className="reparto-repartidor">
          {pedido.repartidor ? (
            <span>{pedido.repartidor.nombre}</span>
          ) : (
            <span className="sin-asignar">Sin repartidor</span>
          )}
        </div>
        <div className="reparto-total">
          {formatMoney(pedido.total)}
        </div>
      </div>

      {pedido.notas && (
        <div className="reparto-notas">{pedido.notas}</div>
      )}
    </div>
  );
}

export default RepartosPendientes;
