const express = require("express");
const router = express.Router();
const messageController = require("../Controller/messageController");
const userController = require("../Controller/userController");
router.route("/register").post(userController.createUser);
router.route("/auth").post(userController.Login);
router.route("/message/:id").get(messageController.getMessages);
router.route("/messages/:id").get(messageController.getAllMessages);
router.route("/users").get(userController.getAllUsers);

module.exports = router;
