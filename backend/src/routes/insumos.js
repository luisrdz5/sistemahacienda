import { Router } from 'express';
import * as insumosController from '../controllers/insumosController.js';
import { authenticate, isAdmin } from '../middlewares/auth.js';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Insumo:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         nombre:
 *           type: string
 *         unidadBase:
 *           type: string
 *         unidadCompra:
 *           type: string
 *         factorConversion:
 *           type: number
 *         activo:
 *           type: boolean
 *         precioActual:
 *           type: number
 */

/**
 * @swagger
 * /api/insumos:
 *   get:
 *     summary: Listar todos los insumos con precio actual
 *     tags: [Insumos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: activo
 *         schema:
 *           type: boolean
 *         description: Filtrar por estado activo
 *     responses:
 *       200:
 *         description: Lista de insumos
 */
router.get('/', authenticate, insumosController.getAll);

/**
 * @swagger
 * /api/insumos/{id}:
 *   get:
 *     summary: Obtener un insumo por ID
 *     tags: [Insumos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Datos del insumo
 *       404:
 *         description: Insumo no encontrado
 */
router.get('/:id', authenticate, insumosController.getById);

/**
 * @swagger
 * /api/insumos:
 *   post:
 *     summary: Crear un nuevo insumo (admin)
 *     tags: [Insumos]
 *     security:
 *       - bearerAuth: []
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
 *               unidadBase:
 *                 type: string
 *                 default: kg
 *               unidadCompra:
 *                 type: string
 *                 default: kg
 *               factorConversion:
 *                 type: number
 *                 default: 1
 *               precio:
 *                 type: number
 *                 description: Precio inicial (opcional)
 *     responses:
 *       201:
 *         description: Insumo creado
 *       400:
 *         description: Error de validación
 */
router.post('/', authenticate, isAdmin, insumosController.create);

/**
 * @swagger
 * /api/insumos/{id}:
 *   put:
 *     summary: Actualizar un insumo (admin)
 *     tags: [Insumos]
 *     security:
 *       - bearerAuth: []
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
 *               unidadBase:
 *                 type: string
 *               unidadCompra:
 *                 type: string
 *               factorConversion:
 *                 type: number
 *               activo:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Insumo actualizado
 *       404:
 *         description: Insumo no encontrado
 */
router.put('/:id', authenticate, isAdmin, insumosController.update);

/**
 * @swagger
 * /api/insumos/{id}:
 *   delete:
 *     summary: Desactivar un insumo (admin)
 *     tags: [Insumos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Insumo desactivado
 *       404:
 *         description: Insumo no encontrado
 */
router.delete('/:id', authenticate, isAdmin, insumosController.remove);

/**
 * @swagger
 * /api/insumos/{id}/precios:
 *   get:
 *     summary: Obtener historial de precios de un insumo
 *     tags: [Insumos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Historial de precios
 *       404:
 *         description: Insumo no encontrado
 */
router.get('/:id/precios', authenticate, insumosController.getHistorial);

/**
 * @swagger
 * /api/insumos/{id}/precios:
 *   post:
 *     summary: Registrar nuevo precio (crea historial)
 *     tags: [Insumos]
 *     security:
 *       - bearerAuth: []
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
 *               - precio
 *             properties:
 *               precio:
 *                 type: number
 *                 description: Nuevo precio por unidad de compra
 *     responses:
 *       201:
 *         description: Precio registrado
 *       400:
 *         description: Error de validación
 *       404:
 *         description: Insumo no encontrado
 */
router.post('/:id/precios', authenticate, isAdmin, insumosController.addPrecio);

export default router;
