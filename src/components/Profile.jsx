import React, { useEffect, useState } from "react";
import axios from "axios";
import { useUser } from "../UserContext";
import { toast, ToastContainer } from "react-toastify";
import { Button, TextField } from "@mui/material";
import { encrypt } from "../utils/encrypted";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { useNavigate } from "react-router-dom";

const PaymentPage = () => {
  const { userId } = useUser();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNo, setPhoneNo] = useState("");
  const [shipping, setShipping] = useState("");
  const [payment, setPayment] = useState("");
  const [viewProfile, setViewProfile] = useState([]);
  const [activeTab, setActiveTab] = useState("add");
  const [profileName, setProfileName] = useState("");
  const [edit, setEdit] = useState("");
  const navigate = useNavigate();
  useEffect(() => {
    handleGetDetails();
  }, [userId]);

  const handleGetDetails = () => {
    if (userId) {
      setActiveTab("show");
      axios
        .get(`http://localhost:8080/ecommerce/profile/${userId}`)
        .then((res) => {
          if (res.data.profile.length !== 0) {
            setViewProfile(res.data.profile);
            console.log("profileName", res.data.profile);
            console.log("viewProfile", res.data.profile.length === 1);
            setProfileName(res.data.profile[0].email);
          } else {
            toast.error("profile is empty");
            toast.info("Add your profile");
            setActiveTab("add");
          }
        });
    }
  };

  const handleEdit = () => {
    if (userId) {
      setActiveTab("edit");
      axios
        .get(`http://localhost:8080/ecommerce/profile/${userId}`)
        .then((res) => {
          const data = res.data.profile[0];
          if (data === undefined) {
            toast.error("No profile found");
            toast.info("Please add the profile");
            setActiveTab("add");
          } else {
            setName(data.name);
            setEmail(data.email);
            setPhoneNo(data.phoneNo);
            setShipping(data.shipping);
            setPayment(data.payment);
          }
        });
    }
  };

  const handleSubmit = async () => {
    try {
      const data = { userId, name, email, phoneNo, shipping, payment };
      const encrypted = encrypt({ data });

      let res;

      if (activeTab === "edit") {
        res = await axios.post(
          `http://localhost:8080/ecommerce/profile/edit/${userId}`,
          encrypted
        );
      }
      if (activeTab === "add") {
        res = await axios.post(
          "http://localhost:8080/ecommerce/profile/add",
          encrypted
        );
      }
      toast.success(res.data.message);
      handleGetDetails();
      setName("");
      setEmail("");
      setPhoneNo("");
      setShipping("");
      setPayment("");
      console.log("setActiveTab", activeTab);
    } catch (err) {
      toast.error("Failed to save details", err);
    }
  };
  const handleLogout = () => {
    axios.post("http://localhost:8080/ecommerce/logout", { userId });
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    navigate("/login");
  };
  return (
    <div>
      <Box sx={{ flexGrow: 2 }}>
        <AppBar position="static">
          <Toolbar variant="dense">
            <Typography
              onClick={() => navigate("/home")}
              className="title-profile"
              variant="h5"
              color="inherit"
              component="div"
            >
              INZPYRE
            </Typography>
            <Typography className="edit-profile">Add Your Profile</Typography>
            <Typography onClick={handleEdit} className="edit-profile">
              Edit Your Proflie
            </Typography>
            <Typography onClick={handleGetDetails} className="edit-profile">
              view Your Proflie
            </Typography>
            <Typography className="profile-icon">
              {profileName.charAt(0).toUpperCase()}
            </Typography>
          </Toolbar>
        </AppBar>
      </Box>
      {(activeTab === "add" || activeTab === "edit") && (
        <div className="payment-page">
          {activeTab === "add" ? (
            <h2>Add Your Profile Details</h2>
          ) : (
            <h2>Edit Your Profile Details</h2>
          )}
          <TextField
            label="Enter Your Name"
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <TextField
            label="Enter Your Email"
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            label="Enter Your Phone No"
            fullWidth
            value={phoneNo}
            onChange={(e) => setPhoneNo(e.target.value)}
          />
          <TextField
            label="Shipping Address"
            fullWidth
            value={shipping}
            onChange={(e) => setShipping(e.target.value)}
          />
          <TextField
            label="Payment Details"
            fullWidth
            value={payment}
            onChange={(e) => setPayment(e.target.value)}
          />
          <Button variant="contained" color="primary" onClick={handleSubmit}>
            Submit
          </Button>
        </div>
      )}
      {activeTab === "show" && (
        <div className="profile-head">
          {viewProfile.map((profile, index) => (
            <div key={index}>
              <h1>Profile Details</h1>
              <div className="profile-body">
                <div className="tr">
                  <h4 className="td">Name :</h4>
                  <h4 className="td">Email :</h4>
                  <h4 className="td">Phone No : </h4>
                  <h4 className="td">shipping Address : </h4>
                  <h4 className="td">Payment Detalis : </h4>
                </div>
                <div className="tr">
                  <h4 className="td">{profile.name}</h4>
                  <h4 className="td">{profile.email}</h4>
                  <h4 className="td">{profile.phoneNo}</h4>
                  <h4 className="td">{profile.shipping}</h4>
                  <h4 className="td">{profile.payment}</h4>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <ToastContainer />
    </div>
  );
};

export default PaymentPage;
