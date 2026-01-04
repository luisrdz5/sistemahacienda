import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './ModalPago.css';

function ModalPago({ onClose, onPagoRegistrado, clienteInicial = null }) {
  const [clientes, setClientes] = useState([]);
  const [clienteId, setClienteId] = useState(clienteInicial || '');
  const [resumenCliente, setResumenCliente] = useState(null);
  const [monto, setMonto] = useState('');
  const [tipo, setTipo] = useState('efectivo');
  const [notas, setNotas] = useState('');
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingClientes, setLoadingClientes] = useState(true);
  const [loadingResumen, setLoadingResumen] = useState(false);
  const [error, setError] = useState('');
  const [resultado, setResultado] = useState(null);

  // Cargar clientes con deuda
  useEffect(() => {
    const cargarClientes = async () => {
      try {
        setLoadingClientes(true);
        const data = await api.get('/pagos/clientes-deuda');
        setClientes(data);
      } catch (err) {
        console.error('Error cargando clientes:', err);
      } finally {
        setLoadingClientes(false);
      }
    };
    cargarClientes();
  }, []);

  // Cargar resumen del cliente seleccionado
  useEffect(() => {
    if (!clienteId) {
      setResumenCliente(null);
      return;
    }

    const cargarResumen = async () => {
      try {
        setLoadingResumen(true);
        const data = await api.get(`/pagos/cliente/${clienteId}/resumen`);
        setResumenCliente(data);
        setPedidoSeleccionado(''); // Reset pedido seleccionado
      } catch (err) {
        console.error('Error cargando resumen:', err);
      } finally {
        setLoadingResumen(false);
      }
    };
    cargarResumen();
  }, [clienteId]);

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount || 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResultado(null);

    if (!clienteId) {
      setError('Selecciona un cliente');
      return;
    }

    const montoNum = parseFloat(monto);
    if (!montoNum || montoNum <= 0) {
      setError('El monto debe ser mayor a 0');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        clienteId: parseInt(clienteId),
        monto: montoNum,
        tipo,
        notas: notas || null
      };

      if (pedidoSeleccionado) {
        payload.pedidoId = parseInt(pedidoSeleccionado);
      }

      const response = await api.post('/pagos', payload);
      setResultado(response);

      // Limpiar formulario después de éxito
      setMonto('');
      setNotas('');
      setPedidoSeleccionado('');

      // Recargar resumen
      if (clienteId) {
        const nuevoResumen = await api.get(`/pagos/cliente/${clienteId}/resumen`);
        setResumenCliente(nuevoResumen);
      }

      // Notificar al padre
      if (onPagoRegistrado) {
        onPagoRegistrado(response);
      }
    } catch (err) {
      setError(err.message || 'Error al registrar pago');
    } finally {
      setLoading(false);
    }
  };

  const pagarTodo = () => {
    if (resumenCliente?.adeudoTotal) {
      setMonto(resumenCliente.adeudoTotal.toFixed(2));
      setPedidoSeleccionado(''); // Pagar todo = distribuir entre pedidos
    }
  };

  const pagarPedido = (pedido) => {
    setPedidoSeleccionado(pedido.id);
    setMonto(pedido.pendiente.toFixed(2));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-pago" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Registrar Pago</h3>
          <button className="modal-close" onClick={onClose}>x</button>
        </div>

        <div className="modal-content">
          {/* Selector de cliente */}
          <div className="form-group">
            <label className="form-label">Cliente</label>
            <select
              className="form-input"
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              disabled={loadingClientes || clienteInicial}
            >
              <option value="">Seleccionar cliente...</option>
              {clientes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nombre} - Adeudo: {formatMoney(c.adeudoTotal)} ({c.pedidosPendientes} pedidos)
                </option>
              ))}
            </select>
          </div>

          {/* Resumen del cliente */}
          {loadingResumen && <p className="loading-text">Cargando información...</p>}

          {resumenCliente && (
            <div className="resumen-cliente">
              <div className="resumen-header">
                <h4>{resumenCliente.cliente.nombre}</h4>
                <div className="resumen-adeudo">
                  <span className="label">Adeudo Total:</span>
                  <span className="valor">{formatMoney(resumenCliente.adeudoTotal)}</span>
                </div>
              </div>

              {resumenCliente.pedidosPendientes.length > 0 && (
                <div className="pedidos-pendientes">
                  <div className="pedidos-header">
                    <span>Pedidos Pendientes ({resumenCliente.cantidadPedidos})</span>
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={pagarTodo}
                    >
                      Pagar Todo
                    </button>
                  </div>
                  <div className="pedidos-lista">
                    {resumenCliente.pedidosPendientes.map(pedido => (
                      <div
                        key={pedido.id}
                        className={`pedido-item ${pedidoSeleccionado === pedido.id ? 'selected' : ''}`}
                        onClick={() => pagarPedido(pedido)}
                      >
                        <div className="pedido-fecha">{pedido.fecha}</div>
                        <div className="pedido-montos">
                          <span className="total">Total: {formatMoney(pedido.total)}</span>
                          <span className="pendiente">Pendiente: {formatMoney(pedido.pendiente)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Formulario de pago */}
          {resumenCliente && (
            <form onSubmit={handleSubmit} className="pago-form">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Monto a Pagar</label>
                  <input
                    type="number"
                    className="form-input"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Tipo de Pago</label>
                  <select
                    className="form-input"
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value)}
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Notas (opcional)</label>
                <input
                  type="text"
                  className="form-input"
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Referencia, comentarios..."
                />
              </div>

              {pedidoSeleccionado ? (
                <p className="pago-destino">
                  Pago para pedido del {resumenCliente.pedidosPendientes.find(p => p.id === parseInt(pedidoSeleccionado))?.fecha}
                </p>
              ) : monto && (
                <p className="pago-destino">
                  El pago se distribuira entre los pedidos pendientes (del mas antiguo al mas reciente)
                </p>
              )}

              {error && <div className="error-message">{error}</div>}

              {resultado && (
                <div className="resultado-pago">
                  <div className="resultado-success">Pago registrado correctamente</div>
                  <div className="resultado-detalles">
                    <p>Monto aplicado: {formatMoney(resultado.montoAplicado)}</p>
                    <p>Pedidos afectados: {resultado.pedidosAfectados}</p>
                    <p>Nuevo adeudo: {formatMoney(resultado.nuevoAdeudoCliente)}</p>
                  </div>
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  Cerrar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading || !monto}
                >
                  {loading ? 'Registrando...' : 'Registrar Pago'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default ModalPago;
