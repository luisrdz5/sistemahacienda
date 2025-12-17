import { Gasto, Corte, CategoriaGasto } from '../models/index.js';

/**
 * Actualizar gasto
 */
export const update = async (req, res, next) => {
  try {
    const gasto = await Gasto.findByPk(req.params.id, {
      include: [{ model: Corte, as: 'corte' }]
    });

    if (!gasto) {
      return res.status(404).json({ error: 'Gasto no encontrado' });
    }

    // Admin puede modificar gastos de cortes completados
    if (gasto.corte.estado === 'completado' && req.user.rol !== 'admin') {
      return res.status(400).json({ error: 'No se puede modificar un gasto de un corte completado' });
    }

    const { categoriaId, descripcion, monto } = req.body;

    await gasto.update({
      categoriaId: categoriaId ?? gasto.categoriaId,
      descripcion: descripcion ?? gasto.descripcion,
      monto: monto ?? gasto.monto
    });

    const gastoActualizado = await Gasto.findByPk(gasto.id, {
      include: [{ model: CategoriaGasto, as: 'categoria' }]
    });

    res.json(gastoActualizado);
  } catch (error) {
    next(error);
  }
};

/**
 * Eliminar gasto
 */
export const remove = async (req, res, next) => {
  try {
    const gasto = await Gasto.findByPk(req.params.id, {
      include: [{ model: Corte, as: 'corte' }]
    });

    if (!gasto) {
      return res.status(404).json({ error: 'Gasto no encontrado' });
    }

    // Admin puede eliminar gastos de cortes completados
    if (gasto.corte.estado === 'completado' && req.user.rol !== 'admin') {
      return res.status(400).json({ error: 'No se puede eliminar un gasto de un corte completado' });
    }

    await gasto.destroy();

    res.json({ message: 'Gasto eliminado' });
  } catch (error) {
    next(error);
  }
};
