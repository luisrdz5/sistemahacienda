import { Op } from 'sequelize';
import { CortePedidos, Pedido, Usuario, Cliente, DetallePedido, Producto, Abono, DetalleCierre, sequelize } from '../models/index.js';

/**
 * Obtener resumen general del día
 */
export const getResumenDia = async (req, res, next) => {
  try {
    const { fecha } = req.query;
    const fechaConsulta = fecha || new Date().toISOString().split('T')[0];

    // Obtener todos los pedidos del día
    const pedidos = await Pedido.findAll({
      where: { fecha: fechaConsulta },
      include: [
        { model: Cliente, as: 'cliente' },
        { model: Usuario, as: 'repartidor', attributes: ['id', 'nombre'] },
        { model: DetallePedido, as: 'detalles', include: [{ model: Producto, as: 'producto' }] }
      ]
    });

    // Obtener abonos del día (pueden ser de pedidos anteriores)
    const fechaInicio = new Date(fechaConsulta);
    fechaInicio.setHours(0, 0, 0, 0);
    const fechaFin = new Date(fechaConsulta);
    fechaFin.setHours(23, 59, 59, 999);

    const abonosDelDia = await Abono.findAll({
      where: {
        createdAt: { [Op.between]: [fechaInicio, fechaFin] }
      },
      include: [
        { model: Pedido, as: 'pedido', attributes: ['id', 'repartidorId'] },
        { model: Usuario, as: 'registradoPor', attributes: ['id', 'nombre'] }
      ]
    });

    // Agrupar por repartidor
    const porRepartidor = {};
    const sinAsignar = { pedidos: [], total: 0, entregados: 0, montoPagado: 0 };

    pedidos.forEach(pedido => {
      if (pedido.repartidorId) {
        if (!porRepartidor[pedido.repartidorId]) {
          porRepartidor[pedido.repartidorId] = {
            repartidor: pedido.repartidor,
            pedidos: [],
            total: 0,
            entregados: 0,
            montoTotal: 0,
            montoEntregado: 0,
            montoPagado: 0,
            abonosDelDia: 0
          };
        }
        porRepartidor[pedido.repartidorId].pedidos.push(pedido);
        porRepartidor[pedido.repartidorId].total++;
        porRepartidor[pedido.repartidorId].montoTotal += parseFloat(pedido.total || 0);
        if (pedido.estado === 'entregado') {
          porRepartidor[pedido.repartidorId].entregados++;
          porRepartidor[pedido.repartidorId].montoEntregado += parseFloat(pedido.total || 0);
          porRepartidor[pedido.repartidorId].montoPagado += parseFloat(pedido.montoPagado || 0);
        }
      } else {
        sinAsignar.pedidos.push(pedido);
        sinAsignar.total++;
        if (pedido.estado === 'entregado') {
          sinAsignar.entregados++;
          sinAsignar.montoPagado += parseFloat(pedido.montoPagado || 0);
        }
      }
    });

    // Agregar abonos del día por repartidor (abonos a pedidos anteriores)
    abonosDelDia.forEach(abono => {
      const repartidorId = abono.pedido?.repartidorId;
      if (repartidorId && porRepartidor[repartidorId]) {
        porRepartidor[repartidorId].abonosDelDia += parseFloat(abono.monto || 0);
      }
    });

    // Obtener cortes existentes
    const cortes = await CortePedidos.findAll({
      where: { fecha: fechaConsulta },
      include: [{ model: Usuario, as: 'repartidor', attributes: ['id', 'nombre'] }]
    });

    // Calcular totales de efectivo
    const montoPagadoTotal = pedidos
      .filter(p => p.estado === 'entregado')
      .reduce((sum, p) => sum + parseFloat(p.montoPagado || 0), 0);
    const totalAbonosDelDia = abonosDelDia.reduce((sum, a) => sum + parseFloat(a.monto || 0), 0);

    const resumen = {
      fecha: fechaConsulta,
      totalPedidos: pedidos.length,
      pedidosPendientes: pedidos.filter(p => p.estado === 'pendiente').length,
      pedidosPreparados: pedidos.filter(p => p.estado === 'preparado').length,
      pedidosEnCamino: pedidos.filter(p => p.estado === 'en_camino').length,
      pedidosEntregados: pedidos.filter(p => p.estado === 'entregado').length,
      pedidosCancelados: pedidos.filter(p => p.estado === 'cancelado').length,
      montoTotal: pedidos.reduce((sum, p) => sum + parseFloat(p.total || 0), 0),
      montoEntregado: pedidos.filter(p => p.estado === 'entregado').reduce((sum, p) => sum + parseFloat(p.total || 0), 0),
      montoPagado: montoPagadoTotal,
      abonosDelDia: totalAbonosDelDia,
      efectivoTotal: montoPagadoTotal + totalAbonosDelDia,
      saldoPendiente: pedidos.filter(p => p.estado === 'entregado').reduce((sum, p) => sum + parseFloat(p.saldoPendiente || 0), 0),
      porRepartidor: Object.values(porRepartidor).map(r => ({
        ...r,
        efectivoTotal: r.montoPagado + r.abonosDelDia
      })),
      sinAsignar,
      abonosDetalle: abonosDelDia.map(a => ({
        id: a.id,
        monto: a.monto,
        tipo: a.tipo,
        notas: a.notas,
        pedidoId: a.pedidoId,
        registradoPor: a.registradoPor?.nombre,
        createdAt: a.createdAt
      })),
      cortes
    };

    res.json(resumen);
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener corte por repartidor
 */
export const getCortePorRepartidor = async (req, res, next) => {
  try {
    const { fecha, repartidorId } = req.query;
    const fechaConsulta = fecha || new Date().toISOString().split('T')[0];

    // Repartidores solo pueden ver su propio corte
    const repartidorConsulta = req.user.rol === 'repartidor' ? req.user.id : repartidorId;

    if (!repartidorConsulta) {
      return res.status(400).json({ error: 'Se requiere repartidorId' });
    }

    // Obtener pedidos del repartidor en esa fecha
    const pedidos = await Pedido.findAll({
      where: {
        fecha: fechaConsulta,
        repartidorId: repartidorConsulta
      },
      include: [
        { model: Cliente, as: 'cliente' },
        { model: DetallePedido, as: 'detalles', include: [{ model: Producto, as: 'producto' }] }
      ],
      order: [['createdAt', 'ASC']]
    });

    // Buscar o crear corte
    let corte = await CortePedidos.findOne({
      where: { fecha: fechaConsulta, repartidorId: repartidorConsulta },
      include: [{ model: Usuario, as: 'repartidor', attributes: ['id', 'nombre'] }]
    });

    // Obtener abonos del día para este repartidor
    const fechaInicio = new Date(fechaConsulta);
    fechaInicio.setHours(0, 0, 0, 0);
    const fechaFin = new Date(fechaConsulta);
    fechaFin.setHours(23, 59, 59, 999);

    const abonosDelDia = await Abono.findAll({
      where: {
        createdAt: { [Op.between]: [fechaInicio, fechaFin] }
      },
      include: [
        {
          model: Pedido,
          as: 'pedido',
          where: { repartidorId: repartidorConsulta },
          attributes: ['id', 'clienteId', 'fecha']
        },
        { model: Usuario, as: 'registradoPor', attributes: ['id', 'nombre'] }
      ]
    });

    const totalPedidos = pedidos.filter(p => p.estado !== 'cancelado').length;
    const totalMonto = pedidos
      .filter(p => p.estado === 'entregado')
      .reduce((sum, p) => sum + parseFloat(p.total || 0), 0);
    const montoPagado = pedidos
      .filter(p => p.estado === 'entregado')
      .reduce((sum, p) => sum + parseFloat(p.montoPagado || 0), 0);
    const totalAbonos = abonosDelDia.reduce((sum, a) => sum + parseFloat(a.monto || 0), 0);

    res.json({
      corte,
      pedidos,
      resumen: {
        totalPedidos,
        pedidosPendientes: pedidos.filter(p => p.estado === 'pendiente').length,
        pedidosPreparados: pedidos.filter(p => p.estado === 'preparado').length,
        pedidosEnCamino: pedidos.filter(p => p.estado === 'en_camino').length,
        pedidosEntregados: pedidos.filter(p => p.estado === 'entregado').length,
        pedidosCancelados: pedidos.filter(p => p.estado === 'cancelado').length,
        totalMonto,
        montoPagado,
        abonosDelDia: totalAbonos,
        efectivoTotal: montoPagado + totalAbonos,
        saldoPendiente: pedidos.filter(p => p.estado === 'entregado').reduce((sum, p) => sum + parseFloat(p.saldoPendiente || 0), 0)
      },
      abonos: abonosDelDia.map(a => ({
        id: a.id,
        monto: a.monto,
        tipo: a.tipo,
        notas: a.notas,
        pedidoId: a.pedidoId,
        registradoPor: a.registradoPor?.nombre,
        createdAt: a.createdAt
      }))
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Finalizar corte de repartidor
 */
export const finalizarCorte = async (req, res, next) => {
  try {
    const { fecha, repartidorId } = req.body;
    const fechaConsulta = fecha || new Date().toISOString().split('T')[0];

    // Repartidores solo pueden finalizar su propio corte
    const repartidorConsulta = req.user.rol === 'repartidor' ? req.user.id : repartidorId;

    if (!repartidorConsulta) {
      return res.status(400).json({ error: 'Se requiere repartidorId' });
    }

    // Verificar que no hay pedidos pendientes
    const pendientes = await Pedido.count({
      where: {
        fecha: fechaConsulta,
        repartidorId: repartidorConsulta,
        estado: 'pendiente'
      }
    });

    if (pendientes > 0) {
      return res.status(400).json({ error: `Hay ${pendientes} pedidos pendientes. Entrega o cancela todos antes de cerrar.` });
    }

    // Calcular totales
    const pedidos = await Pedido.findAll({
      where: {
        fecha: fechaConsulta,
        repartidorId: repartidorConsulta,
        estado: 'entregado'
      }
    });

    // Obtener abonos del día
    const fechaInicio = new Date(fechaConsulta);
    fechaInicio.setHours(0, 0, 0, 0);
    const fechaFin = new Date(fechaConsulta);
    fechaFin.setHours(23, 59, 59, 999);

    const abonosDelDia = await Abono.findAll({
      where: {
        createdAt: { [Op.between]: [fechaInicio, fechaFin] }
      },
      include: [{
        model: Pedido,
        as: 'pedido',
        where: { repartidorId: repartidorConsulta },
        attributes: ['id']
      }]
    });

    const totalPedidos = pedidos.length;
    const totalMonto = pedidos.reduce((sum, p) => sum + parseFloat(p.total || 0), 0);
    const montoPagado = pedidos.reduce((sum, p) => sum + parseFloat(p.montoPagado || 0), 0);
    const totalAbonos = abonosDelDia.reduce((sum, a) => sum + parseFloat(a.monto || 0), 0);
    const efectivoTotal = montoPagado + totalAbonos;

    // Buscar o crear corte
    let [corte, created] = await CortePedidos.findOrCreate({
      where: { fecha: fechaConsulta, repartidorId: repartidorConsulta },
      defaults: {
        totalPedidos,
        totalMonto,
        estado: 'completado'
      }
    });

    if (!created) {
      await corte.update({
        totalPedidos,
        totalMonto,
        estado: 'completado'
      });
    }

    res.json({
      message: 'Corte finalizado correctamente',
      corte,
      resumen: {
        totalPedidos,
        totalMonto,
        montoPagado,
        abonosDelDia: totalAbonos,
        efectivoTotal,
        saldoPendiente: totalMonto - montoPagado
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener analytics de tiempos del día
 */
export const getAnalyticsTiempos = async (req, res, next) => {
  try {
    const { fecha } = req.query;
    const fechaConsulta = fecha || new Date().toISOString().split('T')[0];

    // Top 10 pedidos que más tardaron en despacharse
    const masDemoraDespacho = await Pedido.findAll({
      where: {
        fecha: fechaConsulta,
        demoraPreparacionSeg: { [Op.not]: null }
      },
      include: [
        { model: Cliente, as: 'cliente', attributes: ['id', 'nombre'] },
        { model: Usuario, as: 'repartidor', attributes: ['id', 'nombre'] }
      ],
      order: [['demoraPreparacionSeg', 'DESC']],
      limit: 10
    });

    // Top 10 pedidos que menos tardaron en despacharse
    const menosDemoraDespacho = await Pedido.findAll({
      where: {
        fecha: fechaConsulta,
        demoraPreparacionSeg: { [Op.not]: null }
      },
      include: [
        { model: Cliente, as: 'cliente', attributes: ['id', 'nombre'] },
        { model: Usuario, as: 'repartidor', attributes: ['id', 'nombre'] }
      ],
      order: [['demoraPreparacionSeg', 'ASC']],
      limit: 10
    });

    // Top 10 pedidos que más tardaron en entregarse
    const masDemoraEntrega = await Pedido.findAll({
      where: {
        fecha: fechaConsulta,
        demoraEntregaSeg: { [Op.not]: null }
      },
      include: [
        { model: Cliente, as: 'cliente', attributes: ['id', 'nombre'] },
        { model: Usuario, as: 'repartidor', attributes: ['id', 'nombre'] }
      ],
      order: [['demoraEntregaSeg', 'DESC']],
      limit: 10
    });

    // Top 10 pedidos que menos tardaron en entregarse
    const menosDemoraEntrega = await Pedido.findAll({
      where: {
        fecha: fechaConsulta,
        demoraEntregaSeg: { [Op.not]: null }
      },
      include: [
        { model: Cliente, as: 'cliente', attributes: ['id', 'nombre'] },
        { model: Usuario, as: 'repartidor', attributes: ['id', 'nombre'] }
      ],
      order: [['demoraEntregaSeg', 'ASC']],
      limit: 10
    });

    // Top 10 clientes que más deben
    const topDeudores = await Pedido.findAll({
      where: {
        estado: 'entregado',
        saldoPendiente: { [Op.gt]: 0 }
      },
      attributes: [
        'clienteId',
        [sequelize.fn('SUM', sequelize.col('saldo_pendiente')), 'totalDeuda']
      ],
      include: [
        { model: Cliente, as: 'cliente', attributes: ['id', 'nombre', 'telefono'] }
      ],
      group: ['clienteId', 'cliente.id', 'cliente.nombre', 'cliente.telefono'],
      order: [[sequelize.literal('totalDeuda'), 'DESC']],
      limit: 10
    });

    // Calcular promedios del día
    const promedios = await Pedido.findOne({
      where: {
        fecha: fechaConsulta,
        estado: 'entregado'
      },
      attributes: [
        [sequelize.fn('AVG', sequelize.col('demora_preparacion_seg')), 'promedioPreparacion'],
        [sequelize.fn('AVG', sequelize.col('demora_entrega_seg')), 'promedioEntrega'],
        [sequelize.fn('AVG', sequelize.col('demora_total_seg')), 'promedioTotal'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalEntregados']
      ],
      raw: true
    });

    const formatPedido = (p) => ({
      id: p.id,
      cliente: p.cliente?.nombre || 'Sin cliente',
      repartidor: p.repartidor?.nombre || 'Sin repartidor',
      demoraPreparacionMin: p.demoraPreparacionSeg ? Math.round(p.demoraPreparacionSeg / 60) : null,
      demoraEntregaMin: p.demoraEntregaSeg ? Math.round(p.demoraEntregaSeg / 60) : null,
      demoraTotalMin: p.demoraTotalSeg ? Math.round(p.demoraTotalSeg / 60) : null
    });

    res.json({
      fecha: fechaConsulta,
      promedios: {
        preparacionMinutos: promedios?.promedioPreparacion ? Math.round(promedios.promedioPreparacion / 60) : 0,
        entregaMinutos: promedios?.promedioEntrega ? Math.round(promedios.promedioEntrega / 60) : 0,
        totalMinutos: promedios?.promedioTotal ? Math.round(promedios.promedioTotal / 60) : 0,
        totalEntregados: parseInt(promedios?.totalEntregados) || 0
      },
      rankings: {
        masDemoraDespacho: masDemoraDespacho.map(formatPedido),
        menosDemoraDespacho: menosDemoraDespacho.map(formatPedido),
        masDemoraEntrega: masDemoraEntrega.map(formatPedido),
        menosDemoraEntrega: menosDemoraEntrega.map(formatPedido)
      },
      topDeudores: topDeudores.map(d => ({
        clienteId: d.clienteId,
        nombre: d.cliente?.nombre || 'Sin nombre',
        telefono: d.cliente?.telefono,
        totalDeuda: parseFloat(d.dataValues.totalDeuda)
      }))
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener historial de cortes
 */
export const getHistorial = async (req, res, next) => {
  try {
    const { mes, anio, repartidorId } = req.query;
    const where = {};

    if (mes && anio) {
      const inicioMes = new Date(anio, mes - 1, 1);
      const finMes = new Date(anio, mes, 0);
      where.fecha = {
        [Op.between]: [inicioMes.toISOString().split('T')[0], finMes.toISOString().split('T')[0]]
      };
    }

    if (repartidorId) {
      where.repartidorId = repartidorId;
    }

    // Repartidores solo ven su historial
    if (req.user.rol === 'repartidor') {
      where.repartidorId = req.user.id;
    }

    const cortes = await CortePedidos.findAll({
      where,
      include: [{ model: Usuario, as: 'repartidor', attributes: ['id', 'nombre'] }],
      order: [['fecha', 'DESC']]
    });

    res.json(cortes);
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener detalle para cierre de caja
 * Incluye entregas del día y abonos recibidos
 */
export const getDetalleCierre = async (req, res, next) => {
  try {
    const { fecha, repartidorId } = req.params;
    const fechaConsulta = fecha || new Date().toISOString().split('T')[0];

    // Solo admin o admin_repartidor pueden ver cierres de otros
    if (req.user.rol === 'repartidor' && req.user.id !== parseInt(repartidorId)) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const repartidor = await Usuario.findByPk(repartidorId, {
      attributes: ['id', 'nombre']
    });

    if (!repartidor) {
      return res.status(404).json({ error: 'Repartidor no encontrado' });
    }

    // Rango de fecha para el día
    const fechaInicio = new Date(fechaConsulta);
    fechaInicio.setHours(0, 0, 0, 0);
    const fechaFin = new Date(fechaConsulta);
    fechaFin.setHours(23, 59, 59, 999);

    // 1. Obtener pedidos entregados del día con cobro
    const pedidosEntregados = await Pedido.findAll({
      where: {
        fecha: fechaConsulta,
        repartidorId,
        estado: 'entregado',
        montoPagado: { [Op.gt]: 0 }
      },
      include: [
        { model: Cliente, as: 'cliente', attributes: ['id', 'nombre'] }
      ],
      order: [['createdAt', 'ASC']]
    });

    // 2. Obtener abonos registrados ese día para pedidos de este repartidor
    const abonosDelDia = await Abono.findAll({
      where: {
        createdAt: { [Op.between]: [fechaInicio, fechaFin] }
      },
      include: [
        {
          model: Pedido,
          as: 'pedido',
          where: { repartidorId },
          include: [{ model: Cliente, as: 'cliente', attributes: ['id', 'nombre'] }]
        }
      ],
      order: [['createdAt', 'ASC']]
    });

    // 3. Verificar si ya existe un cierre previo
    const cortePrevio = await CortePedidos.findOne({
      where: { fecha: fechaConsulta, repartidorId },
      include: [
        { model: DetalleCierre, as: 'detallesCierre' },
        { model: Usuario, as: 'cerradoPor', attributes: ['id', 'nombre'] }
      ]
    });

    // Mapear detalles previos para marcar estados guardados
    const detallesPrevios = {};
    if (cortePrevio?.detallesCierre) {
      cortePrevio.detallesCierre.forEach(d => {
        const key = d.tipo === 'entrega' ? `entrega-${d.pedidoId}` : `abono-${d.abonoId}`;
        detallesPrevios[key] = d;
      });
    }

    // 4. Construir lista de cobros
    const cobros = [];

    // Agregar entregas
    pedidosEntregados.forEach(pedido => {
      const key = `entrega-${pedido.id}`;
      const detallePrevio = detallesPrevios[key];

      cobros.push({
        tipo: 'entrega',
        id: pedido.id,
        pedidoId: pedido.id,
        cliente: pedido.cliente?.nombre || 'Sin cliente',
        clienteId: pedido.clienteId,
        monto: parseFloat(pedido.montoPagado),
        metodoPago: 'efectivo', // Por default en entregas
        recibido: detallePrevio ? detallePrevio.recibido : true,
        notas: detallePrevio?.notas || null,
        hora: pedido.updatedAt
      });
    });

    // Agregar abonos
    abonosDelDia.forEach(abono => {
      const key = `abono-${abono.id}`;
      const detallePrevio = detallesPrevios[key];

      cobros.push({
        tipo: 'abono',
        id: abono.id,
        abonoId: abono.id,
        pedidoId: abono.pedidoId,
        cliente: abono.pedido?.cliente?.nombre || 'Sin cliente',
        clienteId: abono.pedido?.clienteId,
        monto: parseFloat(abono.monto),
        metodoPago: abono.tipo,
        recibido: detallePrevio ? detallePrevio.recibido : true,
        notas: detallePrevio?.notas || abono.notas,
        hora: abono.createdAt
      });
    });

    // 5. Calcular totales
    const totalEsperado = cobros.reduce((sum, c) => sum + c.monto, 0);
    const totalRecibido = cobros.filter(c => c.recibido).reduce((sum, c) => sum + c.monto, 0);

    res.json({
      fecha: fechaConsulta,
      repartidor: {
        id: repartidor.id,
        nombre: repartidor.nombre
      },
      cobros,
      totales: {
        esperado: totalEsperado,
        recibido: totalRecibido,
        diferencia: totalRecibido - totalEsperado
      },
      cortePrevio: cortePrevio ? {
        id: cortePrevio.id,
        estado: cortePrevio.estado,
        cerradoPor: cortePrevio.cerradoPor?.nombre,
        cerradoAt: cortePrevio.cerradoAt,
        efectivoEsperado: parseFloat(cortePrevio.efectivoEsperado || 0),
        efectivoRecibido: parseFloat(cortePrevio.efectivoRecibido || 0),
        diferencia: parseFloat(cortePrevio.diferencia || 0),
        notasCierre: cortePrevio.notasCierre
      } : null
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Confirmar cierre de caja
 * Registra qué pagos se recibieron y cuáles no
 */
export const confirmarCierreCaja = async (req, res, next) => {
  const t = await sequelize.transaction();

  try {
    const { fecha, repartidorId } = req.params;
    const { detalles, notasGenerales } = req.body;

    // Solo admin o admin_repartidor pueden confirmar cierres
    if (!['admin', 'administrador_repartidor'].includes(req.user.rol)) {
      await t.rollback();
      return res.status(403).json({ error: 'Solo administradores pueden confirmar cierres' });
    }

    const fechaConsulta = fecha || new Date().toISOString().split('T')[0];

    // Buscar o crear corte
    let [corte, created] = await CortePedidos.findOrCreate({
      where: { fecha: fechaConsulta, repartidorId },
      defaults: {
        totalPedidos: 0,
        totalMonto: 0,
        estado: 'borrador'
      },
      transaction: t
    });

    // Eliminar detalles previos si existen
    await DetalleCierre.destroy({
      where: { cortePedidoId: corte.id },
      transaction: t
    });

    // Calcular totales y guardar detalles
    let efectivoEsperado = 0;
    let efectivoRecibido = 0;

    for (const detalle of detalles) {
      efectivoEsperado += parseFloat(detalle.monto);
      if (detalle.recibido) {
        efectivoRecibido += parseFloat(detalle.monto);
      }

      await DetalleCierre.create({
        cortePedidoId: corte.id,
        tipo: detalle.tipo,
        pedidoId: detalle.tipo === 'entrega' ? detalle.id : detalle.pedidoId,
        abonoId: detalle.tipo === 'abono' ? detalle.id : null,
        monto: detalle.monto,
        recibido: detalle.recibido,
        notas: detalle.notas || null
      }, { transaction: t });
    }

    const diferencia = efectivoRecibido - efectivoEsperado;

    // Contar pedidos entregados
    const totalPedidos = await Pedido.count({
      where: {
        fecha: fechaConsulta,
        repartidorId,
        estado: 'entregado'
      },
      transaction: t
    });

    // Sumar monto de pedidos entregados
    const totalMonto = await Pedido.sum('total', {
      where: {
        fecha: fechaConsulta,
        repartidorId,
        estado: 'entregado'
      },
      transaction: t
    }) || 0;

    // Actualizar corte
    await corte.update({
      totalPedidos,
      totalMonto,
      efectivoEsperado,
      efectivoRecibido,
      diferencia,
      cerradoPorId: req.user.id,
      cerradoAt: new Date(),
      notasCierre: notasGenerales || null,
      estado: 'completado'
    }, { transaction: t });

    await t.commit();

    // Recargar con asociaciones
    corte = await CortePedidos.findByPk(corte.id, {
      include: [
        { model: Usuario, as: 'repartidor', attributes: ['id', 'nombre'] },
        { model: Usuario, as: 'cerradoPor', attributes: ['id', 'nombre'] },
        { model: DetalleCierre, as: 'detallesCierre' }
      ]
    });

    res.json({
      message: 'Cierre de caja confirmado',
      corte: {
        id: corte.id,
        fecha: corte.fecha,
        repartidor: corte.repartidor?.nombre,
        totalPedidos: corte.totalPedidos,
        totalMonto: parseFloat(corte.totalMonto),
        efectivoEsperado: parseFloat(corte.efectivoEsperado),
        efectivoRecibido: parseFloat(corte.efectivoRecibido),
        diferencia: parseFloat(corte.diferencia),
        cerradoPor: corte.cerradoPor?.nombre,
        cerradoAt: corte.cerradoAt,
        notasCierre: corte.notasCierre,
        detallesNoRecibidos: corte.detallesCierre.filter(d => !d.recibido).length
      }
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

/**
 * Obtener datos para imprimir ticket de cierre
 */
export const getTicketData = async (req, res, next) => {
  try {
    const { fecha, repartidorId } = req.params;
    const fechaConsulta = fecha || new Date().toISOString().split('T')[0];

    const corte = await CortePedidos.findOne({
      where: { fecha: fechaConsulta, repartidorId },
      include: [
        { model: Usuario, as: 'repartidor', attributes: ['id', 'nombre'] },
        { model: Usuario, as: 'cerradoPor', attributes: ['id', 'nombre'] },
        {
          model: DetalleCierre,
          as: 'detallesCierre',
          include: [
            {
              model: Pedido,
              as: 'pedido',
              include: [{ model: Cliente, as: 'cliente', attributes: ['nombre'] }]
            },
            {
              model: Abono,
              as: 'abono',
              include: [{
                model: Pedido,
                as: 'pedido',
                include: [{ model: Cliente, as: 'cliente', attributes: ['nombre'] }]
              }]
            }
          ]
        }
      ]
    });

    if (!corte) {
      return res.status(404).json({ error: 'Cierre no encontrado' });
    }

    // Separar entregas y abonos
    const entregas = corte.detallesCierre
      .filter(d => d.tipo === 'entrega')
      .map(d => ({
        cliente: d.pedido?.cliente?.nombre || 'Sin cliente',
        monto: parseFloat(d.monto),
        recibido: d.recibido
      }));

    const abonos = corte.detallesCierre
      .filter(d => d.tipo === 'abono')
      .map(d => ({
        cliente: d.abono?.pedido?.cliente?.nombre || 'Sin cliente',
        pedidoId: d.pedidoId,
        monto: parseFloat(d.monto),
        tipo: d.abono?.tipo || 'efectivo',
        recibido: d.recibido
      }));

    // Formatear fecha para ticket
    const fechaObj = new Date(fechaConsulta + 'T12:00:00');
    const fechaFormateada = fechaObj.toLocaleDateString('es-MX', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    const horaFormateada = corte.cerradoAt
      ? new Date(corte.cerradoAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
      : '';

    res.json({
      empresa: 'LA HACIENDA TORTILLAS',
      titulo: 'CIERRE DE CAJA',
      fecha: fechaFormateada,
      repartidor: corte.repartidor?.nombre || 'Sin asignar',
      entregas,
      abonos,
      totales: {
        esperado: parseFloat(corte.efectivoEsperado || 0),
        recibido: parseFloat(corte.efectivoRecibido || 0),
        diferencia: parseFloat(corte.diferencia || 0)
      },
      recibidoPor: corte.cerradoPor?.nombre || '',
      hora: horaFormateada,
      notas: corte.notasCierre,
      itemsNoRecibidos: corte.detallesCierre.filter(d => !d.recibido).length
    });
  } catch (error) {
    next(error);
  }
};
