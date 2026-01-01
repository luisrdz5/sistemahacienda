import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

// Pages
import Login from './pages/Login';
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
    return <Navigate to="/captura" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(usuario.rol)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  const { usuario } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={
        usuario ? <Navigate to={usuario.rol === 'admin' ? '/dashboard' : '/captura'} replace /> : <Login />
      } />

      <Route path="/" element={
        <PrivateRoute>
          <Layout />
        </PrivateRoute>
      }>
        <Route index element={<Navigate to={usuario?.rol === 'admin' ? '/dashboard' : '/captura'} replace />} />
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
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
