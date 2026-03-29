import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { db, auth, storage } from "../firebase.js";
import { updateProfile } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref as ref_storage, uploadBytes, getDownloadURL } from "firebase/storage";
import Navbar from "./Navbar";
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/UploadPhoto.css";
import { useToast } from "./ToastProvider";

function UploadPhoto() {
  const navigate = useNavigate();
  const [selectedFiles, setSelectedFiles] = useState([]); // Track all selected files
  const [showModal, setShowModal] = useState(false); // State for modal visibility
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [successMessage, setSuccessMessage] = useState(false); // State for success message
  const [showRecommendations, setShowRecommendations] = useState(false); // State for recommendations
  const [loading, setLoading] = useState(false); // Loading state
  const [labelsByImage, setLabelsByImage] = useState([]); // Labels for each uploaded image
  const [overallRecommendations, setOverallRecommendations] = useState([]); // Array of structured recommendations
  const { addToast } = useToast();

  // Convert image to Base64 for API usage
  const convertToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });

  const uploadImage = async (file) => {
    const storageRef = ref_storage(storage, `user-uploads/${auth.currentUser.uid}/${Date.now()}-${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  };

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
      // Get the ID token from Firebase auth
      const idToken = await auth.currentUser.getIdToken();
      const backendUrl = import.meta.env.VITE_BACKEND_URL || "https://fashion-backend-956137897855.us-central1.run.app";

      const uploadResponses = await Promise.all(
        selectedFiles.map((file) => uploadImage(file))
      );
      // Update user avatar to the first uploaded photo
      if (auth.currentUser && uploadResponses.length > 0) {
        try {
          await updateProfile(auth.currentUser, { photoURL: uploadResponses[0] });
          addToast("Profile avatar updated", "success");
        } catch (err) {
          console.error("Failed to update avatar:", err);
        }
      }

      const base64Images = await Promise.all(
        selectedFiles.map((file) => convertToBase64(file))
      );

      const responses = await Promise.all(
        base64Images.map((imageBase64) =>
          axios.post(`${backendUrl}/analyze-image`, { imageBase64 }, {
            headers: { Authorization: `Bearer ${idToken}` }
          })
        )
      );

      const labels = responses.map((response) => response.data.labels);
      setLabelsByImage(labels);

      // Aggregate data for LLM
      const aggregatedData = (labels || []).map((imageLabels, index) => ({
        image: `Image ${index + 1}`,
        imageUrl: uploadResponses[index], // Store URL
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
        `${backendUrl}/analyze-fashion`,
        { images: aggregatedData },
        { headers: { Authorization: `Bearer ${idToken}` } }
      );

      let recommendations = chatGPTResponse.data.recommendations;
      setOverallRecommendations(recommendations || []);

      const recommendationsString = Array.isArray(recommendations) 
        ? recommendations.map(r => `Image ${r.imageNumber}: ${r.recommendations.join(", ")}`).join("\n")
        : recommendations;

      // Save recommendations to Firestore (don't store images, only the labels and recommendations)
      if (!auth.currentUser) {
        addToast("You must be logged in to save recommendations.", "error");
        setLoading(false);
        return;
      }

      await addDoc(collection(db, "userRecommendations"), {
        userId: auth.currentUser.uid, // Use the actual logged-in user's UID
        email: auth.currentUser.email,
        recommendations: {
          images: aggregatedData.map((data) => ({
            image: data.image,
            imageUrl: data.imageUrl, // Store actual image URL
            labels: data.labels,
          })),
          fashionRecommendations: recommendationsString,
        },
        timestamp: serverTimestamp(),
      });

      setLoading(false);
      navigate("/recommendations");
      } catch (error) {
      console.error("Error analyzing images:", error);
      addToast("Error saving recommendations: " + error.message, "error");
      setLoading(false);
      }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setShowRecommendations(false);
    setLoading(false);
    setLabelsByImage([]);
    setOverallRecommendations([]);
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

  // Route guard: redirect to login if user is not authenticated
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate("/login");
      } else {
        setIsLoggedIn(true);
      }
    });
    return unsubscribe;
  }, [navigate]);

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

        <div className="upload-page">
          <h2 className="brand-header">Build Your Moodboard</h2>
          <p className="brand-subtitle">Upload 3-6 photos to generate your curated fashion report.</p>

          <div className="moodboard-grid glass-card">
            {[...Array(6)].map((_, index) => (
              <div key={index} className={`moodboard-slot ${selectedFiles[index] ? 'filled' : 'empty'}`}>
                {selectedFiles[index] ? (
                  <>
                    <img src={URL.createObjectURL(selectedFiles[index])} alt={`Upload ${index + 1}`} />
                    <button className="remove-btn" onClick={() => handleRemovePhoto(index)}><i className="fa-solid fa-xmark"></i></button>
                  </>
                ) : (
                  <label htmlFor={`slot-upload-${index}`} className="slot-placeholder">
                    <i className="fa-solid fa-plus"></i>
                    <span>ADD IMAGE</span>
                    <input
                      type="file"
                      id={`slot-upload-${index}`}
                      accept="image/*"
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                    />
                  </label>
                )}
              </div>
            ))}
          </div>

          <div className="action-area">
            {/* Success Message */}
            {successMessage && (
              <div
                className="alert alert-success mt-3"
                role="alert"
              >
                Snapshot captured successfully!
              </div>
            )}

            {/* Analyze Fashion Button */}
            <button
              onClick={handleAnalyze}
              className="accent-btn explore-btn mt-3"
              disabled={selectedFiles.length < 3 || loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Analyzing...
                </>
              ) : "Explore Your Style Report"}
            </button>
          </div>

          <div className="style-note">
            <h5>Curator Tips</h5>
            <div className="tip-grid">
              <div className="tip-item">
                <span className="tip-bullet">01</span>
                <p>Ensure clear, well-lit portraits for high-fidelity analysis.</p>
              </div>
              <div className="tip-item">
                <span className="tip-bullet">02</span>
                <p>Minimalist backgrounds work best to highlight your silhouette.</p>
              </div>
              <div className="tip-item">
                <span className="tip-bullet">03</span>
                <p>Upload at least 3 distinct looks for deep personality detection.</p>
              </div>
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
                    className="accent-btn btn w-100 mt-3"
                    onClick={handleAnalyze}
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
                      {overallRecommendations.map((item, index) => (
                        <div key={index} className="mb-4">
                          <h6 className="fw-bold">{`Image ${item.imageNumber}`}</h6>
                          <ul style={{ listStyleType: "disc" }}>
                            {item.recommendations.map((recommendation, recIndex) => (
                              <li key={recIndex}>{recommendation}</li>
                            ))}
                          </ul>
                          <div>
                            {generateGoogleLinks(item.recommendations.join(" "))}
                          </div>
                        </div>
                      ))}

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
                          className="accent-btn btn w-100"
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
