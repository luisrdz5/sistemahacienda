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
 * Middleware para verificar rol de administrador
 */
export const isAdmin = (req, res, next) => {
  if (req.user?.rol !== 'admin') {
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
  if (!rolesPermitidos.includes(req.user?.rol)) {
    return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador de repartidores' });
  }
  next();
};

/**
 * Middleware para verificar rol de repartidor
 */
export const isRepartidor = (req, res, next) => {
  const rolesPermitidos = ['admin', 'administrador_repartidor', 'repartidor'];
  if (!rolesPermitidos.includes(req.user?.rol)) {
    return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de repartidor' });
  }
  next();
};

/**
 * Middleware para verificar si puede gestionar pedidos
 */
export const canManagePedidos = (req, res, next) => {
  const rolesPermitidos = ['admin', 'administrador_repartidor', 'repartidor'];
  if (!rolesPermitidos.includes(req.user?.rol)) {
    return res.status(403).json({ error: 'Acceso denegado. No tiene permisos para gestionar pedidos' });
  }
  next();
};
