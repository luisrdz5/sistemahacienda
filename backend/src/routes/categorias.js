import { Router } from 'express';
import * as categoriasController from '../controllers/categoriasController.js';
import { authenticate, isAdmin } from '../middlewares/auth.js';

const router = Router();

/**
 * @swagger
 * /api/categorias:
 *   get:
 *     summary: Listar categorías de gasto
 *     tags: [Categorías]
 *     parameters:
 *       - in: query
 *         name: incluirInactivas
 *         schema:
 *           type: boolean
 *         description: Incluir categorías inactivas en la lista
 *     responses:
 *       200:
 *         description: Lista de categorías
 */
router.get('/', authenticate, categoriasController.getAll);

/**
 * @swagger
 * /api/categorias/{id}:
 *   get:
 *     summary: Obtener una categoría por ID
 *     tags: [Categorías]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Datos de la categoría
 *       404:
 *         description: Categoría no encontrada
 */
router.get('/:id', authenticate, categoriasController.getById);

/**
 * @swagger
 * /api/categorias:
 *   post:
 *     summary: Crear nueva categoría (solo admin)
 *     tags: [Categorías]
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
 *               tipo:
 *                 type: string
 *                 enum: [operativo, nomina]
 *     responses:
 *       201:
 *         description: Categoría creada
 *       400:
 *         description: Datos inválidos o nombre duplicado
 */
router.post('/', authenticate, isAdmin, categoriasController.create);

/**
 * @swagger
 * /api/categorias/{id}:
 *   put:
 *     summary: Actualizar categoría (solo admin)
 *     tags: [Categorías]
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
 *               tipo:
 *                 type: string
 *                 enum: [operativo, nomina]
 *               activa:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Categoría actualizada
 *       404:
 *         description: Categoría no encontrada
 */
router.put('/:id', authenticate, isAdmin, categoriasController.update);

/**
 * @swagger
 * /api/categorias/{id}:
 *   delete:
 *     summary: Eliminar categoría (solo admin)
 *     tags: [Categorías]
 *     description: Si la categoría tiene gastos asociados, se desactiva en lugar de eliminarse
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Categoría eliminada o desactivada
 *       404:
 *         description: Categoría no encontrada
 */
router.delete('/:id', authenticate, isAdmin, categoriasController.remove);

export default router;
