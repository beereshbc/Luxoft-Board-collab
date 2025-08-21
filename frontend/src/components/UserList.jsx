import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { useRoom } from "../context/RoomContext";
import Sidebar from "./Sidebar";

export default function UserList() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user, usn } = useRoom(); // ✅ from context
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const socket = io("http://localhost:4001", { transports: ["websocket"] });

    // ✅ send both separately
    socket.emit("join-room", {
      roomId,
      usn,
      username: user, // useRoom gives `user` = username
    });

    socket.on("update-users", (usersInRoom) => {
      setUsers(usersInRoom);
    });

    return () => {
      socket.disconnect();
    };
  }, [roomId, user, usn]);
  return (
    <div className="flex flex-col h-screen bg-gray-900 p-6 mx-2 sm:mx-44">
      {/* Page Header */}
      <div className="mb-6 text-center">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">
          Online Users
        </h1>
        <p className="text-gray-400 text-sm">
          See who is currently active in the room and ready to collaborate.
        </p>
      </div>

      {/* Users Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3">
          {users.map((u) => (
            <div
              key={u}
              className="p-4 h-28 bg-white rounded-xl shadow-md hover:shadow-lg transition-all flex flex-col items-center justify-center text-center"
            >
              <p className="font-semibold text-gray-800 text-lg">
                {u.username}
              </p>
              <p className="text-sm text-gray-500">Active now</p>
            </div>
          ))}
        </div>
      </div>

      {/* Back Button */}
      <div className="mt-4 flex justify-center">
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl shadow hover:bg-blue-700 transition-all"
        >
          Back to Page
        </button>
      </div>

      <Sidebar />
    </div>
  );
}
