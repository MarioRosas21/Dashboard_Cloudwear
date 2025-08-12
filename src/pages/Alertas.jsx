import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import "../styles/main.css";

const Alertas = ({ usuarios }) => {
  const alertasAltas = [];
  const alertasBajas = [];

  usuarios.forEach((usuario) => {
    Object.values(usuario.datos).forEach((arr) => {
      arr.forEach((dato) => {
        const item = {
          nombre: usuario.nombre,
          area: usuario.area,
          frecuencia: dato.frecuencia,
          fecha: new Date(dato.timestamp).toLocaleString(),
        };
        if (dato.frecuencia > 85) alertasAltas.push(item);
        else if (dato.frecuencia < 60) alertasBajas.push(item);
      });
    });
  });

  return (
    <div className="page-container">
      <h2 className="page-title">Alertas de Ritmo Cardíaco</h2>

      {/* Altas */}
      <div className="chart-section">
        <h3 className="chart-title">Ritmo Cardíaco Alto</h3>
        {alertasAltas.length > 0 ? (
          <div className="chart-box">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={alertasAltas}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nombre" />
                <YAxis />
                <Tooltip
                  formatter={(value, name, props) => [`${value} bpm`, "Frecuencia"]}
                  labelFormatter={(label) => `Usuario: ${label}`}
                />
                <Legend />
                <Bar dataKey="frecuencia" fill="#ff4d4f" name="Altas (>85 bpm)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p>No hay alertas de ritmo alto.</p>
        )}
      </div>

      {/* Bajas */}
      <div className="chart-section">
        <h3 className="chart-title">Ritmo Cardíaco Bajo</h3>
        {alertasBajas.length > 0 ? (
          <div className="chart-box">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={alertasBajas}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nombre" />
                <YAxis />
                <Tooltip
                  formatter={(value, name, props) => [`${value} bpm`, "Frecuencia"]}
                  labelFormatter={(label) => `Usuario: ${label}`}
                />
                <Legend />
                <Bar dataKey="frecuencia" fill="#1890ff" name="Bajas (<60 bpm)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p>No hay alertas de ritmo bajo.</p>
        )}
      </div>
    </div>
  );
};

export default Alertas;
