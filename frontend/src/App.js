import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import UploadPhoto from "./components/UploadPhoto";
import Recommendations from "./components/Recommendations";
import Login from "./components/Login";
import SignUp from "./components/SignUp";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<UploadPhoto />} />
        <Route path="/upload" element={<UploadPhoto />} />
        <Route path="/recommendations" element={<Recommendations />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
      </Routes>
    </Router>
  );
}

export default App;
