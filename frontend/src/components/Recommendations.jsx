import React, { useState, useEffect } from "react";
import Navbar from "./Navbar";
import { db, auth } from "../firebase";
import { collection, query, getDocs, orderBy, limit, where } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/Recommendations.css";

function Recommendations() {
  const [recommendations, setRecommendations] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  // Function to sanitize and clean up the recommendation text
  const sanitizeRecommendation = (text) => {
    // Regex to find "Image 1", "Image 2", etc., and make it bold
    let sanitizedText = text
      .replace(/[-*]+/g, "") // Remove stars and hyphens
      .replace(/\n\s*\n/g, "\n") // Replace multiple empty lines with a single line break
      .replace(/(Image \d+)/g, "<strong>$1</strong>") // Make "Image 1", "Image 2", etc. bold
      .trim(); // Remove leading/trailing whitespace
    return sanitizedText;
  };

  useEffect(() => {
    let unsubscribe;
    const fetchRecommendations = async (user) => {
      try {
        console.log("Fetching for user:", user.uid);
        const recQuery = query(
          collection(db, "userRecommendations"),
          where("userId", "==", user.uid),
          orderBy("timestamp", "desc"),
          limit(6)
        );
        const snapshot = await getDocs(recQuery);
        const userRecommendations = snapshot.docs.map((doc) => doc.data());
        console.log("Fetched recommendations:", userRecommendations);
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
      }
    });

    return () => unsubscribe && unsubscribe();
  }, []); // Empty dependency array means this runs only once

  const handleLogout = () => {
    setIsLoggedIn(false); // Set isLoggedIn to false on logout
  };

  return (
    <>
      <Navbar isLoggedIn={isLoggedIn} onLogout={handleLogout} />
      <div className="recommendations d-flex justify-content-center align-items-start p-4">
        <div className="container">
          <h2 className="title mb-4">Improve Your Style</h2>
          <p className="sub-title mb-4">
            AI Recommendations from your past Fashion
          </p>

          <div className="rec-cards row g-4">
            {/* Loop through recommendations */}
            {recommendations.length > 0 ? (
              recommendations.map((recommendation, index) => (
                <div key={index} className="col-12 col-md-6 col-lg-6">
                  <div className="card p-3">
                    <div className="text-start">
                      {/* Display fashion recommendations without list items or numbers */}
                      {recommendation.recommendations.fashionRecommendations
                        .split("\n") // Split recommendations by line breaks
                        .map((reco, idx) => {
                          // Sanitize each recommendation before displaying
                          const cleanedReco = sanitizeRecommendation(reco);
                          if (cleanedReco) {
                            return (
                              <React.Fragment key={idx}>
                                {/* Insert raw HTML (sanitized recommendations) */}
                                <p
                                  className="rec-text"
                                  dangerouslySetInnerHTML={{
                                    __html: cleanedReco,
                                  }}
                                />
                                {/* Line break between different recommendations */}
                              </React.Fragment>
                            );
                          }
                          return null; // Skip empty lines
                        })}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="nothing">No recommendations available yet.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default Recommendations;
