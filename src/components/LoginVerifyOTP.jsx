import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import '../App.css'
import { toast, ToastContainer } from "react-toastify";

const VerifyOTP = () => {
  let count = 21
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [role,setRole] = useState("")
  const [limitCount,setLimitCount] = useState()
  const location = useLocation();
  const navigate = useNavigate();
  const { userId } = location.state || {};

  const updateTimer = ()=>{
    const timeLimit = setInterval(()=>{
    console.log(count);
    count--
    setLimitCount(count)
    if(count === 0){
      toast.warning("OTP is expired,click resend to get new OTP")
    }else(
      toast.success()
    )
     if(count <= 0){
      clearInterval(timeLimit)
    }
    },1000)
  }
  
  useEffect(()=>{
   updateTimer()
  },[])

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:8080/ecommerce/login/verify-otp", {
        userId,
        otp,
      });
      console.log("after verify",res.data.user.role);
      setRole(res.data.user.role.toString())
      
      if (res.status === 200) {
        if (res.data.user.role === "user") {
         navigate("/home"); 
        }
        if(res.data.user.role === "admin"){
          navigate("/home/admin")
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || "OTP verification failed");
    }
  };

  const handleResend =()=>{
    axios.post("http://localhost:8080/ecommerce/login/resendOtp",{userId})
    updateTimer()

  }

  return (
  <div className="verify-otp-container">
      <form className="verify-otp-card" onSubmit={handleSubmit}>
        <h2>Verify OTP</h2>
        {error && <p className="error-message">{error}</p>}
        <input
          type="text"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          placeholder="Enter 6-digit OTP"
          maxLength={6}
        />
        <p>0:{limitCount}</p>
        <button id="resend" onClick={handleResend}>Resend otp</button>
        <button type="submit">Verify</button>
      </form>
      <ToastContainer
              position="top-center"
              autoClose={7000}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover />
    </div>
  );
};

export default VerifyOTP;
