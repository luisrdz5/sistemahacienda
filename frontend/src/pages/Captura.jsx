import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import GastoForm from '../components/cortes/GastoForm';
import GastoItem from '../components/cortes/GastoItem';
import InventarioHarina from '../components/cortes/InventarioHarina';
import './Captura.css';

function Captura() {
  const { usuario } = useAuth();
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [sucursalId, setSucursalId] = useState(usuario?.sucursalId || '');
  const [sucursales, setSucursales] = useState([]);
  const [corte, setCorte] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showGastoForm, setShowGastoForm] = useState(false);
  const [error, setError] = useState('');
  const [efectivoLocal, setEfectivoLocal] = useState('');
  const [isVirtualSucursal, setIsVirtualSucursal] = useState(false);

  const isAdmin = usuario?.rol === 'admin';
  const canEdit = corte?.estado !== 'completado' || isAdmin;

  // Cargar sucursales si es admin
  useEffect(() => {
    if (isAdmin) {
      api.get('/sucursales').then(setSucursales).catch(console.error);
    }
  }, [isAdmin]);

  // Detectar si es sucursal virtual
  useEffect(() => {
    if (sucursalId && sucursales.length > 0) {
      const selected = sucursales.find(s => s.id === parseInt(sucursalId));
      setIsVirtualSucursal(selected?.tipo === 'virtual');
    } else {
      setIsVirtualSucursal(false);
    }
  }, [sucursalId, sucursales]);

  // Sincronizar efectivo local cuando cambia el corte
  useEffect(() => {
    if (corte) {
      setEfectivoLocal(corte.efectivoCaja ? Math.round(corte.efectivoCaja).toString() : '');
    }
  }, [corte?.id, corte?.efectivoCaja]);

  // Cargar corte cuando cambia fecha o sucursal
  useEffect(() => {
    if (!fecha || !sucursalId) return;

    const cargarCorte = async () => {
      setLoading(true);
      setError('');

      try {
        const cortes = await api.get(`/cortes?fecha=${fecha}&sucursalId=${sucursalId}`);
        if (cortes.length > 0) {
          const corteCompleto = await api.get(`/cortes/${cortes[0].id}`);
          setCorte(corteCompleto);
        } else {
          setCorte(null);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    cargarCorte();
  }, [fecha, sucursalId]);

  const crearCorte = async () => {
    try {
      setLoading(true);
      const nuevoCorte = await api.post('/cortes', { fecha, sucursalId });
      const corteCompleto = await api.get(`/cortes/${nuevoCorte.id}`);
      setCorte(corteCompleto);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const actualizarCorte = async (datos) => {
    try {
      await api.put(`/cortes/${corte.id}`, datos);
      const corteActualizado = await api.get(`/cortes/${corte.id}`);
      setCorte(corteActualizado);
    } catch (err) {
      setError(err.message);
    }
  };

  const agregarGasto = async (gasto) => {
    try {
      await api.post(`/cortes/${corte.id}/gastos`, gasto);
      const corteActualizado = await api.get(`/cortes/${corte.id}`);
      setCorte(corteActualizado);
      setShowGastoForm(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const eliminarGasto = async (gastoId) => {
    try {
      await api.delete(`/gastos/${gastoId}`);
      const corteActualizado = await api.get(`/cortes/${corte.id}`);
      setCorte(corteActualizado);
    } catch (err) {
      setError(err.message);
    }
  };

  const finalizarCorte = async () => {
    if (!window.confirm('¿Estás seguro de finalizar este corte? No podrás editarlo después.')) {
      return;
    }

    try {
      await api.put(`/cortes/${corte.id}/finalizar`);
      const corteActualizado = await api.get(`/cortes/${corte.id}`);
      setCorte(corteActualizado);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Captura Diaria</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="captura-filters">
        <div className="form-group">
          <label className="form-label">Fecha</label>
          <input
            type="date"
            className="form-input"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
        </div>

        {isAdmin && (
          <div className="form-group">
            <label className="form-label">Sucursal</label>
            <select
              className="form-input"
              value={sucursalId}
              onChange={(e) => setSucursalId(e.target.value)}
            >
              <option value="">Seleccionar sucursal</option>
              {sucursales.map(s => (
                <option key={s.id} value={s.id}>
                  {s.nombre}{s.tipo === 'virtual' ? ' (Solo gastos)' : ''}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <div className="loading-inline">Cargando...</div>
      ) : !corte ? (
        <div className="captura-empty">
          <p>No hay corte para esta fecha.</p>
          <button className="btn btn-primary" onClick={crearCorte} disabled={!sucursalId}>
            Crear Corte
          </button>
        </div>
      ) : (
        <div className="captura-content">
          {corte.estado === 'completado' && !isAdmin && (
            <div className="alert alert-success">
              Este corte ya fue finalizado y no puede ser editado.
            </div>
          )}

          {corte.estado === 'completado' && isAdmin && (
            <div className="alert alert-warning">
              Este corte está finalizado. Como administrador, puedes editarlo.
            </div>
          )}

          {isVirtualSucursal && (
            <div className="alert alert-info">
              Esta es una sucursal virtual - solo registra gastos (sin efectivo ni inventario).
            </div>
          )}

          <section className="captura-section">
            <div className="section-header">
              <h2>Gastos del Turno</h2>
              {canEdit && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowGastoForm(true)}
                >
                  + Agregar Gasto
                </button>
              )}
            </div>

            <div className="gastos-list">
              {corte.gastos?.length === 0 ? (
                <p className="empty-message">No hay gastos registrados</p>
              ) : (
                corte.gastos?.map(gasto => (
                  <GastoItem
                    key={gasto.id}
                    gasto={gasto}
                    onDelete={() => eliminarGasto(gasto.id)}
                    disabled={!canEdit}
                  />
                ))
              )}
            </div>
          </section>

          {!isVirtualSucursal && (
            <section className="captura-section">
              <h2>Inventario de Harina</h2>
              <InventarioHarina
                nixta={corte.inventarioNixta || 0}
                extra={corte.inventarioExtra || 0}
                onChange={(inventario) => actualizarCorte(inventario)}
                disabled={!canEdit}
              />
            </section>
          )}

          {!isVirtualSucursal && (
            <section className="captura-section">
              <h2>Efectivo y Ventas</h2>
              <div className="efectivo-ventas">
                <div className="form-group">
                  <label className="form-label">Efectivo en Caja</label>
                  <input
                    type="number"
                    className="form-input form-input-lg"
                    value={efectivoLocal}
                    onChange={(e) => setEfectivoLocal(e.target.value)}
                    onBlur={(e) => {
                      const valor = parseInt(e.target.value) || 0;
                      if (valor !== Math.round(corte.efectivoCaja || 0)) {
                        actualizarCorte({ efectivoCaja: valor });
                      }
                    }}
                    disabled={!canEdit}
                    placeholder="$0"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Venta Total (calculado)</label>
                  <div className="venta-total-calculada">
                    ${((parseInt(efectivoLocal) || 0) + (parseFloat(corte.totalGastos) || 0)).toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </div>
                  <span className="venta-formula">Efectivo + Gastos</span>
                </div>
              </div>
            </section>
          )}

          {!isVirtualSucursal && (
            <section className="captura-resumen">
              <div className="resumen-item">
                <span>Efectivo en Caja</span>
                <strong>${(parseInt(efectivoLocal) || 0).toLocaleString('es-MX')}</strong>
              </div>
              <div className="resumen-item">
                <span>Total Gastos</span>
                <strong>${Math.round(parseFloat(corte.totalGastos) || 0).toLocaleString('es-MX')}</strong>
              </div>
              <div className="resumen-item resumen-total">
                <span>Venta Total</span>
                <strong>${((parseInt(efectivoLocal) || 0) + Math.round(parseFloat(corte.totalGastos) || 0)).toLocaleString('es-MX')}</strong>
              </div>
            </section>
          )}

          {isVirtualSucursal && (
            <section className="captura-resumen">
              <div className="resumen-item resumen-total">
                <span>Total Gastos</span>
                <strong>${Math.round(parseFloat(corte.totalGastos) || 0).toLocaleString('es-MX')}</strong>
              </div>
            </section>
          )}

          {corte.estado !== 'completado' && (
            <button
              className="btn btn-primary btn-block btn-lg"
              onClick={finalizarCorte}
            >
              Finalizar Corte del Día
            </button>
          )}
        </div>
      )}

      {showGastoForm && (
        <GastoForm
          onSubmit={agregarGasto}
          onClose={() => setShowGastoForm(false)}
          sucursal={sucursales.find(s => s.id === parseInt(sucursalId))}
        />
      )}
    </div>
  );
}

export default Captura;
