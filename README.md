# Fashion Moodboard AI

Fashion Moodboard AI is a full-stack fashion analysis application. An authenticated user uploads 3-6 outfit photos, Google Cloud Vision extracts visual labels, and a configurable language model turns those labels into an editorial-style report. Reports, image references, and an evolving style-profile summary are saved to the user's private fashion history.

Live frontend: https://fashion-moodboard-ai-a955c.web.app

## Product capabilities

- Public animated landing page with a custom black, white, and neon-lime editorial design system
- Email/password authentication and protected application routes
- Validated 3-6 image moodboards with previews and duplicate-submission protection
- Two-stage AI pipeline: Google Cloud Vision labels followed by LLM recommendations
- Persistent recommendation history and user-specific style-profile memory
- Profile photo, display-name, and password management
- Safe Google shopping-search shortcuts extracted from recommendation text

The search chips are outbound Google searches. The project does not currently integrate a retailer catalog, product inventory, pricing API, or affiliate system.

## Architecture

```text
Browser
  |-- Firebase Authentication (email/password session)
  |-- React application
  |     |-- Cloud Firestore (user profile and recommendation history)
  |     `-- Firebase Storage (look images and profile photos)
  |
  `-- Firebase ID token --> Express API on Cloud Run
                              |-- Google Cloud Vision
                              `-- NVIDIA or OpenAI-compatible LLM API
```

Firestore and Storage are accessed directly through the Firebase client SDK. Their authorization boundary is therefore the source-controlled Firebase Security Rules. The backend independently verifies Firebase ID tokens and never accepts a client-supplied UID as proof of identity.

## Technology stack

### Frontend

- React 19 and React Router 7
- Vite 8
- GSAP and ScrollTrigger
- Bootstrap utilities plus custom CSS
- Firebase Authentication, Cloud Firestore, Storage, and Analytics

### Backend and AI

- Node.js 22 and Express 5
- Firebase Admin SDK for ID-token verification
- Google Cloud Vision label and image-property detection
- Axios-based OpenAI-compatible LLM client
- Helmet, allowlisted CORS, authenticated per-user rate limits, and bounded request validation
- Docker and Google Cloud Run

### Deployment and quality

- Firebase Hosting for the Vite build in `frontend/build`
- GitHub Actions for frontend tests/lint/build, backend tests/checks, dependency auditing, and Hosting deployment
- Node's built-in test runner for backend security and validation tests
- Vitest and Testing Library for frontend route and file-validation tests

## Request and data flow

1. Firebase Authentication establishes the browser session.
2. A protected route waits for Firebase's initial auth result before rendering.
3. The browser validates selected JPEG, PNG, or WebP files up to 5 MB.
4. Each image is sent as base64 to `POST /analyze-image` with a fresh Firebase ID token.
5. Express verifies the token, validates the encoded image and magic bytes, rate-limits the verified UID, and calls Vision.
6. The browser sends bounded Vision labels and style-memory context to `POST /analyze-fashion`.
7. The backend treats label text as untrusted data, calls the configured LLM with a timeout, and validates the returned JSON schema.
8. Only after both AI stages succeed are images stored and a user-owned report written to Firestore.

The LLM receives structured labels and style context, not the original image bytes. Model output is rendered as React text rather than executable HTML.

## Security controls

- Firebase ID-token verification pinned to the frontend Firebase project on both billable AI endpoints
- Firestore and Storage rules scoped to `request.auth.uid`
- JPEG/PNG/WebP signature checks and a 5 MB image limit on both client and server
- Strict 3-6 look and label-schema validation before LLM use
- Authenticated per-user rate limits for Vision and recommendation requests
- Explicit CORS origin allowlist with localhost development defaults
- Provider request timeouts, bounded response size, and validated LLM output
- Helmet response headers, controlled API errors, and logs that omit tokens and payloads
- Non-root Node 22 Docker image with `.env` and credential files excluded
- Backend secrets remain server-side; no LLM or Google service-account key uses a `VITE_*` variable

Firebase App Check is not enabled in this repository. Enabling it requires registering the deployed web app and enforcing App Check in the Firebase and Cloud environments; see the deployment notes below.

## Local development

Requirements: Node.js 22, a Firebase project, Google Application Default Credentials with Vision access, and an LLM provider key.

Create `backend/.env` locally. It is ignored by Git:

```env
PORT=5000
GOOGLE_APPLICATION_CREDENTIALS=./google-credentials.json
FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
FIREBASE_PROJECT_ID=fashion-moodboard-ai-a955c

LLM_PROVIDER=nvidia
NVOPENAI_API_KEY=your_nvidia_key
NVIDIA_MODEL=openai/gpt-oss-120b

# Comma-separated production and development frontend origins.
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

To use OpenAI instead:

```env
LLM_PROVIDER=openai
OPENAI_API_KEY=your_openai_key
OPENAI_MODEL=gpt-5-mini
```

The checked-in Firebase web configuration is public client configuration, not a server credential. It can be overridden for another Firebase project with the `VITE_FIREBASE_*` variables referenced in `frontend/src/firebase.js`.

Install and run:

```bash
cd backend
npm ci
npm start
```

```bash
cd frontend
npm ci
npm run dev
```

Set `VITE_BACKEND_URL=http://localhost:5000` in `frontend/.env` for local API calls.

## Verification

From the repository root:

```bash
npm run check
```

Individual commands:

```bash
npm --prefix backend run check
npm --prefix backend test
npm --prefix frontend run lint
npm --prefix frontend test
npm --prefix frontend run build
```

`npm --prefix backend run test:vision` is intentionally opt-in and requires `RUN_VISION_SMOKE_TEST=true` because it makes a billable external API request.

## Deployment notes

- GitHub Actions deploys only Firebase Hosting. It does not deploy the Cloud Run backend or Firebase rules.
- Before relying on the new access controls in production, review and manually deploy `firestore.rules`, `storage.rules`, and `firestore.indexes.json` with the Firebase CLI.
- Configure `ALLOWED_ORIGINS` on Cloud Run with every real frontend origin, including any custom domain.
- Configure `FIREBASE_PROJECT_ID=fashion-moodboard-ai-a955c` on Cloud Run. This must identify the Firebase Authentication project even when Cloud Run runs in another Google Cloud project.
- Store backend keys as Cloud Run secrets/environment configuration. Do not bake `.env` or service-account JSON into the image.
- Prefer a dedicated least-privilege Cloud Run service account with Vision access and Firebase token-verification capability.
- The in-memory rate limiter is per Cloud Run instance. Set conservative Cloud Run maximum instances and billing alerts for stronger cost containment.
- Firebase App Check can add abuse resistance, but it should only be enforced after the frontend is registered and verified in Firebase Console.

## Screenshots

<img width="1900" height="865" alt="Fashion Moodboard AI landing page" src="https://github.com/user-attachments/assets/6abf1092-2036-41d7-bd13-a850714132e7" />
<img width="1893" height="860" alt="Fashion Moodboard AI product overview" src="https://github.com/user-attachments/assets/bee5d3a9-0e56-424e-8c9c-e68339e38207" />
<img width="1897" height="858" alt="Fashion Moodboard AI editorial interface" src="https://github.com/user-attachments/assets/721c8326-0f0b-4384-9cb3-783f3ca1cb24" />

Developed by [Siddhesh Bakre](https://github.com/TrickySid).
