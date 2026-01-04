import { Op } from 'sequelize';
import { Cliente, PrecioCliente, PrecioSucursal, Producto, Pedido, Sucursal, sequelize } from '../models/index.js';

/**
 * Calcular adeudo de un cliente
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
 * Listar clientes
 */
export const getAll = async (req, res, next) => {
  try {
    const { activo } = req.query;
    const where = {};

    if (activo !== undefined) {
      where.activo = activo === 'true';
    }

    const clientes = await Cliente.findAll({
      where,
      include: [
        {
          model: PrecioCliente,
          as: 'precios',
          include: [{ model: Producto, as: 'producto' }]
        },
        { model: Sucursal, as: 'sucursal', attributes: ['id', 'nombre'] },
        { model: Sucursal, as: 'sucursalBackup', attributes: ['id', 'nombre'] }
      ],
      order: [['nombre', 'ASC']]
    });

    // Agregar adeudo a cada cliente
    const clientesConAdeudo = await Promise.all(clientes.map(async (c) => {
      const adeudoTotal = await calcularAdeudo(c.id);
      return {
        ...c.toJSON(),
        adeudoTotal,
        creditoDisponible: Math.max(0, (c.limiteCredito || 200) - adeudoTotal)
      };
    }));

    res.json(clientesConAdeudo);
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener cliente por ID
 */
export const getById = async (req, res, next) => {
  try {
    const cliente = await Cliente.findByPk(req.params.id, {
      include: [{
        model: PrecioCliente,
        as: 'precios',
        include: [{ model: Producto, as: 'producto' }]
      }]
    });

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    res.json(cliente);
  } catch (error) {
    next(error);
  }
};

/**
 * Crear cliente
 */
export const create = async (req, res, next) => {
  try {
    const { nombre, telefono, direccion, notas, precios, limiteCredito, sucursalId, sucursalBackupId } = req.body;

    if (!nombre) {
      return res.status(400).json({ error: 'Nombre es requerido' });
    }

    const cliente = await Cliente.create({
      nombre,
      telefono,
      direccion,
      notas,
      limiteCredito: limiteCredito || 200,
      sucursalId: sucursalId || null,
      sucursalBackupId: sucursalBackupId || null,
      aprobado: true // Clientes creados desde admin se aprueban automaticamente
    });

    // Crear precios personalizados si se proporcionan
    if (precios && Array.isArray(precios)) {
      for (const precio of precios) {
        if (precio.productoId && precio.precio) {
          await PrecioCliente.create({
            clienteId: cliente.id,
            productoId: precio.productoId,
            precio: precio.precio
          });
        }
      }
    }

    // Recargar con precios y sucursales
    const clienteConPrecios = await Cliente.findByPk(cliente.id, {
      include: [
        {
          model: PrecioCliente,
          as: 'precios',
          include: [{ model: Producto, as: 'producto' }]
        },
        { model: Sucursal, as: 'sucursal', attributes: ['id', 'nombre'] },
        { model: Sucursal, as: 'sucursalBackup', attributes: ['id', 'nombre'] }
      ]
    });

    res.status(201).json({
      ...clienteConPrecios.toJSON(),
      adeudoTotal: 0,
      creditoDisponible: clienteConPrecios.limiteCredito || 200
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualizar cliente
 */
export const update = async (req, res, next) => {
  try {
    const cliente = await Cliente.findByPk(req.params.id);

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    const { nombre, telefono, direccion, notas, activo, precios, limiteCredito, sucursalId, sucursalBackupId } = req.body;

    await cliente.update({
      nombre: nombre ?? cliente.nombre,
      telefono: telefono ?? cliente.telefono,
      direccion: direccion ?? cliente.direccion,
      notas: notas ?? cliente.notas,
      activo: activo ?? cliente.activo,
      limiteCredito: limiteCredito !== undefined ? limiteCredito : cliente.limiteCredito,
      sucursalId: sucursalId !== undefined ? sucursalId : cliente.sucursalId,
      sucursalBackupId: sucursalBackupId !== undefined ? sucursalBackupId : cliente.sucursalBackupId
    });

    // Actualizar precios si se proporcionan
    if (precios && Array.isArray(precios)) {
      // Eliminar precios existentes
      await PrecioCliente.destroy({ where: { clienteId: cliente.id } });

      // Crear nuevos precios
      for (const precio of precios) {
        if (precio.productoId && precio.precio) {
          await PrecioCliente.create({
            clienteId: cliente.id,
            productoId: precio.productoId,
            precio: precio.precio
          });
        }
      }
    }

    // Recargar con precios y sucursales
    const clienteActualizado = await Cliente.findByPk(cliente.id, {
      include: [
        {
          model: PrecioCliente,
          as: 'precios',
          include: [{ model: Producto, as: 'producto' }]
        },
        { model: Sucursal, as: 'sucursal', attributes: ['id', 'nombre'] },
        { model: Sucursal, as: 'sucursalBackup', attributes: ['id', 'nombre'] }
      ]
    });

    // Agregar adeudo
    const adeudoTotal = await calcularAdeudo(cliente.id);
    const response = {
      ...clienteActualizado.toJSON(),
      adeudoTotal,
      creditoDisponible: Math.max(0, (clienteActualizado.limiteCredito || 200) - adeudoTotal)
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Eliminar cliente (soft delete)
 */
export const remove = async (req, res, next) => {
  try {
    const cliente = await Cliente.findByPk(req.params.id);

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    await cliente.update({ activo: false });
    res.json({ message: 'Cliente desactivado correctamente' });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener precio de un producto para un cliente específico
 * Jerarquía: PrecioCliente > PrecioSucursal > PrecioLista
 *
 * Query params opcionales:
 * - sucursalId: ID de la sucursal para buscar precio de sucursal
 */
export const getPrecioProducto = async (req, res, next) => {
  try {
    const { clienteId, productoId } = req.params;
    const { sucursalId } = req.query;

    const producto = await Producto.findByPk(productoId);
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // 1. Buscar precio personalizado del cliente (máxima prioridad)
    const precioCliente = await PrecioCliente.findOne({
      where: { clienteId, productoId }
    });

    if (precioCliente) {
      return res.json({
        productoId: parseInt(productoId),
        clienteId: parseInt(clienteId),
        sucursalId: sucursalId ? parseInt(sucursalId) : null,
        precio: parseFloat(precioCliente.precio),
        tipoPrecios: 'cliente',
        precioLista: parseFloat(producto.precioLista)
      });
    }

    // 2. Buscar precio de sucursal si se proporciona sucursalId
    if (sucursalId) {
      const precioSucursal = await PrecioSucursal.findOne({
        where: { sucursalId, productoId }
      });

      if (precioSucursal) {
        return res.json({
          productoId: parseInt(productoId),
          clienteId: parseInt(clienteId),
          sucursalId: parseInt(sucursalId),
          precio: parseFloat(precioSucursal.precio),
          tipoPrecio: 'sucursal',
          precioLista: parseFloat(producto.precioLista)
        });
      }
    }

    // 3. Retornar precio de lista (fallback)
    res.json({
      productoId: parseInt(productoId),
      clienteId: parseInt(clienteId),
      sucursalId: sucursalId ? parseInt(sucursalId) : null,
      precio: parseFloat(producto.precioLista),
      tipoPrecio: 'lista',
      precioLista: parseFloat(producto.precioLista)
    });
  } catch (error) {
    next(error);
  }
};
