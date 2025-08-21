import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Room from "./pages/Room";
import DocumentEditor from "./components/DocumentEditor";
import ChatBox from "./components/ChatBox";
import UserList from "./components/UserList";
import toast, { Toaster } from "react-hot-toast";
import Sidebar from "./components/Sidebar";
import { useRoom } from "./context/RoomContext";

export default function App() {
  return (
    <div>
      <Toaster />
      <div className="bg-gray-900">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/room/:roomId" element={<Room />} />
          <Route path="/room/:roomId/doc-editor" element={<DocumentEditor />} />
          <Route path="/room/:roomId/chat/:name" element={<ChatBox />} />
          <Route path="/room/:roomId/users" element={<UserList />} />
        </Routes>
      </div>
    </div>
  );
}
