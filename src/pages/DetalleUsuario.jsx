import React from "react";

import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip,
  BarChart, Bar, PieChart, Pie, Cell, Legend, ResponsiveContainer
} from "recharts";
import "../styles/main.css";

const DetalleUsuario = ({ data }) => {
  const { userId, fecha, frecuencia, lat, lng } = data;

  // Simulamos datos múltiples con la misma frecuencia
 const datosTiempo = Array.from({ length: 10 }, (_, i) => ({
  tiempo: `T${i + 1}`,
  frecuencia: data.frecuencia + Math.floor(Math.random() * 10 - 5)
}));
  

  const productividadPorHorario = [
    { hora: "7am-10am", valor: 32 },
    { hora: "10am-1pm", valor: 45 },
    { hora: "1pm-4pm", valor: 38 },
    { hora: "4pm-7pm", valor: 22 },
    { hora: "7pm-10pm", valor: 14 }
  ];

  const actividadPorArea = [
    { name: "Área 1", value: 62.5 },
    { name: "Área 2", value: 25 },
    { name: "Área 3", value: 12.5 }
  ];

  const colores = ["#0088FE", "#00C49F", "#FFBB28"];

  return (

<div className="dashboard-grid">

  <div className="content-row">
    <div className="user-info-box">
      <h2>Detalles del Usuario</h2>
      <p><strong>User ID:</strong> {userId}</p>
      <p><strong>Fecha:</strong> {fecha}</p>
      <p><strong>Frecuencia:</strong> {frecuencia} lpm</p>
      <p><strong>Ubicación:</strong> {lat}, {lng}</p>
    </div>

    <div className="grafica-line">
      <h3>Frecuencia Cardíaca</h3>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={datosTiempo}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="tiempo" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="frecuencia" stroke="#ff4d4f" />
        </LineChart>
      </ResponsiveContainer>
    </div>

    <div className="grafica-bar">
      <h3>Productividad por Horario</h3>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={productividadPorHorario}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="hora" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="valor" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>

  <div className="grafica-pie">
    <h3>Actividad por Área</h3>
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={actividadPorArea}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={70}
          label
        >
          {actividadPorArea.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colores[index % colores.length]} />
          ))}
        </Pie>
        <Legend />
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  </div>
</div>


  );
};

export default DetalleUsuario;
