import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import HockeyGM from "./App";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <HockeyGM />
  </StrictMode>
);
