import { Router } from 'express';
import * as gastosController from '../controllers/gastosController.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

/**
 * @swagger
 * /api/gastos/{id}:
 *   put:
 *     summary: Actualizar gasto
 *     tags: [Gastos]
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
 *             properties:
 *               categoriaId:
 *                 type: integer
 *               descripcion:
 *                 type: string
 *               monto:
 *                 type: number
 *     responses:
 *       200:
 *         description: Gasto actualizado
 */
router.put('/:id', authenticate, gastosController.update);

/**
 * @swagger
 * /api/gastos/{id}:
 *   delete:
 *     summary: Eliminar gasto
 *     tags: [Gastos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Gasto eliminado
 */
router.delete('/:id', authenticate, gastosController.remove);

export default router;
