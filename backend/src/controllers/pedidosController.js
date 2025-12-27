import { Op } from 'sequelize';
import { Pedido, DetallePedido, Cliente, Producto, Usuario, PrecioCliente, sequelize } from '../models/index.js';

/**
 * Obtener precio de producto para cliente (personalizado o lista)
 */
const obtenerPrecioProducto = async (clienteId, productoId) => {
  const producto = await Producto.findByPk(productoId);
  if (!producto) return null;

  if (clienteId) {
    const precioCliente = await PrecioCliente.findOne({
      where: { clienteId, productoId }
    });
    if (precioCliente) {
      return parseFloat(precioCliente.precio);
    }
  }

  return parseFloat(producto.precioLista);
};

/**
 * Listar pedidos
 */
export const getAll = async (req, res, next) => {
  try {
    const { fecha, repartidorId, estado, clienteId } = req.query;
    const where = {};

    if (fecha) {
      where.fecha = fecha;
    }

    if (repartidorId) {
      where.repartidorId = repartidorId;
    }

    if (estado) {
      where.estado = estado;
    }

    if (clienteId) {
      where.clienteId = clienteId;
    }

    // Repartidores solo ven sus propios pedidos
    if (req.user.rol === 'repartidor') {
      where.repartidorId = req.user.id;
    }

    const pedidos = await Pedido.findAll({
      where,
      include: [
        { model: Cliente, as: 'cliente' },
        { model: Usuario, as: 'repartidor', attributes: ['id', 'nombre'] },
        { model: Usuario, as: 'creadoPor', attributes: ['id', 'nombre'] },
        {
          model: DetallePedido,
          as: 'detalles',
          include: [{ model: Producto, as: 'producto' }]
        }
      ],
      order: [['fecha', 'DESC'], ['createdAt', 'DESC']]
    });

    res.json(pedidos);
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener pedido por ID
 */
export const getById = async (req, res, next) => {
  try {
    const pedido = await Pedido.findByPk(req.params.id, {
      include: [
        { model: Cliente, as: 'cliente' },
        { model: Usuario, as: 'repartidor', attributes: ['id', 'nombre'] },
        { model: Usuario, as: 'creadoPor', attributes: ['id', 'nombre'] },
        {
          model: DetallePedido,
          as: 'detalles',
          include: [{ model: Producto, as: 'producto' }]
        }
      ]
    });

    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    res.json(pedido);
  } catch (error) {
    next(error);
  }
};

/**
 * Crear pedido
 */
export const create = async (req, res, next) => {
  const t = await sequelize.transaction();

  try {
    const { fecha, clienteId, repartidorId, notas, detalles } = req.body;

    if (!fecha || !detalles || detalles.length === 0) {
      await t.rollback();
      return res.status(400).json({ error: 'Fecha y al menos un producto son requeridos' });
    }

    // Crear pedido
    const pedido = await Pedido.create({
      fecha,
      clienteId: clienteId || null,
      repartidorId: repartidorId || null,
      creadoPorId: req.user.id,
      notas: notas || null,
      total: 0
    }, { transaction: t });

    let total = 0;

    // Crear detalles
    for (const detalle of detalles) {
      const precio = await obtenerPrecioProducto(clienteId, detalle.productoId);
      if (!precio) {
        await t.rollback();
        return res.status(400).json({ error: `Producto ${detalle.productoId} no encontrado` });
      }

      const subtotal = precio * parseFloat(detalle.cantidad);
      total += subtotal;

      await DetallePedido.create({
        pedidoId: pedido.id,
        productoId: detalle.productoId,
        cantidad: detalle.cantidad,
        precioUnitario: precio,
        subtotal
      }, { transaction: t });
    }

    // Actualizar total
    await pedido.update({ total }, { transaction: t });

    await t.commit();

    // Recargar con relaciones
    const pedidoCompleto = await Pedido.findByPk(pedido.id, {
      include: [
        { model: Cliente, as: 'cliente' },
        { model: Usuario, as: 'repartidor', attributes: ['id', 'nombre'] },
        { model: Usuario, as: 'creadoPor', attributes: ['id', 'nombre'] },
        {
          model: DetallePedido,
          as: 'detalles',
          include: [{ model: Producto, as: 'producto' }]
        }
      ]
    });

    res.status(201).json(pedidoCompleto);
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

/**
 * Actualizar pedido
 */
export const update = async (req, res, next) => {
  const t = await sequelize.transaction();

  try {
    const pedido = await Pedido.findByPk(req.params.id);

    if (!pedido) {
      await t.rollback();
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    if (pedido.estado !== 'pendiente') {
      await t.rollback();
      return res.status(400).json({ error: 'Solo se pueden editar pedidos pendientes' });
    }

    const { clienteId, repartidorId, notas, detalles } = req.body;

    // Actualizar datos básicos
    await pedido.update({
      clienteId: clienteId ?? pedido.clienteId,
      repartidorId: repartidorId ?? pedido.repartidorId,
      notas: notas ?? pedido.notas
    }, { transaction: t });

    // Si se proporcionan nuevos detalles, reemplazar
    if (detalles && Array.isArray(detalles)) {
      // Eliminar detalles existentes
      await DetallePedido.destroy({ where: { pedidoId: pedido.id }, transaction: t });

      let total = 0;

      // Crear nuevos detalles
      for (const detalle of detalles) {
        const precio = await obtenerPrecioProducto(pedido.clienteId, detalle.productoId);
        if (!precio) {
          await t.rollback();
          return res.status(400).json({ error: `Producto ${detalle.productoId} no encontrado` });
        }

        const subtotal = precio * parseFloat(detalle.cantidad);
        total += subtotal;

        await DetallePedido.create({
          pedidoId: pedido.id,
          productoId: detalle.productoId,
          cantidad: detalle.cantidad,
          precioUnitario: precio,
          subtotal
        }, { transaction: t });
      }

      await pedido.update({ total }, { transaction: t });
    }

    await t.commit();

    // Recargar
    const pedidoActualizado = await Pedido.findByPk(pedido.id, {
      include: [
        { model: Cliente, as: 'cliente' },
        { model: Usuario, as: 'repartidor', attributes: ['id', 'nombre'] },
        { model: Usuario, as: 'creadoPor', attributes: ['id', 'nombre'] },
        {
          model: DetallePedido,
          as: 'detalles',
          include: [{ model: Producto, as: 'producto' }]
        }
      ]
    });

    res.json(pedidoActualizado);
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

/**
 * Marcar pedido como entregado
 */
export const entregar = async (req, res, next) => {
  try {
    const pedido = await Pedido.findByPk(req.params.id);

    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    if (pedido.estado !== 'pendiente') {
      return res.status(400).json({ error: 'Solo se pueden entregar pedidos pendientes' });
    }

    await pedido.update({ estado: 'entregado' });

    res.json({ message: 'Pedido marcado como entregado', pedido });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancelar pedido
 */
export const cancelar = async (req, res, next) => {
  try {
    const pedido = await Pedido.findByPk(req.params.id);

    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    if (pedido.estado !== 'pendiente') {
      return res.status(400).json({ error: 'Solo se pueden cancelar pedidos pendientes' });
    }

    await pedido.update({ estado: 'cancelado' });

    res.json({ message: 'Pedido cancelado', pedido });
  } catch (error) {
    next(error);
  }
};

/**
 * Eliminar pedido (solo pendientes)
 */
export const remove = async (req, res, next) => {
  try {
    const pedido = await Pedido.findByPk(req.params.id);

    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    if (pedido.estado !== 'pendiente') {
      return res.status(400).json({ error: 'Solo se pueden eliminar pedidos pendientes' });
    }

    await pedido.destroy();

    res.json({ message: 'Pedido eliminado correctamente' });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener repartidores activos
 */
export const getRepartidores = async (req, res, next) => {
  try {
    const repartidores = await Usuario.findAll({
      where: {
        rol: { [Op.in]: ['repartidor', 'administrador_repartidor'] },
        activo: true
      },
      attributes: ['id', 'nombre', 'rol'],
      order: [['nombre', 'ASC']]
    });

    res.json(repartidores);
  } catch (error) {
    next(error);
  }
};

/**
 * Resumen del día
 */
export const getResumenDia = async (req, res, next) => {
  try {
    const { fecha } = req.query;
    const fechaConsulta = fecha || new Date().toISOString().split('T')[0];

    const where = { fecha: fechaConsulta };

    // Repartidores solo ven su resumen
    if (req.user.rol === 'repartidor') {
      where.repartidorId = req.user.id;
    }

    const pedidos = await Pedido.findAll({
      where,
      include: [
        { model: Cliente, as: 'cliente' },
        { model: Usuario, as: 'repartidor', attributes: ['id', 'nombre'] }
      ]
    });

    const resumen = {
      fecha: fechaConsulta,
      totalPedidos: pedidos.length,
      pedidosPendientes: pedidos.filter(p => p.estado === 'pendiente').length,
      pedidosEntregados: pedidos.filter(p => p.estado === 'entregado').length,
      pedidosCancelados: pedidos.filter(p => p.estado === 'cancelado').length,
      montoTotal: pedidos.reduce((sum, p) => sum + parseFloat(p.total || 0), 0),
      montoEntregado: pedidos
        .filter(p => p.estado === 'entregado')
        .reduce((sum, p) => sum + parseFloat(p.total || 0), 0)
    };

    res.json(resumen);
  } catch (error) {
    next(error);
  }
};
