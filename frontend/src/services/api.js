import axios from "axios";

const api = axios.create({
  baseURL: "http://192.168.1.128:5000/api", // Cambia si despliegas
  //baseURL: "http://localhost:5000/api"
});

export default api;