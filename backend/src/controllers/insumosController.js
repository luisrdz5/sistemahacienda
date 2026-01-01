import { Insumo, PrecioInsumo } from '../models/index.js';
import { Op } from 'sequelize';

/**
 * Obtener todos los insumos con su precio actual
 */
export const getAll = async (req, res, next) => {
  try {
    const { activo } = req.query;
    const where = {};

    if (activo !== undefined) {
      where.activo = activo === 'true';
    }

    const insumos = await Insumo.findAll({
      where,
      order: [['nombre', 'ASC']]
    });

    // Obtener precio actual de cada insumo
    const insumosConPrecio = await Promise.all(
      insumos.map(async (insumo) => {
        const precioActual = await PrecioInsumo.findOne({
          where: { insumoId: insumo.id },
          order: [['fechaInicio', 'DESC']]
        });

        return {
          ...insumo.toJSON(),
          precioActual: precioActual ? parseFloat(precioActual.precio) : null,
          fechaPrecio: precioActual ? precioActual.fechaInicio : null
        };
      })
    );

    res.json(insumosConPrecio);
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener un insumo por ID
 */
export const getById = async (req, res, next) => {
  try {
    const insumo = await Insumo.findByPk(req.params.id);

    if (!insumo) {
      return res.status(404).json({ error: 'Insumo no encontrado' });
    }

    const precioActual = await PrecioInsumo.findOne({
      where: { insumoId: insumo.id },
      order: [['fechaInicio', 'DESC']]
    });

    res.json({
      ...insumo.toJSON(),
      precioActual: precioActual ? parseFloat(precioActual.precio) : null,
      fechaPrecio: precioActual ? precioActual.fechaInicio : null
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Crear un nuevo insumo
 */
export const create = async (req, res, next) => {
  try {
    const { nombre, unidadBase, unidadCompra, factorConversion, precio } = req.body;

    if (!nombre) {
      return res.status(400).json({ error: 'Nombre es requerido' });
    }

    // Verificar que no exista
    const existente = await Insumo.findOne({ where: { nombre } });
    if (existente) {
      return res.status(400).json({ error: 'Ya existe un insumo con ese nombre' });
    }

    const insumo = await Insumo.create({
      nombre,
      unidadBase: unidadBase || 'kg',
      unidadCompra: unidadCompra || 'kg',
      factorConversion: factorConversion || 1.0
    });

    // Si se proporciona precio inicial, crearlo
    if (precio && precio > 0) {
      await PrecioInsumo.create({
        insumoId: insumo.id,
        precio,
        fechaInicio: new Date()
      });
    }

    res.status(201).json({
      ...insumo.toJSON(),
      precioActual: precio || null
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualizar un insumo
 */
export const update = async (req, res, next) => {
  try {
    const insumo = await Insumo.findByPk(req.params.id);

    if (!insumo) {
      return res.status(404).json({ error: 'Insumo no encontrado' });
    }

    const { nombre, unidadBase, unidadCompra, factorConversion, activo } = req.body;

    // Verificar nombre único si cambió
    if (nombre && nombre !== insumo.nombre) {
      const existente = await Insumo.findOne({ where: { nombre } });
      if (existente) {
        return res.status(400).json({ error: 'Ya existe un insumo con ese nombre' });
      }
    }

    await insumo.update({
      nombre: nombre ?? insumo.nombre,
      unidadBase: unidadBase ?? insumo.unidadBase,
      unidadCompra: unidadCompra ?? insumo.unidadCompra,
      factorConversion: factorConversion ?? insumo.factorConversion,
      activo: activo ?? insumo.activo
    });

    // Obtener precio actual
    const precioActual = await PrecioInsumo.findOne({
      where: { insumoId: insumo.id },
      order: [['fechaInicio', 'DESC']]
    });

    res.json({
      ...insumo.toJSON(),
      precioActual: precioActual ? parseFloat(precioActual.precio) : null
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Desactivar un insumo (soft delete)
 */
export const remove = async (req, res, next) => {
  try {
    const insumo = await Insumo.findByPk(req.params.id);

    if (!insumo) {
      return res.status(404).json({ error: 'Insumo no encontrado' });
    }

    await insumo.update({ activo: false });
    res.json({ message: 'Insumo desactivado correctamente' });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener historial de precios de un insumo
 */
export const getHistorial = async (req, res, next) => {
  try {
    const { id } = req.params;

    const insumo = await Insumo.findByPk(id);
    if (!insumo) {
      return res.status(404).json({ error: 'Insumo no encontrado' });
    }

    const precios = await PrecioInsumo.findAll({
      where: { insumoId: id },
      order: [['fechaInicio', 'DESC']]
    });

    res.json({
      insumoId: parseInt(id),
      insumoNombre: insumo.nombre,
      precios: precios.map(p => ({
        id: p.id,
        precio: parseFloat(p.precio),
        fechaInicio: p.fechaInicio,
        createdAt: p.createdAt
      }))
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Registrar nuevo precio (crea entrada en historial)
 */
export const addPrecio = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { precio } = req.body;

    if (!precio || precio <= 0) {
      return res.status(400).json({ error: 'Precio debe ser mayor a 0' });
    }

    const insumo = await Insumo.findByPk(id);
    if (!insumo) {
      return res.status(404).json({ error: 'Insumo no encontrado' });
    }

    const precioInsumo = await PrecioInsumo.create({
      insumoId: id,
      precio,
      fechaInicio: new Date()
    });

    res.status(201).json({
      id: precioInsumo.id,
      insumoId: parseInt(id),
      precio: parseFloat(precioInsumo.precio),
      fechaInicio: precioInsumo.fechaInicio
    });
  } catch (error) {
    next(error);
  }
};
