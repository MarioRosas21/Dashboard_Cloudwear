import React from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { FaHome, FaChartLine, FaExclamationTriangle } from "react-icons/fa";
import "../styles/main.css";

const SidebarLayout = () => {
  const location = useLocation();

  return (
    <div className="app-container">
      <div className="sidebar sidebar-icons">
        <nav>
          <Link to="/" className={location.pathname === "/" ? "active" : ""}>
            <FaHome size={24} />
          </Link>
          <Link to="/particular" className={location.pathname === "/particular" ? "active" : ""}>
            <FaChartLine size={24} />
          </Link>
          <Link to="/alertas" className={location.pathname === "/alertas" ? "active" : ""}>
            <FaExclamationTriangle size={24} />
          </Link>
        </nav>
      </div>

      <div className="main-content">
        <Outlet />
      </div>
    </div>
  );
};

export default SidebarLayout;
