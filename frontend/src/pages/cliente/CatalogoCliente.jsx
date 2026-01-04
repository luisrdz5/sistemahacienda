import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './CatalogoCliente.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

function CatalogoCliente() {
  const navigate = useNavigate();
  const [productos, setProductos] = useState([]);
  const [carrito, setCarrito] = useState({});
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [creditoInfo, setCreditoInfo] = useState(null);

  useEffect(() => {
    loadProductos();
    loadCredito();
  }, []);

  const loadProductos = async () => {
    try {
      const response = await api.get('/cliente/productos');
      setProductos(response.data);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate('/login-cliente');
      } else {
        setError('Error al cargar productos');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadCredito = async () => {
    try {
      const response = await api.get('/cliente/dashboard');
      setCreditoInfo(response.data.credito);
    } catch (err) {
      console.error('Error loading credito:', err);
    }
  };

  const getImageUrl = (imagenUrl) => {
    if (!imagenUrl) return null;
    if (imagenUrl.startsWith('http')) return imagenUrl;
    return `${API_URL}${imagenUrl}`;
  };

  const handleCantidadChange = (productoId, delta) => {
    setCarrito(prev => {
      const current = prev[productoId] || 0;
      const newValue = Math.max(0, current + delta);

      if (newValue === 0) {
        const { [productoId]: _, ...rest } = prev;
        return rest;
      }

      return { ...prev, [productoId]: newValue };
    });
  };

  const setCantidad = (productoId, cantidad) => {
    const value = parseInt(cantidad) || 0;
    if (value <= 0) {
      const { [productoId]: _, ...rest } = carrito;
      setCarrito(rest);
    } else {
      setCarrito(prev => ({ ...prev, [productoId]: value }));
    }
  };

  const calcularTotal = () => {
    return Object.entries(carrito).reduce((total, [productoId, cantidad]) => {
      const producto = productos.find(p => p.id === parseInt(productoId));
      if (producto) {
        total += producto.precioCliente * cantidad;
      }
      return total;
    }, 0);
  };

  const totalItems = Object.values(carrito).reduce((sum, qty) => sum + qty, 0);
  const totalPedido = calcularTotal();

  const handleConfirmarPedido = () => {
    if (totalItems === 0) return;

    // Verificar crédito disponible
    if (creditoInfo && totalPedido > creditoInfo.disponible) {
      setError(`Crédito insuficiente. Disponible: $${creditoInfo.disponible.toFixed(2)}`);
      return;
    }

    setShowConfirmModal(true);
  };

  const handleEnviarPedido = async () => {
    setEnviando(true);
    setError('');

    const detalles = Object.entries(carrito).map(([productoId, cantidad]) => ({
      productoId: parseInt(productoId),
      cantidad
    }));

    try {
      await api.post('/cliente/pedidos', { detalles });
      setCarrito({});
      setShowConfirmModal(false);
      navigate('/cliente/historial', { state: { message: 'Pedido creado exitosamente' } });
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear pedido');
      setShowConfirmModal(false);
    } finally {
      setEnviando(false);
    }
  };

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="catalogo-cliente loading">
        <div className="loading-spinner"></div>
        <p>Cargando productos...</p>
      </div>
    );
  }

  return (
    <div className="catalogo-cliente">
      {/* Header */}
      <header className="catalogo-header">
        <Link to="/cliente/dashboard" className="back-btn">&larr;</Link>
        <h1>Catálogo</h1>
        {creditoInfo && (
          <div className="credito-badge">
            Disponible: {formatMoney(creditoInfo.disponible)}
          </div>
        )}
      </header>

      {error && (
        <div className="catalogo-error">
          {error}
          <button onClick={() => setError('')}>&times;</button>
        </div>
      )}

      {/* Grid de productos */}
      <div className="productos-grid">
        {productos.map(producto => (
          <div key={producto.id} className={`producto-card ${carrito[producto.id] ? 'en-carrito' : ''}`}>
            <div className="producto-imagen">
              {producto.imagen ? (
                <img src={getImageUrl(producto.imagen)} alt={producto.nombre} />
              ) : (
                <div className="imagen-placeholder">
                  <span>&#128230;</span>
                </div>
              )}
              {producto.tienePrecioEspecial && (
                <span className="precio-especial-badge">Precio especial</span>
              )}
            </div>

            <div className="producto-info">
              <h3>{producto.nombre}</h3>
              <p className="producto-unidad">{producto.unidad}</p>
              <p className="producto-precio">{formatMoney(producto.precioCliente)}</p>
            </div>

            <div className="producto-cantidad">
              {carrito[producto.id] ? (
                <div className="cantidad-control">
                  <button
                    className="btn-cantidad"
                    onClick={() => handleCantidadChange(producto.id, -1)}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={carrito[producto.id] || ''}
                    onChange={(e) => setCantidad(producto.id, e.target.value)}
                    min="0"
                  />
                  <button
                    className="btn-cantidad"
                    onClick={() => handleCantidadChange(producto.id, 1)}
                  >
                    +
                  </button>
                </div>
              ) : (
                <button
                  className="btn-agregar"
                  onClick={() => handleCantidadChange(producto.id, 1)}
                >
                  Agregar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Carrito flotante */}
      {totalItems > 0 && (
        <div className="carrito-flotante">
          <div className="carrito-info">
            <span className="carrito-items">{totalItems} producto{totalItems > 1 ? 's' : ''}</span>
            <span className="carrito-total">{formatMoney(totalPedido)}</span>
          </div>
          <button
            className="btn-confirmar"
            onClick={handleConfirmarPedido}
            disabled={enviando}
          >
            Confirmar Pedido
          </button>
        </div>
      )}

      {/* Modal de confirmación */}
      {showConfirmModal && (
        <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Confirmar Pedido</h2>

            <div className="resumen-pedido">
              {Object.entries(carrito).map(([productoId, cantidad]) => {
                const producto = productos.find(p => p.id === parseInt(productoId));
                if (!producto) return null;
                return (
                  <div key={productoId} className="resumen-item">
                    <span className="item-cantidad">{cantidad}x</span>
                    <span className="item-nombre">{producto.nombre}</span>
                    <span className="item-subtotal">
                      {formatMoney(producto.precioCliente * cantidad)}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="resumen-total">
              <span>Total:</span>
              <span>{formatMoney(totalPedido)}</span>
            </div>

            {creditoInfo && (
              <div className="credito-info-modal">
                <p>Crédito disponible: {formatMoney(creditoInfo.disponible)}</p>
                <p>Después del pedido: {formatMoney(creditoInfo.disponible - totalPedido)}</p>
              </div>
            )}

            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowConfirmModal(false)}
                disabled={enviando}
              >
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                onClick={handleEnviarPedido}
                disabled={enviando}
              >
                {enviando ? 'Enviando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navegación inferior */}
      <nav className="cliente-nav">
        <Link to="/cliente/dashboard" className="nav-item">
          <span className="nav-icon">&#127968;</span>
          <span>Inicio</span>
        </Link>
        <Link to="/cliente/catalogo" className="nav-item active">
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

export default CatalogoCliente;
