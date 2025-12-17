import { Router } from 'express';
import * as sucursalesController from '../controllers/sucursalesController.js';
import { authenticate, isAdmin } from '../middlewares/auth.js';

const router = Router();

/**
 * @swagger
 * /api/sucursales:
 *   get:
 *     summary: Listar todas las sucursales
 *     tags: [Sucursales]
 *     responses:
 *       200:
 *         description: Lista de sucursales
 */
router.get('/', authenticate, sucursalesController.getAll);

/**
 * @swagger
 * /api/sucursales/{id}:
 *   get:
 *     summary: Obtener una sucursal por ID
 *     tags: [Sucursales]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Datos de la sucursal
 *       404:
 *         description: Sucursal no encontrada
 */
router.get('/:id', authenticate, sucursalesController.getById);

/**
 * @swagger
 * /api/sucursales:
 *   post:
 *     summary: Crear nueva sucursal (solo admin)
 *     tags: [Sucursales]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *             properties:
 *               nombre:
 *                 type: string
 *               direccion:
 *                 type: string
 *     responses:
 *       201:
 *         description: Sucursal creada
 */
router.post('/', authenticate, isAdmin, sucursalesController.create);

/**
 * @swagger
 * /api/sucursales/{id}:
 *   put:
 *     summary: Actualizar sucursal (solo admin)
 *     tags: [Sucursales]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Sucursal actualizada
 */
router.put('/:id', authenticate, isAdmin, sucursalesController.update);

/**
 * @swagger
 * /api/sucursales/{id}:
 *   delete:
 *     summary: Eliminar sucursal (solo admin)
 *     tags: [Sucursales]
 *     description: Desactiva la sucursal (soft delete)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Sucursal desactivada
 *       404:
 *         description: Sucursal no encontrada
 */
router.delete('/:id', authenticate, isAdmin, sucursalesController.remove);

export default router;
