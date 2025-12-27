import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './Usuarios.css';

function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [usuariosData, sucursalesData] = await Promise.all([
        api.get('/usuarios'),
        api.get('/sucursales')
      ]);
      setUsuarios(usuariosData);
      setSucursales(sucursalesData);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (userData) => {
    try {
      if (editingUser) {
        await api.put(`/usuarios/${editingUser.id}`, userData);
      } else {
        await api.post('/usuarios', userData);
      }
      setShowForm(false);
      setEditingUser(null);
      cargarDatos();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleEdit = (usuario) => {
    setEditingUser(usuario);
    setShowForm(true);
  };

  if (loading) {
    return <div className="loading">Cargando usuarios...</div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Usuarios</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          + Nuevo Usuario
        </button>
      </div>

      <div className="usuarios-table-container">
        <table className="usuarios-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Sucursal</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map(usuario => (
              <tr key={usuario.id}>
                <td>
                  <div className="user-info">
                    {usuario.avatarUrl && (
                      <img src={usuario.avatarUrl} alt="" className="user-avatar" />
                    )}
                    <span>{usuario.nombre}</span>
                  </div>
                </td>
                <td>{usuario.email}</td>
                <td>
                  <span className={`badge badge-${usuario.rol === 'admin' ? 'success' : 'warning'}`}>
                    {usuario.rol}
                  </span>
                </td>
                <td>{usuario.sucursal?.nombre || '-'}</td>
                <td>
                  <span className={`badge badge-${usuario.activo ? 'success' : 'error'}`}>
                    {usuario.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleEdit(usuario)}
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <UsuarioForm
          usuario={editingUser}
          sucursales={sucursales}
          onSubmit={handleSubmit}
          onClose={() => {
            setShowForm(false);
            setEditingUser(null);
          }}
        />
      )}
    </div>
  );
}

function UsuarioForm({ usuario, sucursales, onSubmit, onClose }) {
  const [nombre, setNombre] = useState(usuario?.nombre || '');
  const [email, setEmail] = useState(usuario?.email || '');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState(usuario?.rol || 'encargado');
  const [sucursalId, setSucursalId] = useState(usuario?.sucursalId || '');
  const [activo, setActivo] = useState(usuario?.activo ?? true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const data = {
      nombre,
      email,
      rol,
      activo
    };

    if (password) data.password = password;
    if (rol === 'encargado' || rol === 'repartidor') data.sucursalId = sucursalId;

    await onSubmit(data);
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{usuario ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
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
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Contraseña {usuario && '(dejar vacío para mantener)'}
            </label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              {...(!usuario && { required: true })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Rol</label>
            <select
              className="form-input"
              value={rol}
              onChange={(e) => setRol(e.target.value)}
            >
              <option value="encargado">Encargado de Sucursal</option>
              <option value="repartidor">Repartidor</option>
              <option value="administrador_repartidor">Admin Repartidores</option>
              <option value="admin">Administrador General</option>
            </select>
          </div>

          {(rol === 'encargado' || rol === 'repartidor') && (
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
          )}

          {usuario && (
            <div className="form-group">
              <label className="form-checkbox">
                <input
                  type="checkbox"
                  checked={activo}
                  onChange={(e) => setActivo(e.target.checked)}
                />
                <span>Usuario activo</span>
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

export default Usuarios;
