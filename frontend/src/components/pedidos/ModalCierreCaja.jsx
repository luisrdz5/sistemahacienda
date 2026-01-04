import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import './ModalCierreCaja.css';

function ModalCierreCaja({ fecha, repartidorId, repartidorNombre, onClose, onConfirm }) {
  const [cobros, setCobros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notasGenerales, setNotasGenerales] = useState('');
  const [cortePrevio, setCortePrevio] = useState(null);
  const ticketRef = useRef(null);

  useEffect(() => {
    cargarDetalle();
  }, [fecha, repartidorId]);

  const cargarDetalle = async () => {
    try {
      setLoading(true);
      const data = await api.get(`/cortes-pedidos/cierre/${fecha}/${repartidorId}`);
      setCobros(data.cobros || []);
      setCortePrevio(data.cortePrevio);
      if (data.cortePrevio?.notasCierre) {
        setNotasGenerales(data.cortePrevio.notasCierre);
      }
    } catch (err) {
      setError(err.message || 'Error cargando datos');
    } finally {
      setLoading(false);
    }
  };

  const toggleRecibido = (index) => {
    setCobros(prev => prev.map((c, i) =>
      i === index ? { ...c, recibido: !c.recibido } : c
    ));
  };

  const marcarTodos = (valor) => {
    setCobros(prev => prev.map(c => ({ ...c, recibido: valor })));
  };

  const calcularTotales = () => {
    const esperado = cobros.reduce((sum, c) => sum + c.monto, 0);
    const recibido = cobros.filter(c => c.recibido).reduce((sum, c) => sum + c.monto, 0);
    return {
      esperado,
      recibido,
      diferencia: recibido - esperado
    };
  };

  const handleConfirmar = async () => {
    try {
      setSaving(true);
      setError('');

      const detalles = cobros.map(c => ({
        tipo: c.tipo,
        id: c.id,
        pedidoId: c.pedidoId,
        monto: c.monto,
        recibido: c.recibido,
        notas: c.notas
      }));

      await api.post(`/cortes-pedidos/cierre/${fecha}/${repartidorId}`, {
        detalles,
        notasGenerales
      });

      if (onConfirm) onConfirm();
      onClose();
    } catch (err) {
      setError(err.message || 'Error al confirmar cierre');
    } finally {
      setSaving(false);
    }
  };

  const handleImprimir = async () => {
    try {
      const data = await api.get(`/cortes-pedidos/ticket/${fecha}/${repartidorId}`);
      imprimirTicket(data);
    } catch (err) {
      // Si no hay cierre guardado, imprimir con datos actuales
      const totales = calcularTotales();
      imprimirTicket({
        empresa: 'LA HACIENDA TORTILLAS',
        titulo: 'CIERRE DE CAJA',
        fecha: new Date(fecha).toLocaleDateString('es-MX'),
        repartidor: repartidorNombre,
        entregas: cobros.filter(c => c.tipo === 'entrega').map(c => ({
          cliente: c.cliente,
          monto: c.monto,
          recibido: c.recibido
        })),
        abonos: cobros.filter(c => c.tipo === 'abono').map(c => ({
          cliente: c.cliente,
          monto: c.monto,
          tipo: c.metodoPago,
          recibido: c.recibido
        })),
        totales,
        recibidoPor: '',
        hora: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
        notas: notasGenerales
      });
    }
  };

  const imprimirTicket = (data) => {
    const printWindow = window.open('', '_blank', 'width=350,height=600');

    const entregasHTML = data.entregas.map((e, i) => `
      <tr class="${!e.recibido ? 'no-recibido' : ''}">
        <td>${i + 1}. ${e.cliente.substring(0, 18)}</td>
        <td class="monto">$${e.monto.toFixed(2)}</td>
      </tr>
      ${!e.recibido ? '<tr><td colspan="2" class="nota-no-recibido">** NO RECIBIDO **</td></tr>' : ''}
    `).join('');

    const abonosHTML = data.abonos.length > 0 ? data.abonos.map((a, i) => `
      <tr class="${!a.recibido ? 'no-recibido' : ''}">
        <td>${i + 1}. ${a.cliente.substring(0, 18)}</td>
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
          @media print {
            body { width: 100%; }
          }
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

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount || 0);
  };

  const totales = calcularTotales();
  const entregas = cobros.filter(c => c.tipo === 'entrega');
  const abonos = cobros.filter(c => c.tipo === 'abono');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-cierre" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>Cierre de Caja</h3>
            <span className="cierre-subtitle">{repartidorNombre} - {fecha}</span>
          </div>
          <button className="modal-close" onClick={onClose}>x</button>
        </div>

        <div className="modal-content">
          {loading ? (
            <p className="loading-text">Cargando...</p>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : (
            <>
              {cortePrevio && cortePrevio.estado === 'completado' && (
                <div className="cierre-previo-alert">
                  Cierre ya confirmado por {cortePrevio.cerradoPor} a las {new Date(cortePrevio.cerradoAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}

              {cobros.length === 0 ? (
                <p className="empty-message">No hay cobros para este dia</p>
              ) : (
                <>
                  <div className="cierre-actions-top">
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={() => marcarTodos(true)}
                    >
                      Marcar Todos
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={() => marcarTodos(false)}
                    >
                      Desmarcar Todos
                    </button>
                  </div>

                  {/* Entregas */}
                  {entregas.length > 0 && (
                    <div className="cierre-seccion">
                      <h4>Cobros en Entregas ({entregas.length})</h4>
                      <div className="cobros-lista">
                        {entregas.map((cobro, idx) => {
                          const realIdx = cobros.findIndex(c => c.tipo === 'entrega' && c.id === cobro.id);
                          return (
                            <div
                              key={`entrega-${cobro.id}`}
                              className={`cobro-item ${!cobro.recibido ? 'no-recibido' : ''}`}
                              onClick={() => toggleRecibido(realIdx)}
                            >
                              <input
                                type="checkbox"
                                checked={cobro.recibido}
                                onChange={() => toggleRecibido(realIdx)}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <div className="cobro-info">
                                <span className="cobro-cliente">{cobro.cliente}</span>
                                <span className="cobro-tipo">Entrega</span>
                              </div>
                              <span className="cobro-monto">{formatMoney(cobro.monto)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Abonos */}
                  {abonos.length > 0 && (
                    <div className="cierre-seccion">
                      <h4>Abonos del Dia ({abonos.length})</h4>
                      <div className="cobros-lista">
                        {abonos.map((cobro, idx) => {
                          const realIdx = cobros.findIndex(c => c.tipo === 'abono' && c.id === cobro.id);
                          return (
                            <div
                              key={`abono-${cobro.id}`}
                              className={`cobro-item ${!cobro.recibido ? 'no-recibido' : ''}`}
                              onClick={() => toggleRecibido(realIdx)}
                            >
                              <input
                                type="checkbox"
                                checked={cobro.recibido}
                                onChange={() => toggleRecibido(realIdx)}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <div className="cobro-info">
                                <span className="cobro-cliente">{cobro.cliente}</span>
                                <span className="cobro-tipo">
                                  Abono ({cobro.metodoPago})
                                </span>
                              </div>
                              <span className="cobro-monto">{formatMoney(cobro.monto)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Resumen de totales */}
              <div className="cierre-resumen">
                <div className="resumen-row">
                  <span>Total Esperado:</span>
                  <span className="resumen-value">{formatMoney(totales.esperado)}</span>
                </div>
                <div className="resumen-row">
                  <span>Total Recibido:</span>
                  <span className="resumen-value">{formatMoney(totales.recibido)}</span>
                </div>
                <div className={`resumen-row resumen-diferencia ${totales.diferencia < 0 ? 'negativa' : ''}`}>
                  <span>Diferencia:</span>
                  <span className="resumen-value">{formatMoney(totales.diferencia)}</span>
                </div>
              </div>

              {/* Notas */}
              <div className="form-group">
                <label className="form-label">Notas del cierre (opcional)</label>
                <textarea
                  className="form-input"
                  value={notasGenerales}
                  onChange={(e) => setNotasGenerales(e.target.value)}
                  placeholder="Observaciones..."
                  rows={2}
                />
              </div>
            </>
          )}
        </div>

        <div className="modal-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleImprimir}
            disabled={loading || cobros.length === 0}
          >
            Imprimir
          </button>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleConfirmar}
            disabled={loading || saving || cobros.length === 0}
          >
            {saving ? 'Guardando...' : 'Confirmar Cierre'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModalCierreCaja;
