// src/pages/AlertasPage.jsx
import { useEffect, useState } from "react";
import Alertas from "./Alertas"; // Importas el componente real
import api from "../services/api";

const AlertasPage = () => {
  const [usuarios, setUsuarios] = useState([]);
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

  if (loading) return <p>Cargando alertas...</p>;
  if (error) return <p>{error}</p>;

  return <Alertas usuarios={usuarios} />;
};

export default AlertasPage;
