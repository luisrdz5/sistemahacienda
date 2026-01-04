import { Router } from 'express';
import * as usuariosController from '../controllers/usuariosController.js';
import { authenticate, isAdmin } from '../middlewares/auth.js';

const router = Router();

/**
 * @swagger
 * /api/usuarios:
 *   get:
 *     summary: Listar usuarios (solo admin)
 *     tags: [Usuarios]
 *     responses:
 *       200:
 *         description: Lista de usuarios
 */
router.get('/', authenticate, isAdmin, usuariosController.getAll);

/**
 * @swagger
 * /api/usuarios/{id}:
 *   get:
 *     summary: Obtener usuario por ID (solo admin)
 *     tags: [Usuarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Datos del usuario
 */
router.get('/:id', authenticate, isAdmin, usuariosController.getById);

/**
 * @swagger
 * /api/usuarios:
 *   post:
 *     summary: Crear usuario (solo admin)
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - email
 *               - rol
 *             properties:
 *               nombre:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               rol:
 *                 type: string
 *                 enum: [admin, encargado]
 *               sucursalId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Usuario creado
 */
router.post('/', authenticate, isAdmin, usuariosController.create);

/**
 * @swagger
 * /api/usuarios/{id}:
 *   put:
 *     summary: Actualizar usuario (solo admin)
 *     tags: [Usuarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Usuario actualizado
 */
router.put('/:id', authenticate, isAdmin, usuariosController.update);

/**
 * @swagger
 * /api/usuarios/{id}/roles:
 *   get:
 *     summary: Obtener roles de un usuario
 *     tags: [Usuarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de roles del usuario
 */
router.get('/:id/roles', authenticate, isAdmin, usuariosController.getRoles);

/**
 * @swagger
 * /api/usuarios/{id}/roles:
 *   post:
 *     summary: Agregar rol adicional a usuario
 *     tags: [Usuarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rol
 *             properties:
 *               rol:
 *                 type: string
 *                 enum: [admin, encargado, repartidor, administrador_repartidor]
 *               sucursalId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Rol agregado
 */
router.post('/:id/roles', authenticate, isAdmin, usuariosController.agregarRol);

/**
 * @swagger
 * /api/usuarios/{id}/roles/{rolId}:
 *   delete:
 *     summary: Eliminar rol adicional de usuario
 *     tags: [Usuarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: rolId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Rol eliminado
 */
router.delete('/:id/roles/:rolId', authenticate, isAdmin, usuariosController.quitarRol);

export default router;
