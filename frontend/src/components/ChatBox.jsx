import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { useParams } from "react-router-dom";
import { useRoom } from "../context/RoomContext";
import Sidebar from "./Sidebar";

const socket = io("https://luxoft-board-collab.vercel.app", {
  transports: ["websocket"],
});

export default function ChatBox() {
  const { roomId } = useParams();
  const { user } = useRoom();
  const username = user || localStorage.getItem("username") || "Me";

  const [msg, setMsg] = useState("");
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!roomId || !username) return;

    socket.emit("join-room", { roomId, username, usn: username });
    socket.emit("get-chat", roomId);

    socket.on("load-chat", (msgs) => setMessages(msgs));
    socket.on("receive-chat", (m) => setMessages((prev) => [...prev, m]));

    return () => {
      socket.off("load-chat");
      socket.off("receive-chat");
    };
  }, [roomId, username]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMsg = () => {
    if (!msg.trim()) return;
    socket.emit("send-chat", { roomId, user: username, text: msg });
    setMsg("");
  };

  return (
    <div className="flex flex-col h-screen sm:mx-28 mx-6 bg-gray-900 relative ">
      {/* Background */}
      <div className="absolute inset-0 bg-cover bg-center opacity-20 blur-sm pointer-events-none" />

      {/* Messages */}
      <div className="flex-1 flex flex-col overflow-y-auto px-4 py-6">
        <div className="flex-1 flex flex-col space-y-4 my-10">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${
                m.user === username ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[75%] p-3 rounded-xl shadow-md break-words ${
                  m.user === username
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-gray-200 text-gray-800 rounded-bl-none"
                }`}
              >
                <p className="text-sm font-semibold mb-1">{m.user}</p>
                <p className="text-base">{m.text}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="fixed bottom-0 left-0 w-full bg-gray-900  px-4 py-3 flex items-center gap-3 mb-20">
        <input
          type="text"
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMsg()}
          placeholder="Type your message..."
          className="flex-1 bg-white rounded-xl border border-gray-300 p-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800"
        />
        <button
          onClick={sendMsg}
          className="px-4 py-3 bg-blue-600 text-white rounded-xl shadow hover:bg-blue-700 transition-all"
        >
          Send
        </button>
      </div>

      <Sidebar />
    </div>
  );
}
