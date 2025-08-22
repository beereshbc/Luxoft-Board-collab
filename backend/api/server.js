import "dotenv/config";
import { Server } from "socket.io";
import connectDB from "../config/mongoDB.js";
import express from "express";
import DocumentModel from "../models/DocumentModel.js";
import WhiteboardModel from "../models/WhiteboardModel.js";
import ChatModel from "../models/ChatModel.js";
import serverless from "serverless-http";

const app = express();
app.use(express.json());

// ✅ Connect DB once
await connectDB();

const defaultDocValue = "";
const onlineUsers = {}; // { roomId: [ { username, usn } ] }

// ---------------- HTTP ----------------
app.get("/", (req, res) => {
  res.send("Luxoft API is working....");
});

// ---------------- Socket.IO ----------------
let io;

function initIO(server) {
  if (io) return io; // prevent re-init
  io = new Server(server, {
    cors: {
      origin: "https://luxoft-board-collab.vercel.app",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("✅ Client connected:", socket.id);

    // Document
    socket.on("get-room", async (roomId) => {
      const document = await findOrCreateDocument(roomId);
      socket.join(roomId);
      socket.emit("load-room", document.data);

      socket.on("send-changes", (delta) => {
        socket.broadcast.to(roomId).emit("receive-changes", delta);
      });

      socket.on("save-document", async (data) => {
        try {
          await DocumentModel.findByIdAndUpdate(roomId, { data });
        } catch (err) {
          console.error("DOC save error:", err.message);
        }
      });
    });

    // Whiteboard
    socket.on("get-board", async (roomId) => {
      const board = await findOrCreateBoard(roomId);
      socket.join(roomId);
      socket.emit("load-board", board.strokes || []);

      socket.on("send-stroke", async (stroke) => {
        await WhiteboardModel.findByIdAndUpdate(
          roomId,
          { $push: { strokes: stroke } },
          { new: true }
        );
        socket.broadcast.to(roomId).emit("receive-stroke", stroke);
      });

      socket.on("undo-stroke", async (strokeId) => {
        await WhiteboardModel.updateOne(
          { _id: roomId },
          { $pull: { strokes: { id: strokeId } } }
        );
        socket.to(roomId).emit("apply-undo", strokeId);
      });

      socket.on("save-board", async (strokes) => {
        await WhiteboardModel.findByIdAndUpdate(
          roomId,
          { strokes: strokes || [] },
          { upsert: true }
        );
      });

      socket.on("clear-board", async () => {
        await WhiteboardModel.findByIdAndUpdate(roomId, { strokes: [] });
        io.to(roomId).emit("clear-board");
      });
    });

    // Chat
    socket.on("get-chat", async (roomId) => {
      let chat = await ChatModel.findOne({ roomId });
      if (!chat) chat = await ChatModel.create({ roomId, messages: [] });

      socket.join(`chat-${roomId}`);
      socket.emit("load-chat", chat.messages);
    });

    socket.on("send-chat", async ({ roomId, user, text }) => {
      if (!text.trim()) return;
      const newMsg = { user, text, ts: new Date() };

      await ChatModel.findOneAndUpdate(
        { roomId },
        { $push: { messages: newMsg } },
        { upsert: true, new: true }
      );

      io.to(`chat-${roomId}`).emit("receive-chat", newMsg);
    });

    // Users
    socket.on("join-room", ({ roomId, usn, username }) => {
      socket.join(roomId);
      socket.data = { roomId, usn };

      if (!onlineUsers[roomId]) onlineUsers[roomId] = [];
      if (!onlineUsers[roomId].some((u) => u.usn === usn)) {
        onlineUsers[roomId].push({ usn, username });
      }

      io.to(roomId).emit("update-users", onlineUsers[roomId]);
    });

    socket.on("disconnect", () => {
      const { roomId, usn } = socket.data || {};
      if (roomId && usn && onlineUsers[roomId]) {
        onlineUsers[roomId] = onlineUsers[roomId].filter((u) => u.usn !== usn);
        io.to(roomId).emit("update-users", onlineUsers[roomId]);
      }
    });
  });

  return io;
}

// Helpers
const findOrCreateDocument = async (id) => {
  if (!id) return null;
  const document = await DocumentModel.findById(id);
  return (
    document || (await DocumentModel.create({ _id: id, data: defaultDocValue }))
  );
};

const findOrCreateBoard = async (id) => {
  if (!id) return null;
  const board = await WhiteboardModel.findById(id);
  return board || (await WhiteboardModel.create({ _id: id, strokes: [] }));
};

// ✅ Export handler for Vercel
const handler = serverless(app, {
  request: (req, res) => {
    initIO(res.socket?.server);
  },
});

export default handler;
