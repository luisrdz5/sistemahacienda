import { Producto } from '../models/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Eliminar archivo de imagen
 */
const eliminarImagen = (imagenUrl) => {
  if (!imagenUrl) return;
  try {
    const filename = path.basename(imagenUrl);
    const filepath = path.join(__dirname, '../../uploads/productos', filename);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
  } catch (error) {
    console.error('Error al eliminar imagen:', error);
  }
};

/**
 * Listar productos
 */
export const getAll = async (req, res, next) => {
  try {
    const { activo } = req.query;
    const where = {};

    if (activo !== undefined) {
      where.activo = activo === 'true';
    }

    const productos = await Producto.findAll({
      where,
      order: [['nombre', 'ASC']]
    });

    res.json(productos);
  } catch (error) {
    next(error);
  }
};

/**
 * Crear producto
 */
export const create = async (req, res, next) => {
  try {
    const { nombre, unidad, precioLista } = req.body;

    if (!nombre || !precioLista) {
      return res.status(400).json({ error: 'Nombre y precio son requeridos' });
    }

    // Si se subió una imagen, generar la URL
    let imagenUrl = null;
    if (req.file) {
      imagenUrl = `/uploads/productos/${req.file.filename}`;
    }

    const producto = await Producto.create({
      nombre,
      unidad: unidad || 'kg',
      precioLista,
      imagenUrl
    });

    res.status(201).json(producto);
  } catch (error) {
    // Si hay error, eliminar la imagen subida
    if (req.file) {
      eliminarImagen(`/uploads/productos/${req.file.filename}`);
    }
    next(error);
  }
};

/**
 * Obtener producto por ID
 */
export const getById = async (req, res, next) => {
  try {
    const producto = await Producto.findByPk(req.params.id);

    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json(producto);
  } catch (error) {
    next(error);
  }
};

/**
 * Actualizar producto
 */
export const update = async (req, res, next) => {
  try {
    const producto = await Producto.findByPk(req.params.id);

    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const { nombre, unidad, precioLista, activo } = req.body;

    // Si se subió nueva imagen, eliminar la anterior
    let imagenUrl = producto.imagenUrl;
    if (req.file) {
      // Eliminar imagen anterior si existe
      eliminarImagen(producto.imagenUrl);
      imagenUrl = `/uploads/productos/${req.file.filename}`;
    }

    await producto.update({
      nombre: nombre ?? producto.nombre,
      unidad: unidad ?? producto.unidad,
      precioLista: precioLista ?? producto.precioLista,
      imagenUrl,
      activo: activo !== undefined ? activo === 'true' || activo === true : producto.activo
    });

    res.json(producto);
  } catch (error) {
    // Si hay error, eliminar la imagen subida
    if (req.file) {
      eliminarImagen(`/uploads/productos/${req.file.filename}`);
    }
    next(error);
  }
};

/**
 * Eliminar imagen de producto
 */
export const deleteImagen = async (req, res, next) => {
  try {
    const producto = await Producto.findByPk(req.params.id);

    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    if (producto.imagenUrl) {
      eliminarImagen(producto.imagenUrl);
      await producto.update({ imagenUrl: null });
    }

    res.json({ message: 'Imagen eliminada correctamente', producto });
  } catch (error) {
    next(error);
  }
};

/**
 * Eliminar producto (soft delete)
 */
export const remove = async (req, res, next) => {
  try {
    const producto = await Producto.findByPk(req.params.id);

    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    await producto.update({ activo: false });
    res.json({ message: 'Producto desactivado correctamente' });
  } catch (error) {
    next(error);
  }
};
