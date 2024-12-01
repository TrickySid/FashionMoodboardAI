require('dotenv').config();
const axios = require('axios');

const CLOUD_VISION_API_KEY = process.env.CLOUD_VISION_API_KEY;
const CHATGPT_API_URL = process.env.CHATGPT_API_URL;
const CHATGPT_API_KEY = process.env.CHATGPT_API_KEY

async function callCloudVision(imageBase64) {
    const visionUrl = `https://vision.googleapis.com/v1/images:annotate?key=${CLOUD_VISION_API_KEY}`;
    const requestBody = {
        requests: [
            {
                image: { content: imageBase64 },
                features: [{ type: "LABEL_DETECTION", maxResults: 10 }],
            },
        ],
    };

    try {
        const response = await axios.post(visionUrl, requestBody);
        return response.data.responses[0].labelAnnotations; 
    } catch (error) {
        console.error("Error calling Cloud Vision API:", error.response?.data || error.message);
        throw error;
    }
}
async function callChatGptFashionApi(clothingData) {
    try {
        const response = await axios.post(CHATGPT_API_URL,clothingData,
        {
            headers: {
                "Authorization": `Bearer ${CHATGPT_API_KEY}`,
                "Content-Type": "application/json"
            }
        });
        return response.data;
    } catch (error) {
        console.error("Error calling ChatGPT Fashion API:", error.response?.data || error.message);
        throw error;
    }
}


// Main function
(async function main() {
    try {
        const fs = require('fs');
        const imagePath = './image.jpg';
        const imageBase64 = fs.readFileSync(imagePath, 'base64');
    
        console.log("Calling Cloud Vision API...");
        const visionResponse = await callCloudVision(imageBase64);
        console.log("Cloud Vision Response:", visionResponse);
        const clothingData = {
            clothingLabels: visionResponse.map((item) => ({
                description: item.description,
                score: item.score,
            })),
        };
        console.log("Calling ChatGPT Fashion API...");
        const chatGptResponse = await callChatGptFashionApi(clothingData);
        console.log("ChatGPT API Response:", chatGptResponse);
    } catch (error) {
        console.error("An error occurred:", error.message);
    }
})();


