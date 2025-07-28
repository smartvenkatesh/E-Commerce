import mongoose from "mongoose";

const CartSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Products" },
    appUserId:  { type: mongoose.Schema.Types.ObjectId, ref: "AppUser" },
    totalQuantity:{type:Number}
})

export const Cart = mongoose.model("Cart",CartSchema)