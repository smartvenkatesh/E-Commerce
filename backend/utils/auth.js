import jwt from "jsonwebtoken";

const SECRET_KEY = ["spiderman","batman","superman","ironman","apple",
                   "orange","pineapple","banana","nuts","tomato"];


export const generateToken = (user) => {
  const keyIndex = Math.floor(Math.random() * SECRET_KEY.length);
  const secret = SECRET_KEY[keyIndex];

  return jwt.sign(
    {
      _id: user._id,
      role: user.role || "user",
      name:user.name
    },
    secret,
    {
      expiresIn: "1d",
      header: { kid: keyIndex } 
    }
  );
};
