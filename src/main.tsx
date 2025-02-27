
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react"
import "./index.css";

// Create a root for React
const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Failed to find the root element");

const root = createRoot(rootElement);

// Render the app
root.render(
  <>
    <App />
    <Analytics />
    <SpeedInsights />
  </>
);
