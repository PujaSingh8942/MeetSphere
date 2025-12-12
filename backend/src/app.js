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
const allowedOrigins = [
  process.env.CLIENT_URL,           // http://localhost:3000
  process.env.PRODUCTION_URL,       // https://meetsphere-frontend.onrender.com
].filter(Boolean);

console.log('🔍 NODE_ENV:', process.env.NODE_ENV);
console.log('✅ Allowed CORS origins:', allowedOrigins);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like Postman, same-origin)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        console.log('✅ Allowed origin:', origin);
        callback(null, true);
      } else {
        console.log('❌ Blocked origin:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-access-token"],
  })
);

app.options("*", cors());

// --------------------
// Body parsers
// --------------------
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

// --------------------
// Debug Middleware - Log all requests
// --------------------
app.use((req, res, next) => {
  console.log(`📍 ${req.method} ${req.url}`);
  console.log('📍 Origin:', req.headers.origin);
  next();
});

// --------------------
// Health check route (for testing)
// --------------------
app.get("/", (req, res) => {
  res.json({ 
    message: "MeetSphere Backend API", 
    status: "running",
    env: process.env.NODE_ENV 
  });
});

app.get("/api/v1/health", (req, res) => {
  res.json({ 
    message: "API is healthy", 
    timestamp: new Date().toISOString() 
  });
});

// --------------------
// Routes
// --------------------
app.use("/api/v1/users", userRoutes);

// --------------------
// 404 Handler - Must be AFTER all routes
// --------------------
app.use((req, res) => {
  console.log('❌ 404 - Route not found:', req.method, req.url);
  res.status(404).json({ 
    error: "Route not found",
    path: req.url,
    method: req.method
  });
});

// --------------------
// Error Handler
// --------------------
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(500).json({ 
    error: err.message || "Internal server error" 
  });
});

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
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 Server URL: http://localhost:${app.get("port")}`);
    });
  } catch (err) {
    console.error("❌ DB Connection Failed:", err);
    process.exit(1);
  }
};

start();