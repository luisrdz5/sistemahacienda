import { Op } from 'sequelize';
import { Abono, Pedido, Cliente, Usuario, sequelize } from '../models/index.js';

/**
 * Registrar pago para un cliente
 * Distribuye el pago entre pedidos pendientes (del más antiguo al más reciente)
 */
export const registrarPagoCliente = async (req, res, next) => {
  const t = await sequelize.transaction();

  try {
    const { clienteId, monto, tipo, notas, pedidoId } = req.body;

    if (!clienteId || !monto || monto <= 0) {
      await t.rollback();
      return res.status(400).json({ error: 'Cliente y monto son requeridos' });
    }

    const cliente = await Cliente.findByPk(clienteId);
    if (!cliente) {
      await t.rollback();
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    let montoRestante = parseFloat(monto);
    const abonosCreados = [];
    const pedidosActualizados = [];

    // Si se especifica un pedido, aplicar solo a ese pedido
    if (pedidoId) {
      const pedido = await Pedido.findOne({
        where: { id: pedidoId, clienteId }
      });

      if (!pedido) {
        await t.rollback();
        return res.status(404).json({ error: 'Pedido no encontrado para este cliente' });
      }

      const saldoPendiente = parseFloat(pedido.saldoPendiente);
      if (saldoPendiente <= 0) {
        await t.rollback();
        return res.status(400).json({ error: 'Este pedido ya está pagado' });
      }

      const montoAplicar = Math.min(montoRestante, saldoPendiente);

      // Crear abono
      const abono = await Abono.create({
        pedidoId: pedido.id,
        clienteId,
        monto: montoAplicar,
        tipo: tipo || 'efectivo',
        notas: notas || null,
        registradoPorId: req.user.id
      }, { transaction: t });

      // Actualizar pedido
      const nuevoMontoPagado = parseFloat(pedido.montoPagado) + montoAplicar;
      const nuevoSaldoPendiente = parseFloat(pedido.total) - nuevoMontoPagado;

      await pedido.update({
        montoPagado: nuevoMontoPagado,
        saldoPendiente: nuevoSaldoPendiente
      }, { transaction: t });

      abonosCreados.push(abono);
      pedidosActualizados.push({
        pedidoId: pedido.id,
        montoAplicado: montoAplicar,
        nuevoSaldo: nuevoSaldoPendiente
      });

      montoRestante -= montoAplicar;
    } else {
      // Obtener pedidos pendientes del cliente (ordenados por fecha, más antiguo primero)
      const pedidosPendientes = await Pedido.findAll({
        where: {
          clienteId,
          estado: 'entregado',
          saldoPendiente: { [Op.gt]: 0 }
        },
        order: [['fecha', 'ASC'], ['createdAt', 'ASC']],
        transaction: t
      });

      if (pedidosPendientes.length === 0) {
        await t.rollback();
        return res.status(400).json({ error: 'El cliente no tiene pedidos pendientes de pago' });
      }

      // Distribuir el pago entre pedidos
      for (const pedido of pedidosPendientes) {
        if (montoRestante <= 0) break;

        const saldoPendiente = parseFloat(pedido.saldoPendiente);
        const montoAplicar = Math.min(montoRestante, saldoPendiente);

        // Crear abono para este pedido
        const abono = await Abono.create({
          pedidoId: pedido.id,
          clienteId,
          monto: montoAplicar,
          tipo: tipo || 'efectivo',
          notas: notas || null,
          registradoPorId: req.user.id
        }, { transaction: t });

        // Actualizar pedido
        const nuevoMontoPagado = parseFloat(pedido.montoPagado) + montoAplicar;
        const nuevoSaldoPendiente = parseFloat(pedido.total) - nuevoMontoPagado;

        await pedido.update({
          montoPagado: nuevoMontoPagado,
          saldoPendiente: nuevoSaldoPendiente
        }, { transaction: t });

        abonosCreados.push(abono);
        pedidosActualizados.push({
          pedidoId: pedido.id,
          fecha: pedido.fecha,
          montoAplicado: montoAplicar,
          nuevoSaldo: nuevoSaldoPendiente
        });

        montoRestante -= montoAplicar;
      }
    }

    await t.commit();

    // Calcular nuevo adeudo total del cliente
    const nuevoAdeudo = await Pedido.sum('saldoPendiente', {
      where: {
        clienteId,
        estado: 'entregado',
        saldoPendiente: { [Op.gt]: 0 }
      }
    }) || 0;

    res.json({
      message: 'Pago registrado correctamente',
      montoTotal: parseFloat(monto),
      montoAplicado: parseFloat(monto) - montoRestante,
      montoSobrante: montoRestante,
      pedidosAfectados: pedidosActualizados.length,
      detalles: pedidosActualizados,
      nuevoAdeudoCliente: nuevoAdeudo
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

/**
 * Obtener historial de pagos de un cliente
 */
export const getHistorialPagosCliente = async (req, res, next) => {
  try {
    const { clienteId } = req.params;
    const { desde, hasta, limit = 50 } = req.query;

    const where = { clienteId };

    if (desde || hasta) {
      where.createdAt = {};
      if (desde) where.createdAt[Op.gte] = new Date(desde);
      if (hasta) where.createdAt[Op.lte] = new Date(hasta + 'T23:59:59');
    }

    const abonos = await Abono.findAll({
      where,
      include: [
        { model: Pedido, as: 'pedido', attributes: ['id', 'fecha', 'total'] },
        { model: Usuario, as: 'registradoPor', attributes: ['id', 'nombre'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit)
    });

    // Estadísticas
    const totalPagado = await Abono.sum('monto', { where: { clienteId } }) || 0;
    const adeudoActual = await Pedido.sum('saldoPendiente', {
      where: {
        clienteId,
        estado: 'entregado',
        saldoPendiente: { [Op.gt]: 0 }
      }
    }) || 0;

    res.json({
      abonos,
      estadisticas: {
        totalPagado,
        adeudoActual,
        cantidadPagos: abonos.length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener resumen de deudas por cliente (para el modal de pago)
 */
export const getResumenDeudaCliente = async (req, res, next) => {
  try {
    const { clienteId } = req.params;

    const cliente = await Cliente.findByPk(clienteId);
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    // Pedidos pendientes de pago
    const pedidosPendientes = await Pedido.findAll({
      where: {
        clienteId,
        estado: 'entregado',
        saldoPendiente: { [Op.gt]: 0 }
      },
      attributes: ['id', 'fecha', 'total', 'montoPagado', 'saldoPendiente'],
      order: [['fecha', 'ASC']]
    });

    const adeudoTotal = pedidosPendientes.reduce(
      (sum, p) => sum + parseFloat(p.saldoPendiente), 0
    );

    res.json({
      cliente: {
        id: cliente.id,
        nombre: cliente.nombre,
        telefono: cliente.telefono,
        limiteCredito: cliente.limiteCredito
      },
      adeudoTotal,
      pedidosPendientes: pedidosPendientes.map(p => ({
        id: p.id,
        fecha: p.fecha,
        total: parseFloat(p.total),
        pagado: parseFloat(p.montoPagado),
        pendiente: parseFloat(p.saldoPendiente)
      })),
      cantidadPedidos: pedidosPendientes.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Listar clientes con deuda (para selector en modal)
 */
export const getClientesConDeuda = async (req, res, next) => {
  try {
    // Obtener clientes que tienen pedidos con saldo pendiente
    const clientesConDeuda = await Cliente.findAll({
      where: { activo: true },
      include: [{
        model: Pedido,
        as: 'pedidos',
        where: {
          estado: 'entregado',
          saldoPendiente: { [Op.gt]: 0 }
        },
        required: true,
        attributes: []
      }],
      attributes: ['id', 'nombre', 'telefono']
    });

    // Calcular adeudo de cada cliente
    const clientesConAdeudo = await Promise.all(
      clientesConDeuda.map(async (cliente) => {
        const adeudo = await Pedido.sum('saldoPendiente', {
          where: {
            clienteId: cliente.id,
            estado: 'entregado',
            saldoPendiente: { [Op.gt]: 0 }
          }
        }) || 0;

        const cantidadPedidos = await Pedido.count({
          where: {
            clienteId: cliente.id,
            estado: 'entregado',
            saldoPendiente: { [Op.gt]: 0 }
          }
        });

        return {
          id: cliente.id,
          nombre: cliente.nombre,
          telefono: cliente.telefono,
          adeudoTotal: adeudo,
          pedidosPendientes: cantidadPedidos
        };
      })
    );

    // Ordenar por adeudo descendente
    clientesConAdeudo.sort((a, b) => b.adeudoTotal - a.adeudoTotal);

    res.json(clientesConAdeudo);
  } catch (error) {
    next(error);
  }
};
