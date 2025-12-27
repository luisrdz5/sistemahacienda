import { Producto } from '../models/index.js';

/**
 * Listar productos
 */
export const getAll = async (req, res, next) => {
  try {
    const { activo } = req.query;
    const where = {};

    if (activo !== undefined) {
      where.activo = activo === 'true';
    }

    const productos = await Producto.findAll({
      where,
      order: [['nombre', 'ASC']]
    });

    res.json(productos);
  } catch (error) {
    next(error);
  }
};

/**
 * Crear producto
 */
export const create = async (req, res, next) => {
  try {
    const { nombre, unidad, precioLista } = req.body;

    if (!nombre || !precioLista) {
      return res.status(400).json({ error: 'Nombre y precio son requeridos' });
    }

    const producto = await Producto.create({
      nombre,
      unidad: unidad || 'kg',
      precioLista
    });

    res.status(201).json(producto);
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener producto por ID
 */
export const getById = async (req, res, next) => {
  try {
    const producto = await Producto.findByPk(req.params.id);

    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json(producto);
  } catch (error) {
    next(error);
  }
};

/**
 * Actualizar producto
 */
export const update = async (req, res, next) => {
  try {
    const producto = await Producto.findByPk(req.params.id);

    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const { nombre, unidad, precioLista, activo } = req.body;

    await producto.update({
      nombre: nombre ?? producto.nombre,
      unidad: unidad ?? producto.unidad,
      precioLista: precioLista ?? producto.precioLista,
      activo: activo ?? producto.activo
    });

    res.json(producto);
  } catch (error) {
    next(error);
  }
};

/**
 * Eliminar producto (soft delete)
 */
export const remove = async (req, res, next) => {
  try {
    const producto = await Producto.findByPk(req.params.id);

    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    await producto.update({ activo: false });
    res.json({ message: 'Producto desactivado correctamente' });
  } catch (error) {
    next(error);
  }
};
