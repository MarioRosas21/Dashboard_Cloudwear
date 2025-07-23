import axios from "axios";

const api = axios.create({
  baseURL: "http://172.30.16.50:5000/api", // Cambia si despliegas
});

export default api;