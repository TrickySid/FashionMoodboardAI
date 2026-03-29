import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
// import axios from "axios";
import Navbar from "./Navbar";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { images } from "./images";
import gsap from "gsap";
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/Home.css";

const Home = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
    });
    return unsubscribe;
  }, []);
  useEffect(() => {
    const handleMouseMove = (e) => {
      document.querySelectorAll(".image-wrapper").forEach((image, index) => {
        const x = (e.clientX - window.innerWidth / 2) * images[index].speed;
        const y = (e.clientY - window.innerHeight / 2) * images[index].speed;
        gsap.to(image, { x, y, duration: 0.75 });
      });
    };

    const heroSection = document.querySelector(".home-page");
    heroSection.addEventListener("mousemove", handleMouseMove);

    return () => heroSection.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <>
      <Navbar />
      <header className="home-page">
        <div id="gallery">
          {images.map((item, index) => (
            <div
              key={index}
              className="image-wrapper"
              style={{ top: item.position.top, left: item.position.left }}
            >
              <img src={item.path} alt="img" />
            </div>
          ))}
        </div>
        
        <div className="home-content">
          <h1>
            Analyze and Improve <br />
            <span>Your Fashion</span>
          </h1>
        <Link to={isLoggedIn ? "/upload" : "/login"}>
          <button className="get-started-btn">Get Started</button>
        </Link>
        </div>
      </header>
    </>
  );
};

export default Home;
