import React, { useState } from 'react';
import './ModalAbono.css';

function ModalAbono({ pedido, onConfirm, onClose }) {
  const [monto, setMonto] = useState('');
  const [tipo, setTipo] = useState('efectivo');
  const [notas, setNotas] = useState('');
  const [loading, setLoading] = useState(false);

  const saldoPendiente = parseFloat(pedido.saldoPendiente) || 0;
  const montoIngresado = parseFloat(monto) || 0;
  const nuevoSaldo = saldoPendiente - montoIngresado;

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (montoIngresado <= 0) {
      alert('El monto debe ser mayor a 0');
      return;
    }

    if (montoIngresado > saldoPendiente) {
      alert('El monto no puede exceder el saldo pendiente');
      return;
    }

    setLoading(true);
    try {
      await onConfirm({
        monto: montoIngresado,
        tipo,
        notas: notas.trim() || null
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePagoTotal = () => setMonto(saldoPendiente.toString());

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-abono" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Registrar Abono</h3>
          <button type="button" className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="abono-info">
            <div className="info-row">
              <span className="info-label">Pedido:</span>
              <span className="info-value">#{pedido.id}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Fecha:</span>
              <span className="info-value">{formatDate(pedido.fecha)}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Total del pedido:</span>
              <span className="info-value">{formatMoney(pedido.total)}</span>
            </div>
            <div className="info-row highlight">
              <span className="info-label">Saldo pendiente:</span>
              <span className="info-value info-deuda">{formatMoney(saldoPendiente)}</span>
            </div>
          </div>

          <div className="abono-acciones">
            <button
              type="button"
              className="btn-pago-total"
              onClick={handlePagoTotal}
            >
              Liquidar Total ({formatMoney(saldoPendiente)})
            </button>
          </div>

          <div className="form-group">
            <label className="form-label">Monto del Abono *</label>
            <input
              type="number"
              className="form-input input-monto"
              value={monto}
              onChange={e => setMonto(e.target.value)}
              min="1"
              max={saldoPendiente}
              step="1"
              placeholder="0"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Tipo de Pago</label>
            <select
              className="form-input"
              value={tipo}
              onChange={e => setTipo(e.target.value)}
            >
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
              <option value="otro">Otro</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Notas (opcional)</label>
            <textarea
              className="form-input"
              value={notas}
              onChange={e => setNotas(e.target.value)}
              placeholder="Notas adicionales sobre el pago"
              rows={2}
            />
          </div>

          {montoIngresado > 0 && (
            <div className={`abono-resultado ${nuevoSaldo <= 0 ? 'liquidado' : 'pendiente'}`}>
              <span className="resultado-label">
                {nuevoSaldo <= 0 ? 'Deuda liquidada' : 'Nuevo saldo:'}
              </span>
              <span className="resultado-value">
                {nuevoSaldo <= 0 ? formatMoney(0) : formatMoney(nuevoSaldo)}
              </span>
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || montoIngresado <= 0}
            >
              {loading ? 'Registrando...' : 'Registrar Abono'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ModalAbono;
