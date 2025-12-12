import httpStatus from "http-status";
import { User } from "../models/user.model.js";
import bcrypt from "bcrypt";
import crypto from "crypto";  // Added missing import for crypto module
import { Meeting } from "../models/meeting.model.js";

/**
 * LOGIN
 */
const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(httpStatus.BAD_REQUEST)
      .json({ message: "Please provide username and password" });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(httpStatus.NOT_FOUND).json({ message: "User not found" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res
        .status(httpStatus.UNAUTHORIZED)
        .json({ message: "Invalid username or password" });
    }

    const token = crypto.randomBytes(20).toString("hex");
    user.token = token;
    await user.save();

    return res.status(httpStatus.OK).json({ token });
  } catch (error) {
    console.error("Login error:", error);
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: "Something went wrong" });
  }
};

/**
 * REGISTER
 */
const register = async (req, res) => {
  const { name, username, password } = req.body;

  if (!name || !username || !password) {
    return res
      .status(httpStatus.BAD_REQUEST)
      .json({ message: "Name, username, and password are required" });
  }

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res
        .status(httpStatus.CONFLICT)
        .json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name,
      username,
      password: hashedPassword,
    });

    await newUser.save();
    return res
      .status(httpStatus.CREATED)
      .json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Register error:", error);
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: "Something went wrong" });
  }
};

/**
 * GET USER HISTORY
 */
const getUserHistory = async (req, res) => {
  try {
    const user = req.user; // comes from middleware

    const meetings = await Meeting.find({ user_id: user.username }).sort({ date: -1 });
    return res.status(200).json(meetings);
  } catch (error) {
    console.error("Get user history error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

/**
 * ADD TO HISTORY
 */
const addToHistory = async (req, res) => {
  try {
    const user = req.user; // from middleware
    const { meeting_code } = req.body;

    if (!meeting_code) {
      return res.status(400).json({ message: "Meeting code is required" });
    }

    const newMeeting = new Meeting({
      user_id: user.username,
      meetingCode: meeting_code,
    });

    await newMeeting.save();
    return res.status(201).json({ message: "Meeting added to history" });
  } catch (error) {
    console.error("Add to history error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

/**
 * REMOVE FROM HISTORY
 */
const removeActivityHandler = async (req, res) => {
  try {
    const { token } = req.body;
    const { id } = req.params;

    if (!token || !id) {
      return res.status(httpStatus.BAD_REQUEST).json({ message: "Token and ID are required" });  // Changed 400 to httpStatus.BAD_REQUEST
    }

    const user = await User.findOne({ token });
    if (!user) return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid token" });  // Changed 401 to httpStatus.UNAUTHORIZED

    const deleted = await Meeting.deleteOne({ _id: id, user_id: user.username });
    if (deleted.deletedCount === 0) {
      return res.status(httpStatus.NOT_FOUND).json({ message: "History item not found" });  // Changed 404 to httpStatus.NOT_FOUND
    }

    res.status(httpStatus.OK).json({ message: "History item removed" });  // Changed 200 to httpStatus.OK
  } catch (err) {
    console.error("Remove activity error:", err);  // Added logging for consistency
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "Something went wrong" });  // Standardized error response
  }
};

export { login, register, getUserHistory, addToHistory, removeActivityHandler };
