import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import './PerfilCliente.css';

function PerfilCliente() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    passwordActual: '',
    passwordNuevo: '',
    confirmarPassword: ''
  });
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    loadPerfil();
  }, []);

  const loadPerfil = async () => {
    try {
      setLoading(true);
      const response = await api.get('/cliente/perfil');
      setPerfil(response.data);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate('/login-cliente');
      } else {
        setError('Error al cargar perfil');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError('');

    if (passwordData.passwordNuevo !== passwordData.confirmarPassword) {
      setError('Las contrasenas no coinciden');
      return;
    }

    if (passwordData.passwordNuevo.length < 6) {
      setError('La contrasena debe tener al menos 6 caracteres');
      return;
    }

    try {
      setSavingPassword(true);
      await api.put('/cliente/perfil/password', {
        passwordActual: passwordData.passwordActual,
        passwordNuevo: passwordData.passwordNuevo
      });
      setSuccessMessage('Contrasena actualizada correctamente');
      setShowPasswordModal(false);
      setPasswordData({ passwordActual: '', passwordNuevo: '', confirmarPassword: '' });
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cambiar contrasena');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login-cliente');
  };

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="perfil-cliente loading">
        <div className="loading-spinner"></div>
        <p>Cargando perfil...</p>
      </div>
    );
  }

  return (
    <div className="perfil-cliente">
      {/* Header */}
      <header className="perfil-header">
        <Link to="/cliente/dashboard" className="back-btn">&larr;</Link>
        <h1>Mi Perfil</h1>
      </header>

      {/* Mensajes */}
      {successMessage && (
        <div className="success-message">{successMessage}</div>
      )}
      {error && !showPasswordModal && (
        <div className="error-message">
          {error}
          <button onClick={() => setError('')}>&times;</button>
        </div>
      )}

      {perfil && (
        <div className="perfil-content">
          {/* Avatar y nombre */}
          <div className="perfil-avatar-section">
            <div className="avatar">
              <span>&#128100;</span>
            </div>
            <h2>{perfil.nombre}</h2>
            <p className="perfil-email">{perfil.email}</p>
          </div>

          {/* Informacion de contacto */}
          <div className="perfil-section">
            <h3>Informacion de contacto</h3>
            <div className="info-list">
              <div className="info-item">
                <span className="info-icon">&#128222;</span>
                <div className="info-content">
                  <span className="info-label">Telefono</span>
                  <span className="info-value">{perfil.telefono || 'No registrado'}</span>
                </div>
              </div>
              <div className="info-item">
                <span className="info-icon">&#128205;</span>
                <div className="info-content">
                  <span className="info-label">Direccion</span>
                  <span className="info-value">{perfil.direccion || 'No registrada'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sucursal asignada */}
          <div className="perfil-section">
            <h3>Sucursal de entrega</h3>
            <div className="info-list">
              <div className="info-item">
                <span className="info-icon">&#127970;</span>
                <div className="info-content">
                  <span className="info-label">Sucursal principal</span>
                  <span className="info-value">{perfil.sucursal?.nombre || 'Sin asignar'}</span>
                </div>
              </div>
              {perfil.sucursalBackup && (
                <div className="info-item">
                  <span className="info-icon">&#127969;</span>
                  <div className="info-content">
                    <span className="info-label">Sucursal alternativa</span>
                    <span className="info-value">{perfil.sucursalBackup.nombre}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Credito */}
          <div className="perfil-section credito-section">
            <h3>Estado de credito</h3>
            <div className="credito-grid">
              <div className="credito-item">
                <span className="credito-label">Limite de credito</span>
                <span className="credito-valor">{formatMoney(perfil.limiteCredito)}</span>
              </div>
              <div className="credito-item">
                <span className="credito-label">Adeudo actual</span>
                <span className="credito-valor adeudo">{formatMoney(perfil.adeudoTotal)}</span>
              </div>
              <div className="credito-item disponible">
                <span className="credito-label">Disponible</span>
                <span className="credito-valor">{formatMoney(perfil.creditoDisponible)}</span>
              </div>
            </div>
            <div className="credito-bar">
              <div
                className="credito-bar-fill"
                style={{ width: `${Math.min(100, (perfil.adeudoTotal / perfil.limiteCredito) * 100)}%` }}
              ></div>
            </div>
            <p className="credito-info">
              {perfil.adeudoTotal > 0
                ? `Estas usando ${((perfil.adeudoTotal / perfil.limiteCredito) * 100).toFixed(0)}% de tu credito`
                : 'No tienes adeudo pendiente'}
            </p>
          </div>

          {/* Acciones */}
          <div className="perfil-acciones">
            <button
              className="btn-accion"
              onClick={() => setShowPasswordModal(true)}
            >
              <span>&#128274;</span>
              Cambiar contrasena
            </button>
            <button
              className="btn-accion btn-logout"
              onClick={handleLogout}
            >
              <span>&#128682;</span>
              Cerrar sesion
            </button>
          </div>
        </div>
      )}

      {/* Modal cambiar contrasena */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Cambiar contrasena</h2>

            {error && (
              <div className="modal-error">{error}</div>
            )}

            <form onSubmit={handlePasswordChange}>
              <div className="form-group">
                <label>Contrasena actual</label>
                <input
                  type="password"
                  value={passwordData.passwordActual}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, passwordActual: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label>Nueva contrasena</label>
                <input
                  type="password"
                  value={passwordData.passwordNuevo}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, passwordNuevo: e.target.value }))}
                  required
                  minLength={6}
                />
              </div>
              <div className="form-group">
                <label>Confirmar contrasena</label>
                <input
                  type="password"
                  value={passwordData.confirmarPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmarPassword: e.target.value }))}
                  required
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setError('');
                    setPasswordData({ passwordActual: '', passwordNuevo: '', confirmarPassword: '' });
                  }}
                  disabled={savingPassword}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingPassword}
                >
                  {savingPassword ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Navegacion inferior */}
      <nav className="cliente-nav">
        <Link to="/cliente/dashboard" className="nav-item">
          <span className="nav-icon">&#127968;</span>
          <span>Inicio</span>
        </Link>
        <Link to="/cliente/catalogo" className="nav-item">
          <span className="nav-icon">&#128722;</span>
          <span>Catalogo</span>
        </Link>
        <Link to="/cliente/historial" className="nav-item">
          <span className="nav-icon">&#128203;</span>
          <span>Pedidos</span>
        </Link>
        <Link to="/cliente/perfil" className="nav-item active">
          <span className="nav-icon">&#128100;</span>
          <span>Perfil</span>
        </Link>
      </nav>
    </div>
  );
}

export default PerfilCliente;
