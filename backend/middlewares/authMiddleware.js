import jwt from "jsonwebtoken";
import { AppUser } from "../models/userModels.js";
const SECRET_KEY = ["spiderman","batman","superman","ironman","apple",
                   "orange","pineapple","banana","nuts","tomato"];

export function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decodedHeader = jwt.decode(token, { complete: true });
    
    const keyId = decodedHeader?.header?.kid;    

    if (keyId === undefined || keyId >= SECRET_KEY.length) {
      return res.status(403).json({ message: "Invalid key ID" });
    }

    const secret = SECRET_KEY[keyId];
    const user = jwt.verify(token, secret);
    req.user = user;
    next();
  } catch (err) {
    console.error("JWT verification failed:", err.message);
    res.status(403).json({ message: "Invalid token" });
  }
}

export const authorize = (...roles) => {
  return async (req, res, next) => {
    const user = req.user;

    if (!roles.includes(user.role)) {
      return res.status(403).json({ message: "Forbidden: Invalid role" });
    }

    if (user.role === "user") {
      const appUser = await AppUser.findById(user._id);
      const currentRoute = req.route.path;
    }

    next();
  };
};
