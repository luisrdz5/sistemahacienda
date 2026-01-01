import { Op } from 'sequelize';
import { Corte, Gasto, Sucursal, Usuario, CategoriaGasto, Producto, PrecioSucursal, Insumo, PrecioInsumo } from '../models/index.js';

/**
 * Constantes de conversión
 * - 1 maleta de masa (50 kg) produce 40 kg de tortilla
 * - 1 bulto de harina (20 kg) produce 35 kg de tortilla
 */
const KG_POR_MALETA = 50;
const KG_TORTILLA_POR_MALETA_MASA = 40;
const KG_TORTILLA_POR_BULTO_HARINA = 35;
const PRECIO_MALETA_DEFAULT = 340; // Precio por defecto si no hay datos

/**
 * Obtener precio actual de la masa (por maleta)
 */
const getPrecioMasa = async () => {
  try {
    const insumoMasa = await Insumo.findOne({
      where: { nombre: 'Masa', activo: true }
    });

    if (!insumoMasa) {
      return PRECIO_MALETA_DEFAULT;
    }

    // Obtener el precio más reciente
    const precioActual = await PrecioInsumo.findOne({
      where: { insumoId: insumoMasa.id },
      order: [['fechaInicio', 'DESC']]
    });

    return precioActual ? parseFloat(precioActual.precio) : PRECIO_MALETA_DEFAULT;
  } catch (error) {
    console.error('Error obteniendo precio de masa:', error);
    return PRECIO_MALETA_DEFAULT;
  }
};

/**
 * Calcular consumo de masa desde los gastos del corte
 * Busca gastos con categoría "Masa" y calcula el consumo basado en el monto pagado
 */
const calcularConsumoMasaDesdeGastos = async (gastos) => {
  // Filtrar gastos de categoría "Masa"
  const gastosMasa = gastos.filter(g =>
    g.categoria?.nombre?.toLowerCase() === 'masa'
  );

  if (gastosMasa.length === 0) {
    return {
      montoMasa: 0,
      kgMasa: 0,
      maletas: 0,
      mediaMaleta: 0,
      cuartoMaleta: 0,
      kgRestantes: 0,
      descripcionConsumo: null
    };
  }

  // Sumar monto total de gastos de masa
  const montoMasa = gastosMasa.reduce((sum, g) => sum + parseFloat(g.monto || 0), 0);

  // Obtener precio de maleta
  const precioMaleta = await getPrecioMasa();
  const precioPorKg = precioMaleta / KG_POR_MALETA;

  // Calcular kg consumidos
  let kgMasa = montoMasa / precioPorKg;

  // Redondear decimales hacia arriba
  kgMasa = Math.ceil(kgMasa * 10) / 10; // Redondear a 1 decimal hacia arriba

  // Desglosar en maletas, medias, cuartos y kg
  let restante = kgMasa;
  const maletas = Math.floor(restante / KG_POR_MALETA);
  restante -= maletas * KG_POR_MALETA;

  const mediaMaleta = Math.floor(restante / 25); // 25 kg = 0.5 maleta
  restante -= mediaMaleta * 25;

  const cuartoMaleta = Math.floor(restante / 12.5); // 12.5 kg = 0.25 maleta
  restante -= cuartoMaleta * 12.5;

  // Kg restantes, redondeados hacia arriba
  const kgRestantes = Math.ceil(restante);

  // Construir descripción legible
  const partes = [];
  if (maletas > 0) partes.push(`${maletas} maleta${maletas > 1 ? 's' : ''}`);
  if (mediaMaleta > 0) partes.push(`${mediaMaleta * 0.5} maleta`);
  if (cuartoMaleta > 0) partes.push(`${cuartoMaleta * 0.25} maleta`);
  if (kgRestantes > 0) partes.push(`${kgRestantes} kg`);

  const descripcionConsumo = partes.length > 0 ? partes.join(' + ') : '0 kg';

  // Calcular consumoMasa en unidades de maleta para el cálculo de ingreso
  const consumoMasaEnMaletas = maletas + (mediaMaleta * 0.5) + (cuartoMaleta * 0.25) + (kgRestantes / KG_POR_MALETA);

  return {
    montoMasa,
    precioMaleta,
    kgMasa,
    maletas,
    mediaMaleta,
    cuartoMaleta,
    kgRestantes,
    descripcionConsumo,
    consumoMasaEnMaletas
  };
};

