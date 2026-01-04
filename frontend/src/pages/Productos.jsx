import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import './Productos.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

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

  const handleSubmit = async (formData) => {
    try {
      const token = localStorage.getItem('token');
      const url = editingProducto
        ? `${API_URL}/api/productos/${editingProducto.id}`
        : `${API_URL}/api/productos`;

      const response = await fetch(url, {
        method: editingProducto ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al guardar');
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

  const getImageUrl = (imagenUrl) => {
    if (!imagenUrl) return null;
    if (imagenUrl.startsWith('http')) return imagenUrl;
    return `${API_URL}${imagenUrl}`;
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
            <div className="producto-imagen">
              {producto.imagenUrl ? (
                <img
                  src={getImageUrl(producto.imagenUrl)}
                  alt={producto.nombre}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div className="producto-imagen-placeholder" style={{ display: producto.imagenUrl ? 'none' : 'flex' }}>
                <span>Sin imagen</span>
              </div>
            </div>
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
          getImageUrl={getImageUrl}
        />
      )}
    </div>
  );
}

function ProductoForm({ producto, onSubmit, onClose, getImageUrl }) {
  const [nombre, setNombre] = useState(producto?.nombre || '');
  const [unidad, setUnidad] = useState(producto?.unidad || 'kg');
  const [precioLista, setPrecioLista] = useState(producto?.precioLista || '');
  const [activo, setActivo] = useState(producto?.activo ?? true);
  const [imagen, setImagen] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(producto?.imagenUrl ? getImageUrl(producto.imagenUrl) : null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const unidades = ['kg', 'pieza', 'docena', 'litro', 'paquete'];

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen no debe exceder 5MB');
        return;
      }
      setImagen(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setImagen(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!precioLista) {
      alert('Ingresa el precio');
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append('nombre', nombre);
    formData.append('unidad', unidad);
    formData.append('precioLista', precioLista);
    formData.append('activo', activo);
    if (imagen) {
      formData.append('imagen', imagen);
    }

    await onSubmit(formData);
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-producto" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{producto ? 'Editar Producto' : 'Nuevo Producto'}</h3>
          <button className="modal-close" onClick={onClose}>x</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-content">
          <div className="form-group">
            <label className="form-label">Imagen del Producto</label>
            <div className="imagen-upload-container">
              {previewUrl ? (
                <div className="imagen-preview">
                  <img src={previewUrl} alt="Preview" />
                  <button
                    type="button"
                    className="btn-remove-image"
                    onClick={handleRemoveImage}
                  >
                    X
                  </button>
                </div>
              ) : (
                <div
                  className="imagen-upload-placeholder"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <span>Click para subir imagen</span>
                  <small>JPG, PNG, WebP (max 5MB)</small>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />
              {previewUrl && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Cambiar imagen
                </button>
              )}
            </div>
          </div>

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
