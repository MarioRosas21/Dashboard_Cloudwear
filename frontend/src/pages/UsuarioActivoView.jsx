import { useEffect, useState } from "react";
import { LoadScript, GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";
import { io } from "socket.io-client";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import api from "../services/api";

const baseURL = api.defaults.baseURL;
const socketURL = baseURL.endsWith("/api") ? baseURL.slice(0, -4) : baseURL;
const socket = io(socketURL);

const containerStyle = {
  width: "100%",
  height: "300px",
  borderRadius: 8,
  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
};

const iconVerde = "http://maps.google.com/mapfiles/ms/icons/green-dot.png";
const iconNaranja = "http://maps.google.com/mapfiles/ms/icons/orange-dot.png"; // naranja fuerte
const iconRojo = "http://maps.google.com/mapfiles/ms/icons/red-dot.png";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF6500", "#AA00FF"]; // El naranja fuerte es #FF6500

const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "AIzaSyDKiC0rCfhrbZA6a_XQjxENvPRSHxUnLqw";

const UsuarioActivoView = () => {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  // Función que muestra cada alerta como notificación individual
  const mostrarAlertaCritica = (data) => {
    const { usuario, eventosCriticos, alertas } = data;

    toast.error(
      <>
        <b>Usuario:</b> {usuario.nombre} <br />
        <b>Eventos críticos detectados:</b> {eventosCriticos.length}
      </>,
      {
        position: "top-right",
        autoClose: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "colored",
        toastId: `general_alerta_${usuario.nombre}`, 
      }
    );

    if (alertas?.frecuenciaCardiaca) {
      toast.error(
        "La frecuencia del corazón está fuera del rango seguro (50-120 latidos por minuto). Esto podría indicar estrés, fatiga o algún problema cardíaco.",
        {
          position: "top-right",
          autoClose: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "colored",
          toastId: `alerta_fc_${usuario.nombre}`,
        }
      );
    }

    if (alertas?.movimientoBrusco) {
      toast.error(
        "Se detectó un movimiento brusco, lo que podría significar una caída o accidente.",
        {
          position: "top-right",
          autoClose: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "colored",
          toastId: `alerta_mov_${usuario.nombre}`,
        }
      );
    }

    if (alertas?.inactividadProlongada) {
      toast.error(
        "No se detectó movimiento durante más de 5 minutos. Esto puede ser señal de inactividad prolongada o algún problema de salud.",
        {
          position: "top-right",
          autoClose: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "colored",
          toastId: `alerta_inactividad_${usuario.nombre}`,
        }
      );
    }

    if (alertas?.bajaVariabilidadFC) {
      toast.error(
        "La variabilidad de la frecuencia cardíaca es baja, lo que puede estar relacionado con fatiga o estrés.",
        {
          position: "top-right",
          autoClose: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "colored",
          toastId: `alerta_baja_var_${usuario.nombre}`,
        }
      );
    }

    toast.info(
      "Por favor, revise la situación para asegurarse de que el usuario esté bien.",
      {
        position: "top-right",
        autoClose: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "colored",
        toastId: `alerta_final_${usuario.nombre}`,
      }
    );
  };

  useEffect(() => {
    console.log("Conectando socket a:", socketURL);
    socket.on("connect", () => {
      console.log("Socket conectado con id:", socket.id);
    });

    socket.on("usuario-activo-update", (data) => {
      console.log("Evento socket recibido:", data);

      if (!data) {
        setUsuario(null);
        setLoading(false);
        return;
      }

      setUsuario(data);
      setLoading(false);

      if (data.eventosCriticos?.length > 0) {
        mostrarAlertaCritica(data);
      }
    });

    socket.on("disconnect", () => {
      console.log("Socket desconectado");
    });

    return () => {
      socket.off("usuario-activo-update");
      socket.off("connect");
      socket.off("disconnect");
    };
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 20, textAlign: "center" }}>
        <p>Cargando...</p>
      </div>
    );
  }

  if (!usuario) {
    return (
      <div style={{ padding: 20, textAlign: "center", fontStyle: "italic", color: "#666" }}>
        <p>No hay usuarios activos en este momento.</p>
        <ToastContainer />
      </div>
    );
  }

  // Determinar icono según activo y alertas
  let iconoMarcador = iconRojo; // Por defecto rojo
  if (usuario.activoAhora) {
    if (usuario.eventosCriticos?.length > 0) {
      iconoMarcador = iconNaranja;
    } else {
      iconoMarcador = iconVerde;
    }
  }

  const ultimaUbicacion = usuario.ultimaUbicacion || { lat: 0, lng: 0 };
  const datosUltimos = usuario.activoAhora ? (usuario.ultimoRegistro?.datos || []) : [];

  // Datos para gráficas: si usuario no está activo, se usan arrays vacíos para gráficas vacías
  const frecuencias = datosUltimos.map(d => d.frecuencia || 0);
  const movimientos = datosUltimos.map(d => Math.sqrt((d.x ?? 0) ** 2 + (d.y ?? 0) ** 2 + (d.z ?? 0) ** 2));
  const tiempos = datosUltimos.map(d => new Date(d.timestamp || d.fecha || Date.now()).toLocaleTimeString());

  const clasificacion = { Alta: 0, Normal: 0, Baja: 0 };
  frecuencias.forEach(f => {
    if (f > 100) clasificacion.Alta++;
    else if (f < 60) clasificacion.Baja++;
    else clasificacion.Normal++;
  });

  const dataClasificacion = Object.entries(clasificacion).map(([name, value]) => ({ name, value }));

  const dataMovimiento = tiempos.map((t, i) => ({ tiempo: t, movimiento: parseFloat(movimientos[i]?.toFixed(2)) || 0 }));
  const dataFrecuenciaTiempo = tiempos.map((t, i) => ({ tiempo: t, frecuencia: frecuencias[i] || 0 }));

  const promedio = frecuencias.length ? frecuencias.reduce((a, b) => a + b, 0) / frecuencias.length : 0;
  const desviacion = Math.sqrt(frecuencias.reduce((acc, v) => acc + (v - promedio) ** 2, 0) / (frecuencias.length || 1)).toFixed(2);

  const dataRadar = [
    { categoria: "Alta (>100 bpm)", valor: clasificacion.Alta },
    { categoria: "Normal (60-100 bpm)", valor: clasificacion.Normal },
    { categoria: "Baja (<60 bpm)", valor: clasificacion.Baja },
  ];

  return (
    <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
      <div style={{ padding: 20, backgroundColor: "#f0f2f5", minHeight: "100vh" }}>
        <h2>Detalle del Usuario Activo</h2>
        <p><b>Nombre:</b> {usuario.usuario.nombre}</p>
        <p><b>Edad:</b> {usuario.usuario.edad}</p>
        <p><b>Sexo:</b> {usuario.usuario.sexo}</p>
        <p><b>Email:</b> {usuario.usuario.email}</p>
        <p><b>Teléfono:</b> {usuario.usuario.telefono}</p>

        <h3>Ubicación Actual</h3>
        {ultimaUbicacion.lat !== 0 && ultimaUbicacion.lng !== 0 ? (
          <GoogleMap mapContainerStyle={containerStyle} center={ultimaUbicacion} zoom={15}>
            <Marker
              position={ultimaUbicacion}
              icon={iconoMarcador}
              onClick={() => setSelected(ultimaUbicacion)}
            />
            {selected && (
              <InfoWindow position={selected} onCloseClick={() => setSelected(null)}>
                <div>
                  <h4>Última ubicación</h4>
                  <p>Lat: {selected.lat.toFixed(5)}</p>
                  <p>Lng: {selected.lng.toFixed(5)}</p>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        ) : (
          <p>Sin información de ubicación</p>
        )}

        <h3>Estadísticas de Frecuencia Cardíaca</h3>
        <p>Eventos Críticos: <b>{usuario.eventosCriticos?.length || 0}</b></p>
        <p>Desviación Estándar de FC: <b>{desviacion} bpm</b></p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 30 }}>
          {/* Pie Chart */}
          <div style={{ flex: "1 1 300px" }}>
            <h4>Distribución de Frecuencia Cardíaca</h4>
            <PieChart width={300} height={300}>
              <Pie
                data={usuario.activoAhora ? dataClasificacion : []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => usuario.activoAhora ? `${name} ${(percent * 100).toFixed(0)}%` : null}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {(usuario.activoAhora ? dataClasificacion : []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </div>

          {/* Bar Chart Frecuencia */}
          <div style={{ flex: "1 1 300px" }}>
            <h4>Frecuencia Cardíaca a lo largo del tiempo</h4>
            <BarChart
              width={300}
              height={250}
              data={usuario.activoAhora ? dataFrecuenciaTiempo : []}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="tiempo" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="frecuencia" fill="#82ca9d" />
            </BarChart>
          </div>

          {/* Bar Chart Movimiento */}
          <div style={{ flex: "1 1 300px" }}>
            <h4>Movimiento a lo largo del tiempo</h4>
            <BarChart
              width={300}
              height={250}
              data={usuario.activoAhora ? dataMovimiento : []}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="tiempo" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="movimiento" fill="#8884d8" />
            </BarChart>
          </div>

          {/* Radar Chart */}
          <div style={{ flex: "1 1 300px" }}>
            <h4>Clasificación Frecuencia Cardíaca</h4>
            <RadarChart
              cx={150}
              cy={150}
              outerRadius={100}
              width={300}
              height={300}
              data={usuario.activoAhora ? dataRadar : []}
            >
              <PolarGrid />
              <PolarAngleAxis dataKey="categoria" />
              <PolarRadiusAxis />
              <Radar
                name="Frecuencia"
                dataKey="valor"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.6}
              />
              <Legend />
            </RadarChart>
          </div>
        </div>
        <ToastContainer
          position="top-right"
          autoClose={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
        />
      </div>
    </LoadScript>
  );
};

export default UsuarioActivoView;