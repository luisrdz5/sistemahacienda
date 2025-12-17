import React from 'react';
import './InventarioHarina.css';

function InventarioHarina({ nixta, extra, onChange, disabled }) {
  // Convertir a números (DECIMAL viene como string desde la DB)
  const nixtaNum = parseFloat(nixta) || 0;
  const extraNum = parseFloat(extra) || 0;

  const handleChange = (tipo, delta) => {
    if (disabled) return;

    const valorActual = tipo === 'nixta' ? nixtaNum : extraNum;
    const nuevoValor = Math.max(0, Math.round((valorActual + delta) * 4) / 4); // Redondear a cuartos

    onChange({
      inventarioNixta: tipo === 'nixta' ? nuevoValor : nixtaNum,
      inventarioExtra: tipo === 'extra' ? nuevoValor : extraNum
    });
  };

  const handleInputChange = (tipo, valor) => {
    if (disabled) return;

    const nuevoValor = Math.max(0, parseFloat(valor) || 0);

    onChange({
      inventarioNixta: tipo === 'nixta' ? nuevoValor : nixtaNum,
      inventarioExtra: tipo === 'extra' ? nuevoValor : extraNum
    });
  };

  const formatValue = (value) => {
    if (value % 1 === 0) return value.toString();
    if (value % 0.5 === 0) return value.toFixed(1);
    return value.toFixed(2);
  };

  return (
    <div className="inventario-harina">
      <div className="inventario-item">
        <span className="inventario-label">Nixta (bultos)</span>
        <div className="inventario-control">
          <button
            className="inventario-btn"
            onClick={() => handleChange('nixta', -1)}
            disabled={disabled || nixtaNum < 1}
            title="-1 bulto"
          >
            -1
          </button>
          <button
            className="inventario-btn inventario-btn-sm"
            onClick={() => handleChange('nixta', -0.25)}
            disabled={disabled || nixtaNum < 0.25}
            title="-1/4 bulto"
          >
            -1/4
          </button>
          <input
            type="number"
            className="inventario-input"
            value={nixtaNum}
            onChange={(e) => handleInputChange('nixta', e.target.value)}
            disabled={disabled}
            step="0.25"
            min="0"
          />
          <button
            className="inventario-btn inventario-btn-sm"
            onClick={() => handleChange('nixta', 0.25)}
            disabled={disabled}
            title="+1/4 bulto"
          >
            +1/4
          </button>
          <button
            className="inventario-btn"
            onClick={() => handleChange('nixta', 1)}
            disabled={disabled}
            title="+1 bulto"
          >
            +1
          </button>
        </div>
      </div>

      <div className="inventario-item">
        <span className="inventario-label">Extra (bultos)</span>
        <div className="inventario-control">
          <button
            className="inventario-btn"
            onClick={() => handleChange('extra', -1)}
            disabled={disabled || extraNum < 1}
            title="-1 bulto"
          >
            -1
          </button>
          <button
            className="inventario-btn inventario-btn-sm"
            onClick={() => handleChange('extra', -0.25)}
            disabled={disabled || extraNum < 0.25}
            title="-1/4 bulto"
          >
            -1/4
          </button>
          <input
            type="number"
            className="inventario-input"
            value={extraNum}
            onChange={(e) => handleInputChange('extra', e.target.value)}
            disabled={disabled}
            step="0.25"
            min="0"
          />
          <button
            className="inventario-btn inventario-btn-sm"
            onClick={() => handleChange('extra', 0.25)}
            disabled={disabled}
            title="+1/4 bulto"
          >
            +1/4
          </button>
          <button
            className="inventario-btn"
            onClick={() => handleChange('extra', 1)}
            disabled={disabled}
            title="+1 bulto"
          >
            +1
          </button>
        </div>
      </div>
    </div>
  );
}

export default InventarioHarina;
