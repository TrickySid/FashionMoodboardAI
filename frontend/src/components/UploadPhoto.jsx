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

    if (validFiles.length + selectedFiles.length > 6) {
      alert("You can only upload a maximum of 6 photos."); // Limit file selection
      return;
    }

    setSelectedFiles((prevFiles) => [...prevFiles, ...validFiles]); // Update selected files
    setSuccessMessage(true); // Show success message
    setTimeout(() => setSuccessMessage(false), 3000); // Hide message after 3 seconds
  };

  /**
   * Handle upload button click
   */
  const handleUpload = () => {
    setShowModal(true); // Show modal
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
          axios.post("https://fashion-moods.wm.r.appspot.com/analyze-image", { imageBase64 }) // Send images to backend
        )
      );

      const labels = responses.map((response) => response.data.labels); // Extract labels from response
      setLabelsByImage(labels); // Update state with labels

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
      ); // Extract relevant keywords

    if (!keywords) return null;

    return (
      <div className="mt-3">
        <h6>Explore More:</h6>
        <ul>
          {keywords.map((keyword, index) => (
            <li key={index}>
              <a
                href={`https://www.google.com/search?q=${keyword}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {keyword}
              </a>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="upload-photo">
      <Navbar isLoggedIn={isLoggedIn} handleLogout={handleLogout} />

      <div className="container mt-5">
        <h2 className="text-center mb-4">Upload Your Photos</h2>

        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="upload-area">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
              />
              <button
                className="btn btn-primary mt-3"
                onClick={handleUpload}
                disabled={selectedFiles.length === 0 || loading}
              >
                Analyze Photos
              </button>
            </div>

            <div className="mt-4">
              {selectedFiles.map((file, index) => (
                <div key={index} className="image-preview">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Preview ${index + 1}`}
                    className="img-thumbnail"
                  />
                  <button
                    className="btn btn-danger btn-sm mt-2"
                    onClick={() => handleRemovePhoto(index)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            {successMessage && (
              <div className="alert alert-success mt-3">
                Photos uploaded successfully!
              </div>
            )}

            {showRecommendations && (
              <div className="recommendations mt-5">
                <h4>Fashion Recommendations</h4>
                <div className="recommendation-list">
                  {overallRecommendations.split("\n\n").map((section, index) => (
                    <div key={index} className="recommendation-section">
                      <h5>{`Recommendation ${index + 1}`}</h5>
                      <p>{section}</p>
                      {generateGoogleLinks(section)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        className="modal fade"
        id="uploadModal"
        tabIndex="-1"
        role="dialog"
        aria-labelledby="uploadModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-lg" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="uploadModalLabel">
                Uploading Photos
              </h5>
              <button
                type="button"
                className="close"
                data-dismiss="modal"
                aria-label="Close"
                onClick={handleCloseModal}
              >
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div className="modal-body">
              <div className="progress">
                <div
                  className="progress-bar progress-bar-striped progress-bar-animated"
                  role="progressbar"
                  style={{ width: `${(selectedFiles.length / 6) * 100}%` }}
                  aria-valuenow={(selectedFiles.length / 6) * 100}
                  aria-valuemin="0"
                  aria-valuemax="100"
                ></div>
              </div>
              <div className="mt-3">
                {loading ? (
                  <p>Analyzing photos...</p>
                ) : (
                  <button
                    className="btn btn-primary"
                    onClick={handleAnalyze}
                  >
                    Start Analysis
                  </button>
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
