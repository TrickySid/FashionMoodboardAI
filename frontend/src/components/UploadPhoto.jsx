import React, { useState } from "react";
import Navbar from "./Navbar";
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/UploadPhoto.css";

function UploadPhoto() {
  const [selectedFiles, setSelectedFiles] = useState([]); // Track all selected files
  const [showModal, setShowModal] = useState(false); // State for modal visibility
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [successMessage, setSuccessMessage] = useState(false); // State for success message
  const [showRecommendations, setShowRecommendations] = useState(false); // State for recommendations
  const [loading, setLoading] = useState(false); // Loading state

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter((file) => file.type.startsWith("image/"));

    if (validFiles.length + selectedFiles.length > 6) {
      alert("You can only upload a maximum of 6 photos.");
      return;
    }

    if (files.length !== validFiles.length) {
      alert("Only image files are allowed.");
    }

    setSelectedFiles((prevFiles) => [...prevFiles, ...validFiles]);
    setSuccessMessage(true); // Show success message
    setTimeout(() => setSuccessMessage(false), 3000); // Hide after 3 seconds
  };

  const handleUpload = () => {
    setShowModal(true); // Show modal with analysis results
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setShowRecommendations(false); // Reset recommendations state
    setLoading(false); // Reset loading state
  };

  const handleAnalyze = () => {
    setLoading(true); // Start loading animation
    setTimeout(() => {
      setLoading(false); // Stop loading animation
      setShowRecommendations(true); // Show recommendations
    }, 10000); // Simulate 10 seconds delay
  };

  const handleRemovePhoto = (index) => {
    if (selectedFiles.length <= 3) {
      alert("You must keep at least 3 photos.");
      return;
    }

    setSelectedFiles((prevFiles) =>
      prevFiles.filter((_, fileIndex) => fileIndex !== index)
    );
  };

  const handleAddImagesInModal = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter((file) => file.type.startsWith("image/"));

    if (validFiles.length + selectedFiles.length > 6) {
      alert("You can only upload a maximum of 6 photos.");
      return;
    }

    if (files.length !== validFiles.length) {
      alert("Only image files are allowed.");
    }

    setSelectedFiles((prevFiles) => [...prevFiles, ...validFiles]);
  };

  const handleLogout = () => {
    setIsLoggedIn(false); // Set isLoggedIn to false on logout
  };

  return (
    <>
      <div className={`${showModal ? "blur-background" : ""}`}>
        <Navbar isLoggedIn={isLoggedIn} onLogout={handleLogout} />

        <div className="upload-page d-flex flex-column justify-content-center align-items-center vh-100">
          <div className="upload-import-photo-card card p-4 mb-4">
            <h2 className="title mb-4">Show us your style</h2>

            <div className="d-flex justify-content-around">
              {/* Upload Photo Button */}
              <div className="upload-photo-card card p-4 mb-4">
                <input
                  type="file"
                  multiple
                  accept="image/*" // Only accept image files
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

              {/* Import from Pinterest Button */}
              <div className="import-photo-card card p-3 mb-4">
                <i
                  class="fa-brands fa-square-pinterest"
                  style={{ marginBottom: "5px", marginTop: "10px" }}
                />
                <div>
                  <p>Import from Pinterest</p>
                </div>
              </div>
            </div>

            {/* Success Message */}
            {successMessage && (
              <div
                className="alert alert-success mt-3"
                role="alert"
                style={{ width: "100%" }}
              >
                Images uploaded successfully!
              </div>
            )}

            {/* Analyze Fashion Button */}
            <button
              onClick={handleUpload}
              className="analyze-btn btn btn-block mt-3"
              disabled={selectedFiles.length < 3} // Disable if fewer than 3 photos
              style={{
                backgroundColor: selectedFiles.length < 3 ? "#ccc" : "#000",
                color: selectedFiles.length < 3 ? "#666" : "#fff",
              }}
            >
              Analyze Fashion
            </button>
          </div>

          <div
            className="upload-note card p-3"
            style={{
              width: "400px",
              borderRadius: "15px",
            }}
          >
            <div className="notes">
              <h5 style={{ margin: " 0 0 15px 10px" }}>Note :</h5>
              <ul>
                <li style={{ marginBottom: "10px" }}>
                  Please upload photos with only you in it,
                  <br /> we want to only see you &nbsp; : )
                </li>
                <li style={{ marginBottom: "10px" }}>
                  Upload photos less than 5 MB
                </li>
                <li>Upload at least 3 photos for effective analysis</li>
              </ul>
            </div>
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
                  {selectedFiles.map((file, index) => (
                    <div className="col" key={index}>
                      <div
                        className="bg-light position-relative"
                        style={{
                          width: "100%",
                          paddingTop: "100%",
                          borderRadius: "10px",
                        }}
                      >
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Uploaded Img ${index + 1}`}
                          className="position-absolute top-0 start-0 w-100 h-100"
                          style={{ objectFit: "cover", borderRadius: "10px" }}
                        />
                        {/* Remove Button */}
                        {!showRecommendations && (
                          <button
                            className="btn btn-danger btn-sm position-absolute top-0 end-0"
                            onClick={() => handleRemovePhoto(index)}
                            style={{
                              borderRadius: "50%",
                              width: "25px",
                              height: "25px",
                            }}
                          >
                            <i
                              class="fa-solid fa-xmark"
                              style={{ marginTop: "-20px" }}
                            />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Add More Photos Button */}
                  {!showRecommendations &&
                    selectedFiles.length < 6 &&
                    !loading && (
                      <div className="col">
                        <div
                          className="d-flex justify-content-center align-items-center bg-light"
                          style={{
                            width: "100%",
                            paddingTop: "100%",
                            borderRadius: "10px",
                            cursor: "pointer",
                          }}
                        >
                          <label htmlFor="add-more-images">
                            <i
                              className="fa-solid fa-plus"
                              style={{ fontSize: "24px" }}
                            />
                          </label>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            id="add-more-images"
                            style={{ display: "none" }}
                            onChange={handleAddImagesInModal}
                          />
                        </div>
                      </div>
                    )}
                </div>

                {/* Analyze Button */}
                {!showRecommendations && !loading && (
                  <button
                    className="analyze-btn btn btn-dark w-100 mt-3"
                    onClick={handleAnalyze}
                    style={{ fontWeight: "bold" }}
                  >
                    Analyze
                  </button>
                )}

                {/* Loading Animation */}
                {loading && (
                  <div className="d-flex justify-content-center align-items-center mt-3">
                    <div
                      className="spinner-border"
                      style={{ width: "3rem", height: "3rem" }}
                      role="status"
                    >
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                )}

                {/* Fashion Recommendations */}
                {showRecommendations && (
                  <>
                    <div className="ai-recom">
                      <h5>AI Fashion Recommendations</h5>
                      <ul>
                        <li>Try adding a pop of red for confidence</li>
                        <li>Layer with a denim jacket for a casual look</li>
                        <li>
                          Accessorize with gold jewelry to elevate your style
                        </li>
                      </ul>
                    </div>

                    {/* Shop Similar Styles Button */}
                    <button
                      className="shop-btn btn btn-dark w-100 mt-3"
                      style={{ fontWeight: "bold" }}
                    >
                      Shop Similar Styles
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default UploadPhoto;
