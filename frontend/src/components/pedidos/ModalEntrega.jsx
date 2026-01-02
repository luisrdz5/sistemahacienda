import React, { useState } from 'react';
import './ModalEntrega.css';

function ModalEntrega({ pedido, onConfirm, onClose }) {
  const [montoPagado, setMontoPagado] = useState(pedido.total || 0);
  const [tipoPago, setTipoPago] = useState('efectivo');
  const [observaciones, setObservaciones] = useState('');
  const [loading, setLoading] = useState(false);

  const total = parseFloat(pedido.total) || 0;
  const montoIngresado = parseFloat(montoPagado) || 0;
  const saldoResultante = total - montoIngresado;
  const requiereObservacion = montoIngresado === 0;

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (requiereObservacion && !observaciones.trim()) {
      alert('Debe indicar una observacion si no recibe pago');
      return;
    }

    setLoading(true);
    try {
      await onConfirm({
        montoPagado: montoIngresado,
        tipoPago,
        observaciones: observaciones.trim() || null
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePagoCompleto = () => setMontoPagado(total);
  const handleSinPago = () => setMontoPagado(0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-entrega" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Registrar Entrega</h3>
          <button type="button" className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="entrega-info">
            <div className="info-row">
              <span className="info-label">Cliente:</span>
              <span className="info-value">{pedido.cliente?.nombre || 'Sin cliente'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Total del pedido:</span>
              <span className="info-value info-total">{formatMoney(total)}</span>
            </div>
          </div>

          <div className="entrega-pago-rapido">
            <button
              type="button"
              className={`btn-rapido btn-pago-completo ${montoIngresado === total ? 'active' : ''}`}
              onClick={handlePagoCompleto}
            >
              Pago Completo
            </button>
            <button
              type="button"
              className={`btn-rapido btn-sin-pago ${montoIngresado === 0 ? 'active' : ''}`}
              onClick={handleSinPago}
            >
              Sin Pago
            </button>
          </div>

          <div className="form-group">
            <label className="form-label">Monto Recibido</label>
            <input
              type="number"
              className="form-input input-monto"
              value={montoPagado}
              onChange={e => setMontoPagado(e.target.value)}
              min="0"
              max={total}
              step="1"
            />
          </div>

          {montoIngresado > 0 && (
            <div className="form-group">
              <label className="form-label">Tipo de Pago</label>
              <select
                className="form-input"
                value={tipoPago}
                onChange={e => setTipoPago(e.target.value)}
              >
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
                <option value="otro">Otro</option>
              </select>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">
              Observaciones {requiereObservacion && <span className="required">*</span>}
            </label>
            <textarea
              className="form-input"
              value={observaciones}
              onChange={e => setObservaciones(e.target.value)}
              placeholder={requiereObservacion
                ? "Obligatorio: indique por que no se recibio pago"
                : "Opcional: notas adicionales"
              }
              rows={3}
            />
          </div>

          <div className={`entrega-saldo ${saldoResultante > 0 ? 'deuda' : 'pagado'}`}>
            <span className="saldo-label">Saldo pendiente:</span>
            <span className="saldo-value">{formatMoney(Math.max(0, saldoResultante))}</span>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Registrando...' : 'Confirmar Entrega'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ModalEntrega;
