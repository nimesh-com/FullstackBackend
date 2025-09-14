import Contact from "../Models/contactUs.js";
export async function createMessage(req, res) {
  const MessageData = {
    name: req.body.name,
    email: req.body.email,
    message: req.body.message,
    phone: req.body.phone
  }
  const message = new Contact(MessageData);
  try {
    await message.save();
    res.status(201).json({ message: "Message created successfully" });
  } catch (error) {
    console.error("Error creating message:", error);
    return res.status(500).json({ message: "Error creating message", error: error });
  }

}

export async function getMessages(req, res) {
  const page = parseInt(req.params.page) || 1; // Default to page 1 if not provided
  const limit = parseInt(req.params.limit) || 10; // Default to 10 items per page if not provided
  try {
    const MessageCount = await Contact.countDocuments();
    const totalPages = Math.ceil(MessageCount / limit);
    const message = await Contact.find()
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ date: -1 });
    res.json({
      messages: message,
      totalPages: totalPages,
    });
  } catch (error) {
    console.error("Error getting orders:", error);
    return res.status(500).json({
      message: "Error getting orders",
      error: error,
    });
  }
}

export async function statusMessage(req, res) {
  const messageId = req.params.id;
  const status = req.body.read;
  Contact.findOneAndUpdate({ _id: messageId }, { status: status }).then((message) => {
    if (message == null) {
      res.status(404).json({ message: "Message not found" });
    } else {
      res.json({ message: "Message updated successfully" });
    }
  })
}

export async function deleteMessage(req, res) {
  const messageId = req.params.id;
  try {
    await Contact.deleteOne({ _id: messageId });
    res.json({ message: "Message deleted successfully" });
  } catch (error) {
    console.error("Error deleting message:", error);
    return res.status(500).json({
      message: "Error deleting message",
      error: error,
    });
  }
}