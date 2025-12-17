import { Usuario, Sucursal } from '../models/index.js';

/**
 * Listar usuarios
 */
export const getAll = async (req, res, next) => {
  try {
    const usuarios = await Usuario.findAll({
      include: [{ model: Sucursal, as: 'sucursal' }],
      order: [['nombre', 'ASC']]
    });
    res.json(usuarios);
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener usuario por ID
 */
export const getById = async (req, res, next) => {
  try {
    const usuario = await Usuario.findByPk(req.params.id, {
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
 * Crear usuario
 */
export const create = async (req, res, next) => {
  try {
    const { nombre, email, password, rol, sucursalId } = req.body;

    if (!nombre || !email || !rol) {
      return res.status(400).json({ error: 'Nombre, email y rol son requeridos' });
    }

    if (rol === 'encargado' && !sucursalId) {
      return res.status(400).json({ error: 'Los encargados deben tener una sucursal asignada' });
    }

    const usuario = await Usuario.create({
      nombre,
      email,
      passwordHash: password,
      rol,
      sucursalId: rol === 'admin' ? null : sucursalId
    });

    res.status(201).json(usuario);
  } catch (error) {
    next(error);
  }
};

/**
 * Actualizar usuario
 */
export const update = async (req, res, next) => {
  try {
    const usuario = await Usuario.findByPk(req.params.id);

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const { nombre, email, password, rol, sucursalId, activo } = req.body;

    const updateData = {
      nombre: nombre ?? usuario.nombre,
      email: email ?? usuario.email,
      rol: rol ?? usuario.rol,
      activo: activo ?? usuario.activo
    };

    // Actualizar password solo si se proporciona
    if (password) {
      updateData.passwordHash = password;
    }

    // Manejar sucursalId según rol
    if (updateData.rol === 'admin') {
      updateData.sucursalId = null;
    } else if (sucursalId !== undefined) {
      updateData.sucursalId = sucursalId;
    }

    await usuario.update(updateData);

    const usuarioActualizado = await Usuario.findByPk(usuario.id, {
      include: [{ model: Sucursal, as: 'sucursal' }]
    });

    res.json(usuarioActualizado);
  } catch (error) {
    next(error);
  }
};
