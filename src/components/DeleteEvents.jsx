import React from 'react'
import BackButton from '../utils/BackButton'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { Button } from '@mui/material'
import '../App.css'

const DeleteEvents = () => {
  const navigate=useNavigate()
  const {id}=useParams()

  const handleDeleteEvent=()=>{
    axios.delete(`http://localhost:8080/events/home/${id}`,{
      headers:{
        Authorization:`Bearer ${localStorage.getItem("token")}`
      },
    })
    .then(()=>{
      navigate("/home")
    }).catch((err)=>{
      console.log(err);
    })
  }
  return (
    <div>
      <BackButton/>
      <div className='text-center' id='delete-event'>
        <h1>Delete Event</h1>
        <div>
          <h3>Are you sure you want to delete this event?</h3>
          <Button
            className="me-5"
            onClick={handleDeleteEvent}
            variant="contained"
          >
            Yes
          </Button>
          <Button onClick={() => navigate("/home")} variant="contained">
            No
          </Button>
        </div>
      </div>
    </div>
  )
}

export default DeleteEvents