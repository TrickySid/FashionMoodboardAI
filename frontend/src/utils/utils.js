import axios from "axios";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

// Utility function to convert image to Base64
export const convertToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });

// Utility function to generate a random state string
export const generateRandomState = () => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

// Function to generate Google search links based on recommendations
export const generateGoogleLinks = (recommendation) => {
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

// Function to analyze images and get recommendations
export const analyzeImages = async (selectedFiles, setLoading, setShowRecommendations, setOverallRecommendations, setLabelsByImage, db) => {
  setLoading(true);
  try {
    const base64Images = await Promise.all(
      selectedFiles.map((file) => convertToBase64(file))
    );

    const responses = await Promise.all(
      base64Images.map((imageBase64) =>
        axios.post("https://fashion-moods.wm.r.appspot.com/analyze-image", { imageBase64 })
      )
    );

    const labels = responses.map((response) => response.data.labels);

    const containsDocumentOrPaper = labels.some((imageLabels) =>
      imageLabels.some((label) =>
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
      return;
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

    if (typeof recommendations !== "string") {
      if (Array.isArray(recommendations)) {
        recommendations = recommendations.join("\n");
      } else {
        console.error(
          "Recommendations format is not a string or array:",
          recommendations
        );
        recommendations = "";
      }
    }

    setOverallRecommendations(recommendations);

    await addDoc(collection(db, "userRecommendations"), {
      userId: localStorage.getItem("userEmail"),
      recommendations: {
        images: aggregatedData.map((data) => ({
          image: data.image,
          labels: data.labels,
        })),
        fashionRecommendations: recommendations,
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
