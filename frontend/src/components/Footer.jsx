import React from 'react';
import '../styles/Footer.css';

function Footer() {
  return (
    <footer className="global-footer">
      <div className="footer-content">
        <div className="footer-brand">
          <span className="ai-badge">AI POWERED</span>
          <span className="brand-name">FASHION MOODBOARD</span>
        </div>
        
        <div className="footer-credits">
          <span className="designed-by">ENGINEERED & CURATED BY</span>
          <span className="creator-name">SIDDHESH BAKRE</span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
