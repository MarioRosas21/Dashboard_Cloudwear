import React, { useEffect, useState } from "react";
import { GoogleMap, Marker } from "@react-google-maps/api";
import axios from "../services/api";
import "../styles/main.css";

const containerStyle = {
  width: "100%",
  height: "100%",
  borderRadius: "8px",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
};

const WearMap = ({ onSelectUser, center }) => {
  const [puntos, setPuntos] = useState([]);

useEffect(() => {
  axios.get("/datos")
    .then((res) => {
      const marcadores = res.data.flatMap(dato =>
        dato.datos
          .map(d => {
            const lat = parseFloat(d.latitud);
            const lng = parseFloat(d.longitud);

            // Verifica que sean números válidos
            if (isNaN(lat) || isNaN(lng)) return null;

            return {
              lat,
              lng,
              userId: dato.userId,
              frecuencia: d.frecuencia,
              fecha: dato.fecha
            };
          })
          .filter(Boolean) // Elimina cualquier null (coordenadas inválidas)
      );
      setPuntos(marcadores);
    });
}, []);


  const defaultCenter = {
    lat: 19.4326,
    lng: -99.1332,
  };

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center || defaultCenter}
      zoom={12}
    >
      {puntos.map((p, i) => (
        <Marker
          key={i}
          position={{ lat: p.lat, lng: p.lng }}
          icon="http://maps.google.com/mapfiles/ms/icons/green-dot.png"
          onClick={() => onSelectUser(p)}
        />
      ))}
    </GoogleMap>
  );
};

export default WearMap;
