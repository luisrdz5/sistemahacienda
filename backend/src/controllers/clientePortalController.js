import { Op } from 'sequelize';
import { Pedido, DetallePedido, Cliente, Producto, PrecioCliente, Abono, Sucursal, sequelize } from '../models/index.js';

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
 * Calcular adeudo total de un cliente
 */
const calcularAdeudo = async (clienteId) => {
  const result = await Pedido.sum('saldoPendiente', {
    where: {
      clienteId,
      estado: 'entregado',
      saldoPendiente: { [Op.gt]: 0 }
    }
  });
  return parseFloat(result) || 0;
};

/**
 * Dashboard del cliente
 * GET /api/cliente/dashboard
 */
export const getDashboard = async (req, res, next) => {
  try {
    const clienteId = req.cliente.id;

    // Obtener cliente con sucursales
    const clienteConSucursales = await Cliente.findByPk(clienteId, {
      include: [
        { model: Sucursal, as: 'sucursal', attributes: ['id', 'nombre'] },
        { model: Sucursal, as: 'sucursalBackup', attributes: ['id', 'nombre'] }
      ]
    });

    // Obtener adeudo total
    const adeudoTotal = await calcularAdeudo(clienteId);
    const limiteCredito = parseFloat(req.cliente.limiteCredito);
    const creditoDisponible = Math.max(0, limiteCredito - adeudoTotal);

    // Últimos 5 pedidos
    const ultimosPedidos = await Pedido.findAll({
      where: { clienteId },
      include: [
        {
          model: DetallePedido,
          as: 'detalles',
          include: [{ model: Producto, as: 'producto', attributes: ['id', 'nombre'] }]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    // Pedidos con adeudo
    const pedidosConAdeudo = await Pedido.findAll({
      where: {
        clienteId,
        estado: 'entregado',
        saldoPendiente: { [Op.gt]: 0 }
      },
      order: [['fecha', 'DESC']]
    });

    // Estadísticas de este mes
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const inicioMesStr = inicioMes.toISOString().split('T')[0];
    const hoyStr = hoy.toISOString().split('T')[0];

    const pedidosMes = await Pedido.count({
      where: {
        clienteId,
        fecha: { [Op.between]: [inicioMesStr, hoyStr] }
      }
    });

    const totalGastadoMes = await Pedido.sum('total', {
      where: {
        clienteId,
        estado: 'entregado',
        fecha: { [Op.between]: [inicioMesStr, hoyStr] }
      }
    });

    res.json({
      cliente: {
        id: req.cliente.id,
        nombre: req.cliente.nombre,
        email: req.cliente.email,
        telefono: req.cliente.telefono,
        direccion: req.cliente.direccion,
        sucursal: clienteConSucursales?.sucursal ? {
          id: clienteConSucursales.sucursal.id,
          nombre: clienteConSucursales.sucursal.nombre
        } : null,
        sucursalBackup: clienteConSucursales?.sucursalBackup ? {
          id: clienteConSucursales.sucursalBackup.id,
          nombre: clienteConSucursales.sucursalBackup.nombre
        } : null
      },
      credito: {
        limite: limiteCredito,
        adeudo: adeudoTotal,
        disponible: creditoDisponible,
        porcentajeUsado: limiteCredito > 0 ? (adeudoTotal / limiteCredito) * 100 : 0
      },
      estadisticas: {
        pedidosEsteMes: pedidosMes || 0,
        totalGastadoMes: parseFloat(totalGastadoMes) || 0,
        pedidosConAdeudo: pedidosConAdeudo.length
      },
      ultimosPedidos: ultimosPedidos.map(p => ({
        id: p.id,
        fecha: p.fecha,
        estado: p.estado,
        total: parseFloat(p.total),
        saldoPendiente: parseFloat(p.saldoPendiente),
        detalles: p.detalles?.map(d => ({
          cantidad: d.cantidad,
          producto: d.producto?.nombre
        }))
      })),
      pedidosConAdeudo: pedidosConAdeudo.map(p => ({
        id: p.id,
        fecha: p.fecha,
        total: parseFloat(p.total),
        saldoPendiente: parseFloat(p.saldoPendiente)
      }))
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Historial de pedidos del cliente
 * GET /api/cliente/pedidos
 */
export const getPedidos = async (req, res, next) => {
  try {
    const clienteId = req.cliente.id;
    const { estado, fechaInicio, fechaFin, page = 1, limit = 20 } = req.query;

    const where = { clienteId };

    if (estado) {
      where.estado = estado;
    }

    if (fechaInicio || fechaFin) {
      where.fecha = {};
      if (fechaInicio) where.fecha[Op.gte] = fechaInicio;
      if (fechaFin) where.fecha[Op.lte] = fechaFin;
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: pedidos } = await Pedido.findAndCountAll({
      where,
      include: [
        {
          model: DetallePedido,
          as: 'detalles',
          include: [{ model: Producto, as: 'producto', attributes: ['id', 'nombre', 'imagenUrl'] }]
        },
        {
          model: Abono,
          as: 'abonos',
          attributes: ['id', 'monto', 'tipo', 'createdAt']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      pedidos: pedidos.map(p => ({
        id: p.id,
        fecha: p.fecha,
        estado: p.estado,
        total: parseFloat(p.total),
        montoPagado: parseFloat(p.montoPagado),
        saldoPendiente: parseFloat(p.saldoPendiente),
        notas: p.notas,
        observaciones: p.observaciones,
        detalles: p.detalles?.map(d => ({
          id: d.id,
          cantidad: d.cantidad,
          precioUnitario: parseFloat(d.precioUnitario),
          subtotal: parseFloat(d.subtotal),
          producto: {
            id: d.producto?.id,
            nombre: d.producto?.nombre,
            imagen: d.producto?.imagenUrl
          }
        })),
        abonos: p.abonos?.map(a => ({
          id: a.id,
          monto: parseFloat(a.monto),
          tipo: a.tipo,
          fecha: a.createdAt
        }))
      })),
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Detalle de adeudo del cliente
 * GET /api/cliente/adeudo
 */
export const getAdeudo = async (req, res, next) => {
  try {
    const clienteId = req.cliente.id;

    const pedidosConAdeudo = await Pedido.findAll({
      where: {
        clienteId,
        estado: 'entregado',
        saldoPendiente: { [Op.gt]: 0 }
      },
      include: [
        {
          model: DetallePedido,
          as: 'detalles',
          include: [{ model: Producto, as: 'producto', attributes: ['id', 'nombre'] }]
        },
        {
          model: Abono,
          as: 'abonos',
          attributes: ['id', 'monto', 'tipo', 'createdAt']
        }
      ],
      order: [['fecha', 'ASC']]
    });

    const totalAdeudo = pedidosConAdeudo.reduce(
      (sum, p) => sum + parseFloat(p.saldoPendiente),
      0
    );

    res.json({
      totalAdeudo,
      limiteCredito: parseFloat(req.cliente.limiteCredito),
      creditoDisponible: Math.max(0, parseFloat(req.cliente.limiteCredito) - totalAdeudo),
      pedidos: pedidosConAdeudo.map(p => ({
        id: p.id,
        fecha: p.fecha,
        total: parseFloat(p.total),
        montoPagado: parseFloat(p.montoPagado),
        saldoPendiente: parseFloat(p.saldoPendiente),
        detalles: p.detalles?.map(d => ({
          cantidad: d.cantidad,
          producto: d.producto?.nombre
        })),
        abonos: p.abonos?.map(a => ({
          monto: parseFloat(a.monto),
          tipo: a.tipo,
          fecha: a.createdAt
        }))
      }))
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Crear nuevo pedido desde portal cliente
 * POST /api/cliente/pedidos
 */
export const crearPedido = async (req, res, next) => {
  const t = await sequelize.transaction();

  try {
    const clienteId = req.cliente.id;
    const { notas, detalles } = req.body;

    if (!detalles || detalles.length === 0) {
      return res.status(400).json({ error: 'Debe agregar al menos un producto' });
    }

    // Calcular total del nuevo pedido
    let totalNuevoPedido = 0;
    for (const detalle of detalles) {
      const precio = await obtenerPrecioProducto(clienteId, detalle.productoId);
      if (!precio) {
        await t.rollback();
        return res.status(400).json({ error: `Producto ${detalle.productoId} no encontrado` });
      }
      totalNuevoPedido += precio * parseFloat(detalle.cantidad);
    }

    // Verificar límite de crédito
    const adeudoActual = await calcularAdeudo(clienteId);
    const limiteCredito = parseFloat(req.cliente.limiteCredito);
    const nuevoAdeudo = adeudoActual + totalNuevoPedido;

    if (nuevoAdeudo > limiteCredito) {
      await t.rollback();
      return res.status(400).json({
        error: 'Límite de crédito excedido',
        detalle: {
          adeudoActual,
          totalPedido: totalNuevoPedido,
          nuevoAdeudo,
          limiteCredito,
          excede: nuevoAdeudo - limiteCredito
        }
      });
    }

    // Crear pedido (fecha de hoy)
    const hoy = new Date().toISOString().split('T')[0];
    const pedido = await Pedido.create({
      fecha: hoy,
      clienteId,
      creadoPorId: req.user.id, // Usuario tipo cliente
      notas: notas || null,
      total: 0,
      montoPagado: 0,
      saldoPendiente: 0,
      estado: 'pendiente',
      // Asignar sucursales del cliente
      sucursalId: req.cliente.sucursalId,
      sucursalBackupId: req.cliente.sucursalBackupId,
      sucursalActualId: req.cliente.sucursalId
    }, { transaction: t });

    let total = 0;

    // Crear detalles
    for (const detalle of detalles) {
      const precio = await obtenerPrecioProducto(clienteId, detalle.productoId);
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
    await pedido.update({
      total,
      saldoPendiente: total
    }, { transaction: t });

    await t.commit();

    // Recargar con detalles
    const pedidoCompleto = await Pedido.findByPk(pedido.id, {
      include: [
        {
          model: DetallePedido,
          as: 'detalles',
          include: [{ model: Producto, as: 'producto', attributes: ['id', 'nombre', 'imagenUrl'] }]
        }
      ]
    });

    res.status(201).json({
      message: 'Pedido creado exitosamente',
      pedido: {
        id: pedidoCompleto.id,
        fecha: pedidoCompleto.fecha,
        estado: pedidoCompleto.estado,
        total: parseFloat(pedidoCompleto.total),
        detalles: pedidoCompleto.detalles?.map(d => ({
          cantidad: d.cantidad,
          precioUnitario: parseFloat(d.precioUnitario),
          subtotal: parseFloat(d.subtotal),
          producto: {
            id: d.producto?.id,
            nombre: d.producto?.nombre,
            imagen: d.producto?.imagenUrl
          }
        }))
      },
      credito: {
        adeudoAnterior: adeudoActual,
        nuevoAdeudo: adeudoActual + total,
        disponible: limiteCredito - (adeudoActual + total)
      }
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

/**
 * Obtener productos disponibles con precios del cliente
 * GET /api/cliente/productos
 */
export const getProductos = async (req, res, next) => {
  try {
    const clienteId = req.cliente.id;

    const productos = await Producto.findAll({
      where: { activo: true },
      order: [['nombre', 'ASC']]
    });

    // Obtener precios personalizados del cliente
    const preciosCliente = await PrecioCliente.findAll({
      where: { clienteId }
    });

    const preciosMap = {};
    preciosCliente.forEach(pc => {
      preciosMap[pc.productoId] = parseFloat(pc.precio);
    });

    const productosConPrecio = productos.map(p => ({
      id: p.id,
      nombre: p.nombre,
      descripcion: p.descripcion,
      unidad: p.unidad,
      imagen: p.imagenUrl,
      precioLista: parseFloat(p.precioLista),
      precioCliente: preciosMap[p.id] || parseFloat(p.precioLista),
      tienePrecioEspecial: !!preciosMap[p.id]
    }));

    res.json(productosConPrecio);
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener detalle de un pedido específico
 * GET /api/cliente/pedidos/:id
 */
export const getPedidoById = async (req, res, next) => {
  try {
    const clienteId = req.cliente.id;
    const { id } = req.params;

    const pedido = await Pedido.findOne({
      where: { id, clienteId },
      include: [
        {
          model: DetallePedido,
          as: 'detalles',
          include: [{ model: Producto, as: 'producto', attributes: ['id', 'nombre', 'imagenUrl'] }]
        },
        {
          model: Abono,
          as: 'abonos',
          attributes: ['id', 'monto', 'tipo', 'notas', 'createdAt']
        }
      ]
    });

    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    res.json({
      id: pedido.id,
      fecha: pedido.fecha,
      estado: pedido.estado,
      total: parseFloat(pedido.total),
      montoPagado: parseFloat(pedido.montoPagado),
      saldoPendiente: parseFloat(pedido.saldoPendiente),
      notas: pedido.notas,
      observaciones: pedido.observaciones,
      fechaPreparado: pedido.fechaPreparado,
      fechaEntrega: pedido.fechaEntrega,
      detalles: pedido.detalles?.map(d => ({
        id: d.id,
        cantidad: d.cantidad,
        precioUnitario: parseFloat(d.precioUnitario),
        subtotal: parseFloat(d.subtotal),
        producto: {
          id: d.producto?.id,
          nombre: d.producto?.nombre,
          imagen: d.producto?.imagenUrl
        }
      })),
      abonos: pedido.abonos?.map(a => ({
        id: a.id,
        monto: parseFloat(a.monto),
        tipo: a.tipo,
        notas: a.notas,
        fecha: a.createdAt
      }))
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancelar pedido (solo si está pendiente)
 * DELETE /api/cliente/pedidos/:id
 */
export const cancelarPedido = async (req, res, next) => {
  try {
    const clienteId = req.cliente.id;
    const { id } = req.params;

    const pedido = await Pedido.findOne({
      where: { id, clienteId }
    });

    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    if (pedido.estado !== 'pendiente') {
      return res.status(400).json({
        error: 'Solo se pueden cancelar pedidos pendientes'
      });
    }

    await pedido.update({ estado: 'cancelado' });

    res.json({ message: 'Pedido cancelado exitosamente' });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener perfil del cliente
 * GET /api/cliente/perfil
 */
export const getPerfil = async (req, res, next) => {
  try {
    const clienteId = req.cliente.id;

    // Obtener cliente con sucursales
    const cliente = await Cliente.findByPk(clienteId, {
      include: [
        { model: Sucursal, as: 'sucursal', attributes: ['id', 'nombre', 'direccion'] },
        { model: Sucursal, as: 'sucursalBackup', attributes: ['id', 'nombre', 'direccion'] }
      ]
    });

    // Calcular adeudo
    const adeudoTotal = await calcularAdeudo(clienteId);
    const limiteCredito = parseFloat(req.cliente.limiteCredito);
    const creditoDisponible = Math.max(0, limiteCredito - adeudoTotal);

    res.json({
      id: cliente.id,
      nombre: cliente.nombre,
      email: cliente.email,
      telefono: cliente.telefono,
      direccion: cliente.direccion,
      notas: cliente.notas,
      limiteCredito,
      adeudoTotal,
      creditoDisponible,
      sucursal: cliente.sucursal ? {
        id: cliente.sucursal.id,
        nombre: cliente.sucursal.nombre,
        direccion: cliente.sucursal.direccion
      } : null,
      sucursalBackup: cliente.sucursalBackup ? {
        id: cliente.sucursalBackup.id,
        nombre: cliente.sucursalBackup.nombre,
        direccion: cliente.sucursalBackup.direccion
      } : null,
      aprobado: cliente.aprobado,
      createdAt: cliente.createdAt
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualizar perfil del cliente
 * PUT /api/cliente/perfil
 */
export const updatePerfil = async (req, res, next) => {
  try {
    const { telefono, direccion, notas } = req.body;

    await req.cliente.update({
      telefono: telefono !== undefined ? telefono : req.cliente.telefono,
      direccion: direccion !== undefined ? direccion : req.cliente.direccion,
      notas: notas !== undefined ? notas : req.cliente.notas
    });

    res.json({
      message: 'Perfil actualizado',
      cliente: {
        id: req.cliente.id,
        nombre: req.cliente.nombre,
        email: req.cliente.email,
        telefono: req.cliente.telefono,
        direccion: req.cliente.direccion,
        notas: req.cliente.notas
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cambiar contraseña del cliente
 * PUT /api/cliente/perfil/password
 */
export const updatePassword = async (req, res, next) => {
  try {
    const { passwordActual, passwordNuevo } = req.body;

    if (!passwordActual || !passwordNuevo) {
      return res.status(400).json({ error: 'Contraseña actual y nueva son requeridas' });
    }

    if (passwordNuevo.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // Importar Usuario y bcrypt
    const { Usuario } = await import('../models/index.js');
    const bcrypt = await import('bcryptjs');

    // Obtener usuario
    const usuario = await Usuario.findByPk(req.user.id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Verificar contraseña actual
    const passwordValido = await bcrypt.compare(passwordActual, usuario.password);
    if (!passwordValido) {
      return res.status(400).json({ error: 'Contraseña actual incorrecta' });
    }

    // Hashear nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(passwordNuevo, salt);

    // Actualizar
    await usuario.update({ password: passwordHash });

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    next(error);
  }
};
