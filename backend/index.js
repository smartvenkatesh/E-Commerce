import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import eventRoutes from './routes/eventRoutes.js'
import http from 'http'
import { Server } from 'socket.io'
const app=express()
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ['GET', 'POST', 'DELETE'],
    credentials: true
  }
});

const PORT=8080

app.use(cors())
app.use(express.json())
app.use('/uploads', express.static('uploads'));

app.use("/ecommerce",eventRoutes)

app.locals.io = io;

mongoose.connect("mongodb://localhost:27017/ecommerce").then(() => {
  console.log("DB Connected")})

  io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

});

 server.listen(PORT, () => console.log(`server is running on http://localhost:${PORT}`))