import React from "react";
import ReactDOM from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import "./index.css";
import App from "./App";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId="52814765259-iik4mbjput3qocfos4gbuiujsm352p8u.apps.googleusercontent.com">
      <App />
    </GoogleOAuthProvider>
    ,
  </React.StrictMode>
);
