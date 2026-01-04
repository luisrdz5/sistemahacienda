import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import ModalAbono from '../components/pedidos/ModalAbono';
import './ClientesDeudores.css';

function ClientesDeudores() {
  const { usuario } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState('mensual');
  const [repartidorId, setRepartidorId] = useState('');
  const [repartidores, setRepartidores] = useState([]);
  const [expandido, setExpandido] = useState({});
  const [modalAbono, setModalAbono] = useState(null);

  const isAdmin = usuario?.rol === 'admin';
  const isAdminRepartidor = usuario?.rol === 'administrador_repartidor';
  const canFilterRepartidor = isAdmin || isAdminRepartidor;
  const canRegistrarAbono = isAdmin || isAdminRepartidor;

  useEffect(() => {
    if (canFilterRepartidor) {
      api.get('/pedidos/repartidores')
        .then(setRepartidores)
        .catch(console.error);
    }
  }, [canFilterRepartidor]);

  useEffect(() => {
    cargarDatos();
  }, [periodo, repartidorId]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      let params = `?periodo=${periodo}`;
      if (repartidorId) params += `&repartidorId=${repartidorId}`;

      const result = await api.get(`/pedidos/dashboard/deudores${params}`);
      setData(result);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short'
    });
  };

  const toggleExpandido = (clienteId) => {
    setExpandido(prev => ({
      ...prev,
      [clienteId]: !prev[clienteId]
    }));
  };

  const handleAbrirAbono = (pedido, e) => {
    e.stopPropagation();
    setModalAbono(pedido);
  };

  const handleConfirmarAbono = async (datos) => {
    try {
      await api.post(`/pedidos/${modalAbono.id}/abonos`, datos);
      setModalAbono(null);
      cargarDatos(); // Recargar para actualizar montos
    } catch (error) {
      console.error('Error al registrar abono:', error);
      alert(error.message || 'Error al registrar el abono');
    }
  };

  if (loading) {
    return <div className="loading">Cargando deudores...</div>;
  }

  return (
    <div className="page deudores-page">
      <div className="page-header">
        <h1 className="page-title">Clientes Deudores</h1>
      </div>

      <div className="deudores-filtros">
        <div className="form-group">
          <label className="form-label">Periodo</label>
          <select
            className="form-input"
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
          >
            <option value="semanal">Semanal</option>
            <option value="mensual">Mensual</option>
          </select>
        </div>

        {canFilterRepartidor && (
          <div className="form-group">
            <label className="form-label">Repartidor</label>
            <select
              className="form-input"
              value={repartidorId}
              onChange={(e) => setRepartidorId(e.target.value)}
            >
              <option value="">Todos</option>
              {repartidores.map(r => (
                <option key={r.id} value={r.id}>{r.nombre}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {data && (
        <>
          <div className="deudores-stats">
            <div className="stat-card">
              <span className="stat-value">{data.stats.totalClientes}</span>
              <span className="stat-label">Clientes con deuda</span>
            </div>
            <div className="stat-card stat-monto">
              <span className="stat-value">{formatMoney(data.stats.totalDeuda)}</span>
              <span className="stat-label">Monto total</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{data.stats.totalPedidos}</span>
              <span className="stat-label">Pedidos pendientes</span>
            </div>
          </div>

          <div className="deudores-lista">
            {data.clientes.length === 0 ? (
              <div className="empty-deudores">
                <p>No hay clientes con deuda pendiente</p>
              </div>
            ) : (
              data.clientes.map(cliente => (
                <div key={cliente.id} className="deudor-card">
                  <div
                    className="deudor-header"
                    onClick={() => toggleExpandido(cliente.id)}
                  >
                    <div className="deudor-info">
                      <h3>{cliente.nombre}</h3>
                      <span className="deudor-pedidos">
                        {cliente.pedidos.length} pedido{cliente.pedidos.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="deudor-monto">
                      {formatMoney(cliente.totalDeuda)}
                    </div>
                    <button className="btn-expandir">
                      {expandido[cliente.id] ? '−' : '+'}
                    </button>
                  </div>

                  {expandido[cliente.id] && (
                    <div className="deudor-detalle">
                      {cliente.pedidos.map(pedido => (
                        <div key={pedido.id} className="pedido-deuda">
                          <div className="pedido-deuda-info">
                            <span className="pedido-fecha">{formatDate(pedido.fecha)}</span>
                            <span className="pedido-productos">
                              {pedido.detalles?.map(d =>
                                `${d.cantidad} ${d.producto?.nombre}`
                              ).join(', ')}
                            </span>
                          </div>
                          <div className="pedido-deuda-montos">
                            <span className="total">Total: {formatMoney(pedido.total)}</span>
                            <span className="pagado">Pagado: {formatMoney(pedido.montoPagado)}</span>
                            <span className="pendiente">Debe: {formatMoney(pedido.saldoPendiente)}</span>
                          </div>
                          {pedido.observaciones && (
                            <div className="pedido-obs">{pedido.observaciones}</div>
                          )}
                          {canRegistrarAbono && pedido.saldoPendiente > 0 && (
                            <div className="pedido-acciones">
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={(e) => handleAbrirAbono(pedido, e)}
                              >
                                Registrar Abono
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}

      {modalAbono && (
        <ModalAbono
          pedido={modalAbono}
          onConfirm={handleConfirmarAbono}
          onClose={() => setModalAbono(null)}
        />
      )}
    </div>
  );
}

export default ClientesDeudores;
