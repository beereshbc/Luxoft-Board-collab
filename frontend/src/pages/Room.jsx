import { useParams } from "react-router-dom";
import Whiteboard from "../components/Whiteboard";
import DocumentEditor from "../components/DocumentEditor";
import ChatBox from "../components/ChatBox";
import UserList from "../components/UserList";
import Sidebar from "../components/Sidebar";

export default function Room() {
  const { roomId } = useParams();

  return (
    <div className="h-screen flex">
      {/* Whiteboard Area */}
      <div className="flex-1 transition-all duration-300">
        <Whiteboard />
      </div>

      {/* Sidebar */}
      <div className={`transition-all duration-300 z-20 `}>
        <Sidebar />
      </div>
    </div>
  );
}
