import { useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "./Navbar";
import { useAuth } from "../auth/AuthContext";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "../styles/Home.css";

gsap.registerPlugin(ScrollTrigger);

const Home = () => {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return undefined;
    }

    // AI Showcase Timeline
    const analysisData = [
      { img: "/assets/sample_yellow.jpg", advice: "VIBRANT TEXTURE DETECTED. COMPLEMENT MUSTARD TONES WITH COOL METALLICS." },
      { img: "/assets/sample_turtleneck.jpg", advice: "LAYERING PATTERN ANALYZED. EXCELLENT CONTRAST WITH PASTEL UNDERTONES." },
      { img: "/assets/sample_subway.jpg", advice: "ATHLEISURE SILHOUETTE IDENTIFIED. OPTIMIZE FOR URBAN TRANSIT." },
      { img: "/assets/sample_sport.jpg", advice: "SPORT-CHIC FOUNDATION. ENHANCE COHESION WITH BOLD ACCESSORIES." },
      { img: "/assets/sample_paris.jpg", advice: "CLASSIC MINIMALISM. ELEVATE LOOK WITH ARCHITECTURAL EYEWEAR." }
    ];

    let currentSample = 0;
    const tl = gsap.timeline({ repeat: -1 });

    const runAnalysis = () => {
      const showcase = document.querySelector(".showcase-box");
      if (!showcase) return;

      const img = showcase.querySelector("img");
      const advice = showcase.querySelector(".advice-text");
      const scan = showcase.querySelector(".scanner");

      if (!img || !advice || !scan) return;

      tl.set([showcase, advice, scan], { opacity: 0 })
        .set(scan, { top: "0%" })
        .to(showcase, { opacity: 0.5, duration: 1 })
        .to(scan, { opacity: 1, duration: 0.1 })
        .to(scan, { top: "100%", duration: 2, ease: "power1.inOut" })
        .to(scan, { opacity: 0, duration: 0.3 })
        .to(advice, { opacity: 1, duration: 0.5 })
        .to(showcase, { opacity: 0, duration: 1, delay: 3 })
        .call(() => {
          currentSample = (currentSample + 1) % analysisData.length;
          img.src = analysisData[currentSample].img;
          advice.textContent = analysisData[currentSample].advice;
        });
    };

    runAnalysis();

    // Other Scroll Animations
    gsap.from(".feature-card", {
      scrollTrigger: {
        trigger: ".process-section",
        start: "top 80%",
        toggleActions: "play none none reverse"
      },
      y: 50,
      opacity: 0,
      duration: 1.2,
      stagger: 0.2,
      ease: "power2.out",
      clearProps: "all"
    });

    gsap.to(".marquee-inner", {
      scrollTrigger: {
        trigger: ".marquee-section",
        start: "top bottom",
        end: "bottom top",
        scrub: 1,
      },
      xPercent: -20
    });

    return () => {
      tl.kill();
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return (
    <div className="home-container">
      <Navbar />
      
      {/* 1. HERO SECTION */}
      <header className="hero-header">
        <div className="digital-dna">
          {[1, 2, 3, 4, 5].map((col) => (
            <div key={col} className={`dna-column dna-col-${col}`}>
              <div className="dna-content">
                <span>SILK — FW25 — MINIMAL — AVANT-GARDE — ARCHITECTURAL — SILK — FW25 — MINIMAL — AVANT-GARDE — ARCHITECTURAL — </span>
              </div>
            </div>
          ))}
        </div>

        {/* AI ANALYSIS SHOWCASE */}
        <div className="showcase-box">
          <img src="/assets/sample_yellow.jpg" alt="analysis-sample" />
          <div className="scanner"></div>
          <div className="advice-overlay">
            <p className="advice-text">VIBRANT TEXTURE DETECTED. COMPLEMENT MUSTARD TONES WITH COOL METALLICS.</p>
          </div>
        </div>
        
        <div className="hero-content">
          <span className="hero-label">The Future of Curation</span>
          <h1>
            Analyze and Improve <br />
            <span>Your Fashion</span>
          </h1>
          {loading ? (
            <button className="get-started-btn" disabled>Checking session...</button>
          ) : (
            <Link className="get-started-btn" to={user ? "/upload" : "/login"}>Get Started</Link>
          )}
        </div>
      </header>

      {/* 2. PROCESS SECTION */}
      <section className="process-section py-5">
        <div className="container">
          <div className="row g-4 justify-content-center">
            <div className="col-lg-4">
              <div className="feature-card">
                <span className="step-num">01</span>
                <h3>Visual Intelligence</h3>
                <p>Advanced Computer Vision parses every detail—from fabric texture to silhouette precision—giving the AI a human-like eye for detail.</p>
              </div>
            </div>
            <div className="col-lg-4">
              <div className="feature-card">
                <span className="step-num">02</span>
                <h3>LLM Insight</h3>
                <p>A configurable language model translates structured vision labels into clear, editorial-style recommendations.</p>
              </div>
            </div>
            <div className="col-lg-4">
              <div className="feature-card">
                <span className="step-num">03</span>
                <h3>Searchable Edit</h3>
                <p>Fashion keywords become safe search shortcuts, connecting each recommendation to practical wardrobe research.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. MARQUEE SECTION */}
      <section className="marquee-section">
        <div className="marquee-inner">
          <h2 className="scrolling-text">
            DIGITAL CURATION — EDITORIAL LOGIC — VISUAL INTELLIGENCE — HIGH FASHION — 
            DIGITAL CURATION — EDITORIAL LOGIC — VISUAL INTELLIGENCE — HIGH FASHION —
          </h2>
        </div>
      </section>

      {/* 4. CALL TO ACTION */}
      <section className="cta-section">
        <div className="cta-content container text-center">
          <h2 className="display-4">Ready to evolve?</h2>
          <p className="lead mb-5">Your personal digital curator is waiting to analyze your first look.</p>
          {loading ? (
            <button className="get-started-btn" disabled>Checking session...</button>
          ) : (
            <Link className="get-started-btn" to={user ? "/upload" : "/login"}>Start My Analysis</Link>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
