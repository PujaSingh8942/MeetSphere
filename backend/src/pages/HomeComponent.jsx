import React, { useContext, useState } from "react";
import withAuth from "../utils/withAuth";
import { useNavigate } from "react-router-dom";
import {
  IconButton,
  Button,
  TextField,
  AppBar,
  Toolbar,
  Typography,
  Box,
} from "@mui/material";
import RestoreIcon from "@mui/icons-material/Restore";
import { AuthContext } from "../contexts/AuthContext";

function HomeComponent() {
  const navigate = useNavigate();
  const [meetingCode, setMeetingCode] = useState("");
  const { addToUserHistory } = useContext(AuthContext);

  const handleJoinVideoCall = async () => {
    await addToUserHistory(meetingCode);
    navigate(`/${meetingCode}`);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <>
      {/* NAVBAR */}
      <AppBar
        position="static"
        elevation={1}
        sx={{
          background: "linear-gradient(to bottom, #f8f8f8, #ffffff)",
          color: "#333",
        }}
      >
        <Toolbar>
          {/* Logo on the left */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <img
              src="/MeetLogo.png"
              alt="Meet Logo"
              style={{ height: "75px", width: "auto", objectFit: "contain" }} // larger logo
            />
          </Box>

          {/* Right side buttons */}
          <Box
            sx={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <IconButton color="inherit" onClick={() => navigate("/history")}>
              <RestoreIcon />
            </IconButton>
            <Typography
              variant="body1"
              component="div"
              sx={{ cursor: "pointer", color: "#d7961eff" }}
              onClick={() => navigate("/history")}
            >
              History
            </Typography>

            <Button sx={{ color: "#00bfff" }} onClick={handleLogout}>
              Logout
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* MAIN CONTENT */}
      <div className="meetContainer">
        <div className="leftPanel">
          <div>
            <h2>Experience Seamless Connections and Meaningful Interactions</h2>
            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
              <TextField
                onChange={(e) => setMeetingCode(e.target.value)}
                id="outlined-basic"
                label="Enter Meeting Code"
                variant="outlined"
              />
              <Button
                onClick={handleJoinVideoCall}
                variant="contained"
                sx={{
                  backgroundColor: "#00bfff", // sky blue background
                  color: "#ffffff", // white text
                  "&:hover": {
                    backgroundColor: "#00a5e0", // slightly darker on hover
                  },
                }}
              >
                Join
              </Button>
            </div>
          </div>
        </div>
        <div className="rightPanel">
          <img src="/logo2.png" alt="Logo" />
        </div>
      </div>
    </>
  );
}

export default withAuth(HomeComponent);
