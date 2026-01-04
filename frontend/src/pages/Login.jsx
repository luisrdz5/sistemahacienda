import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import logo from '../assets/logo.png';
import './Login.css';

// Google Client ID desde variable de entorno
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

function Login() {
  const { login, loginWithGoogle, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const googleButtonRef = useRef(null);

  // Handler para respuesta de Google - definido antes del useEffect
  const handleGoogleResponse = useCallback(async (response) => {
    setLocalError('');
    setLoading(true);

    try {
      const result = await loginWithGoogle(response.credential);
      if (result.isNewUser) {
        console.log('Nuevo usuario invitado creado');
      }
    } catch (err) {
      setLocalError(err.message);
    } finally {
      setLoading(false);
    }
  }, [loginWithGoogle]);

  // Inicializar Google Sign-In
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    const initGoogle = () => {
      if (!window.google?.accounts?.id) return;

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
        auto_select: false
      });

      if (googleButtonRef.current) {
        window.google.accounts.id.renderButton(
          googleButtonRef.current,
          {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            shape: 'rectangular',
            width: '100%'
          }
        );
      }
    };

    // Esperar a que el script de Google cargue
    if (window.google?.accounts?.id) {
      initGoogle();
    } else {
      const checkGoogle = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(checkGoogle);
          initGoogle();
        }
      }, 100);

      // Timeout después de 5 segundos
      const timeout = setTimeout(() => {
        clearInterval(checkGoogle);
      }, 5000);

      return () => {
        clearInterval(checkGoogle);
        clearTimeout(timeout);
      };
    }
  }, [handleGoogleResponse]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    setLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      setLocalError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const displayError = localError || error;

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <img src={logo} alt="La Hacienda Tortillas" className="login-logo" />
        </div>

        <div className="login-content">
          {displayError && (
            <div className="login-error">
              {displayError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
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

            <div className="form-group">
              <label htmlFor="password" className="form-label">Contraseña</label>
              <input
                type="password"
                id="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block btn-lg"
              disabled={loading}
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>

            <div className="forgot-password-link">
              <Link to="/forgot-password">¿Olvidaste tu contraseña?</Link>
            </div>
          </form>

          {/* Separador */}
          {GOOGLE_CLIENT_ID && (
            <>
              <div className="login-divider">
                <span>o continúa con</span>
              </div>

              {/* Botón de Google */}
              <div className="google-login-container">
                <div ref={googleButtonRef} className="google-button-wrapper"></div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;
