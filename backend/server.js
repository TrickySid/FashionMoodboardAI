// Import necessary modules
const express = require("express"); // Import Express framework
const bodyParser = require("body-parser"); // Import body-parser for parsing JSON requests
const axios = require("axios"); // Import axios for making HTTP requests
const cors = require("cors"); // Import CORS to allow cross-origin requests

const admin = require("firebase-admin");
require("dotenv").config();

const PINTEREST_API_VERSION = "v5";
const PINTEREST_BASE_URL = `https://api.pinterest.com/${PINTEREST_API_VERSION}`;

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  }),
});
// Create an Express application
const app = express();
app.use(bodyParser.json({ limit: "10mb" })); // Middleware to parse JSON with a size limit
app.use(cors()); // Enable CORS for all routes

const GOOGLE_API_KEY = "GOOGLE_API_KEY";

const OPENAI_API_KEY = "OPENAI_API_KEY";

const CLIENT_ID =
  "http://52814765259-7c2sab3ad08eu52rpklsfk21t9udpqnb.apps.googleusercontent.com";

// Root route to check server status
app.get("/", (req, res) => {
  res.send("Fashion Moodboard AI"); // Return a simple message to indicate server is running
});

// Endpoint to analyze images using Google Vision API
app.post("/analyze-image", async (req, res) => {
  const { imageBase64 } = req.body; // Extract image data from request

  if (!imageBase64) {
    return res.status(400).json({ error: "Image data is required" }); // Validate input
  }

  try {
    // Make a request to Google Vision API
    const response = await axios.post(
      `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_API_KEY}`,
      {
        requests: [
          {
            image: { content: imageBase64 },
            features: [
              { type: "LABEL_DETECTION", maxResults: 10 }, // Detect labels
              { type: "IMAGE_PROPERTIES" }, // Analyze image properties
            ],
          },
        ],
      }
    );

    // Extract labels and colors from API response
    const labels = response.data.responses[0]?.labelAnnotations || []; // Extract labels
    const colors =
      response.data.responses[0]?.imagePropertiesAnnotation?.dominantColors
        ?.colors || []; // Extract dominant colors
    res.status(200).json({ labels, colors }); // Send results back to client
  } catch (error) {
    console.error(
      "Error analyzing image:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: "Failed to analyze image" }); // Handle errors
  }
});

// Endpoint to generate fashion recommendations using OpenAI
app.post("/analyze-fashion", async (req, res) => {
  const { images } = req.body; // Extract image data from request

  if (!images || !Array.isArray(images)) {
    return res.status(400).json({ error: "Invalid input data" }); // Validate input
  }

  // Create a prompt for the OpenAI model
  const prompt = `
You are a fashion stylist. Analyze the following images based on their labels and confidence scores. Provide recommendations for improving the outfits or looks, including tips for enhancing confidence:
${images
  .map(
    (img, i) =>
      `Image ${i + 1}: ${img.labels
        .map(
          (label) => `${label.description} (${label.confidence}% confidence)`
        )
        .join(", ")}`
  )
  .join("\n")}

Respond with clear, actionable fashion tips for the user to look better and improve their looks.
`;

  try {
    // Make a request to OpenAI API
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo", // Specify the model to use
        messages: [
          { role: "system", content: "You are a helpful fashion stylist." },
          { role: "user", content: prompt },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`, // Use API key for authorization
          "Content-Type": "application/json",
        },
      }
    );

    // Extract recommendations from API response
    const recommendations = response.data.choices[0].message.content.trim();
    res.status(200).json({ recommendations }); // Send recommendations back to client
  } catch (error) {
    console.error(
      "Error generating recommendations:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: "Failed to generate recommendations" }); // Handle errors
  }
});

// Signup route
app.post("/signup", async (req, res) => {
  const { email, password } = req.body;

  try {
    const userRecord = await admin.auth().createUser({
      email,
      password,
    });
    res
      .status(201)
      .send({ message: "User created successfully", userId: userRecord.uid });
  } catch (error) {
    console.error("Error creating new user:", error);
    res.status(400).send({ error: error.message });
  }
});

// Login route
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await admin.auth().getUserByEmail(email);
    const token = await admin.auth().createCustomToken(user.uid);
    res
      .status(200)
      .send({ message: "Login successful", token, email: user.email });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(401).send({ error: "Invalid email or password" });
  }
});

// Endpoint to get Pinterest OAuth URL
app.get("/pinterest/auth", (req, res) => {
  const clientId = process.env.PINTEREST_APP_ID;
  const redirectUri = encodeURIComponent(process.env.PINTEREST_REDIRECT_URI);
  const scope = encodeURIComponent("boards:read,pins:read,pins:write");
  const responseType = "code";

  const authUrl = `https://www.pinterest.com/oauth/?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=${responseType}&scope=${scope}`;

  res.json({ authUrl });
});

// Add qs library to serialize data
const qs = require("qs");

// Endpoint to handle Pinterest OAuth callback
// Endpoint to handle Pinterest OAuth callback
app.get("/pinterest/callback", async (req, res) => {
  const { code } = req.query; // Get the 'code' query param

  if (!code) {
    console.error("Authorization code is missing in the callback request");
    return res.status(400).json({ error: "Authorization code is missing" });
  }

  try {
    // Request body to exchange code for access token and refresh token
    const requestBody = qs.stringify({
      grant_type: "authorization_code",
      code, // Authorization code from Pinterest
      redirect_uri: process.env.PINTEREST_REDIRECT_URI, // Your redirect URI
    });

    const response = await axios.post(
      "https://api.pinterest.com/v5/oauth/token", // Pinterest OAuth token endpoint
      requestBody, // Serialize data
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded", // Form data
        },
        auth: {
          username: process.env.PINTEREST_APP_ID, // Pinterest App ID (from .env)
          password: process.env.PINTEREST_APP_SECRET, // Pinterest App Secret (from .env)
        },
      }
    );

    const { access_token, refresh_token } = response.data;
    console.log("Pinterest OAuth success:", { access_token, refresh_token });

    // Construct the redirect URL for the frontend after successful authentication
    const redirectUrl = `${process.env.CLIENT_FRONTEND_URL}/upload?access_token=${access_token}&refresh_token=${refresh_token}`;

    console.log("Redirecting to frontend with URL:", redirectUrl);

    // Redirect to frontend application (localhost:3000/upload) with tokens in the URL
    res.redirect(redirectUrl); // Redirect to /upload with the tokens
  } catch (error) {
    console.error(
      "Pinterest OAuth error:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: "Failed to authenticate with Pinterest" });
  }
});

// Endpoint to get user's Pinterest boards
app.get("/pinterest/boards", async (req, res) => {
  try {
    const response = await axios.get(`${PINTEREST_BASE_URL}/boards`, {
      headers: {
        Authorization: `Bearer ${req.headers.pinterest_token}`,
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error(
      "Error fetching boards:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: "Failed to fetch Pinterest boards" });
  }
});

// Endpoint to get pins from a specific board
app.get("/pinterest/boards/:boardId/pins", async (req, res) => {
  try {
    const { boardId } = req.params;
    const response = await axios.get(
      `${PINTEREST_BASE_URL}/boards/${boardId}/pins`,
      {
        headers: {
          Authorization: `Bearer ${req.headers.pinterest_token}`,
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error(
      "Error fetching pins:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: "Failed to fetch Pinterest pins" });
  }
});

// Endpoint to search pins
app.get("/pinterest/search/pins", async (req, res) => {
  try {
    const { query } = req.query;
    const response = await axios.get(`${PINTEREST_BASE_URL}/pins/search`, {
      params: {
        query,
        limit: 50,
      },
      headers: {
        Authorization: `Bearer ${req.headers.pinterest_token}`,
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error(
      "Error searching pins:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: "Failed to search Pinterest pins" });
  }
});

// Start the server and listen on the specified port
const PORT = process.env.PORT || 8080; // Use environment variable or default to 8080
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