/**
 * Obtener precio de tortilla para una sucursal
 * Busca el producto "Tortillas" y obtiene el precio personalizado o de lista
 */
const getPrecioTortillaSucursal = async (sucursalId) => {
  try {
    // Buscar producto Tortillas (ID 1 o por nombre)
    const producto = await Producto.findOne({
      where: { nombre: 'Tortillas', activo: true }
    });

    if (!producto) {
      return 25; // Precio por defecto si no existe el producto
    }

    // Buscar precio personalizado para esta sucursal
    const precioSucursal = await PrecioSucursal.findOne({
      where: { sucursalId, productoId: producto.id }
    });

    // Retornar precio sucursal si existe, sino precio de lista
    return precioSucursal
      ? parseFloat(precioSucursal.precio)
      : parseFloat(producto.precioLista);
  } catch (error) {
    console.error('Error obteniendo precio tortilla:', error);
    return 25; // Precio por defecto en caso de error
  }
};

/**
 * Calcular ingreso estimado basado en consumo de masa y harina
 * El consumo de masa se calcula automáticamente desde los gastos de categoría "Masa"
 */
const calcularIngresoEstimado = async (corte, sucursalId, gastos) => {
  const precioTortilla = await getPrecioTortillaSucursal(sucursalId);

  // Calcular consumo de masa desde los gastos
  const consumoMasaData = await calcularConsumoMasaDesdeGastos(gastos);

  const consumoNixta = parseFloat(corte.inventarioNixta || 0);
  const consumoExtra = parseFloat(corte.inventarioExtra || 0);

  // Calcular kg de tortilla producida
  // Para masa: usamos los kg directos (no maletas) para más precisión
  const kgTortillaMasa = (consumoMasaData.kgMasa / KG_POR_MALETA) * KG_TORTILLA_POR_MALETA_MASA;
  const kgTortillaHarina = (consumoNixta + consumoExtra) * KG_TORTILLA_POR_BULTO_HARINA;
  const kgTortillaTotal = kgTortillaMasa + kgTortillaHarina;

  // Ingreso estimado
  const ingresoEstimado = kgTortillaTotal * precioTortilla;

  return {
    precioTortilla,
    // Datos de consumo de masa calculados
    montoMasa: consumoMasaData.montoMasa,
    precioMaleta: consumoMasaData.precioMaleta,
    kgMasa: consumoMasaData.kgMasa,
    descripcionConsumoMasa: consumoMasaData.descripcionConsumo,
    consumoMasaDesglose: {
      maletas: consumoMasaData.maletas,
      mediaMaleta: consumoMasaData.mediaMaleta,
      cuartoMaleta: consumoMasaData.cuartoMaleta,
      kgRestantes: consumoMasaData.kgRestantes
    },
    // Datos de harina
    consumoHarina: consumoNixta + consumoExtra,
    // Producción de tortilla
    kgTortillaMasa,
    kgTortillaHarina,
    kgTortillaTotal,
    ingresoEstimado: Math.round(ingresoEstimado * 100) / 100
  };
};

/**
 * Listar cortes con filtros
 */
