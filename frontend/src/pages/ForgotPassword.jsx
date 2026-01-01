import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import './ForgotPassword.css';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/auth/forgot-password', { email });
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Error al procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-page">
      <div className="forgot-card">
        <div className="forgot-header">
          <h1 className="forgot-title">Hacienda</h1>
          <p className="forgot-subtitle">Recuperar contraseña</p>
        </div>

        <div className="forgot-content">
          {success ? (
            <div className="forgot-success">
              <div className="success-icon">✓</div>
              <h2>Revisa tu correo</h2>
              <p>
                Si el email está registrado, recibirás instrucciones para restablecer tu contraseña.
              </p>
              <p className="success-hint">
                El enlace es válido por 1 hora.
              </p>
              <Link to="/login" className="btn btn-primary btn-block">
                Volver al inicio de sesión
              </Link>
            </div>
          ) : (
            <>
              <p className="forgot-description">
                Ingresa tu correo electrónico y te enviaremos instrucciones para restablecer tu contraseña.
              </p>

              {error && (
                <div className="forgot-error">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="forgot-form">
                <div className="form-group">
                  <label htmlFor="email" className="form-label">Email</label>
                  <input
                    type="email"
                    id="email"
                    className="form-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    autoFocus
                    placeholder="correo@ejemplo.com"
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-block btn-lg"
                  disabled={loading}
                >
                  {loading ? 'Enviando...' : 'Enviar instrucciones'}
                </button>
              </form>

              <div className="forgot-footer">
                <Link to="/login" className="forgot-back-link">
                  Volver al inicio de sesión
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
