import React from 'react';
import './GastoItem.css';

function GastoItem({ gasto, onDelete, disabled }) {
  return (
    <div className="gasto-item">
      <div className="gasto-info">
        <span className="gasto-categoria">{gasto.categoria?.nombre}</span>
        {gasto.descripcion && (
          <span className="gasto-descripcion">{gasto.descripcion}</span>
        )}
      </div>
      <div className="gasto-monto">
        ${parseFloat(gasto.monto).toLocaleString()}
      </div>
      {!disabled && (
        <button
          className="gasto-delete"
          onClick={onDelete}
          title="Eliminar"
        >
          ×
        </button>
      )}
    </div>
  );
}

export default GastoItem;
