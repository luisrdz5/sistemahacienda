import { Router } from 'express';
import * as clientesController from '../controllers/clientesController.js';
import * as clienteAuthController from '../controllers/clienteAuthController.js';
import { authenticate, isAdmin, isAdminRepartidor } from '../middlewares/auth.js';

const router = Router();

/**
 * @swagger
 * /api/clientes:
 *   get:
 *     summary: Listar clientes
 *     tags: [Clientes]
 *     parameters:
 *       - in: query
 *         name: activo
 *         schema:
 *           type: boolean
 *         description: Filtrar por estado activo
 *     responses:
 *       200:
 *         description: Lista de clientes
 */
router.get('/', authenticate, clientesController.getAll);

/**
 * @swagger
 * /api/clientes/pendientes:
 *   get:
 *     summary: Listar clientes pendientes de aprobación
 *     tags: [Clientes]
 *     responses:
 *       200:
 *         description: Lista de clientes pendientes
 */
router.get('/pendientes', authenticate, isAdminRepartidor, clienteAuthController.getClientesPendientes);

/**
 * @swagger
 * /api/clientes/{id}:
 *   get:
 *     summary: Obtener cliente por ID
 *     tags: [Clientes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Datos del cliente con precios personalizados
 *       404:
 *         description: Cliente no encontrado
 */
router.get('/:id', authenticate, clientesController.getById);

/**
 * @swagger
 * /api/clientes/{clienteId}/productos/{productoId}/precio:
 *   get:
 *     summary: Obtener precio de producto para cliente
 *     tags: [Clientes]
 *     description: Retorna el precio personalizado o precio de lista
 *     parameters:
 *       - in: path
 *         name: clienteId
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
router.get('/:clienteId/productos/:productoId/precio', authenticate, clientesController.getPrecioProducto);

/**
 * @swagger
 * /api/clientes:
 *   post:
 *     summary: Crear cliente (admin o admin repartidor)
 *     tags: [Clientes]
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
 *               telefono:
 *                 type: string
 *               direccion:
 *                 type: string
 *               notas:
 *                 type: string
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
 *       201:
 *         description: Cliente creado
 */
router.post('/', authenticate, isAdminRepartidor, clientesController.create);

/**
 * @swagger
 * /api/clientes/{id}:
 *   put:
 *     summary: Actualizar cliente (admin o admin repartidor)
 *     tags: [Clientes]
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
 *               telefono:
 *                 type: string
 *               direccion:
 *                 type: string
 *               notas:
 *                 type: string
 *               activo:
 *                 type: boolean
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
 *         description: Cliente actualizado
 *       404:
 *         description: Cliente no encontrado
 */
router.put('/:id', authenticate, isAdminRepartidor, clientesController.update);

/**
 * @swagger
 * /api/clientes/{id}:
 *   delete:
 *     summary: Eliminar cliente (solo admin)
 *     tags: [Clientes]
 *     description: Desactiva el cliente (soft delete)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Cliente desactivado
 *       404:
 *         description: Cliente no encontrado
 */
router.delete('/:id', authenticate, isAdmin, clientesController.remove);

/**
 * @swagger
 * /api/clientes/{id}/aprobar:
 *   put:
 *     summary: Aprobar cliente
 *     tags: [Clientes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Cliente aprobado
 *       404:
 *         description: Cliente no encontrado
 */
router.put('/:id/aprobar', authenticate, isAdminRepartidor, clienteAuthController.aprobarCliente);

/**
 * @swagger
 * /api/clientes/{id}/rechazar:
 *   delete:
 *     summary: Rechazar y eliminar solicitud de cliente
 *     tags: [Clientes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Cliente rechazado
 *       404:
 *         description: Cliente no encontrado
 */
router.delete('/:id/rechazar', authenticate, isAdminRepartidor, clienteAuthController.rechazarCliente);

export default router;
