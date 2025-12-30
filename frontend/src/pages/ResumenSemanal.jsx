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
                          <div className="sucursal-cell">
                            <span className="venta">{formatMoney(s.venta)}</span>
                            <span className="gasto">-{formatMoney(s.gastos)}</span>
                            <span className={`utilidad ${s.utilidad >= 0 ? 'positive' : 'negative'}`}>
                              {formatMoney(s.utilidad)}
                            </span>
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
      </div>
    </div>
  );
}

export default ResumenSemanal;
