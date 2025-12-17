import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { Usuario, Sucursal } from '../models/index.js';
import config from '../config/index.js';

const googleClient = new OAuth2Client(config.google.clientId);

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
 * Login con Google
 */
export const googleLogin = async (req, res, next) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ error: 'Token de Google requerido' });
    }

    // Verificar token de Google
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: config.google.clientId
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Buscar usuario existente por googleId o email
    let usuario = await Usuario.findOne({
      where: { googleId },
      include: [{ model: Sucursal, as: 'sucursal' }]
    });

    if (!usuario) {
      usuario = await Usuario.findOne({
        where: { email },
        include: [{ model: Sucursal, as: 'sucursal' }]
      });

      if (usuario) {
        // Vincular cuenta existente con Google
        usuario.googleId = googleId;
        usuario.avatarUrl = picture;
        await usuario.save();
      }
    }

    if (!usuario) {
      return res.status(401).json({
        error: 'Usuario no registrado. Contacta al administrador.'
      });
    }

    if (!usuario.activo) {
      return res.status(401).json({ error: 'Usuario desactivado' });
    }

    // Actualizar avatar si cambió
    if (picture && usuario.avatarUrl !== picture) {
      usuario.avatarUrl = picture;
      await usuario.save();
    }

    const token = generateToken(usuario);

    res.json({
      token,
      usuario: usuario.toJSON()
    });
  } catch (error) {
    if (error.message?.includes('Invalid token')) {
      return res.status(401).json({ error: 'Token de Google inválido' });
    }
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
