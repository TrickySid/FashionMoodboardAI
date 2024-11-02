import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import Navbar from "./Navbar";
import "../styles/Recommendations.css";

function Recommendations() {
  const recommendations = [
    "Try adding a pop of red for confidence",
    "Layer with a denim jacket for a casual look",
    "Accessorize with gold jewelry to elevate your style",
  ];

  return (
    <>
      <Navbar />
      <div className="recommendations d-flex justify-content-center align-items-start p-4">
        <div className="container">
          <h2 className="title mb-4">Improve Your Style</h2>
          <p className="sub-title mb-4">Your Past Fashion Recommendations</p>

          <div className="rec-cards row g-4">
            {/* Six Recommendation Cards */}
            {[...Array(6)].map((_, index) => (
              <div key={index} className="col-12 col-md-6 col-lg-4">
                <div className="card">
                  {/* Fashion Recommendations */}
                  <div className="text-start">
                    <ul>
                      {recommendations.map((recommendation, idx) => (
                        <li key={idx}>{recommendation}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export default Recommendations;
