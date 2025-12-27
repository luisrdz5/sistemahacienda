import { Op } from 'sequelize';
import { CortePedidos, Pedido, Usuario, Cliente, DetallePedido, Producto, sequelize } from '../models/index.js';

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

    // Agrupar por repartidor
    const porRepartidor = {};
    const sinAsignar = { pedidos: [], total: 0, entregados: 0 };

    pedidos.forEach(pedido => {
      if (pedido.repartidorId) {
        if (!porRepartidor[pedido.repartidorId]) {
          porRepartidor[pedido.repartidorId] = {
            repartidor: pedido.repartidor,
            pedidos: [],
            total: 0,
            entregados: 0,
            montoTotal: 0,
            montoEntregado: 0
          };
        }
        porRepartidor[pedido.repartidorId].pedidos.push(pedido);
        porRepartidor[pedido.repartidorId].total++;
        porRepartidor[pedido.repartidorId].montoTotal += parseFloat(pedido.total || 0);
        if (pedido.estado === 'entregado') {
          porRepartidor[pedido.repartidorId].entregados++;
          porRepartidor[pedido.repartidorId].montoEntregado += parseFloat(pedido.total || 0);
        }
      } else {
        sinAsignar.pedidos.push(pedido);
        sinAsignar.total++;
        if (pedido.estado === 'entregado') {
          sinAsignar.entregados++;
        }
      }
    });

    // Obtener cortes existentes
    const cortes = await CortePedidos.findAll({
      where: { fecha: fechaConsulta },
      include: [{ model: Usuario, as: 'repartidor', attributes: ['id', 'nombre'] }]
    });

    const resumen = {
      fecha: fechaConsulta,
      totalPedidos: pedidos.length,
      pedidosPendientes: pedidos.filter(p => p.estado === 'pendiente').length,
      pedidosEntregados: pedidos.filter(p => p.estado === 'entregado').length,
      pedidosCancelados: pedidos.filter(p => p.estado === 'cancelado').length,
      montoTotal: pedidos.reduce((sum, p) => sum + parseFloat(p.total || 0), 0),
      montoEntregado: pedidos.filter(p => p.estado === 'entregado').reduce((sum, p) => sum + parseFloat(p.total || 0), 0),
      porRepartidor: Object.values(porRepartidor),
      sinAsignar,
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

    const totalPedidos = pedidos.filter(p => p.estado !== 'cancelado').length;
    const totalMonto = pedidos
      .filter(p => p.estado === 'entregado')
      .reduce((sum, p) => sum + parseFloat(p.total || 0), 0);

    res.json({
      corte,
      pedidos,
      resumen: {
        totalPedidos,
        pedidosPendientes: pedidos.filter(p => p.estado === 'pendiente').length,
        pedidosEntregados: pedidos.filter(p => p.estado === 'entregado').length,
        pedidosCancelados: pedidos.filter(p => p.estado === 'cancelado').length,
        totalMonto
      }
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

    const totalPedidos = pedidos.length;
    const totalMonto = pedidos.reduce((sum, p) => sum + parseFloat(p.total || 0), 0);

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

    res.json({ message: 'Corte finalizado correctamente', corte });
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
