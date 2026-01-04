import { Router } from 'express';
import authRoutes from './auth.js';
import sucursalesRoutes from './sucursales.js';
import cortesRoutes from './cortes.js';
import gastosRoutes from './gastos.js';
import categoriasRoutes from './categorias.js';
import empleadosRoutes from './empleados.js';
import dashboardRoutes from './dashboard.js';
import usuariosRoutes from './usuarios.js';
import productosRoutes from './productos.js';
import clientesRoutes from './clientes.js';
import pedidosRoutes from './pedidos.js';
import cortesPedidosRoutes from './cortesPedidos.js';
import insumosRoutes from './insumos.js';
import clientePortalRoutes from './clientePortal.js';
import pagosRoutes from './pagos.js';

const router = Router();

// Health check para Docker/Load Balancer
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.use('/auth', authRoutes);
router.use('/sucursales', sucursalesRoutes);
router.use('/cortes', cortesRoutes);
router.use('/gastos', gastosRoutes);
router.use('/categorias', categoriasRoutes);
router.use('/empleados', empleadosRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/usuarios', usuariosRoutes);
router.use('/productos', productosRoutes);
router.use('/clientes', clientesRoutes);
router.use('/pedidos', pedidosRoutes);
router.use('/cortes-pedidos', cortesPedidosRoutes);
router.use('/insumos', insumosRoutes);
router.use('/cliente', clientePortalRoutes);
router.use('/pagos', pagosRoutes);

export default router;
