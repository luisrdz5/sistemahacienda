import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import './Header.css';

function Header() {
  const { usuario, logout } = useAuth();

  return (
    <header className="header">
      <div className="header-left">
        {usuario?.sucursal && (
          <span className="header-sucursal">
            Sucursal: <strong>{usuario.sucursal.nombre}</strong>
          </span>
        )}
      </div>

      <div className="header-right">
        <span className="header-greeting">
          Hola, {usuario?.nombre?.split(' ')[0]}
        </span>
        <button onClick={logout} className="btn btn-secondary btn-sm">
          Salir
        </button>
      </div>
    </header>
  );
}

export default Header;
