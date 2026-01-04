import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

// Pages
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Captura from './pages/Captura';
import Dashboard from './pages/Dashboard';
import Auditoria from './pages/Auditoria';
import Usuarios from './pages/Usuarios';
import Sucursales from './pages/Sucursales';
import Categorias from './pages/Categorias';
import Empleados from './pages/Empleados';
import ResumenSemanal from './pages/ResumenSemanal';
import ResumenMensual from './pages/ResumenMensual';
import ResumenAnual from './pages/ResumenAnual';
import Productos from './pages/Productos';
import Clientes from './pages/Clientes';
import Pedidos from './pages/Pedidos';
import CortePedidos from './pages/CortePedidos';
import Insumos from './pages/Insumos';
import RepartosPendientes from './pages/RepartosPendientes';
import ClientesDeudores from './pages/ClientesDeudores';
import ClientesPendientes from './pages/ClientesPendientes';

// Portal de Clientes
import LoginCliente from './pages/LoginCliente';
import RegisterCliente from './pages/RegisterCliente';
import DashboardCliente from './pages/cliente/DashboardCliente';
import CatalogoCliente from './pages/cliente/CatalogoCliente';
import HistorialCliente from './pages/cliente/HistorialCliente';
import PerfilCliente from './pages/cliente/PerfilCliente';

// Layout
import Layout from './components/layout/Layout';

function PrivateRoute({ children, adminOnly = false, allowedRoles = [] }) {
  const { usuario, loading } = useAuth();

  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && usuario.rol !== 'admin') {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(usuario.rol)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function PrivateClienteRoute({ children }) {
  const { usuario, loading } = useAuth();

  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  if (!usuario) {
    return <Navigate to="/login-cliente" replace />;
  }

  if (usuario.rol !== 'cliente') {
    return <Navigate to="/" replace />;
  }

  return children;
}

// Determina la ruta por defecto según el rol del usuario
function getDefaultRoute(rol) {
  switch (rol) {
    case 'admin':
      return '/dashboard';
    case 'repartidor':
    case 'administrador_repartidor':
      return '/pedidos';
    default:
      return '/captura';
  }
}

function App() {
  const { usuario } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={
        usuario ? <Navigate to={getDefaultRoute(usuario.rol)} replace /> : <Login />
      } />
      <Route path="/forgot-password" element={
        usuario ? <Navigate to="/" replace /> : <ForgotPassword />
      } />
      <Route path="/reset-password/:token" element={
        usuario ? <Navigate to="/" replace /> : <ResetPassword />
      } />

      <Route path="/" element={
        <PrivateRoute>
          <Layout />
        </PrivateRoute>
      }>
        <Route index element={<Navigate to={getDefaultRoute(usuario?.rol)} replace />} />
        <Route path="captura" element={<Captura />} />
        <Route path="auditoria" element={<Auditoria />} />
        <Route path="dashboard" element={
          <PrivateRoute adminOnly>
            <Dashboard />
          </PrivateRoute>
        } />
        <Route path="usuarios" element={
          <PrivateRoute adminOnly>
            <Usuarios />
          </PrivateRoute>
        } />
        <Route path="sucursales" element={
          <PrivateRoute adminOnly>
            <Sucursales />
          </PrivateRoute>
        } />
        <Route path="categorias" element={
          <PrivateRoute adminOnly>
            <Categorias />
          </PrivateRoute>
        } />
        <Route path="empleados" element={
          <PrivateRoute adminOnly>
            <Empleados />
          </PrivateRoute>
        } />
        <Route path="resumen-semanal" element={
          <PrivateRoute adminOnly>
            <ResumenSemanal />
          </PrivateRoute>
        } />
        <Route path="resumen-mensual" element={
          <PrivateRoute allowedRoles={['admin', 'administrador_repartidor']}>
            <ResumenMensual />
          </PrivateRoute>
        } />
        <Route path="resumen-anual" element={
          <PrivateRoute allowedRoles={['admin', 'administrador_repartidor']}>
            <ResumenAnual />
          </PrivateRoute>
        } />
        <Route path="productos" element={
          <PrivateRoute allowedRoles={['admin', 'administrador_repartidor']}>
            <Productos />
          </PrivateRoute>
        } />
        <Route path="clientes" element={
          <PrivateRoute allowedRoles={['admin', 'administrador_repartidor']}>
            <Clientes />
          </PrivateRoute>
        } />
        <Route path="insumos" element={
          <PrivateRoute adminOnly>
            <Insumos />
          </PrivateRoute>
        } />
        <Route path="pedidos" element={
          <PrivateRoute allowedRoles={['admin', 'administrador_repartidor', 'repartidor']}>
            <Pedidos />
          </PrivateRoute>
        } />
        <Route path="corte-pedidos" element={
          <PrivateRoute allowedRoles={['admin', 'administrador_repartidor', 'repartidor']}>
            <CortePedidos />
          </PrivateRoute>
        } />
        <Route path="repartos-pendientes" element={
          <PrivateRoute allowedRoles={['admin', 'administrador_repartidor', 'encargado']}>
            <RepartosPendientes />
          </PrivateRoute>
        } />
        <Route path="clientes-deudores" element={
          <PrivateRoute allowedRoles={['admin', 'administrador_repartidor', 'repartidor']}>
            <ClientesDeudores />
          </PrivateRoute>
        } />
        <Route path="clientes-pendientes" element={
          <PrivateRoute allowedRoles={['admin', 'administrador_repartidor']}>
            <ClientesPendientes />
          </PrivateRoute>
        } />
      </Route>

      {/* Portal de Clientes - Rutas públicas */}
      <Route path="/login-cliente" element={
        usuario?.rol === 'cliente' ? <Navigate to="/cliente/dashboard" replace /> : <LoginCliente />
      } />
      <Route path="/register-cliente" element={
        usuario?.rol === 'cliente' ? <Navigate to="/cliente/dashboard" replace /> : <RegisterCliente />
      } />

      {/* Portal de Clientes - Rutas protegidas */}
      <Route path="/cliente/dashboard" element={
        <PrivateClienteRoute>
          <DashboardCliente />
        </PrivateClienteRoute>
      } />
      <Route path="/cliente/catalogo" element={
        <PrivateClienteRoute>
          <CatalogoCliente />
        </PrivateClienteRoute>
      } />
      <Route path="/cliente/historial" element={
        <PrivateClienteRoute>
          <HistorialCliente />
        </PrivateClienteRoute>
      } />
      <Route path="/cliente/perfil" element={
        <PrivateClienteRoute>
          <PerfilCliente />
        </PrivateClienteRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
