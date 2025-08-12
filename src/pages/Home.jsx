import { useEffect, useState } from "react";
import WearMap from "../components/WearMap";
import DetalleUsuario from "./DetalleUsuario";
import Alertas from "./Alertas";
import EstadisticasGenerales from "./EstadisticasGenerales";
import api from "../services/api";
import "../styles/main.css";
import { LoadScript } from "@react-google-maps/api";

const GOOGLE_MAPS_API_KEY = "AIzaSyDKiC0rCfhrbZA6a_XQjxENvPRSHxUnLqw";

const initialCenter = {
  lat: 20.00855,
  lng: -99.342812,
};

const Home = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const res = await api.get("/datos");
        setUsuarios(res.data);
      } catch {
        setError("Error cargando datos");
      } finally {
        setLoading(false);
      }
    };
    cargarDatos();
  }, []);

  if (loading) {
    return <div className="loading">Cargando datos...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
      <div className="dashboard-container">

        {/* Mapa a la izquierda */}
        <div className="map-section">
          <WearMap
            datosUsuarios={usuarios}
            center={initialCenter}
            onSelectUser={setUsuarioSeleccionado}
          />
        </div>

        {/* Panel derecho con Detalles, Alertas y Estadísticas */}
        <div className="details-section">

          <div className="panel-section">
            {usuarioSeleccionado ? (
              <DetalleUsuario usuario={usuarioSeleccionado} />
            ) : (
              <div className="placeholder">
                <h2>Selecciona un punto en el mapa</h2>
                <p>Haz clic sobre un marcador para ver los detalles del usuario y sus métricas.</p>
              </div>
            )}
          </div>


          <div className="panel-section">
            <EstadisticasGenerales usuarios={usuarios} />
          </div>

        </div>
      </div>
    </LoadScript>
  );
};

export default Home;
