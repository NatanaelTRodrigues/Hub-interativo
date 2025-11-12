import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

// --- ATUALIZE A IMPORTAÇÃO ---
import { AppProvider } from "./contexts/AppContext"; // <-- Mude esta linha

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    {/* --- ATUALIZE O PROVIDER --- */}
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>
);
