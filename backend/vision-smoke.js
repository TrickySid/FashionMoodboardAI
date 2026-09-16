require("dotenv").config();

const vision = require("@google-cloud/vision");

async function runVisionSmokeTest() {
  if (process.env.RUN_VISION_SMOKE_TEST !== "true") {
    console.error(
      "Vision smoke test skipped. Set RUN_VISION_SMOKE_TEST=true to make one billable API request."
    );
    process.exitCode = 1;
    return;
  }

  const client = new vision.ImageAnnotatorClient();
  const imageBase64 =
    "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

  try {
    await client.annotateImage({
      image: { content: imageBase64 },
      features: [{ type: "LABEL_DETECTION", maxResults: 1 }],
    });
    console.log("Vision API credentials are valid.");
  } catch (error) {
    console.error("Vision API smoke test failed", {
      code: error?.code,
      message: error?.message,
    });
    process.exitCode = 1;
  }
}

runVisionSmokeTest();
