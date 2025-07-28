import React from "react";
import "../styles/PrivacyPolicy.css"; // Optional: For any styling you may want to add

const PrivacyPolicy = () => {
  return (
    <div className="container mt-5">
      <h2 className="text-center mb-4">Privacy Policy</h2>

      <p>
        <strong>Introduction</strong>
      </p>
      <p>
        Fashion Moodboard ("we," "our," or "us") values your privacy. This
        Privacy Policy explains how we collect, use, and protect your
        information when you use our application to analyze fashion preferences
        and receive AI-powered recommendations.
      </p>

      <p>
        <strong>1. Information We Collect</strong>
      </p>
      <p>We collect the following types of data:</p>
      <ul>
        <li>
          <strong>Photos</strong>: Images uploaded by users for analysis.
        </li>
        <li>
          <strong>Metadata</strong>: Optional data embedded in photos, such as
          timestamps or locations.
        </li>
        <li>
          <strong>Derived Insights</strong>: Fashion elements (e.g., clothing,
          accessories, color schemes) and emotional states detected using Google
          Cloud Vision API.
        </li>
        <li>
          <strong>Usage Data</strong>: Information about how you interact with
          our app, such as clicks, navigation, and preferences.
        </li>
      </ul>

      <p>
        <strong>2. How We Use Your Information</strong>
      </p>
      <p>We use collected data to:</p>
      <ul>
        <li>Generate personalized fashion moodboards.</li>
        <li>
          Provide AI-driven recommendations tailored to your preferences and
          trends.
        </li>
        <li>Enhance the app's features and user experience.</li>
        <li>
          Integrate with third-party platforms (e.g., Pinterest API for sharing
          and Google Cloud Vision API for photo analysis).
        </li>
        <li>Offer shopping links for similar styles and outfits.</li>
      </ul>

      <p>
        <strong>3. No Pinterest Data Storage</strong>
      </p>
      <p>
        We do not store any data retrieved from Pinterest in our system. Any
        interactions with Pinterest, such as sharing moodboards or fetching
        inspiration, are processed directly through their API and are not
        retained by Fashion Moodboard.
      </p>

      <p>
        <strong>4. Sharing Your Information</strong>
      </p>
      <p>We share data with:</p>
      <ul>
        <li>
          <strong>Third-party services</strong>: Including Google Cloud Vision
          API and Pinterest API, for delivering core functionalities.
        </li>
        <li>
          <strong>E-commerce Partners</strong>: To facilitate shopping
          recommendations.
        </li>
      </ul>
      <p>We never sell your personal data to advertisers or other entities.</p>

      <p>
        <strong>5. Data Retention and Deletion</strong>
      </p>
      <p>
        We retain your data only as long as necessary to provide services. Users
        can request deletion of their data anytime through the app's settings.
      </p>

      <p>
        <strong>6. Your Consent</strong>
      </p>
      <p>
        By using Fashion Moodboard, you agree to the collection, use, and
        sharing of your information as described in this policy. You can
        withdraw your consent at any time by discontinuing app use or requesting
        data deletion.
      </p>

      <p>
        <strong>7. Data Security</strong>
      </p>
      <p>
        We implement security measures like encryption and restricted access to
        protect your data. However, no system is 100% secure, and we encourage
        users to share data responsibly.
      </p>

      <p>
        <strong>8. User Rights</strong>
      </p>
      <p>Depending on your jurisdiction, you may have rights to:</p>
      <ul>
        <li>Access and review your data.</li>
        <li>Request corrections or deletions.</li>
        <li>Opt-out of certain types of data processing.</li>
      </ul>

      <p>
        <strong>9. Children’s Privacy</strong>
      </p>
      <p>
        Fashion Moodboard is not intended for children under 13. We do not
        knowingly collect personal data from minors.
      </p>

      <p>
        <strong>10. Changes to This Policy</strong>
      </p>
      <p>
        We may update this Privacy Policy from time to time. Any changes will be
        posted on this page with a revised effective date.
      </p>

      <p>
        <strong>11. Contact Us</strong>
      </p>
      <p>
        If you have any questions or concerns about this Privacy Policy, please
        contact us at:
      </p>
      <ul>
        <li>
          <strong>Email:</strong> sbakre@horizon.csueastbay.edu
        </li>
        <li>
          <strong>Address:</strong> 25200 Carlos Bee Blvd, Hayward, CA - 94542
        </li>
      </ul>
    </div>
  );
};

export default PrivacyPolicy;
