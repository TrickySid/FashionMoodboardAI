import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import UploadPhoto from "./components/UploadPhoto";
import Moodboard from "./components/Moodboard";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<UploadPhoto />} />
        <Route path="/moodboard" element={<Moodboard />} />
      </Routes>
    </Router>
  );
}

export default App;
