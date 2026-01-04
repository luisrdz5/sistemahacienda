import { Op } from 'sequelize';
import { Pedido, DetallePedido, Cliente, Producto, Usuario, PrecioCliente, Abono, Sucursal, HistorialPedido, sequelize } from '../models/index.js';

// Helper para obtener IP del request
const getClientIP = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || null;
};

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
    const { fecha, repartidorId, estado, clienteId, sucursalId } = req.query;
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

    if (sucursalId) {
      where.sucursalId = sucursalId;
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
        { model: Sucursal, as: 'sucursal', attributes: ['id', 'nombre'] },
        { model: Sucursal, as: 'sucursalActual', attributes: ['id', 'nombre'] },
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
        { model: Sucursal, as: 'sucursal', attributes: ['id', 'nombre'] },
        { model: Sucursal, as: 'sucursalActual', attributes: ['id', 'nombre'] },
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
    const { fecha, clienteId, repartidorId, notas, detalles, sucursalId } = req.body;

    if (!fecha || !detalles || detalles.length === 0) {
      await t.rollback();
      return res.status(400).json({ error: 'Fecha y al menos un producto son requeridos' });
    }

    // Obtener sucursales del cliente si existe
    let sucursalPrincipal = sucursalId || null;
    let sucursalBackup = null;

    if (clienteId) {
      const cliente = await Cliente.findByPk(clienteId);
      if (cliente) {
        sucursalPrincipal = sucursalId || cliente.sucursalId;
        sucursalBackup = cliente.sucursalBackupId;
      }
    }

    // Crear pedido
    const pedido = await Pedido.create({
      fecha,
      clienteId: clienteId || null,
      repartidorId: repartidorId || null,
      creadoPorId: req.user.id,
      notas: notas || null,
      total: 0,
      sucursalId: sucursalPrincipal,
      sucursalBackupId: sucursalBackup,
      sucursalActualId: sucursalPrincipal // Por defecto la principal
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

    // Actualizar total y saldo pendiente
    await pedido.update({ total, saldoPendiente: total }, { transaction: t });

    // Registrar en historial
    await HistorialPedido.registrar(pedido.id, req.user.id, 'creado',
      `Pedido creado por ${req.user.nombre || req.user.email}`, {
        datosNuevos: { clienteId, repartidorId, total, detalles: detalles.length },
        ipAddress: getClientIP(req),
        transaction: t
      });

    await t.commit();

    // Recargar con relaciones
    const pedidoCompleto = await Pedido.findByPk(pedido.id, {
      include: [
        { model: Cliente, as: 'cliente' },
        { model: Usuario, as: 'repartidor', attributes: ['id', 'nombre'] },
        { model: Usuario, as: 'creadoPor', attributes: ['id', 'nombre'] },
        { model: Sucursal, as: 'sucursal', attributes: ['id', 'nombre'] },
        { model: Sucursal, as: 'sucursalActual', attributes: ['id', 'nombre'] },
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

    // Guardar datos anteriores para historial
    const datosAnteriores = {
      clienteId: pedido.clienteId,
      repartidorId: pedido.repartidorId,
      notas: pedido.notas,
      total: pedido.total
    };

    // Detectar si cambió el repartidor
    const cambioRepartidor = repartidorId !== undefined && repartidorId !== pedido.repartidorId;

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

      // Actualizar total y recalcular saldo pendiente
      const saldoPendiente = total - parseFloat(pedido.montoPagado || 0);
      await pedido.update({ total, saldoPendiente }, { transaction: t });
    }

    // Registrar cambios en historial
    if (cambioRepartidor) {
      await HistorialPedido.registrar(pedido.id, req.user.id,
        datosAnteriores.repartidorId ? 'repartidor_cambiado' : 'repartidor_asignado',
        `Repartidor ${datosAnteriores.repartidorId ? 'cambiado' : 'asignado'} por ${req.user.nombre || req.user.email}`, {
          datosAnteriores: { repartidorId: datosAnteriores.repartidorId },
          datosNuevos: { repartidorId },
          ipAddress: getClientIP(req),
          transaction: t
        });
    } else {
      await HistorialPedido.registrar(pedido.id, req.user.id, 'editado',
        `Pedido editado por ${req.user.nombre || req.user.email}`, {
          datosAnteriores,
          datosNuevos: { clienteId, repartidorId, notas },
          ipAddress: getClientIP(req),
          transaction: t
        });
    }

    await t.commit();

    // Recargar
    const pedidoActualizado = await Pedido.findByPk(pedido.id, {
      include: [
        { model: Cliente, as: 'cliente' },
        { model: Usuario, as: 'repartidor', attributes: ['id', 'nombre'] },
        { model: Usuario, as: 'creadoPor', attributes: ['id', 'nombre'] },
        { model: Sucursal, as: 'sucursal', attributes: ['id', 'nombre'] },
        { model: Sucursal, as: 'sucursalActual', attributes: ['id', 'nombre'] },
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
 * Marcar pedido como preparado (encargado prepara el producto)
 */
export const preparar = async (req, res, next) => {
  try {
    const pedido = await Pedido.findByPk(req.params.id);

    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    if (pedido.estado !== 'pendiente') {
      return res.status(400).json({ error: 'Solo se pueden preparar pedidos pendientes' });
    }

    await pedido.update({
      estado: 'preparado',
      fechaPreparado: new Date()
    });

    // Registrar en historial
    await HistorialPedido.registrar(pedido.id, req.user.id, 'estado_preparado',
      `Marcado como preparado por ${req.user.nombre || req.user.email}`, {
        datosAnteriores: { estado: 'pendiente' },
        datosNuevos: { estado: 'preparado' },
        ipAddress: getClientIP(req)
      });

    res.json({ message: 'Pedido marcado como preparado', pedido });
  } catch (error) {
    next(error);
  }
};

/**
 * Marcar pedido como en camino (despachado de sucursal)
 */
export const despachar = async (req, res, next) => {
  try {
    const pedido = await Pedido.findByPk(req.params.id);

    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    if (!['pendiente', 'preparado'].includes(pedido.estado)) {
      return res.status(400).json({ error: 'Solo se pueden despachar pedidos pendientes o preparados' });
    }

    const ahora = new Date();
    const demoraPreparacionSeg = Math.floor((ahora - new Date(pedido.createdAt)) / 1000);

    const estadoAnterior = pedido.estado;

    await pedido.update({
      estado: 'en_camino',
      fechaDespacho: ahora,
      demoraPreparacionSeg
    });

    // Registrar en historial
    await HistorialPedido.registrar(pedido.id, req.user.id, 'estado_en_camino',
      `Despachado por ${req.user.nombre || req.user.email} (${Math.round(demoraPreparacionSeg / 60)} min preparación)`, {
        datosAnteriores: { estado: estadoAnterior },
        datosNuevos: { estado: 'en_camino', demoraPreparacionSeg },
        ipAddress: getClientIP(req)
      });

    res.json({
      message: 'Pedido marcado como en camino',
      pedido,
      tiempoPreparacion: {
        segundos: demoraPreparacionSeg,
        minutos: Math.round(demoraPreparacionSeg / 60)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Marcar pedido como entregado (con registro de pago)
 */
export const entregar = async (req, res, next) => {
  const t = await sequelize.transaction();

  try {
    const { montoPagado, tipoPago, observaciones } = req.body;
    const pedido = await Pedido.findByPk(req.params.id);

    if (!pedido) {
      await t.rollback();
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    if (!['pendiente', 'preparado', 'en_camino'].includes(pedido.estado)) {
      await t.rollback();
      return res.status(400).json({
        error: 'Solo se pueden entregar pedidos pendientes, preparados o en camino'
      });
    }

    // Guardar estado anterior para historial
    const estadoAnterior = pedido.estado;

    // Validar observacion obligatoria si no hay pago
    const montoAbono = parseFloat(montoPagado) || 0;
    if (montoAbono === 0 && !observaciones) {
      await t.rollback();
      return res.status(400).json({
        error: 'Si no se recibe pago, debe indicar una observacion'
      });
    }

    const total = parseFloat(pedido.total);
    const nuevoMontoPagado = parseFloat(pedido.montoPagado) + montoAbono;
    const nuevoSaldoPendiente = total - nuevoMontoPagado;

    // Registrar abono si hay monto
    if (montoAbono > 0) {
      await Abono.create({
        pedidoId: pedido.id,
        monto: montoAbono,
        tipo: tipoPago || 'efectivo',
        notas: observaciones || null,
        registradoPorId: req.user.id
      }, { transaction: t });
    }

    // Calcular tiempos de entrega
    const ahora = new Date();
    let demoraEntregaSeg = null;
    let demoraTotalSeg = null;

    if (pedido.fechaDespacho) {
      demoraEntregaSeg = Math.floor((ahora - new Date(pedido.fechaDespacho)) / 1000);
    }
    demoraTotalSeg = Math.floor((ahora - new Date(pedido.createdAt)) / 1000);

    // Actualizar pedido
    await pedido.update({
      estado: 'entregado',
      montoPagado: nuevoMontoPagado,
      saldoPendiente: nuevoSaldoPendiente,
      observaciones: observaciones || pedido.observaciones,
      fechaEntrega: ahora,
      demoraEntregaSeg,
      demoraTotalSeg
    }, { transaction: t });

    // Registrar entrega en historial
    await HistorialPedido.registrar(pedido.id, req.user.id, 'estado_entregado',
      `Entregado por ${req.user.nombre || req.user.email}${demoraEntregaSeg ? ` (${Math.round(demoraEntregaSeg / 60)} min entrega)` : ''}`, {
        datosAnteriores: { estado: estadoAnterior },
        datosNuevos: { estado: 'entregado', demoraEntregaSeg, demoraTotalSeg },
        ipAddress: getClientIP(req),
        transaction: t
      });

    // Registrar pago en historial si aplica
    if (montoAbono > 0) {
      await HistorialPedido.registrar(pedido.id, req.user.id, 'pago_registrado',
        `Pago de $${montoAbono.toFixed(2)} (${tipoPago || 'efectivo'}) registrado por ${req.user.nombre || req.user.email}`, {
          datosNuevos: { monto: montoAbono, tipo: tipoPago || 'efectivo', saldoPendiente: nuevoSaldoPendiente },
          ipAddress: getClientIP(req),
          transaction: t
        });
    }

    await t.commit();

    // Recargar pedido con relaciones
    const pedidoActualizado = await Pedido.findByPk(pedido.id, {
      include: [
        { model: Cliente, as: 'cliente' },
        { model: Usuario, as: 'repartidor', attributes: ['id', 'nombre'] }
      ]
    });

    res.json({
      message: 'Pedido marcado como entregado',
      pedido: pedidoActualizado,
      pagoRegistrado: montoAbono > 0,
      saldoPendiente: nuevoSaldoPendiente
    });
  } catch (error) {
    await t.rollback();
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

    // Registrar en historial
    await HistorialPedido.registrar(pedido.id, req.user.id, 'estado_cancelado',
      `Cancelado por ${req.user.nombre || req.user.email}`, {
        datosAnteriores: { estado: 'pendiente' },
        datosNuevos: { estado: 'cancelado' },
        ipAddress: getClientIP(req)
      });

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
      pedidosPreparados: pedidos.filter(p => p.estado === 'preparado').length,
      pedidosEnCamino: pedidos.filter(p => p.estado === 'en_camino').length,
      pedidosEntregados: pedidos.filter(p => p.estado === 'entregado').length,
      pedidosCancelados: pedidos.filter(p => p.estado === 'cancelado').length,
      montoTotal: pedidos.reduce((sum, p) => sum + parseFloat(p.total || 0), 0),
      montoEntregado: pedidos
        .filter(p => p.estado === 'entregado')
        .reduce((sum, p) => sum + parseFloat(p.total || 0), 0),
      montoPagado: pedidos
        .filter(p => p.estado === 'entregado')
        .reduce((sum, p) => sum + parseFloat(p.montoPagado || 0), 0),
      saldoPendiente: pedidos
        .filter(p => p.estado === 'entregado')
        .reduce((sum, p) => sum + parseFloat(p.saldoPendiente || 0), 0)
    };

    res.json(resumen);
  } catch (error) {
    next(error);
  }
};

/**
 * Registrar abono adicional (solo admin)
 */
export const registrarAbono = async (req, res, next) => {
  const t = await sequelize.transaction();

  try {
    const { monto, tipo, notas } = req.body;
    const pedido = await Pedido.findByPk(req.params.id);

    if (!pedido) {
      await t.rollback();
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    if (pedido.estado !== 'entregado') {
      await t.rollback();
      return res.status(400).json({
        error: 'Solo se pueden registrar abonos en pedidos entregados'
      });
    }

    const montoAbono = parseFloat(monto) || 0;
    if (montoAbono <= 0) {
      await t.rollback();
      return res.status(400).json({ error: 'El monto debe ser mayor a 0' });
    }

    // Validar que no exceda el saldo pendiente
    if (montoAbono > parseFloat(pedido.saldoPendiente)) {
      await t.rollback();
      return res.status(400).json({
        error: 'El monto no puede exceder el saldo pendiente'
      });
    }

    // Crear abono
    const abono = await Abono.create({
      pedidoId: pedido.id,
      monto: montoAbono,
      tipo: tipo || 'efectivo',
      notas: notas || null,
      registradoPorId: req.user.id
    }, { transaction: t });

    // Actualizar totales del pedido
    const nuevoMontoPagado = parseFloat(pedido.montoPagado) + montoAbono;
    const nuevoSaldoPendiente = parseFloat(pedido.total) - nuevoMontoPagado;

    await pedido.update({
      montoPagado: nuevoMontoPagado,
      saldoPendiente: nuevoSaldoPendiente
    }, { transaction: t });

    // Registrar en historial
    await HistorialPedido.registrar(pedido.id, req.user.id, 'abono_registrado',
      `Abono de $${montoAbono.toFixed(2)} (${tipo || 'efectivo'}) registrado por ${req.user.nombre || req.user.email}`, {
        datosNuevos: { monto: montoAbono, tipo: tipo || 'efectivo', saldoPendiente: nuevoSaldoPendiente },
        ipAddress: getClientIP(req),
        transaction: t
      });

    await t.commit();

    res.json({
      message: 'Abono registrado correctamente',
      abono,
      nuevoSaldo: nuevoSaldoPendiente
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

/**
 * Obtener historial de abonos de un pedido
 */
export const getAbonos = async (req, res, next) => {
  try {
    const abonos = await Abono.findAll({
      where: { pedidoId: req.params.id },
      include: [
        { model: Usuario, as: 'registradoPor', attributes: ['id', 'nombre'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(abonos);
  } catch (error) {
    next(error);
  }
};

/**
 * Dashboard de repartos pendientes (para pantalla sucursal)
 */
export const getRepartosPendientes = async (req, res, next) => {
  try {
    const { fecha } = req.query;
    const fechaConsulta = fecha || new Date().toISOString().split('T')[0];

    const where = {
      estado: { [Op.in]: ['pendiente', 'preparado', 'en_camino'] },
      fecha: fechaConsulta
    };

    const pedidos = await Pedido.findAll({
      where,
      include: [
        { model: Cliente, as: 'cliente' },
        { model: Usuario, as: 'repartidor', attributes: ['id', 'nombre'] },
        {
          model: DetallePedido,
          as: 'detalles',
          include: [{ model: Producto, as: 'producto' }]
        }
      ],
      order: [
        ['estado', 'ASC'], // pendiente primero, luego preparado, luego en_camino
        ['createdAt', 'ASC']
      ]
    });

    // Estadisticas rapidas
    const stats = {
      pendientes: pedidos.filter(p => p.estado === 'pendiente').length,
      preparados: pedidos.filter(p => p.estado === 'preparado').length,
      enCamino: pedidos.filter(p => p.estado === 'en_camino').length,
      total: pedidos.length
    };

    res.json({ stats, pedidos });
  } catch (error) {
    next(error);
  }
};

/**
 * Marcar sucursal ocupada y ofrecer a backup
 */
export const marcarSucursalOcupada = async (req, res, next) => {
  try {
    const pedido = await Pedido.findByPk(req.params.id);

    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    if (pedido.estado !== 'pendiente') {
      return res.status(400).json({ error: 'Solo se pueden transferir pedidos pendientes' });
    }

    if (!pedido.sucursalBackupId) {
      return res.status(400).json({ error: 'El pedido no tiene sucursal de backup configurada' });
    }

    await pedido.update({
      sucursalOcupada: true
    });

    res.json({
      message: 'Pedido marcado como disponible para sucursal backup',
      pedido,
      sucursalBackupId: pedido.sucursalBackupId
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Tomar pedido (sucursal backup toma el pedido)
 */
export const tomarPedido = async (req, res, next) => {
  try {
    const { sucursalId } = req.body;
    const pedido = await Pedido.findByPk(req.params.id);

    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    if (pedido.estado !== 'pendiente') {
      return res.status(400).json({ error: 'Solo se pueden tomar pedidos pendientes' });
    }

    // Verificar que la sucursal pueda tomar el pedido
    const esSucursalPrincipal = pedido.sucursalId === sucursalId;
    const esSucursalBackup = pedido.sucursalBackupId === sucursalId && pedido.sucursalOcupada;

    if (!esSucursalPrincipal && !esSucursalBackup) {
      return res.status(403).json({
        error: 'Esta sucursal no puede tomar este pedido'
      });
    }

    const transferido = esSucursalBackup;

    await pedido.update({
      sucursalActualId: sucursalId,
      transferido,
      fechaAsignacion: new Date()
    });

    res.json({
      message: transferido ? 'Pedido tomado por sucursal backup' : 'Pedido asignado',
      pedido,
      transferido
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Resumen de clientes deudores
 */
export const getClientesDeudores = async (req, res, next) => {
  try {
    const { periodo, repartidorId } = req.query;

    // Determinar rango de fechas
    const hoy = new Date();
    let fechaInicio;

    if (periodo === 'mensual') {
      fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    } else {
      // Semanal por defecto - domingo de esta semana
      const dayOfWeek = hoy.getDay();
      fechaInicio = new Date(hoy);
      fechaInicio.setDate(hoy.getDate() - dayOfWeek);
    }

    const fechaInicioStr = fechaInicio.toISOString().split('T')[0];
    const fechaFinStr = hoy.toISOString().split('T')[0];

    const whereClause = {
      saldoPendiente: { [Op.gt]: 0 },
      estado: 'entregado',
      fecha: { [Op.between]: [fechaInicioStr, fechaFinStr] }
    };

    // Repartidores solo ven sus propios deudores
    if (req.user.rol === 'repartidor') {
      whereClause.repartidorId = req.user.id;
    } else if (repartidorId) {
      whereClause.repartidorId = repartidorId;
    }

    const pedidosPendientes = await Pedido.findAll({
      where: whereClause,
      include: [
        { model: Cliente, as: 'cliente' },
        { model: Usuario, as: 'repartidor', attributes: ['id', 'nombre'] },
        {
          model: DetallePedido,
          as: 'detalles',
          include: [{ model: Producto, as: 'producto' }]
        }
      ],
      order: [['clienteId', 'ASC'], ['fecha', 'DESC']]
    });

    // Agrupar por cliente
    const clientesMap = {};
    pedidosPendientes.forEach(pedido => {
      const clienteId = pedido.clienteId || 'sin_cliente';
      const clienteNombre = pedido.cliente?.nombre || 'Sin cliente';

      if (!clientesMap[clienteId]) {
        clientesMap[clienteId] = {
          clienteId,
          clienteNombre,
          telefono: pedido.cliente?.telefono || null,
          direccion: pedido.cliente?.direccion || null,
          totalAdeudado: 0,
          pedidosPendientes: 0,
          ultimoPedido: null,
          pedidos: []
        };
      }

      clientesMap[clienteId].totalAdeudado += parseFloat(pedido.saldoPendiente);
      clientesMap[clienteId].pedidosPendientes += 1;
      clientesMap[clienteId].pedidos.push({
        id: pedido.id,
        fecha: pedido.fecha,
        total: parseFloat(pedido.total),
        saldoPendiente: parseFloat(pedido.saldoPendiente),
        repartidor: pedido.repartidor?.nombre,
        observaciones: pedido.observaciones,
        detalles: pedido.detalles?.map(d => ({
          id: d.id,
          cantidad: d.cantidad,
          producto: d.producto ? { id: d.producto.id, nombre: d.producto.nombre } : null
        }))
      });

      if (!clientesMap[clienteId].ultimoPedido ||
          pedido.fecha > clientesMap[clienteId].ultimoPedido) {
        clientesMap[clienteId].ultimoPedido = pedido.fecha;
      }
    });

    const clientes = Object.values(clientesMap)
      .map(c => ({
        id: c.clienteId,
        nombre: c.clienteNombre,
        telefono: c.telefono,
        direccion: c.direccion,
        totalDeuda: c.totalAdeudado,
        pedidos: c.pedidos.map(p => ({
          id: p.id,
          fecha: p.fecha,
          total: p.total,
          montoPagado: p.total - p.saldoPendiente,
          saldoPendiente: p.saldoPendiente,
          repartidor: p.repartidor,
          observaciones: p.observaciones,
          detalles: p.detalles
        }))
      }))
      .sort((a, b) => b.totalDeuda - a.totalDeuda);

    // Estadisticas
    const stats = {
      totalClientes: clientes.length,
      totalDeuda: clientes.reduce((sum, c) => sum + c.totalDeuda, 0),
      totalPedidos: pedidosPendientes.length,
      periodo: periodo || 'semanal',
      fechaInicio: fechaInicioStr,
      fechaFin: fechaFinStr
    };

    res.json({ stats, clientes });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener historial de acciones de un pedido
 */
export const getHistorial = async (req, res, next) => {
  try {
    const historial = await HistorialPedido.findAll({
      where: { pedidoId: req.params.id },
      include: [
        { model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'rol'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Formatear para mostrar de forma legible
    const historialFormateado = historial.map(h => ({
      id: h.id,
      accion: h.accion,
      accionLabel: HistorialPedido.getAccionLabel(h.accion),
      descripcion: h.descripcion,
      usuario: h.usuario?.nombre || 'Sistema',
      usuarioRol: h.usuario?.rol || null,
      datosAnteriores: h.datosAnteriores,
      datosNuevos: h.datosNuevos,
      fecha: h.createdAt,
      fechaFormateada: new Date(h.createdAt).toLocaleString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }));

    res.json(historialFormateado);
  } catch (error) {
    next(error);
  }
};
