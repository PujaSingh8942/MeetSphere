// app.js
import express from "express";
import { createServer } from "node:http";
import mongoose from "mongoose";
import cors from "cors";
import "dotenv/config";

import userRoutes from "./routes/users.routes.js";
import { connectToSocket } from "./controllers/socketManager.js";

const app = express();
const server = createServer(app);

// --------------------
// ✅ CORS Setup
// --------------------
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "development"
        ? process.env.CLIENT_URL   // e.g., http://localhost:3000
        : process.env.PRODUCTION_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-access-token"], // include custom header
  })
);

// Handle OPTIONS preflight requests globally
app.options(
  "*",
  cors({
    origin:
      process.env.NODE_ENV === "development"
        ? process.env.CLIENT_URL
        : process.env.PRODUCTION_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-access-token"],
  })
);

// --------------------
// Body parsers
// --------------------
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

// --------------------
// Routes
// --------------------
app.use("/api/v1/users", userRoutes);

// --------------------
// Socket server
// --------------------
connectToSocket(server);

// --------------------
app.set("port", process.env.PORT || 8000);

// --------------------
const start = async () => {
  try {
    const connectionDb = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MONGO Connected DB Host: ${connectionDb.connection.host}`);

    server.listen(app.get("port"), () => {
      console.log(`🚀 LISTENING ON PORT ${app.get("port")}`);
    });
  } catch (err) {
    console.error("❌ DB Connection Failed:", err);
  }
};

start();
