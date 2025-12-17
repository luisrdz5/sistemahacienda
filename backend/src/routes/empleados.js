import { Router } from 'express';
import * as empleadosController from '../controllers/empleadosController.js';
import { authenticate, isAdmin } from '../middlewares/auth.js';

const router = Router();

/**
 * @swagger
 * /api/empleados:
 *   get:
 *     summary: Listar empleados
 *     tags: [Empleados]
 *     parameters:
 *       - in: query
 *         name: sucursalId
 *         schema:
 *           type: integer
 *         description: Filtrar por sucursal
 *     responses:
 *       200:
 *         description: Lista de empleados
 */
router.get('/', authenticate, empleadosController.getAll);

/**
 * @swagger
 * /api/empleados/{id}:
 *   get:
 *     summary: Obtener empleado por ID
 *     tags: [Empleados]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Datos del empleado
 *       404:
 *         description: Empleado no encontrado
 */
router.get('/:id', authenticate, empleadosController.getById);

/**
 * @swagger
 * /api/empleados:
 *   post:
 *     summary: Crear empleado (solo admin)
 *     tags: [Empleados]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - sucursalId
 *             properties:
 *               nombre:
 *                 type: string
 *               sucursalId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Empleado creado
 */
router.post('/', authenticate, isAdmin, empleadosController.create);

/**
 * @swagger
 * /api/empleados/{id}:
 *   put:
 *     summary: Actualizar empleado (solo admin)
 *     tags: [Empleados]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               sucursalId:
 *                 type: integer
 *               activo:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Empleado actualizado
 *       404:
 *         description: Empleado no encontrado
 */
router.put('/:id', authenticate, isAdmin, empleadosController.update);

/**
 * @swagger
 * /api/empleados/{id}:
 *   delete:
 *     summary: Eliminar empleado (solo admin)
 *     tags: [Empleados]
 *     description: Desactiva el empleado (soft delete)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Empleado desactivado
 *       404:
 *         description: Empleado no encontrado
 */
router.delete('/:id', authenticate, isAdmin, empleadosController.remove);

export default router;
