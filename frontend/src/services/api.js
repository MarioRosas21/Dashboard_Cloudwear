import axios from "axios";

const api = axios.create({
  baseURL: "https://dashboard-cloudwear-1.onrender.com/api", // Cambia si despliegas
  //baseURL: "http://localhost:5000/api"
});

export default api;