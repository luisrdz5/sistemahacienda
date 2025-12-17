import sequelize from '../config/database.js';
import Usuario from './Usuario.js';
import Sucursal from './Sucursal.js';
import Corte from './Corte.js';
import Gasto from './Gasto.js';
import CategoriaGasto from './CategoriaGasto.js';
import Empleado from './Empleado.js';

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

export {
  sequelize,
  Usuario,
  Sucursal,
  Corte,
  Gasto,
  CategoriaGasto,
  Empleado
};
