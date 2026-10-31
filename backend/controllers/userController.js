import userModel from "../models/userModel.js";
import validator from "validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Read env vars when a token is created (not at import time), so this works
// no matter when dotenv.config() runs. Your auth middleware must use the same secret.
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return secret;
};

const createToken = (userId) =>
  jwt.sign({ userId }, getJwtSecret(), { expiresIn: process.env.JWT_EXPIRY || "24h" });

const isString = (value) => typeof value === "string";

const serverError = (res, error) => {
  console.error(error);
  return res.status(500).json({ message: "Something went wrong. Please try again.", success: false });
};

// register a new user
export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  // validator throws on non-string input, so check types first
  if (![name, email, password].every(isString) || !name.trim() || !email.trim() || !password) {
    return res.status(400).json({ message: "Please fill all the fields", success: false });
  }
  if (!validator.isEmail(email.trim())) {
    return res.status(400).json({ message: "Please enter a valid email", success: false });
  }
  if (!validator.isLength(password, { min: 6 })) {
    return res.status(400).json({ message: "Password must be at least 6 characters long", success: false });
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();

    const userExists = await userModel.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(409).json({ message: "User already exists", success: false });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await userModel.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });

    const token = createToken(user._id);
    res.status(201).json({
      message: "User registered successfully",
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    // two sign-ups with the same email at the same moment hit the unique index
    if (error.code === 11000) {
      return res.status(409).json({ message: "User already exists", success: false });
    }
    serverError(res, error);
  }
};

// to login a user
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!isString(email) || !isString(password) || !email.trim() || !password) {
    return res.status(400).json({ message: "Please fill all the fields", success: false });
  }

  try {
    const user = await userModel.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials", success: false });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials", success: false });
    }

    const token = createToken(user._id);
    res.status(200).json({
      message: "User logged in successfully",
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    serverError(res, error);
  }
};

// to get login user details
export const getUserDetails = async (req, res) => {
  try {
    const user = await userModel.findById(req.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found", success: false });
    }
    res.status(200).json({
      message: "User details retrieved successfully",
      success: true,
      user,
    });
  } catch (error) {
    serverError(res, error);
  }
};

// to update user details
export const updateUserDetails = async (req, res) => {
  const { name, email } = req.body;

  if (!isString(name) || !isString(email) || !name.trim() || !validator.isEmail(email.trim())) {
    return res.status(400).json({ message: "A name and a valid email are required", success: false });
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await userModel.findOne({ email: normalizedEmail, _id: { $ne: req.userId } });
    if (existingUser) {
      return res.status(409).json({ message: "Email already in use", success: false });
    }

    const user = await userModel
      .findByIdAndUpdate(
        req.userId,
        { name: name.trim(), email: normalizedEmail },
        { new: true, runValidators: true }
      )
      .select("name email");

    if (!user) {
      return res.status(404).json({ message: "User not found", success: false });
    }

    res.status(200).json({
      message: "User details updated successfully",
      success: true,
      user,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Email already in use", success: false });
    }
    serverError(res, error);
  }
};

// to update user password
export const updateUserPassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!isString(currentPassword) || !isString(newPassword) || !currentPassword || !newPassword) {
    return res.status(400).json({ message: "Please fill all the fields", success: false });
  }
  if (!validator.isLength(newPassword, { min: 6 })) {
    return res.status(400).json({ message: "New password must be at least 6 characters long", success: false });
  }
  if (currentPassword === newPassword) {
    return res.status(400).json({ message: "New password must be different from the current one", success: false });
  }

  try {
    const user = await userModel.findById(req.userId).select("password");
    if (!user) {
      return res.status(404).json({ message: "User not found", success: false });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect", success: false });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({
      message: "Password updated successfully",
      success: true,
    });
  } catch (error) {
    serverError(res, error);
  }
};