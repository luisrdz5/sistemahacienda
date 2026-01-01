import { PrecioSucursal, Sucursal, Producto } from '../models/index.js';

/**
 * Obtener todos los precios de una sucursal
 */
export const getPreciosBySucursal = async (req, res, next) => {
  try {
    const { sucursalId } = req.params;

    const sucursal = await Sucursal.findByPk(sucursalId);
    if (!sucursal) {
      return res.status(404).json({ error: 'Sucursal no encontrada' });
    }

    // Obtener todos los productos con sus precios de sucursal
    const productos = await Producto.findAll({
      where: { activo: true },
      include: [{
        model: PrecioSucursal,
        as: 'preciosSucursales',
        where: { sucursalId },
        required: false
      }],
      order: [['nombre', 'ASC']]
    });

    // Formatear respuesta
    const preciosFormateados = productos.map(producto => ({
      productoId: producto.id,
      nombre: producto.nombre,
      unidad: producto.unidad,
      precioLista: parseFloat(producto.precioLista),
      precioSucursal: producto.preciosSucursales?.[0]
        ? parseFloat(producto.preciosSucursales[0].precio)
        : null,
      tienePrecioPersonalizado: producto.preciosSucursales?.length > 0
    }));

    res.json({
      sucursalId: parseInt(sucursalId),
      sucursalNombre: sucursal.nombre,
      precios: preciosFormateados
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Establecer o actualizar precio de un producto para una sucursal
 */
export const setPrecioProducto = async (req, res, next) => {
  try {
    const { sucursalId, productoId } = req.params;
    const { precio } = req.body;

    if (precio === undefined || precio === null) {
      return res.status(400).json({ error: 'Precio es requerido' });
    }

    const sucursal = await Sucursal.findByPk(sucursalId);
    if (!sucursal) {
      return res.status(404).json({ error: 'Sucursal no encontrada' });
    }

    const producto = await Producto.findByPk(productoId);
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Upsert: crear o actualizar
    const [precioSucursal, created] = await PrecioSucursal.findOrCreate({
      where: { sucursalId, productoId },
      defaults: { precio }
    });

    if (!created) {
      await precioSucursal.update({ precio });
    }

    res.json({
      sucursalId: parseInt(sucursalId),
      productoId: parseInt(productoId),
      precio: parseFloat(precio),
      created
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Eliminar precio personalizado de un producto para una sucursal
 * (vuelve a usar el precio de lista)
 */
export const removePrecioProducto = async (req, res, next) => {
  try {
    const { sucursalId, productoId } = req.params;

    const deleted = await PrecioSucursal.destroy({
      where: { sucursalId, productoId }
    });

    if (!deleted) {
      return res.status(404).json({ error: 'Precio de sucursal no encontrado' });
    }

    res.json({ message: 'Precio personalizado eliminado, se usará precio de lista' });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualizar múltiples precios de una sucursal a la vez
 */
export const updatePreciosMasivo = async (req, res, next) => {
  try {
    const { sucursalId } = req.params;
    const { precios } = req.body;

    if (!precios || !Array.isArray(precios)) {
      return res.status(400).json({ error: 'Se requiere un array de precios' });
    }

    const sucursal = await Sucursal.findByPk(sucursalId);
    if (!sucursal) {
      return res.status(404).json({ error: 'Sucursal no encontrada' });
    }

    const resultados = [];

    for (const item of precios) {
      const { productoId, precio } = item;

      if (!productoId) continue;

      // Si precio es null o vacío, eliminar el precio personalizado
      if (precio === null || precio === '' || precio === undefined) {
        await PrecioSucursal.destroy({
          where: { sucursalId, productoId }
        });
        resultados.push({ productoId, action: 'removed' });
      } else {
        // Crear o actualizar precio
        const [precioSucursal, created] = await PrecioSucursal.findOrCreate({
          where: { sucursalId, productoId },
          defaults: { precio }
        });

        if (!created) {
          await precioSucursal.update({ precio });
        }

        resultados.push({
          productoId,
          precio: parseFloat(precio),
          action: created ? 'created' : 'updated'
        });
      }
    }

    res.json({
      sucursalId: parseInt(sucursalId),
      resultados
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener el precio efectivo de un producto para una sucursal
 * Jerarquía: PrecioSucursal > PrecioLista
 */
export const getPrecioEfectivo = async (req, res, next) => {
  try {
    const { sucursalId, productoId } = req.params;

    const producto = await Producto.findByPk(productoId);
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Buscar precio de sucursal
    const precioSucursal = await PrecioSucursal.findOne({
      where: { sucursalId, productoId }
    });

    res.json({
      productoId: parseInt(productoId),
      sucursalId: parseInt(sucursalId),
      precio: precioSucursal
        ? parseFloat(precioSucursal.precio)
        : parseFloat(producto.precioLista),
      esPrecioSucursal: !!precioSucursal,
      precioLista: parseFloat(producto.precioLista)
    });
  } catch (error) {
    next(error);
  }
};
