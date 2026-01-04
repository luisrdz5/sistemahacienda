import { Router } from 'express';
import { authenticate, isCliente, isClienteAprobado } from '../middlewares/auth.js';
import * as portalController from '../controllers/clientePortalController.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Portal Cliente
 *   description: Endpoints para el portal de autogestión de clientes
 */

/**
 * @swagger
 * /api/cliente/dashboard:
 *   get:
 *     summary: Dashboard del cliente con resumen de adeudo y últimos pedidos
 *     tags: [Portal Cliente]
 *     responses:
 *       200:
 *         description: Dashboard del cliente
 */
router.get('/dashboard', authenticate, isCliente, isClienteAprobado, portalController.getDashboard);

/**
 * @swagger
 * /api/cliente/pedidos:
 *   get:
 *     summary: Historial de pedidos del cliente
 *     tags: [Portal Cliente]
 *     parameters:
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *         description: Filtrar por estado
 *       - in: query
 *         name: fechaInicio
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: fechaFin
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Lista de pedidos paginada
 */
router.get('/pedidos', authenticate, isCliente, isClienteAprobado, portalController.getPedidos);

/**
 * @swagger
 * /api/cliente/pedidos/{id}:
 *   get:
 *     summary: Detalle de un pedido específico
 *     tags: [Portal Cliente]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Detalle del pedido
 *       404:
 *         description: Pedido no encontrado
 */
router.get('/pedidos/:id', authenticate, isCliente, isClienteAprobado, portalController.getPedidoById);

/**
 * @swagger
 * /api/cliente/pedidos:
 *   post:
 *     summary: Crear nuevo pedido
 *     tags: [Portal Cliente]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - detalles
 *             properties:
 *               notas:
 *                 type: string
 *               detalles:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productoId:
 *                       type: integer
 *                     cantidad:
 *                       type: number
 *     responses:
 *       201:
 *         description: Pedido creado
 *       400:
 *         description: Error de validación o límite de crédito excedido
 */
router.post('/pedidos', authenticate, isCliente, isClienteAprobado, portalController.crearPedido);

/**
 * @swagger
 * /api/cliente/pedidos/{id}:
 *   delete:
 *     summary: Cancelar pedido (solo si está pendiente)
 *     tags: [Portal Cliente]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Pedido cancelado
 *       400:
 *         description: No se puede cancelar
 */
router.delete('/pedidos/:id', authenticate, isCliente, isClienteAprobado, portalController.cancelarPedido);

/**
 * @swagger
 * /api/cliente/adeudo:
 *   get:
 *     summary: Detalle de adeudo del cliente
 *     tags: [Portal Cliente]
 *     responses:
 *       200:
 *         description: Detalle de adeudo con pedidos pendientes
 */
router.get('/adeudo', authenticate, isCliente, isClienteAprobado, portalController.getAdeudo);

/**
 * @swagger
 * /api/cliente/productos:
 *   get:
 *     summary: Catálogo de productos con precios del cliente
 *     tags: [Portal Cliente]
 *     responses:
 *       200:
 *         description: Lista de productos con precios
 */
router.get('/productos', authenticate, isCliente, isClienteAprobado, portalController.getProductos);

/**
 * @swagger
 * /api/cliente/perfil:
 *   get:
 *     summary: Obtener datos del perfil del cliente
 *     tags: [Portal Cliente]
 *     responses:
 *       200:
 *         description: Datos del perfil
 */
router.get('/perfil', authenticate, isCliente, isClienteAprobado, portalController.getPerfil);

/**
 * @swagger
 * /api/cliente/perfil:
 *   put:
 *     summary: Actualizar datos del perfil (teléfono, dirección)
 *     tags: [Portal Cliente]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               telefono:
 *                 type: string
 *               direccion:
 *                 type: string
 *               notas:
 *                 type: string
 *     responses:
 *       200:
 *         description: Perfil actualizado
 */
router.put('/perfil', authenticate, isCliente, isClienteAprobado, portalController.updatePerfil);

/**
 * @swagger
 * /api/cliente/perfil/password:
 *   put:
 *     summary: Cambiar contraseña del cliente
 *     tags: [Portal Cliente]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - passwordActual
 *               - passwordNuevo
 *             properties:
 *               passwordActual:
 *                 type: string
 *               passwordNuevo:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Contraseña actualizada
 *       400:
 *         description: Error de validación
 */
router.put('/perfil/password', authenticate, isCliente, isClienteAprobado, portalController.updatePassword);

export default router;
