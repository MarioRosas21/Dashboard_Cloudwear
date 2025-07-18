import React from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

const areas = ["Área 1", "Área 2", "Área 3", "Área 4"];

const topProductivos = [
  { nombre: "Juan", valor: 95 },
  { nombre: "Ana", valor: 90 },
  { nombre: "Luis", valor: 88 },
  { nombre: "María", valor: 85 },
  { nombre: "Carlos", valor: 83 }
];

const topPausas = [
  { nombre: "Pedro", valor: 30 },
  { nombre: "Sofía", valor: 28 },
  { nombre: "Jorge", valor: 27 },
  { nombre: "Lucía", valor: 25 },
  { nombre: "Andrés", valor: 22 }
];

const tiempoActivoVsPausas = [
  { trabajador: "Juan", activo: 80, pausas: 20 },
  { trabajador: "Ana", activo: 75, pausas: 25 },
  { trabajador: "Luis", activo: 70, pausas: 30 },
  { trabajador: "María", activo: 85, pausas: 15 },
  { trabajador: "Carlos", activo: 90, pausas: 10 }
];

const productividadPorArea = [
  { name: "Área 1", value: 40 },
  { name: "Área 2", value: 30 },
  { name: "Área 3", value: 20 },
  { name: "Área 4", value: 10 }
];

const colores = ["#8884d8", "#82ca9d", "#ffc658", "#ff4d4f"];

const Particular = () => {
  return (
    <div className="main-container">
      <h1>Productividad General</h1>

      {/* Áreas */}
      <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginBottom: "30px" }}>
        {areas.map((area, index) => (
          <span
            key={index}
            style={{
              background: "#fff",
              padding: "10px 16px",
              borderRadius: "20px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
              fontWeight: "500",
              color: "#2c3e50"
            }}
          >
            {area}
          </span>
        ))}
      </div>

      <div className="dashboard-grid">
        {/* Top 5 más productivos */}
        <div className="grafica grafica-bar">
          <h3>Top 5 más productivos</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topProductivos}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="nombre" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="valor" fill="#00c49f" barSize={30} radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top 5 con más pausas */}
        <div className="grafica grafica-bar">
          <h3>Top 5 con más pausas</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topPausas}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="nombre" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="valor" fill="#ff7300" barSize={30} radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tiempo activo vs Pausas */}
        <div className="grafica grafica-line">
          <h3>Tiempo activo vs Pausas por trabajador</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={tiempoActivoVsPausas}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="trabajador" />
              <YAxis />
              <Tooltip />
              <Legend verticalAlign="top" height={36} />
              <Line type="monotone" dataKey="activo" stroke="#00b894" strokeWidth={3} />
              <Line type="monotone" dataKey="pausas" stroke="#d63031" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pastel de productividad por área */}
        <div className="grafica grafica-pie">
          <h3>Productividad por Área</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={productividadPorArea}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label
              >
                {productividadPorArea.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colores[index % colores.length]} />
                ))}
              </Pie>
              <Legend verticalAlign="bottom" height={36} />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Particular;
