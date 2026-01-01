import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import './ResetPassword.css';

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validaciones
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/reset-password', { token, password });
      setSuccess(true);
      // Redirigir al login después de 3 segundos
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.message || 'Error al restablecer la contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-page">
      <div className="reset-card">
        <div className="reset-header">
          <h1 className="reset-title">Hacienda</h1>
          <p className="reset-subtitle">Nueva contraseña</p>
        </div>

        <div className="reset-content">
          {success ? (
            <div className="reset-success">
              <div className="success-icon">✓</div>
              <h2>Contraseña actualizada</h2>
              <p>
                Tu contraseña ha sido restablecida exitosamente.
              </p>
              <p className="success-hint">
                Serás redirigido al inicio de sesión...
              </p>
              <Link to="/login" className="btn btn-primary btn-block">
                Ir al inicio de sesión
              </Link>
            </div>
          ) : (
            <>
              <p className="reset-description">
                Ingresa tu nueva contraseña.
              </p>

              {error && (
                <div className="reset-error">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="reset-form">
                <div className="form-group">
                  <label htmlFor="password" className="form-label">Nueva contraseña</label>
                  <input
                    type="password"
                    id="password"
                    className="form-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    autoFocus
                    placeholder="Mínimo 6 caracteres"
                    minLength={6}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword" className="form-label">Confirmar contraseña</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    className="form-input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                    placeholder="Repite la contraseña"
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-block btn-lg"
                  disabled={loading}
                >
                  {loading ? 'Guardando...' : 'Guardar contraseña'}
                </button>
              </form>

              <div className="reset-footer">
                <Link to="/login" className="reset-back-link">
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

export default ResetPassword;
