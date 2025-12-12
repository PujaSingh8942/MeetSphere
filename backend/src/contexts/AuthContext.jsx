import axios from "axios";
import httpStatus from "http-status";
import { createContext, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";

console.log("API URL:", process.env.REACT_APP_API_URL);

export const AuthContext = createContext({});

const client = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

export const AuthProvider = ({ children }) => {
  const authContext = useContext(AuthContext);
  const [userData, setUserData] = useState(authContext);
  const router = useNavigate();

  const handleRegister = async (name, username, password) => {
    try {
      const request = await client.post("/register", { name, username, password });
      if (request.status === httpStatus.CREATED) {
        return request.data.message;
      }
    } catch (err) {
      throw err;
    }
  };

  const handleLogin = async (username, password) => {
    try {
      const request = await client.post("/login", { username, password });
      if (request.status === httpStatus.OK) {
        localStorage.setItem("token", request.data.token);
        router("/home"); // REDIRECT
      }
    } catch (err) {
      console.error("Login failed:", err.response?.data || err);
      throw err;
    }
  };

  // Get user history with token in headers
  const getHistoryOfUser = async () => {
    const token = localStorage.getItem("token");
    if (!token) return [];

    try {
      const request = await client.get("/get_all_activity", {
        headers: { "x-access-token": token },
      });
      return request.data;
    } catch (err) {
      throw err;
    }
  };

  // Add to history with token in headers
  const addToUserHistory = async (meetingCode) => {
    const token = localStorage.getItem("token");
    if (!token || !meetingCode) return;

    try {
      const res = await client.post(
        "/add_to_activity",
        { meeting_code: meetingCode },
        { headers: { "x-access-token": token } }
      );
      console.log("Added to history:", res.data);
      return res.data;
    } catch (err) {
      console.error("Add to history failed:", err.response?.data || err.message);
      throw err;
    }
  };

  // Remove history item with token in headers
  const removeHistoryItem = async (id) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      await client.delete(`/remove_activity/${id}`, {
        headers: { "x-access-token": token },
      });
      return true;
    } catch (err) {
      console.error("Remove history failed:", err);
      throw err;
    }
  };

  const data = {
    userData,
    setUserData,
    addToUserHistory,
    getHistoryOfUser,
    removeHistoryItem,
    handleRegister,
    handleLogin,
  };

  return <AuthContext.Provider value={data}>{children}</AuthContext.Provider>;
};
