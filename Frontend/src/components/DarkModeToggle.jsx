import React from "react";
import { FaSun, FaMoon } from "react-icons/fa";
import "../styles/Header.css";

const DarkModeToggle = ({ darkMode, toggleDarkMode }) => (
  <button
    className={"darkmode-toggle-btn" + (darkMode ? " dark" : "")}
    onClick={toggleDarkMode}
    title={darkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
  >
    {darkMode ? <FaSun /> : <FaMoon />}
  </button>
);

export default DarkModeToggle;
