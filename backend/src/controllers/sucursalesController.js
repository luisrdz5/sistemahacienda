import { Sucursal } from '../models/index.js';

/**
 * Listar todas las sucursales
 */
export const getAll = async (req, res, next) => {
  try {
    const sucursales = await Sucursal.findAll({
      where: { activa: true },
      order: [['nombre', 'ASC']]
    });
    res.json(sucursales);
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener sucursal por ID
 */
export const getById = async (req, res, next) => {
  try {
    const sucursal = await Sucursal.findByPk(req.params.id);

    if (!sucursal) {
      return res.status(404).json({ error: 'Sucursal no encontrada' });
    }

    res.json(sucursal);
  } catch (error) {
    next(error);
  }
};

/**
 * Crear sucursal
 */
export const create = async (req, res, next) => {
  try {
    const { nombre, direccion } = req.body;

    if (!nombre) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }

    const sucursal = await Sucursal.create({ nombre, direccion });
    res.status(201).json(sucursal);
  } catch (error) {
    next(error);
  }
};

/**
 * Actualizar sucursal
 */
export const update = async (req, res, next) => {
  try {
    const sucursal = await Sucursal.findByPk(req.params.id);

    if (!sucursal) {
      return res.status(404).json({ error: 'Sucursal no encontrada' });
    }

    const { nombre, direccion, activa } = req.body;

    await sucursal.update({
      nombre: nombre ?? sucursal.nombre,
      direccion: direccion ?? sucursal.direccion,
      activa: activa ?? sucursal.activa
    });

    res.json(sucursal);
  } catch (error) {
    next(error);
  }
};

/**
 * Eliminar sucursal (soft delete)
 */
export const remove = async (req, res, next) => {
  try {
    const sucursal = await Sucursal.findByPk(req.params.id);

    if (!sucursal) {
      return res.status(404).json({ error: 'Sucursal no encontrada' });
    }

    await sucursal.update({ activa: false });
    res.json({ message: 'Sucursal desactivada correctamente' });
  } catch (error) {
    next(error);
  }
};
