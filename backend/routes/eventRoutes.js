import express from "express";
import { Products } from "../models/ProductModels.js";
import { decrypt } from "../utils/decrypted.js";
import { User } from "../models/loginModel.js";
import { AppUser } from "../models/userModels.js";
import { generateToken } from "../utils/auth.js";
import { authenticate, authorize } from "../middlewares/authMiddleware.js";
import multer from "multer";
import mongoose from "mongoose";
import { Cart } from "../models/cartModel.js";
import { Order } from "../models/orderModel.js";
import { Query } from "../models/queryModel.js";
import nodemailer from "nodemailer";
import { login } from "../controller/login.js";

const upload = multer({ dest: "uploads/" });

const router = express.Router();

export const decryptMiddleware = (req, res, next) => {
  try {
    if (req.body.encryptedData) {
      req.body = decrypt(req.body.encryptedData);
    }
    next();
  } catch (err) {
    return res.status(400).json({ message: "Invalid encrypted payload" });
  }
};

export const sendOTPEmail = async (email, otp) => {
  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "venkatesh619dx@gmail.com",
      pass: "epnr nxro tuwg lmhu",
    },
  });

  await transporter.sendMail({
    from: "venkatesh619dx@gmail.com",
    to: email,
    subject: "OTP from E-Commerce website",
    html: `<p> OTP : <b>${otp}</b></p><span>expired in 20 seconds</span>`,
    // html: `<!DOCTYPE html>
    //      <html lang="en">
    //      <head>
    //      <meta charset="UTF-8">
    //      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    //      <title>Document</title>
    //      </head>
    //      <style>
    //      #expire{
    //      color:red;
    //      }
    //      </style>
    //     <body>
    //         <p> OTP : <b>${otp}</b></p><p id="expire">expired in 20 seconds</p>
    //     </body>
    //     </html>`,
  });
};

export const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

router.post("/register", decryptMiddleware, async (req, res) => {
  try {
    const { name, email, password } = req.body.formData;

    // Check if user already exists
    const existing = await AppUser.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    const otp = generateOTP();
    console.log("otp", otp);

    const newAppUser = {
      name,
      email,
      password,
      otp,
      isVerified: false,
    };

    const saved = await AppUser.create(newAppUser);

    // Send OTP to email
    await sendOTPEmail(email, otp); // ✉️ Implement this

    res
      .status(200)
      .json({ message: "OTP sent to your email", userId: saved._id });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: err.message });
  }
});

