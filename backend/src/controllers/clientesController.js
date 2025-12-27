import { Cliente, PrecioCliente, Producto } from '../models/index.js';

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
 * Retorna el precio personalizado o el precio de lista
 */
export const getPrecioProducto = async (req, res, next) => {
  try {
    const { clienteId, productoId } = req.params;

    const producto = await Producto.findByPk(productoId);
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Buscar precio personalizado
    const precioCliente = await PrecioCliente.findOne({
      where: { clienteId, productoId }
    });

    res.json({
      productoId: parseInt(productoId),
      clienteId: parseInt(clienteId),
      precio: precioCliente ? parseFloat(precioCliente.precio) : parseFloat(producto.precioLista),
      esPrecioPersonalizado: !!precioCliente
    });
  } catch (error) {
    next(error);
  }
};
