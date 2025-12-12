import React, { useContext, useState, useEffect } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { IconButton, AppBar, Toolbar, Box } from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";

export default function History() {
  const { getHistoryOfUser, removeHistoryItem } = useContext(AuthContext);
  const [meetings, setMeetings] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const historyData = await getHistoryOfUser();
        setMeetings(historyData || []);
      } catch (err) {
        console.error("Error fetching history:", err);

        // Redirect to login if token is invalid
        if (err.response && err.response.status === 401) {
          localStorage.removeItem("token"); // Clear invalid token
          navigate("/login");
        }
      }
    };
    fetchHistory();
  }, [getHistoryOfUser, navigate]);

  const formateDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleRemove = async (id) => {
    try {
      await removeHistoryItem(id);
      setMeetings((prev) => prev.filter((m) => m._id !== id));
    } catch (err) {
      console.error("Error removing history item:", err);

      // Redirect if token invalid
      if (err.response && err.response.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
      }
    }
  };

  return (
    <>
      <AppBar
        position="static"
        elevation={1}
        sx={{
          background: "linear-gradient(to bottom, #f8f8f8, #ffffff)",
          color: "#333",
        }}
      >
        <Toolbar>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <img
              src="/MeetLogo.png"
              alt="Meet Logo"
              style={{ height: "72px", width: "auto", objectFit: "contain" }}
            />
          </Box>

          <Box
            sx={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <IconButton onClick={() => navigate("/home")}>
              <HomeIcon sx={{ color: "#d49216ff" }} />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <div className="p-4">
        {meetings.length === 0 && (
          <p className="text-gray-500 m-4">No meetings available</p>
        )}

        {meetings.map((m) => (
          <Card key={m._id} variant="outlined" sx={{ margin: 2 }}>
            <CardContent>
              <Typography
                gutterBottom
                sx={{ color: "text.secondary", fontSize: 14 }}
              >
                {m.type || "Meeting"}
              </Typography>
              <Typography variant="h6">Code: {m.meetingCode}</Typography>
              <Typography sx={{ color: "text.secondary", mb: 1.5 }}>
                {formateDate(m.date)}
              </Typography>
              <Button
                variant="text"
                color="error"
                onClick={() => handleRemove(m._id)}
              >
                Remove
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
