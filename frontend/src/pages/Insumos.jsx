import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './Insumos.css';

function Insumos() {
  const [insumos, setInsumos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingInsumo, setEditingInsumo] = useState(null);
  const [showHistorialModal, setShowHistorialModal] = useState(false);
  const [selectedInsumo, setSelectedInsumo] = useState(null);
  const [showPrecioModal, setShowPrecioModal] = useState(false);

  useEffect(() => {
    cargarInsumos();
  }, []);

  const cargarInsumos = async () => {
    setLoading(true);
    try {
      const data = await api.get('/insumos');
      setInsumos(data);
    } catch (error) {
      console.error('Error cargando insumos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (insumoData) => {
    try {
      if (editingInsumo) {
        await api.put(`/insumos/${editingInsumo.id}`, insumoData);
      } else {
        await api.post('/insumos', insumoData);
      }
      setShowForm(false);
      setEditingInsumo(null);
      cargarInsumos();
    } catch (error) {
      alert(error.message || 'Error al guardar');
    }
  };

  const handleEdit = (insumo) => {
    setEditingInsumo(insumo);
    setShowForm(true);
  };

  const handleDelete = async (insumo) => {
    if (!confirm(`¿Desactivar insumo "${insumo.nombre}"?`)) {
      return;
    }
    try {
      await api.delete(`/insumos/${insumo.id}`);
      cargarInsumos();
    } catch (error) {
      alert(error.message || 'Error al desactivar');
    }
  };

  const handleVerHistorial = (insumo) => {
    setSelectedInsumo(insumo);
    setShowHistorialModal(true);
  };

  const handleActualizarPrecio = (insumo) => {
    setSelectedInsumo(insumo);
    setShowPrecioModal(true);
  };

  const handlePrecioGuardado = () => {
    setShowPrecioModal(false);
    setSelectedInsumo(null);
    cargarInsumos();
  };

  if (loading) {
    return <div className="loading">Cargando insumos...</div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Insumos</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          + Nuevo Insumo
        </button>
      </div>

      <div className="insumos-grid">
        {insumos.map(insumo => (
          <InsumoCard
            key={insumo.id}
            insumo={insumo}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onVerHistorial={handleVerHistorial}
            onActualizarPrecio={handleActualizarPrecio}
          />
        ))}
        {insumos.length === 0 && (
          <p className="empty-message">No hay insumos registrados</p>
        )}
      </div>

      {showForm && (
        <InsumoForm
          insumo={editingInsumo}
          onSubmit={handleSubmit}
          onClose={() => {
            setShowForm(false);
            setEditingInsumo(null);
          }}
        />
      )}

      {showHistorialModal && selectedInsumo && (
        <HistorialModal
          insumo={selectedInsumo}
          onClose={() => {
            setShowHistorialModal(false);
            setSelectedInsumo(null);
          }}
        />
      )}

      {showPrecioModal && selectedInsumo && (
        <PrecioModal
          insumo={selectedInsumo}
          onClose={() => {
            setShowPrecioModal(false);
            setSelectedInsumo(null);
          }}
          onSave={handlePrecioGuardado}
        />
      )}
    </div>
  );
}

function InsumoCard({ insumo, onEdit, onDelete, onVerHistorial, onActualizarPrecio }) {
  const formatMoney = (amount) => {
    if (amount === null || amount === undefined) return 'Sin precio';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  // Calcular precios derivados
  const factor = parseFloat(insumo.factorConversion) || 1;
  const precioBase = insumo.precioActual;
  const precioPorUnidadBase = precioBase ? precioBase / factor : null;
  const precioMediaUnidad = precioBase ? precioBase / 2 : null;

  return (
    <div className={`insumo-card card ${!insumo.activo ? 'insumo-inactivo' : ''}`}>
      <div className="insumo-header">
        <h3>{insumo.nombre}</h3>
        {!insumo.activo && (
          <span className="badge badge-error">Inactivo</span>
        )}
      </div>

      <div className="insumo-precios">
        {precioBase !== null ? (
          <>
            <div className="precio-principal">
              <span className="precio-valor">{formatMoney(precioBase)}</span>
              <span className="precio-unidad">por {insumo.unidadCompra}</span>
            </div>

            {factor > 1 && (
              <div className="precios-calculados">
                <div className="precio-calculado">
                  <span className="precio-label">Media {insumo.unidadCompra}:</span>
                  <span className="precio-valor-sm">{formatMoney(precioMediaUnidad)}</span>
                </div>
                <div className="precio-calculado">
                  <span className="precio-label">Por {insumo.unidadBase}:</span>
                  <span className="precio-valor-sm">{formatMoney(precioPorUnidadBase)}</span>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="precio-principal sin-precio">
            <span>Sin precio registrado</span>
          </div>
        )}
      </div>

      {factor > 1 && (
        <p className="insumo-factor">
          1 {insumo.unidadCompra} = {factor} {insumo.unidadBase}
        </p>
      )}

      <div className="insumo-actions">
        <button
          className="btn btn-primary btn-sm"
          onClick={() => onActualizarPrecio(insumo)}
        >
          Actualizar Precio
        </button>
        <button
          className="btn btn-info btn-sm"
          onClick={() => onVerHistorial(insumo)}
        >
          Historial
        </button>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => onEdit(insumo)}
        >
          Editar
        </button>
        {insumo.activo && (
          <button
            className="btn btn-danger btn-sm"
            onClick={() => onDelete(insumo)}
          >
            Desactivar
          </button>
        )}
      </div>
    </div>
  );
}

function InsumoForm({ insumo, onSubmit, onClose }) {
  const [nombre, setNombre] = useState(insumo?.nombre || '');
  const [unidadBase, setUnidadBase] = useState(insumo?.unidadBase || 'kg');
  const [unidadCompra, setUnidadCompra] = useState(insumo?.unidadCompra || 'kg');
  const [factorConversion, setFactorConversion] = useState(insumo?.factorConversion || 1);
  const [precio, setPrecio] = useState('');
  const [activo, setActivo] = useState(insumo?.activo ?? true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) {
      alert('El nombre es requerido');
      return;
    }
    setLoading(true);
    await onSubmit({
      nombre: nombre.trim(),
      unidadBase,
      unidadCompra,
      factorConversion: parseFloat(factorConversion) || 1,
      precio: precio ? parseFloat(precio) : null,
      activo
    });
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{insumo ? 'Editar Insumo' : 'Nuevo Insumo'}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-content">
          <div className="form-group">
            <label className="form-label">Nombre *</label>
            <input
              type="text"
              className="form-input"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Masa, Papas, Salsas"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Unidad de compra</label>
              <select
                className="form-input"
                value={unidadCompra}
                onChange={(e) => setUnidadCompra(e.target.value)}
              >
                <option value="kg">kg</option>
                <option value="maleta">maleta</option>
                <option value="litro">litro</option>
                <option value="pieza">pieza</option>
                <option value="paquete">paquete</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Unidad base</label>
              <select
                className="form-input"
                value={unidadBase}
                onChange={(e) => setUnidadBase(e.target.value)}
              >
                <option value="kg">kg</option>
                <option value="litro">litro</option>
                <option value="pieza">pieza</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Factor de conversión</label>
            <input
              type="number"
              className="form-input"
              value={factorConversion}
              onChange={(e) => setFactorConversion(e.target.value)}
              min="0.01"
              step="0.01"
              placeholder="Ej: 50 (1 maleta = 50 kg)"
            />
            <small className="form-help">
              ¿Cuántas unidades base hay en una unidad de compra?
            </small>
          </div>

          {!insumo && (
            <div className="form-group">
              <label className="form-label">Precio inicial (opcional)</label>
              <input
                type="number"
                className="form-input"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                min="0"
                step="0.01"
                placeholder="$0.00"
              />
            </div>
          )}

          {insumo && (
            <div className="form-group">
              <label className="form-checkbox">
                <input
                  type="checkbox"
                  checked={activo}
                  onChange={(e) => setActivo(e.target.checked)}
                />
                <span>Insumo activo</span>
              </label>
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PrecioModal({ insumo, onClose, onSave }) {
  const [precio, setPrecio] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!precio || parseFloat(precio) <= 0) {
      alert('Ingresa un precio válido');
      return;
    }
    setLoading(true);
    try {
      await api.post(`/insumos/${insumo.id}/precios`, {
        precio: parseFloat(precio)
      });
      onSave();
    } catch (error) {
      alert(error.message || 'Error al guardar precio');
    } finally {
      setLoading(false);
    }
  };

  const factor = parseFloat(insumo.factorConversion) || 1;
  const precioNum = parseFloat(precio) || 0;
  const precioPorUnidadBase = precioNum / factor;
  const precioMedia = precioNum / 2;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Actualizar Precio - {insumo.nombre}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-content">
          <div className="form-group">
            <label className="form-label">
              Precio por {insumo.unidadCompra} *
            </label>
            <input
              type="number"
              className="form-input form-input-lg"
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              min="0.01"
              step="0.01"
              placeholder="$0.00"
              autoFocus
              required
            />
          </div>

          {factor > 1 && precioNum > 0 && (
            <div className="precio-preview">
              <h4>Precios calculados:</h4>
              <div className="preview-item">
                <span>Media {insumo.unidadCompra} ({factor/2} {insumo.unidadBase}):</span>
                <strong>${precioMedia.toFixed(2)}</strong>
              </div>
              <div className="preview-item">
                <span>Por {insumo.unidadBase}:</span>
                <strong>${precioPorUnidadBase.toFixed(2)}</strong>
              </div>
            </div>
          )}

          {insumo.precioActual && (
            <p className="precio-actual-info">
              Precio actual: ${parseFloat(insumo.precioActual).toFixed(2)} por {insumo.unidadCompra}
            </p>
          )}

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Precio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function HistorialModal({ insumo, onClose }) {
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarHistorial();
  }, [insumo.id]);

  const cargarHistorial = async () => {
    setLoading(true);
    try {
      const data = await api.get(`/insumos/${insumo.id}/precios`);
      setHistorial(data.precios || []);
    } catch (error) {
      console.error('Error cargando historial:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Historial de Precios - {insumo.nombre}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-content">
          {loading ? (
            <div className="loading">Cargando historial...</div>
          ) : historial.length > 0 ? (
            <div className="historial-lista">
              {historial.map((registro, idx) => (
                <div key={registro.id} className={`historial-item ${idx === 0 ? 'actual' : ''}`}>
                  <div className="historial-fecha">
                    {formatDate(registro.fechaInicio)}
                    {idx === 0 && <span className="badge badge-success">Actual</span>}
                  </div>
                  <div className="historial-precio">
                    <span className="precio-valor">{formatMoney(registro.precio)}</span>
                    <span className="precio-unidad">por {insumo.unidadCompra}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-message">Sin historial de precios</p>
          )}
        </div>

        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

export default Insumos;
