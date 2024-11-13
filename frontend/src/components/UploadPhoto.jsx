import React, { useState } from "react";
// import axios from "axios";
import Navbar from "./Navbar";
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/UploadPhoto.css";

function UploadPhoto() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [labels, setLabels] = useState([]);
  const [showModal, setShowModal] = useState(false); // State for modal visibility

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    // Uncomment this part for real API calls
    /*
    const formData = new FormData();
    formData.append("file", selectedFile);

    const { data } = await axios.post("/api/analyze", formData);
    setLabels(data.labels);
    */

    // Simulated response for the local photo
    setLabels([
      { description: "Fashion", score: 0.9 },
      { description: "Style", score: 0.85 },
      { description: "Casual Wear", score: 0.78 },
    ]);

    // Show modal with analysis results
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const [isLoggedIn, setIsLoggedIn] = useState(true);

  const handleLogout = () => {
    setIsLoggedIn(false); // Set isLoggedIn to false on logout
  };

  return (
    <>
      <div className={`${showModal ? "blur-background" : ""}`}>
        <Navbar isLoggedIn={isLoggedIn} onLogout={handleLogout} />

        <div className="upload-page d-flex justify-content-center align-items-center vh-100">
          <div
            className="upload-import-photo-card card p-4"
            style={{
              width: "400px",
              textAlign: "center",
              borderRadius: "15px",
            }}
          >
            <h2 className="title mb-4">Show us your style</h2>

            <div className="d-flex justify-content-around">
              {/* Upload Photo Button */}
              <div className="upload-photo-card card p-4 mb-4">
                <input
                  type="file"
                  onChange={handleFileChange}
                  id="upload-photo"
                />
                <label htmlFor="upload-photo">
                  <i
                    className="fa-solid fa-arrow-up-from-bracket"
                    style={{ marginBottom: "10px", marginTop: "10px" }}
                  />
                  <div>
                    <p>Upload Photo</p>
                  </div>
                </label>
              </div>

              {/* Import from Facebook Button */}
              <div className="import-photo-card card p-3 mb-4">
                <i
                  className="fa-regular fa-images"
                  style={{ marginBottom: "5px", marginTop: "10px" }}
                />
                <div>
                  <p>Import from Facebook</p>
                </div>
              </div>
            </div>

            {/* Analyze Fashion Button */}
            <button
              onClick={handleUpload}
              className="analyze-btn btn btn-block mt-3"
              style={{ fontWeight: "bold" }}
            >
              Analyze Fashion
            </button>
          </div>
        </div>
      </div>

      {/* Modal for displaying Fashion Moodboard */}
      {showModal && (
        <div
          className="analysis-modal modal fade show d-block"
          tabIndex="-1"
          role="dialog"
          aria-labelledby="moodboardModalLabel"
          aria-hidden="true"
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="moodboardModalLabel">
                  Fashion Moodboard
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseModal}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                {/* Moodboard Photo Grid */}
                <div className="row row-cols-3 g-2 mb-4">
                  {[...Array(6)].map((_, index) => (
                    <div className="col" key={index}>
                      <div
                        className="bg-light"
                        style={{
                          width: "100%",
                          paddingTop: "100%",
                          borderRadius: "10px",
                          position: "relative",
                        }}
                      >
                        <img
                          src="/assets/placeholder.jpg"
                          alt={`Moodboard ${index + 1}`}
                          className="position-absolute top-0 start-0 w-100 h-100"
                          style={{ objectFit: "cover", borderRadius: "10px" }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Fashion Recommendations */}
                <div className="ai-recom">
                  <h5>AI Fashion Recommendations</h5>
                  <ul>
                    <li>Try adding a pop of red for confidence</li>
                    <li>Layer with a denim jacket for a casual look</li>
                    <li>Accessorize with gold jewelry to elevate your style</li>
                  </ul>
                </div>

                {/* Shop Similar Styles Button */}
                <button
                  className="shop-btn btn btn-dark w-100 mt-3"
                  style={{ fontWeight: "bold" }}
                >
                  Shop Similar Styles
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default UploadPhoto;
