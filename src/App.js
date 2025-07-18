import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SidebarLayout from "./components/SidebarLayout";
import Home from "./pages/Home";
import Particular from "./pages/Particular";
import Alertas from "./pages/Alertas";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SidebarLayout />}>
          <Route index element={<Home />} />
          <Route path="particular" element={<Particular />} />
          <Route path="alertas" element={<Alertas />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
