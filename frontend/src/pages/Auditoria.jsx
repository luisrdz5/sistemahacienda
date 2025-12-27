import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import './Auditoria.css';

function Auditoria() {
  const { usuario } = useAuth();
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [sucursalFiltro, setSucursalFiltro] = useState('');
  const [sucursales, setSucursales] = useState([]);
  const [auditoria, setAuditoria] = useState(null);
  const [loading, setLoading] = useState(true);
  const [diaSeleccionado, setDiaSeleccionado] = useState(null);
  const [vistaTabla, setVistaTabla] = useState(false);

  const isAdmin = usuario?.rol === 'admin';

  useEffect(() => {
    const cargarSucursales = async () => {
      try {
        const data = await api.get('/sucursales');
        setSucursales(data);
      } catch (error) {
        console.error('Error cargando sucursales:', error);
      }
    };
    cargarSucursales();
  }, []);

  useEffect(() => {
    const cargarAuditoria = async () => {
      setLoading(true);
      try {
        let url = `/dashboard/auditoria?mes=${mes}&anio=${anio}`;
        if (sucursalFiltro) {
          url += `&sucursalId=${sucursalFiltro}`;
        }
        const data = await api.get(url);
        setAuditoria(data);
      } catch (error) {
        console.error('Error cargando auditoría:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarAuditoria();
  }, [mes, anio, sucursalFiltro]);

  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

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
    setDiaSeleccionado(null);
  };

  const getEstadoGeneral = (sucursales) => {
    if (!sucursales || sucursales.length === 0) return 'pendiente';
    const estados = sucursales.map(s => s.estado);
    if (estados.every(e => e === 'completado')) return 'completado';
    if (estados.some(e => e === 'completado' || e === 'borrador')) return 'parcial';
    return 'pendiente';
  };

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount || 0);
  };

  const getDiaDetalle = () => {
    if (!diaSeleccionado || !auditoria?.auditoria) return null;
    return auditoria.auditoria.find(d => d.fecha === diaSeleccionado);
  };

  if (loading) {
    return <div className="loading">Cargando auditoría...</div>;
  }

  const estadisticas = auditoria?.estadisticas || {};
  const diaDetalle = getDiaDetalle();

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Auditoría de Cierres</h1>
        <div className="page-actions">
          {isAdmin && (
            <select
              className="form-input"
              value={sucursalFiltro}
              onChange={(e) => setSucursalFiltro(e.target.value)}
            >
              <option value="">Todas las sucursales</option>
              {sucursales.map(s => (
                <option key={s.id} value={s.id}>{s.nombre}</option>
              ))}
            </select>
          )}
          <button
            className={`btn ${vistaTabla ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setVistaTabla(!vistaTabla)}
          >
            {vistaTabla ? 'Ver Calendario' : 'Ver Tabla'}
          </button>
        </div>
      </div>

      {/* Estadísticas del mes */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Completitud</span>
          <span className="stat-value">{estadisticas.porcentajeCompletitud || 0}%</span>
          <div className="stat-bar">
            <div
              className="stat-bar-fill"
              style={{ width: `${estadisticas.porcentajeCompletitud || 0}%` }}
            />
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-label">Ventas del Mes</span>
          <span className="stat-value stat-success">{formatMoney(estadisticas.totalVentas)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Gastos del Mes</span>
          <span className="stat-value stat-error">{formatMoney(estadisticas.totalGastos)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Utilidad Neta</span>
          <span className={`stat-value ${estadisticas.utilidadNeta >= 0 ? 'stat-success' : 'stat-error'}`}>
            {formatMoney(estadisticas.utilidadNeta)}
          </span>
        </div>
      </div>

      {/* Navegación de mes */}
      <div className="auditoria-nav">
        <button className="btn btn-secondary" onClick={() => cambiarMes(-1)}>
          ← Anterior
        </button>
        <span className="auditoria-periodo">
          {meses[mes - 1]} {anio}
        </span>
        <button className="btn btn-secondary" onClick={() => cambiarMes(1)}>
          Siguiente →
        </button>
      </div>

      {/* Vista de Calendario o Tabla */}
      {vistaTabla ? (
        <div className="auditoria-tabla card">
          <table className="tabla">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Día</th>
                {(sucursalFiltro ? sucursales.filter(s => s.id === parseInt(sucursalFiltro)) : sucursales).map(s => (
                  <th key={s.id}>{s.nombre}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {auditoria?.auditoria?.map((dia) => {
                const fecha = new Date(dia.fecha);
                return (
                  <tr key={dia.fecha} onClick={() => setDiaSeleccionado(dia.fecha === diaSeleccionado ? null : dia.fecha)}>
                    <td>{fecha.getDate()}</td>
                    <td className="dia-semana">{dia.diaSemana}</td>
                    {dia.sucursales.map(s => (
                      <td key={s.sucursalId}>
                        <span className={`badge badge-${s.estado === 'completado' ? 'success' : s.estado === 'borrador' ? 'warning' : 'error'}`}>
                          {s.estado === 'completado' ? formatMoney(s.ventaTotal) : s.estado === 'borrador' ? 'Borrador' : '-'}
                        </span>
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="auditoria-calendar">
          <div className="calendar-header">
            <span>L</span>
            <span>M</span>
            <span>M</span>
            <span>J</span>
            <span>V</span>
            <span>S</span>
            <span>D</span>
          </div>

          <div className="calendar-body">
            {auditoria?.auditoria?.map((dia, index) => {
              const fecha = new Date(dia.fecha);
              const diaSemana = fecha.getDay();

              const espacios = index === 0 ? Array(diaSemana === 0 ? 6 : diaSemana - 1).fill(null) : [];
              const estadoGeneral = getEstadoGeneral(dia.sucursales);
              const ventaDia = dia.sucursales.reduce((sum, s) => sum + (s.ventaTotal || 0), 0);

              return (
                <React.Fragment key={dia.fecha}>
                  {espacios.map((_, i) => (
                    <div key={`empty-${i}`} className="calendar-day empty" />
                  ))}
                  <div
                    className={`calendar-day ${estadoGeneral} ${diaSeleccionado === dia.fecha ? 'selected' : ''}`}
                    onClick={() => setDiaSeleccionado(dia.fecha === diaSeleccionado ? null : dia.fecha)}
                  >
                    <span className="day-number">{fecha.getDate()}</span>
                    {estadoGeneral === 'completado' && ventaDia > 0 && (
                      <span className="day-venta">{formatMoney(ventaDia).replace('MXN', '').trim()}</span>
                    )}
                    <span className={`day-status status-${estadoGeneral}`} />
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* Detalle del día seleccionado */}
      {diaDetalle && (
        <div className="auditoria-detalle card">
          <div className="detalle-header">
            <h3>
              {new Date(diaSeleccionado).toLocaleDateString('es-MX', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
              })}
            </h3>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setDiaSeleccionado(null)}
            >
              Cerrar
            </button>
          </div>

          <div className="detalle-sucursales">
            {diaDetalle.sucursales.map(s => (
              <div key={s.sucursalId} className={`detalle-sucursal-card ${s.estado}`}>
                <div className="detalle-sucursal-header">
                  <span className="detalle-sucursal-nombre">{s.sucursal}</span>
                  <span className={`badge badge-${s.estado === 'completado' ? 'success' : s.estado === 'borrador' ? 'warning' : 'error'}`}>
                    {s.estado === 'completado' ? 'Completado' : s.estado === 'borrador' ? 'Borrador' : 'Pendiente'}
                  </span>
                </div>

                {s.estado !== 'pendiente' && s.tipo !== 'virtual' && (
                  <div className="detalle-sucursal-datos">
                    <div className="dato">
                      <span className="dato-label">Venta Total</span>
                      <span className="dato-value">{formatMoney(s.ventaTotal)}</span>
                    </div>
                    <div className="dato">
                      <span className="dato-label">Efectivo Caja</span>
                      <span className="dato-value">{formatMoney(s.efectivoCaja)}</span>
                    </div>
                    <div className="dato">
                      <span className="dato-label">Gastos</span>
                      <span className="dato-value dato-error">{formatMoney(s.totalGastos)}</span>
                    </div>
                    <div className="dato">
                      <span className="dato-label">Utilidad</span>
                      <span className={`dato-value ${s.utilidad >= 0 ? 'dato-success' : 'dato-error'}`}>
                        {formatMoney(s.utilidad)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Detalle de gastos para sucursales virtuales */}
                {s.estado !== 'pendiente' && s.tipo === 'virtual' && (
                  <div className="detalle-sucursal-gastos">
                    {s.gastos && s.gastos.length > 0 ? (
                      <>
                        <div className="gastos-lista">
                          {s.gastos.map((gasto, idx) => (
                            <div key={idx} className="gasto-item">
                              <span className="gasto-descripcion">
                                {gasto.descripcion || gasto.categoria}
                              </span>
                              <span className="gasto-monto">{formatMoney(gasto.monto)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="gastos-total">
                          <span>Total</span>
                          <span className="dato-error">{formatMoney(s.totalGastos)}</span>
                        </div>
                      </>
                    ) : (
                      <p className="sin-gastos">Sin gastos registrados</p>
                    )}
                  </div>
                )}

                {s.estado === 'pendiente' && (
                  <p className="detalle-pendiente">Sin registro de corte</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leyenda */}
      <div className="auditoria-legend">
        <div className="legend-item">
          <span className="legend-dot completado" />
          <span>Completado ({estadisticas.cortesCompletados || 0})</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot parcial" />
          <span>Borrador ({estadisticas.cortesBorrador || 0})</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot pendiente" />
          <span>Pendiente ({estadisticas.cortesPendientes || 0})</span>
        </div>
      </div>
    </div>
  );
}

export default Auditoria;
