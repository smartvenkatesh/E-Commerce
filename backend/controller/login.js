import {
  decryptMiddleware,
  generateOTP,
  sendOTPEmail,
} from "../routes/eventRoutes.js";
import { AppUser } from "../models/userModels.js";
import { generateToken } from "../utils/auth.js";
export const login = async (req, res) => {
  const { email, password } = req.body.form;

  try {
    let appUser = await AppUser.findOne({ email: email });
    if (appUser) {
      if (!appUser.isVerified) {
        return res
          .status(401)
          .json({ message: "Please verify your email before logging in." });
      }

      if (appUser.password !== password) {
        return res.status(401).json({ message: "Incorrect password" });
      }
      const otp = generateOTP();
      appUser.otp = otp;
      await appUser.save();
      await sendOTPEmail(email, otp);
      setTimeout(async () => {
        appUser.otp = null;
        await appUser.save();
      }, 20000);
      const token = generateToken(appUser);

      return res.json({
        success: true,
        token,
        userId: appUser._id,
        name: appUser.name,
        role: "user",
      });
    }

    return res.status(404).json({ success: false, message: "User not found" });
  } catch (err) {
    console.error("Login error", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};
