import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import logo from '../assets/logo.png';
import './LoginCliente.css';

function LoginCliente() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendiente, setPendiente] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setPendiente(false);
    setLoading(true);

    try {
      const response = await api.post('/auth/login-cliente', { email, password });

      // Guardar token y datos
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify({
        ...response.data.usuario,
        cliente: response.data.cliente
      }));

      // Redirigir al dashboard del cliente
      navigate('/cliente/dashboard');
    } catch (err) {
      if (err.response?.data?.pendiente) {
        setPendiente(true);
      } else {
        setError(err.response?.data?.error || 'Error al iniciar sesión');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-cliente-page">
      <div className="login-cliente-card">
        <div className="login-cliente-header">
          <img src={logo} alt="La Hacienda Tortillas" className="login-cliente-logo" />
          <p>Portal de Clientes</p>
        </div>

        {error && <div className="login-cliente-error">{error}</div>}

        {pendiente && (
          <div className="login-cliente-warning">
            <strong>Cuenta pendiente de aprobación</strong>
            <p>Tu cuenta está siendo revisada por un administrador. Te notificaremos cuando esté activa.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-cliente-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              placeholder="tu@email.com"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              placeholder="Tu contraseña"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            disabled={loading}
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <div className="login-cliente-footer">
          <p>¿No tienes cuenta? <Link to="/register-cliente">Regístrate aquí</Link></p>
          <p className="back-link"><Link to="/login">Acceso empleados</Link></p>
        </div>
      </div>
    </div>
  );
}

export default LoginCliente;
