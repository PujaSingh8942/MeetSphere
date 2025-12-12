import React from 'react'
import "../App.css"
import { Link } from 'react-router-dom';
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const router = useNavigate();

  return (
    <div className='landingPageContainer'>
      <nav
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0 40px",
          height: "80px",
        }}
      >
        {/* Logo only on the left */}
        <div className="navHeader" style={{ display: "flex", alignItems: "center" }}>
          <img
            src="/MeetLogo.png"
            alt="MeetSphere Logo"
            style={{
              height: "80px",   // bigger size
              width: "auto",
              objectFit: "contain",
            }}
          />
        </div>

        {/* Right side menu */}
        <div
          className="navlist"
          style={{ display: "flex", alignItems: "center", gap: "30px" }}
        >
          <p style={{ cursor: "pointer" }} onClick={() => router("/qefh231")}>
            Join as Guest
          </p>
          <p style={{ cursor: "pointer", color: "#d7961e" }} onClick={() => router("/qefh231")}>
            Register
          </p>
          <div onClick={() => router("/auth")} role="button" style={{ cursor: "pointer" }}>
            <p>Login</p>
          </div>
        </div>
      </nav>

      {/* Main hero section */}
      <div className="landingMainContainer">
        <div>
          <h1>
            <span style={{ color: "#00E5FF" }}>Connect</span> Easy, Anywhere Anytime
          </h1>
          <p>Cover a distance by MeetSphere</p>
          <div role="button">
            <Link to={"/auth"}>Get Started</Link>
          </div>
        </div>
        {/* <div>
          <img src="\mobile.png" alt="" />
        </div> */}
      </div>
    </div>
  )
}
