import React from "react";
import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip,
  BarChart, Bar, ResponsiveContainer
} from "recharts";
import "../styles/main.css";

const DetalleUsuario = ({ usuario }) => {
  if (!usuario) return null;

  const ultimosDatos = usuario.datos
    ? Object.values(usuario.datos).flat().slice(-10)
    : [];

  const dataChartFreq = ultimosDatos.map((d) => ({
    tiempo: new Date(d.timestamp).toLocaleTimeString(),
    frecuencia: d.frecuencia,
  }));

  const dataChartAccel = ultimosDatos.map((d) => {
    const aceleracion = Math.sqrt(d.x ** 2 + d.y ** 2 + d.z ** 2).toFixed(2);
    return {
      tiempo: new Date(d.timestamp).toLocaleTimeString(),
      aceleracion: parseFloat(aceleracion),
    };
  });

  const freqActual = ultimosDatos.length
    ? ultimosDatos[ultimosDatos.length - 1].frecuencia
    : null;

  let estado = "Normal", colorEstado = "green";
  if (freqActual !== null) {
    if (freqActual < 60) {
      estado = "Baja";
      colorEstado = "orange";
    } else if (freqActual > 100) {
      estado = "Alta";
      colorEstado = "red";
    }
  }

  const actividadPromedio = ultimosDatos.length
    ? (
        ultimosDatos.reduce((acc, d) => acc + Math.sqrt(d.x ** 2 + d.y ** 2 + d.z ** 2), 0) /
        ultimosDatos.length
      ).toFixed(2)
    : "N/A";

  const ultimaFecha = ultimosDatos.length
    ? new Date(ultimosDatos[ultimosDatos.length - 1].timestamp).toLocaleString()
    : "No disponible";

  return (
    <div className="dashboard-grid">
      <div className="content-row">
        <div className="user-info-box">
          <h2>Detalles del Usuario</h2>
          <p><strong>Nombre:</strong> {usuario.nombre}</p>
          <p><strong>Área:</strong> {usuario.area}</p>
          <p><strong>Puesto:</strong> {usuario.puesto}</p>
          <p><strong>Email:</strong> {usuario.email || "No disponible"}</p>
          <p><strong>Teléfono:</strong> {usuario.telefono || "No disponible"}</p>
          <p><strong>Última actualización:</strong> {ultimaFecha}</p>
          <p><strong>Coordenadas:</strong> {usuario.lat?.toFixed(5)}, {usuario.lng?.toFixed(5)}</p>
          <p><strong>Estado Cardíaco:</strong> <span style={{ color: colorEstado }}>{estado}</span></p>
          <p><strong>Frecuencia Actual:</strong> {freqActual ? `${freqActual} bpm` : "Sin datos"}</p>
          <p><strong>Actividad Promedio:</strong> {actividadPromedio} m/s²</p>
        </div>

        <div className="grafica-line">
          <h3>Frecuencia Cardíaca</h3>
          {dataChartFreq.length > 1 ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={dataChartFreq}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="tiempo" />
                <YAxis domain={['auto', 'auto']} />
                <Tooltip />
                <Line type="monotone" dataKey="frecuencia" stroke="#ff4d4f" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p>No hay suficientes datos para mostrar gráfica.</p>
          )}
        </div>

        <div className="grafica-bar">
          <h3>Movimiento del Usuario (Aceleración)</h3>
          {dataChartAccel.length > 1 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={dataChartAccel}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="tiempo" />
                <YAxis unit=" m/s²" />
                <Tooltip />
                <Bar dataKey="aceleracion" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p>No hay suficientes datos para mostrar gráfica.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetalleUsuario;
