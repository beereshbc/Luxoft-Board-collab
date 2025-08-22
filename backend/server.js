import "dotenv/config";
import { Server } from "socket.io";
import connectDB from "./config/mongoDB.js";
import express from "express";
import DocumentModel from "./models/DocumentModel.js";
import WhiteboardModel from "./models/WhiteboardModel.js";
import ChatModel from "./models/ChatModel.js";

const app = express();
app.use(express.json());

// ✅ connect DB
await connectDB();

const io = new Server(4001, {
  cors: {
    origin: "https://luxoft-board-collab.vercel.app",
    methods: ["GET", "POST"],
  },
});

const defaultDocValue = "";
const onlineUsers = {}; // { roomId: [ { username, usn } ] }

io.on("connection", (socket) => {
  console.log("✅ Client connected:", socket.id);

  // ---------------- Document ----------------
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

  // ---------------- Whiteboard ----------------
  socket.on("get-board", async (roomId) => {
    const board = await findOrCreateBoard(roomId);
    socket.join(roomId);
    socket.emit("load-board", board.strokes || []);

    socket.on("send-stroke", async (stroke) => {
      try {
        await WhiteboardModel.findByIdAndUpdate(
          roomId,
          { $push: { strokes: stroke } },
          { new: true }
        );
        socket.broadcast.to(roomId).emit("receive-stroke", stroke);
      } catch (err) {
        console.error("BOARD stroke error:", err.message);
      }
    });

    socket.on("undo-stroke", async (strokeId) => {
      try {
        await WhiteboardModel.updateOne(
          { _id: roomId },
          { $pull: { strokes: { id: strokeId } } }
        );
        socket.to(roomId).emit("apply-undo", strokeId);
      } catch (err) {
        console.error("BOARD undo error:", err.message);
      }
    });

    socket.on("save-board", async (strokes) => {
      try {
        await WhiteboardModel.findByIdAndUpdate(
          roomId,
          { strokes: strokes || [] },
          { upsert: true }
        );
      } catch (err) {
        console.error("BOARD save error:", err.message);
      }
    });

    socket.on("clear-board", async () => {
      try {
        await WhiteboardModel.findByIdAndUpdate(roomId, { strokes: [] });
        io.to(roomId).emit("clear-board");
      } catch (err) {
        console.error("BOARD clear error:", err.message);
      }
    });
  });

  // ---------------- Chat ----------------
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

  // ---------------- Users ----------------
  socket.on("join-room", ({ roomId, usn, username }) => {
    socket.join(roomId);
    socket.data = { roomId, usn }; // ✅ track who is inside

    if (!onlineUsers[roomId]) onlineUsers[roomId] = [];
    if (!onlineUsers[roomId].some((u) => u.usn === usn)) {
      onlineUsers[roomId].push({ usn, username });
    }

    io.to(roomId).emit("update-users", onlineUsers[roomId]);
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
    const { roomId, usn } = socket.data || {};
    if (roomId && usn && onlineUsers[roomId]) {
      onlineUsers[roomId] = onlineUsers[roomId].filter((u) => u.usn !== usn);
      io.to(roomId).emit("update-users", onlineUsers[roomId]);
    }
  });
});

// ---------------- Helpers ----------------
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

// ---------------- HTTP ----------------
app.get("/", (req, res) => {
  res.send("Luxoft API is working....");
});

// app.listen(4000, () => console.log("HTTP server on 4000"));
