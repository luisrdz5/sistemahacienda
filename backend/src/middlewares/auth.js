import jwt from 'jsonwebtoken';
import config from '../config/index.js';

/**
 * Middleware para verificar token JWT
 */
export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.secret);

    req.user = decoded;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Helper para verificar si usuario tiene algún rol
 */
const tieneAlgunRol = (user, rolesPermitidos) => {
  // Verificar rol principal
  if (rolesPermitidos.includes(user?.rol)) {
    return true;
  }
  // Verificar roles adicionales (vienen en el JWT)
  if (user?.roles && Array.isArray(user.roles)) {
    return user.roles.some(r => rolesPermitidos.includes(r));
  }
  return false;
};

/**
 * Middleware para verificar rol de administrador
 */
export const isAdmin = (req, res, next) => {
  if (!tieneAlgunRol(req.user, ['admin'])) {
    return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador' });
  }
  next();
};

/**
 * Middleware para verificar acceso a sucursal
 */
export const canAccessSucursal = (req, res, next) => {
  const sucursalId = parseInt(req.params.sucursalId || req.body.sucursalId);

  // Admin puede acceder a todas las sucursales
  if (req.user?.rol === 'admin') {
    return next();
  }

  // Encargado solo puede acceder a su sucursal
  if (req.user?.sucursalId !== sucursalId) {
    return res.status(403).json({ error: 'No tienes acceso a esta sucursal' });
  }

  next();
};

/**
 * Middleware para verificar rol de administrador de repartidores
 */
export const isAdminRepartidor = (req, res, next) => {
  const rolesPermitidos = ['admin', 'administrador_repartidor'];
  if (!tieneAlgunRol(req.user, rolesPermitidos)) {
    return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador de repartidores' });
  }
  next();
};

/**
 * Middleware para verificar rol de repartidor
 */
export const isRepartidor = (req, res, next) => {
  const rolesPermitidos = ['admin', 'administrador_repartidor', 'repartidor'];
  if (!tieneAlgunRol(req.user, rolesPermitidos)) {
    return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de repartidor' });
  }
  next();
};

/**
 * Middleware para verificar si puede gestionar pedidos (ver, cambiar estado)
 */
export const canManagePedidos = (req, res, next) => {
  const rolesPermitidos = ['admin', 'administrador_repartidor', 'repartidor', 'encargado'];
  if (!tieneAlgunRol(req.user, rolesPermitidos)) {
    return res.status(403).json({ error: 'Acceso denegado. No tiene permisos para gestionar pedidos' });
  }
  next();
};

/**
 * Middleware para verificar si puede crear/editar pedidos y precios
 * Admin, encargado, admin_repartidor y repartidor pueden crear/editar pedidos
 */
export const canEditPedidos = (req, res, next) => {
  const rolesPermitidos = ['admin', 'administrador_repartidor', 'encargado', 'repartidor'];
  if (!tieneAlgunRol(req.user, rolesPermitidos)) {
    return res.status(403).json({ error: 'Acceso denegado. No tiene permisos para editar pedidos' });
  }
  next();
};

/**
 * Middleware para verificar rol de cliente
 */
export const isCliente = (req, res, next) => {
  if (req.user?.rol !== 'cliente') {
    return res.status(403).json({ error: 'Acceso solo para clientes' });
  }
  next();
};

/**
 * Middleware para verificar que el cliente esté aprobado
 * Requiere que se haya cargado el cliente en req.cliente
 */
export const isClienteAprobado = async (req, res, next) => {
  try {
    // Import dinámico para evitar circular dependency
    const { Cliente } = await import('../models/index.js');

    if (!req.user?.clienteId) {
      return res.status(403).json({ error: 'Usuario no está vinculado a un cliente' });
    }

    const cliente = await Cliente.findByPk(req.user.clienteId);
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    if (!cliente.aprobado) {
      return res.status(403).json({ error: 'Tu cuenta está pendiente de aprobación' });
    }

    // Guardar cliente en request para uso posterior
    req.cliente = cliente;
    next();
  } catch (error) {
    next(error);
  }
};
