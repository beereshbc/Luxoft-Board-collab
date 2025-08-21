import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { RoomProvider } from "./context/RoomContext.jsx";
import { BrowserRouter } from "react-router-dom";
import GeminiContextProvider from "./context/GeminiContext.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <GeminiContextProvider>
      <RoomProvider>
        <App />
      </RoomProvider>
    </GeminiContextProvider>
  </BrowserRouter>
);
