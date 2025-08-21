//-------------------------------------------------------------------

import { Server } from "socket.io";
import connectDB from "./config/mongoDB.js";
import express from "express";
import DocumentModel from "./models/DocumentModel.js";
import WhiteboardModel from "./models/WhiteboardModel.js";
import ChatModel from "./models/ChatModel.js";

const app = express();
app.use(express.json());

await connectDB();

const io = new Server(4001, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// ---------------- Document Editor (Quill) ----------------
const defaultDocValue = "";

const onlineUsers = {};

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // ------ DOC: join + load ------
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

    // Clear the entire board
    socket.on("clear-board", async (roomId) => {
      try {
        await WhiteboardModel.findByIdAndUpdate(roomId, { strokes: [] });
        io.to(roomId).emit("clear-board"); // broadcast to everyone
      } catch (err) {
        console.error("BOARD clear error:", err.message);
      }
    });
  });

  // ---------------- Chat ----------------
  socket.on("get-chat", async (roomId) => {
    let chat = await ChatModel.findOne({ roomId });
    if (!chat) {
      chat = await ChatModel.create({ roomId, messages: [] });
    }

    socket.join(`chat-${roomId}`);
    socket.emit("load-chat", chat.messages);

    socket.on("send-chat", async (msg) => {
      if (!msg.text.trim()) return;

      const newMsg = { user: msg.user, text: msg.text, ts: new Date() };
      chat.messages.push(newMsg);
      await chat.save();

      socket.to(`chat-${roomId}`).emit("receive-chat", newMsg);
      socket.emit("receive-chat", newMsg); // emit to sender immediately
    });
  });
  //------------------users per room --------------
  socket.on("join-room", ({ roomId, usn, username }) => {
    socket.join(roomId);

    // Add user to online list
    if (!onlineUsers[roomId]) onlineUsers[roomId] = [];

    // Prevent duplicates
    if (!onlineUsers[roomId].some((u) => u.usn === usn)) {
      onlineUsers[roomId].push({ usn, username });
    }

    // Broadcast updated list
    io.to(roomId).emit("update-users", onlineUsers[roomId]);
  });
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);

    const { username, roomId } = socket.data;
    if (username && roomId && onlineUsers[roomId]) {
      onlineUsers[roomId] = onlineUsers[roomId].filter(
        (user) => user !== username
      );
      io.to(roomId).emit("update-users", onlineUsers[roomId]);
    }
  });
});

const findOrCreateDocument = async (id) => {
  if (!id) return null;
  const document = await DocumentModel.findById(id);
  if (document) return document;
  return await DocumentModel.create({ _id: id, data: defaultDocValue });
};

const findOrCreateBoard = async (id) => {
  if (!id) return null;
  const board = await WhiteboardModel.findById(id);
  if (board) return board;
  return await WhiteboardModel.create({ _id: id, strokes: [] });
};

// ---------------- Minimal HTTP ----------------
app.get("/", (req, res) => {
  res.send("Luxoft API is working....");
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`HTTP server running on port ${PORT}`);
});

//-------------------------------------------------------------------

// import { Server } from "socket.io";
// import connectDB from "./config/mongoDB.js";
// import express from "express";
// import DocumentModel from "./models/DocumentModel.js";

// const app = express();

// app.use(express.json());

// await connectDB();

// const io = new Server(4001, {
//   cors: {
//     origin: "http://localhost:5173",
//     methods: ["GET", "POST"],
//   },
// });

// const defaultValue = "";

// io.on("connection", (socket) => {
//   console.log("Client Connect Agide: ", socket.id);

//   socket.on("get-room", async (roomId) => {
//     const document = await findOrCreateDocument(roomId);
//     socket.join(roomId);
//     socket.emit("load-room", document.data);
//     socket.on("send-changes", (delta) => {
//       socket.broadcast.to(roomId).emit("receive-changes", delta);
//     });

//     socket.on("save-document", async (data) => {
//       await DocumentModel.findByIdAndUpdate(roomId, { data });
//     });
//   });

//   socket.on("disconnect", () => {
//     console.log("Client Disconnect agidane: ", socket.id);
//   });
// });

// const findOrCreateDocument = async (id) => {
//   if (id == null) return;
//   const document = await DocumentModel.findById(id);
//   if (document) return document;
//   return await DocumentModel.create({ _id: id, data: defaultValue });
// };

// app.get("/", (req, res) => {
//   res.send("Luxoft API is working....");
// });

// const PORT = 4000;

// app.listen(PORT, () => {
//   console.log(`Server is Running on port ${PORT}`);
// });
