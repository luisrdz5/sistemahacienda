import { Empleado, Sucursal } from '../models/index.js';

/**
 * Listar empleados
 */
export const getAll = async (req, res, next) => {
  try {
    const { sucursalId } = req.query;
    const where = { activo: true };

    if (sucursalId) {
      where.sucursalId = sucursalId;
    } else if (req.user.rol === 'encargado' && req.user.sucursalId) {
      where.sucursalId = req.user.sucursalId;
    }

    const empleados = await Empleado.findAll({
      where,
      include: [{ model: Sucursal, as: 'sucursal' }],
      order: [['nombre', 'ASC']]
    });

    res.json(empleados);
  } catch (error) {
    next(error);
  }
};

/**
 * Crear empleado
 */
export const create = async (req, res, next) => {
  try {
    const { nombre, sucursalId } = req.body;

    if (!nombre || !sucursalId) {
      return res.status(400).json({ error: 'Nombre y sucursal son requeridos' });
    }

    const empleado = await Empleado.create({ nombre, sucursalId });

    res.status(201).json(empleado);
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener empleado por ID
 */
export const getById = async (req, res, next) => {
  try {
    const empleado = await Empleado.findByPk(req.params.id, {
      include: [{ model: Sucursal, as: 'sucursal' }]
    });

    if (!empleado) {
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }

    res.json(empleado);
  } catch (error) {
    next(error);
  }
};

/**
 * Actualizar empleado
 */
export const update = async (req, res, next) => {
  try {
    const empleado = await Empleado.findByPk(req.params.id);

    if (!empleado) {
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }

    const { nombre, sucursalId, activo } = req.body;

    await empleado.update({
      nombre: nombre ?? empleado.nombre,
      sucursalId: sucursalId ?? empleado.sucursalId,
      activo: activo ?? empleado.activo
    });

    res.json(empleado);
  } catch (error) {
    next(error);
  }
};

/**
 * Eliminar empleado (soft delete)
 */
export const remove = async (req, res, next) => {
  try {
    const empleado = await Empleado.findByPk(req.params.id);

    if (!empleado) {
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }

    await empleado.update({ activo: false });
    res.json({ message: 'Empleado desactivado correctamente' });
  } catch (error) {
    next(error);
  }
};
