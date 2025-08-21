import { createContext, useContext, useEffect, useState } from "react";

const RoomContext = createContext();

export function RoomProvider({ children }) {
  const [roomId, setRoomId] = useState(
    () => localStorage.getItem("roomId") || null
  );
  const [user, setUser] = useState(
    () => localStorage.getItem("username") || null
  );
  const [usn, setUsn] = useState(null); // ❌ don't read from localStorage
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);

  // --- helpers ---
  const joinRoom = (id, username, usnValue) => {
    setRoomId(id);
    setUser(username);
    setUsn(usnValue);

    // ✅ only save what’s needed for refresh
    localStorage.setItem("roomId", id);
    localStorage.setItem("username", username);

    console.log("Joined:", id, username, usnValue);
  };

  const addMessage = (msg) => {
    setMessages((prev) => [...prev, msg]);
  };

  const setUserList = (userList) => {
    setUsers(userList);
  };

  // ✅ Cleanup any leftover old key "usn"
  useEffect(() => {
    localStorage.removeItem("usn");
  }, []);

  return (
    <RoomContext.Provider
      value={{
        roomId,
        user, // username (for UI)
        usn, // usn (internal only)
        users,
        messages,
        joinRoom,
        addMessage,
        setUserList,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
}

export function useRoom() {
  return useContext(RoomContext);
}
