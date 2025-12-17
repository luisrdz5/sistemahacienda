import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './Categorias.css';

function Categorias() {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState(null);
  const [mostrarInactivas, setMostrarInactivas] = useState(false);

  useEffect(() => {
    cargarCategorias();
  }, [mostrarInactivas]);

  const cargarCategorias = async () => {
    setLoading(true);
    try {
      const params = mostrarInactivas ? '?incluirInactivas=true' : '';
      const data = await api.get(`/categorias${params}`);
      setCategorias(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (categoriaData) => {
    try {
      if (editingCategoria) {
        await api.put(`/categorias/${editingCategoria.id}`, categoriaData);
      } else {
        await api.post('/categorias', categoriaData);
      }
      setShowForm(false);
      setEditingCategoria(null);
      cargarCategorias();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleEdit = (categoria) => {
    setEditingCategoria(categoria);
    setShowForm(true);
  };

  const handleDelete = async (categoria) => {
    if (!confirm(`¿Eliminar la categoría "${categoria.nombre}"?`)) {
      return;
    }
    try {
      const response = await api.delete(`/categorias/${categoria.id}`);
      alert(response.message);
      cargarCategorias();
    } catch (error) {
      alert(error.message);
    }
  };

  const getTipoBadgeClass = (tipo) => {
    return tipo === 'operativo' ? 'badge-info' : 'badge-warning';
  };

  if (loading) {
    return <div className="loading">Cargando categorías...</div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Categorías de Gasto</h1>
        <div className="page-actions">
          <label className="form-checkbox">
            <input
              type="checkbox"
              checked={mostrarInactivas}
              onChange={(e) => setMostrarInactivas(e.target.checked)}
            />
            <span>Mostrar inactivas</span>
          </label>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            + Nueva Categoría
          </button>
        </div>
      </div>

      <div className="categorias-container">
        <div className="categorias-section">
          <h2 className="section-title">Operativos</h2>
          <div className="categorias-grid">
            {categorias
              .filter(c => c.tipo === 'operativo')
              .map(categoria => (
                <CategoriaCard
                  key={categoria.id}
                  categoria={categoria}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  getTipoBadgeClass={getTipoBadgeClass}
                />
              ))}
          </div>
        </div>

        <div className="categorias-section">
          <h2 className="section-title">Nómina</h2>
          <div className="categorias-grid">
            {categorias
              .filter(c => c.tipo === 'nomina')
              .map(categoria => (
                <CategoriaCard
                  key={categoria.id}
                  categoria={categoria}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  getTipoBadgeClass={getTipoBadgeClass}
                />
              ))}
          </div>
        </div>
      </div>

      {showForm && (
        <CategoriaForm
          categoria={editingCategoria}
          onSubmit={handleSubmit}
          onClose={() => {
            setShowForm(false);
            setEditingCategoria(null);
          }}
        />
      )}
    </div>
  );
}

function CategoriaCard({ categoria, onEdit, onDelete, getTipoBadgeClass }) {
  return (
    <div className={`categoria-card card ${!categoria.activa ? 'categoria-inactiva' : ''}`}>
      <div className="categoria-header">
        <h3>{categoria.nombre}</h3>
        <div className="categoria-badges">
          <span className={`badge ${getTipoBadgeClass(categoria.tipo)}`}>
            {categoria.tipo}
          </span>
          {!categoria.activa && (
            <span className="badge badge-error">Inactiva</span>
          )}
        </div>
      </div>
      <div className="categoria-actions">
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => onEdit(categoria)}
        >
          Editar
        </button>
        <button
          className="btn btn-danger btn-sm"
          onClick={() => onDelete(categoria)}
        >
          Eliminar
        </button>
      </div>
    </div>
  );
}

function CategoriaForm({ categoria, onSubmit, onClose }) {
  const [nombre, setNombre] = useState(categoria?.nombre || '');
  const [tipo, setTipo] = useState(categoria?.tipo || 'operativo');
  const [activa, setActiva] = useState(categoria?.activa ?? true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit({ nombre, tipo, activa });
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{categoria ? 'Editar Categoría' : 'Nueva Categoría'}</h3>
          <button className="modal-close" onClick={onClose}>x</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-content">
          <div className="form-group">
            <label className="form-label">Nombre</label>
            <input
              type="text"
              className="form-input"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Gas, Luz, Sueldos"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Tipo</label>
            <select
              className="form-input"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
            >
              <option value="operativo">Operativo</option>
              <option value="nomina">Nómina</option>
            </select>
          </div>

          {categoria && (
            <div className="form-group">
              <label className="form-checkbox">
                <input
                  type="checkbox"
                  checked={activa}
                  onChange={(e) => setActiva(e.target.checked)}
                />
                <span>Categoría activa</span>
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

export default Categorias;
