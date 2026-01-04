import express from 'express';
import { authenticate, canManagePedidos } from '../middlewares/auth.js';
import {
  registrarPagoCliente,
  getHistorialPagosCliente,
  getResumenDeudaCliente,
  getClientesConDeuda
} from '../controllers/pagosController.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Listar clientes con deuda (para selector)
router.get('/clientes-deuda', getClientesConDeuda);

// Obtener resumen de deuda de un cliente
router.get('/cliente/:clienteId/resumen', getResumenDeudaCliente);

// Obtener historial de pagos de un cliente
router.get('/cliente/:clienteId/historial', getHistorialPagosCliente);

// Registrar pago (a cliente o pedido específico)
router.post('/', canManagePedidos, registrarPagoCliente);

export default router;
