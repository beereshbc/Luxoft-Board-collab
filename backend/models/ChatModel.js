import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
  roomId: { type: String, required: true },
  messages: [
    {
      user: { type: String, required: true },
      text: { type: String, required: true },
      ts: { type: Date, default: Date.now },
    },
  ],
});

const ChatModel = mongoose.models.Chat || mongoose.model("Chat", chatSchema);

export default ChatModel;
