import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api", // Cambia si despliegas
});

export default api;