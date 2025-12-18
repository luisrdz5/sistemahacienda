import jwt from 'jsonwebtoken';
import { Usuario, Sucursal } from '../models/index.js';
import config from '../config/index.js';

/**
 * Genera token JWT
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      rol: user.rol,
      sucursalId: user.sucursalId
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
};

/**
 * Login con email y contraseña
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    const usuario = await Usuario.findOne({
      where: { email, activo: true },
      include: [{ model: Sucursal, as: 'sucursal' }]
    });

    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const passwordValida = await usuario.validarPassword(password);
    if (!passwordValida) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = generateToken(usuario);

    res.json({
      token,
      usuario: usuario.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener usuario actual
 */
export const me = async (req, res, next) => {
  try {
    const usuario = await Usuario.findByPk(req.user.id, {
      include: [{ model: Sucursal, as: 'sucursal' }]
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(usuario);
  } catch (error) {
    next(error);
  }
};

/**
 * Cerrar sesión (solo informativo, JWT es stateless)
 */
export const logout = async (req, res) => {
  res.json({ message: 'Sesión cerrada' });
};
