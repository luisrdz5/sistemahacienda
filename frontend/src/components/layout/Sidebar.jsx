import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './Sidebar.css';

function Sidebar() {
  const { usuario } = useAuth();
  const isAdmin = usuario?.rol === 'admin';

  const menuItems = [
    { path: '/captura', label: 'Captura Diaria', icon: '📝' },
    { path: '/auditoria', label: 'Auditoría', icon: '📅' },
    ...(isAdmin ? [
      { path: '/dashboard', label: 'Dashboard', icon: '📊' },
      { path: '/resumen-semanal', label: 'Resumen Semanal', icon: '📈' },
      { path: '/usuarios', label: 'Usuarios', icon: '👥' },
      { path: '/sucursales', label: 'Sucursales', icon: '🏪' },
      { path: '/empleados', label: 'Empleados', icon: '👷' },
      { path: '/categorias', label: 'Categorías', icon: '🏷️' }
    ] : [])
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1 className="sidebar-logo">Hacienda</h1>
        <span className="sidebar-subtitle">Sistema de Cortes</span>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
            }
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span className="sidebar-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          {usuario?.avatarUrl && (
            <img src={usuario.avatarUrl} alt="" className="sidebar-avatar" />
          )}
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{usuario?.nombre}</span>
            <span className="sidebar-user-role">{usuario?.rol}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
