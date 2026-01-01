import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './Sucursales.css';

function Sucursales() {
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSucursal, setEditingSucursal] = useState(null);
  const [showPreciosModal, setShowPreciosModal] = useState(false);
  const [selectedSucursal, setSelectedSucursal] = useState(null);

  useEffect(() => {
    cargarSucursales();
  }, []);

  const cargarSucursales = async () => {
    setLoading(true);
    try {
      const data = await api.get('/sucursales');
      setSucursales(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPrecios = (sucursal) => {
    setSelectedSucursal(sucursal);
    setShowPreciosModal(true);
  };

  const handleSubmit = async (sucursalData) => {
    try {
      if (editingSucursal) {
        await api.put(`/sucursales/${editingSucursal.id}`, sucursalData);
      } else {
        await api.post('/sucursales', sucursalData);
      }
      setShowForm(false);
      setEditingSucursal(null);
      cargarSucursales();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleEdit = (sucursal) => {
    setEditingSucursal(sucursal);
    setShowForm(true);
  };

  if (loading) {
    return <div className="loading">Cargando sucursales...</div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Sucursales</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          + Nueva Sucursal
        </button>
      </div>

      <div className="sucursales-grid">
        {sucursales.map(sucursal => (
          <div key={sucursal.id} className="sucursal-card card">
            <div className="sucursal-header">
              <h3>{sucursal.nombre}</h3>
              <span className={`badge badge-${sucursal.activa ? 'success' : 'error'}`}>
                {sucursal.activa ? 'Activa' : 'Inactiva'}
              </span>
            </div>
            {sucursal.direccion && (
              <p className="sucursal-direccion">{sucursal.direccion}</p>
            )}
            <div className="sucursal-actions">
              <button
                className="btn btn-primary btn-sm"
                onClick={() => handleOpenPrecios(sucursal)}
              >
                Precios
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => handleEdit(sucursal)}
              >
                Editar
              </button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <SucursalForm
          sucursal={editingSucursal}
          onSubmit={handleSubmit}
          onClose={() => {
            setShowForm(false);
            setEditingSucursal(null);
          }}
        />
      )}

      {showPreciosModal && selectedSucursal && (
        <PreciosModal
          sucursal={selectedSucursal}
          onClose={() => {
            setShowPreciosModal(false);
            setSelectedSucursal(null);
          }}
        />
      )}
    </div>
  );
}

function SucursalForm({ sucursal, onSubmit, onClose }) {
  const [nombre, setNombre] = useState(sucursal?.nombre || '');
  const [direccion, setDireccion] = useState(sucursal?.direccion || '');
  const [activa, setActiva] = useState(sucursal?.activa ?? true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit({ nombre, direccion, activa });
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{sucursal ? 'Editar Sucursal' : 'Nueva Sucursal'}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-content">
          <div className="form-group">
            <label className="form-label">Nombre</label>
            <input
              type="text"
              className="form-input"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Hacienda"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Dirección</label>
            <input
              type="text"
              className="form-input"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              placeholder="Ej: Av. Principal #123"
            />
          </div>

          {sucursal && (
            <div className="form-group">
              <label className="form-checkbox">
                <input
                  type="checkbox"
                  checked={activa}
                  onChange={(e) => setActiva(e.target.checked)}
                />
                <span>Sucursal activa</span>
              </label>
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PreciosModal({ sucursal, onClose }) {
  const [precios, setPrecios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preciosEditados, setPreciosEditados] = useState({});

  useEffect(() => {
    cargarPrecios();
  }, [sucursal.id]);

  const cargarPrecios = async () => {
    setLoading(true);
    try {
      const data = await api.get(`/sucursales/${sucursal.id}/precios`);
      setPrecios(data.precios || []);

      // Inicializar precios editados con los valores actuales
      const preciosMap = {};
      (data.precios || []).forEach(p => {
        if (p.precioSucursal !== null) {
          preciosMap[p.productoId] = p.precioSucursal;
        }
      });
      setPreciosEditados(preciosMap);
    } catch (error) {
      console.error('Error cargando precios:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrecioChange = (productoId, valor) => {
    if (valor === '' || valor === null) {
      const newPrecios = { ...preciosEditados };
      delete newPrecios[productoId];
      setPreciosEditados(newPrecios);
    } else {
      setPreciosEditados({ ...preciosEditados, [productoId]: valor });
    }
  };

  const handleGuardar = async () => {
    setSaving(true);
    try {
      // Convertir a array para la API
      const preciosArray = precios.map(p => ({
        productoId: p.productoId,
        precio: preciosEditados[p.productoId] !== undefined
          ? (preciosEditados[p.productoId] === '' ? null : parseFloat(preciosEditados[p.productoId]))
          : null
      }));

      await api.put(`/sucursales/${sucursal.id}/precios`, { precios: preciosArray });
      alert('Precios guardados correctamente');
      onClose();
    } catch (error) {
      alert('Error al guardar precios: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Precios de {sucursal.nombre}</h3>
          <button className="modal-close" onClick={onClose}>x</button>
        </div>

        <div className="modal-content">
          {loading ? (
            <div className="loading">Cargando precios...</div>
          ) : (
            <>
              <p className="form-help">
                Establece precios personalizados para esta sucursal.
                Deja vacio para usar el precio de lista.
              </p>

              <div className="precios-sucursal-grid">
                {precios.map(producto => (
                  <div key={producto.productoId} className="precio-sucursal-item">
                    <div className="precio-info">
                      <span className="precio-nombre">{producto.nombre}</span>
                      <span className="precio-unidad">({producto.unidad})</span>
                      <span className="precio-lista-ref">
                        Lista: {formatMoney(producto.precioLista)}
                      </span>
                    </div>
                    <div className="precio-input-wrapper">
                      <span className="precio-currency">$</span>
                      <input
                        type="number"
                        className="form-input precio-input"
                        value={preciosEditados[producto.productoId] ?? ''}
                        onChange={(e) => handlePrecioChange(producto.productoId, e.target.value)}
                        placeholder={producto.precioLista}
                        min="0"
                        step="0.50"
                      />
                    </div>
                    {producto.tienePrecioPersonalizado && preciosEditados[producto.productoId] === undefined && (
                      <span className="badge badge-info">Personalizado</span>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleGuardar}
            disabled={loading || saving}
          >
            {saving ? 'Guardando...' : 'Guardar Precios'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Sucursales;
