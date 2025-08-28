import React, { useState } from "react";
import axios from "axios";
import { db, auth } from "../firebase.js";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
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
  const [labelsByImage, setLabelsByImage] = useState([]); // Labels for each uploaded image
  const [overallRecommendations, setOverallRecommendations] = useState(""); // ChatGPT recommendations

  // Convert image to Base64 for API usage
  const convertToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter((file) => file.type.startsWith("image/"));

    if (validFiles.length + selectedFiles.length > 6) {
      alert("You can only upload a maximum of 6 photos.");
      return;
    }

    setSelectedFiles((prevFiles) => [...prevFiles, ...validFiles]);
    setSuccessMessage(true);
    setTimeout(() => setSuccessMessage(false), 3000);
  };

  const handleUpload = () => {
    setShowModal(true);
  };

  const handleAnalyze = async () => {
    setLoading(true);

    try {
      const base64Images = await Promise.all(
        selectedFiles.map((file) => convertToBase64(file))
      );

      const responses = await Promise.all(
        base64Images.map((imageBase64) =>
          axios.post(`https://fashion-backend-956137897855.us-central1.run.app/analyze-image`, { imageBase64 })
        )
      );

      const labels = responses.map((response) => response.data.labels);
      setLabelsByImage(labels);

      console.log("Label responses:", labels);
      
      // Aggregate data for ChatGPT
      const aggregatedData = (labels || []).map((imageLabels, index) => ({
        image: `Image ${index + 1}`,
        labels: (imageLabels || []).map((label) => ({
          description: label.description || "Unknown",
          confidence: label.score ? (label.score * 100).toFixed(2) : "0.00",
        })),
      }));

      if (!aggregatedData.length || aggregatedData.some(img => !img.labels || !img.labels.length)) {
        alert("Some image labels are missing. Please try again or reupload.");
        setLoading(false);
        return;
      }

      const chatGPTResponse = await axios.post(
        `${process.env.REACT_APP_API_URL}/analyze-fashion`,
        { images: aggregatedData }
      );

      let recommendations = chatGPTResponse.data.recommendations;

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

      setOverallRecommendations(recommendations);

      // Save recommendations to Firestore (don't store images, only the labels and recommendations)
      if (!auth.currentUser) {
        alert("You must be logged in to save recommendations.");
        setLoading(false);
        return;
      }

      await addDoc(collection(db, "userRecommendations"), {
        userId: auth.currentUser.uid, // Use the actual logged-in user's UID
        email: auth.currentUser.email,
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
      alert("Error saving recommendations: " + error.message);
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setShowRecommendations(false);
    setLoading(false);
    setLabelsByImage([]);
    setOverallRecommendations("");
  };

  const handleRemovePhoto = (index) => {
    if (selectedFiles.length <= 3) {
      alert("You must keep at least 3 photos.");
      return;
    }

    setSelectedFiles((prevFiles) =>
      prevFiles.filter((_, fileIndex) => fileIndex !== index)
    );
    setLabelsByImage((prev) =>
      prev.filter((_, labelIndex) => labelIndex !== index)
    ); // Remove corresponding labels
  };

  const handleAddImagesInModal = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter((file) => file.type.startsWith("image/"));

    if (validFiles.length + selectedFiles.length > 6) {
      alert("You can only upload a maximum of 6 photos.");
      return;
    }

    setSelectedFiles((prevFiles) => [...prevFiles, ...validFiles]);
  };

  const handleLogout = () => {
    setIsLoggedIn(false); // Set isLoggedIn to false on logout
  };

  const generateGoogleLinks = (recommendation) => {
    const keywords = recommendation
      .toLowerCase()
      .match(
        /\b(?:dress|jewelry|shirt|blazer|shoes|pants|scarf|watch|loafers|sneakers|accessories|outfit|style)\b/g
      );

    const baseGoogleUrl = "https://www.google.com/search?q=shop+";

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
              {/* <div className="import-photo-card card p-3 mb-4">
                <i
                  className="fa-brands fa-square-pinterest"
                  style={{ marginBottom: "5px", marginTop: "10px" }}
                />
                <div>
                  <p>Import from Pinterest</p>
                </div>
              </div> */}
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
                              <li key={labelIndex}>
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
                    className="analyze-btn btn btn-dark w-100 mt-3"
                    onClick={handleAnalyze}
                    style={{ fontWeight: "bold" }}
                  >
                    Analyze
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
                                    <li key={recIndex}>{recommendation}</li>
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
      )}
    </>
  );
}

export default UploadPhoto;
