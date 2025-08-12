import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SidebarLayout from "./components/SidebarLayout";
import Home from "./pages/Home";
import Particular from "./pages/Particular";
import Alertas from "./pages/Alertas";
import AlertasPage from "./pages/AlertasPage"; // Nuevo archivo
import UsuarioActivoView from "./pages/UsuarioActivoView";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SidebarLayout />}>
          <Route index element={<UsuarioActivoView  />} />
        <Route path="particular" element={<Home />} />
          <Route path="alertas" element={<AlertasPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
