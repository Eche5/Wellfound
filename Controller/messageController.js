const Message = require("../Model/messageModel");

exports.getMessages = async function(req, res) {
  const id = req.params.id;
  const messages = await Message.find({ user: id });

  if (!messages) {
    res.status(200).json({ status: "success", message: "empty " });
  } else {
    res.status(200).json({ status: "success", data: messages });
  }
};
exports.getAllMessages = async function(req, res) {
  try {
    const id = req.params.id;
    const userMessage = await Message.find({ user: id });
    const messages = await Message.find().populate("user");

    // Extracting IDs from userMessage objects
    const userMessageIds = userMessage.map((msg) => msg._id.toString());

    // Filtering out messages that have matching IDs with userMessage
    const filteredMessages = messages.filter(
      (msg) => !userMessageIds.includes(msg._id.toString())
    );

    if (!filteredMessages || filteredMessages.length === 0) {
      res.status(200).json({ status: "success", message: "No messages found" });
    } else {
      res.status(200).json({ status: "success", data: filteredMessages });
    }
  } catch (error) {
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
};
