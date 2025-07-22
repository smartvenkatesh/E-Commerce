import React from 'react'
import { Route, Routes } from 'react-router-dom'
import Register from './components/Register'
import Home from './components/Home'
import Login from './components/Login'
import { useUser } from './UserContext'
import Admin from './components/Admin'
import Profile from './components/Profile'
import CardPage from './components/CartPage'
import PaymentPage from './components/PaymentPage'
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import UserChat from './components/UserChat'
import VerifyOTP from './components/VerifyOTP'
import LoginVerifyOTP from './components/LoginVerifyOTP'


const App = () => {
  const{authenticated}=useUser()
  return (
    <>
    <Routes>
      <Route path='/' element={<Register/>}/>
      <Route path="/register/verify-otp" element={<VerifyOTP />} />
      <Route path='/login/verify-otp' element={<LoginVerifyOTP/>}/>
      <Route path='/login' element={<Login/>}/>
      <Route path='/home' element={<Home/>}/>
      <Route path='/home/userChat' element={<UserChat/>}/>
      <Route path='home/cart' element={<CardPage/>}/>
      <Route path="/home/admin" element={<Admin/>}/> 
      <Route path='/user/profile' element={<Profile/>}/>
      <Route path="/payment" element={<PaymentPage />} />
    </Routes>
    </>
  )
}

export default App