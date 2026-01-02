import { Router } from 'express';
import * as pedidosController from '../controllers/pedidosController.js';
import { authenticate, canManagePedidos, canEditPedidos, isAdminRepartidor } from '../middlewares/auth.js';

const router = Router();

/**
 * @swagger
 * /api/pedidos:
 *   get:
 *     summary: Listar pedidos
 *     tags: [Pedidos]
 *     parameters:
 *       - in: query
 *         name: fecha
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: repartidorId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [pendiente, entregado, cancelado]
 *       - in: query
 *         name: clienteId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de pedidos
 */
router.get('/', authenticate, canManagePedidos, pedidosController.getAll);

/**
 * @swagger
 * /api/pedidos/resumen-dia:
 *   get:
 *     summary: Obtener resumen del dia
 *     tags: [Pedidos]
 *     parameters:
 *       - in: query
 *         name: fecha
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Resumen de pedidos del dia
 */
router.get('/resumen-dia', authenticate, canManagePedidos, pedidosController.getResumenDia);

/**
 * @swagger
 * /api/pedidos/repartidores:
 *   get:
 *     summary: Obtener lista de repartidores activos
 *     tags: [Pedidos]
 *     responses:
 *       200:
 *         description: Lista de repartidores
 */
router.get('/repartidores', authenticate, canManagePedidos, pedidosController.getRepartidores);

/**
 * @swagger
 * /api/pedidos/dashboard/repartos-pendientes:
 *   get:
 *     summary: Dashboard de repartos pendientes para pantalla de sucursal
 *     tags: [Pedidos]
 *     parameters:
 *       - in: query
 *         name: fecha
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Lista de pedidos pendientes con estadisticas
 */
router.get('/dashboard/repartos-pendientes', authenticate, canManagePedidos, pedidosController.getRepartosPendientes);

/**
 * @swagger
 * /api/pedidos/dashboard/deudores:
 *   get:
 *     summary: Resumen de clientes deudores
 *     tags: [Pedidos]
 *     parameters:
 *       - in: query
 *         name: periodo
 *         schema:
 *           type: string
 *           enum: [semanal, mensual]
 *       - in: query
 *         name: repartidorId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de clientes con deuda pendiente
 */
router.get('/dashboard/deudores', authenticate, canManagePedidos, pedidosController.getClientesDeudores);

/**
 * @swagger
 * /api/pedidos/{id}:
 *   get:
 *     summary: Obtener pedido por ID
 *     tags: [Pedidos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Datos del pedido
 *       404:
 *         description: Pedido no encontrado
 */
router.get('/:id', authenticate, canManagePedidos, pedidosController.getById);

/**
 * @swagger
 * /api/pedidos:
 *   post:
 *     summary: Crear pedido
 *     tags: [Pedidos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fecha
 *               - detalles
 *             properties:
 *               fecha:
 *                 type: string
 *                 format: date
 *               clienteId:
 *                 type: integer
 *               repartidorId:
 *                 type: integer
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
 */
router.post('/', authenticate, canEditPedidos, pedidosController.create);

/**
 * @swagger
 * /api/pedidos/{id}:
 *   put:
 *     summary: Actualizar pedido
 *     tags: [Pedidos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Pedido actualizado
 */
router.put('/:id', authenticate, canEditPedidos, pedidosController.update);

/**
 * @swagger
 * /api/pedidos/{id}/preparar:
 *   put:
 *     summary: Marcar pedido como preparado (encargado prepara el producto)
 *     tags: [Pedidos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Pedido preparado
 */
router.put('/:id/preparar', authenticate, canEditPedidos, pedidosController.preparar);

/**
 * @swagger
 * /api/pedidos/{id}/despachar:
 *   put:
 *     summary: Marcar pedido como en camino (sale de sucursal)
 *     tags: [Pedidos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Pedido en camino
 */
router.put('/:id/despachar', authenticate, canManagePedidos, pedidosController.despachar);

/**
 * @swagger
 * /api/pedidos/{id}/entregar:
 *   put:
 *     summary: Marcar pedido como entregado
 *     tags: [Pedidos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Pedido entregado
 */
router.put('/:id/entregar', authenticate, canManagePedidos, pedidosController.entregar);

/**
 * @swagger
 * /api/pedidos/{id}/cancelar:
 *   put:
 *     summary: Cancelar pedido
 *     tags: [Pedidos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Pedido cancelado
 */
router.put('/:id/cancelar', authenticate, isAdminRepartidor, pedidosController.cancelar);

/**
 * @swagger
 * /api/pedidos/{id}/abonos:
 *   get:
 *     summary: Obtener historial de abonos de un pedido
 *     tags: [Pedidos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de abonos del pedido
 */
router.get('/:id/abonos', authenticate, canManagePedidos, pedidosController.getAbonos);

/**
 * @swagger
 * /api/pedidos/{id}/abonos:
 *   post:
 *     summary: Registrar abono adicional (solo admin)
 *     tags: [Pedidos]
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
 *               - monto
 *             properties:
 *               monto:
 *                 type: number
 *               tipo:
 *                 type: string
 *                 enum: [efectivo, transferencia, otro]
 *               notas:
 *                 type: string
 *     responses:
 *       200:
 *         description: Abono registrado
 */
router.post('/:id/abonos', authenticate, isAdminRepartidor, pedidosController.registrarAbono);

/**
 * @swagger
 * /api/pedidos/{id}:
 *   delete:
 *     summary: Eliminar pedido
 *     tags: [Pedidos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Pedido eliminado
 */
router.delete('/:id', authenticate, isAdminRepartidor, pedidosController.remove);

export default router;
