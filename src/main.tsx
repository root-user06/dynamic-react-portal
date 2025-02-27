
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react"
import "./index.css";

// Wait for DOM to be fully loaded
const renderApp = () => {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("Root element not found");
  }
  
  const root = createRoot(rootElement);
  
  root.render(
    <>
      <App />
      <Analytics />
      <SpeedInsights/>
    </>
  );
};

// Use requestAnimationFrame for smoother loading
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    requestAnimationFrame(renderApp);
  });
} else {
  requestAnimationFrame(renderApp);
}
