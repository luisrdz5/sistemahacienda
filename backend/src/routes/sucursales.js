import { Router } from 'express';
import * as sucursalesController from '../controllers/sucursalesController.js';
import * as preciosSucursalController from '../controllers/preciosSucursalController.js';
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

// ==================== PRECIOS POR SUCURSAL ====================

/**
 * @swagger
 * /api/sucursales/{sucursalId}/precios:
 *   get:
 *     summary: Obtener todos los precios de una sucursal
 *     tags: [Precios Sucursal]
 *     parameters:
 *       - in: path
 *         name: sucursalId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de productos con precios de sucursal
 */
router.get('/:sucursalId/precios', authenticate, preciosSucursalController.getPreciosBySucursal);

/**
 * @swagger
 * /api/sucursales/{sucursalId}/precios:
 *   put:
 *     summary: Actualizar múltiples precios de una sucursal
 *     tags: [Precios Sucursal]
 *     parameters:
 *       - in: path
 *         name: sucursalId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               precios:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productoId:
 *                       type: integer
 *                     precio:
 *                       type: number
 *     responses:
 *       200:
 *         description: Precios actualizados
 */
router.put('/:sucursalId/precios', authenticate, isAdmin, preciosSucursalController.updatePreciosMasivo);

/**
 * @swagger
 * /api/sucursales/{sucursalId}/precios/{productoId}:
 *   get:
 *     summary: Obtener precio efectivo de un producto para una sucursal
 *     tags: [Precios Sucursal]
 *     parameters:
 *       - in: path
 *         name: sucursalId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: productoId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Precio del producto
 */
router.get('/:sucursalId/precios/:productoId', authenticate, preciosSucursalController.getPrecioEfectivo);

/**
 * @swagger
 * /api/sucursales/{sucursalId}/precios/{productoId}:
 *   put:
 *     summary: Establecer precio de un producto para una sucursal
 *     tags: [Precios Sucursal]
 *     parameters:
 *       - in: path
 *         name: sucursalId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: productoId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               precio:
 *                 type: number
 *     responses:
 *       200:
 *         description: Precio establecido
 */
router.put('/:sucursalId/precios/:productoId', authenticate, isAdmin, preciosSucursalController.setPrecioProducto);

/**
 * @swagger
 * /api/sucursales/{sucursalId}/precios/{productoId}:
 *   delete:
 *     summary: Eliminar precio personalizado (volver a precio de lista)
 *     tags: [Precios Sucursal]
 *     parameters:
 *       - in: path
 *         name: sucursalId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: productoId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Precio eliminado
 */
router.delete('/:sucursalId/precios/:productoId', authenticate, isAdmin, preciosSucursalController.removePrecioProducto);

export default router;
