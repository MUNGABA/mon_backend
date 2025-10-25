import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import App from "./App";
import "./styles/index.css";

// ✅ importe ton AuthProvider
import { AuthProvider } from "./contexts/AuthContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AuthProvider>
      <App />
      <Toaster position="top-right" reverseOrder={false} />
    </AuthProvider>
  </BrowserRouter>
);
