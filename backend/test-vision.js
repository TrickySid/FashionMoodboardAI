require('dotenv').config();
const vision = require('@google-cloud/vision');

async function testVision() {
  const client = new vision.ImageAnnotatorClient();
  try {
    // We send a tiny valid base64 image (a 1x1 pixel) to test the Vision API auth & enabling
    const imageBase64 = "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"; 
    const [result] = await client.annotateImage({
      image: { content: imageBase64 },
      features: [{ type: "LABEL_DETECTION", maxResults: 1 }]
    });
    console.log("Vision API Success! Labels:", result.labelAnnotations);
  } catch (error) {
    console.error("Vision API Error Details:", error.message);
  }
}

testVision();
