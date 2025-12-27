import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './Productos.css';

function Productos() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProducto, setEditingProducto] = useState(null);

  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async () => {
    try {
      const data = await api.get('/productos');
      setProductos(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (productoData) => {
    try {
      if (editingProducto) {
        await api.put(`/productos/${editingProducto.id}`, productoData);
      } else {
        await api.post('/productos', productoData);
      }
      setShowForm(false);
      setEditingProducto(null);
      cargarProductos();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleEdit = (producto) => {
    setEditingProducto(producto);
    setShowForm(true);
  };

  const handleDelete = async (producto) => {
    if (!confirm(`¿Desactivar el producto "${producto.nombre}"?`)) {
      return;
    }
    try {
      await api.delete(`/productos/${producto.id}`);
      cargarProductos();
    } catch (error) {
      alert(error.message);
    }
  };

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  if (loading) {
    return <div className="loading">Cargando productos...</div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Productos</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          + Nuevo Producto
        </button>
      </div>

      <div className="productos-grid">
        {productos.map(producto => (
          <div key={producto.id} className={`producto-card card ${!producto.activo ? 'producto-inactivo' : ''}`}>
            <div className="producto-header">
              <h3>{producto.nombre}</h3>
              {!producto.activo && (
                <span className="badge badge-error">Inactivo</span>
              )}
            </div>
            <div className="producto-info">
              <span className="producto-precio">{formatMoney(producto.precioLista)}</span>
              <span className="producto-unidad">por {producto.unidad}</span>
            </div>
            <div className="producto-actions">
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => handleEdit(producto)}
              >
                Editar
              </button>
              {producto.activo && (
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDelete(producto)}
                >
                  Desactivar
                </button>
              )}
            </div>
          </div>
        ))}
        {productos.length === 0 && (
          <p className="empty-message">No hay productos registrados</p>
        )}
      </div>

      {showForm && (
        <ProductoForm
          producto={editingProducto}
          onSubmit={handleSubmit}
          onClose={() => {
            setShowForm(false);
            setEditingProducto(null);
          }}
        />
      )}
    </div>
  );
}

function ProductoForm({ producto, onSubmit, onClose }) {
  const [nombre, setNombre] = useState(producto?.nombre || '');
  const [unidad, setUnidad] = useState(producto?.unidad || 'kg');
  const [precioLista, setPrecioLista] = useState(producto?.precioLista || '');
  const [activo, setActivo] = useState(producto?.activo ?? true);
  const [loading, setLoading] = useState(false);

  const unidades = ['kg', 'pieza', 'docena', 'litro', 'paquete'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!precioLista) {
      alert('Ingresa el precio');
      return;
    }
    setLoading(true);
    await onSubmit({
      nombre,
      unidad,
      precioLista: parseFloat(precioLista),
      activo
    });
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{producto ? 'Editar Producto' : 'Nuevo Producto'}</h3>
          <button className="modal-close" onClick={onClose}>x</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-content">
          <div className="form-group">
            <label className="form-label">Nombre</label>
            <input
              type="text"
              className="form-input"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre del producto"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Precio de Lista</label>
              <input
                type="number"
                className="form-input"
                value={precioLista}
                onChange={(e) => setPrecioLista(e.target.value)}
                placeholder="$0.00"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Unidad</label>
              <select
                className="form-input"
                value={unidad}
                onChange={(e) => setUnidad(e.target.value)}
              >
                {unidades.map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          {producto && (
            <div className="form-group">
              <label className="form-checkbox">
                <input
                  type="checkbox"
                  checked={activo}
                  onChange={(e) => setActivo(e.target.checked)}
                />
                <span>Producto activo</span>
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

export default Productos;
