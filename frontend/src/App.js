import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import UploadPhoto from "./components/UploadPhoto";
import Recommendations from "./components/Recommendations";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<UploadPhoto />} />
        <Route path="/upload" element={<UploadPhoto />} />
        <Route path="/recommendations" element={<Recommendations />} />
      </Routes>
    </Router>
  );
}

export default App;
