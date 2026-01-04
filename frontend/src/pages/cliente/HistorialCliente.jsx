import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import './HistorialCliente.css';

function HistorialCliente() {
  const navigate = useNavigate();
  const location = useLocation();
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [pedidoExpandido, setPedidoExpandido] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });

  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Limpiar el state para que no se muestre de nuevo
      window.history.replaceState({}, document.title);
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  }, [location]);

  useEffect(() => {
    loadPedidos();
  }, [filtroEstado, pagination.page]);

  const loadPedidos = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filtroEstado) params.append('estado', filtroEstado);
      params.append('page', pagination.page);
      params.append('limit', 20);

      const response = await api.get(`/cliente/pedidos?${params.toString()}`);
      setPedidos(response.data.pedidos);
      setPagination(response.data.pagination);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate('/login-cliente');
      } else {
        setError('Error al cargar pedidos');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelarPedido = async (pedidoId) => {
    if (!window.confirm('¿Estás seguro de cancelar este pedido?')) return;

    try {
      await api.delete(`/cliente/pedidos/${pedidoId}`);
      setSuccessMessage('Pedido cancelado');
      loadPedidos();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cancelar pedido');
    }
  };

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount || 0);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEstadoColor = (estado) => {
    const colors = {
      pendiente: '#f59e0b',
      preparado: '#3b82f6',
      en_camino: '#8b5cf6',
      entregado: '#10b981',
      cancelado: '#ef4444'
    };
    return colors[estado] || '#6b7280';
  };

  const getEstadoLabel = (estado) => {
    const labels = {
      pendiente: 'Pendiente',
      preparado: 'Preparado',
      en_camino: 'En camino',
      entregado: 'Entregado',
      cancelado: 'Cancelado'
    };
    return labels[estado] || estado;
  };

  const getEstadoIcon = (estado) => {
    const icons = {
      pendiente: '&#128337;',
      preparado: '&#128230;',
      en_camino: '&#128666;',
      entregado: '&#9989;',
      cancelado: '&#10060;'
    };
    return icons[estado] || '&#128196;';
  };

  return (
    <div className="historial-cliente">
      {/* Header */}
      <header className="historial-header">
        <Link to="/cliente/dashboard" className="back-btn">&larr;</Link>
        <h1>Mis Pedidos</h1>
      </header>

      {/* Mensajes */}
      {successMessage && (
        <div className="success-message">{successMessage}</div>
      )}
      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError('')}>&times;</button>
        </div>
      )}

      {/* Filtros */}
      <div className="filtros-container">
        <select
          value={filtroEstado}
          onChange={(e) => {
            setFiltroEstado(e.target.value);
            setPagination(prev => ({ ...prev, page: 1 }));
          }}
        >
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendientes</option>
          <option value="preparado">Preparados</option>
          <option value="en_camino">En camino</option>
          <option value="entregado">Entregados</option>
          <option value="cancelado">Cancelados</option>
        </select>
      </div>

      {/* Lista de pedidos */}
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando pedidos...</p>
        </div>
      ) : pedidos.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">&#128722;</span>
          <p>No tienes pedidos {filtroEstado ? `${getEstadoLabel(filtroEstado).toLowerCase()}s` : ''}</p>
          <Link to="/cliente/catalogo" className="btn btn-primary">Hacer un pedido</Link>
        </div>
      ) : (
        <div className="pedidos-lista">
          {pedidos.map(pedido => (
            <div
              key={pedido.id}
              className={`pedido-item ${pedidoExpandido === pedido.id ? 'expandido' : ''}`}
            >
              <div
                className="pedido-header"
                onClick={() => setPedidoExpandido(pedidoExpandido === pedido.id ? null : pedido.id)}
              >
                <div className="pedido-info">
                  <span className="pedido-numero">Pedido #{pedido.id}</span>
                  <span className="pedido-fecha">{formatDate(pedido.fecha)}</span>
                </div>
                <div className="pedido-estado-badge" style={{ backgroundColor: getEstadoColor(pedido.estado) }}>
                  <span dangerouslySetInnerHTML={{ __html: getEstadoIcon(pedido.estado) }}></span>
                  {getEstadoLabel(pedido.estado)}
                </div>
              </div>

              <div className="pedido-resumen">
                <div className="productos-preview">
                  {pedido.detalles?.slice(0, 2).map((d, i) => (
                    <span key={i}>{d.cantidad}x {d.producto?.nombre}</span>
                  ))}
                  {pedido.detalles?.length > 2 && (
                    <span className="mas">+{pedido.detalles.length - 2} más</span>
                  )}
                </div>
                <div className="pedido-totales">
                  <span className="total">{formatMoney(pedido.total)}</span>
                  {pedido.saldoPendiente > 0 && (
                    <span className="pendiente">Debe: {formatMoney(pedido.saldoPendiente)}</span>
                  )}
                </div>
              </div>

              {/* Detalle expandido */}
              {pedidoExpandido === pedido.id && (
                <div className="pedido-detalle">
                  <div className="detalle-productos">
                    <h4>Productos</h4>
                    {pedido.detalles?.map((d, i) => (
                      <div key={i} className="detalle-item">
                        <span className="item-cantidad">{d.cantidad}x</span>
                        <span className="item-nombre">{d.producto?.nombre}</span>
                        <span className="item-precio">{formatMoney(d.subtotal)}</span>
                      </div>
                    ))}
                  </div>

                  {pedido.abonos?.length > 0 && (
                    <div className="detalle-abonos">
                      <h4>Pagos realizados</h4>
                      {pedido.abonos.map((a, i) => (
                        <div key={i} className="abono-item">
                          <span>{formatDate(a.fecha)} {formatTime(a.fecha)}</span>
                          <span>{formatMoney(a.monto)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="detalle-totales">
                    <div className="total-row">
                      <span>Total:</span>
                      <span>{formatMoney(pedido.total)}</span>
                    </div>
                    <div className="total-row">
                      <span>Pagado:</span>
                      <span>{formatMoney(pedido.montoPagado)}</span>
                    </div>
                    {pedido.saldoPendiente > 0 && (
                      <div className="total-row pendiente">
                        <span>Pendiente:</span>
                        <span>{formatMoney(pedido.saldoPendiente)}</span>
                      </div>
                    )}
                  </div>

                  {pedido.estado === 'pendiente' && (
                    <div className="detalle-acciones">
                      <button
                        className="btn btn-danger"
                        onClick={() => handleCancelarPedido(pedido.id)}
                      >
                        Cancelar pedido
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Paginación */}
      {pagination.totalPages > 1 && (
        <div className="paginacion">
          <button
            disabled={pagination.page === 1}
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
          >
            Anterior
          </button>
          <span>Página {pagination.page} de {pagination.totalPages}</span>
          <button
            disabled={pagination.page === pagination.totalPages}
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
          >
            Siguiente
          </button>
        </div>
      )}

      {/* Navegación inferior */}
      <nav className="cliente-nav">
        <Link to="/cliente/dashboard" className="nav-item">
          <span className="nav-icon">&#127968;</span>
          <span>Inicio</span>
        </Link>
        <Link to="/cliente/catalogo" className="nav-item">
          <span className="nav-icon">&#128722;</span>
          <span>Catálogo</span>
        </Link>
        <Link to="/cliente/historial" className="nav-item active">
          <span className="nav-icon">&#128203;</span>
          <span>Pedidos</span>
        </Link>
        <Link to="/cliente/perfil" className="nav-item">
          <span className="nav-icon">&#128100;</span>
          <span>Perfil</span>
        </Link>
      </nav>
    </div>
  );
}

export default HistorialCliente;
