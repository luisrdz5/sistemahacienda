import jwt from 'jsonwebtoken';
import { Usuario, Cliente, sequelize } from '../models/index.js';
import config from '../config/index.js';

/**
 * Genera token JWT para cliente
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      rol: user.rol,
      clienteId: user.clienteId
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
};

/**
 * Registro de nuevo cliente
 * POST /api/auth/register-cliente
 */
export const registerCliente = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const { nombre, email, telefono, direccion, password, notas, sucursalId, sucursalBackupId } = req.body;

    // Validaciones
    if (!nombre || !email || !password) {
      return res.status(400).json({
        error: 'Nombre, email y contraseña son requeridos'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    // Verificar email único en clientes
    const clienteExistente = await Cliente.findOne({
      where: { email }
    });

    if (clienteExistente) {
      return res.status(400).json({
        error: 'Ya existe un cliente registrado con este email'
      });
    }

    // Verificar email único en usuarios
    const usuarioExistente = await Usuario.findOne({
      where: { email }
    });

    if (usuarioExistente) {
      return res.status(400).json({
        error: 'Este email ya está en uso'
      });
    }

    // Crear cliente (pendiente de aprobación)
    const cliente = await Cliente.create({
      nombre,
      email,
      telefono: telefono || null,
      direccion: direccion || null,
      notas: notas || null,
      limiteCredito: 200.00,
      aprobado: false,
      activo: true,
      sucursalId: sucursalId || null,
      sucursalBackupId: sucursalBackupId || null
    }, { transaction });

    // Crear usuario vinculado al cliente
    const usuario = await Usuario.create({
      nombre,
      email,
      passwordHash: password, // Se hashea automáticamente en el hook
      rol: 'cliente',
      clienteId: cliente.id,
      activo: true
    }, { transaction });

    await transaction.commit();

    res.status(201).json({
      message: 'Registro exitoso. Tu cuenta está pendiente de aprobación por un administrador.',
      cliente: {
        id: cliente.id,
        nombre: cliente.nombre,
        email: cliente.email,
        aprobado: cliente.aprobado
      }
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

/**
 * Login específico para clientes
 * POST /api/auth/login-cliente
 */
export const loginCliente = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    const usuario = await Usuario.findOne({
      where: { email, rol: 'cliente', activo: true },
      include: [{
        model: Cliente,
        as: 'cliente'
      }]
    });

    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const passwordValida = await usuario.validarPassword(password);
    if (!passwordValida) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Verificar si está aprobado
    if (!usuario.cliente?.aprobado) {
      return res.status(403).json({
        error: 'Tu cuenta está pendiente de aprobación',
        pendiente: true
      });
    }

    const token = generateToken(usuario);

    res.json({
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol
      },
      cliente: {
        id: usuario.cliente.id,
        nombre: usuario.cliente.nombre,
        limiteCredito: parseFloat(usuario.cliente.limiteCredito),
        aprobado: usuario.cliente.aprobado
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener clientes pendientes de aprobación
 * GET /api/clientes/pendientes
 */
export const getClientesPendientes = async (req, res, next) => {
  try {
    const clientes = await Cliente.findAll({
      where: { aprobado: false, activo: true },
      order: [['createdAt', 'DESC']]
    });

    res.json(clientes);
  } catch (error) {
    next(error);
  }
};

/**
 * Aprobar cliente
 * PUT /api/clientes/:id/aprobar
 */
export const aprobarCliente = async (req, res, next) => {
  try {
    const { id } = req.params;

    const cliente = await Cliente.findByPk(id);
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    await cliente.update({ aprobado: true });

    res.json({
      message: 'Cliente aprobado exitosamente',
      cliente
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Rechazar cliente (eliminar)
 * DELETE /api/clientes/:id/rechazar
 */
export const rechazarCliente = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;

    const cliente = await Cliente.findByPk(id);
    if (!cliente) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    // Eliminar usuario vinculado
    await Usuario.destroy({
      where: { clienteId: id },
      transaction
    });

    // Eliminar cliente
    await cliente.destroy({ transaction });

    await transaction.commit();

    res.json({ message: 'Solicitud de cliente rechazada' });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};
