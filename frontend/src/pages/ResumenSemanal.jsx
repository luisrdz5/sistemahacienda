import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './ResumenSemanal.css';

// Función para formatear fecha local sin depender de toISOString (evita problemas de zona horaria en iOS)
function getLocalDateString(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getSunday(date) {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);
  const day = d.getDay(); // 0 = domingo
  d.setDate(d.getDate() - day);
  return getLocalDateString(d);
}

function ResumenSemanal() {
  const [fechaInicio, setFechaInicio] = useState(getSunday(new Date()));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detalleAbierto, setDetalleAbierto] = useState(null); // { fecha, sucursalId }

  // Estado para el modal de detalle del corte
  const [modalCorte, setModalCorte] = useState(null);
  const [loadingCorte, setLoadingCorte] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get(`/dashboard/resumen-semanal?fechaInicio=${fechaInicio}`);
        setData(response);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [fechaInicio]);

  const cambiarSemana = (delta) => {
    const current = new Date(fechaInicio + 'T12:00:00');
    current.setDate(current.getDate() + (delta * 7));
    setFechaInicio(getLocalDateString(current));
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
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
  };

  const formatDateLong = (dateStr) => {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Abrir modal con detalle del corte
  const abrirDetalleCorte = async (fecha, sucursalId, sucursalNombre) => {
    setLoadingCorte(true);
    try {
      // Buscar el corte por fecha y sucursal
      const cortes = await api.get(`/cortes?fecha=${fecha}&sucursalId=${sucursalId}`);
      if (cortes.length > 0) {
        const corteCompleto = await api.get(`/cortes/${cortes[0].id}`);
        setModalCorte({
          ...corteCompleto,
          fecha,
          sucursalNombre
        });
      } else {
        setModalCorte({
          sinCorte: true,
          fecha,
          sucursalNombre
        });
      }
    } catch (err) {
      console.error('Error cargando detalle del corte:', err);
    } finally {
      setLoadingCorte(false);
    }
  };

  const cerrarModal = () => {
    setModalCorte(null);
  };

  if (loading) {
    return (
      <div className="page">
        <div className="loading-inline">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Resumen Semanal</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Navegacion de semana */}
      <div className="semanal-nav">
        <button className="btn btn-secondary" onClick={() => cambiarSemana(-1)}>
          Semana Anterior
        </button>
        <span className="semanal-periodo">
          {formatDate(data?.semana?.inicio)} - {formatDate(data?.semana?.fin)}
        </span>
        <button className="btn btn-secondary" onClick={() => cambiarSemana(1)}>
          Semana Siguiente
        </button>
      </div>

      {/* Totales semanales */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Ventas Semanales</span>
          <span className="stat-value stat-success">{formatMoney(data?.totalesSemanales?.ventas)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Gastos Semanales</span>
          <span className="stat-value stat-error">{formatMoney(data?.totalesSemanales?.gastos)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Utilidad Semanal</span>
          <span className={`stat-value ${data?.totalesSemanales?.utilidad >= 0 ? 'stat-success' : 'stat-error'}`}>
            {formatMoney(data?.totalesSemanales?.utilidad)}
          </span>
        </div>
      </div>

      {/* Caja Chica - Arrastre de saldo */}
      <div className="caja-chica-section">
        <h3 className="caja-chica-titulo">Caja Chica</h3>
        <div className="caja-chica-grid">
          <div className="caja-chica-item">
            <span className="caja-chica-label">Saldo Anterior</span>
            <span className={`caja-chica-value ${data?.cajaChica?.saldoAnterior >= 0 ? 'positive' : 'negative'}`}>
              {formatMoney(data?.cajaChica?.saldoAnterior)}
            </span>
          </div>
          <div className="caja-chica-operador">+</div>
          <div className="caja-chica-item">
            <span className="caja-chica-label">Utilidad Semana</span>
            <span className={`caja-chica-value ${data?.cajaChica?.utilidadSemana >= 0 ? 'positive' : 'negative'}`}>
              {formatMoney(data?.cajaChica?.utilidadSemana)}
            </span>
          </div>
          <div className="caja-chica-operador">=</div>
          <div className="caja-chica-item caja-chica-resultado">
            <span className="caja-chica-label">Saldo Nuevo</span>
            <span className={`caja-chica-value ${data?.cajaChica?.saldoNuevo >= 0 ? 'positive' : 'negative'}`}>
              {formatMoney(data?.cajaChica?.saldoNuevo)}
            </span>
          </div>
        </div>
      </div>

      {/* Tabla de resumen */}
      <div className="semanal-tabla card">
        <div className="tabla-scroll">
          <table className="tabla">
            <thead>
              <tr>
                <th className="col-dia">Dia</th>
                {data?.sucursales?.map(s => (
                  <th key={s.id} className={s.tipo === 'virtual' ? 'col-virtual' : ''}>
                    {s.nombre}
                    {s.tipo === 'virtual' && <span className="tag-virtual">Virtual</span>}
                  </th>
                ))}
                <th className="col-total">Total</th>
              </tr>
            </thead>
            <tbody>
              {data?.dias?.map(dia => (
                <tr key={dia.fecha}>
                  <td className="col-dia">
                    <div className="dia-cell">
                      <span className="dia-nombre">{dia.diaSemana}</span>
                      <span className="dia-fecha">{formatDate(dia.fecha)}</span>
                    </div>
                  </td>
                  {dia.sucursales.map(s => {
                    const isOpen = detalleAbierto?.fecha === dia.fecha && detalleAbierto?.sucursalId === s.sucursalId;
                    const toggleDetalle = () => {
                      if (s.tipo === 'virtual' && s.gastosDetalle?.length > 0) {
                        setDetalleAbierto(isOpen ? null : { fecha: dia.fecha, sucursalId: s.sucursalId });
                      }
                    };

                    // Para sucursales físicas, hacer clickeable para ver detalle
                    const handleClickFisica = () => {
                      if (s.tipo !== 'virtual' && s.estado !== 'pendiente') {
                        abrirDetalleCorte(dia.fecha, s.sucursalId, s.nombre);
                      }
                    };

                    return (
                      <td key={s.sucursalId} className={s.tipo === 'virtual' ? 'col-virtual' : ''}>
                        {s.tipo === 'virtual' ? (
                          <div
                            className={`sucursal-cell virtual ${s.gastosDetalle?.length > 0 ? 'clickable' : ''} ${isOpen ? 'expanded' : ''}`}
                            onClick={toggleDetalle}
                          >
                            <span className="gasto">{formatMoney(s.gastos)}</span>
                            {s.gastosDetalle?.length > 0 && (
                              <span className="detalle-icon">{isOpen ? '▲' : '▼'}</span>
                            )}
                            {isOpen && (
                              <div className="gastos-detalle-popup">
                                {s.gastosDetalle.map((g, idx) => (
                                  <div key={idx} className="gasto-detalle-item">
                                    <span className="gasto-desc">{g.descripcion || g.categoria}</span>
                                    <span className="gasto-monto">{formatMoney(g.monto)}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div
                            className={`sucursal-cell ${s.estado !== 'pendiente' ? 'clickable' : ''}`}
                            onClick={handleClickFisica}
                            title={s.estado !== 'pendiente' ? 'Click para ver detalle' : ''}
                          >
                            <span className="venta">{formatMoney(s.venta)}</span>
                            <span className="gasto">-{formatMoney(s.gastos)}</span>
                            <span className={`utilidad ${s.utilidad >= 0 ? 'positive' : 'negative'}`}>
                              {formatMoney(s.utilidad)}
                            </span>
                            {s.esFuga && (
                              <span className="badge-fuga" title={`Esperado: ${formatMoney(s.ingresoEstimado)}`}>
                                Fuga: {formatMoney(Math.abs(s.discrepancia))}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                    );
                  })}
                  <td className="col-total">
                    <div className="totales-cell">
                      <span className="venta">{formatMoney(dia.totales.ventas)}</span>
                      <span className="gasto">-{formatMoney(dia.totales.gastos)}</span>
                      <span className={`utilidad ${dia.totales.utilidad >= 0 ? 'positive' : 'negative'}`}>
                        {formatMoney(dia.totales.utilidad)}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
              {/* Fila de totales semanales */}
              <tr className="row-totales">
                <td className="col-dia"><strong>TOTALES</strong></td>
                {data?.sucursales?.map(s => {
                  const sucursalTotals = data.dias.reduce((acc, dia) => {
                    const sucData = dia.sucursales.find(x => x.sucursalId === s.id);
                    return {
                      ventas: acc.ventas + (sucData?.venta || 0),
                      gastos: acc.gastos + (sucData?.gastos || 0)
                    };
                  }, { ventas: 0, gastos: 0 });
                  const utilidad = sucursalTotals.ventas - sucursalTotals.gastos;
                  return (
                    <td key={s.id} className={s.tipo === 'virtual' ? 'col-virtual' : ''}>
                      {s.tipo === 'virtual' ? (
                        <strong className="gasto">{formatMoney(sucursalTotals.gastos)}</strong>
                      ) : (
                        <strong className={utilidad >= 0 ? 'positive' : 'negative'}>
                          {formatMoney(utilidad)}
                        </strong>
                      )}
                    </td>
                  );
                })}
                <td className="col-total">
                  <strong className={data?.totalesSemanales?.utilidad >= 0 ? 'positive' : 'negative'}>
                    {formatMoney(data?.totalesSemanales?.utilidad)}
                  </strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Leyenda */}
      <div className="semanal-leyenda">
        <div className="leyenda-item">
          <span className="leyenda-color venta"></span>
          <span>Ventas</span>
        </div>
        <div className="leyenda-item">
          <span className="leyenda-color gasto"></span>
          <span>Gastos</span>
        </div>
        <div className="leyenda-item">
          <span className="leyenda-color utilidad"></span>
          <span>Utilidad</span>
        </div>
        <div className="leyenda-item">
          <span className="leyenda-hint">Click en una sucursal para ver detalle</span>
        </div>
      </div>

      {/* Modal de detalle del corte */}
      {(modalCorte || loadingCorte) && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal-corte" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Detalle del Corte</h2>
              <button className="modal-close" onClick={cerrarModal}>&times;</button>
            </div>

            {loadingCorte ? (
              <div className="modal-loading">Cargando detalle...</div>
            ) : modalCorte?.sinCorte ? (
              <div className="modal-body">
                <p className="modal-sin-datos">No hay corte registrado para este día.</p>
              </div>
            ) : (
              <div className="modal-body">
                <div className="modal-info-header">
                  <h3>{modalCorte.sucursalNombre}</h3>
                  <p className="modal-fecha">{formatDateLong(modalCorte.fecha)}</p>
                  <span className={`modal-estado ${modalCorte.estado}`}>
                    {modalCorte.estado === 'completado' ? 'Finalizado' : 'En proceso'}
                  </span>
                </div>

                {/* Resumen financiero */}
                <div className="modal-section">
                  <h4>Resumen Financiero</h4>
                  <div className="modal-stats">
                    <div className="modal-stat">
                      <span className="label">Efectivo en Caja</span>
                      <span className="value">{formatMoney(modalCorte.efectivoCaja)}</span>
                    </div>
                    <div className="modal-stat">
                      <span className="label">Total Gastos</span>
                      <span className="value gasto">{formatMoney(modalCorte.totalGastos)}</span>
                    </div>
                    <div className="modal-stat destacado">
                      <span className="label">Venta Total</span>
                      <span className="value">{formatMoney(parseFloat(modalCorte.efectivoCaja || 0) + parseFloat(modalCorte.totalGastos || 0))}</span>
                    </div>
                  </div>
                </div>

                {/* Desglose de gastos */}
                {modalCorte.gastos?.length > 0 && (
                  <div className="modal-section">
                    <h4>Desglose de Gastos</h4>
                    <div className="modal-gastos-lista">
                      {modalCorte.gastos.map((g, idx) => (
                        <div key={idx} className="modal-gasto-item">
                          <span className="categoria">{g.categoria?.nombre || 'Sin categoría'}</span>
                          <span className="descripcion">{g.descripcion || '-'}</span>
                          <span className="monto">{formatMoney(g.monto)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Análisis de producción */}
                {(modalCorte.kgMasa > 0 || modalCorte.consumoHarina > 0) && (
                  <div className="modal-section">
                    <h4>Análisis de Producción</h4>
                    <div className="modal-produccion">
                      {modalCorte.kgMasa > 0 && (
                        <div className="produccion-item">
                          <span className="label">Masa consumida:</span>
                          <span className="value">{modalCorte.descripcionConsumoMasa || `${modalCorte.kgMasa} kg`}</span>
                        </div>
                      )}
                      {modalCorte.consumoHarina > 0 && (
                        <div className="produccion-item">
                          <span className="label">Harina consumida:</span>
                          <span className="value">{modalCorte.consumoHarina} bultos</span>
                        </div>
                      )}
                      <div className="produccion-item">
                        <span className="label">Tortilla producida:</span>
                        <span className="value">{Math.ceil(modalCorte.kgTortillaTotal || 0)} kg</span>
                      </div>
                      <div className="produccion-item">
                        <span className="label">Precio por kg (sucursal):</span>
                        <span className="value">{formatMoney(modalCorte.precioTortilla)}/kg</span>
                      </div>
                      <div className="produccion-item destacado">
                        <span className="label">Ingreso esperado:</span>
                        <span className="value">{formatMoney(modalCorte.ingresoEstimado)}</span>
                      </div>
                      <p className="produccion-formula">
                        {Math.ceil(modalCorte.kgTortillaTotal || 0)} kg × {formatMoney(modalCorte.precioTortilla)} = {formatMoney(modalCorte.ingresoEstimado)}
                      </p>
                    </div>

                    {/* Análisis de fuga */}
                    {modalCorte.tieneDiscrepancia && (
                      <div className="modal-alerta-fuga">
                        <h5>Posible Fuga Detectada</h5>
                        <div className="fuga-detalle">
                          <div className="fuga-row">
                            <span>Ingreso esperado:</span>
                            <span>{formatMoney(modalCorte.ingresoEstimado)}</span>
                          </div>
                          <div className="fuga-row">
                            <span>Venta real:</span>
                            <span>{formatMoney(parseFloat(modalCorte.efectivoCaja || 0) + parseFloat(modalCorte.totalGastos || 0))}</span>
                          </div>
                          <div className="fuga-row diferencia">
                            <span>Diferencia:</span>
                            <span>{formatMoney(Math.abs(modalCorte.discrepancia))}</span>
                          </div>
                        </div>
                        <p className="fuga-ayuda">
                          La venta es menor al ingreso esperado basado en el consumo de insumos.
                          Verifica los datos capturados o investiga posibles causas.
                        </p>
                      </div>
                    )}

                    {/* Sin discrepancia */}
                    {!modalCorte.tieneDiscrepancia && modalCorte.ingresoEstimado > 0 && (
                      <div className="modal-sin-fuga">
                        <span className="check">✓</span>
                        <span>La venta está dentro del rango esperado</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Inventario de harina */}
                {(modalCorte.inventarioNixta > 0 || modalCorte.inventarioExtra > 0) && (
                  <div className="modal-section">
                    <h4>Consumo de Harina</h4>
                    <div className="modal-harina">
                      <div className="harina-item">
                        <span className="label">Harina Nixta:</span>
                        <span className="value">{modalCorte.inventarioNixta || 0} bultos</span>
                      </div>
                      <div className="harina-item">
                        <span className="label">Harina Extra:</span>
                        <span className="value">{modalCorte.inventarioExtra || 0} bultos</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ResumenSemanal;
