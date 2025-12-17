import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './GastoForm.css';

function GastoForm({ onSubmit, onClose }) {
  const [categorias, setCategorias] = useState([]);
  const [categoriaId, setCategoriaId] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [monto, setMonto] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/categorias').then(setCategorias).catch(console.error);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!categoriaId || !monto) return;

    setLoading(true);
    try {
      await onSubmit({
        categoriaId: parseInt(categoriaId),
        descripcion: descripcion || null,
        monto: parseFloat(monto)
      });
    } finally {
      setLoading(false);
    }
  };

  const categoriaSeleccionada = categorias.find(c => c.id === parseInt(categoriaId));
  const esNomina = categoriaSeleccionada?.tipo === 'nomina';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Agregar Gasto</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-content">
          <div className="form-group">
            <label className="form-label">Categoría</label>
            <select
              className="form-input"
              value={categoriaId}
              onChange={(e) => setCategoriaId(e.target.value)}
              required
            >
              <option value="">Seleccionar categoría</option>
              <optgroup label="Gastos Operativos">
                {categorias.filter(c => c.tipo === 'operativo').map(c => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </optgroup>
              <optgroup label="Nómina">
                {categorias.filter(c => c.tipo === 'nomina').map(c => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </optgroup>
            </select>
          </div>

          {esNomina && (
            <div className="form-group">
              <label className="form-label">Nombre del empleado</label>
              <input
                type="text"
                className="form-input"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Ej: Martha"
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Monto</label>
            <input
              type="number"
              className="form-input"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              placeholder="$0.00"
              min="0"
              step="0.01"
              required
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Agregar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default GastoForm;
