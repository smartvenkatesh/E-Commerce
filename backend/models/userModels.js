import mongoose from "mongoose";

const AppUserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  otp: String,
  isVerified: { type: Boolean, default: false },
  loginCheck:{ type:Boolean,default:false },
  role: { type: String, default: 'user' },
  profilePage: [
    {
      name:String,
      email:String,
      phoneNo:String,
      shipping: String,
      payment: String,
    },
  ],
});

export const AppUser = mongoose.model("AppUser", AppUserSchema);
