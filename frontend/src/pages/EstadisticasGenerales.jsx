import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  RadialBarChart, RadialBar,
  ResponsiveContainer
} from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AA00FF"];
const AREAS = ["Calidad", "Producción", "Logística", "RH", "Mantenimiento"];

const EstadisticasGenerales = ({ usuarios }) => {
  // Inicializaciones seguras
  const clasificacion = {};
  const estadoUsuarios = {};
  AREAS.forEach(area => {
    clasificacion[area] = { Alta: 0, Normal: 0, Baja: 0 };
    estadoUsuarios[area] = { Activo: 0, Inactivo: 0, Alerta: 0 };
  });

  const movimiento = {};
  const conteoMov = {};
  const optimos = {};
  const totales = {};
  const distribucion = {};
  const variabilidad = {};

  usuarios.forEach((u) => {
    distribucion[u.area] = (distribucion[u.area] || 0) + 1;

    Object.values(u.datos).forEach((arr) => {
      arr.forEach((d) => {
        const f = d.frecuencia;
        const total = Math.sqrt(d.x ** 2 + d.y ** 2 + d.z ** 2);

        // Clasificación frecuencia
        let cat = "Normal";
        if (f < 60) cat = "Baja";
        else if (f > 100) cat = "Alta";
        if (clasificacion[u.area]) {
          clasificacion[u.area][cat]++;
        }

        // Movimiento
        movimiento[u.area] = (movimiento[u.area] || 0) + total;
        conteoMov[u.area] = (conteoMov[u.area] || 0) + 1;

        // Óptimos
        totales[u.area] = (totales[u.area] || 0) + 1;
        if (f >= 60 && f <= 100 && total >= 9.5 && total <= 11.5) {
          optimos[u.area] = (optimos[u.area] || 0) + 1;
        }

        // Variabilidad para análisis posterior
        variabilidad[u.area] = variabilidad[u.area] || [];
        variabilidad[u.area].push(f);
      });
    });
  });

  // Dataset 1: Clasificación Frecuencia
  const dataClasificacion = AREAS.map(area => ({
    area,
    Alta: clasificacion[area].Alta,
    Normal: clasificacion[area].Normal,
    Baja: clasificacion[area].Baja,
  }));

  // Dataset 2: Movimiento Promedio
  const dataMovimiento = AREAS.map(area => ({
    area,
    movimiento: +(movimiento[area] / (conteoMov[area] || 1)).toFixed(2),
  }));

  // Dataset 3: Empleados Óptimos
  const dataOptimos = AREAS.map(area => ({
    name: area,
    Totales: totales[area] || 0,
    Óptimos: optimos[area] || 0,
  }));

  // Dataset 4: Distribución Personal
  const dataDistribucion = AREAS.map(area => ({
    name: area,
    value: distribucion[area] || 0,
  }));

  // Dataset 5: Variabilidad frecuencia por área
  const dataVariabilidad = AREAS.map(area => {
    const freqs = variabilidad[area] || [];
    const promedio = freqs.reduce((a, b) => a + b, 0) / (freqs.length || 1);
    const desviacion = Math.sqrt(
      freqs.reduce((acc, val) => acc + (val - promedio) ** 2, 0) / (freqs.length || 1)
    );
    return {
      area,
      desviacion: +desviacion.toFixed(2),
    };
  });

  // Dataset 6: Balance de cargas (porcentajes de óptimos)
  const dataBalance = AREAS.map(area => {
    const total = totales[area] || 1;
    const opt = optimos[area] || 0;
    return {
      area,
      porcentaje: +((opt / total) * 100).toFixed(1),
    };
  });

  return (
    <div style={{ padding: "20px", backgroundColor: "#fff", borderRadius: "10px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}>
      <h2>Estadísticas Generales de Productividad</h2>

      {/* 1. Distribución por área */}
      <h4>Distribución de Personal por Área</h4>
      <PieChart width={300} height={300}>
        <Pie data={dataDistribucion} cx="50%" cy="50%" outerRadius={100} dataKey="value" label>
          {dataDistribucion.map((entry, i) => (
            <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>

      {/* 2. Clasificación frecuencia cardíaca */}
      <h4>Clasificación de Frecuencia Cardíaca por Área</h4>
      <RadarChart cx={200} cy={200} outerRadius={120} width={400} height={400} data={dataClasificacion}>
        <PolarGrid />
        <PolarAngleAxis dataKey="area" />
        <PolarRadiusAxis />
        <Radar name="Alta" dataKey="Alta" stroke="#ff4d4f" fill="#ff4d4f" fillOpacity={0.6} />
        <Radar name="Normal" dataKey="Normal" stroke="#36cfc9" fill="#36cfc9" fillOpacity={0.6} />
        <Radar name="Baja" dataKey="Baja" stroke="#faad14" fill="#faad14" fillOpacity={0.6} />
        <Legend />
        <Tooltip />
      </RadarChart>

      {/* 3. Movimiento promedio */}
      <h4>Movimiento Promedio (m/s²) por Área</h4>
      <BarChart width={500} height={300} data={dataMovimiento} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="area" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="movimiento" fill="#1890ff" />
      </BarChart>

      {/* 4. Empleados óptimos */}
      <h4>Empleados en Estado Óptimo por Área</h4>
      <RadialBarChart width={400} height={300} innerRadius="20%" outerRadius="90%" barSize={20} data={dataOptimos}>
        <RadialBar minAngle={15} label={{ position: "insideStart", fill: "#fff" }} background clockWise dataKey="Óptimos" />
        <Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right" />
        <Tooltip />
      </RadialBarChart>

      {/* 5. Variabilidad frecuencia */}
      <h4>Variabilidad de Frecuencia Cardíaca por Área</h4>
      <BarChart width={500} height={300} data={dataVariabilidad} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="area" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="desviacion" fill="#8884d8" />
      </BarChart>

      {/* 6. Balance de productividad */}
      <h4>Balance de Productividad (Óptimos %)</h4>
      <PieChart width={400} height={300}>
        <Pie data={dataBalance} dataKey="porcentaje" nameKey="area" cx="50%" cy="50%" outerRadius={100} label>
          {dataBalance.map((entry, i) => (
            <Cell key={`cell-b-${i}`} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => `${value}%`} />
        <Legend />
      </PieChart>
    </div>
  );
};

export default EstadisticasGenerales;
