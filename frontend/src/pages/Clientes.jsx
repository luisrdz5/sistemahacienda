import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './Clientes.css';

function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [clientesData, productosData] = await Promise.all([
        api.get('/clientes'),
        api.get('/productos?activo=true')
      ]);
      setClientes(clientesData);
      setProductos(productosData);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (clienteData) => {
    try {
      if (editingCliente) {
        await api.put(`/clientes/${editingCliente.id}`, clienteData);
      } else {
        await api.post('/clientes', clienteData);
      }
      setShowForm(false);
      setEditingCliente(null);
      cargarDatos();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleEdit = (cliente) => {
    setEditingCliente(cliente);
    setShowForm(true);
  };

  const handleDelete = async (cliente) => {
    if (!confirm(`¿Desactivar al cliente "${cliente.nombre}"?`)) {
      return;
    }
    try {
      await api.delete(`/clientes/${cliente.id}`);
      cargarDatos();
    } catch (error) {
      alert(error.message);
    }
  };

  const clientesFiltrados = clientes.filter(c =>
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.telefono?.includes(searchTerm) ||
    c.direccion?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="loading">Cargando clientes...</div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Clientes</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          + Nuevo Cliente
        </button>
      </div>

      <div className="clientes-search">
        <input
          type="text"
          className="form-input"
          placeholder="Buscar por nombre, telefono o direccion..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="clientes-grid">
        {clientesFiltrados.map(cliente => (
          <ClienteCard
            key={cliente.id}
            cliente={cliente}
            productos={productos}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
        {clientesFiltrados.length === 0 && (
          <p className="empty-message">No hay clientes que coincidan</p>
        )}
      </div>

      {showForm && (
        <ClienteForm
          cliente={editingCliente}
          productos={productos}
          onSubmit={handleSubmit}
          onClose={() => {
            setShowForm(false);
            setEditingCliente(null);
          }}
        />
      )}
    </div>
  );
}

function ClienteCard({ cliente, productos, onEdit, onDelete }) {
  const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const getPrecioProducto = (productoId) => {
    const precioPersonalizado = cliente.precios?.find(p => p.productoId === productoId);
    const producto = productos.find(p => p.id === productoId);
    return {
      precio: precioPersonalizado ? parseFloat(precioPersonalizado.precio) : parseFloat(producto?.precioLista || 0),
      esPersonalizado: !!precioPersonalizado
    };
  };

  return (
    <div className={`cliente-card card ${!cliente.activo ? 'cliente-inactivo' : ''}`}>
      <div className="cliente-header">
        <h3>{cliente.nombre}</h3>
        {!cliente.activo && (
          <span className="badge badge-error">Inactivo</span>
        )}
      </div>

      {cliente.telefono && (
        <p className="cliente-info">
          <span className="info-icon">📞</span>
          <a href={`https://wa.me/52${cliente.telefono.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
            {cliente.telefono}
          </a>
        </p>
      )}

      {cliente.direccion && (
        <p className="cliente-info">
          <span className="info-icon">📍</span>
          {cliente.direccion}
        </p>
      )}

      <div className="cliente-precios">
        <h4>Precios</h4>
        <div className="precios-lista">
          {productos.slice(0, 4).map(producto => {
            const { precio, esPersonalizado } = getPrecioProducto(producto.id);
            return (
              <div key={producto.id} className={`precio-item ${esPersonalizado ? 'precio-personalizado' : ''}`}>
                <span className="precio-producto">{producto.nombre}</span>
                <span className="precio-valor">{formatMoney(precio)}/{producto.unidad}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="cliente-actions">
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => onEdit(cliente)}
        >
          Editar
        </button>
        {cliente.activo && (
          <button
            className="btn btn-danger btn-sm"
            onClick={() => onDelete(cliente)}
          >
            Desactivar
          </button>
        )}
      </div>
    </div>
  );
}

function ClienteForm({ cliente, productos, onSubmit, onClose }) {
  const [nombre, setNombre] = useState(cliente?.nombre || '');
  const [telefono, setTelefono] = useState(cliente?.telefono || '');
  const [direccion, setDireccion] = useState(cliente?.direccion || '');
  const [notas, setNotas] = useState(cliente?.notas || '');
  const [activo, setActivo] = useState(cliente?.activo ?? true);
  const [precios, setPrecios] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Inicializar precios personalizados del cliente
    if (cliente?.precios) {
      const preciosMap = {};
      cliente.precios.forEach(p => {
        preciosMap[p.productoId] = p.precio;
      });
      setPrecios(preciosMap);
    }
  }, [cliente]);

  const handlePrecioChange = (productoId, valor) => {
    if (valor === '' || valor === null) {
      const newPrecios = { ...precios };
      delete newPrecios[productoId];
      setPrecios(newPrecios);
    } else {
      setPrecios({ ...precios, [productoId]: valor });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Convertir precios a array
    const preciosArray = Object.entries(precios)
      .filter(([_, precio]) => precio !== '' && precio !== null)
      .map(([productoId, precio]) => ({
        productoId: parseInt(productoId),
        precio: parseFloat(precio)
      }));

    await onSubmit({
      nombre,
      telefono: telefono || null,
      direccion: direccion || null,
      notas: notas || null,
      activo,
      precios: preciosArray
    });
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{cliente ? 'Editar Cliente' : 'Nuevo Cliente'}</h3>
          <button className="modal-close" onClick={onClose}>x</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-content">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Nombre *</label>
              <input
                type="text"
                className="form-input"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Nombre del cliente"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Telefono (WhatsApp)</label>
              <input
                type="tel"
                className="form-input"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="10 digitos"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Direccion</label>
            <input
              type="text"
              className="form-input"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              placeholder="Direccion de entrega"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Notas</label>
            <textarea
              className="form-input"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Notas adicionales..."
              rows={2}
            />
          </div>

          <div className="form-section">
            <h4>Precios Personalizados</h4>
            <p className="form-help">Deja vacio para usar precio de lista</p>

            <div className="precios-grid">
              {productos.map(producto => (
                <div key={producto.id} className="precio-form-item">
                  <label className="precio-label">
                    {producto.nombre}
                    <span className="precio-lista">Lista: ${producto.precioLista}/{producto.unidad}</span>
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    value={precios[producto.id] || ''}
                    onChange={(e) => handlePrecioChange(producto.id, e.target.value)}
                    placeholder={`$${producto.precioLista}`}
                    min="0"
                    step="0.01"
                  />
                </div>
              ))}
            </div>
          </div>

          {cliente && (
            <div className="form-group">
              <label className="form-checkbox">
                <input
                  type="checkbox"
                  checked={activo}
                  onChange={(e) => setActivo(e.target.checked)}
                />
                <span>Cliente activo</span>
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

export default Clientes;
