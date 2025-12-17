import { Router } from 'express';
import * as dashboardController from '../controllers/dashboardController.js';
import { authenticate, isAdmin } from '../middlewares/auth.js';

const router = Router();

/**
 * @swagger
 * /api/dashboard/resumen:
 *   get:
 *     summary: Resumen del día (ventas, gastos, utilidad)
 *     tags: [Dashboard]
 *     parameters:
 *       - in: query
 *         name: fecha
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Resumen de totales
 */
router.get('/resumen', authenticate, dashboardController.getResumen);

/**
 * @swagger
 * /api/dashboard/comparativa:
 *   get:
 *     summary: Comparativa ventas vs gastos por sucursal
 *     tags: [Dashboard]
 *     parameters:
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
 *     responses:
 *       200:
 *         description: Datos comparativos
 */
router.get('/comparativa', authenticate, dashboardController.getComparativa);

/**
 * @swagger
 * /api/dashboard/top-gastos:
 *   get:
 *     summary: Top categorías de gasto (fugas)
 *     tags: [Dashboard]
 *     parameters:
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
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *     responses:
 *       200:
 *         description: Top gastos
 */
router.get('/top-gastos', authenticate, dashboardController.getTopGastos);

/**
 * @swagger
 * /api/dashboard/auditoria:
 *   get:
 *     summary: Estado de cierres por mes
 *     tags: [Dashboard]
 *     parameters:
 *       - in: query
 *         name: mes
 *         schema:
 *           type: integer
 *       - in: query
 *         name: anio
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Estado de auditoría
 */
router.get('/auditoria', authenticate, dashboardController.getAuditoria);

/**
 * @swagger
 * /api/dashboard/resumen-semanal:
 *   get:
 *     summary: Resumen semanal con totales por día y sucursal (solo admin)
 *     tags: [Dashboard]
 *     parameters:
 *       - in: query
 *         name: fechaInicio
 *         schema:
 *           type: string
 *           format: date
 *         description: Lunes de la semana (si no se provee, usa semana actual)
 *     responses:
 *       200:
 *         description: Resumen semanal
 */
router.get('/resumen-semanal', authenticate, isAdmin, dashboardController.getResumenSemanal);

export default router;
