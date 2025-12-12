import { Router } from "express";
import {
  getUserHistory,
  login,
  register,
  addToHistory,
  removeActivityHandler,
} from "../controllers/user.controller.js";
import { validateToken } from "../middlewares/auth.middleware.js";

const router = Router();

// Public routes
router.post("/login", login);
router.post("/register", register);

// Protected routes (require token)
router.post("/add_to_activity", validateToken, addToHistory);
router.get("/get_all_activity", validateToken, getUserHistory);
router.delete("/remove_activity/:id", validateToken, removeActivityHandler);

export default router;
