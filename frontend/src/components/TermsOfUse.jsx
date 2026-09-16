import "../styles/PrivacyPolicy.css";

const TermsOfUse = () => {
  return (
    <main className="legal-page">
      <section className="legal-hero">
        <p className="legal-kicker">Fashion Moodboard AI</p>
        <h1>Terms of Use</h1>
        <p className="legal-updated">Effective date: June 22, 2026</p>
      </section>

      <section className="legal-card">
        <p>
          These Terms of Use explain the rules for using Fashion Moodboard AI,
          a portfolio fashion analysis and moodboard application created by
          Siddhesh Bakre. By creating an account, uploading images, or using
          the application, you agree to these terms.
        </p>

        <h2>1. Portfolio Demo</h2>
        <p>
          Fashion Moodboard AI is currently a portfolio demo. Please do not
          upload sensitive, private, confidential, or highly personal images.
          The app is provided for demonstration, experimentation, and personal
          styling inspiration.
        </p>

        <h2>2. Accounts</h2>
        <p>
          You are responsible for the activity that happens through your
          account and for keeping your login credentials secure. You agree to
          provide accurate account information and to use the app only for
          lawful purposes.
        </p>

        <h2>3. Uploaded Images and User Content</h2>
        <p>
          You keep ownership of images and other content you upload. You grant
          Fashion Moodboard AI a limited permission to store, process, analyze,
          display, and transmit your uploaded content only as needed to operate
          the app, generate style analysis, maintain your account, and improve
          the user experience.
        </p>
        <p>
          You must have the rights and permissions needed to upload any image.
          Do not upload content that is illegal, infringing, abusive,
          non-consensual, invasive of another person's privacy, or otherwise
          harmful.
        </p>

        <h2>4. AI Recommendations</h2>
        <p>
          Fashion Moodboard AI uses computer vision and large language model
          services to generate fashion labels, style notes, and recommendations.
          AI output may be incomplete, inaccurate, or unexpected. The output is
          provided for general inspiration and should not be treated as
          professional, legal, financial, medical, or safety advice.
        </p>

        <h2>5. Third-Party Services</h2>
        <p>
          The app uses third-party services including Firebase, Google Cloud
          Vision, Firebase Analytics, and a configurable large language model
          provider such as NVIDIA or OpenAI. Your use of those features may be
          subject to the terms and policies of those providers.
        </p>

        <h2>6. Prohibited Uses</h2>
        <ul>
          <li>Do not attempt to access another user's account or data.</li>
          <li>Do not upload content you do not have permission to use.</li>
          <li>Do not use the app to harass, exploit, impersonate, or harm anyone.</li>
          <li>Do not interfere with the app's security, availability, or infrastructure.</li>
          <li>Do not use automated scraping or abuse the service.</li>
        </ul>

        <h2>7. Removal and Suspension</h2>
        <p>
          We may remove content, restrict access, or suspend accounts if we
          believe the app is being misused, these terms are being violated, or
          action is needed to protect the app, users, or third-party services.
        </p>

        <h2>8. No Warranty</h2>
        <p>
          The app is provided "as is" and "as available." We do not guarantee
          that the app will always be secure, available, uninterrupted,
          error-free, or that recommendations will meet your expectations.
        </p>

        <h2>9. Limitation of Liability</h2>
        <p>
          To the fullest extent permitted by law, Fashion Moodboard AI and its
          creator will not be liable for indirect, incidental, consequential,
          special, exemplary, or punitive damages, or for loss of data, profits,
          goodwill, or other intangible losses related to your use of the app.
        </p>

        <h2>10. Changes to These Terms</h2>
        <p>
          These terms may be updated as the app changes. The effective date at
          the top of this page will show when the latest version took effect.
          Continued use of the app after updates means you accept the updated
          terms.
        </p>

        <h2>11. Contact</h2>
        <p>
          Questions about these Terms of Use can be sent to{" "}
          <a href="mailto:sbakre@horizon.csueastbay.edu">
            sbakre@horizon.csueastbay.edu
          </a>
          .
        </p>
      </section>
    </main>
  );
};

export default TermsOfUse;
