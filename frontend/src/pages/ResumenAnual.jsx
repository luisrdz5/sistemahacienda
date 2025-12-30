import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './ResumenAnual.css';

function ResumenAnual() {
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get(`/dashboard/resumen-anual?anio=${anio}`);
        setData(response);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [anio]);

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="page">
        <div className="loading-inline">Cargando...</div>
      </div>
    );
  }

  const crecimiento = data?.comparativaAnterior?.crecimientoVentas;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Resumen Anual</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Selector de ano */}
      <div className="anual-nav">
        <button className="btn btn-secondary" onClick={() => setAnio(anio - 1)}>
          Anterior
        </button>
        <span className="anual-periodo">{anio}</span>
        <button className="btn btn-secondary" onClick={() => setAnio(anio + 1)}>
          Siguiente
        </button>
      </div>

      {/* KPIs principales */}
      <div className="stats-grid-5">
        <div className="stat-card">
          <span className="stat-label">Ventas Anuales</span>
          <span className="stat-value stat-success">{formatMoney(data?.estadisticas?.totalVentas)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Gastos Anuales</span>
          <span className="stat-value stat-error">{formatMoney(data?.estadisticas?.totalGastos)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Utilidad Neta</span>
          <span className={`stat-value ${data?.estadisticas?.utilidadNeta >= 0 ? 'stat-success' : 'stat-error'}`}>
            {formatMoney(data?.estadisticas?.utilidadNeta)}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Caja Chica Total</span>
          <span className="stat-value stat-info">{formatMoney(data?.estadisticas?.totalCajaChica)}</span>
        </div>
        <div className="stat-card stat-card-ahorro">
          <span className="stat-label">Ahorro Anual</span>
          <span className="stat-value stat-ahorro">{formatMoney(data?.estadisticas?.totalAhorro)}</span>
        </div>
      </div>

      {/* KPIs secundarios */}
      <div className="stats-grid-2">
        <div className="stat-card stat-card-sm">
          <span className="stat-label">Promedio Mensual</span>
          <span className="stat-value stat-primary">{formatMoney(data?.estadisticas?.promedioMensual)}</span>
        </div>
        <div className="stat-card stat-card-sm">
          <span className="stat-label">vs {data?.comparativaAnterior?.anio}</span>
          {crecimiento !== null ? (
            <span className={`stat-value ${crecimiento >= 0 ? 'stat-success' : 'stat-error'}`}>
              {crecimiento >= 0 ? '+' : ''}{crecimiento}%
            </span>
          ) : (
            <span className="stat-value stat-muted">Sin datos</span>
          )}
        </div>
      </div>

      {/* Comparativa con ano anterior */}
      {data?.comparativaAnterior?.ventasAnterior > 0 && (
        <div className="card comparativa-card">
          <h2 className="card-title">Comparativa con {data?.comparativaAnterior?.anio}</h2>
          <div className="comparativa-bars">
            <div className="comparativa-item">
              <span className="comparativa-label">{data?.comparativaAnterior?.anio}</span>
              <div className="comparativa-bar-container">
                <div
                  className="comparativa-bar anterior"
                  style={{
                    width: `${Math.min(100, (data?.comparativaAnterior?.ventasAnterior / Math.max(data?.estadisticas?.totalVentas, data?.comparativaAnterior?.ventasAnterior)) * 100)}%`
                  }}
                ></div>
                <span className="comparativa-valor">{formatMoney(data?.comparativaAnterior?.ventasAnterior)}</span>
              </div>
            </div>
            <div className="comparativa-item">
              <span className="comparativa-label">{anio}</span>
              <div className="comparativa-bar-container">
                <div
                  className="comparativa-bar actual"
                  style={{
                    width: `${Math.min(100, (data?.estadisticas?.totalVentas / Math.max(data?.estadisticas?.totalVentas, data?.comparativaAnterior?.ventasAnterior)) * 100)}%`
                  }}
                ></div>
                <span className="comparativa-valor">{formatMoney(data?.estadisticas?.totalVentas)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabla de meses */}
      <div className="card">
        <h2 className="card-title">Desglose Mensual</h2>
        <div className="tabla-scroll">
          <table className="tabla-meses">
            <thead>
              <tr>
                <th>Mes</th>
                <th>Ventas</th>
                <th>Gastos</th>
                <th>Utilidad</th>
                <th>Caja Chica</th>
                <th>Ahorro</th>
              </tr>
            </thead>
            <tbody>
              {data?.meses?.map((m, idx) => (
                <tr key={idx} className={m.ventas === 0 ? 'row-sin-datos' : ''}>
                  <td className="col-mes">
                    <span className="mes-nombre">{m.nombreMes}</span>
                  </td>
                  <td className="col-ventas">{formatMoney(m.ventas)}</td>
                  <td className="col-gastos">{formatMoney(m.gastos)}</td>
                  <td className={`col-utilidad ${m.utilidad >= 0 ? 'positive' : 'negative'}`}>
                    {formatMoney(m.utilidad)}
                  </td>
                  <td className="col-caja">{formatMoney(m.cajaChica)}</td>
                  <td className="col-ahorro">{formatMoney(m.ahorro)}</td>
                </tr>
              ))}
              <tr className="row-totales">
                <td><strong>TOTAL</strong></td>
                <td className="col-ventas"><strong>{formatMoney(data?.estadisticas?.totalVentas)}</strong></td>
                <td className="col-gastos"><strong>{formatMoney(data?.estadisticas?.totalGastos)}</strong></td>
                <td className={`col-utilidad ${data?.estadisticas?.utilidadNeta >= 0 ? 'positive' : 'negative'}`}>
                  <strong>{formatMoney(data?.estadisticas?.utilidadNeta)}</strong>
                </td>
                <td className="col-caja"><strong>{formatMoney(data?.estadisticas?.totalCajaChica)}</strong></td>
                <td className="col-ahorro"><strong>{formatMoney(data?.estadisticas?.totalAhorro)}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Grafico de barras por mes */}
      <div className="card">
        <h2 className="card-title">Tendencia de Ventas</h2>
        <div className="chart-container">
          <div className="bar-chart-mensual">
            {data?.meses?.map((m, idx) => {
              const maxVenta = Math.max(...(data?.meses?.map(v => v.ventas) || [1]));
              const height = maxVenta > 0 ? (m.ventas / maxVenta) * 100 : 0;
              return (
                <div key={idx} className="bar-mes-item" title={`${m.nombreMes}: ${formatMoney(m.ventas)}`}>
                  <div className="bar-mes" style={{ height: `${height}%` }}>
                    {m.ventas > 0 && (
                      <span className="bar-mes-valor">{formatMoney(m.ventas)}</span>
                    )}
                  </div>
                  <span className="bar-mes-label">{m.nombreMes}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResumenAnual;
