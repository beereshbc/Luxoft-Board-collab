import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRoom } from "../context/RoomContext";

export default function Home() {
  const [roomInput, setRoomInput] = useState("");
  const [username, setUsername] = useState("");
  const [usn, setUsn] = useState("");
  const navigate = useNavigate();
  const { joinRoom } = useRoom();

  const handleJoin = () => {
    if (roomInput.trim() && username.trim() && usn.trim()) {
      joinRoom(roomInput, username, usn);
      // ✅ go to /room/roomId/chat/username
      navigate(`/room/${roomInput}`);
    }
  };
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-white px-4">
      {/* Header */}
      <div className="text-center mb-8 max-w-3xl">
        <p className="text-4xl font-extrabold">
          Welcome to the Luxoft Collaborative Whiteboard
        </p>
        <p className="text-sm text-gray-500 leading-relaxed">
          “AI Collab Board empowers your team to brainstorm, draw, chat, and
          innovate together <br />
          in real-time — bringing ideas to life seamlessly on a single
          collaborative platform.”
        </p>
      </div>

      {/* Board + Form */}
      <div className="flex items-center justify-center relative w-full max-w-6xl">
        {/* Board Image */}
        <div>
          <img
            src="/board.png"
            alt="Board"
            className="max-w-xl rounded-2xl  border border-gray-200"
          />
        </div>

        {/* Overlay Form Card */}
        <div className="p-8 rounded-2xl w-full max-w-md absolute shadow-2xl border border-gray-300 bg-white/20 backdrop-blur-sm">
          {/* Title */}
          <h1 className="text-4xl font-extrabold text-balck text-center mb-2 drop-shadow-md">
            AI Collab Board
          </h1>
          <p className="text-gray-700 text-center mb-8">
            Collaborate in real-time with your team — draw, chat, and innovate
            together.
          </p>

          {/* Form */}
          <div className="flex flex-col space-y-4">
            <input
              type="text"
              value={usn}
              onChange={(e) => setUsn(e.target.value)}
              placeholder="👤 Enter your USN"
              className="p-3 rounded-lg border border-gray-400 focus:ring-2 focus:ring-white focus:outline-none shadow-sm"
            />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="👤 Enter your name"
              className="p-3 rounded-lg border border-gray-400 focus:ring-2 focus:ring-white focus:outline-none shadow-sm"
            />

            <input
              type="text"
              value={roomInput}
              onChange={(e) => setRoomInput(e.target.value)}
              placeholder="🏠 Enter Room ID"
              className="p-3 rounded-lg border border-gray-400 focus:ring-2 focus:ring-white focus:outline-none shadow-sm"
            />

            <button
              onClick={handleJoin}
              className="px-4 py-3 rounded-lg bg-white text-black font-semibold shadow-lg hover:opacity-90 transition-all border border-gray-200"
            >
              🚀 Join Room
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