router.post("/register/verify-otp", async (req, res) => {
  const { userId, otp } = req.body;

  try {
    const user = await AppUser.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.otp !== otp)
      return res.status(400).json({ message: "Invalid OTP" });

    user.isVerified = true;
    user.otp = null;
    await user.save();

    res.json({ message: "OTP verified successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/login/verify-otp", async (req, res) => {
  const { userId, otp } = req.body;

  try {
    const user = await AppUser.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.otp !== otp)
      return res.status(400).json({ message: "Invalid OTP" });

    user.loginCheck = true;
    user.otp = null;
    await user.save();
    console.log("user after verify", user);
    req.app.locals.io.emit("orderPlaced");
    res.status(200).json({ message: "OTP verified successfully", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/login", decryptMiddleware, login);

router.post("/home/admin/upload", upload.single("file"), async (req, res) => {
  try {
    const { productName, productDescription, productCategory, productPrice } =
      req.body;
    const productImage = req.file.filename;

    const newProduct = {
      productName,
      productImage,
      productDescription,
      productCategory,
      productPrice,
    };

    const productCreate = await Products.create(newProduct);

    req.app.locals.io.emit("newProduct", productCreate);
    req.app.locals.io.emit("added", productName);
    req.app.locals.io.emit("orderPlaced");

    res
      .status(200)
      .json({ productCreate, message: `${productName} added successfully` });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
});

router.post("/add-to-cart/single", async (req, res) => {
  try {
    const { userId, productId, quantity = 1 } = req.body;

    const existing = await Cart.findOne({ appUserId: userId, productId });
    let productQuantity = await Products.findById(productId);
    if (!userId) {
      return res.status(404).json({ message: "Please Login for Purchase" });
    }

    if (existing) {
      existing.totalQuantity += quantity;
      productQuantity.totalProducts -= quantity;
      await productQuantity.save();
      await existing.save();
    } else {
      await Cart.create({
        appUserId: userId,
        productId,
        totalQuantity: quantity,
      });
      productQuantity.totalProducts -= quantity;
      await productQuantity.save();
    }
    req.app.locals.io.emit("orderPlaced");
    res.status(200).json({ message: "Added to cart successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error adding to cart" });
  }
});

router.post("/add-to-cart", async (req, res) => {
  try {
    const { userId, productId, quantity } = req.body;

    const existing = await Cart.findOne({ appUserId: userId, productId });
    let productQuantity = await Products.findById(productId);
    if (!userId) {
      return res.status(404).json({ message: "Please Login for Purchase" });
    }
    if (productQuantity.totalProducts < quantity) {
      return res
        .status(400)
        .json({ message: `Only ${productQuantity.totalProducts} lefts` });
    }
    if (existing) {
      existing.totalQuantity += quantity;
      productQuantity.totalProducts -= quantity;

      req.app.locals.io.emit("newQuantity", productQuantity.totalProducts);
      await productQuantity.save();
      await existing.save();
      req.app.locals.io.emit("updateForAdmin");
    } else {
      await Cart.create({
        appUserId: userId,
        productId,
        totalQuantity: quantity,
      });
      productQuantity.totalProducts -= quantity;
      req.app.locals.io.emit("newQuantity", productQuantity.totalProducts);
      await productQuantity.save();
    }
    req.app.locals.io.emit("orderPlaced");

    const notifications = await Cart.aggregate([
      {
        $group: {
          _id: "totalQuantity",
          total: { $sum: "$totalQuantity" },
        },
      },
      {
        $project: {
          _id: 1,
          total: 1,
        },
      },
    ]);

    req.app.locals.io.emit("newCount", notifications[0].total);

    res.status(200).json({ message: "Added to cart successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error adding to cart" });
  }
});

router.post("/add/qty/:id", async (req, res) => {
  const { id } = req.params;
  const { data } = req.body;
  try {
    const addQty = await Products.findById(id);
    addQty.totalProducts = data.productCount;
    await addQty.save();
    req.app.locals.io.emit("addByAdmin", addQty.productName);
    return res.status(200).json({
      message: `Successfully added ${addQty.productName} with ${data.productCount} Qty`,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/cart/:userId", async (req, res) => {
  try {
    const cartItems = await Cart.find({
      appUserId: req.params.userId,
    }).populate("productId");

    if (!cartItems.length) {
      return res.status(404).json({ message: "Cart is empty" });
    }

    const formatted = cartItems.map((item) => ({
      cartId: item._id,
      product: item.productId._id,
      productName: item.productId.productName,
      productImage: item.productId.productImage,
      productPrice: item.productId.productPrice,
      quantity: item.totalQuantity || 0,
    }));

    req.app.locals.io.emit("ordersPending", formatted);
    res.status(200).json({ cart: formatted });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/home/user/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const getView = await Products.findById(id);
    res.status(200).json(getView);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
});

router.get("/home/admin", async (req, res) => {
  try {
    const getProductsAdmin = await Products.find({});
    res.status(200).json(getProductsAdmin);
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: error.message });
  }
});

router.get("/home/admin/categories", async (req, res) => {
  try {
    const getCategories = await Products.find(
      {},
      { _id: 0, productCategory: 1 }
    );
    return res.status(200).json(getCategories);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
});

router.put(
  "/home/admin/edit/:productId",
  upload.single("file"),
  async (req, res) => {
    const { productName, productDescription, productCategory, productPrice } =
      req.body;
    const editId = new mongoose.Types.ObjectId(req.params.productId);
    console.log("editId", editId);
    const productImage = req.file.filename;
    console.log("productImage", productImage);
    try {
      const editProduct = await Products.findByIdAndUpdate(
        editId,
        {
          $set: {
            productName: productName,
            productImage: productImage,
            productDescription: productDescription,
            productCategory: productCategory,
            productPrice: productPrice,
          },
        },
        { new: true }
      );
      req.app.locals.io.emit("updateProducts");
      res.status(201).json(editProduct);
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: err.message });
    }
  }
);

router.post("/profile/add", decryptMiddleware, async (req, res) => {
  try {
    const { userId, name, email, phoneNo, shipping, payment } = req.body.data;

    const user = await AppUser.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.profilePage.push({ name, email, phoneNo, shipping, payment });
    await user.save();

    return res.status(200).json({
      message: "Profile details added successfully",
      profile: user.profilePage,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: err.message });
  }
});

router.post("/profile/edit/:userId", decryptMiddleware, async (req, res) => {
  const { userId } = req.params;
  const { name, email, phoneNo, shipping, payment } = req.body.data;

  try {
    const updated = await AppUser.findByIdAndUpdate(
      userId,
      {
        $set: {
          "profilePage.0.name": name,
          "profilePage.0.email": email,
          "profilePage.0.phoneNo": phoneNo,
          "profilePage.0.shipping": shipping,
          "profilePage.0.payment": payment,
        },
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "Profile updated successfully",
      profile: updated.profilePage,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: err.message });
  }
});

router.post("/order", async (req, res) => {
  try {
    const { userId, products } = req.body;
    const order = new Order({
      userId,
      products,
      createdAt: new Date(),
    });
    await order.save();
    req.app.locals.io.emit("orderPlaced");
    res.status(200).json({ message: "Order placed successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error placing order" });
  }
});

router.get("/order", async (req, res) => {
  try {
    const orders = await Order.find();
    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({ message: "Error fetching orders" });
  }
});

router.get("/profile/:userId", async (req, res) => {
  try {
    const user = await AppUser.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({ profile: user.profilePage });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/home/admin/:id", async (req, res) => {
  const deleteId = new mongoose.Types.ObjectId(req.params.id);
  try {
    const deleteProducts = await Products.findByIdAndDelete(deleteId);
    if (!deleteProducts) {
      return res.status(404).json({ message: "product not found" });
    }
    req.app.locals.io.emit("orderPlaced");
    return res.status(200).json({ message: "Product Deleted Succesfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
});

router.delete("/cart/pay/:userId", async (req, res) => {
  try {
    const userObjectId = new mongoose.Types.ObjectId(req.params.userId);

    const result = await Cart.deleteMany({ appUserId: userObjectId });

    if (result.deletedCount === 0) {
      return res
        .status(404)
        .json({ message: "No cart items found for this user" });
    }

    res.status(200).json({ message: "All cart items deleted successfully" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ message: "Error deleting cart items" });
  }
});

router.delete("/cart/:id", async (req, res) => {
  try {
    const userObjectId = new mongoose.Types.ObjectId(req.params.id);
    let result = await Cart.findById({ _id: userObjectId });
    let returnProduct = await Products.findById(result.productId);

    returnProduct.totalProducts += result.totalQuantity;

    await returnProduct.save();
    await Cart.findByIdAndDelete(result._id);
    if (result.deletedCount === 0) {
      return res
        .status(404)
        .json({ message: "No cart items found for this user" });
    }
    req.app.locals.io.emit("orderPlaced");
    // req.app.locals.io.emit("deleteCart")
    const notifications = await Cart.aggregate([
      {
        $group: {
          _id: "totalQuantity",
          total: { $sum: "$totalQuantity" },
        },
      },
      {
        $project: {
          _id: 0,
          total: 1,
        },
      },
    ]);
    if (notifications.length > 0) {
      req.app.locals.io.emit("newCount", notifications[0].total);
    } else {
      req.app.locals.io.emit("newCount", 0);
    }
    res.status(200).json({ message: "All cart items deleted successfully" });
  } catch (err) {
    console.error("Delete error");
    res.status(500).json({ message: "Error deleting cart items" });
  }
});

router.post("/login/resendOtp", async (req, res) => {
  const { userId } = req.body;
  try {
    const resend = await AppUser.findById(userId);
    const otp = generateOTP();
    resend.otp = otp;
    await resend.save();
    await sendOTPEmail(resend.email, otp);
    setTimeout(async () => {
      resend.otp = null;
      await resend.save();
    }, 20000);

    const token = generateToken(resend);

    return res.json({
      success: true,
      token,
      userId: resend._id,
      name: resend.name,
      role: "user" || resend.role,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/admin/metrics", async (req, res) => {
  try {
    const totalUsers = await AppUser.countDocuments({
      role: "user",
      loginCheck: true,
    });
    const totalProducts = await Products.countDocuments();
    const totalCategories = await Products.distinct("productCategory").then(
      (cats) => cats.length
    );
    const pendingOrders = await Cart.countDocuments();
    const completedOrders = await Order.countDocuments();
    const pendingQueries = await Query.countDocuments({ isResolved: false });
    const completedQueries = await Query.countDocuments({ isResolved: true });

    res.status(200).json({
      totalUsers,
      totalProducts,
      totalCategories,
      pendingOrders,
      completedOrders,
      pendingQueries,
      completedQueries,
    });
  } catch (err) {
    console.error("Metrics error:", err);
    res.status(500).json({ message: "Error fetching dashboard metrics" });
  }
});

router.post("/queries", async (req, res) => {
  try {
    const { userId, queryText, userName } = req.body;
    if (!userId) {
      return res.status(404).json({ message: "Please Login for chatting" });
    }
    const newQuery = await Query.create({ userId, queryText, userName });
    req.app.locals.io.emit("newQuery", newQuery); // Real-time update

    res
      .status(200)
      .json({ message: "Query submitted successfully", query: newQuery });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/admin/queries", async (req, res) => {
  try {
    const pending = await Query.find({});
    res.status(200).json(pending);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch("/admin/queries/:id/resolve", async (req, res) => {
  try {
    const resolved = await Query.findByIdAndUpdate(
      req.params.id,
      { isResolved: true },
      { new: true }
    );
    const queries = await Query.find().lean();

    req.app.locals.io.emit("queryResolved");
    res
      .status(200)
      .json({ message: "Query marked as resolved", resolved, queries });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/admin/queries/:id/message", async (req, res) => {
  try {
    const { text } = req.body;
    const queryId = req.params.id;

    const updatedQuery = await Query.findByIdAndUpdate(
      queryId,
      { $push: { messages: { sender: "admin", text } } },
      { new: true }
    );

    req.app.locals.io.emit("queryMessage", {
      queryId,
      message: updatedQuery.messages.slice(-1)[0],
    });

    res
      .status(200)
      .json({ message: "Message sent", messages: updatedQuery.messages });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/user/:userId/queries", async (req, res) => {
  try {
    const queries = await Query.find({ userId: req.params.userId }).sort({
      createdAt: 1,
    });
    res.status(200).json(queries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/logout", async (req, res) => {
  const { userId } = req.body;

  try {
    const user = await AppUser.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.loginCheck = false;
    await user.save();
    req.app.locals.io.emit("orderPlaced");
    res.json({ message: "User logged out (or already logged out)" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/notify/get", async (req, res) => {
  try {
    const getOrderCount = await Order.countDocuments({ clickDiv: false });
    console.log("getOrderCount", getOrderCount);
    return res.status(200).json(getOrderCount);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/notify/change", async (req, res) => {
  try {
    const changeOrderCount = await Order.updateMany(
      {},
      { clickDiv: true },
      { new: true }
    );
    console.log("changeOrderCount", changeOrderCount);

    if (!changeOrderCount) {
      return res.status(404).json({ message: "not found" });
    }
    return res.status(200).json({ message: "Successfully Changed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
