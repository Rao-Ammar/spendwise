import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";

// Must use the same JWT_SECRET that userController.js signs tokens with.
const authMiddleware = async (req, res, next) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error("JWT_SECRET is not set");
    return res.status(500).json({ message: "Server configuration error", success: false });
  }

  // grab the token
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authorization header missing or malformed", success: false });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Authorization header missing or malformed", success: false });
  }

  // verify the token (bad signature, tampering or expiry -> 401)
  let payload;
  try {
    payload = jwt.verify(token, secret, { algorithms: ["HS256"] });
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token", success: false });
  }

  // make sure the user still exists (database problems -> 500, not 401)
  try {
    const user = await userModel.findById(payload.userId).select("_id");
    if (!user) {
      return res.status(401).json({ message: "User not found", success: false });
    }
    req.userId = user._id;
    next();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong. Please try again.", success: false });
  }
};

export default authMiddleware;