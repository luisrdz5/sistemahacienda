import { Op } from 'sequelize';
import { Corte, Gasto, Sucursal, Usuario, CategoriaGasto } from '../models/index.js';

/**
 * Listar cortes con filtros
 */
export const getAll = async (req, res, next) => {
  try {
    const { fecha, sucursalId, estado } = req.query;
    const where = {};

    if (fecha) where.fecha = fecha;
    if (sucursalId) where.sucursalId = sucursalId;
    if (estado) where.estado = estado;

    // Si es encargado, solo ver su sucursal
    if (req.user.rol === 'encargado' && req.user.sucursalId) {
      where.sucursalId = req.user.sucursalId;
    }

    const cortes = await Corte.findAll({
      where,
      include: [
        { model: Sucursal, as: 'sucursal' },
        { model: Usuario, as: 'usuario', attributes: ['id', 'nombre'] }
      ],
      order: [['fecha', 'DESC']]
    });

    res.json(cortes);
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener corte por ID con gastos
 */
export const getById = async (req, res, next) => {
  try {
    const corte = await Corte.findByPk(req.params.id, {
      include: [
        { model: Sucursal, as: 'sucursal' },
        { model: Usuario, as: 'usuario', attributes: ['id', 'nombre'] },
        {
          model: Gasto,
          as: 'gastos',
          include: [{ model: CategoriaGasto, as: 'categoria' }]
        }
      ]
    });

    if (!corte) {
      return res.status(404).json({ error: 'Corte no encontrado' });
    }

    // Calcular totales
    const totalGastos = corte.gastos.reduce((sum, g) => sum + parseFloat(g.monto), 0);
    const debe = totalGastos - parseFloat(corte.ventaTotal || 0) - parseFloat(corte.efectivoCaja || 0);

    res.json({
      ...corte.toJSON(),
      totalGastos,
      debe
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Crear corte
 */
export const create = async (req, res, next) => {
  try {
    const { fecha, sucursalId } = req.body;

    if (!fecha || !sucursalId) {
      return res.status(400).json({ error: 'Fecha y sucursal son requeridos' });
    }

    // Verificar que no exista corte para esa fecha y sucursal
    const existente = await Corte.findOne({
      where: { fecha, sucursalId }
    });

    if (existente) {
      return res.status(409).json({
        error: 'Ya existe un corte para esta fecha y sucursal',
        corteId: existente.id
      });
    }

    // Verificar si es sucursal virtual
    const sucursal = await Sucursal.findByPk(sucursalId);
    const isVirtual = sucursal?.tipo === 'virtual';

    const corte = await Corte.create({
      fecha,
      sucursalId,
      usuarioId: req.user.id,
      // Sucursales virtuales no tienen efectivo/ventas/inventario
      efectivoCaja: isVirtual ? null : 0,
      ventaTotal: isVirtual ? null : 0,
      inventarioNixta: isVirtual ? null : 0,
      inventarioExtra: isVirtual ? null : 0
    });

    res.status(201).json(corte);
  } catch (error) {
    next(error);
  }
};

/**
 * Actualizar corte
 */
export const update = async (req, res, next) => {
  try {
    const corte = await Corte.findByPk(req.params.id);

    if (!corte) {
      return res.status(404).json({ error: 'Corte no encontrado' });
    }

    // Admin puede editar cortes completados
    if (corte.estado === 'completado' && req.user.rol !== 'admin') {
      return res.status(400).json({ error: 'No se puede modificar un corte completado' });
    }

    const { efectivoCaja, ventaTotal, inventarioNixta, inventarioExtra, notas } = req.body;

    // Verificar si es sucursal virtual
    const sucursal = await Sucursal.findByPk(corte.sucursalId);
    const isVirtual = sucursal?.tipo === 'virtual';

    if (isVirtual) {
      // Sucursales virtuales solo pueden actualizar notas
      await corte.update({ notas: notas ?? corte.notas });
    } else {
      await corte.update({
        efectivoCaja: efectivoCaja ?? corte.efectivoCaja,
        ventaTotal: ventaTotal ?? corte.ventaTotal,
        inventarioNixta: inventarioNixta ?? corte.inventarioNixta,
        inventarioExtra: inventarioExtra ?? corte.inventarioExtra,
        notas: notas ?? corte.notas
      });
    }

    res.json(corte);
  } catch (error) {
    next(error);
  }
};

/**
 * Finalizar corte
 */
export const finalizar = async (req, res, next) => {
  try {
    const corte = await Corte.findByPk(req.params.id, {
      include: [
        { model: Gasto, as: 'gastos' },
        { model: Sucursal, as: 'sucursal' }
      ]
    });

    if (!corte) {
      return res.status(404).json({ error: 'Corte no encontrado' });
    }

    if (corte.estado === 'completado') {
      return res.status(400).json({ error: 'El corte ya está completado' });
    }

    // Calcular ventaTotal = efectivoCaja + totalGastos
    const totalGastos = corte.gastos.reduce((sum, g) => sum + parseFloat(g.monto || 0), 0);
    const isVirtual = corte.sucursal?.tipo === 'virtual';

    const updateData = { estado: 'completado' };

    // Solo calcular ventaTotal para sucursales físicas
    if (!isVirtual) {
      updateData.ventaTotal = parseFloat(corte.efectivoCaja || 0) + totalGastos;
    }

    await corte.update(updateData);

    res.json({ message: 'Corte finalizado', corte });
  } catch (error) {
    next(error);
  }
};

/**
 * Eliminar corte (solo borrador)
 */
export const remove = async (req, res, next) => {
  try {
    const corte = await Corte.findByPk(req.params.id);

    if (!corte) {
      return res.status(404).json({ error: 'Corte no encontrado' });
    }

    // Admin puede eliminar cortes completados
    if (corte.estado === 'completado' && req.user.rol !== 'admin') {
      return res.status(400).json({ error: 'No se puede eliminar un corte completado' });
    }

    // Eliminar gastos asociados
    await Gasto.destroy({ where: { corteId: corte.id } });
    await corte.destroy();

    res.json({ message: 'Corte eliminado' });
  } catch (error) {
    next(error);
  }
};

/**
 * Agregar gasto a un corte
 */
export const addGasto = async (req, res, next) => {
  try {
    const { corteId } = req.params;
    const { categoriaId, descripcion, monto } = req.body;

    const corte = await Corte.findByPk(corteId);
    if (!corte) {
      return res.status(404).json({ error: 'Corte no encontrado' });
    }

    // Admin puede agregar gastos a cortes completados
    if (corte.estado === 'completado' && req.user.rol !== 'admin') {
      return res.status(400).json({ error: 'No se pueden agregar gastos a un corte completado' });
    }

    if (!categoriaId || monto === undefined) {
      return res.status(400).json({ error: 'Categoría y monto son requeridos' });
    }

    const gasto = await Gasto.create({
      corteId,
      categoriaId,
      descripcion,
      monto
    });

    const gastoConCategoria = await Gasto.findByPk(gasto.id, {
      include: [{ model: CategoriaGasto, as: 'categoria' }]
    });

    res.status(201).json(gastoConCategoria);
  } catch (error) {
    next(error);
  }
};
