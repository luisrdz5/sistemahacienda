import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import api from '../services/api';
import './Dashboard.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function Dashboard() {
  const [resumen, setResumen] = useState(null);
  const [comparativa, setComparativa] = useState([]);
  const [topGastos, setTopGastos] = useState([]);
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      try {
        const [resumenData, comparativaData, topData] = await Promise.all([
          api.get(`/dashboard/resumen?fecha=${fecha}`),
          api.get(`/dashboard/comparativa?fechaInicio=${fecha}&fechaFin=${fecha}`),
          api.get(`/dashboard/top-gastos?fechaInicio=${fecha}&fechaFin=${fecha}&limit=5`)
        ]);

        setResumen(resumenData);
        setComparativa(comparativaData);
        setTopGastos(topData);
      } catch (error) {
        console.error('Error cargando dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [fecha]);

  const chartData = {
    labels: comparativa.map(c => c.sucursal),
    datasets: [
      {
        label: 'Ventas',
        data: comparativa.map(c => c.ventas),
        backgroundColor: '#22c55e'
      },
      {
        label: 'Gastos',
        data: comparativa.map(c => c.gastos),
        backgroundColor: '#ef4444'
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => '$' + value.toLocaleString()
        }
      }
    }
  };

  if (loading) {
    return <div className="loading">Cargando dashboard...</div>;
  }

  return (
    <div className="page">
      <div className="page-header dashboard-header">
        <h1 className="page-title">Tablero Principal</h1>
        <input
          type="date"
          className="form-input date-filter"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
        />
      </div>

      <div className="dashboard-stats">
        <div className="stat-card stat-ventas">
          <span className="stat-label">Ventas Totales (Hoy)</span>
          <span className="stat-value">${resumen?.ventasTotales?.toLocaleString() || 0}</span>
        </div>
        <div className="stat-card stat-gastos">
          <span className="stat-label">Gastos Operativos</span>
          <span className="stat-value">${resumen?.gastosOperativos?.toLocaleString() || 0}</span>
        </div>
        <div className="stat-card stat-utilidad">
          <span className="stat-label">Utilidad Neta Estimada</span>
          <span className="stat-value">${resumen?.utilidadNeta?.toLocaleString() || 0}</span>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-chart card">
          <h2>Comparativa por Sucursal (Ventas vs. Gastos)</h2>
          <div className="chart-container">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>

        <div className="dashboard-fugas card">
          <h2>Top Fugas (Gastos Principales)</h2>
          <ul className="fugas-list">
            {topGastos.map((gasto, index) => (
              <li key={index} className="fuga-item">
                <span className="fuga-rank">{index + 1}.</span>
                <span className="fuga-name">{gasto.categoria}</span>
                <span className="fuga-amount">${gasto.total?.toLocaleString()}</span>
              </li>
            ))}
            {topGastos.length === 0 && (
              <li className="empty-message">No hay gastos registrados</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
