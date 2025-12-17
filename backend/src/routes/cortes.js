import { Router } from 'express';
import * as cortesController from '../controllers/cortesController.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

/**
 * @swagger
 * /api/cortes:
 *   get:
 *     summary: Listar cortes con filtros
 *     tags: [Cortes]
 *     parameters:
 *       - in: query
 *         name: fecha
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: sucursalId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [borrador, completado]
 *     responses:
 *       200:
 *         description: Lista de cortes
 */
router.get('/', authenticate, cortesController.getAll);

/**
 * @swagger
 * /api/cortes/{id}:
 *   get:
 *     summary: Obtener corte con gastos
 *     tags: [Cortes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Detalle del corte
 */
router.get('/:id', authenticate, cortesController.getById);

/**
 * @swagger
 * /api/cortes:
 *   post:
 *     summary: Crear nuevo corte
 *     tags: [Cortes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fecha
 *               - sucursalId
 *             properties:
 *               fecha:
 *                 type: string
 *                 format: date
 *               sucursalId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Corte creado
 */
router.post('/', authenticate, cortesController.create);

/**
 * @swagger
 * /api/cortes/{id}:
 *   put:
 *     summary: Actualizar corte
 *     tags: [Cortes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Corte actualizado
 */
router.put('/:id', authenticate, cortesController.update);

/**
 * @swagger
 * /api/cortes/{id}/finalizar:
 *   put:
 *     summary: Finalizar corte (marcar como completado)
 *     tags: [Cortes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Corte finalizado
 */
router.put('/:id/finalizar', authenticate, cortesController.finalizar);

/**
 * @swagger
 * /api/cortes/{id}:
 *   delete:
 *     summary: Eliminar corte (solo borrador)
 *     tags: [Cortes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Corte eliminado
 */
router.delete('/:id', authenticate, cortesController.remove);

/**
 * @swagger
 * /api/cortes/{corteId}/gastos:
 *   post:
 *     summary: Agregar gasto a un corte
 *     tags: [Cortes]
 *     parameters:
 *       - in: path
 *         name: corteId
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
 *               - categoriaId
 *               - monto
 *             properties:
 *               categoriaId:
 *                 type: integer
 *               descripcion:
 *                 type: string
 *               monto:
 *                 type: number
 *     responses:
 *       201:
 *         description: Gasto agregado
 */
router.post('/:corteId/gastos', authenticate, cortesController.addGasto);

export default router;
