import sequelize from '../config/database.js';
import Usuario from './Usuario.js';
import Sucursal from './Sucursal.js';
import Corte from './Corte.js';
import Gasto from './Gasto.js';
import CategoriaGasto from './CategoriaGasto.js';
import Empleado from './Empleado.js';
import Producto from './Producto.js';
import Cliente from './Cliente.js';
import PrecioCliente from './PrecioCliente.js';
import Pedido from './Pedido.js';
import DetallePedido from './DetallePedido.js';
import CortePedidos from './CortePedidos.js';
import PrecioSucursal from './PrecioSucursal.js';
import Insumo from './Insumo.js';
import PrecioInsumo from './PrecioInsumo.js';

// Asociaciones

// Usuario - Sucursal
Usuario.belongsTo(Sucursal, { foreignKey: 'sucursalId', as: 'sucursal' });
Sucursal.hasMany(Usuario, { foreignKey: 'sucursalId', as: 'usuarios' });

// Corte - Sucursal
Corte.belongsTo(Sucursal, { foreignKey: 'sucursalId', as: 'sucursal' });
Sucursal.hasMany(Corte, { foreignKey: 'sucursalId', as: 'cortes' });

// Corte - Usuario
Corte.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'usuario' });
Usuario.hasMany(Corte, { foreignKey: 'usuarioId', as: 'cortes' });

// Gasto - Corte
Gasto.belongsTo(Corte, { foreignKey: 'corteId', as: 'corte' });
Corte.hasMany(Gasto, { foreignKey: 'corteId', as: 'gastos' });

// Gasto - CategoriaGasto
Gasto.belongsTo(CategoriaGasto, { foreignKey: 'categoriaId', as: 'categoria' });
CategoriaGasto.hasMany(Gasto, { foreignKey: 'categoriaId', as: 'gastos' });

// Empleado - Sucursal
Empleado.belongsTo(Sucursal, { foreignKey: 'sucursalId', as: 'sucursal' });
Sucursal.hasMany(Empleado, { foreignKey: 'sucursalId', as: 'empleados' });

// Cliente - PrecioCliente
Cliente.hasMany(PrecioCliente, { foreignKey: 'clienteId', as: 'precios' });
PrecioCliente.belongsTo(Cliente, { foreignKey: 'clienteId', as: 'cliente' });

// Producto - PrecioCliente
Producto.hasMany(PrecioCliente, { foreignKey: 'productoId', as: 'preciosClientes' });
PrecioCliente.belongsTo(Producto, { foreignKey: 'productoId', as: 'producto' });

// Sucursal - PrecioSucursal
Sucursal.hasMany(PrecioSucursal, { foreignKey: 'sucursalId', as: 'precios' });
PrecioSucursal.belongsTo(Sucursal, { foreignKey: 'sucursalId', as: 'sucursal' });

// Producto - PrecioSucursal
Producto.hasMany(PrecioSucursal, { foreignKey: 'productoId', as: 'preciosSucursales' });
PrecioSucursal.belongsTo(Producto, { foreignKey: 'productoId', as: 'producto' });

// Pedido - Cliente
Pedido.belongsTo(Cliente, { foreignKey: 'clienteId', as: 'cliente' });
Cliente.hasMany(Pedido, { foreignKey: 'clienteId', as: 'pedidos' });

// Pedido - Usuario (repartidor)
Pedido.belongsTo(Usuario, { foreignKey: 'repartidorId', as: 'repartidor' });
Usuario.hasMany(Pedido, { foreignKey: 'repartidorId', as: 'pedidosAsignados' });

// Pedido - Usuario (creador)
Pedido.belongsTo(Usuario, { foreignKey: 'creadoPorId', as: 'creadoPor' });
Usuario.hasMany(Pedido, { foreignKey: 'creadoPorId', as: 'pedidosCreados' });

// Pedido - DetallePedido
Pedido.hasMany(DetallePedido, { foreignKey: 'pedidoId', as: 'detalles' });
DetallePedido.belongsTo(Pedido, { foreignKey: 'pedidoId', as: 'pedido' });

// DetallePedido - Producto
DetallePedido.belongsTo(Producto, { foreignKey: 'productoId', as: 'producto' });
Producto.hasMany(DetallePedido, { foreignKey: 'productoId', as: 'detallesPedidos' });

// CortePedidos - Usuario (repartidor)
CortePedidos.belongsTo(Usuario, { foreignKey: 'repartidorId', as: 'repartidor' });
Usuario.hasMany(CortePedidos, { foreignKey: 'repartidorId', as: 'cortesPedidos' });

// Insumo - PrecioInsumo
Insumo.hasMany(PrecioInsumo, { foreignKey: 'insumoId', as: 'precios' });
PrecioInsumo.belongsTo(Insumo, { foreignKey: 'insumoId', as: 'insumo' });

export {
  sequelize,
  Usuario,
  Sucursal,
  Corte,
  Gasto,
  CategoriaGasto,
  Empleado,
  Producto,
  Cliente,
  PrecioCliente,
  PrecioSucursal,
  Pedido,
  DetallePedido,
  CortePedidos,
  Insumo,
  PrecioInsumo
};
