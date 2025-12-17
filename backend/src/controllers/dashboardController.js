import { Op, fn, col, literal } from 'sequelize';
import { Corte, Gasto, Sucursal, CategoriaGasto, sequelize } from '../models/index.js';

/**
 * Resumen del día
 */
export const getResumen = async (req, res, next) => {
  try {
    const fecha = req.query.fecha || new Date().toISOString().split('T')[0];

    const cortes = await Corte.findAll({
      where: { fecha },
      include: [{ model: Gasto, as: 'gastos' }]
    });

    let ventasTotales = 0;
    let gastosOperativos = 0;

    cortes.forEach(corte => {
      ventasTotales += parseFloat(corte.ventaTotal || 0);
      corte.gastos.forEach(gasto => {
        gastosOperativos += parseFloat(gasto.monto || 0);
      });
    });

    const utilidadNeta = ventasTotales - gastosOperativos;

    res.json({
      fecha,
      ventasTotales,
      gastosOperativos,
      utilidadNeta,
      cortesCount: cortes.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Comparativa ventas vs gastos por sucursal
 */
export const getComparativa = async (req, res, next) => {
  try {
    const fechaInicio = req.query.fechaInicio || new Date().toISOString().split('T')[0];
    const fechaFin = req.query.fechaFin || fechaInicio;

    const sucursales = await Sucursal.findAll({
      where: { activa: true }
    });

    const comparativa = await Promise.all(
      sucursales.map(async (sucursal) => {
        const cortes = await Corte.findAll({
          where: {
            sucursalId: sucursal.id,
            fecha: { [Op.between]: [fechaInicio, fechaFin] }
          },
          include: [{ model: Gasto, as: 'gastos' }]
        });

        let ventas = 0;
        let gastos = 0;

        cortes.forEach(corte => {
          ventas += parseFloat(corte.ventaTotal || 0);
          corte.gastos.forEach(gasto => {
            gastos += parseFloat(gasto.monto || 0);
          });
        });

        return {
          sucursalId: sucursal.id,
          sucursal: sucursal.nombre,
          ventas,
          gastos,
          utilidad: ventas - gastos
        };
      })
    );

    res.json(comparativa);
  } catch (error) {
    next(error);
  }
};

/**
 * Top categorías de gasto (fugas)
 */
export const getTopGastos = async (req, res, next) => {
  try {
    const fechaInicio = req.query.fechaInicio || new Date().toISOString().split('T')[0];
    const fechaFin = req.query.fechaFin || fechaInicio;
    const limit = parseInt(req.query.limit) || 5;

    const topGastos = await Gasto.findAll({
      attributes: [
        'categoriaId',
        [fn('SUM', col('monto')), 'total']
      ],
      include: [
        {
          model: Corte,
          as: 'corte',
          attributes: [],
          where: {
            fecha: { [Op.between]: [fechaInicio, fechaFin] }
          }
        },
        {
          model: CategoriaGasto,
          as: 'categoria',
          attributes: ['nombre', 'tipo']
        }
      ],
      group: ['Gasto.categoria_id', 'categoria.id'],
      order: [[literal('total'), 'DESC']],
      limit
    });

    res.json(topGastos.map(g => ({
      categoria: g.categoria.nombre,
      tipo: g.categoria.tipo,
      total: parseFloat(g.dataValues.total)
    })));
  } catch (error) {
    next(error);
  }
};

/**
 * Estado de auditoría (cierres por mes)
 */
export const getAuditoria = async (req, res, next) => {
  try {
    const mes = parseInt(req.query.mes) || new Date().getMonth() + 1;
    const anio = parseInt(req.query.anio) || new Date().getFullYear();
    const sucursalId = req.query.sucursalId ? parseInt(req.query.sucursalId) : null;

    // Primer y último día del mes
    const primerDia = new Date(anio, mes - 1, 1);
    const ultimoDia = new Date(anio, mes, 0);

    const whereSucursales = { activa: true };
    if (sucursalId) {
      whereSucursales.id = sucursalId;
    }

    const sucursales = await Sucursal.findAll({
      where: whereSucursales
    });

    // Obtener todos los cortes del mes con gastos
    const whereCortes = {
      fecha: {
        [Op.between]: [
          primerDia.toISOString().split('T')[0],
          ultimoDia.toISOString().split('T')[0]
        ]
      }
    };
    if (sucursalId) {
      whereCortes.sucursalId = sucursalId;
    }

    const cortes = await Corte.findAll({
      where: whereCortes,
      include: [{ model: Gasto, as: 'gastos' }]
    });

    // Crear mapa de cortes por fecha y sucursal
    const cortesMap = {};
    cortes.forEach(corte => {
      const key = `${corte.fecha}_${corte.sucursalId}`;
      const totalGastos = corte.gastos.reduce((sum, g) => sum + parseFloat(g.monto || 0), 0);
      cortesMap[key] = {
        id: corte.id,
        estado: corte.estado,
        ventaTotal: parseFloat(corte.ventaTotal || 0),
        efectivoCaja: parseFloat(corte.efectivoCaja || 0),
        totalGastos,
        utilidad: parseFloat(corte.ventaTotal || 0) - totalGastos
      };
    });

    // Generar estado por día
    const diasDelMes = ultimoDia.getDate();
    const auditoria = [];

    // Estadísticas del mes
    let totalVentas = 0;
    let totalGastos = 0;
    let cortesCompletados = 0;
    let cortesBorrador = 0;
    let cortesPendientes = 0;

    for (let dia = 1; dia <= diasDelMes; dia++) {
      const fecha = new Date(anio, mes - 1, dia);
      const fechaStr = fecha.toISOString().split('T')[0];

      const estadoPorSucursal = sucursales.map(sucursal => {
        const key = `${fechaStr}_${sucursal.id}`;
        const corteData = cortesMap[key];

        if (corteData) {
          if (corteData.estado === 'completado') {
            cortesCompletados++;
            totalVentas += corteData.ventaTotal;
            totalGastos += corteData.totalGastos;
          } else {
            cortesBorrador++;
          }
        } else {
          cortesPendientes++;
        }

        return {
          sucursalId: sucursal.id,
          sucursal: sucursal.nombre,
          estado: corteData?.estado || 'pendiente',
          corteId: corteData?.id || null,
          ventaTotal: corteData?.ventaTotal || 0,
          efectivoCaja: corteData?.efectivoCaja || 0,
          totalGastos: corteData?.totalGastos || 0,
          utilidad: corteData?.utilidad || 0
        };
      });

      auditoria.push({
        fecha: fechaStr,
        diaSemana: fecha.toLocaleDateString('es-MX', { weekday: 'long' }),
        sucursales: estadoPorSucursal
      });
    }

    const totalCortes = cortesCompletados + cortesBorrador + cortesPendientes;
    const porcentajeCompletitud = totalCortes > 0
      ? Math.round((cortesCompletados / totalCortes) * 100)
      : 0;

    res.json({
      mes,
      anio,
      estadisticas: {
        totalVentas,
        totalGastos,
        utilidadNeta: totalVentas - totalGastos,
        cortesCompletados,
        cortesBorrador,
        cortesPendientes,
        porcentajeCompletitud
      },
      auditoria
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Resumen semanal con totales por día y sucursal
 */
export const getResumenSemanal = async (req, res, next) => {
  try {
    // Calcular inicio de semana (lunes)
    let fechaInicio = req.query.fechaInicio;
    if (!fechaInicio) {
      const today = new Date();
      const dayOfWeek = today.getDay();
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const monday = new Date(today);
      monday.setDate(today.getDate() - diff);
      fechaInicio = monday.toISOString().split('T')[0];
    }

    const startDate = new Date(fechaInicio);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    const fechaFin = endDate.toISOString().split('T')[0];

    // Obtener sucursales activas
    const sucursales = await Sucursal.findAll({
      where: { activa: true },
      order: [['tipo', 'ASC'], ['nombre', 'ASC']]
    });

    // Obtener cortes de la semana
    const cortes = await Corte.findAll({
      where: {
        fecha: { [Op.between]: [fechaInicio, fechaFin] }
      },
      include: [
        { model: Gasto, as: 'gastos' },
        { model: Sucursal, as: 'sucursal' }
      ]
    });

    // Crear mapa de cortes
    const cortesMap = {};
    cortes.forEach(corte => {
      const key = `${corte.fecha}_${corte.sucursalId}`;
      const totalGastos = corte.gastos.reduce((sum, g) => sum + parseFloat(g.monto || 0), 0);
      cortesMap[key] = {
        id: corte.id,
        estado: corte.estado,
        ventaTotal: parseFloat(corte.ventaTotal || 0),
        efectivoCaja: parseFloat(corte.efectivoCaja || 0),
        totalGastos,
        tipo: corte.sucursal.tipo
      };
    });

    // Generar datos por día
    const dias = [];
    const totalesSemanales = { ventas: 0, gastos: 0, utilidad: 0 };

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const fechaStr = currentDate.toISOString().split('T')[0];

      let ventasDia = 0;
      let gastosDia = 0;

      const sucursalesData = sucursales.map(sucursal => {
        const key = `${fechaStr}_${sucursal.id}`;
        const corteData = cortesMap[key];

        const venta = sucursal.tipo === 'virtual' ? 0 : (corteData?.ventaTotal || 0);
        const gasto = corteData?.totalGastos || 0;

        ventasDia += venta;
        gastosDia += gasto;

        return {
          sucursalId: sucursal.id,
          nombre: sucursal.nombre,
          tipo: sucursal.tipo,
          venta,
          gastos: gasto,
          utilidad: venta - gasto,
          estado: corteData?.estado || 'pendiente'
        };
      });

      dias.push({
        fecha: fechaStr,
        diaSemana: currentDate.toLocaleDateString('es-MX', { weekday: 'long' }),
        sucursales: sucursalesData,
        totales: {
          ventas: ventasDia,
          gastos: gastosDia,
          utilidad: ventasDia - gastosDia
        }
      });

      totalesSemanales.ventas += ventasDia;
      totalesSemanales.gastos += gastosDia;
    }

    totalesSemanales.utilidad = totalesSemanales.ventas - totalesSemanales.gastos;

    res.json({
      semana: {
        inicio: fechaInicio,
        fin: fechaFin
      },
      dias,
      totalesSemanales,
      sucursales: sucursales.map(s => ({ id: s.id, nombre: s.nombre, tipo: s.tipo }))
    });
  } catch (error) {
    next(error);
  }
};
