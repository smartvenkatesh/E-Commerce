import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useUser } from '../UserContext';
import { Button } from '@mui/material';
import { toast, ToastContainer } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import DeleteIcon from '@mui/icons-material/Delete';
import BackButton from '../utils/BackButton';
import '../App.css'

const CartPage = () => {
  const { userId } = useUser();
  const [cartItems, setCartItems] = useState([]);
  const navigate = useNavigate()

  const handleGet=()=>{
    axios.get(`http://localhost:8080/ecommerce/cart/${userId}`)
      .then(res => setCartItems(res.data.cart))
      .catch(err => {
        toast.warning("Your Card is Empty")
         navigate("/home")
      });
  }
  useEffect(() => {
    handleGet()
  }, [userId]);

 const handleBuy = () => {
   if (!userId) {
        toast.error("Please login to add to cart");
        navigate("/login");
        return;
      }
  toast.info("Redirecting to payment...");
  navigate("/payment", { state: { cart: cartItems } });
 };

 const handleDeleteOneCard=(id)=>{
  axios.delete(`http://localhost:8080/ecommerce/cart/${id}`)
  .then(()=>{
    toast.success("One Card Deleted Successfully")
    handleGet()
  }).catch((err)=>{
    toast.error("All items deleted",err)
    localStorage.removeItem("cartCount")
   
  })
 }

  return (
    <div className='cart-page'>
      <span>
      <BackButton/>
      </span>
      <h2>Your Cart</h2>
      {cartItems.map((item, i) => (
        <div key={i} className='cart-item'>
          <img src={`http://localhost:8080/uploads/${item.productImage}`} width="100" />
          <div className='cart-text'>
          <h4>{item.productName}</h4>
          <p>₹{item.productPrice}</p>
          <p>Qty:{item.quantity}</p>
          <DeleteIcon onClick={()=>handleDeleteOneCard(item.cartId)}/>
          </div>
        </div>
      ))}
      <Button variant='contained' color='primary' onClick={handleBuy}>Buy All</Button>
      <ToastContainer/>
    </div>
  );
};

export default CartPage;
