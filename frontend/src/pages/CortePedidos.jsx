import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import './CortePedidos.css';

function CortePedidos() {
  const { usuario } = useAuth();
  const [resumen, setResumen] = useState(null);
  const [miCorte, setMiCorte] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);

  const isRepartidor = usuario?.rol === 'repartidor';
  const canSeeAll = usuario?.rol === 'admin' || usuario?.rol === 'administrador_repartidor';

  useEffect(() => {
    cargarDatos();
  }, [fecha]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      if (isRepartidor) {
        // Repartidor solo ve su corte
        const data = await api.get(`/cortes-pedidos/repartidor?fecha=${fecha}`);
        setMiCorte(data);
      } else if (canSeeAll) {
        // Admin ve resumen general
        const data = await api.get(`/cortes-pedidos/resumen-dia?fecha=${fecha}`);
        setResumen(data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizarCorte = async (repartidorId = null) => {
    if (!confirm('¿Finalizar este corte? No podras modificarlo despues.')) return;

    try {
      await api.post('/cortes-pedidos/finalizar', {
        fecha,
        repartidorId: repartidorId || usuario.id
      });
      cargarDatos();
    } catch (error) {
      alert(error.message);
    }
  };

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  if (loading) {
    return <div className="loading">Cargando cortes...</div>;
  }

  // Vista para repartidor
  if (isRepartidor && miCorte) {
    return (
      <div className="page">
        <div className="page-header">
          <h1 className="page-title">Mi Corte del Dia</h1>
        </div>

        <div className="corte-filtros">
          <div className="form-group">
            <label className="form-label">Fecha</label>
            <input
              type="date"
              className="form-input"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>
        </div>

        <div className="corte-resumen-card card">
          <div className="corte-stats">
            <div className="stat">
              <span className="stat-value">{miCorte.resumen.totalPedidos}</span>
              <span className="stat-label">Pedidos</span>
            </div>
            <div className="stat">
              <span className="stat-value success">{miCorte.resumen.pedidosEntregados}</span>
              <span className="stat-label">Entregados</span>
            </div>
            <div className="stat">
              <span className="stat-value warning">{miCorte.resumen.pedidosPendientes}</span>
              <span className="stat-label">Pendientes</span>
            </div>
            <div className="stat">
              <span className="stat-value primary">{formatMoney(miCorte.resumen.totalMonto)}</span>
              <span className="stat-label">Total Entregado</span>
            </div>
          </div>

          {miCorte.corte?.estado === 'completado' ? (
            <div className="corte-estado completado">
              Corte finalizado
            </div>
          ) : (
            <button
              className="btn btn-primary btn-block"
              onClick={() => handleFinalizarCorte()}
              disabled={miCorte.resumen.pedidosPendientes > 0}
            >
              {miCorte.resumen.pedidosPendientes > 0
                ? `Hay ${miCorte.resumen.pedidosPendientes} pendientes`
                : 'Finalizar Mi Corte'
              }
            </button>
          )}
        </div>

        <div className="corte-pedidos">
          <h2>Mis Pedidos del Dia</h2>
          {miCorte.pedidos.length === 0 ? (
            <p className="empty-message">No tienes pedidos asignados</p>
          ) : (
            miCorte.pedidos.map(pedido => (
              <PedidoItem key={pedido.id} pedido={pedido} formatMoney={formatMoney} />
            ))
          )}
        </div>
      </div>
    );
  }

  // Vista para admin/admin repartidor
  if (canSeeAll && resumen) {
    return (
      <div className="page">
        <div className="page-header">
          <h1 className="page-title">Cortes de Pedidos</h1>
        </div>

        <div className="corte-filtros">
          <div className="form-group">
            <label className="form-label">Fecha</label>
            <input
              type="date"
              className="form-input"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>
        </div>

        <div className="corte-resumen-general card">
          <h2>Resumen General</h2>
          <div className="corte-stats">
            <div className="stat">
              <span className="stat-value">{resumen.totalPedidos}</span>
              <span className="stat-label">Total Pedidos</span>
            </div>
            <div className="stat">
              <span className="stat-value success">{resumen.pedidosEntregados}</span>
              <span className="stat-label">Entregados</span>
            </div>
            <div className="stat">
              <span className="stat-value warning">{resumen.pedidosPendientes}</span>
              <span className="stat-label">Pendientes</span>
            </div>
            <div className="stat">
              <span className="stat-value primary">{formatMoney(resumen.montoEntregado)}</span>
              <span className="stat-label">Monto Entregado</span>
            </div>
          </div>
        </div>

        <div className="cortes-repartidores">
          <h2>Por Repartidor</h2>
          <div className="repartidores-grid">
            {resumen.porRepartidor.map(rep => {
              const corte = resumen.cortes.find(c => c.repartidorId === rep.repartidor.id);
              return (
                <div key={rep.repartidor.id} className="repartidor-card card">
                  <div className="repartidor-header">
                    <h3>{rep.repartidor.nombre}</h3>
                    {corte?.estado === 'completado' ? (
                      <span className="badge badge-success">Cerrado</span>
                    ) : (
                      <span className="badge badge-warning">Abierto</span>
                    )}
                  </div>

                  <div className="repartidor-stats">
                    <div className="repartidor-stat">
                      <span>{rep.entregados}/{rep.total}</span>
                      <span className="stat-label">Entregados</span>
                    </div>
                    <div className="repartidor-stat">
                      <span className="primary">{formatMoney(rep.montoEntregado)}</span>
                      <span className="stat-label">Monto</span>
                    </div>
                  </div>

                  {corte?.estado !== 'completado' && rep.total - rep.entregados === 0 && (
                    <button
                      className="btn btn-secondary btn-sm btn-block"
                      onClick={() => handleFinalizarCorte(rep.repartidor.id)}
                    >
                      Cerrar Corte
                    </button>
                  )}
                </div>
              );
            })}

            {resumen.sinAsignar.total > 0 && (
              <div className="repartidor-card card sin-asignar">
                <div className="repartidor-header">
                  <h3>Sin Asignar</h3>
                  <span className="badge badge-error">{resumen.sinAsignar.total}</span>
                </div>
                <p className="text-muted">Pedidos sin repartidor asignado</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return <div className="page"><p>No tienes acceso a esta seccion</p></div>;
}

function PedidoItem({ pedido, formatMoney }) {
  const getEstadoBadge = (estado) => {
    const badges = {
      pendiente: 'badge-warning',
      entregado: 'badge-success',
      cancelado: 'badge-error'
    };
    return badges[estado] || 'badge-secondary';
  };

  return (
    <div className={`pedido-corte-item estado-${pedido.estado}`}>
      <div className="pedido-info">
        <strong>{pedido.cliente?.nombre || 'Sin cliente'}</strong>
        <span className={`badge ${getEstadoBadge(pedido.estado)}`}>{pedido.estado}</span>
      </div>
      <div className="pedido-detalles-mini">
        {pedido.detalles?.map(d => (
          <span key={d.id}>{d.cantidad} {d.producto?.nombre}</span>
        ))}
      </div>
      <div className="pedido-total">{formatMoney(pedido.total)}</div>
    </div>
  );
}

export default CortePedidos;
