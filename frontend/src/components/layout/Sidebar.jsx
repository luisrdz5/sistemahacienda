import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './Sidebar.css';

function Sidebar() {
  const { usuario } = useAuth();
  const isAdmin = usuario?.rol === 'admin';
  const isAdminRepartidor = usuario?.rol === 'administrador_repartidor';
  const isRepartidor = usuario?.rol === 'repartidor';
  const canSeePedidos = isAdmin || isAdminRepartidor || isRepartidor;
  const canSeeReportes = isAdmin || isAdminRepartidor;

  const menuItems = [
    // Encargados y Admin ven captura de cortes
    ...(!isRepartidor ? [
      { path: '/captura', label: 'Captura Diaria', icon: '📝' },
      { path: '/auditoria', label: 'Auditoría', icon: '📅' },
    ] : []),
    // Pedidos visible para repartidores, admin repartidor y admin
    ...(canSeePedidos ? [
      { path: '/pedidos', label: 'Pedidos', icon: '🚚' },
      { path: '/corte-pedidos', label: 'Corte Pedidos', icon: '📋' },
    ] : []),
    // Reportes para admin y admin repartidor
    ...(canSeeReportes ? [
      { path: '/dashboard', label: 'Dashboard', icon: '📊' },
      { path: '/resumen-semanal', label: 'Resumen Semanal', icon: '📈' },
      { path: '/resumen-mensual', label: 'Resumen Mensual', icon: '📅' },
      { path: '/resumen-anual', label: 'Resumen Anual', icon: '📆' },
    ] : []),
    // Catálogos solo admin
    ...(isAdmin ? [
      { path: '/productos', label: 'Productos', icon: '🌽' },
      { path: '/clientes', label: 'Clientes', icon: '🧑‍🤝‍🧑' },
      { path: '/usuarios', label: 'Usuarios', icon: '👥' },
      { path: '/sucursales', label: 'Sucursales', icon: '🏪' },
      { path: '/empleados', label: 'Empleados', icon: '👷' },
      { path: '/categorias', label: 'Categorías', icon: '🏷️' }
    ] : []),
    // Admin repartidor puede gestionar clientes y productos
    ...(isAdminRepartidor ? [
      { path: '/productos', label: 'Productos', icon: '🌽' },
      { path: '/clientes', label: 'Clientes', icon: '🧑‍🤝‍🧑' },
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
