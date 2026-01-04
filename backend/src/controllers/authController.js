import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Op } from 'sequelize';
import { OAuth2Client } from 'google-auth-library';
import { Usuario, Sucursal, UsuarioRol } from '../models/index.js';
import config from '../config/index.js';
import { sendPasswordResetEmail } from '../services/emailService.js';

// Cliente de Google OAuth
const googleClient = config.google.clientId ? new OAuth2Client(config.google.clientId) : null;

/**
 * Genera token JWT
 */
const generateToken = (user, rolesAdicionales = []) => {
  // Combinar rol principal con roles adicionales activos
  const todosLosRoles = [user.rol];
  rolesAdicionales.forEach(ra => {
    if (ra.activo && !todosLosRoles.includes(ra.rol)) {
      todosLosRoles.push(ra.rol);
    }
  });

  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      rol: user.rol,
      roles: todosLosRoles,
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
      include: [
        { model: Sucursal, as: 'sucursal' },
        {
          model: UsuarioRol,
          as: 'rolesAdicionales',
          where: { activo: true },
          required: false
        }
      ]
    });

    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const passwordValida = await usuario.validarPassword(password);
    if (!passwordValida) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const rolesAdicionales = usuario.rolesAdicionales || [];
    const token = generateToken(usuario, rolesAdicionales);

    // Preparar respuesta con todos los roles
    const userData = usuario.toJSON();
    userData.todosLosRoles = [userData.rol];
    rolesAdicionales.forEach(ra => {
      if (!userData.todosLosRoles.includes(ra.rol)) {
        userData.todosLosRoles.push(ra.rol);
      }
    });

    res.json({
      token,
      usuario: userData
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
      include: [
        { model: Sucursal, as: 'sucursal' },
        {
          model: UsuarioRol,
          as: 'rolesAdicionales',
          where: { activo: true },
          required: false
        }
      ]
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Preparar respuesta con todos los roles
    const userData = usuario.toJSON();
    userData.todosLosRoles = [userData.rol];
    if (userData.rolesAdicionales) {
      userData.rolesAdicionales.forEach(ra => {
        if (!userData.todosLosRoles.includes(ra.rol)) {
          userData.todosLosRoles.push(ra.rol);
        }
      });
    }

    res.json(userData);
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

/**
 * Solicitar recuperación de contraseña
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email es requerido' });
    }

    // Buscar usuario activo con ese email
    const usuario = await Usuario.findOne({
      where: { email, activo: true }
    });

    // Siempre responder éxito (no revelar si el email existe)
    const successMessage = 'Si el email está registrado, recibirás instrucciones para restablecer tu contraseña';

    if (!usuario) {
      return res.json({ message: successMessage });
    }

    // Generar token aleatorio
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hora

    // Guardar token en la base de datos
    await usuario.update({
      resetToken,
      resetTokenExpires
    });

    // Enviar email
    try {
      await sendPasswordResetEmail(email, resetToken, usuario.nombre);
    } catch (emailError) {
      console.error('Error enviando email:', emailError);
      // No revelar el error al usuario
    }

    res.json({ message: successMessage });
  } catch (error) {
    next(error);
  }
};

/**
 * Restablecer contraseña con token
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token y contraseña son requeridos' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // Buscar usuario con token válido y no expirado
    const usuario = await Usuario.findOne({
      where: {
        resetToken: token,
        resetTokenExpires: { [Op.gt]: new Date() },
        activo: true
      }
    });

    if (!usuario) {
      return res.status(400).json({ error: 'Token inválido o expirado' });
    }

    // Actualizar contraseña y limpiar token
    await usuario.update({
      passwordHash: password, // Se hashea automáticamente en el hook
      resetToken: null,
      resetTokenExpires: null
    });

    res.json({ message: 'Contraseña actualizada exitosamente' });
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
      return res.status(400).json({ error: 'Token de Google es requerido' });
    }

    if (!googleClient) {
      return res.status(500).json({ error: 'Google OAuth no está configurado' });
    }

    // Verificar el token de Google
    let ticket;
    try {
      ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: config.google.clientId
      });
    } catch (err) {
      return res.status(401).json({ error: 'Token de Google inválido' });
    }

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Buscar usuario existente por googleId o email
    let usuario = await Usuario.findOne({
      where: {
        [Op.or]: [
          { googleId },
          { email }
        ]
      },
      include: [{ model: Sucursal, as: 'sucursal' }]
    });

    if (usuario) {
      // Usuario existe
      if (!usuario.activo) {
        return res.status(401).json({ error: 'Tu cuenta está desactivada. Contacta al administrador.' });
      }

      // Actualizar googleId si no lo tenía (login por email previo)
      if (!usuario.googleId) {
        await usuario.update({ googleId, avatarUrl: picture });
      }
    } else {
      // Crear nuevo usuario como invitado
      usuario = await Usuario.create({
        nombre: name,
        email,
        googleId,
        avatarUrl: picture,
        rol: 'invitado',
        activo: true
      });

      // Recargar con sucursal
      usuario = await Usuario.findByPk(usuario.id, {
        include: [{ model: Sucursal, as: 'sucursal' }]
      });
    }

    const token = generateToken(usuario);

    res.json({
      token,
      usuario: usuario.toJSON(),
      isNewUser: usuario.rol === 'invitado'
    });
  } catch (error) {
    next(error);
  }
};
