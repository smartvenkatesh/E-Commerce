import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import '../App.css'

const VerifyOTP = () => {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const { userId } = location.state || {};

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:8080/ecommerce/register/verify-otp", {
        userId,
        otp,
      });

      if (res.status === 200) {
        alert("Email verified! Please log in.");
        navigate("/login");
      }
    } catch (err) {
      setError(err.response?.data?.message || "OTP verification failed");
    }
  };

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
          required
          maxLength={6}
        />
        <button type="submit">Verify</button>
      </form>
    </div>
  );
};

export default VerifyOTP;
