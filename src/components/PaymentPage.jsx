import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useUser } from "../UserContext";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../App.css";
import { Button } from "@mui/material";
import BackButton from "../utils/BackButton";

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { cart } = location.state || {};
  const { userId } = useUser();
  const [viewProfile, setViewProfile] = useState([]);

  const handleGetDetails = () => {
    if (userId) {
      axios
        .get(`http://localhost:8080/ecommerce/profile/${userId}`)
        .then((res) => {
          setViewProfile(res.data.profile);
        });
    }
  };
  useEffect(() => {
    handleGetDetails();
    console.log("cart", cart);
  }, []);

  if (!cart || cart.length === 0)
    return (
      <p className="empty-cart-message">
        No items selected for payment. <br />
        <Button variant="contained" onClick={() => navigate("/home")}>
          Go To Home
        </Button>
      </p>
    );

  const total = cart.reduce(
    (sum, item) => sum + item.productPrice * item.quantity,
    0
  );

  const handlePayment = async () => {
    try {
      await axios.post(
        "http://localhost:8080/ecommerce/order",
        {
          userId,
          products: cart,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (!userId) {
        navigate("/");
      }
      await axios.delete(`http://localhost:8080/ecommerce/cart/pay/${userId}`);
      toast.success("Payment Successful!");
      setTimeout(() => {
        navigate("/home");
      }, 3000);
      localStorage.removeItem("cartCount");
    } catch (error) {
      console.error("Payment error:", error.response?.data || error.message);
      toast.error("Payment Failed");
    }
  };

  return (
    <div className="paymend-body">
      <BackButton destination="/home/cart" />
      <div className="payment-page-container">
        <h2>Confirm Your Payment</h2>
        <div className="cart-items">
          {cart.map((item, i) => (
            <div className="cart-item-card" key={i}>
              <img
                src={`http://localhost:8080/uploads/${item.productImage}`}
                alt={item.productName}
                className="product-image"
              />
              <div className="product-details">
                <h4>{item.productName}</h4>
                <p>
                  ₹{item.productPrice} x {item.quantity}
                </p>
                <p>
                  <strong>Subtotal:</strong> ₹
                  {item.productPrice * item.quantity}
                </p>
              </div>
            </div>
          ))}
        </div>
        {viewProfile.map((profile, index) => (
          <div className="shipping-payment">
            <span className="payment">Shipping Address : </span>
            <span className="shipping">{profile.shipping}</span>
            <span className="payment">Payment Method : </span>
            <span className="shipping">{profile.payment}</span>
          </div>
        ))}
        <div className="summary-section">
          <h3>Total Amount: ₹{total}</h3>
          <button className="pay-button" onClick={handlePayment}>
            Pay Now
          </button>
        </div>
        <ToastContainer />
      </div>
    </div>
  );
};

export default PaymentPage;
