-- Extensiones útiles
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Mensaje de inicialización
DO $$
BEGIN
    RAISE NOTICE 'Base de datos hacienda_db inicializada correctamente';
END $$;
