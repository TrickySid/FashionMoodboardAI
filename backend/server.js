// Import necessary modules
const express = require("express"); // Import Express framework
const bodyParser = require("body-parser"); // Import body-parser for parsing JSON requests
const axios = require("axios"); // Import axios for making HTTP requests
const cors = require("cors"); // Import CORS to allow cross-origin requests
const admin = require('firebase-admin'); // Import Firebase Admin SDK
const serviceAccount = require('/Users/daipayanhati/Desktop/Personal Projects/Assignment/Web systems/FashionMoodboardAI/backend/fashion-mood-frontend-firebase-adminsdk-c2vgh-b9a86142ff.json');
require('dotenv').config();

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'fashion-mood-frontend',
});

// Create an Express application
const app = express();
app.use(bodyParser.json({ limit: "10mb" })); // Middleware to parse JSON with a size limit
app.use(cors()); // Enable CORS for all routes

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

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
app.post('/signup', async (req, res) => {
  const { email, password } = req.body;

  try {
    const userRecord = await admin.auth().createUser({
      email,
      password,
    });
    res.status(201).send({ message: 'User created successfully', userId: userRecord.uid });
  } catch (error) {
    console.error('Error creating new user:', error);
    res.status(400).send({ error: error.message });
  }
});

// Login route
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await admin.auth().getUserByEmail(email);
    const token = await admin.auth().createCustomToken(user.uid);
    res.status(200).send({ message: 'Login successful', token, email: user.email });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(401).send({ error: 'Invalid email or password' });
  }
});

// Start the server and listen on the specified port
const PORT = process.env.PORT || 8080; // Use environment variable or default to 8080
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
