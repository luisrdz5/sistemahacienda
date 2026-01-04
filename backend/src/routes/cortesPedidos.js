import { Router } from 'express';
import * as cortesPedidosController from '../controllers/cortesPedidosController.js';
import { authenticate, canManagePedidos, isAdminRepartidor } from '../middlewares/auth.js';

const router = Router();

/**
 * @swagger
 * /api/cortes-pedidos/resumen-dia:
 *   get:
 *     summary: Obtener resumen general del dia
 *     tags: [Cortes Pedidos]
 *     parameters:
 *       - in: query
 *         name: fecha
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Resumen del dia con pedidos por repartidor
 */
router.get('/resumen-dia', authenticate, isAdminRepartidor, cortesPedidosController.getResumenDia);

/**
 * @swagger
 * /api/cortes-pedidos/repartidor:
 *   get:
 *     summary: Obtener corte por repartidor
 *     tags: [Cortes Pedidos]
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
 *     responses:
 *       200:
 *         description: Corte del repartidor
 */
router.get('/repartidor', authenticate, canManagePedidos, cortesPedidosController.getCortePorRepartidor);

/**
 * @swagger
 * /api/cortes-pedidos/historial:
 *   get:
 *     summary: Obtener historial de cortes
 *     tags: [Cortes Pedidos]
 *     parameters:
 *       - in: query
 *         name: mes
 *         schema:
 *           type: integer
 *       - in: query
 *         name: anio
 *         schema:
 *           type: integer
 *       - in: query
 *         name: repartidorId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de cortes
 */
router.get('/historial', authenticate, canManagePedidos, cortesPedidosController.getHistorial);

/**
 * @swagger
 * /api/cortes-pedidos/analytics-tiempos:
 *   get:
 *     summary: Obtener analytics de tiempos (top 10 rankings y deudores)
 *     tags: [Cortes Pedidos]
 *     parameters:
 *       - in: query
 *         name: fecha
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Analytics con rankings de tiempos y deudores
 */
router.get('/analytics-tiempos', authenticate, isAdminRepartidor, cortesPedidosController.getAnalyticsTiempos);

/**
 * @swagger
 * /api/cortes-pedidos/finalizar:
 *   post:
 *     summary: Finalizar corte de repartidor
 *     tags: [Cortes Pedidos]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fecha:
 *                 type: string
 *                 format: date
 *               repartidorId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Corte finalizado
 */
router.post('/finalizar', authenticate, canManagePedidos, cortesPedidosController.finalizarCorte);

/**
 * @swagger
 * /api/cortes-pedidos/cierre/{fecha}/{repartidorId}:
 *   get:
 *     summary: Obtener detalle para cierre de caja
 *     tags: [Cortes Pedidos]
 *     parameters:
 *       - in: path
 *         name: fecha
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: path
 *         name: repartidorId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Detalle de cobros para cierre de caja
 */
router.get('/cierre/:fecha/:repartidorId', authenticate, canManagePedidos, cortesPedidosController.getDetalleCierre);

/**
 * @swagger
 * /api/cortes-pedidos/cierre/{fecha}/{repartidorId}:
 *   post:
 *     summary: Confirmar cierre de caja
 *     tags: [Cortes Pedidos]
 *     parameters:
 *       - in: path
 *         name: fecha
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: path
 *         name: repartidorId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               detalles:
 *                 type: array
 *                 items:
 *                   type: object
 *               notasGenerales:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cierre confirmado
 */
router.post('/cierre/:fecha/:repartidorId', authenticate, isAdminRepartidor, cortesPedidosController.confirmarCierreCaja);

/**
 * @swagger
 * /api/cortes-pedidos/ticket/{fecha}/{repartidorId}:
 *   get:
 *     summary: Obtener datos para imprimir ticket
 *     tags: [Cortes Pedidos]
 *     parameters:
 *       - in: path
 *         name: fecha
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: path
 *         name: repartidorId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Datos formateados para ticket
 */
router.get('/ticket/:fecha/:repartidorId', authenticate, canManagePedidos, cortesPedidosController.getTicketData);

export default router;
