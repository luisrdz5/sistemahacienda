import { Sequelize } from 'sequelize';
import dns from 'dns';
import config from './index.js';

// Forzar IPv4 globalmente
dns.setDefaultResultOrder('ipv4first');

const isProduction = config.nodeEnv === 'production';
const isSupabase = config.db.host.includes('supabase.co');

const sequelize = new Sequelize(
  config.db.name,
  config.db.user,
  config.db.password,
  {
    host: config.db.host,
    port: config.db.port,
    dialect: 'postgres',
    logging: config.nodeEnv === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true
    },
    dialectOptions: {
      // SSL requerido para Supabase
      ...(isSupabase && {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      })
    }
  }
);

export default sequelize;
