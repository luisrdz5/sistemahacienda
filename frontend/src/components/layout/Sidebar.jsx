import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './Sidebar.css';

function Sidebar() {
  const { usuario } = useAuth();
  const location = useLocation();

  // Roles
  const isAdmin = usuario?.rol === 'admin';
  const isAdminRepartidor = usuario?.rol === 'administrador_repartidor';
  const isRepartidor = usuario?.rol === 'repartidor';
  const isEncargado = usuario?.rol === 'encargado';

  // Determinar secciones abiertas basado en la ruta actual
  const getInitialOpenSections = () => {
    const path = location.pathname;
    const sections = {};

    if (['/dashboard', '/auditoria', '/resumen-semanal', '/resumen-mensual', '/resumen-anual'].includes(path)) {
      sections.dashboards = true;
    }
    if (['/pedidos', '/corte-pedidos'].includes(path)) {
      sections.pedidos = true;
    }
    if (['/productos', '/clientes', '/insumos', '/usuarios', '/sucursales', '/empleados', '/categorias'].includes(path)) {
      sections.administracion = true;
    }

    return sections;
  };

  const [openSections, setOpenSections] = useState(getInitialOpenSections);

  const toggleSection = (section) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Definir estructura del menú por secciones
  const menuSections = [
    // Captura Diaria - Item individual (no en sección)
    ...(!isRepartidor ? [{
      type: 'item',
      path: '/captura',
      label: 'Captura Diaria',
      icon: '📝'
    }] : []),

    // Sección Dashboards - Solo admin general
    ...(isAdmin ? [{
      type: 'section',
      id: 'dashboards',
      label: 'Dashboards',
      icon: '📊',
      items: [
        { path: '/dashboard', label: 'Dashboard', icon: '📊' },
        { path: '/auditoria', label: 'Auditoría', icon: '📅' },
        { path: '/resumen-semanal', label: 'Resumen Semanal', icon: '📈' },
        { path: '/resumen-mensual', label: 'Resumen Mensual', icon: '🗓️' },
        { path: '/resumen-anual', label: 'Resumen Anual', icon: '📆' },
      ]
    }] : []),

    // Sección Pedidos - Todos los perfiles
    {
      type: 'section',
      id: 'pedidos',
      label: 'Pedidos',
      icon: '🚚',
      items: [
        { path: '/pedidos', label: 'Pedidos', icon: '🚚' },
        { path: '/corte-pedidos', label: 'Corte Pedidos', icon: '📋' },
      ]
    },

    // Sección Administración - Varía por perfil
    ...((isAdmin || isAdminRepartidor || isEncargado) ? [{
      type: 'section',
      id: 'administracion',
      label: 'Administración',
      icon: '⚙️',
      items: [
        // Admin ve todo
        ...(isAdmin ? [
          { path: '/productos', label: 'Productos', icon: '🌽' },
          { path: '/clientes', label: 'Clientes', icon: '🧑‍🤝‍🧑' },
          { path: '/insumos', label: 'Insumos', icon: '📦' },
          { path: '/usuarios', label: 'Usuarios', icon: '👥' },
          { path: '/sucursales', label: 'Sucursales', icon: '🏪' },
          { path: '/empleados', label: 'Empleados', icon: '👷' },
          { path: '/categorias', label: 'Categorías', icon: '🏷️' },
        ] : []),
        // Admin repartidor ve productos y clientes
        ...(isAdminRepartidor ? [
          { path: '/productos', label: 'Productos', icon: '🌽' },
          { path: '/clientes', label: 'Clientes', icon: '🧑‍🤝‍🧑' },
        ] : []),
        // Encargado ve sucursales (su sucursal)
        ...(isEncargado ? [
          { path: '/sucursales', label: 'Mi Sucursal', icon: '🏪' },
        ] : []),
      ]
    }] : []),
  ];

  // Verificar si algún item de una sección está activo
  const isSectionActive = (items) => {
    return items.some(item => location.pathname === item.path);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1 className="sidebar-logo">Hacienda</h1>
        <span className="sidebar-subtitle">Sistema de Cortes</span>
      </div>

      <nav className="sidebar-nav">
        {menuSections.map((section, index) => {
          if (section.type === 'item') {
            // Item individual (no en sección)
            return (
              <NavLink
                key={section.path}
                to={section.path}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
                }
              >
                <span className="sidebar-icon">{section.icon}</span>
                <span className="sidebar-label">{section.label}</span>
              </NavLink>
            );
          }

          // Sección colapsable
          const isOpen = openSections[section.id];
          const hasActiveItem = isSectionActive(section.items);

          return (
            <div key={section.id} className="sidebar-section">
              <button
                className={`sidebar-section-header ${hasActiveItem ? 'sidebar-section-active' : ''}`}
                onClick={() => toggleSection(section.id)}
              >
                <span className="sidebar-icon">{section.icon}</span>
                <span className="sidebar-label">{section.label}</span>
                <span className={`sidebar-chevron ${isOpen ? 'open' : ''}`}>
                  ▼
                </span>
              </button>

              <div className={`sidebar-section-items ${isOpen ? 'open' : ''}`}>
                {section.items.map(item => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `sidebar-link sidebar-sublink ${isActive ? 'sidebar-link-active' : ''}`
                    }
                  >
                    <span className="sidebar-icon">{item.icon}</span>
                    <span className="sidebar-label">{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          {usuario?.avatarUrl && (
            <img src={usuario.avatarUrl} alt="" className="sidebar-avatar" />
          )}
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{usuario?.nombre}</span>
            <span className="sidebar-user-role">
              {usuario?.rol === 'admin' ? 'Administrador' :
               usuario?.rol === 'administrador_repartidor' ? 'Admin Repartidor' :
               usuario?.rol === 'repartidor' ? 'Repartidor' :
               usuario?.rol === 'encargado' ? 'Encargado' : usuario?.rol}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
