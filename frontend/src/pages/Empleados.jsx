import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './Empleados.css';

function Empleados() {
  const [empleados, setEmpleados] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEmpleado, setEditingEmpleado] = useState(null);
  const [filtroSucursal, setFiltroSucursal] = useState('');

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    cargarEmpleados();
  }, [filtroSucursal]);

  const cargarDatos = async () => {
    try {
      const [empleadosData, sucursalesData] = await Promise.all([
        api.get('/empleados'),
        api.get('/sucursales')
      ]);
      setEmpleados(empleadosData);
      setSucursales(sucursalesData);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarEmpleados = async () => {
    try {
      const params = filtroSucursal ? `?sucursalId=${filtroSucursal}` : '';
      const data = await api.get(`/empleados${params}`);
      setEmpleados(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleSubmit = async (empleadoData) => {
    try {
      if (editingEmpleado) {
        await api.put(`/empleados/${editingEmpleado.id}`, empleadoData);
      } else {
        await api.post('/empleados', empleadoData);
      }
      setShowForm(false);
      setEditingEmpleado(null);
      cargarEmpleados();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleEdit = (empleado) => {
    setEditingEmpleado(empleado);
    setShowForm(true);
  };

  const handleDelete = async (empleado) => {
    if (!confirm(`¿Desactivar al empleado "${empleado.nombre}"?`)) {
      return;
    }
    try {
      await api.delete(`/empleados/${empleado.id}`);
      cargarEmpleados();
    } catch (error) {
      alert(error.message);
    }
  };

  const empleadosPorSucursal = sucursales.map(sucursal => ({
    sucursal,
    empleados: empleados.filter(e => e.sucursalId === sucursal.id)
  })).filter(grupo => grupo.empleados.length > 0 || !filtroSucursal);

  if (loading) {
    return <div className="loading">Cargando empleados...</div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Empleados</h1>
        <div className="page-actions">
          <select
            className="form-input"
            value={filtroSucursal}
            onChange={(e) => setFiltroSucursal(e.target.value)}
          >
            <option value="">Todas las sucursales</option>
            {sucursales.map(s => (
              <option key={s.id} value={s.id}>{s.nombre}</option>
            ))}
          </select>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            + Nuevo Empleado
          </button>
        </div>
      </div>

      {filtroSucursal ? (
        <div className="empleados-grid">
          {empleados.map(empleado => (
            <EmpleadoCard
              key={empleado.id}
              empleado={empleado}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
          {empleados.length === 0 && (
            <p className="empty-message">No hay empleados en esta sucursal</p>
          )}
        </div>
      ) : (
        <div className="empleados-container">
          {empleadosPorSucursal.map(({ sucursal, empleados: emps }) => (
            <div key={sucursal.id} className="empleados-section">
              <h2 className="section-title">{sucursal.nombre}</h2>
              <div className="empleados-grid">
                {emps.map(empleado => (
                  <EmpleadoCard
                    key={empleado.id}
                    empleado={empleado}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
                {emps.length === 0 && (
                  <p className="empty-message">Sin empleados</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <EmpleadoForm
          empleado={editingEmpleado}
          sucursales={sucursales}
          onSubmit={handleSubmit}
          onClose={() => {
            setShowForm(false);
            setEditingEmpleado(null);
          }}
        />
      )}
    </div>
  );
}

function EmpleadoCard({ empleado, onEdit, onDelete }) {
  return (
    <div className={`empleado-card card ${!empleado.activo ? 'empleado-inactivo' : ''}`}>
      <div className="empleado-header">
        <h3>{empleado.nombre}</h3>
        {!empleado.activo && (
          <span className="badge badge-error">Inactivo</span>
        )}
      </div>
      {empleado.sucursal && (
        <p className="empleado-sucursal">{empleado.sucursal.nombre}</p>
      )}
      <div className="empleado-actions">
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => onEdit(empleado)}
        >
          Editar
        </button>
        {empleado.activo && (
          <button
            className="btn btn-danger btn-sm"
            onClick={() => onDelete(empleado)}
          >
            Desactivar
          </button>
        )}
      </div>
    </div>
  );
}

function EmpleadoForm({ empleado, sucursales, onSubmit, onClose }) {
  const [nombre, setNombre] = useState(empleado?.nombre || '');
  const [sucursalId, setSucursalId] = useState(empleado?.sucursalId || '');
  const [activo, setActivo] = useState(empleado?.activo ?? true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!sucursalId) {
      alert('Selecciona una sucursal');
      return;
    }
    setLoading(true);
    await onSubmit({ nombre, sucursalId: parseInt(sucursalId), activo });
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{empleado ? 'Editar Empleado' : 'Nuevo Empleado'}</h3>
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
              placeholder="Nombre del empleado"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Sucursal</label>
            <select
              className="form-input"
              value={sucursalId}
              onChange={(e) => setSucursalId(e.target.value)}
              required
            >
              <option value="">Seleccionar sucursal</option>
              {sucursales.map(s => (
                <option key={s.id} value={s.id}>{s.nombre}</option>
              ))}
            </select>
          </div>

          {empleado && (
            <div className="form-group">
              <label className="form-checkbox">
                <input
                  type="checkbox"
                  checked={activo}
                  onChange={(e) => setActivo(e.target.checked)}
                />
                <span>Empleado activo</span>
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

export default Empleados;
