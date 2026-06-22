import React from "react";
import "../styles/PrivacyPolicy.css";

const PrivacyPolicy = () => {
  return (
    <main className="legal-page">
      <section className="legal-hero">
        <p className="legal-kicker">Fashion Moodboard AI</p>
        <h1>Privacy Policy</h1>
        <p className="legal-updated">Effective date: June 22, 2026</p>
      </section>

      <section className="legal-card">
        <p>
          Fashion Moodboard AI is a portfolio fashion analysis and moodboard
          application created by Siddhesh Bakre. This Privacy Policy explains
          what information the app collects, how it is used, and what choices
          you have.
        </p>

        <p className="legal-callout">
          This app is currently a portfolio demo. Please do not upload
          sensitive, private, confidential, or highly personal images.
        </p>

        <h2>1. Information We Collect</h2>
        <ul>
          <li>
            <strong>Account information:</strong> Email address, Firebase user
            ID, login status, and optional display name or profile photo.
          </li>
          <li>
            <strong>Uploaded images:</strong> Images you upload for fashion
            analysis and profile photos you choose to add.
          </li>
          <li>
            <strong>Style analysis data:</strong> Image labels, confidence
            scores, dominant visual signals, generated recommendations, style
            profile memory, and timestamps.
          </li>
          <li>
            <strong>Usage and device data:</strong> Basic analytics, logs,
            browser/device information, IP address, and interaction data that
            may be collected by Firebase, hosting, or backend services.
          </li>
        </ul>

        <h2>2. How We Use Information</h2>
        <ul>
          <li>Authenticate users and keep accounts secure.</li>
          <li>Upload and display photos inside your account experience.</li>
          <li>Analyze images with computer vision services.</li>
          <li>Generate fashion recommendations and moodboard history.</li>
          <li>Maintain a style profile memory for future recommendations.</li>
          <li>Debug, secure, monitor, and improve the application.</li>
        </ul>

        <h2>3. Where Information Is Processed</h2>
        <p>
          The app uses Firebase Authentication, Cloud Firestore, Firebase
          Storage, Firebase Analytics, Google Cloud Vision, and a configurable
          large language model provider such as NVIDIA or OpenAI. Uploaded
          images are stored in Firebase Storage and may be sent to Google Cloud
          Vision for image labeling. Image labels and style context may be sent
          to the recommendation model to generate style advice.
        </p>

        <h2>4. Sharing and Selling</h2>
        <p>
          We do not sell your personal information. We share information only
          with service providers that help operate the app, such as cloud
          hosting, authentication, storage, analytics, image analysis, and AI
          recommendation providers, or when required to comply with law or
          protect the app from abuse.
        </p>

        <h2>5. Image Storage and Retention</h2>
        <p>
          Uploaded images, profile photos, generated recommendations, and style
          history may remain stored while your account exists or while needed to
          provide the app. You can remove a profile photo in Account Settings.
          For deletion of uploaded images, recommendation history, or account
          data, contact us using the email below.
        </p>

        <h2>6. Your Choices</h2>
        <ul>
          <li>You can choose not to upload images.</li>
          <li>You can update account profile details in Account Settings.</li>
          <li>You can request access to or deletion of your app data.</li>
          <li>You can stop using the app at any time.</li>
        </ul>

        <h2>7. Security</h2>
        <p>
          The app uses Firebase Authentication, authenticated backend requests,
          cloud storage, and provider security controls to help protect data.
          No online service is perfectly secure, so avoid uploading sensitive
          images or information.
        </p>

        <h2>8. Children</h2>
        <p>
          Fashion Moodboard AI is not intended for children under 13. We do not
          knowingly collect personal information from children under 13. If you
          believe a child has provided personal information, contact us so we
          can review and delete it.
        </p>

        <h2>9. Changes</h2>
        <p>
          This Privacy Policy may be updated as the app changes. The effective
          date at the top of this page will show when the latest version took
          effect.
        </p>

        <h2>10. Contact</h2>
        <p>
          Questions or deletion requests can be sent to{" "}
          <a href="mailto:sbakre@horizon.csueastbay.edu">
            sbakre@horizon.csueastbay.edu
          </a>
          .
        </p>
      </section>
    </main>
  );
};

export default PrivacyPolicy;
