import "./authFetch";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

import { ThemeProvider } from "./context/ThemeContext";
import UserContextProvider from "./context/UserContextProvider";

import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <UserContextProvider>
        <App />
      </UserContextProvider>
    </ThemeProvider>
  </StrictMode>
);