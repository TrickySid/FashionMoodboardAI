import React from "react";
// import axios from "axios";
import Navbar from "./Navbar";
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/Home.css";

function Home() {
  return (
    <>
      <Navbar />
      <div className="home-page">
        <div class="text-container">
          <h1>Analyze & Improve your Fashion</h1>
        </div>

        <a href="/login">
          <button class="get-started-btn">
            Get started
            <div class="icon">
              <svg
                height="24"
                width="24"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M0 0h24v24H0z" fill="none"></path>
                <path
                  d="M16.172 11l-5.364-5.364 1.414-1.414L20 12l-7.778 7.778-1.414-1.414L16.172 13H4v-2z"
                  fill="currentColor"
                ></path>
              </svg>
            </div>
          </button>
        </a>
      </div>
    </>
  );
}

export default Home;
