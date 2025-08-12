import React from "react";
import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import { useState } from "react";

const containerStyle = {
  width: "100%",
  height: "300px",
  borderRadius: 8,
  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
};

const iconAmarillo = "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png";
const iconRojo = "http://maps.google.com/mapfiles/ms/icons/red-dot.png";

const WearMap = ({ datosUsuarios, center }) => {
  const [selected, setSelected] = useState(null);

  // Preparar marcadores con estado
  const marcadores = datosUsuarios.flatMap(usuario =>
    Object.values(usuario.datos).flatMap(arr =>
      arr.map(dato => {
        let icon = iconRojo;
        if (dato.frecuencia < 60) icon = iconAmarillo;
        else if (dato.frecuencia > 100) icon = iconRojo;

        return {
          lat: dato.latitud,
          lng: dato.longitud,
          userId: usuario.userId,
          nombre: usuario.nombre,
          email: usuario.email || "N/A",
          telefono: usuario.telefono || "N/A",
          area: usuario.area,
          puesto: usuario.puesto,
          frecuencia: dato.frecuencia,
          timestamp: dato.timestamp,
          icon,
        };
      })
    )
  );

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={15}
      options={{
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
        draggable: true,
        zoomControl: true,
        disableDoubleClickZoom: true,
        scrollwheel: true,
      }}
    >
      {marcadores.map((m, i) => (
        <Marker
          key={m.userId + "-" + i}
          position={{ lat: m.lat, lng: m.lng }}
          onClick={() => setSelected(m)}
          icon={m.icon}
          title={`${m.nombre} (${m.area})`}
        />
      ))}

      {selected && (
        <InfoWindow
          position={{ lat: selected.lat, lng: selected.lng }}
          onCloseClick={() => setSelected(null)}
        >
          <div style={{ maxWidth: 220 }}>
            <h4>{selected.nombre}</h4>
            <p><b>Área:</b> {selected.area}</p>
            <p><b>Puesto:</b> {selected.puesto}</p>
            <p><b>Frecuencia:</b> {selected.frecuencia} bpm</p>
            <p><b>Última actualización:</b> {new Date(selected.timestamp).toLocaleString()}</p>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
};

export default WearMap;
