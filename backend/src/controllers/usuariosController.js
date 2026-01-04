import { Usuario, Sucursal, UsuarioRol } from '../models/index.js';

/**
 * Listar usuarios
 */
export const getAll = async (req, res, next) => {
  try {
    const usuarios = await Usuario.findAll({
      include: [
        { model: Sucursal, as: 'sucursal' },
        {
          model: UsuarioRol,
          as: 'rolesAdicionales',
          where: { activo: true },
          required: false,
          include: [{ model: Sucursal, as: 'sucursal' }]
        }
      ],
      order: [['nombre', 'ASC']]
    });

    // Formatear respuesta para incluir todos los roles
    const usuariosConRoles = usuarios.map(u => {
      const userData = u.toJSON();
      const todosLosRoles = [userData.rol];
      if (userData.rolesAdicionales) {
        userData.rolesAdicionales.forEach(ra => {
          if (!todosLosRoles.includes(ra.rol)) {
            todosLosRoles.push(ra.rol);
          }
        });
      }
      userData.todosLosRoles = todosLosRoles;
      return userData;
    });

    res.json(usuariosConRoles);
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
      include: [
        { model: Sucursal, as: 'sucursal' },
        {
          model: UsuarioRol,
          as: 'rolesAdicionales',
          where: { activo: true },
          required: false,
          include: [{ model: Sucursal, as: 'sucursal' }]
        }
      ]
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Formatear respuesta
    const userData = usuario.toJSON();
    const todosLosRoles = [userData.rol];
    if (userData.rolesAdicionales) {
      userData.rolesAdicionales.forEach(ra => {
        if (!todosLosRoles.includes(ra.rol)) {
          todosLosRoles.push(ra.rol);
        }
      });
    }
    userData.todosLosRoles = todosLosRoles;

    res.json(userData);
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

/**
 * Agregar rol adicional a usuario
 */
export const agregarRol = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rol, sucursalId } = req.body;

    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Verificar que el rol no sea el principal
    if (usuario.rol === rol) {
      return res.status(400).json({ error: 'Este rol ya es el rol principal del usuario' });
    }

    // Verificar que no exista ya
    const existente = await UsuarioRol.findOne({
      where: { usuarioId: id, rol }
    });

    if (existente) {
      if (existente.activo) {
        return res.status(400).json({ error: 'El usuario ya tiene este rol' });
      }
      // Reactivar
      await existente.update({ activo: true, sucursalId });
      return res.json({ message: 'Rol reactivado', rol: existente });
    }

    const nuevoRol = await UsuarioRol.create({
      usuarioId: id,
      rol,
      sucursalId: ['encargado'].includes(rol) ? sucursalId : null
    });

    res.status(201).json({ message: 'Rol agregado', rol: nuevoRol });
  } catch (error) {
    next(error);
  }
};

/**
 * Eliminar rol adicional de usuario
 */
export const quitarRol = async (req, res, next) => {
  try {
    const { id, rolId } = req.params;

    const usuarioRol = await UsuarioRol.findOne({
      where: { id: rolId, usuarioId: id }
    });

    if (!usuarioRol) {
      return res.status(404).json({ error: 'Rol no encontrado' });
    }

    await usuarioRol.update({ activo: false });

    res.json({ message: 'Rol eliminado' });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener roles de un usuario
 */
export const getRoles = async (req, res, next) => {
  try {
    const { id } = req.params;

    const usuario = await Usuario.findByPk(id, {
      include: [
        { model: Sucursal, as: 'sucursal' },
        {
          model: UsuarioRol,
          as: 'rolesAdicionales',
          include: [{ model: Sucursal, as: 'sucursal' }]
        }
      ]
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const roles = [
      {
        id: null,
        rol: usuario.rol,
        sucursal: usuario.sucursal,
        esPrincipal: true,
        activo: true
      },
      ...(usuario.rolesAdicionales || []).map(ra => ({
        id: ra.id,
        rol: ra.rol,
        sucursal: ra.sucursal,
        esPrincipal: false,
        activo: ra.activo
      }))
    ];

    res.json(roles);
  } catch (error) {
    next(error);
  }
};
