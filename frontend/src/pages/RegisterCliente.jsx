import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import './RegisterCliente.css';

function RegisterCliente() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    direccion: '',
    password: '',
    confirmPassword: '',
    sucursalId: '',
    sucursalBackupId: ''
  });
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadSucursales();
  }, []);

  const loadSucursales = async () => {
    try {
      const response = await api.get('/sucursales');
      setSucursales(response.data);
    } catch (err) {
      console.error('Error cargando sucursales:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validaciones
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/register-cliente', {
        nombre: formData.nombre,
        email: formData.email,
        telefono: formData.telefono || null,
        direccion: formData.direccion || null,
        password: formData.password,
        sucursalId: formData.sucursalId ? parseInt(formData.sucursalId) : null,
        sucursalBackupId: formData.sucursalBackupId ? parseInt(formData.sucursalBackupId) : null
      });

      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrar. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="register-page">
        <div className="register-card success-card">
          <div className="success-icon">&#10003;</div>
          <h2>Registro Exitoso</h2>
          <p>Tu cuenta ha sido creada y está pendiente de aprobación por un administrador.</p>
          <p>Te notificaremos cuando tu cuenta esté activa.</p>
          <Link to="/login-cliente" className="btn btn-primary btn-block">
            Ir a Iniciar Sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="register-page">
      <div className="register-card">
        <div className="register-header">
          <h1>Registro de Cliente</h1>
          <p>Crea tu cuenta para hacer pedidos</p>
        </div>

        {error && <div className="register-error">{error}</div>}

        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-group">
            <label htmlFor="nombre">Nombre completo *</label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              required
              disabled={loading}
              placeholder="Tu nombre o razón social"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
              placeholder="correo@ejemplo.com"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="telefono">Teléfono</label>
              <input
                type="tel"
                id="telefono"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                disabled={loading}
                placeholder="10 dígitos"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="direccion">Dirección de entrega</label>
            <textarea
              id="direccion"
              name="direccion"
              value={formData.direccion}
              onChange={handleChange}
              disabled={loading}
              placeholder="Calle, número, colonia, referencias..."
              rows="2"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="sucursalId">Sucursal principal</label>
              <select
                id="sucursalId"
                name="sucursalId"
                value={formData.sucursalId}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="">Seleccionar...</option>
                {sucursales.map(s => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="sucursalBackupId">Sucursal backup</label>
              <select
                id="sucursalBackupId"
                name="sucursalBackupId"
                value={formData.sucursalBackupId}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="">Ninguna</option>
                {sucursales.filter(s => s.id !== parseInt(formData.sucursalId)).map(s => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">Contraseña *</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirmar contraseña *</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                disabled={loading}
                placeholder="Repetir contraseña"
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            disabled={loading}
          >
            {loading ? 'Registrando...' : 'Crear cuenta'}
          </button>

          <div className="register-footer">
            <p>¿Ya tienes cuenta? <Link to="/login-cliente">Inicia sesión</Link></p>
            <p className="back-link"><Link to="/login">Volver al login principal</Link></p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RegisterCliente;
