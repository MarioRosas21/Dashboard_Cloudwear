import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import "../styles/main.css"; // Asegúrate de importar los estilos

const ritmoAlto = [
  { nombre: "Juan", valor: 135 },
  { nombre: "Ana", valor: 130 },
  { nombre: "Luis", valor: 128 },
  { nombre: "Carlos", valor: 125 }
];

const ritmoBajo = [
  { nombre: "Pedro", valor: 55 },
  { nombre: "Lucía", valor: 52 },
  { nombre: "Sofía", valor: 50 },
  { nombre: "Andrés", valor: 48 }
];

const Alertas = () => {
  return (
    <div className="page-container">
      <h2 className="page-title">Alertas de Ritmo Cardíaco</h2>

      <div className="chart-section">
        <h3 className="chart-title">Ritmo Cardíaco Alto</h3>
        <div className="chart-box">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={ritmoAlto}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nombre" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="valor" fill="#ff4d4f" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="chart-section">
        <h3 className="chart-title">Ritmo Cardíaco Bajo</h3>
        <div className="chart-box">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={ritmoBajo}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nombre" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="valor" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Alertas;
