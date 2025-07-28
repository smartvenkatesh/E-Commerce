import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema({
  userId: String,
  clickDiv:{type:Boolean,default:false},
  products: [
    {
      productId: String,
      productName: String,
      productPrice: Number,
      quantity: Number
    }
  ],
  createdAt: Date
});

export const Order = mongoose.model("Order",OrderSchema)
