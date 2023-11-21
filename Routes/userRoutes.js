const express = require("express");
const router = express.Router();
const messageController = require("../Controller/messageController");
const userController = require("../Controller/userController");
const loginLimiter = require("../middlewares/LoginLimit");
router.route("/register").post(userController.createUser);
router.route("/auth").post(loginLimiter, userController.Login);
router.route("/message/:id").get(messageController.getMessages);
router.route("/forgotpassword").post(userController.forgotPassword);
router.route("/verify").post(userController.resendverification);

router.route("/verify/:id").patch(userController.verify);

router.route("/resetpassword/:id/:token").patch(userController.resetPassword);

router.route("/googleauth").get(userController.getOneUser);
router.route("/messages/:id").get(messageController.getAllMessages);
router.route("/users").get(userController.getAllUsers);

module.exports = router;
