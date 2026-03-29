import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import { db, auth } from "../firebase";
import { collection, query, getDocs, orderBy, limit, where } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/Recommendations.css";

function Recommendations() {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  // Helper to extract the specific recommendation for a given image index (1-based)
  const getRecommendationForImage = (text, imageNumber) => {
    if (!text) return [];
    // Split the text to find the lines for Image X
    const lines = text.split("\n");
    const targetPrefix = `Image ${imageNumber}`;
    
    for (let line of lines) {
      if (line.trim().startsWith(targetPrefix)) {
        // Remove "Image X:" or "Image X :"
        const content = line.replace(new RegExp(`^${targetPrefix}\\s*[:\\-]\\s*`), "").trim();
        // Return content as a list of sentences by splitting smartly
        return content.split(/(?<=\.)\s+/).filter(Boolean);
      }
    }
    return [text]; // Fallback
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
    let unsubscribe;
    const fetchRecommendations = async (user) => {
      try {
        const recQuery = query(
          collection(db, "userRecommendations"),
          where("userId", "==", user.uid),
          orderBy("timestamp", "desc"),
          limit(10)
        );
        const snapshot = await getDocs(recQuery);
        const userRecommendations = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setRecommendations(userRecommendations);
      } catch (error) {
        console.error("Error fetching recommendations:", error);
      }
    };

    unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsLoggedIn(true);
        fetchRecommendations(user);
      } else {
        setIsLoggedIn(false);
        setRecommendations([]);
        navigate("/login");
      }
    });

    return () => unsubscribe && unsubscribe();
  }, []);

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  return (
    <>
      <Navbar isLoggedIn={isLoggedIn} onLogout={handleLogout} />
      <div className="recommendations">
        <div className="container py-5">
          <div className="header-section text-center mb-5">
            <h2 className="title">Improve Your Style</h2>
            <p className="sub-title">AI Curation from Your Fashion Snapshots</p>
          </div>

          <div className="rec-timeline">
            {recommendations.length > 0 ? (
              recommendations.map((session) => (
                <div key={session.id} className="session-group mb-5">
                  <div className="session-date mb-4">
                    <span className="badge-date">
                      {session.timestamp
                        ? new Date(session.timestamp.toDate()).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
                        : "Recent Snapshot"}
                    </span>
                  </div>

                  <div className="row g-4">
                    {session.recommendations.images?.map((img, imgIdx) => {
                      const imageNumber = imgIdx + 1;
                      const recSentences = getRecommendationForImage(session.recommendations.fashionRecommendations, imageNumber);
                      const fullRecString = recSentences.join(" ");

                      return (
                        <div key={imgIdx} className="col-12">
                          <div className="editorial-card">
                            <div className="rec-image-wrapper">
                              <img 
                                src={img.imageUrl} 
                                alt={`Look ${imageNumber}`} 
                                className="look-img" 
                              />
                            </div>
                            
                            <div className="content-wrapper">
                              <h3 className="look-number">Look 0{imageNumber}</h3>
                              <div className="rec-points mt-3">
                                {recSentences.map((sentence, sIdx) => (
                                  <p key={sIdx} className="rec-text">
                                    <i className="fa-solid fa-angle-right bullet-icon"></i> 
                                    {sentence}
                                  </p>
                                ))}
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
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default Recommendations;
