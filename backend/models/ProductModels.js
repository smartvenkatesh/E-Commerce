import mongoose from "mongoose";

const ProductSchema=new mongoose.Schema({
    productName:{type:String,required:true},
    productImage:{type:String,required:true},
    productDescription:{type:String,required:true},
    productCategory:{type:String,required:true},
    productPrice:{type:String,required:true},
    totalProducts:{type:Number, default:10}
},{
    timestamps:true,
})

export const Products=mongoose.model("Products",ProductSchema)