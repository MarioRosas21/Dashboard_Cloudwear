import React, { useState } from "react";
import WearMap from "../components/WearMap";
import DetalleUsuario from "./DetalleUsuario";
import "../styles/main.css";
import { LoadScript } from "@react-google-maps/api"; 

const Home = () => {
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);

return (
  <LoadScript googleMapsApiKey="AIzaSyDKiC0rCfhrbZA6a_XQjxENvPRSHxUnLqw">
    <div className="dashboard-container">

      <div className="map-section">
        <WearMap onSelectUser={setUsuarioSeleccionado} />
      </div>

      <div className="details-section">
        {usuarioSeleccionado ? (
          <DetalleUsuario data={usuarioSeleccionado} />
        ) : (
          <div className="placeholder">
            <h2>Selecciona un punto en el mapa</h2>
            <p>Haz clic sobre un marcador para ver los detalles del usuario y sus métricas.</p>
          </div>
        )}
      </div>
      
    </div>
  </LoadScript>
);


};

export default Home;
