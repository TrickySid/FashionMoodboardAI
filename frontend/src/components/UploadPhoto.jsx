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
                  <i className="bi bi-upload" />
                  <div>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height="28px"
                      viewBox="0 -960 960 960"
                      width="28px"
                    >
                      <path d="M440-320v-326L336-542l-56-58 200-200 200 200-56 58-104-104v326h-80ZM240-160q-33 0-56.5-23.5T160-240v-120h80v120h480v-120h80v120q0 33-23.5 56.5T720-160H240Z" />
                    </svg>
                    <p>Upload Photo</p>
                  </div>
                </label>
              </div>

              {/* Import from Facebook Button */}
              <div className="import-photo-card card p-3 mb-4">
                <i className="bi bi-camera"></i>
                <div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="24px"
                    viewBox="0 -960 960 960"
                    width="24px"
                  >
                    <path d="M440-440ZM120-120q-33 0-56.5-23.5T40-200v-480q0-33 23.5-56.5T120-760h126l74-80h240v80H355l-73 80H120v480h640v-360h80v360q0 33-23.5 56.5T760-120H120Zm640-560v-80h-80v-80h80v-80h80v80h80v80h-80v80h-80ZM440-260q75 0 127.5-52.5T620-440q0-75-52.5-127.5T440-620q-75 0-127.5 52.5T260-440q0 75 52.5 127.5T440-260Zm0-80q-42 0-71-29t-29-71q0-42 29-71t71-29q42 0 71 29t29 71q0 42-29 71t-71 29Z" />
                  </svg>
                  <p>Import from Facebook</p>
                </div>
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
