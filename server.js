const { default: mongoose } = require("mongoose");
const { app, server } = require("./app");
const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });
const PORT = process.env.PORT;
const DB = process.env.DATABASE;
mongoose
  .connect(DB)
  .then(() => {
    console.log("MongoDB connected");
    // Start the server after successful MongoDB connection
    startServer();
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

// Start the server
function startServer() {
  const serverInstance = server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });

  serverInstance.on("error", (err) => {
    console.error("Server error:", err);
  });
}
