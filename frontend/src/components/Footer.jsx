import { Link } from 'react-router-dom';
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
          <span className="designed-by">DEVELOPED BY</span>
          <span className="creator-name">SIDDHESH BAKRE</span>
        </div>

        <nav className="footer-links" aria-label="Legal links">
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
        </nav>
      </div>
    </footer>
  );
}

export default Footer;
