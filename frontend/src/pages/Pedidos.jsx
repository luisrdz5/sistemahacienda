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
  const isEncargado = usuario?.rol === 'encargado';
  const isRepartidor = usuario?.rol === 'repartidor';
  const canManageAll = isAdmin || isAdminRepartidor;
  const canEdit = isAdmin || isAdminRepartidor || isEncargado;

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
      cargarDatosBase(); // Recargar clientes por si se agregó uno nuevo
    } catch (error) {
      alert(error.message);
    }
  };

  const handleEdit = (pedido) => {
    setEditingPedido(pedido);
    setShowForm(true);
  };

  const handleDespachar = async (pedido) => {
    try {
      await api.put(`/pedidos/${pedido.id}/despachar`);
      cargarPedidos();
    } catch (error) {
      alert(error.message);
    }
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
      en_camino: 'badge-info',
      entregado: 'badge-success',
      cancelado: 'badge-error'
    };
    return badges[estado] || 'badge-secondary';
  };

  const getEstadoLabel = (estado) => {
    const labels = {
      pendiente: 'Pendiente',
      en_camino: 'En Camino',
      entregado: 'Entregado',
      cancelado: 'Cancelado'
    };
    return labels[estado] || estado;
  };

  if (loading && pedidos.length === 0) {
    return <div className="loading">Cargando pedidos...</div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Pedidos</h1>
        {canEdit && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            + Nuevo Pedido
          </button>
        )}
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
            <span className="resumen-label">En Camino</span>
            <span className="resumen-value info">{resumen.pedidosEnCamino || 0}</span>
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
            <option value="en_camino">En Camino</option>
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
                    {getEstadoLabel(pedido.estado)}
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
                      className="btn btn-info btn-sm"
                      onClick={() => handleDespachar(pedido)}
                    >
                      Despachar
                    </button>
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => handleEntregar(pedido)}
                    >
                      Entregar
                    </button>
                    {canEdit && (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleEdit(pedido)}
                      >
                        Editar
                      </button>
                    )}
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
                {pedido.estado === 'en_camino' && (
                  <button
                    className="btn btn-success btn-sm"
                    onClick={() => handleEntregar(pedido)}
                  >
                    Marcar Entregado
                  </button>
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
          onClienteCreated={(nuevoCliente) => {
            setClientes(prev => [...prev, nuevoCliente]);
          }}
        />
      )}
    </div>
  );
}

function PedidoForm({ pedido, clientes, productos, repartidores, onSubmit, onClose, onClienteCreated }) {
  const [clienteId, setClienteId] = useState(pedido?.clienteId || '');
  const [repartidorId, setRepartidorId] = useState(pedido?.repartidorId || '');
  const [notas, setNotas] = useState(pedido?.notas || '');
  const [detalles, setDetalles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showNuevoCliente, setShowNuevoCliente] = useState(false);
  const [nuevoClienteNombre, setNuevoClienteNombre] = useState('');
  const [nuevoClienteTelefono, setNuevoClienteTelefono] = useState('');
  const [nuevoClienteDireccion, setNuevoClienteDireccion] = useState('');
  const [creandoCliente, setCreandoCliente] = useState(false);

  useEffect(() => {
    if (pedido?.detalles) {
      setDetalles(pedido.detalles.map(d => ({
        productoId: d.productoId,
        cantidad: parseFloat(d.cantidad),
        precioUnitario: parseFloat(d.precioUnitario)
      })));
    } else {
      setDetalles(productos.map(p => ({
        productoId: p.id,
        cantidad: 0,
        precioUnitario: parseFloat(p.precioLista)
      })));
    }
  }, [pedido, productos]);

  useEffect(() => {
    const actualizarPrecios = async () => {
      if (!clienteId) {
        setDetalles(prev => prev.map(d => {
          const producto = productos.find(p => p.id === d.productoId);
          return { ...d, precioUnitario: parseFloat(producto?.precioLista || 0) };
        }));
      } else {
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

  const handleCrearCliente = async () => {
    if (!nuevoClienteNombre.trim()) {
      alert('El nombre del cliente es requerido');
      return;
    }

    setCreandoCliente(true);
    try {
      const nuevoCliente = await api.post('/clientes', {
        nombre: nuevoClienteNombre.trim(),
        telefono: nuevoClienteTelefono.trim() || null,
        direccion: nuevoClienteDireccion.trim() || null
      });

      onClienteCreated(nuevoCliente);
      setClienteId(nuevoCliente.id);
      setShowNuevoCliente(false);
      setNuevoClienteNombre('');
      setNuevoClienteTelefono('');
      setNuevoClienteDireccion('');
    } catch (error) {
      alert(error.message);
    } finally {
      setCreandoCliente(false);
    }
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

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const clienteSeleccionado = clientes.find(c => c.id === parseInt(clienteId));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{pedido ? 'Editar Pedido' : 'Nuevo Pedido'}</h3>
          <button className="modal-close" onClick={onClose}>x</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-content">
          <div className="form-row">
            <div className="form-group form-group-cliente">
              <label className="form-label">Cliente</label>
              <div className="cliente-selector">
                <select
                  className="form-input"
                  value={clienteId}
                  onChange={(e) => setClienteId(e.target.value)}
                >
                  <option value="">Sin cliente (precio lista)</option>
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowNuevoCliente(!showNuevoCliente)}
                  title="Agregar nuevo cliente"
                >
                  +
                </button>
              </div>
              {clienteSeleccionado?.direccion && (
                <span className="cliente-direccion-hint">{clienteSeleccionado.direccion}</span>
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

          {showNuevoCliente && (
            <div className="nuevo-cliente-form">
              <h4>Nuevo Cliente</h4>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Nombre *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={nuevoClienteNombre}
                    onChange={(e) => setNuevoClienteNombre(e.target.value)}
                    placeholder="Nombre del cliente"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Telefono</label>
                  <input
                    type="text"
                    className="form-input"
                    value={nuevoClienteTelefono}
                    onChange={(e) => setNuevoClienteTelefono(e.target.value)}
                    placeholder="Telefono"
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Direccion</label>
                <input
                  type="text"
                  className="form-input"
                  value={nuevoClienteDireccion}
                  onChange={(e) => setNuevoClienteDireccion(e.target.value)}
                  placeholder="Direccion"
                />
              </div>
              <div className="nuevo-cliente-actions">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowNuevoCliente(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleCrearCliente}
                  disabled={creandoCliente}
                >
                  {creandoCliente ? 'Creando...' : 'Crear Cliente'}
                </button>
              </div>
            </div>
          )}

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
