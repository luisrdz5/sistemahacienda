import { CategoriaGasto, Gasto } from '../models/index.js';

/**
 * Listar categorías de gasto
 */
export const getAll = async (req, res, next) => {
  try {
    const { incluirInactivas } = req.query;
    const where = incluirInactivas === 'true' ? {} : { activa: true };

    const categorias = await CategoriaGasto.findAll({
      where,
      order: [['tipo', 'ASC'], ['nombre', 'ASC']]
    });
    res.json(categorias);
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener categoría por ID
 */
export const getById = async (req, res, next) => {
  try {
    const categoria = await CategoriaGasto.findByPk(req.params.id);

    if (!categoria) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    res.json(categoria);
  } catch (error) {
    next(error);
  }
};

/**
 * Crear categoría de gasto
 */
export const create = async (req, res, next) => {
  try {
    const { nombre, tipo } = req.body;

    if (!nombre) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }

    if (tipo && !['operativo', 'nomina'].includes(tipo)) {
      return res.status(400).json({ error: 'El tipo debe ser "operativo" o "nomina"' });
    }

    const existente = await CategoriaGasto.findOne({ where: { nombre } });
    if (existente) {
      return res.status(400).json({ error: 'Ya existe una categoría con ese nombre' });
    }

    const categoria = await CategoriaGasto.create({
      nombre,
      tipo: tipo || 'operativo'
    });

    res.status(201).json(categoria);
  } catch (error) {
    next(error);
  }
};

/**
 * Actualizar categoría de gasto
 */
export const update = async (req, res, next) => {
  try {
    const categoria = await CategoriaGasto.findByPk(req.params.id);

    if (!categoria) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    const { nombre, tipo, activa } = req.body;

    if (tipo && !['operativo', 'nomina'].includes(tipo)) {
      return res.status(400).json({ error: 'El tipo debe ser "operativo" o "nomina"' });
    }

    if (nombre && nombre !== categoria.nombre) {
      const existente = await CategoriaGasto.findOne({ where: { nombre } });
      if (existente) {
        return res.status(400).json({ error: 'Ya existe una categoría con ese nombre' });
      }
    }

    await categoria.update({
      nombre: nombre ?? categoria.nombre,
      tipo: tipo ?? categoria.tipo,
      activa: activa ?? categoria.activa
    });

    res.json(categoria);
  } catch (error) {
    next(error);
  }
};

/**
 * Eliminar categoría de gasto (soft delete)
 */
export const remove = async (req, res, next) => {
  try {
    const categoria = await CategoriaGasto.findByPk(req.params.id);

    if (!categoria) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    const gastosAsociados = await Gasto.count({ where: { categoriaId: categoria.id } });
    if (gastosAsociados > 0) {
      await categoria.update({ activa: false });
      return res.json({
        message: 'Categoría desactivada (tiene gastos asociados)',
        categoria
      });
    }

    await categoria.destroy();
    res.json({ message: 'Categoría eliminada correctamente' });
  } catch (error) {
    next(error);
  }
};
