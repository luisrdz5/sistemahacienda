import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import ModalCierreCaja from '../components/pedidos/ModalCierreCaja';
import './CortePedidos.css';

function CortePedidos() {
  const { usuario, tieneAlgunRol } = useAuth();
  const [resumen, setResumen] = useState(null);
  const [miCorte, setMiCorte] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [cierreModal, setCierreModal] = useState(null); // { repartidorId, repartidorNombre }

  // Verificar roles usando tieneAlgunRol para múltiples roles
  const isRepartidor = usuario?.rol === 'repartidor' && !tieneAlgunRol(['admin', 'administrador_repartidor']);
  const canSeeAll = tieneAlgunRol(['admin', 'administrador_repartidor']);

  useEffect(() => {
    cargarDatos();
  }, [fecha]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      if (isRepartidor) {
        // Repartidor solo ve su corte
        const data = await api.get(`/cortes-pedidos/repartidor?fecha=${fecha}`);
        setMiCorte(data);
      } else if (canSeeAll) {
        // Admin ve resumen general
        const data = await api.get(`/cortes-pedidos/resumen-dia?fecha=${fecha}`);
        setResumen(data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizarCorte = async (repartidorId = null) => {
    if (!confirm('¿Finalizar este corte? No podras modificarlo despues.')) return;

    try {
      await api.post('/cortes-pedidos/finalizar', {
        fecha,
        repartidorId: repartidorId || usuario.id
      });
      cargarDatos();
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

  // Función para imprimir ticket directamente
  const handleImprimir = async (repartidorId, repartidorNombre) => {
    try {
      // Intentar obtener datos del ticket guardado
      let data;
      try {
        data = await api.get(`/cortes-pedidos/ticket/${fecha}/${repartidorId}`);
      } catch {
        // Si no hay cierre guardado, obtener datos frescos
        const detalle = await api.get(`/cortes-pedidos/cierre/${fecha}/${repartidorId}`);
        const totales = {
          esperado: detalle.cobros.reduce((sum, c) => sum + c.monto, 0),
          recibido: detalle.cobros.reduce((sum, c) => sum + c.monto, 0),
          diferencia: 0
        };
        data = {
          empresa: 'LA HACIENDA TORTILLAS',
          titulo: 'CIERRE DE CAJA',
          fecha: new Date(fecha).toLocaleDateString('es-MX'),
          repartidor: repartidorNombre,
          entregas: detalle.cobros.filter(c => c.tipo === 'entrega').map(c => ({
            cliente: c.cliente,
            monto: c.monto,
            recibido: true
          })),
          abonos: detalle.cobros.filter(c => c.tipo === 'abono').map(c => ({
            cliente: c.cliente,
            monto: c.monto,
            tipo: c.metodoPago,
            recibido: true
          })),
          totales,
          recibidoPor: '',
          hora: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
          notas: ''
        };
      }
      imprimirTicket(data);
    } catch (err) {
      alert('Error al imprimir: ' + err.message);
    }
  };

  const imprimirTicket = (data) => {
    const printWindow = window.open('', '_blank', 'width=350,height=600');

    const entregasHTML = data.entregas.map((e, i) => `
      <tr class="${!e.recibido ? 'no-recibido' : ''}">
        <td>${i + 1}. ${(e.cliente || '').substring(0, 18)}</td>
        <td class="monto">$${e.monto.toFixed(2)}</td>
      </tr>
      ${!e.recibido ? '<tr><td colspan="2" class="nota-no-recibido">** NO RECIBIDO **</td></tr>' : ''}
    `).join('');

    const abonosHTML = data.abonos.length > 0 ? data.abonos.map((a, i) => `
      <tr class="${!a.recibido ? 'no-recibido' : ''}">
        <td>${i + 1}. ${(a.cliente || '').substring(0, 18)}</td>
        <td class="monto">$${a.monto.toFixed(2)}</td>
      </tr>
      ${a.tipo !== 'efectivo' ? `<tr><td colspan="2" class="metodo">(${a.tipo})</td></tr>` : ''}
      ${!a.recibido ? '<tr><td colspan="2" class="nota-no-recibido">** NO RECIBIDO **</td></tr>' : ''}
    `).join('') : '<tr><td colspan="2" class="sin-datos">Sin abonos</td></tr>';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Ticket Cierre</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            width: 280px;
            padding: 10px;
          }
          .header { text-align: center; margin-bottom: 10px; }
          .empresa { font-size: 14px; font-weight: bold; }
          .titulo { font-size: 13px; margin-top: 5px; }
          .linea { border-top: 1px dashed #000; margin: 8px 0; }
          .info { margin-bottom: 5px; }
          .seccion { font-weight: bold; margin: 8px 0 5px; }
          table { width: 100%; border-collapse: collapse; }
          td { padding: 2px 0; }
          .monto { text-align: right; }
          .metodo { font-size: 10px; color: #666; padding-left: 15px; }
          .no-recibido { text-decoration: line-through; color: #999; }
          .nota-no-recibido { font-size: 10px; color: red; text-align: center; }
          .sin-datos { text-align: center; color: #999; font-style: italic; }
          .resumen { margin-top: 10px; }
          .resumen-row { display: flex; justify-content: space-between; padding: 2px 0; }
          .diferencia-negativa { color: red; font-weight: bold; }
          .firma { margin-top: 20px; text-align: center; }
          .linea-firma { border-top: 1px solid #000; width: 80%; margin: 30px auto 5px; }
          .notas { margin-top: 10px; font-size: 10px; font-style: italic; }
          @media print { body { width: 100%; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="linea"></div>
          <div class="empresa">${data.empresa}</div>
          <div class="linea"></div>
          <div class="titulo">${data.titulo}</div>
        </div>
        <div class="info">Fecha: ${data.fecha}</div>
        <div class="info">Repartidor: ${data.repartidor}</div>
        <div class="linea"></div>
        <div class="seccion">ENTREGAS DEL DIA</div>
        <div class="linea"></div>
        <table>${entregasHTML || '<tr><td colspan="2" class="sin-datos">Sin entregas</td></tr>'}</table>
        <div class="linea"></div>
        <div class="seccion">ABONOS RECIBIDOS</div>
        <div class="linea"></div>
        <table>${abonosHTML}</table>
        <div class="linea"></div>
        <div class="seccion">RESUMEN</div>
        <div class="linea"></div>
        <div class="resumen">
          <div class="resumen-row">
            <span>Total Esperado:</span>
            <span>$${data.totales.esperado.toFixed(2)}</span>
          </div>
          <div class="resumen-row">
            <span>Total Recibido:</span>
            <span>$${data.totales.recibido.toFixed(2)}</span>
          </div>
          <div class="resumen-row ${data.totales.diferencia < 0 ? 'diferencia-negativa' : ''}">
            <span>Diferencia:</span>
            <span>$${data.totales.diferencia.toFixed(2)}</span>
          </div>
        </div>
        <div class="linea"></div>
        ${data.recibidoPor ? `<div class="info">Recibido por: ${data.recibidoPor}</div>` : ''}
        ${data.hora ? `<div class="info">Hora: ${data.hora}</div>` : ''}
        ${data.notas ? `<div class="notas">Notas: ${data.notas}</div>` : ''}
        <div class="firma">
          <div class="linea-firma"></div>
          <div>Repartidor: ${data.repartidor}</div>
        </div>
        <div class="linea"></div>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  if (loading) {
    return <div className="loading">Cargando cortes...</div>;
  }

  // Vista para repartidor
  if (isRepartidor && miCorte) {
    return (
      <div className="page">
        <div className="page-header">
          <h1 className="page-title">Mi Corte del Dia</h1>
        </div>

        <div className="corte-filtros">
          <div className="form-group">
            <label className="form-label">Fecha</label>
            <input
              type="date"
              className="form-input"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>
        </div>

        <div className="corte-resumen-card card">
          <div className="corte-stats">
            <div className="stat">
              <span className="stat-value">{miCorte.resumen.totalPedidos}</span>
              <span className="stat-label">Pedidos</span>
            </div>
            <div className="stat">
              <span className="stat-value success">{miCorte.resumen.pedidosEntregados}</span>
              <span className="stat-label">Entregados</span>
            </div>
            <div className="stat">
              <span className="stat-value warning">{miCorte.resumen.pedidosPendientes}</span>
              <span className="stat-label">Pendientes</span>
            </div>
            <div className="stat">
              <span className="stat-value primary">{formatMoney(miCorte.resumen.totalMonto)}</span>
              <span className="stat-label">Total Entregado</span>
            </div>
          </div>

          {miCorte.corte?.estado === 'completado' ? (
            <div className="corte-estado completado">
              Corte finalizado
            </div>
          ) : (
            <button
              className="btn btn-primary btn-block"
              onClick={() => handleFinalizarCorte()}
              disabled={miCorte.resumen.pedidosPendientes > 0}
            >
              {miCorte.resumen.pedidosPendientes > 0
                ? `Hay ${miCorte.resumen.pedidosPendientes} pendientes`
                : 'Finalizar Mi Corte'
              }
            </button>
          )}
        </div>

        <div className="corte-pedidos">
          <h2>Mis Pedidos del Dia</h2>
          {miCorte.pedidos.length === 0 ? (
            <p className="empty-message">No tienes pedidos asignados</p>
          ) : (
            miCorte.pedidos.map(pedido => (
              <PedidoItem key={pedido.id} pedido={pedido} formatMoney={formatMoney} />
            ))
          )}
        </div>
      </div>
    );
  }

  // Vista para admin/admin repartidor
  if (canSeeAll && resumen) {
    return (
      <div className="page">
        <div className="page-header">
          <h1 className="page-title">Cortes de Pedidos</h1>
        </div>

        <div className="corte-filtros">
          <div className="form-group">
            <label className="form-label">Fecha</label>
            <input
              type="date"
              className="form-input"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>
        </div>

        <div className="corte-resumen-general card">
          <h2>Resumen General</h2>
          <div className="corte-stats">
            <div className="stat">
              <span className="stat-value">{resumen.totalPedidos}</span>
              <span className="stat-label">Total Pedidos</span>
            </div>
            <div className="stat">
              <span className="stat-value success">{resumen.pedidosEntregados}</span>
              <span className="stat-label">Entregados</span>
            </div>
            <div className="stat">
              <span className="stat-value warning">{resumen.pedidosPendientes}</span>
              <span className="stat-label">Pendientes</span>
            </div>
            <div className="stat">
              <span className="stat-value primary">{formatMoney(resumen.montoEntregado)}</span>
              <span className="stat-label">Monto Entregado</span>
            </div>
          </div>
        </div>

        <div className="cortes-repartidores">
          <h2>Por Repartidor</h2>
          <div className="repartidores-grid">
            {resumen.porRepartidor.map(rep => {
              const corte = resumen.cortes.find(c => c.repartidorId === rep.repartidor.id);
              const efectivoTotal = rep.efectivoTotal || (rep.montoPagado + rep.abonosDelDia);
              return (
                <div key={rep.repartidor.id} className="repartidor-card card">
                  <div className="repartidor-header">
                    <h3>{rep.repartidor.nombre}</h3>
                    {corte?.estado === 'completado' ? (
                      <span className="badge badge-success">Cerrado</span>
                    ) : (
                      <span className="badge badge-warning">Abierto</span>
                    )}
                  </div>

                  <div className="repartidor-stats">
                    <div className="repartidor-stat">
                      <span>{rep.entregados}/{rep.total}</span>
                      <span className="stat-label">Entregados</span>
                    </div>
                    <div className="repartidor-stat">
                      <span className="primary">{formatMoney(rep.montoEntregado)}</span>
                      <span className="stat-label">Monto</span>
                    </div>
                    <div className="repartidor-stat">
                      <span className="success">{formatMoney(efectivoTotal)}</span>
                      <span className="stat-label">Efectivo</span>
                    </div>
                  </div>

                  <div className="repartidor-actions">
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => setCierreModal({
                        repartidorId: rep.repartidor.id,
                        repartidorNombre: rep.repartidor.nombre
                      })}
                    >
                      Recibir Dinero
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleImprimir(rep.repartidor.id, rep.repartidor.nombre)}
                      title="Imprimir ticket de cierre"
                    >
                      Imprimir
                    </button>
                    {corte?.estado !== 'completado' && rep.total - rep.entregados === 0 && (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleFinalizarCorte(rep.repartidor.id)}
                      >
                        Cerrar Corte
                      </button>
                    )}
                  </div>

                  {corte?.cerradoAt && (
                    <div className="repartidor-cierre-info">
                      Cierre: {new Date(corte.cerradoAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                      {corte.diferencia < 0 && (
                        <span className="diferencia-alert"> (Faltante: {formatMoney(Math.abs(corte.diferencia))})</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {resumen.sinAsignar.total > 0 && (
              <div className="repartidor-card card sin-asignar">
                <div className="repartidor-header">
                  <h3>Sin Asignar</h3>
                  <span className="badge badge-error">{resumen.sinAsignar.total}</span>
                </div>
                <p className="text-muted">Pedidos sin repartidor asignado</p>
              </div>
            )}
          </div>
        </div>

        {cierreModal && (
          <ModalCierreCaja
            fecha={fecha}
            repartidorId={cierreModal.repartidorId}
            repartidorNombre={cierreModal.repartidorNombre}
            onClose={() => setCierreModal(null)}
            onConfirm={() => cargarDatos()}
          />
        )}
      </div>
    );
  }

  return <div className="page"><p>No tienes acceso a esta seccion</p></div>;
}

function PedidoItem({ pedido, formatMoney }) {
  const getEstadoBadge = (estado) => {
    const badges = {
      pendiente: 'badge-warning',
      entregado: 'badge-success',
      cancelado: 'badge-error'
    };
    return badges[estado] || 'badge-secondary';
  };

  return (
    <div className={`pedido-corte-item estado-${pedido.estado}`}>
      <div className="pedido-info">
        <strong>{pedido.cliente?.nombre || 'Sin cliente'}</strong>
        <span className={`badge ${getEstadoBadge(pedido.estado)}`}>{pedido.estado}</span>
      </div>
      <div className="pedido-detalles-mini">
        {pedido.detalles?.map(d => (
          <span key={d.id}>{d.cantidad} {d.producto?.nombre}</span>
        ))}
      </div>
      <div className="pedido-total">{formatMoney(pedido.total)}</div>
    </div>
  );
}

export default CortePedidos;
