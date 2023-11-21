const express = require("express");
const cors = require("cors");
const userRoutes = require("./Routes/userRoutes");
const cookieParser = require("cookie-parser");
const socketIo = require("socket.io");
const http = require("http");
const corsOptions = require("./config/corsOptions");
const credentials = require("./middlewares/credentials");
const Message = require("./Model/messageModel");
const app = express();
app.use(credentials);
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use("/", userRoutes);

const server = http.createServer(app);
const io = socketIo(server, {
  cors: corsOptions,
});
io.on("connection", (socket) => {
  console.log("User connected");

  // Handle incoming messages
  socket.on("message", async (data) => {
    const id = data.userId;

    try {
      const newMessage = new Message({
        user: data.userId,
        text: data.text,
        timestamp: new Date(),
      });

      const savedMessage = await newMessage.save();

      // Broadcast the message to all connected clients
      io.emit("message", savedMessage);
    } catch (error) {
      console.error("Error saving message to MongoDB:", error);
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

module.exports = { app, server };
