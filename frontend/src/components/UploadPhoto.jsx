import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { db, auth, storage } from "../firebase.js";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  doc,
  where,
} from "firebase/firestore";
import { ref as ref_storage, uploadBytes, getDownloadURL } from "firebase/storage";
import Navbar from "./Navbar";
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/UploadPhoto.css";
import { useToast } from "./ToastProvider";
import { buildStyleProfileMemory } from "../utils/styleProfile";

function UploadPhoto() {
  const navigate = useNavigate();
  const [selectedFiles, setSelectedFiles] = useState([]); // Track all selected files
  const [showModal, setShowModal] = useState(false); // State for modal visibility
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [loading, setLoading] = useState(false); // Loading state
  const [labelsByImage, setLabelsByImage] = useState([]); // Labels for each uploaded image
  const [overallRecommendations, setOverallRecommendations] = useState([]); // Array of structured recommendations
  const [styleProfileMemory, setStyleProfileMemory] = useState(null);
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
    addToast("Snapshot captured successfully!", "success");
  };

  const handleAnalyze = async () => {
    setLoading(true);

    try {
      if (!auth.currentUser) {
        addToast("You must be logged in to analyze looks.", "error");
        setLoading(false);
        return;
      }

      // Get the ID token from Firebase auth
      const idToken = await auth.currentUser.getIdToken();
      const backendUrl = import.meta.env.VITE_BACKEND_URL || "https://fashion-backend-956137897855.us-central1.run.app";
      const historyQuery = query(
        collection(db, "userRecommendations"),
        where("userId", "==", auth.currentUser.uid),
        orderBy("timestamp", "desc"),
        limit(8)
      );
      const historySnapshot = await getDocs(historyQuery);
      const previousSessions = historySnapshot.docs.map((historyDoc) => historyDoc.data());
      const currentStyleProfile = buildStyleProfileMemory(previousSessions);
      setStyleProfileMemory(currentStyleProfile);

      const uploadResponses = await Promise.all(
        selectedFiles.map((file) => uploadImage(file))
      );

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
        {
          images: aggregatedData,
          styleProfile: currentStyleProfile,
        },
        { headers: { Authorization: `Bearer ${idToken}` } }
      );

      let recommendations = chatGPTResponse.data.recommendations;
      setOverallRecommendations(recommendations || []);

      const normalizedRecommendations = Array.isArray(recommendations)
        ? recommendations
        : [];

      const recommendationsString = Array.isArray(recommendations) 
        ? recommendations.map(r => `Image ${r.imageNumber}: ${r.recommendations.join(", ")}`).join("\n")
        : recommendations;

      const currentSessionDraft = {
        recommendations: {
          images: aggregatedData.map((data) => ({
            image: data.image,
            imageUrl: data.imageUrl,
            labels: data.labels,
          })),
          fashionRecommendations: recommendationsString,
          recommendationItems: normalizedRecommendations,
        },
      };
      const refreshedStyleProfile = buildStyleProfileMemory([
        currentSessionDraft,
        ...previousSessions,
      ]);
      setStyleProfileMemory(refreshedStyleProfile);

      // Save recommendations to Firestore (don't store images, only the labels and recommendations)
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
          recommendationItems: normalizedRecommendations,
        },
        styleProfileSnapshot: refreshedStyleProfile,
        timestamp: serverTimestamp(),
      });

      await setDoc(
        doc(db, "users", auth.currentUser.uid),
        {
          email: auth.currentUser.email,
          styleProfileMemory: refreshedStyleProfile,
          styleProfileUpdatedAt: serverTimestamp(),
        },
        { merge: true }
      );

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
        const historyQuery = query(
          collection(db, "userRecommendations"),
          where("userId", "==", user.uid),
          orderBy("timestamp", "desc"),
          limit(8)
        );

        getDocs(historyQuery)
          .then((historySnapshot) => {
            const previousSessions = historySnapshot.docs.map((historyDoc) =>
              historyDoc.data()
            );
            setStyleProfileMemory(buildStyleProfileMemory(previousSessions));
          })
          .catch((error) => {
            console.error("Error loading style profile memory:", error);
          });
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

          <div className="style-memory-banner glass-card">
            <div className="style-memory-copy">
              <span className="style-memory-label">
                <i className="fa-solid fa-microchip me-2"></i>
                Style Profile Memory
              </span>
              <p>
                {styleProfileMemory?.summary ||
                  "Your long-term style signal will appear here after a few reports."}
              </p>
            </div>
            <div className="style-memory-meta">
              <span>{styleProfileMemory?.sourceLooks || 0} looks indexed</span>
              <span>{styleProfileMemory?.confidence || "low"} confidence</span>
            </div>
          </div>

          <div className="moodboard-grid">
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
            <button
              onClick={handleAnalyze}
              className="accent-btn explore-btn"
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
                <span className="tip-bullet"><i>01</i></span>
                <p>Ensure clear, well-lit portraits for high-fidelity analysis.</p>
              </div>
              <div className="tip-item">
                <span className="tip-bullet"><i>02</i></span>
                <p>Minimalist backgrounds work best to highlight your silhouette.</p>
              </div>
              <div className="tip-item">
                <span className="tip-bullet"><i>03</i></span>
                <p>Upload at least 3 distinct looks for deep personality detection.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

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
              <div className="modal-body text-center">
                <p>Processing your editorial report...</p>
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default UploadPhoto;
