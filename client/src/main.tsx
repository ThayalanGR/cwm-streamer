import React from "react";
import ReactDOM from "react-dom/client";
import App from "./components/App/App";
import "./styles/index.css";
import MasterCourseService from "./services/MasterCourse.service";
import { BrowserRouter } from "react-router-dom";

// initizlization
MasterCourseService.getInstance();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
