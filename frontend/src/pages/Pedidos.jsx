import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import './Pedidos.css';

function Pedidos() {
  const { usuario } = useAuth();
  const [pedidos, setPedidos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [repartidores, setRepartidores] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPedido, setEditingPedido] = useState(null);
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroRepartidor, setFiltroRepartidor] = useState('');

  const isAdmin = usuario?.rol === 'admin';
  const isAdminRepartidor = usuario?.rol === 'administrador_repartidor';
  const canManageAll = isAdmin || isAdminRepartidor;

  useEffect(() => {
    cargarDatosBase();
  }, []);

  useEffect(() => {
    cargarPedidos();
  }, [fecha, filtroEstado, filtroRepartidor]);

  const cargarDatosBase = async () => {
    try {
      const [clientesData, productosData, repartidoresData] = await Promise.all([
        api.get('/clientes?activo=true'),
        api.get('/productos?activo=true'),
        api.get('/pedidos/repartidores')
      ]);
      setClientes(clientesData);
      setProductos(productosData);
      setRepartidores(repartidoresData);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const cargarPedidos = async () => {
    setLoading(true);
    try {
      let params = `?fecha=${fecha}`;
      if (filtroEstado) params += `&estado=${filtroEstado}`;
      if (filtroRepartidor) params += `&repartidorId=${filtroRepartidor}`;

      const [pedidosData, resumenData] = await Promise.all([
        api.get(`/pedidos${params}`),
        api.get(`/pedidos/resumen-dia?fecha=${fecha}`)
      ]);
      setPedidos(pedidosData);
      setResumen(resumenData);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (pedidoData) => {
    try {
      if (editingPedido) {
        await api.put(`/pedidos/${editingPedido.id}`, pedidoData);
      } else {
        await api.post('/pedidos', { ...pedidoData, fecha });
      }
      setShowForm(false);
      setEditingPedido(null);
      cargarPedidos();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleEdit = (pedido) => {
    setEditingPedido(pedido);
    setShowForm(true);
  };

  const handleEntregar = async (pedido) => {
    try {
      await api.put(`/pedidos/${pedido.id}/entregar`);
      cargarPedidos();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleCancelar = async (pedido) => {
    if (!confirm('¿Cancelar este pedido?')) return;
    try {
      await api.put(`/pedidos/${pedido.id}/cancelar`);
      cargarPedidos();
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

  const getEstadoBadge = (estado) => {
    const badges = {
      pendiente: 'badge-warning',
      entregado: 'badge-success',
      cancelado: 'badge-error'
    };
    return badges[estado] || 'badge-secondary';
  };

  if (loading && pedidos.length === 0) {
    return <div className="loading">Cargando pedidos...</div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Pedidos</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          + Nuevo Pedido
        </button>
      </div>

      {resumen && (
        <div className="pedidos-resumen">
          <div className="resumen-card">
            <span className="resumen-label">Total</span>
            <span className="resumen-value">{resumen.totalPedidos}</span>
          </div>
          <div className="resumen-card">
            <span className="resumen-label">Pendientes</span>
            <span className="resumen-value warning">{resumen.pedidosPendientes}</span>
          </div>
          <div className="resumen-card">
            <span className="resumen-label">Entregados</span>
            <span className="resumen-value success">{resumen.pedidosEntregados}</span>
          </div>
          <div className="resumen-card">
            <span className="resumen-label">Monto Entregado</span>
            <span className="resumen-value">{formatMoney(resumen.montoEntregado)}</span>
          </div>
        </div>
      )}

      <div className="pedidos-filtros">
        <div className="form-group">
          <label className="form-label">Fecha</label>
          <input
            type="date"
            className="form-input"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Estado</label>
          <select
            className="form-input"
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
          >
            <option value="">Todos</option>
            <option value="pendiente">Pendientes</option>
            <option value="entregado">Entregados</option>
            <option value="cancelado">Cancelados</option>
          </select>
        </div>

        {canManageAll && (
          <div className="form-group">
            <label className="form-label">Repartidor</label>
            <select
              className="form-input"
              value={filtroRepartidor}
              onChange={(e) => setFiltroRepartidor(e.target.value)}
            >
              <option value="">Todos</option>
              {repartidores.map(r => (
                <option key={r.id} value={r.id}>{r.nombre}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="pedidos-lista">
        {pedidos.length === 0 ? (
          <p className="empty-message">No hay pedidos para esta fecha</p>
        ) : (
          pedidos.map(pedido => (
            <div key={pedido.id} className={`pedido-card card estado-${pedido.estado}`}>
              <div className="pedido-header">
                <div className="pedido-info">
                  <h3>{pedido.cliente?.nombre || 'Sin cliente'}</h3>
                  <span className={`badge ${getEstadoBadge(pedido.estado)}`}>
                    {pedido.estado}
                  </span>
                </div>
                <div className="pedido-total">{formatMoney(pedido.total)}</div>
              </div>

              <div className="pedido-detalles">
                {pedido.detalles?.map(d => (
                  <div key={d.id} className="detalle-item">
                    <span>{d.cantidad} {d.producto?.unidad} {d.producto?.nombre}</span>
                    <span>{formatMoney(d.subtotal)}</span>
                  </div>
                ))}
              </div>

              {pedido.repartidor && (
                <div className="pedido-repartidor">
                  Repartidor: {pedido.repartidor.nombre}
                </div>
              )}

              {pedido.notas && (
                <div className="pedido-notas">{pedido.notas}</div>
              )}

              <div className="pedido-actions">
                {pedido.estado === 'pendiente' && (
                  <>
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => handleEntregar(pedido)}
                    >
                      Entregar
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleEdit(pedido)}
                    >
                      Editar
                    </button>
                    {canManageAll && (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleCancelar(pedido)}
                      >
                        Cancelar
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {showForm && (
        <PedidoForm
          pedido={editingPedido}
          clientes={clientes}
          productos={productos}
          repartidores={repartidores}
          onSubmit={handleSubmit}
          onClose={() => {
            setShowForm(false);
            setEditingPedido(null);
          }}
        />
      )}
    </div>
  );
}

function PedidoForm({ pedido, clientes, productos, repartidores, onSubmit, onClose }) {
  const [clienteId, setClienteId] = useState(pedido?.clienteId || '');
  const [repartidorId, setRepartidorId] = useState(pedido?.repartidorId || '');
  const [notas, setNotas] = useState(pedido?.notas || '');
  const [detalles, setDetalles] = useState([]);
  const [searchCliente, setSearchCliente] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (pedido?.detalles) {
      setDetalles(pedido.detalles.map(d => ({
        productoId: d.productoId,
        cantidad: parseFloat(d.cantidad),
        precioUnitario: parseFloat(d.precioUnitario)
      })));
    } else {
      // Inicializar con todos los productos en 0
      setDetalles(productos.map(p => ({
        productoId: p.id,
        cantidad: 0,
        precioUnitario: parseFloat(p.precioLista)
      })));
    }
  }, [pedido, productos]);

  // Actualizar precios cuando cambia el cliente
  useEffect(() => {
    const actualizarPrecios = async () => {
      if (!clienteId) {
        // Usar precios de lista
        setDetalles(prev => prev.map(d => {
          const producto = productos.find(p => p.id === d.productoId);
          return { ...d, precioUnitario: parseFloat(producto?.precioLista || 0) };
        }));
      } else {
        // Obtener precios del cliente
        const cliente = clientes.find(c => c.id === parseInt(clienteId));
        if (cliente) {
          setDetalles(prev => prev.map(d => {
            const precioCliente = cliente.precios?.find(p => p.productoId === d.productoId);
            const producto = productos.find(p => p.id === d.productoId);
            return {
              ...d,
              precioUnitario: precioCliente
                ? parseFloat(precioCliente.precio)
                : parseFloat(producto?.precioLista || 0)
            };
          }));
        }
      }
    };
    actualizarPrecios();
  }, [clienteId, clientes, productos]);

  const handleCantidadChange = (productoId, cantidad) => {
    setDetalles(prev => prev.map(d =>
      d.productoId === productoId
        ? { ...d, cantidad: parseFloat(cantidad) || 0 }
        : d
    ));
  };

  const calcularTotal = () => {
    return detalles.reduce((sum, d) => sum + (d.cantidad * d.precioUnitario), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const detallesConCantidad = detalles.filter(d => d.cantidad > 0);
    if (detallesConCantidad.length === 0) {
      alert('Agrega al menos un producto');
      return;
    }

    setLoading(true);
    await onSubmit({
      clienteId: clienteId || null,
      repartidorId: repartidorId || null,
      notas: notas || null,
      detalles: detallesConCantidad.map(d => ({
        productoId: d.productoId,
        cantidad: d.cantidad
      }))
    });
    setLoading(false);
  };

  const clientesFiltrados = clientes.filter(c =>
    c.nombre.toLowerCase().includes(searchCliente.toLowerCase())
  ).slice(0, 10);

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{pedido ? 'Editar Pedido' : 'Nuevo Pedido'}</h3>
          <button className="modal-close" onClick={onClose}>x</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-content">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Cliente</label>
              <input
                type="text"
                className="form-input"
                placeholder="Buscar cliente..."
                value={searchCliente}
                onChange={(e) => setSearchCliente(e.target.value)}
              />
              {searchCliente && (
                <div className="cliente-dropdown">
                  <div
                    className="cliente-option"
                    onClick={() => {
                      setClienteId('');
                      setSearchCliente('Sin cliente (precio lista)');
                    }}
                  >
                    Sin cliente (precio lista)
                  </div>
                  {clientesFiltrados.map(c => (
                    <div
                      key={c.id}
                      className="cliente-option"
                      onClick={() => {
                        setClienteId(c.id);
                        setSearchCliente(c.nombre);
                      }}
                    >
                      {c.nombre}
                      {c.direccion && <span className="cliente-direccion">{c.direccion}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Repartidor</label>
              <select
                className="form-input"
                value={repartidorId}
                onChange={(e) => setRepartidorId(e.target.value)}
              >
                <option value="">Sin asignar</option>
                {repartidores.map(r => (
                  <option key={r.id} value={r.id}>{r.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="productos-pedido">
            <h4>Productos</h4>
            <div className="productos-grid">
              {productos.map(producto => {
                const detalle = detalles.find(d => d.productoId === producto.id);
                return (
                  <div key={producto.id} className="producto-pedido-item">
                    <div className="producto-info">
                      <span className="producto-nombre">{producto.nombre}</span>
                      <span className="producto-precio">
                        {formatMoney(detalle?.precioUnitario || producto.precioLista)}/{producto.unidad}
                      </span>
                    </div>
                    <div className="producto-cantidad">
                      <button
                        type="button"
                        className="btn-cantidad"
                        onClick={() => handleCantidadChange(producto.id, (detalle?.cantidad || 0) - 1)}
                        disabled={!detalle?.cantidad}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        className="cantidad-input"
                        value={detalle?.cantidad || 0}
                        onChange={(e) => handleCantidadChange(producto.id, e.target.value)}
                        min="0"
                        step="0.5"
                      />
                      <button
                        type="button"
                        className="btn-cantidad"
                        onClick={() => handleCantidadChange(producto.id, (detalle?.cantidad || 0) + 1)}
                      >
                        +
                      </button>
                    </div>
                    {detalle?.cantidad > 0 && (
                      <div className="producto-subtotal">
                        {formatMoney(detalle.cantidad * detalle.precioUnitario)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Notas</label>
            <textarea
              className="form-input"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Notas del pedido..."
              rows={2}
            />
          </div>

          <div className="pedido-total-form">
            <span>Total:</span>
            <strong>{formatMoney(calcularTotal())}</strong>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Pedido'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Pedidos;
