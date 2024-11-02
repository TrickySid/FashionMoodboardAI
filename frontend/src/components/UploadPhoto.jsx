import React, { useState } from "react";
// import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/UploadPhoto.css";
import Navbar from "./Navbar";

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

  return (
    <>
      <div className={`${showModal ? "blur-background" : ""}`}>
        <Navbar />
        {/* Main content with conditional blur effect */}
        <div className="upload-page d-flex justify-content-center align-items-center vh-100">
          <div
            className="card p-4"
            style={{
              width: "400px",
              textAlign: "center",
              borderRadius: "15px",
            }}
          >
            <h1 className="title mb-4">Show us your style</h1>

            {/* Upload Photo Button */}
            <div className="d-flex justify-content-around mb-3">
              <div className="card" style={{ width: "45%", padding: "20px" }}>
                <input
                  type="file"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                  id="upload-photo"
                />
                <label htmlFor="upload-photo" style={{ cursor: "pointer" }}>
                  <i className="bi bi-upload" style={{ fontSize: "24px" }}></i>
                  <div>Upload Photo</div>
                </label>
              </div>

              {/* Take Photo Button (Placeholder) */}
              <div className="card" style={{ width: "45%", padding: "20px" }}>
                <i className="bi bi-camera" style={{ fontSize: "24px" }}></i>
                <div>Take Photo</div>
              </div>
            </div>

            {/* Analyze Fashion Button */}
            <button
              onClick={handleUpload}
              className="btn btn-dark btn-block mt-3"
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
                <div className="text-start">
                  <h5 style={{ fontWeight: "bold" }}>
                    Fashion Recommendations
                  </h5>
                  <ul>
                    <li>Try adding a pop of red for confidence</li>
                    <li>Layer with a denim jacket for a casual look</li>
                    <li>Accessorize with gold jewelry to elevate your style</li>
                  </ul>
                </div>

                {/* Shop Similar Styles Button */}
                <button
                  className="btn btn-dark w-100 mt-3"
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
