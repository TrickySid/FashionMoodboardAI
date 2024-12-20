import React, { useState, useEffect } from "react";
import axios from "axios";
import { db } from "../firebase.js";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import Navbar from "./Navbar";
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/UploadPhoto.css";
import { Link } from "react-router-dom";

function UploadPhoto() {
  const [selectedFiles, setSelectedFiles] = useState([]); // Track all selected files
  const [pintrestLogin, setPintrestLogin] = useState(false);
  const [showModal, setShowModal] = useState(false); // State for modal visibility
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [successMessage, setSuccessMessage] = useState(false); // State for success message
  const [showRecommendations, setShowRecommendations] = useState(false); // State for recommendations
  const [loading, setLoading] = useState(false); // Loading state
  const [labelsByImage, setLabelsByImage] = useState([]); // Labels for each uploaded image
  const [overallRecommendations, setOverallRecommendations] = useState(""); // ChatGPT recommendations
  const [user, setUser] = useState({}); // User object

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

    // Ensure no more than 6 images are selected
    if (validFiles.length + selectedFiles.length > 6) {
      alert("You can only upload a maximum of 6 photos.");
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

  const handleUpload = () => {
    if (selectedFiles.length < 3) {
      setErrorMessage("Please select at least 3 images."); // Set the error message
      return; // Don't proceed further if there are less than 3 images
    }
    setShowModal(true); // Proceed to open modal if 3 or more images are selected
    setErrorMessage(""); // Clear error message if the condition is satisfied
  };

  const handleAnalyze = async () => {
    setLoading(true);

    try {
      const base64Images = await Promise.all(
        selectedFiles.map((file) => convertToBase64(file))
      );

      const responses = await Promise.all(
        base64Images.map((imageBase64) =>
          axios.post("https://fashion-moods.wm.r.appspot.com/analyze-image", {
            imageBase64,
          })
        )
      );

      const labels = responses.map((response) => response.data.labels);

      // Check for "document" or "paper" in any label
      const containsDocumentOrPaper = labels.some((imageLabels) =>
        imageLabels.some(
          (label) =>
            label.description.toLowerCase().includes("document") ||
            label.description.toLowerCase().includes("paper")
        )
      );

      if (containsDocumentOrPaper) {
        setShowRecommendations(false);
        setLoading(false);
        setOverallRecommendations(
          "There is no human in one or more images. We couldn't find you : ( \n Please upload different image(s) !"
        );
        return; // Stop further processing if a document or paper is detected
      }

      setLabelsByImage(labels);

      const aggregatedData = labels.map((imageLabels, index) => ({
        image: `Image ${index + 1}`,
        labels: imageLabels.map((label) => ({
          description: label.description,
          confidence: (label.score * 100).toFixed(2),
        })),
      }));

      const chatGPTResponse = await axios.post(
        "https://fashion-moods.wm.r.appspot.com/analyze-fashion",
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
      await addDoc(collection(db, "userRecommendations"), {
        userId: localStorage.getItem("userEmail"), // Use actual user ID here
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
        /\b(?:dress|jewelry|shirt|blazer|shoes|pants|scarf|watch|loafers|sneakers|accessories|sunglasses)\b/g
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
              className="google-links btn btn-outline-primary btn-sm me-2 mb-2"
            >
              {`Shop ${keyword}`}
            </a>
          );
        })
      : null;
  };

  // Function to fetch Pinterest pins

  const [pinterestPins, setPinterestPins] = useState([]); // State to store Pinterest pins

  // Function to open Pinterest and fetch pins
  const handleImportFromPinterest = async () => {
    const pinterestAuthUrl = `https://www.pinterest.com/oauth/?response_type=code&client_id=1508859&redirect_uri=${encodeURIComponent(
      "https://fashion-mood-frontend.web.app/upload"
    )}&scope=boards:read,pins:read&state=cccc`;

    window.location.href = pinterestAuthUrl;
  };

  const handleAddPin = (pinUrl) => {
    // Convert the Pinterest image URL to a file object
    const file = {
      name: `Pin ${selectedFiles.length + 1}`,
      type: "image/jpeg", // or other type depending on image
      url: pinUrl,
    };

    setSelectedFiles((prevFiles) => [...prevFiles, file]);
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");

    if (code) {
      const imagePaths = ["/assets/a.jpg", "/assets/b.jpg", "/assets/c.jpg"];

      const fetchImages = async () => {
        const filePromises = imagePaths.map(async (path) => {
          const response = await fetch(path);
          const data = await response.blob();
          return new File([data], path.split("/").pop(), { type: data.type });
        });

        const validImages = await Promise.all(filePromises);

        const newSelectedFiles = [...selectedFiles, ...validImages];
        setSelectedFiles(newSelectedFiles);

        if (newSelectedFiles.length >= 3) {
          setSuccessMessage(true);
          setTimeout(() => setSuccessMessage(false), 30000);
        } else {
          setSuccessMessage(false);
        }
      };

      fetchImages();
    }
  }, [pintrestLogin]);

  return (
    <>
      <div className={`${showModal ? "blur-background" : ""}`}>
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
                    {errorMessage && (
                      <div className="alert alert-danger mt-3" role="alert">
                        {errorMessage}
                      </div>
                    )}
                  </div>
                </label>
              </div>

              {/* Import from Pinterest Button */}
              <div className="import-photo-card card p-3 mb-4">
                <i
                  className="fa-brands fa-pinterest"
                  style={{ marginBottom: "5px", marginTop: "20px" }}
                />
                <p onClick={handleImportFromPinterest}>Import from Pinterest</p>
              </div>

              {/* Show imported Pinterest pins */}
              {pinterestPins.length > 0 && (
                <div className="pinterest-pins-gallery">
                  {pinterestPins.map((pin, index) => (
                    <img
                      key={index}
                      src={pin}
                      alt={`Pinterest Pin ${index}`}
                      onClick={() => handleAddPin(pin)} // handleAddPin is where you add selected image to the upload list
                      style={{
                        width: "100px",
                        height: "100px",
                        cursor: "pointer",
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            <p
              className="text-center"
              style={{ fontSize: "14px", color: "#fff" }}
            >
              View our <Link to="/privacy">Privacy Policy</Link> here
            </p>

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

          <div className="upload-note card p-3">
            <div className="notes">
              <h5 style={{ margin: " 0 0 15px 10px" }}>Note :</h5>
              <ul>
                <li style={{ marginBottom: "10px" }}>
                  Please upload photos with only you in it,
                  <br /> we want to only see you : )
                </li>
                <li style={{ marginBottom: "10px" }}>
                  Upload photos less than 10 MB for faster analysis
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
                        <div className="detected-labels labels mt-2">
                          <h6>Detected Labels</h6>
                          <div className="tags-container">
                            {labelsByImage[index].map((label, labelIndex) => (
                              <span
                                key={labelIndex}
                                className="label-tag"
                                title={`Confidence: ${(
                                  label.score * 100
                                ).toFixed(2)}%`}
                              >
                                {label.description}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Display error message */}
                  {overallRecommendations && !showRecommendations && (
                    <div className="col-12 text-center text-danger mt-3">
                      <p>{overallRecommendations}</p>
                    </div>
                  )}

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
                              (line) =>
                                line !== "" &&
                                !/^\s*$/.test(line) &&
                                !line.toLowerCase().includes("for") // Exclude "For" and empty lines
                            ); // Remove empty lines or lines with just spaces

                          // If the recommendations are empty, display the fallback message
                          if (recommendations.length === 0) {
                            return (
                              <div key={index} className="recoms mb-4">
                                <h6 className="fw-bold">{`Image ${
                                  index + 1
                                }`}</h6>
                                <p>
                                  There is no human face in the image, we
                                  couldn't find you : (
                                </p>
                              </div>
                            );
                          }

                          return (
                            <div key={index} className="recoms mb-4">
                              <h6 className="fw-bold">{`Image ${
                                index + 1
                              }`}</h6>
                              <ul style={{ listStyleType: "disc" }}>
                                {recommendations.map(
                                  (recommendation, recIndex) => (
                                    <li
                                      key={recIndex}
                                      style={{
                                        marginLeft: "-45px",
                                        fontSize: "14px",
                                      }}
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
      )}
    </>
  );
}

export default UploadPhoto;
