import { Router } from 'express';
import authRoutes from './auth.js';
import sucursalesRoutes from './sucursales.js';
import cortesRoutes from './cortes.js';
import gastosRoutes from './gastos.js';
import categoriasRoutes from './categorias.js';
import empleadosRoutes from './empleados.js';
import dashboardRoutes from './dashboard.js';
import usuariosRoutes from './usuarios.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/sucursales', sucursalesRoutes);
router.use('/cortes', cortesRoutes);
router.use('/gastos', gastosRoutes);
router.use('/categorias', categoriasRoutes);
router.use('/empleados', empleadosRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/usuarios', usuariosRoutes);

export default router;
