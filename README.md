# ⚡ FASHION MOODBOARD AI
### *Elevating Style through Kinetic Editorial AI Analysis*

**Developed & Engineered by [Siddhesh Bakre](https://github.com/TrickySid)**

---

## 🖤 THE VISION
**Fashion Moodboard AI** is a premium, high-end fashion analysis platform that bridges the gap between raw snapshots and professional curation. Using a custom **"Kinetic Editorial"** design system, the application uses advanced Computer Vision and Large Language Models to decode your style and provide actionable, boutique-level fashion recommendations.

###Home Page Screenshot
<img width="1918" height="864" alt="image" src="https://github.com/user-attachments/assets/ee4607ae-e0fa-4386-8bb5-55d2e9d584a7" />

---

## 🚀 CORE FEATURES

-   **🎬 Kinetic Landing Experience**: A high-performance, GSAP-powered floating gallery that reacts to your presence.
-   **🧠 Multi-Stage AI Analysis**:
    *   **Vision Engine**: Powered by **Google Cloud Vision API**, the app extracts deep labels and confidence scores from your fashion snapshots.
    *   **Style Architect**: An **NVIDIA-powered LLM (GPT-OSS-120B)** acts as your personal stylist, turning raw data labels into professional fashion advice.
-   **📑 Editorial Style Reports**: Individualized, horizontal "Look Cards" that pair your photos with parsed, bulleted AI recommendations.
-   **🏷️ Smart Search Integration**: Automatic keyword extraction that generates instant "Shop" links for recommended items.
-   **☁️ Persistent Fashion Vault**: Securely stored analysis history using **Firebase** and **GCP**, allowing you to track your style evolution over time.

---

## 🛠️ THE TECH STACK

### **Frontend**
-   **React 18 (Vite)**: Rapid, modular UI development.
-   **GSAP (GreenSock)**: Orchestrating high-end "Kinetic" animations.
-   **Vanilla CSS + Glassmorphism**: Custom design tokens for a premium editorial aesthetic.
-   **Firebase SDK**: Real-time Authentication and Firestore integration.

### **Backend & AI**
-   **Node.js / Express**: Robust API orchestration.
-   **GCP Vision API**: Complex object detection and image labeling.
-   **OpenAI API**: Advanced styling logic and natural language generation.
-   **Firebase Admin SDK**: Secure server-side resource management and CORS handling.

---

## 🕹️ INSTALLATION & SETUP

### **1. Clone the Repository**
```bash
git clone https://github.com/TrickySid/FashionMoodboardAI.git
cd FashionMoodboardAI
```

### **2. Backend Configuration**
Create a `.env` file in the `backend/` directory:
```env
PORT=5000
OPENAI_API_KEY=your_api_key
GOOGLE_APPLICATION_CREDENTIALS=./google-credentials.json
```
*Make sure to place your Google Cloud Service Account JSON as `google-credentials.json` in the backend folder.*

### **3. Frontend Configuration**
Create a `.env` file in the `frontend/` directory:
```env
VITE_BACKEND_URL=http://localhost:5000
# Add your Firebase Web Config values here
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
...
```

### **4. Run Locally**
**Backend:**
```bash
cd backend
npm install
node server.js
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## 🔒 PRIVACY & SECURITY
User data and fashion snapshots are securely stored in private **Firebase Storage** buckets and **Cloud Firestore** instances. All AI analysis is processed server-side with strict Auth-Token verification to ensure your fashion data remains yours.

---

**Designed with passion for the intersection of Fashion and AI.**  
*© 2026 Siddhesh Bakre*
