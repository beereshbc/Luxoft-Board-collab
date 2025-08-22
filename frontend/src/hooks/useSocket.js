// frontend/src/hooks/useSocket.js
import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

export default function useSocket(roomId) {
  const socketRef = useRef(null);

  useEffect(() => {
    // Connect to backend
    socketRef.current = io("https://luxoft-board-collab-4-gmit.onrender.com", {
      transports: ["websocket"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current.on("connect", () => {
      console.log("✅ Connected:", socketRef.current.id);
      if (roomId) {
        socketRef.current.emit("join_room", { roomId });
        console.log(`📌 Joined room: ${roomId}`);
      }
    });

    socketRef.current.on("disconnect", (reason) => {
      console.log("❌ Disconnected:", reason);
    });

    return () => {
      if (roomId && socketRef.current) {
        socketRef.current.emit("leave_room", { roomId });
        console.log(`🚪 Left room: ${roomId}`);
      }
      socketRef.current?.disconnect();
    };
  }, [roomId]);

  return socketRef;
}
