import express from "express";
import {
  getUserDetails,
  loginUser,
  registerUser,
  updateUserDetails,
  updateUserPassword,
} from "../controllers/userController.js";
import authMiddleware from "../middleware/auth.js";

const userRouter = express.Router();

// public routes
userRouter.post("/login", loginUser);
userRouter.post("/register", registerUser);

// protected routes
userRouter.get("/me", authMiddleware, getUserDetails);
userRouter.put("/profile", authMiddleware, updateUserDetails);
userRouter.put("/password", authMiddleware, updateUserPassword);

export default userRouter;