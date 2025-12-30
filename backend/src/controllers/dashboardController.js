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
    // Para caja chica acumulada, usar la fecha de hoy si es el mes actual, o el último día del mes si es un mes pasado
    const hoy = new Date();
    hoy.setHours(12, 0, 0, 0);
    const fechaParaCajaChica = (anio === hoy.getFullYear() && mes === hoy.getMonth() + 1)
      ? getLocalDateString(hoy)
      : getLocalDateString(ultimoDia);

    const whereSucursales = { activa: true };
    if (sucursalId) {
      whereSucursales.id = sucursalId;
    }

    const sucursales = await Sucursal.findAll({
      where: whereSucursales
    });

    // ========================================
    // CALCULAR CAJA CHICA ACUMULADA (histórico)
    // Incluye TODOS los cortes (no filtra por estado)
    // ========================================
    const todosLosCortes = await Corte.findAll({
      where: {
        fecha: { [Op.lte]: fechaParaCajaChica }
      },
      include: [
        { model: Gasto, as: 'gastos' },
        { model: Sucursal, as: 'sucursal' }
      ]
    });

    let ventasAcumuladas = 0;
    let gastosAcumulados = 0;

    todosLosCortes.forEach(corte => {
      const totalGastosCorte = corte.gastos.reduce((sum, g) => sum + parseFloat(g.monto || 0), 0);
      const efectivoCaja = parseFloat(corte.efectivoCaja || 0);

      if (corte.sucursal?.tipo === 'fisica') {
        // Venta = efectivoCaja + gastos (fórmula del negocio)
        ventasAcumuladas += efectivoCaja + totalGastosCorte;
      }
      // Sumar TODOS los gastos (de físicas y virtuales)
      gastosAcumulados += totalGastosCorte;
    });

    // Caja Chica acumulada = Ventas - Gastos (histórico total)
    const cajaChicaAcumulada = ventasAcumuladas - gastosAcumulados;

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
      include: [
        {
          model: Gasto,
          as: 'gastos',
          include: [{ model: CategoriaGasto, as: 'categoria' }]
        },
        { model: Sucursal, as: 'sucursal' }
      ]
    });

    // Crear mapa de cortes por fecha y sucursal
    const cortesMap = {};
    cortes.forEach(corte => {
      const key = `${corte.fecha}_${corte.sucursalId}`;
      const totalGastos = corte.gastos.reduce((sum, g) => sum + parseFloat(g.monto || 0), 0);
      const efectivoCaja = parseFloat(corte.efectivoCaja || 0);
      // Calcular venta como efectivoCaja + gastos (fórmula del negocio)
      const ventaCalculada = efectivoCaja + totalGastos;

      // Detalle de gastos individuales
      const gastosDetalle = corte.gastos.map(g => ({
        id: g.id,
        descripcion: g.descripcion,
        monto: parseFloat(g.monto || 0),
        categoria: g.categoria?.nombre || 'Sin categoría'
      }));

      // Solo las sucursales físicas tienen ventas
      const esVirtual = corte.sucursal?.tipo === 'virtual';
      const ventaReal = esVirtual ? 0 : ventaCalculada;

      cortesMap[key] = {
        id: corte.id,
        estado: corte.estado,
        ventaTotal: ventaReal,
        efectivoCaja: esVirtual ? 0 : efectivoCaja,
        totalGastos,
        utilidad: esVirtual ? -totalGastos : efectivoCaja, // virtuales: solo gasto, físicas: efectivo es utilidad
        gastos: gastosDetalle,
        tipoSucursal: corte.sucursal?.tipo
      };
    });

    // Generar estado por día
    const diasDelMes = ultimoDia.getDate();
    const auditoria = [];

    // Estadísticas del mes
    let totalVentas = 0;
    let totalGastos = 0;
    let totalAhorro = 0;
    let totalNomina = 0;
    let totalGastosGlobales = 0;
    let cortesCompletados = 0;
    let cortesBorrador = 0;
    let cortesPendientes = 0;

    // Encontrar IDs de las sucursales virtuales
    const sucursalAhorro = sucursales.find(s => s.nombre === 'Ahorro');
    const sucursalNomina = sucursales.find(s => s.nombre === 'Nómina');
    const sucursalGastosGlobales = sucursales.find(s => s.nombre === 'Gastos Globales');
    const ahorroId = sucursalAhorro?.id;
    const nominaId = sucursalNomina?.id;
    const gastosGlobalesId = sucursalGastosGlobales?.id;

    for (let dia = 1; dia <= diasDelMes; dia++) {
      const fecha = new Date(anio, mes - 1, dia);
      const fechaStr = fecha.toISOString().split('T')[0];

      const estadoPorSucursal = sucursales.map(sucursal => {
        const key = `${fechaStr}_${sucursal.id}`;
        const corteData = cortesMap[key];

        if (corteData) {
          // Contar estado
          if (corteData.estado === 'completado') {
            cortesCompletados++;
          } else {
            cortesBorrador++;
          }

          // Sumar ventas y gastos de TODOS los cortes (no solo completados)
          totalVentas += corteData.ventaTotal;
          totalGastos += corteData.totalGastos;

          // Sumar gastos por tipo de sucursal virtual
          if (sucursal.id === ahorroId) {
            totalAhorro += corteData.totalGastos;
          } else if (sucursal.id === nominaId) {
            totalNomina += corteData.totalGastos;
          } else if (sucursal.id === gastosGlobalesId) {
            totalGastosGlobales += corteData.totalGastos;
          }
        } else {
          cortesPendientes++;
        }

        return {
          sucursalId: sucursal.id,
          sucursal: sucursal.nombre,
          tipo: sucursal.tipo,
          estado: corteData?.estado || 'pendiente',
          corteId: corteData?.id || null,
          ventaTotal: corteData?.ventaTotal || 0,
          efectivoCaja: corteData?.efectivoCaja || 0,
          totalGastos: corteData?.totalGastos || 0,
          utilidad: corteData?.utilidad || 0,
          gastos: corteData?.gastos || []
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

    // Utilidad Neta del mes = Ventas - Gastos del mes
    const utilidadNeta = totalVentas - totalGastos;

    res.json({
      mes,
      anio,
      estadisticas: {
        totalVentas,
        totalGastos,
        utilidadNeta,
        totalCajaChica: cajaChicaAcumulada, // Saldo acumulado histórico
        totalAhorro,
        totalNomina,
        totalGastosGlobales,
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
// Función helper para formatear fecha local sin problemas de zona horaria
function getLocalDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const getResumenSemanal = async (req, res, next) => {
  try {
    // Calcular inicio de semana (domingo)
    let fechaInicio = req.query.fechaInicio;
    if (!fechaInicio) {
      const today = new Date();
      today.setHours(12, 0, 0, 0); // Evitar problemas de zona horaria
      const dayOfWeek = today.getDay(); // 0 = domingo
      const sunday = new Date(today);
      sunday.setDate(today.getDate() - dayOfWeek);
      fechaInicio = getLocalDateString(sunday);
    }

    // Usar T12:00:00 para evitar problemas de zona horaria
    const startDate = new Date(fechaInicio + 'T12:00:00');
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    const fechaFin = getLocalDateString(endDate);

    // Calcular saldo acumulado de semanas anteriores (caja chica)
    // Buscamos todos los cortes desde el inicio de los tiempos hasta el día anterior al inicio de esta semana
    const diaAnterior = new Date(startDate);
    diaAnterior.setDate(diaAnterior.getDate() - 1);
    const fechaAnterior = getLocalDateString(diaAnterior);

    // Obtener sucursales activas
    const sucursales = await Sucursal.findAll({
      where: { activa: true },
      order: [['tipo', 'ASC'], ['nombre', 'ASC']]
    });

    // Calcular saldo acumulado de semanas anteriores (utilidad acumulada)
    // Usando EXACTAMENTE la misma lógica que el resumen semanal:
    // - Ventas = suma de (efectivoCaja + gastos) de sucursales físicas
    // - Gastos = suma de todos los gastos de todas las sucursales
    // - Utilidad = Ventas - Gastos
    // NO filtramos por estado para que coincida con el resumen semanal
    const cortesAnteriores = await Corte.findAll({
      where: {
        fecha: { [Op.lte]: fechaAnterior }
      },
      include: [
        { model: Gasto, as: 'gastos' },
        { model: Sucursal, as: 'sucursal' }
      ]
    });

    let ventasAnteriores = 0;
    let gastosAnteriores = 0;

    cortesAnteriores.forEach(corte => {
      const totalGastos = corte.gastos.reduce((sum, g) => sum + parseFloat(g.monto || 0), 0);
      const efectivoCaja = parseFloat(corte.efectivoCaja || 0);

      if (corte.sucursal.tipo === 'fisica') {
        // Venta = efectivoCaja + gastos (fórmula del negocio)
        ventasAnteriores += efectivoCaja + totalGastos;
      }
      // Sumar TODOS los gastos (de físicas y virtuales)
      gastosAnteriores += totalGastos;
    });

    const saldoAnterior = ventasAnteriores - gastosAnteriores;

    // Obtener cortes de la semana con detalle de gastos
    const cortes = await Corte.findAll({
      where: {
        fecha: { [Op.between]: [fechaInicio, fechaFin] }
      },
      include: [
        {
          model: Gasto,
          as: 'gastos',
          include: [{ model: CategoriaGasto, as: 'categoria' }]
        },
        { model: Sucursal, as: 'sucursal' }
      ]
    });

    // Crear mapa de cortes
    const cortesMap = {};
    cortes.forEach(corte => {
      const key = `${corte.fecha}_${corte.sucursalId}`;
      const totalGastos = corte.gastos.reduce((sum, g) => sum + parseFloat(g.monto || 0), 0);
      const efectivoCaja = parseFloat(corte.efectivoCaja || 0);
      // Calcular venta como efectivoCaja + gastos (la fórmula correcta del negocio)
      const ventaCalculada = efectivoCaja + totalGastos;

      // Detalle de gastos individuales
      const gastosDetalle = corte.gastos.map(g => ({
        id: g.id,
        descripcion: g.descripcion,
        monto: parseFloat(g.monto || 0),
        categoria: g.categoria?.nombre || 'Sin categoría'
      }));

      cortesMap[key] = {
        id: corte.id,
        estado: corte.estado,
        ventaTotal: ventaCalculada,
        efectivoCaja,
        totalGastos,
        tipo: corte.sucursal.tipo,
        gastos: gastosDetalle
      };
    });

    // Generar datos por día
    const dias = [];
    const totalesSemanales = { ventas: 0, gastos: 0, utilidad: 0 };

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const fechaStr = getLocalDateString(currentDate);

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
          estado: corteData?.estado || 'pendiente',
          gastosDetalle: corteData?.gastos || []
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

    // Calcular saldo nuevo (saldo anterior + utilidad de la semana)
    const saldoNuevo = saldoAnterior + totalesSemanales.utilidad;

    res.json({
      semana: {
        inicio: fechaInicio,
        fin: fechaFin
      },
      dias,
      totalesSemanales,
      cajaChica: {
        saldoAnterior,
        utilidadSemana: totalesSemanales.utilidad,
        saldoNuevo
      },
      sucursales: sucursales.map(s => ({ id: s.id, nombre: s.nombre, tipo: s.tipo }))
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Resumen mensual con KPIs consolidados
 */
export const getResumenMensual = async (req, res, next) => {
  try {
    const mes = parseInt(req.query.mes) || new Date().getMonth() + 1;
    const anio = parseInt(req.query.anio) || new Date().getFullYear();

    const primerDia = new Date(anio, mes - 1, 1);
    const ultimoDia = new Date(anio, mes, 0);
    const ultimoDiaStr = getLocalDateString(ultimoDia);

    const sucursales = await Sucursal.findAll({ where: { activa: true } });

    // ========================================
    // CALCULAR CAJA CHICA ACUMULADA (histórico)
    // Incluye TODOS los cortes
    // ========================================
    const todosLosCortes = await Corte.findAll({
      where: {
        fecha: { [Op.lte]: ultimoDiaStr }
      },
      include: [
        { model: Gasto, as: 'gastos' },
        { model: Sucursal, as: 'sucursal' }
      ]
    });

    let ventasAcumuladas = 0;
    let gastosAcumulados = 0;

    todosLosCortes.forEach(corte => {
      const totalGastosCorte = corte.gastos.reduce((sum, g) => sum + parseFloat(g.monto || 0), 0);
      const efectivoCaja = parseFloat(corte.efectivoCaja || 0);

      if (corte.sucursal?.tipo === 'fisica') {
        ventasAcumuladas += efectivoCaja + totalGastosCorte;
      }
      gastosAcumulados += totalGastosCorte;
    });

    const cajaChicaAcumulada = ventasAcumuladas - gastosAcumulados;

    // Obtener cortes del mes (para estadísticas del mes) - TODOS los cortes
    const cortes = await Corte.findAll({
      where: {
        fecha: {
          [Op.between]: [
            primerDia.toISOString().split('T')[0],
            ultimoDia.toISOString().split('T')[0]
          ]
        }
      },
      include: [
        { model: Gasto, as: 'gastos', include: [{ model: CategoriaGasto, as: 'categoria' }] },
        { model: Sucursal, as: 'sucursal' }
      ]
    });

    let totalVentas = 0;
    let totalGastos = 0;
    let totalAhorro = 0;
    const gastosPorCategoria = {};
    const ventasPorSucursal = {};
    const ventasPorDia = {};

    const sucursalAhorro = sucursales.find(s => s.nombre === 'Ahorro');

    cortes.forEach(corte => {
      const totalGastosCorte = corte.gastos.reduce((sum, g) => sum + parseFloat(g.monto || 0), 0);
      const efectivoCaja = parseFloat(corte.efectivoCaja || 0);
      const ventaCalculada = corte.sucursal.tipo === 'fisica' ? efectivoCaja + totalGastosCorte : 0;

      totalVentas += ventaCalculada;
      totalGastos += totalGastosCorte;

      if (corte.sucursalId === sucursalAhorro?.id) {
        totalAhorro += totalGastosCorte;
      }

      // Agrupar por sucursal
      if (!ventasPorSucursal[corte.sucursalId]) {
        ventasPorSucursal[corte.sucursalId] = {
          nombre: corte.sucursal.nombre,
          tipo: corte.sucursal.tipo,
          ventas: 0,
          gastos: 0
        };
      }
      ventasPorSucursal[corte.sucursalId].ventas += ventaCalculada;
      ventasPorSucursal[corte.sucursalId].gastos += totalGastosCorte;

      // Agrupar gastos por categoría
      corte.gastos.forEach(gasto => {
        const catNombre = gasto.categoria?.nombre || 'Sin categoría';
        if (!gastosPorCategoria[catNombre]) {
          gastosPorCategoria[catNombre] = 0;
        }
        gastosPorCategoria[catNombre] += parseFloat(gasto.monto || 0);
      });

      // Ventas por día (para gráfico)
      if (!ventasPorDia[corte.fecha]) {
        ventasPorDia[corte.fecha] = 0;
      }
      ventasPorDia[corte.fecha] += ventaCalculada;
    });

    // Top categorías de gasto
    const topGastos = Object.entries(gastosPorCategoria)
      .map(([categoria, total]) => ({ categoria, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    // Sucursales ordenadas
    const sucursalesData = Object.values(ventasPorSucursal)
      .sort((a, b) => b.ventas - a.ventas);

    // Datos por día para gráfico
    const diasData = [];
    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
      const fecha = new Date(anio, mes - 1, dia).toISOString().split('T')[0];
      diasData.push({
        fecha,
        dia,
        ventas: ventasPorDia[fecha] || 0
      });
    }

    res.json({
      mes,
      anio,
      nombreMes: primerDia.toLocaleDateString('es-MX', { month: 'long' }),
      estadisticas: {
        totalVentas,
        totalGastos,
        utilidadNeta: totalVentas - totalGastos,
        totalCajaChica: cajaChicaAcumulada, // Saldo acumulado histórico
        totalAhorro,
        promedioVentaDiaria: totalVentas / ultimoDia.getDate(),
        cortesCompletados: cortes.length
      },
      topGastos,
      sucursales: sucursalesData,
      ventasPorDia: diasData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Resumen anual con comparativa por mes
 */
export const getResumenAnual = async (req, res, next) => {
  try {
    const anio = parseInt(req.query.anio) || new Date().getFullYear();
    const ultimoDiaAnio = `${anio}-12-31`;

    const sucursales = await Sucursal.findAll({ where: { activa: true } });
    const sucursalAhorro = sucursales.find(s => s.nombre === 'Ahorro');

    // ========================================
    // CALCULAR CAJA CHICA ACUMULADA (histórico)
    // Incluye TODOS los cortes
    // ========================================
    const todosLosCortes = await Corte.findAll({
      where: {
        fecha: { [Op.lte]: ultimoDiaAnio }
      },
      include: [
        { model: Gasto, as: 'gastos' },
        { model: Sucursal, as: 'sucursal' }
      ]
    });

    let ventasAcumuladas = 0;
    let gastosAcumulados = 0;

    todosLosCortes.forEach(corte => {
      const totalGastosCorte = corte.gastos.reduce((sum, g) => sum + parseFloat(g.monto || 0), 0);
      const efectivoCaja = parseFloat(corte.efectivoCaja || 0);

      if (corte.sucursal?.tipo === 'fisica') {
        ventasAcumuladas += efectivoCaja + totalGastosCorte;
      }
      gastosAcumulados += totalGastosCorte;
    });

    const cajaChicaAcumulada = ventasAcumuladas - gastosAcumulados;

    // Obtener cortes del año (para estadísticas del año) - TODOS los cortes
    const cortes = await Corte.findAll({
      where: {
        fecha: {
          [Op.between]: [`${anio}-01-01`, `${anio}-12-31`]
        }
      },
      include: [
        { model: Gasto, as: 'gastos' },
        { model: Sucursal, as: 'sucursal' }
      ]
    });

    // Inicializar datos por mes
    const meses = [];
    for (let m = 1; m <= 12; m++) {
      meses.push({
        mes: m,
        nombreMes: new Date(anio, m - 1, 1).toLocaleDateString('es-MX', { month: 'short' }),
        ventas: 0,
        gastos: 0,
        utilidad: 0,
        cajaChica: 0,
        ahorro: 0
      });
    }

    let totalAnual = { ventas: 0, gastos: 0, cajaChica: 0, ahorro: 0 };

    cortes.forEach(corte => {
      const mesCorte = new Date(corte.fecha + 'T12:00:00').getMonth(); // 0-indexed
      const totalGastosCorte = corte.gastos.reduce((sum, g) => sum + parseFloat(g.monto || 0), 0);
      const efectivoCaja = parseFloat(corte.efectivoCaja || 0);
      const ventaCalculada = corte.sucursal.tipo === 'fisica' ? efectivoCaja + totalGastosCorte : 0;

      meses[mesCorte].ventas += ventaCalculada;
      meses[mesCorte].gastos += totalGastosCorte;
      meses[mesCorte].utilidad = meses[mesCorte].ventas - meses[mesCorte].gastos;

      if (corte.sucursal.tipo === 'fisica') {
        meses[mesCorte].cajaChica += efectivoCaja;
      }

      if (corte.sucursalId === sucursalAhorro?.id) {
        meses[mesCorte].ahorro += totalGastosCorte;
      }

      totalAnual.ventas += ventaCalculada;
      totalAnual.gastos += totalGastosCorte;
      totalAnual.cajaChica += corte.sucursal.tipo === 'fisica' ? efectivoCaja : 0;
      totalAnual.ahorro += corte.sucursalId === sucursalAhorro?.id ? totalGastosCorte : 0;
    });

    // Calcular comparativa con año anterior
    const anioAnterior = anio - 1;
    const cortesAnterior = await Corte.findAll({
      where: {
        fecha: { [Op.between]: [`${anioAnterior}-01-01`, `${anioAnterior}-12-31`] }
      },
      include: [
        { model: Gasto, as: 'gastos' },
        { model: Sucursal, as: 'sucursal' }
      ]
    });

    let totalAnterior = { ventas: 0, gastos: 0 };
    cortesAnterior.forEach(corte => {
      const totalGastosCorte = corte.gastos.reduce((sum, g) => sum + parseFloat(g.monto || 0), 0);
      const efectivoCaja = parseFloat(corte.efectivoCaja || 0);
      const ventaCalculada = corte.sucursal.tipo === 'fisica' ? efectivoCaja + totalGastosCorte : 0;
      totalAnterior.ventas += ventaCalculada;
      totalAnterior.gastos += totalGastosCorte;
    });

    const crecimientoVentas = totalAnterior.ventas > 0
      ? ((totalAnual.ventas - totalAnterior.ventas) / totalAnterior.ventas * 100).toFixed(1)
      : null;

    res.json({
      anio,
      estadisticas: {
        totalVentas: totalAnual.ventas,
        totalGastos: totalAnual.gastos,
        utilidadNeta: totalAnual.ventas - totalAnual.gastos,
        totalCajaChica: cajaChicaAcumulada, // Saldo acumulado histórico
        totalAhorro: totalAnual.ahorro,
        promedioMensual: totalAnual.ventas / 12
      },
      comparativaAnterior: {
        anio: anioAnterior,
        ventasAnterior: totalAnterior.ventas,
        crecimientoVentas: crecimientoVentas ? parseFloat(crecimientoVentas) : null
      },
      meses
    });
  } catch (error) {
    next(error);
  }
};
