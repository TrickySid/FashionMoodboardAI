import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "./Navbar";
import { db } from "../firebaseData";
import {
  collection,
  query,
  getDocs,
  orderBy,
  limit,
  where,
  doc,
  getDoc,
} from "firebase/firestore";
import "../styles/Recommendations.css";
import { buildStyleProfileMemory, getRecommendationTextForImage } from "../utils/styleProfile";
import { useAuth } from "../auth/AuthContext";
import { safeImageUrl } from "../utils/urls";

function Recommendations() {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [styleProfileMemory, setStyleProfileMemory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  // Helper to extract the specific recommendation for a given image index (1-based)
  const getRecommendationForImage = (session, imageNumber) => {
    const text = getRecommendationTextForImage(session, imageNumber);
    if (!text) return [];
    return text.split(/(?<=\.)\s+|,\s+(?=[A-Z])/).filter(Boolean);
  };

  const renderEditorialSelection = (text) => {
    if (!text) return null;
    
    // Extracted colors with broader fashion palette
    const colorNames = text.match(/\b(?:black|white|red|navy|blue|green|beige|tan|grey|gray|cream|burgundy|maroon|gold|silver|charcoal|olive|teal|peach|crimson|khaki|lavender|mint|coral|mustard)\b/gi) || ["black", "charcoal", "grey"];
    const uniqueColors = [...new Set(colorNames.map(c => c.toLowerCase()))].slice(0, 5);

    // Fashion keywords
    const keywords = text.toLowerCase().match(
      /\b(?:dress|jewelry|shirt|blazer|shoes|pants|scarf|watch|loafers|sneakers|jacket|coat|boots|outfit|heels|bag|accessories|accessory)\b/g
    );
    const baseGoogleUrl = "https://www.google.com/search?q=shop+";

    return (
      <div className="editorial-selection">
        <div className="selection-header">
          <div className="selection-label-group">
            <span className="selection-label">Editorial Selection</span>
            <div className="color-strip">
              {uniqueColors.map((color, i) => (
                <div key={i} className={`color-dot color-${color}`} style={{ backgroundColor: color }} title={color} />
              ))}
            </div>
          </div>
        </div>
        
        <div className="curated-tags">
          {keywords && [...new Set(keywords)].map((keyword, index) => (
            <a
              key={index}
              href={`${baseGoogleUrl}${encodeURIComponent(keyword)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="curated-tag"
            >
              <i className="fa-solid fa-magnifying-glass tag-icon"></i>
              {keyword}
            </a>
          ))}
          {!keywords && (
             <a
              href={`${baseGoogleUrl}styling+outfit`}
              target="_blank"
              rel="noopener noreferrer"
              className="curated-tag"
            >
              <i className="fa-solid fa-sparkles tag-icon"></i>
              Full Look
            </a>
          )}
        </div>
      </div>
    );
  };

  useEffect(() => {
    let cancelled = false;

    const fetchRecommendations = async () => {
      setLoading(true);
      setError("");
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const recQuery = query(
          collection(db, "userRecommendations"),
          where("userId", "==", user.uid),
          orderBy("timestamp", "desc"),
          limit(10)
        );
        const snapshot = await getDocs(recQuery);
        const userRecommendations = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        if (!cancelled) {
          setRecommendations(userRecommendations);
          setStyleProfileMemory(
            userDoc.data()?.styleProfileMemory ||
              userRecommendations[0]?.styleProfileSnapshot ||
              buildStyleProfileMemory(userRecommendations)
          );
        }
      } catch (error) {
        console.error("Recommendation history load failed", { code: error?.code });
        if (!cancelled) setError("Your fashion vault could not be loaded. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchRecommendations();

    return () => {
      cancelled = true;
    };
  }, [reloadKey, user.uid]);

  return (
    <>
      <Navbar />
      <main className="recommendations">
        <div className="container py-5">
          <div className="header-section text-center mb-5">
            <h2 className="title">Improve Your Style</h2>
            <p className="sub-title">AI Curation from Your Fashion Snapshots</p>
          </div>

          {styleProfileMemory && (
            <div className="style-memory-panel">
              <div className="memory-kicker">
                <i className="fa-solid fa-dna me-2"></i>
                Persistent Style Memory
              </div>
              <div className="memory-layout">
                <div>
                  <h3>Editorial profile</h3>
                  <p>{styleProfileMemory.summary}</p>
                </div>
                <div className="memory-metrics">
                  <span>
                    <i className="fa-solid fa-layer-group me-2"></i>
                    {styleProfileMemory.sourceLooks || 0} looks learned
                  </span>
                  <span>
                    <i className="fa-solid fa-chart-line me-2"></i>
                    {styleProfileMemory.memoryStatus || "new"} profile
                  </span>
                  <span>
                    <i className="fa-solid fa-gauge-high me-2"></i>
                    {styleProfileMemory.confidence || "low"} confidence
                  </span>
                </div>
              </div>
              <div className="memory-tags">
                {styleProfileMemory.preferredColors?.map((entry) => (
                  <span key={`color-${entry.name}`} className="memory-tag">
                    <i className="fa-solid fa-palette me-2"></i>
                    {entry.name}
                  </span>
                ))}
                {styleProfileMemory.recurringPieces?.map((entry) => (
                  <span key={`piece-${entry.name}`} className="memory-tag">
                    <i className="fa-solid fa-shirt me-2"></i>
                    {entry.name}
                  </span>
                ))}
                {styleProfileMemory.stylingThemes?.map((entry) => (
                  <span key={`theme-${entry.name}`} className="memory-tag">
                    <i className="fa-solid fa-wand-magic-sparkles me-2"></i>
                    {entry.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="rec-timeline">
            {loading ? (
              <div className="vault-state" aria-live="polite" aria-busy="true">
                <span className="spinner-border" aria-hidden="true" />
                <p>Opening your fashion vault...</p>
              </div>
            ) : error ? (
              <div className="vault-state" role="alert">
                <p>{error}</p>
                <button type="button" className="accent-btn" onClick={() => setReloadKey((value) => value + 1)}>
                  Try Again
                </button>
              </div>
            ) : recommendations.length > 0 ? (
              recommendations.map((session) => (
                <div key={session.id} className="session-group mb-5">
                  <div className="session-date mb-4">
                    <span className="badge-date">
                      {session.timestamp?.toDate
                        ? session.timestamp.toDate().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
                        : "Recent Snapshot"}
                    </span>
                  </div>

                  <div className="row g-4">
                    {session.recommendations?.images?.map((img, imgIdx) => {
                      const imageNumber = imgIdx + 1;
                      const recSentences = getRecommendationForImage(session, imageNumber);
                      const fullRecString = recSentences.join(" ");

                      return (
                        <div key={imgIdx} className="col-12">
                          <div className="editorial-card">
                            <div className="rec-image-wrapper">
                              <img 
                                src={safeImageUrl(img.imageUrl)}
                                alt={`Look ${imageNumber}`} 
                                className="look-img"
                                loading="lazy"
                                decoding="async"
                              />
                            </div>
                            
                            <div className="content-wrapper">
                              <h3 className="look-number">Look 0{imageNumber}</h3>
                              <div className="rec-points mt-3">
                                {recSentences.length ? recSentences.map((sentence, sIdx) => (
                                  <p key={sIdx} className="rec-text">
                                    <i className="fa-solid fa-angle-right bullet-icon" aria-hidden="true"></i>
                                    {sentence}
                                  </p>
                                )) : <p className="rec-text">No recommendation text was saved for this look.</p>}
                              </div>
                              
                              <div className="curated-section mt-4">
                                {renderEditorialSelection(fullRecString)}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center mt-5">
                <p className="nothing">No fashion records found yet. Upload photos to generate your first report!</p>
                <Link to="/upload" className="accent-btn d-inline-block text-decoration-none mt-3">Build a Moodboard</Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

export default Recommendations;
