import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { db, storage } from "../firebaseData.js";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  ref as storageRef,
  uploadBytes,
} from "firebase/storage";
import Navbar from "./Navbar";
import "../styles/UploadPhoto.css";
import { useToast } from "./ToastProvider";
import { useAuth } from "../auth/AuthContext";
import { buildStyleProfileMemory } from "../utils/styleProfile";
import { getApiErrorMessage } from "../utils/errors";
import {
  ACCEPTED_IMAGE_TYPES,
  imageExtension,
  validateImageFile,
} from "../utils/imageFiles";

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ||
  "https://fashion-backend-956137897855.us-central1.run.app";

function ImagePreview({ file, index }) {
  const [url] = useState(() => URL.createObjectURL(file));

  useEffect(() => {
    return () => URL.revokeObjectURL(url);
  }, [url]);

  return <img src={url} alt={`Selected look ${index + 1}`} />;
}

function fileIdentity(file) {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

function convertToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
    reader.readAsDataURL(file);
  });
}

function UploadPhoto() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [styleProfileMemory, setStyleProfileMemory] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadStyleMemory() {
      try {
        const historyQuery = query(
          collection(db, "userRecommendations"),
          where("userId", "==", user.uid),
          orderBy("timestamp", "desc"),
          limit(8)
        );
        const snapshot = await getDocs(historyQuery);
        if (!cancelled) {
          setStyleProfileMemory(
            buildStyleProfileMemory(snapshot.docs.map((item) => item.data()))
          );
        }
      } catch (error) {
        console.warn("Style memory could not be loaded", { code: error?.code });
      }
    }

    loadStyleMemory();
    return () => {
      cancelled = true;
    };
  }, [user.uid]);

  const handleFileChange = (event) => {
    const incoming = Array.from(event.target.files || []);
    event.target.value = "";

    const existing = new Set(selectedFiles.map(fileIdentity));
    const valid = [];

    for (const file of incoming) {
      const error = validateImageFile(file);
      if (error) {
        addToast(error, "error");
      } else if (existing.has(fileIdentity(file))) {
        addToast(`${file.name} is already on your moodboard.`, "info");
      } else {
        existing.add(fileIdentity(file));
        valid.push(file);
      }
    }

    if (selectedFiles.length + valid.length > 6) {
      addToast("A moodboard can contain at most 6 photos.", "error");
      return;
    }

    if (valid.length) {
      setSelectedFiles((current) => [...current, ...valid]);
      addToast(`${valid.length} look${valid.length === 1 ? "" : "s"} added.`, "success");
    }
  };

  const uploadImages = async () => {
    const results = await Promise.allSettled(
      selectedFiles.map(async (file, index) => {
        const uniqueId = crypto.randomUUID();
        const path = `user-uploads/${user.uid}/looks/${Date.now()}-${index}-${uniqueId}.${imageExtension(file)}`;
        const reference = storageRef(storage, path);
        const snapshot = await uploadBytes(reference, file, {
          contentType: file.type,
          cacheControl: "private,max-age=3600",
        });
        return { reference, url: await getDownloadURL(snapshot.ref) };
      })
    );

    const uploaded = results
      .filter((result) => result.status === "fulfilled")
      .map((result) => result.value);
    const failed = results.some((result) => result.status === "rejected");

    if (failed) {
      await Promise.allSettled(uploaded.map((item) => deleteObject(item.reference)));
      throw new Error("One or more images could not be stored.");
    }

    return uploaded;
  };

  const handleAnalyze = async () => {
    if (loading) return;
    if (selectedFiles.length < 3 || selectedFiles.length > 6) {
      addToast("Select between 3 and 6 looks before analyzing.", "error");
      return;
    }

    setLoading(true);
    let uploaded = [];
    let recommendationSaved = false;

    try {
      const idToken = await user.getIdToken();
      const base64Images = await Promise.all(selectedFiles.map(convertToBase64));
      const visionResponses = await Promise.all(
        base64Images.map((imageBase64) =>
          axios.post(
            `${BACKEND_URL}/analyze-image`,
            { imageBase64 },
            {
              headers: { Authorization: `Bearer ${idToken}` },
              timeout: 45_000,
            }
          )
        )
      );

      const analyzedImages = visionResponses.map((response, index) => ({
        image: `Image ${index + 1}`,
        labels: (response.data.labels || []).map((label) => ({
          description: label.description || "Unknown",
          confidence: Number(label.score || 0) * 100,
        })),
      }));

      if (analyzedImages.some((image) => !image.labels.length)) {
        throw new Error("One or more images did not produce usable fashion labels.");
      }

      const fashionResponse = await axios.post(
        `${BACKEND_URL}/analyze-fashion`,
        { images: analyzedImages, styleProfile: styleProfileMemory },
        {
          headers: { Authorization: `Bearer ${idToken}` },
          timeout: 60_000,
        }
      );
      const recommendationItems = fashionResponse.data.recommendations;
      if (!Array.isArray(recommendationItems) || recommendationItems.length !== selectedFiles.length) {
        throw new Error("The stylist returned an incomplete report.");
      }

      uploaded = await uploadImages();
      const images = analyzedImages.map((image, index) => ({
        ...image,
        imageUrl: uploaded[index].url,
      }));
      const fashionRecommendations = recommendationItems
        .map((item) => `Image ${item.imageNumber}: ${item.recommendations.join(", ")}`)
        .join("\n");
      const currentSession = {
        recommendations: {
          images,
          fashionRecommendations,
          recommendationItems,
        },
      };

      let previousSessions = [];
      try {
        const historyQuery = query(
          collection(db, "userRecommendations"),
          where("userId", "==", user.uid),
          orderBy("timestamp", "desc"),
          limit(8)
        );
        const historySnapshot = await getDocs(historyQuery);
        previousSessions = historySnapshot.docs.map((item) => item.data());
      } catch (error) {
        console.warn("Style history refresh failed", { code: error?.code });
      }

      const refreshedStyleProfile = buildStyleProfileMemory([
        currentSession,
        ...previousSessions,
      ]);

      await addDoc(collection(db, "userRecommendations"), {
        userId: user.uid,
        recommendations: currentSession.recommendations,
        styleProfileSnapshot: refreshedStyleProfile,
        timestamp: serverTimestamp(),
      });
      recommendationSaved = true;

      try {
        await setDoc(
          doc(db, "users", user.uid),
          {
            email: user.email,
            styleProfileMemory: refreshedStyleProfile,
            styleProfileUpdatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (error) {
        console.warn("Style profile update failed", { code: error?.code });
      }

      navigate("/recommendations");
    } catch (error) {
      if (uploaded.length && !recommendationSaved) {
        await Promise.allSettled(uploaded.map((item) => deleteObject(item.reference)));
      }
      console.error("Fashion analysis failed", {
        status: error?.response?.status,
        code: error?.code,
      });
      addToast(
        getApiErrorMessage(error, error.message || "Analysis failed. Please try again."),
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="upload-page">
        <h1 className="brand-header">Build Your Moodboard</h1>
        <p className="brand-subtitle">Upload 3-6 photos to generate your curated fashion report.</p>

        <section className="style-memory-banner glass-card" aria-label="Style profile memory">
          <div className="style-memory-copy">
            <span className="style-memory-label">
              <i className="fa-solid fa-microchip me-2" aria-hidden="true" />
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
        </section>

        <div className="moodboard-grid" aria-label="Selected fashion photos">
          {Array.from({ length: 6 }, (_, index) => (
            <div
              key={selectedFiles[index] ? fileIdentity(selectedFiles[index]) : `empty-${index}`}
              className={`moodboard-slot ${selectedFiles[index] ? "filled" : "empty"}`}
            >
              {selectedFiles[index] ? (
                <>
                  <ImagePreview file={selectedFiles[index]} index={index} />
                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() => setSelectedFiles((files) => files.filter((_, itemIndex) => itemIndex !== index))}
                    aria-label={`Remove look ${index + 1}`}
                    disabled={loading}
                  >
                    <i className="fa-solid fa-xmark" aria-hidden="true" />
                  </button>
                </>
              ) : (
                <label htmlFor={`slot-upload-${index}`} className="slot-placeholder">
                  <i className="fa-solid fa-plus" aria-hidden="true" />
                  <span>ADD IMAGE</span>
                  <input
                    type="file"
                    id={`slot-upload-${index}`}
                    accept={ACCEPTED_IMAGE_TYPES.join(",")}
                    onChange={handleFileChange}
                    disabled={loading}
                  />
                </label>
              )}
            </div>
          ))}
        </div>

        <div className="action-area">
          <button
            type="button"
            onClick={handleAnalyze}
            className="accent-btn explore-btn"
            disabled={selectedFiles.length < 3 || loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                Analyzing {selectedFiles.length} looks...
              </>
            ) : "Explore Your Style Report"}
          </button>
          <p className="upload-count" aria-live="polite">
            {selectedFiles.length}/6 looks selected
          </p>
        </div>

        <section className="style-note" aria-labelledby="curator-tips">
          <h2 id="curator-tips">Curator Tips</h2>
          <div className="tip-grid">
            <div className="tip-item"><span className="tip-bullet"><i>01</i></span><p>Ensure clear, well-lit portraits for high-fidelity analysis.</p></div>
            <div className="tip-item"><span className="tip-bullet"><i>02</i></span><p>Minimal backgrounds work best to highlight your silhouette.</p></div>
            <div className="tip-item"><span className="tip-bullet"><i>03</i></span><p>Upload at least 3 distinct looks for a stronger style profile.</p></div>
          </div>
        </section>
      </main>
    </>
  );
}

export default UploadPhoto;
