import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './GastoForm.css';

function GastoForm({ onSubmit, onClose, sucursal }) {
  const [categorias, setCategorias] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [categoriaId, setCategoriaId] = useState('');
  const [empleadoId, setEmpleadoId] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [monto, setMonto] = useState('');
  const [loading, setLoading] = useState(false);

  // Estados para agregar nuevo
  const [showNuevoEmpleado, setShowNuevoEmpleado] = useState(false);
  const [showNuevaCategoria, setShowNuevaCategoria] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [creando, setCreando] = useState(false);

  const esNomina = sucursal?.nombre === 'Nómina';
  const esGastosGlobales = sucursal?.nombre === 'Gastos Globales';
  const esAhorro = sucursal?.nombre === 'Ahorro';

  useEffect(() => {
    // Cargar categorías
    api.get('/categorias').then(setCategorias).catch(console.error);

    // Cargar empleados si es nómina
    if (esNomina) {
      api.get('/empleados').then(setEmpleados).catch(console.error);
    }
  }, [esNomina]);

  // Auto-seleccionar categoría según sucursal
  useEffect(() => {
    if (esNomina && categorias.length > 0) {
      const catNomina = categorias.find(c => c.tipo === 'nomina');
      if (catNomina) setCategoriaId(catNomina.id.toString());
    }
  }, [esNomina, categorias]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (esNomina) {
      if (!empleadoId || !monto) return;
      const empleado = empleados.find(e => e.id === parseInt(empleadoId));

      setLoading(true);
      try {
        await onSubmit({
          categoriaId: parseInt(categoriaId),
          descripcion: empleado?.nombre || descripcion,
          monto: parseFloat(monto)
        });
      } finally {
        setLoading(false);
      }
    } else if (esGastosGlobales) {
      if (!categoriaId || !monto) return;

      setLoading(true);
      try {
        await onSubmit({
          categoriaId: parseInt(categoriaId),
          descripcion: descripcion || null,
          monto: parseFloat(monto)
        });
      } finally {
        setLoading(false);
      }
    } else {
      if (!categoriaId || !monto) return;

      setLoading(true);
      try {
        await onSubmit({
          categoriaId: parseInt(categoriaId),
          descripcion: descripcion || null,
          monto: parseFloat(monto)
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const crearEmpleado = async () => {
    if (!nuevoNombre.trim()) return;

    setCreando(true);
    try {
      // Crear empleado asignado a cualquier sucursal física (usamos la primera)
      const sucursalesFisicas = await api.get('/sucursales');
      const sucursalFisica = sucursalesFisicas.find(s => s.tipo === 'fisica');

      const nuevoEmpleado = await api.post('/empleados', {
        nombre: nuevoNombre.trim(),
        sucursalId: sucursalFisica?.id || 1
      });

      setEmpleados([...empleados, nuevoEmpleado]);
      setEmpleadoId(nuevoEmpleado.id.toString());
      setNuevoNombre('');
      setShowNuevoEmpleado(false);
    } catch (error) {
      console.error('Error creando empleado:', error);
      alert('Error al crear empleado: ' + error.message);
    } finally {
      setCreando(false);
    }
  };

  const crearCategoria = async () => {
    if (!nuevoNombre.trim()) return;

    setCreando(true);
    try {
      const nuevaCategoria = await api.post('/categorias', {
        nombre: nuevoNombre.trim(),
        tipo: 'operativo'
      });

      setCategorias([...categorias, nuevaCategoria]);
      setCategoriaId(nuevaCategoria.id.toString());
      setNuevoNombre('');
      setShowNuevaCategoria(false);
    } catch (error) {
      console.error('Error creando categoría:', error);
      alert('Error al crear categoría: ' + error.message);
    } finally {
      setCreando(false);
    }
  };

  const categoriasOperativas = categorias.filter(c => c.tipo === 'operativo');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            {esNomina ? 'Pago de Nómina' : esGastosGlobales ? 'Gasto Global' : 'Agregar Gasto'}
          </h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-content">
          {/* NÓMINA: Seleccionar empleado */}
          {esNomina && (
            <>
              <div className="form-group">
                <label className="form-label">Empleado</label>
                {!showNuevoEmpleado ? (
                  <>
                    <select
                      className="form-input"
                      value={empleadoId}
                      onChange={(e) => setEmpleadoId(e.target.value)}
                      required
                    >
                      <option value="">Seleccionar empleado</option>
                      {empleados.filter(e => e.activo).map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.nombre}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="btn-link"
                      onClick={() => setShowNuevoEmpleado(true)}
                    >
                      + Agregar nuevo empleado
                    </button>
                  </>
                ) : (
                  <div className="nuevo-item-form">
                    <input
                      type="text"
                      className="form-input"
                      value={nuevoNombre}
                      onChange={(e) => setNuevoNombre(e.target.value)}
                      placeholder="Nombre del empleado"
                      autoFocus
                    />
                    <div className="nuevo-item-actions">
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        onClick={crearEmpleado}
                        disabled={creando}
                      >
                        {creando ? 'Creando...' : 'Crear'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-secondary"
                        onClick={() => {
                          setShowNuevoEmpleado(false);
                          setNuevoNombre('');
                        }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* GASTOS GLOBALES: Seleccionar categoría operativa */}
          {esGastosGlobales && (
            <div className="form-group">
              <label className="form-label">Categoría de Gasto</label>
              {!showNuevaCategoria ? (
                <>
                  <select
                    className="form-input"
                    value={categoriaId}
                    onChange={(e) => setCategoriaId(e.target.value)}
                    required
                  >
                    <option value="">Seleccionar categoría</option>
                    {categoriasOperativas.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn-link"
                    onClick={() => setShowNuevaCategoria(true)}
                  >
                    + Agregar nueva categoría
                  </button>
                </>
              ) : (
                <div className="nuevo-item-form">
                  <input
                    type="text"
                    className="form-input"
                    value={nuevoNombre}
                    onChange={(e) => setNuevoNombre(e.target.value)}
                    placeholder="Nombre de la categoría"
                    autoFocus
                  />
                  <div className="nuevo-item-actions">
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={crearCategoria}
                      disabled={creando}
                    >
                      {creando ? 'Creando...' : 'Crear'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={() => {
                        setShowNuevaCategoria(false);
                        setNuevoNombre('');
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SUCURSAL NORMAL: Seleccionar categoría completa */}
          {!esNomina && !esGastosGlobales && (
            <>
              <div className="form-group">
                <label className="form-label">Categoría</label>
                {!showNuevaCategoria ? (
                  <>
                    <select
                      className="form-input"
                      value={categoriaId}
                      onChange={(e) => setCategoriaId(e.target.value)}
                      required
                    >
                      <option value="">Seleccionar categoría</option>
                      <optgroup label="Gastos Operativos">
                        {categorias.filter(c => c.tipo === 'operativo').map(c => (
                          <option key={c.id} value={c.id}>{c.nombre}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Nómina">
                        {categorias.filter(c => c.tipo === 'nomina').map(c => (
                          <option key={c.id} value={c.id}>{c.nombre}</option>
                        ))}
                      </optgroup>
                    </select>
                    <button
                      type="button"
                      className="btn-link"
                      onClick={() => setShowNuevaCategoria(true)}
                    >
                      + Agregar nueva categoría
                    </button>
                  </>
                ) : (
                  <div className="nuevo-item-form">
                    <input
                      type="text"
                      className="form-input"
                      value={nuevoNombre}
                      onChange={(e) => setNuevoNombre(e.target.value)}
                      placeholder="Nombre de la categoría"
                      autoFocus
                    />
                    <div className="nuevo-item-actions">
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        onClick={crearCategoria}
                        disabled={creando}
                      >
                        {creando ? 'Creando...' : 'Crear'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-secondary"
                        onClick={() => {
                          setShowNuevaCategoria(false);
                          setNuevoNombre('');
                        }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {categorias.find(c => c.id === parseInt(categoriaId))?.tipo === 'nomina' && (
                <div className="form-group">
                  <label className="form-label">Nombre del empleado</label>
                  <input
                    type="text"
                    className="form-input"
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    placeholder="Ej: Martha"
                  />
                </div>
              )}

              {/* Descripción opcional para gastos operativos */}
              {categorias.find(c => c.id === parseInt(categoriaId))?.tipo === 'operativo' && (
                <div className="form-group">
                  <label className="form-label">Descripción (opcional)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    placeholder="Detalle del gasto"
                  />
                </div>
              )}
            </>
          )}

          {/* Descripción para Gastos Globales */}
          {esGastosGlobales && (
            <div className="form-group">
              <label className="form-label">Descripción (opcional)</label>
              <input
                type="text"
                className="form-input"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Detalle del gasto"
              />
            </div>
          )}

          {/* MONTO - siempre visible */}
          <div className="form-group">
            <label className="form-label">Monto</label>
            <input
              type="number"
              className="form-input"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              placeholder={esAhorro ? "$0.00 (negativo = retiro)" : "$0.00"}
              min={esAhorro ? undefined : "0"}
              step="0.01"
              required
            />
            {esAhorro && (
              <span className="form-hint">
                Usa monto negativo para registrar retiros del ahorro
              </span>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Agregar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default GastoForm;
