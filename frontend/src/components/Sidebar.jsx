import React from "react";
import { FileText, MessageCircle, Users, Home } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useRoom } from "../context/RoomContext";

const Sidebar = () => {
  const location = useLocation();
  const { roomId, usn } = useRoom();

  const menuItems = [
    { name: "White Board", icon: Home, path: `/room/${roomId}` },
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
    <>
      {/* Desktop Sidebar (Right side, vertical) */}
      <div className="hidden sm:flex fixed top-1/2 -translate-y-1/2 right-6 flex-col items-center space-y-6 text-yellow-500 z-50">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <div key={index} className="relative group">
              <Link
                to={item.path}
                className={`flex items-center justify-center w-12 h-12 rounded-md transition-colors ${
                  isActive ? "bg-yellow-500 text-white" : ""
                }`}
              >
                <Icon size={22} />
              </Link>
              {/* Tooltip (hover only desktop) */}
              <div className="absolute right-full top-1/2 -translate-y-1/2 mr-2 text-sm bg-gray-800 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                {item.name}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile Bottom Navbar */}
      <div className="sm:hidden fixed bottom-0 left-0 w-full bg-gray-900 border-t border-gray-700 flex justify-around py-2 z-50">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={index}
              to={item.path}
              className={`flex flex-col items-center justify-center text-yellow-500 ${
                isActive ? "text-yellow-300" : "text-yellow-500"
              }`}
            >
              <Icon size={22} />
              <span className="text-xs mt-1">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </>
  );
};

export default Sidebar;
