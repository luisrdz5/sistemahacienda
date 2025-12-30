import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './ResumenMensual.css';

function ResumenMensual() {
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get(`/dashboard/resumen-mensual?mes=${mes}&anio=${anio}`);
        setData(response);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [mes, anio]);

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const cambiarMes = (delta) => {
    let nuevoMes = mes + delta;
    let nuevoAnio = anio;
    if (nuevoMes > 12) {
      nuevoMes = 1;
      nuevoAnio++;
    } else if (nuevoMes < 1) {
      nuevoMes = 12;
      nuevoAnio--;
    }
    setMes(nuevoMes);
    setAnio(nuevoAnio);
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
        <h1 className="page-title">Resumen Mensual</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Navegacion de mes */}
      <div className="mensual-nav">
        <button className="btn btn-secondary" onClick={() => cambiarMes(-1)}>
          Mes Anterior
        </button>
        <span className="mensual-periodo">
          {data?.nombreMes} {anio}
        </span>
        <button className="btn btn-secondary" onClick={() => cambiarMes(1)}>
          Mes Siguiente
        </button>
      </div>

      {/* KPIs principales */}
      <div className="stats-grid-5">
        <div className="stat-card">
          <span className="stat-label">Ventas Totales</span>
          <span className="stat-value stat-success">{formatMoney(data?.estadisticas?.totalVentas)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Gastos Totales</span>
          <span className="stat-value stat-error">{formatMoney(data?.estadisticas?.totalGastos)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Utilidad Neta</span>
          <span className={`stat-value ${data?.estadisticas?.utilidadNeta >= 0 ? 'stat-success' : 'stat-error'}`}>
            {formatMoney(data?.estadisticas?.utilidadNeta)}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Caja Chica</span>
          <span className="stat-value stat-info">{formatMoney(data?.estadisticas?.totalCajaChica)}</span>
        </div>
        <div className="stat-card stat-card-ahorro">
          <span className="stat-label">Ahorro del Mes</span>
          <span className="stat-value stat-ahorro">{formatMoney(data?.estadisticas?.totalAhorro)}</span>
        </div>
      </div>

      {/* KPIs secundarios */}
      <div className="stats-grid-2">
        <div className="stat-card stat-card-sm">
          <span className="stat-label">Promedio Venta Diaria</span>
          <span className="stat-value stat-primary">{formatMoney(data?.estadisticas?.promedioVentaDiaria)}</span>
        </div>
        <div className="stat-card stat-card-sm">
          <span className="stat-label">Cortes Completados</span>
          <span className="stat-value">{data?.estadisticas?.cortesCompletados}</span>
        </div>
      </div>

      {/* Dos columnas: Sucursales y Top Gastos */}
      <div className="mensual-grid">
        {/* Por Sucursal */}
        <div className="card">
          <h2 className="card-title">Ventas por Sucursal</h2>
          <div className="sucursales-list">
            {data?.sucursales?.map((s, idx) => (
              <div key={idx} className={`sucursal-item ${s.tipo === 'virtual' ? 'virtual' : ''}`}>
                <div className="sucursal-info">
                  <span className="sucursal-nombre">{s.nombre}</span>
                  {s.tipo === 'virtual' && <span className="tag-virtual">Virtual</span>}
                </div>
                <div className="sucursal-montos">
                  {s.tipo !== 'virtual' && (
                    <span className="monto-ventas">{formatMoney(s.ventas)}</span>
                  )}
                  <span className="monto-gastos">-{formatMoney(s.gastos)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Gastos */}
        <div className="card">
          <h2 className="card-title">Top Categorias de Gasto</h2>
          <div className="gastos-list">
            {data?.topGastos?.map((g, idx) => (
              <div key={idx} className="gasto-item">
                <div className="gasto-rank">{idx + 1}</div>
                <span className="gasto-categoria">{g.categoria}</span>
                <span className="gasto-total">{formatMoney(g.total)}</span>
              </div>
            ))}
            {data?.topGastos?.length === 0 && (
              <p className="empty-message">Sin gastos registrados</p>
            )}
          </div>
        </div>
      </div>

      {/* Grafico de ventas diarias (simple) */}
      <div className="card">
        <h2 className="card-title">Ventas por Dia</h2>
        <div className="chart-container">
          <div className="bar-chart">
            {data?.ventasPorDia?.map((d, idx) => {
              const maxVenta = Math.max(...(data?.ventasPorDia?.map(v => v.ventas) || [1]));
              const height = maxVenta > 0 ? (d.ventas / maxVenta) * 100 : 0;
              return (
                <div key={idx} className="bar-item" title={`${d.dia}: ${formatMoney(d.ventas)}`}>
                  <div className="bar" style={{ height: `${height}%` }}></div>
                  <span className="bar-label">{d.dia}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResumenMensual;
