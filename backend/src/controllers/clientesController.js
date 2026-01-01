import { Cliente, PrecioCliente, PrecioSucursal, Producto } from '../models/index.js';

/**
 * Listar clientes
 */
export const getAll = async (req, res, next) => {
  try {
    const { activo } = req.query;
    const where = {};

    if (activo !== undefined) {
      where.activo = activo === 'true';
    }

    const clientes = await Cliente.findAll({
      where,
      include: [{
        model: PrecioCliente,
        as: 'precios',
        include: [{ model: Producto, as: 'producto' }]
      }],
      order: [['nombre', 'ASC']]
    });

    res.json(clientes);
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener cliente por ID
 */
export const getById = async (req, res, next) => {
  try {
    const cliente = await Cliente.findByPk(req.params.id, {
      include: [{
        model: PrecioCliente,
        as: 'precios',
        include: [{ model: Producto, as: 'producto' }]
      }]
    });

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    res.json(cliente);
  } catch (error) {
    next(error);
  }
};

/**
 * Crear cliente
 */
export const create = async (req, res, next) => {
  try {
    const { nombre, telefono, direccion, notas, precios } = req.body;

    if (!nombre) {
      return res.status(400).json({ error: 'Nombre es requerido' });
    }

    const cliente = await Cliente.create({
      nombre,
      telefono,
      direccion,
      notas
    });

    // Crear precios personalizados si se proporcionan
    if (precios && Array.isArray(precios)) {
      for (const precio of precios) {
        if (precio.productoId && precio.precio) {
          await PrecioCliente.create({
            clienteId: cliente.id,
            productoId: precio.productoId,
            precio: precio.precio
          });
        }
      }
    }

    // Recargar con precios
    const clienteConPrecios = await Cliente.findByPk(cliente.id, {
      include: [{
        model: PrecioCliente,
        as: 'precios',
        include: [{ model: Producto, as: 'producto' }]
      }]
    });

    res.status(201).json(clienteConPrecios);
  } catch (error) {
    next(error);
  }
};

/**
 * Actualizar cliente
 */
export const update = async (req, res, next) => {
  try {
    const cliente = await Cliente.findByPk(req.params.id);

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    const { nombre, telefono, direccion, notas, activo, precios } = req.body;

    await cliente.update({
      nombre: nombre ?? cliente.nombre,
      telefono: telefono ?? cliente.telefono,
      direccion: direccion ?? cliente.direccion,
      notas: notas ?? cliente.notas,
      activo: activo ?? cliente.activo
    });

    // Actualizar precios si se proporcionan
    if (precios && Array.isArray(precios)) {
      // Eliminar precios existentes
      await PrecioCliente.destroy({ where: { clienteId: cliente.id } });

      // Crear nuevos precios
      for (const precio of precios) {
        if (precio.productoId && precio.precio) {
          await PrecioCliente.create({
            clienteId: cliente.id,
            productoId: precio.productoId,
            precio: precio.precio
          });
        }
      }
    }

    // Recargar con precios
    const clienteActualizado = await Cliente.findByPk(cliente.id, {
      include: [{
        model: PrecioCliente,
        as: 'precios',
        include: [{ model: Producto, as: 'producto' }]
      }]
    });

    res.json(clienteActualizado);
  } catch (error) {
    next(error);
  }
};

/**
 * Eliminar cliente (soft delete)
 */
export const remove = async (req, res, next) => {
  try {
    const cliente = await Cliente.findByPk(req.params.id);

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    await cliente.update({ activo: false });
    res.json({ message: 'Cliente desactivado correctamente' });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener precio de un producto para un cliente específico
 * Jerarquía: PrecioCliente > PrecioSucursal > PrecioLista
 *
 * Query params opcionales:
 * - sucursalId: ID de la sucursal para buscar precio de sucursal
 */
export const getPrecioProducto = async (req, res, next) => {
  try {
    const { clienteId, productoId } = req.params;
    const { sucursalId } = req.query;

    const producto = await Producto.findByPk(productoId);
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // 1. Buscar precio personalizado del cliente (máxima prioridad)
    const precioCliente = await PrecioCliente.findOne({
      where: { clienteId, productoId }
    });

    if (precioCliente) {
      return res.json({
        productoId: parseInt(productoId),
        clienteId: parseInt(clienteId),
        sucursalId: sucursalId ? parseInt(sucursalId) : null,
        precio: parseFloat(precioCliente.precio),
        tipoPrecios: 'cliente',
        precioLista: parseFloat(producto.precioLista)
      });
    }

    // 2. Buscar precio de sucursal si se proporciona sucursalId
    if (sucursalId) {
      const precioSucursal = await PrecioSucursal.findOne({
        where: { sucursalId, productoId }
      });

      if (precioSucursal) {
        return res.json({
          productoId: parseInt(productoId),
          clienteId: parseInt(clienteId),
          sucursalId: parseInt(sucursalId),
          precio: parseFloat(precioSucursal.precio),
          tipoPrecio: 'sucursal',
          precioLista: parseFloat(producto.precioLista)
        });
      }
    }

    // 3. Retornar precio de lista (fallback)
    res.json({
      productoId: parseInt(productoId),
      clienteId: parseInt(clienteId),
      sucursalId: sucursalId ? parseInt(sucursalId) : null,
      precio: parseFloat(producto.precioLista),
      tipoPrecio: 'lista',
      precioLista: parseFloat(producto.precioLista)
    });
  } catch (error) {
    next(error);
  }
};
