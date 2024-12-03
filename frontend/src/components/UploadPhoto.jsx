// Import necessary libraries and components
import React, { useState } from "react"; // Import React and useState for state management
import axios from "axios"; // Import axios for making HTTP requests
import { db } from "../firebase.js"; // Import Firestore database
import { collection, addDoc, serverTimestamp } from "firebase/firestore"; // Import Firestore functions
import Navbar from "./Navbar"; // Import Navbar component
import "bootstrap/dist/css/bootstrap.min.css"; // Import Bootstrap CSS
import "../styles/UploadPhoto.css"; // Import custom CSS
import { Link } from "react-router-dom"; // Import Link for navigation

/**
 * UploadPhoto component for handling photo uploads and analysis
 */
function UploadPhoto() {
  // State variables for managing component state
  const [selectedFiles, setSelectedFiles] = useState([]); // Track all selected files
  const [showModal, setShowModal] = useState(false); // State for modal visibility
  const [isLoggedIn, setIsLoggedIn] = useState(true); // State for user login status
  const [successMessage, setSuccessMessage] = useState(false); // State for success message
  const [showRecommendations, setShowRecommendations] = useState(false); // State for recommendations visibility
  const [loading, setLoading] = useState(false); // Loading state
  const [labelsByImage, setLabelsByImage] = useState([]); // Store labels for each uploaded image
  const [overallRecommendations, setOverallRecommendations] = useState(""); // Store overall fashion recommendations

  /**
   * Convert image to Base64 for API usage
   * @param {File} file - Image file to convert
   * @returns {Promise<string>} Base64 encoded image string
   */
  const convertToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(",")[1]); // Extract Base64 content
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file); // Read file as data URL
    });

  /**
   * Handle file selection
   * @param {ChangeEvent} e - Event triggered by file selection
   */
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files); // Convert FileList to array
    const validFiles = files.filter((file) => file.type.startsWith("image/")); // Filter for image files

    // Ensure no more than 6 images are selected
    if (validFiles.length + selectedFiles.length > 6) {
      alert("You can only upload a maximum of 6 photos."); // Limit file selection
      return;
    }

    const newSelectedFiles = [...selectedFiles, ...validFiles];
    setSelectedFiles(newSelectedFiles);

    // Check if there are at least 3 images selected
    if (newSelectedFiles.length >= 3) {
      setSuccessMessage(true);
      setTimeout(() => setSuccessMessage(false), 3000);
    } else {
      setSuccessMessage(false);
    }
  };

  const [errorMessage, setErrorMessage] = useState(""); // New error state

  /**
   * Handle upload button click
   */
  const handleUpload = () => {
    setShowModal(true);
  };

  /**
   * Handle image analysis
   */
  const handleAnalyze = async () => {
    setLoading(true); // Set loading state

    try {
      const base64Images = await Promise.all(
        selectedFiles.map((file) => convertToBase64(file)) // Convert files to Base64
      );

      const responses = await Promise.all(
        base64Images.map((imageBase64) =>
          axios.post("https://fashion-moods.wm.r.appspot.com/analyze-image", { imageBase64 })
        )
      );

      const labels = responses.map((response) => response.data.labels);
      setLabelsByImage(labels);

      const aggregatedData = labels.map((imageLabels, index) => ({
        image: `Image ${index + 1}`, // Assign image name
        labels: imageLabels.map((label) => ({
          description: label.description, // Label description
          confidence: (label.score * 100).toFixed(2), // Confidence score
        })),
      }));

      const chatGPTResponse = await axios.post(
        "https://fashion-moods.wm.r.appspot.com/analyze-fashion",
        { images: aggregatedData } // Send aggregated data to backend
      );

      let recommendations = chatGPTResponse.data.recommendations; // Extract recommendations

      // Ensure recommendations is a string (convert array if necessary)
      if (typeof recommendations !== "string") {
        if (Array.isArray(recommendations)) {
          recommendations = recommendations.join("\n");
        } else {
          console.error(
            "Recommendations format is not a string or array:",
            recommendations
          );
          recommendations = ""; // Fallback to empty string
        }
      }

      setOverallRecommendations(recommendations); // Update state with recommendations

      // Save recommendations to Firestore (don't store images, only the labels and recommendations)
      await addDoc(collection(db, "userRecommendations"), {
        userId: "exampleUserId", // Use actual user ID here
        recommendations: {
          images: aggregatedData.map((data) => ({
            image: data.image, // Store only image name (like Image 1, Image 2)
            labels: data.labels, // Store the labels (descriptions and confidence)
          })),
          fashionRecommendations: recommendations, // Already a string
        },
        timestamp: serverTimestamp(),
      });

      setLoading(false);
      setShowRecommendations(true);
    } catch (error) {
      console.error("Error analyzing images:", error);
      setLoading(false);
    }
  };

  /**
   * Handle modal close
   */
  const handleCloseModal = () => {
    setShowModal(false); // Hide modal
    setShowRecommendations(false); // Hide recommendations
    setLoading(false); // Reset loading state
    setLabelsByImage([]); // Clear labels
    setOverallRecommendations(""); // Clear recommendations
  };

  /**
   * Handle photo removal
   * @param {number} index - Index of photo to remove
   */
  const handleRemovePhoto = (index) => {
    if (selectedFiles.length <= 3) {
      alert("You must keep at least 3 photos."); // Ensure minimum photo count
      return;
    }

    setSelectedFiles((prevFiles) =>
      prevFiles.filter((_, fileIndex) => fileIndex !== index) // Remove photo by index
    );
    setLabelsByImage((prev) =>
      prev.filter((_, labelIndex) => labelIndex !== index) // Remove corresponding labels
    );
  };

  /**
   * Generate Google search links for recommendations
   * @param {string} recommendation - Recommendation text
   * @returns {JSX.Element} Google search link elements
   */
  const generateGoogleLinks = (recommendation) => {
    const keywords = recommendation
      .toLowerCase()
      .match(
        /\b(?:dress|jewelry|shirt|blazer|shoes|pants|scarf|watch|loafers|sneakers|accessories|outfit|style)\b/g
      );

    if (!keywords) return null;

    return keywords
      ? [...new Set(keywords)].map((keyword, index) => {
          const searchUrl = `${baseGoogleUrl}${encodeURIComponent(keyword)}`;
          return (
            <a
              key={index}
              href={searchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline-primary btn-sm me-2 mb-2"
            >
              {`Shop ${keyword}`}
            </a>
          );
        })
      : null;
  };

  return (
    <div className="upload-photo">
      <Navbar isLoggedIn={isLoggedIn} handleLogout={handleLogout} />

      <div className="container mt-5">
        <h2 className="text-center mb-4">Upload Your Photos</h2>

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
                  className="fa-brands fa-square-pinterest"
                  style={{ marginBottom: "5px", marginTop: "10px" }}
                />
                <div>
                  <p>Import from Pinterest</p>
                </div>
              ))}
            </div>

            {successMessage && (
              <div className="alert alert-success mt-3">
                Photos uploaded successfully!
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
                  <br /> &nbsp; &nbsp; &nbsp; we want to only see you &nbsp; : )
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
                              className="fa-solid fa-xmark"
                              style={{ marginTop: "-20px" }}
                            />
                          </button>
                        )}
                      </div>
                      {/* Display Labels */}
                      {showRecommendations && labelsByImage[index] && (
                        <div className="labels mt-2">
                          <h6>Detected Labels:</h6>
                          <ul>
                            {labelsByImage[index].map((label, labelIndex) => (
                              <li
                                key={labelIndex}
                                style={{ marginLeft: "-45px" }}
                              >
                                {label.description} -{" "}
                                {(label.score * 100).toFixed(2)}%
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}

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

                {!showRecommendations && !loading && (
                  <button
                    className="btn btn-primary"
                    onClick={handleAnalyze}
                  >
                    Start Analysis
                  </button>
                )}

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

                {showRecommendations && (
                  <>
                    <div className="ai-recom">
                      <h5>AI Fashion Recommendations</h5>
                    </div>

                    <div>
                      {overallRecommendations
                        .split("Image") // Split by "Image" sections
                        .filter((section) => section.trim() !== "") // Remove empty sections
                        .slice(1, selectedFiles.length + 1) // Match uploaded images
                        .map((section, index) => {
                          const recommendations = section
                            .split("\n") // Split recommendations into lines
                            .map((line) => {
                              return line
                                .replace(/^\s*[\d#*.-]+\s*/, "") // Remove leading numbers, hashtags, stars, dashes, or dots with spaces
                                .replace(/^\s*\*\*\s*/, "") // Remove ** (double stars) and their spaces
                                .replace(/[:.-]+$/, "") // Remove trailing punctuation like colons, dots, or dashes
                                .replace(/\*\*/g, "") // Remove all instances of **
                                .trim(); // Trim any remaining whitespace
                            })
                            .filter(
                              (line) => line !== "" && !/^\s*$/.test(line)
                            ); // Remove empty lines or lines with just spaces
                          return (
                            <div key={index} className="mb-4">
                              <h6 className="fw-bold">{`Image ${
                                index + 1
                              }`}</h6>
                              <ul style={{ listStyleType: "disc" }}>
                                {recommendations.map(
                                  (recommendation, recIndex) => (
                                    <li
                                      key={recIndex}
                                      style={{ marginLeft: "-45px" }}
                                    >
                                      {recommendation}
                                    </li>
                                  )
                                )}
                              </ul>
                              <div>
                                {generateGoogleLinks(recommendations.join(" "))}{" "}
                                {/* Generate search links */}
                              </div>
                            </div>
                          );
                        })}

                      <p className="text-center">
                        Recommendations may be blank or have noise at times.
                        <br />
                        You can re-analyze the images to get more accurate
                        results.
                      </p>

                      {/* Add a Reanalyze Button */}
                      <div className="d-flex justify-content-center mt-3">
                        <button
                          onClick={() => {
                            // Clear output and show loading animation
                            setShowRecommendations(false);
                            setOverallRecommendations(""); // Clear recommendations
                            setLabelsByImage([]); // Clear labels
                            setLoading(true); // Show loading spinner
                            handleAnalyze(); // Reanalyze
                          }}
                          className="reanalyze-btn btn btn-dark w-100"
                        >
                          Reanalyze
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UploadPhoto; // Export component for use in other parts of the application
