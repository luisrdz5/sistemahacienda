import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './Sucursales.css';

function Sucursales() {
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSucursal, setEditingSucursal] = useState(null);

  useEffect(() => {
    cargarSucursales();
  }, []);

  const cargarSucursales = async () => {
    setLoading(true);
    try {
      const data = await api.get('/sucursales');
      setSucursales(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (sucursalData) => {
    try {
      if (editingSucursal) {
        await api.put(`/sucursales/${editingSucursal.id}`, sucursalData);
      } else {
        await api.post('/sucursales', sucursalData);
      }
      setShowForm(false);
      setEditingSucursal(null);
      cargarSucursales();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleEdit = (sucursal) => {
    setEditingSucursal(sucursal);
    setShowForm(true);
  };

  if (loading) {
    return <div className="loading">Cargando sucursales...</div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Sucursales</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          + Nueva Sucursal
        </button>
      </div>

      <div className="sucursales-grid">
        {sucursales.map(sucursal => (
          <div key={sucursal.id} className="sucursal-card card">
            <div className="sucursal-header">
              <h3>{sucursal.nombre}</h3>
              <span className={`badge badge-${sucursal.activa ? 'success' : 'error'}`}>
                {sucursal.activa ? 'Activa' : 'Inactiva'}
              </span>
            </div>
            {sucursal.direccion && (
              <p className="sucursal-direccion">{sucursal.direccion}</p>
            )}
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => handleEdit(sucursal)}
            >
              Editar
            </button>
          </div>
        ))}
      </div>

      {showForm && (
        <SucursalForm
          sucursal={editingSucursal}
          onSubmit={handleSubmit}
          onClose={() => {
            setShowForm(false);
            setEditingSucursal(null);
          }}
        />
      )}
    </div>
  );
}

function SucursalForm({ sucursal, onSubmit, onClose }) {
  const [nombre, setNombre] = useState(sucursal?.nombre || '');
  const [direccion, setDireccion] = useState(sucursal?.direccion || '');
  const [activa, setActiva] = useState(sucursal?.activa ?? true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit({ nombre, direccion, activa });
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{sucursal ? 'Editar Sucursal' : 'Nueva Sucursal'}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-content">
          <div className="form-group">
            <label className="form-label">Nombre</label>
            <input
              type="text"
              className="form-input"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Hacienda"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Dirección</label>
            <input
              type="text"
              className="form-input"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              placeholder="Ej: Av. Principal #123"
            />
          </div>

          {sucursal && (
            <div className="form-group">
              <label className="form-checkbox">
                <input
                  type="checkbox"
                  checked={activa}
                  onChange={(e) => setActiva(e.target.checked)}
                />
                <span>Sucursal activa</span>
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

export default Sucursales;
