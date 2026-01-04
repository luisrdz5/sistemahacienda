import { useContext, useMemo } from 'react';
import AuthContext from '../context/AuthContext';

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }

  // Helper para verificar si el usuario tiene alguno de los roles especificados
  const tieneAlgunRol = useMemo(() => {
    return (rolesPermitidos) => {
      const { usuario } = context;
      if (!usuario) return false;

      // Verificar rol principal
      if (rolesPermitidos.includes(usuario.rol)) {
        return true;
      }

      // Verificar roles adicionales
      if (usuario.todosLosRoles && Array.isArray(usuario.todosLosRoles)) {
        return usuario.todosLosRoles.some(r => rolesPermitidos.includes(r));
      }

      return false;
    };
  }, [context.usuario]);

  return {
    ...context,
    tieneAlgunRol
  };
}
