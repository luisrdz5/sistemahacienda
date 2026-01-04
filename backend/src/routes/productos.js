import { Router } from 'express';
import * as productosController from '../controllers/productosController.js';
import { authenticate, isAdmin, isAdminRepartidor } from '../middlewares/auth.js';
import { uploadProductoImagen, handleUpload } from '../middlewares/upload.js';

const router = Router();

/**
 * @swagger
 * /api/productos:
 *   get:
 *     summary: Listar productos
 *     tags: [Productos]
 *     parameters:
 *       - in: query
 *         name: activo
 *         schema:
 *           type: boolean
 *         description: Filtrar por estado activo
 *     responses:
 *       200:
 *         description: Lista de productos
 */
router.get('/', authenticate, productosController.getAll);

/**
 * @swagger
 * /api/productos/{id}:
 *   get:
 *     summary: Obtener producto por ID
 *     tags: [Productos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Datos del producto
 *       404:
 *         description: Producto no encontrado
 */
router.get('/:id', authenticate, productosController.getById);

/**
 * @swagger
 * /api/productos:
 *   post:
 *     summary: Crear producto (admin o admin repartidor)
 *     tags: [Productos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - precioLista
 *             properties:
 *               nombre:
 *                 type: string
 *               unidad:
 *                 type: string
 *               precioLista:
 *                 type: number
 *     responses:
 *       201:
 *         description: Producto creado
 */
router.post('/', authenticate, isAdminRepartidor, handleUpload(uploadProductoImagen), productosController.create);

/**
 * @swagger
 * /api/productos/{id}:
 *   put:
 *     summary: Actualizar producto (admin o admin repartidor)
 *     tags: [Productos]
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
 *               unidad:
 *                 type: string
 *               precioLista:
 *                 type: number
 *               activo:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Producto actualizado
 *       404:
 *         description: Producto no encontrado
 */
router.put('/:id', authenticate, isAdminRepartidor, handleUpload(uploadProductoImagen), productosController.update);

/**
 * @swagger
 * /api/productos/{id}/imagen:
 *   delete:
 *     summary: Eliminar imagen de producto
 *     tags: [Productos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Imagen eliminada
 */
router.delete('/:id/imagen', authenticate, isAdminRepartidor, productosController.deleteImagen);

/**
 * @swagger
 * /api/productos/{id}:
 *   delete:
 *     summary: Eliminar producto (solo admin)
 *     tags: [Productos]
 *     description: Desactiva el producto (soft delete)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Producto desactivado
 *       404:
 *         description: Producto no encontrado
 */
router.delete('/:id', authenticate, isAdmin, productosController.remove);

export default router;
