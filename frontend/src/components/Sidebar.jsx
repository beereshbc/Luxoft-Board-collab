import React, { useContext } from "react";
import { FileText, MessageCircle, Users } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useRoom } from "../context/RoomContext";

const Sidebar = () => {
  const location = useLocation();
  const { user, roomId, usn } = useRoom();
  const menuItems = [
    {
      name: "Document Editor",
      icon: FileText,
      path: `/room/${roomId}/doc-editor`,
    },
    {
      name: "Chatbox",
      icon: MessageCircle,
      path: `/room/${roomId}/chat/${usn}`,
    },
    { name: "Users", icon: Users, path: `/room/${roomId}/users` },
  ];

  return (
    <div className="fixed top-52 sm:right-10 right-0  text-yellow-500  flex flex-col justify-center items-center text-center my-auto space-y-6">
      {menuItems.map((item, index) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;

        return (
          <div key={index} className="relative group">
            {/* Icon */}
            <Link
              to={item.path}
              className={`flex items-center justify-center w-12 h-12 rounded-md transition-colors `}
            >
              <Icon size={20} />
            </Link>

            {/* Transparent Flyout (only text on hover) */}
            <div className="absolute right-full top-1/2 -translate-y-1/2 mr-2 text-sm  whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none drop-shadow-md">
              {item.name}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Sidebar;
