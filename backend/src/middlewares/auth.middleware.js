import { User } from "../models/user.model.js";
import httpStatus from "http-status";

/**
 * Middleware to validate token for any protected route
 */
export const validateToken = async (req, res, next) => {
  try {
    // Token can come from headers, query, or body
    const token =
      req.headers["x-access-token"] || req.headers["authorization"]?.split(" ")[1] || req.query.token || req.body.token;

    if (!token) {
      return res.status(httpStatus.UNAUTHORIZED).json({ message: "Token is required" });
    }

    // Check if token exists in DB
    const user = await User.findOne({ token });

    if (!user) {
      return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid or expired token" });
    }

    // Attach user to request object
    req.user = user;

    next(); // proceed to controller
  } catch (err) {
    console.error("Token validation error:", err);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "Something went wrong" });
  }
};
