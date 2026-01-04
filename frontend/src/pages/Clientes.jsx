import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import './Clientes.css';

function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pendientesCount, setPendientesCount] = useState(0);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [clientesData, productosData, sucursalesData] = await Promise.all([
        api.get('/clientes'),
        api.get('/productos?activo=true'),
        api.get('/sucursales')
      ]);
      setClientes(clientesData.data || clientesData);
      setProductos(productosData.data || productosData);
      setSucursales(sucursalesData.data || sucursalesData);

      // Contar clientes pendientes de aprobacion
      try {
        const pendientesData = await api.get('/clientes/pendientes');
        const pendientes = pendientesData.data || pendientesData;
        setPendientesCount(Array.isArray(pendientes) ? pendientes.length : 0);
      } catch (e) {
        // Si falla el endpoint de pendientes, ignorar
        setPendientesCount(0);
      }
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
        <div className="page-header-actions">
          {pendientesCount > 0 && (
            <Link to="/clientes-pendientes" className="btn btn-warning">
              Pendientes ({pendientesCount})
            </Link>
          )}
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            + Nuevo Cliente
          </button>
        </div>
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
          sucursales={sucursales}
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
    }).format(amount || 0);
  };

  const getPrecioProducto = (productoId) => {
    const precioPersonalizado = cliente.precios?.find(p => p.productoId === productoId);
    const producto = productos.find(p => p.id === productoId);
    return {
      precio: precioPersonalizado ? parseFloat(precioPersonalizado.precio) : parseFloat(producto?.precioLista || 0),
      esPersonalizado: !!precioPersonalizado
    };
  };

  const creditoUsado = cliente.adeudoTotal ? (cliente.adeudoTotal / cliente.limiteCredito) * 100 : 0;

  return (
    <div className={`cliente-card card ${!cliente.activo ? 'cliente-inactivo' : ''}`}>
      <div className="cliente-header">
        <h3>{cliente.nombre}</h3>
        <div className="cliente-badges">
          {!cliente.activo && (
            <span className="badge badge-error">Inactivo</span>
          )}
          {cliente.aprobado === false && (
            <span className="badge badge-warning">Pendiente</span>
          )}
          {cliente.email && (
            <span className="badge badge-info" title="Cliente con portal">Portal</span>
          )}
        </div>
      </div>

      {cliente.telefono && (
        <p className="cliente-info">
          <span className="info-icon">&#128222;</span>
          <a href={`https://wa.me/52${cliente.telefono.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
            {cliente.telefono}
          </a>
        </p>
      )}

      {cliente.direccion && (
        <p className="cliente-info">
          <span className="info-icon">&#128205;</span>
          {cliente.direccion}
        </p>
      )}

      {cliente.sucursal && (
        <p className="cliente-info">
          <span className="info-icon">&#127970;</span>
          {cliente.sucursal.nombre}
          {cliente.sucursalBackup && ` / ${cliente.sucursalBackup.nombre}`}
        </p>
      )}

      {/* Seccion de credito */}
      <div className="cliente-credito">
        <div className="credito-header">
          <span>Credito</span>
          <span className="credito-limite">{formatMoney(cliente.limiteCredito)}</span>
        </div>
        <div className="credito-bar">
          <div
            className="credito-bar-fill"
            style={{
              width: `${Math.min(100, creditoUsado)}%`,
              background: creditoUsado > 80 ? '#ef4444' : creditoUsado > 50 ? '#f59e0b' : '#10b981'
            }}
          ></div>
        </div>
        <div className="credito-stats">
          <span className={cliente.adeudoTotal > 0 ? 'adeudo' : ''}>
            Adeudo: {formatMoney(cliente.adeudoTotal || 0)}
          </span>
          <span className="disponible">
            Disp: {formatMoney((cliente.limiteCredito || 0) - (cliente.adeudoTotal || 0))}
          </span>
        </div>
      </div>

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

function ClienteForm({ cliente, productos, sucursales, onSubmit, onClose }) {
  const [nombre, setNombre] = useState(cliente?.nombre || '');
  const [telefono, setTelefono] = useState(cliente?.telefono || '');
  const [direccion, setDireccion] = useState(cliente?.direccion || '');
  const [notas, setNotas] = useState(cliente?.notas || '');
  const [activo, setActivo] = useState(cliente?.activo ?? true);
  const [limiteCredito, setLimiteCredito] = useState(cliente?.limiteCredito || 200);
  const [sucursalId, setSucursalId] = useState(cliente?.sucursalId || '');
  const [sucursalBackupId, setSucursalBackupId] = useState(cliente?.sucursalBackupId || '');
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
      limiteCredito: parseFloat(limiteCredito) || 200,
      sucursalId: sucursalId ? parseInt(sucursalId) : null,
      sucursalBackupId: sucursalBackupId ? parseInt(sucursalBackupId) : null,
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
            <h4>Credito y Sucursal</h4>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Limite de Credito</label>
                <input
                  type="number"
                  className="form-input"
                  value={limiteCredito}
                  onChange={(e) => setLimiteCredito(e.target.value)}
                  placeholder="200.00"
                  min="0"
                  step="50"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Sucursal Principal</label>
                <select
                  className="form-input"
                  value={sucursalId}
                  onChange={(e) => setSucursalId(e.target.value)}
                >
                  <option value="">Sin asignar</option>
                  {sucursales.map(s => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Sucursal Backup</label>
                <select
                  className="form-input"
                  value={sucursalBackupId}
                  onChange={(e) => setSucursalBackupId(e.target.value)}
                >
                  <option value="">Sin backup</option>
                  {sucursales.filter(s => s.id !== parseInt(sucursalId)).map(s => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                  ))}
                </select>
              </div>
            </div>
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
