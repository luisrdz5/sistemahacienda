import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './DashboardCliente.css';

function DashboardCliente() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await api.get('/cliente/dashboard');
      setDashboard(response.data);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login-cliente');
      } else {
        setError('Error al cargar el dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login-cliente');
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
      month: 'short'
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

  if (loading) {
    return (
      <div className="cliente-dashboard loading">
        <div className="loading-spinner"></div>
        <p>Cargando...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cliente-dashboard error">
        <p>{error}</p>
        <button onClick={loadDashboard} className="btn btn-primary">Reintentar</button>
      </div>
    );
  }

  const creditoPorcentaje = dashboard?.credito?.porcentajeUsado || 0;

  return (
    <div className="cliente-dashboard">
      {/* Header */}
      <header className="cliente-header">
        <div className="header-info">
          <h1>Hola, {dashboard?.cliente?.nombre}</h1>
          <p>{dashboard?.cliente?.sucursal?.nombre || 'Sin sucursal asignada'}</p>
        </div>
        <button onClick={handleLogout} className="btn-logout">Salir</button>
      </header>

      {/* Alerta de adeudo */}
      {dashboard?.credito?.adeudo > 0 && (
        <div className="adeudo-alert">
          <div className="alert-icon">!</div>
          <div className="alert-content">
            <strong>Tienes un adeudo pendiente</strong>
            <span className="adeudo-monto">{formatMoney(dashboard.credito.adeudo)}</span>
          </div>
          <Link to="/cliente/adeudo" className="btn-ver-detalle">Ver detalle</Link>
        </div>
      )}

      {/* Tarjetas de crédito */}
      <div className="credito-cards">
        <div className="credito-card disponible">
          <span className="credito-label">Crédito disponible</span>
          <span className="credito-valor">{formatMoney(dashboard?.credito?.disponible)}</span>
          <div className="credito-bar">
            <div
              className="credito-bar-fill"
              style={{ width: `${Math.min(creditoPorcentaje, 100)}%` }}
            ></div>
          </div>
          <span className="credito-info">
            {formatMoney(dashboard?.credito?.adeudo)} de {formatMoney(dashboard?.credito?.limite)} usado
          </span>
        </div>

        <div className="credito-card estadisticas">
          <div className="stat-item">
            <span className="stat-valor">{dashboard?.estadisticas?.pedidosEsteMes || 0}</span>
            <span className="stat-label">Pedidos este mes</span>
          </div>
          <div className="stat-item">
            <span className="stat-valor">{formatMoney(dashboard?.estadisticas?.totalGastadoMes)}</span>
            <span className="stat-label">Total gastado</span>
          </div>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="acciones-rapidas">
        <Link to="/cliente/catalogo" className="accion-card nuevo-pedido">
          <span className="accion-icon">+</span>
          <span className="accion-label">Nuevo Pedido</span>
        </Link>
        <Link to="/cliente/historial" className="accion-card historial">
          <span className="accion-icon">&#128203;</span>
          <span className="accion-label">Mis Pedidos</span>
        </Link>
      </div>

      {/* Últimos pedidos */}
      <section className="ultimos-pedidos">
        <div className="section-header">
          <h2>Últimos pedidos</h2>
          <Link to="/cliente/historial">Ver todos</Link>
        </div>

        {dashboard?.ultimosPedidos?.length === 0 ? (
          <div className="empty-state">
            <p>No tienes pedidos aún</p>
            <Link to="/cliente/catalogo" className="btn btn-primary">Hacer mi primer pedido</Link>
          </div>
        ) : (
          <div className="pedidos-list">
            {dashboard?.ultimosPedidos?.map(pedido => (
              <div key={pedido.id} className="pedido-card">
                <div className="pedido-header">
                  <span className="pedido-fecha">{formatDate(pedido.fecha)}</span>
                  <span
                    className="pedido-estado"
                    style={{ backgroundColor: getEstadoColor(pedido.estado) }}
                  >
                    {getEstadoLabel(pedido.estado)}
                  </span>
                </div>
                <div className="pedido-productos">
                  {pedido.detalles?.slice(0, 3).map((d, i) => (
                    <span key={i}>{d.cantidad}x {d.producto}</span>
                  ))}
                  {pedido.detalles?.length > 3 && (
                    <span className="mas-productos">+{pedido.detalles.length - 3} más</span>
                  )}
                </div>
                <div className="pedido-footer">
                  <span className="pedido-total">{formatMoney(pedido.total)}</span>
                  {pedido.saldoPendiente > 0 && (
                    <span className="pedido-pendiente">
                      Pendiente: {formatMoney(pedido.saldoPendiente)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Pedidos con adeudo */}
      {dashboard?.pedidosConAdeudo?.length > 0 && (
        <section className="pedidos-adeudo">
          <div className="section-header">
            <h2>Pedidos pendientes de pago</h2>
          </div>
          <div className="adeudo-list">
            {dashboard.pedidosConAdeudo.map(pedido => (
              <div key={pedido.id} className="adeudo-item">
                <span className="adeudo-fecha">{formatDate(pedido.fecha)}</span>
                <span className="adeudo-pendiente">{formatMoney(pedido.saldoPendiente)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Navegación inferior */}
      <nav className="cliente-nav">
        <Link to="/cliente/dashboard" className="nav-item active">
          <span className="nav-icon">&#127968;</span>
          <span>Inicio</span>
        </Link>
        <Link to="/cliente/catalogo" className="nav-item">
          <span className="nav-icon">&#128722;</span>
          <span>Catálogo</span>
        </Link>
        <Link to="/cliente/historial" className="nav-item">
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

export default DashboardCliente;
