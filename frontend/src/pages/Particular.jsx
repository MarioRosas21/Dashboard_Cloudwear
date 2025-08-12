import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const colores = ["#8884d8", "#82ca9d", "#ffc658", "#ff4d4f"];

const Particular = ({ datosUsuarios = [] }) => {
  if (!Array.isArray(datosUsuarios) || datosUsuarios.length === 0) {
    return (
      <div className="main-container">
        <h2>Estadísticas Particulares</h2>
        <p style={{ padding: 20, textAlign: "center", color: "#999" }}>
          No hay datos disponibles para mostrar estadísticas particulares.
        </p>
      </div>
    );
  }

  // Agrupación por zona
  const porZonas = datosUsuarios.reduce((acc, user) => {
    const zona = user.zona || "Desconocida";
    acc[zona] = acc[zona] ? acc[zona] + 1 : 1;
    return acc;
  }, {});

  const data = Object.entries(porZonas).map(([name, value]) => ({ name, value }));

  return (
    <div className="main-container">
      <h2>Estadísticas Particulares</h2>

      <div className="dashboard-grid">

        {/* Pastel de usuarios por zona */}
        <div className="grafica grafica-pie">
          <h3>Usuarios por Zona</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label
              >
                {data.map((entry, index) => (
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
