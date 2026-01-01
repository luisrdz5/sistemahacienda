import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import GastoForm from '../components/cortes/GastoForm';
import GastoItem from '../components/cortes/GastoItem';
import InventarioHarina from '../components/cortes/InventarioHarina';
import './Captura.css';

function getLocalDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function Captura() {
  const { usuario, loading: authLoading } = useAuth();
  const [fecha, setFecha] = useState(getLocalDateString());
  const [sucursalId, setSucursalId] = useState('');
  const [sucursales, setSucursales] = useState([]);
  const [corte, setCorte] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showGastoForm, setShowGastoForm] = useState(false);
  const [error, setError] = useState('');
  const [efectivoLocal, setEfectivoLocal] = useState('');
  const [isVirtualSucursal, setIsVirtualSucursal] = useState(false);

  const isAdmin = usuario?.rol === 'admin';
  const canEdit = corte?.estado !== 'completado' || isAdmin;

  // Actualizar sucursalId cuando usuario cambia (para encargados)
  useEffect(() => {
    if (usuario?.sucursalId && !isAdmin) {
      setSucursalId(usuario.sucursalId.toString());
    }
  }, [usuario?.sucursalId, isAdmin]);

  // Cargar sucursales si es admin
  useEffect(() => {
    if (isAdmin) {
      api.get('/sucursales')
        .then(data => {
          setSucursales(data);
        })
        .catch(err => {
          console.error('Error cargando sucursales:', err);
          setError('Error cargando sucursales');
        });
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

  // Mostrar loading mientras se carga el usuario
  if (authLoading) {
    return (
      <div className="page">
        <div className="loading-inline">Cargando...</div>
      </div>
    );
  }

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
              <h2>Consumo de Harina (bultos)</h2>
              <InventarioHarina
                nixta={corte.inventarioNixta || 0}
                extra={corte.inventarioExtra || 0}
                onChange={(inventario) => actualizarCorte(inventario)}
                disabled={!canEdit}
              />
            </section>
          )}

          {!isVirtualSucursal && corte.montoMasa > 0 && (
            <section className="captura-section consumo-masa-section">
              <h2>Consumo de Masa</h2>
              <div className="consumo-masa-calculado">
                <div className="consumo-masa-info">
                  <div className="consumo-masa-row">
                    <span className="consumo-label">Gasto registrado:</span>
                    <span className="consumo-valor">${(corte.montoMasa || 0).toLocaleString('es-MX')}</span>
                  </div>
                  <div className="consumo-masa-row">
                    <span className="consumo-label">Precio por maleta:</span>
                    <span className="consumo-valor">${(corte.precioMaleta || 340).toLocaleString('es-MX')}</span>
                  </div>
                  <div className="consumo-masa-row consumo-masa-total">
                    <span className="consumo-label">Consumo calculado:</span>
                    <span className="consumo-valor consumo-destacado">
                      {corte.descripcionConsumoMasa || `${(corte.kgMasa || 0).toFixed(1)} kg`}
                    </span>
                  </div>
                </div>
                <p className="consumo-masa-nota">
                  El consumo se calcula automáticamente al registrar un gasto de categoría "Masa"
                </p>
              </div>
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

          {!isVirtualSucursal && corte.ingresoEstimado > 0 && (
            <section className="captura-section ingreso-estimado-section">
              <h2>Ingreso Mínimo Esperado</h2>
              <div className="ingreso-estimado-card">
                <div className="ingreso-estimado-calculo">
                  {corte.kgMasa > 0 && (
                    <div className="calculo-item">
                      <span>Masa consumida:</span>
                      <span>{corte.descripcionConsumoMasa}</span>
                    </div>
                  )}
                  <div className="calculo-item">
                    <span>Tortilla de masa:</span>
                    <span>{(corte.kgTortillaMasa || 0).toFixed(1)} kg</span>
                  </div>
                  {corte.consumoHarina > 0 && (
                    <div className="calculo-item">
                      <span>Tortilla de harina:</span>
                      <span>{(corte.kgTortillaHarina || 0).toFixed(1)} kg</span>
                    </div>
                  )}
                  <div className="calculo-item calculo-total">
                    <span>Total tortilla producida:</span>
                    <span>{(corte.kgTortillaTotal || 0).toFixed(1)} kg</span>
                  </div>
                  <div className="calculo-item">
                    <span>Precio por kg:</span>
                    <span>${(corte.precioTortilla || 25).toFixed(2)}</span>
                  </div>
                </div>
                <div className="ingreso-estimado-valor">
                  <span>Ingreso esperado:</span>
                  <strong>${(corte.ingresoEstimado || 0).toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</strong>
                </div>
                {(() => {
                  const ventaActual = (parseInt(efectivoLocal) || 0) + Math.round(parseFloat(corte.totalGastos) || 0);
                  const ingresoEsperado = corte.ingresoEstimado || 0;
                  const diferencia = ingresoEsperado - ventaActual;
                  const hayFuga = ventaActual < ingresoEsperado;

                  return hayFuga && (
                    <div className="alerta-fuga">
                      <strong>Atención: La venta (${ventaActual.toLocaleString('es-MX')}) es menor al ingreso esperado.</strong>
                      <p>Diferencia: ${diferencia.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                      <p className="alerta-fuga-ayuda">Por favor verifica los datos capturados o reporta la situación.</p>
                    </div>
                  );
                })()}
              </div>
              <div className="ingreso-estimado-leyenda">
                <p><strong>¿Cómo se calcula?</strong></p>
                <p>El consumo de masa se detecta del gasto "Masa" (${corte.precioMaleta || 340}/maleta = 50 kg).</p>
                <p>De cada maleta de masa salen 40 kg de tortilla.</p>
                <p>De cada bulto de harina (20 kg) salen 35 kg de tortilla.</p>
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