export const getAll = async (req, res, next) => {
  try {
    const { fecha, sucursalId, estado } = req.query;
    const where = {};

    if (fecha) where.fecha = fecha;
    if (sucursalId) where.sucursalId = sucursalId;
    if (estado) where.estado = estado;

    // Si es encargado, solo ver su sucursal
    if (req.user.rol === 'encargado' && req.user.sucursalId) {
      where.sucursalId = req.user.sucursalId;
    }

    const cortes = await Corte.findAll({
      where,
      include: [
        { model: Sucursal, as: 'sucursal' },
        { model: Usuario, as: 'usuario', attributes: ['id', 'nombre'] }
      ],
      order: [['fecha', 'DESC']]
    });

    res.json(cortes);
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener corte por ID con gastos
 */
export const getById = async (req, res, next) => {
  try {
    const corte = await Corte.findByPk(req.params.id, {
      include: [
        { model: Sucursal, as: 'sucursal' },
        { model: Usuario, as: 'usuario', attributes: ['id', 'nombre'] },
        {
          model: Gasto,
          as: 'gastos',
          include: [{ model: CategoriaGasto, as: 'categoria' }]
        }
      ]
    });

    if (!corte) {
      return res.status(404).json({ error: 'Corte no encontrado' });
    }

    // Calcular totales
    const totalGastos = corte.gastos.reduce((sum, g) => sum + parseFloat(g.monto), 0);
    const debe = totalGastos - parseFloat(corte.ventaTotal || 0) - parseFloat(corte.efectivoCaja || 0);

    // Calcular ingreso estimado (solo para sucursales físicas)
    const isVirtual = corte.sucursal?.tipo === 'virtual';
    let estimacion = null;

    if (!isVirtual) {
      estimacion = await calcularIngresoEstimado(corte, corte.sucursalId, corte.gastos);
    }

    // Calcular venta real como efectivo + gastos (fórmula del negocio)
    const efectivoCaja = parseFloat(corte.efectivoCaja || 0);
    const ventaCalculada = efectivoCaja + totalGastos;

    res.json({
      ...corte.toJSON(),
      totalGastos,
      debe,
      // Datos de estimación de ingreso (calculados automáticamente)
      ...(estimacion && {
        precioTortilla: estimacion.precioTortilla,
        // Consumo de masa (calculado desde gastos)
        montoMasa: estimacion.montoMasa,
        precioMaleta: estimacion.precioMaleta,
        kgMasa: estimacion.kgMasa,
        descripcionConsumoMasa: estimacion.descripcionConsumoMasa,
        consumoMasaDesglose: estimacion.consumoMasaDesglose,
        // Consumo de harina
        consumoHarina: estimacion.consumoHarina,
        // Producción de tortilla
        kgTortillaMasa: estimacion.kgTortillaMasa,
        kgTortillaHarina: estimacion.kgTortillaHarina,
        kgTortillaTotal: estimacion.kgTortillaTotal,
        ingresoEstimado: estimacion.ingresoEstimado,
        discrepancia: Math.round((ventaCalculada - estimacion.ingresoEstimado) * 100) / 100,
        tieneDiscrepancia: ventaCalculada < estimacion.ingresoEstimado
      })
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Crear corte
 */
export const create = async (req, res, next) => {
  try {
    const { fecha, sucursalId } = req.body;

    if (!fecha || !sucursalId) {
      return res.status(400).json({ error: 'Fecha y sucursal son requeridos' });
    }

    // Verificar que no exista corte para esa fecha y sucursal
    const existente = await Corte.findOne({
      where: { fecha, sucursalId }
    });

    if (existente) {
      return res.status(409).json({
        error: 'Ya existe un corte para esta fecha y sucursal',
        corteId: existente.id
      });
    }

    // Verificar si es sucursal virtual
    const sucursal = await Sucursal.findByPk(sucursalId);
    const isVirtual = sucursal?.tipo === 'virtual';

    const corte = await Corte.create({
      fecha,
      sucursalId,
      usuarioId: req.user.id,
      // Sucursales virtuales no tienen efectivo/ventas/inventario
      efectivoCaja: isVirtual ? null : 0,
      ventaTotal: isVirtual ? null : 0,
      inventarioNixta: isVirtual ? null : 0,
      inventarioExtra: isVirtual ? null : 0
    });

    res.status(201).json(corte);
  } catch (error) {
    next(error);
  }
};

/**
 * Actualizar corte
 */
export const update = async (req, res, next) => {
  try {
    const corte = await Corte.findByPk(req.params.id);

    if (!corte) {
      return res.status(404).json({ error: 'Corte no encontrado' });
    }

    // Admin puede editar cortes completados
    if (corte.estado === 'completado' && req.user.rol !== 'admin') {
      return res.status(400).json({ error: 'No se puede modificar un corte completado' });
    }

    const { efectivoCaja, ventaTotal, inventarioNixta, inventarioExtra, consumoMasa, notas } = req.body;

    // Verificar si es sucursal virtual
    const sucursal = await Sucursal.findByPk(corte.sucursalId);
    const isVirtual = sucursal?.tipo === 'virtual';

    if (isVirtual) {
      // Sucursales virtuales solo pueden actualizar notas
      await corte.update({ notas: notas ?? corte.notas });
    } else {
      await corte.update({
        efectivoCaja: efectivoCaja ?? corte.efectivoCaja,
        ventaTotal: ventaTotal ?? corte.ventaTotal,
        inventarioNixta: inventarioNixta ?? corte.inventarioNixta,
        inventarioExtra: inventarioExtra ?? corte.inventarioExtra,
        consumoMasa: consumoMasa ?? corte.consumoMasa,
        notas: notas ?? corte.notas
      });
    }

    res.json(corte);
  } catch (error) {
    next(error);
  }
};

/**
 * Finalizar corte
 */
export const finalizar = async (req, res, next) => {
  try {
    const corte = await Corte.findByPk(req.params.id, {
      include: [
        { model: Gasto, as: 'gastos' },
        { model: Sucursal, as: 'sucursal' }
      ]
    });

    if (!corte) {
      return res.status(404).json({ error: 'Corte no encontrado' });
    }

    if (corte.estado === 'completado') {
      return res.status(400).json({ error: 'El corte ya está completado' });
    }

    // Calcular ventaTotal = efectivoCaja + totalGastos
    const totalGastos = corte.gastos.reduce((sum, g) => sum + parseFloat(g.monto || 0), 0);
    const isVirtual = corte.sucursal?.tipo === 'virtual';

    const updateData = { estado: 'completado' };

    // Solo calcular ventaTotal para sucursales físicas
    if (!isVirtual) {
      updateData.ventaTotal = parseFloat(corte.efectivoCaja || 0) + totalGastos;
    }

    await corte.update(updateData);

    res.json({ message: 'Corte finalizado', corte });
  } catch (error) {
    next(error);
  }
};

/**
 * Eliminar corte (solo borrador)
 */
export const remove = async (req, res, next) => {
  try {
    const corte = await Corte.findByPk(req.params.id);

    if (!corte) {
      return res.status(404).json({ error: 'Corte no encontrado' });
    }

    // Admin puede eliminar cortes completados
    if (corte.estado === 'completado' && req.user.rol !== 'admin') {
      return res.status(400).json({ error: 'No se puede eliminar un corte completado' });
    }

    // Eliminar gastos asociados
    await Gasto.destroy({ where: { corteId: corte.id } });
    await corte.destroy();

    res.json({ message: 'Corte eliminado' });
  } catch (error) {
    next(error);
  }
};

/**
 * Agregar gasto a un corte
 */
export const addGasto = async (req, res, next) => {
  try {
    const { corteId } = req.params;
    const { categoriaId, descripcion, monto } = req.body;

    const corte = await Corte.findByPk(corteId);
    if (!corte) {
      return res.status(404).json({ error: 'Corte no encontrado' });
    }

    // Admin puede agregar gastos a cortes completados
    if (corte.estado === 'completado' && req.user.rol !== 'admin') {
      return res.status(400).json({ error: 'No se pueden agregar gastos a un corte completado' });
    }

    if (!categoriaId || monto === undefined) {
      return res.status(400).json({ error: 'Categoría y monto son requeridos' });
    }

    const gasto = await Gasto.create({
      corteId,
      categoriaId,
      descripcion,
      monto
    });

    const gastoConCategoria = await Gasto.findByPk(gasto.id, {
      include: [{ model: CategoriaGasto, as: 'categoria' }]
    });

    res.status(201).json(gastoConCategoria);
  } catch (error) {
    next(error);
  }
};
