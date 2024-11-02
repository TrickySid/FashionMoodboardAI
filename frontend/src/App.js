import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import UploadPhoto from "./components/UploadPhoto";
import Recommendations from "./components/Recommendations";
import Login from "./components/Login";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<UploadPhoto />} />
        <Route path="/upload" element={<UploadPhoto />} />
        <Route path="/recommendations" element={<Recommendations />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;
