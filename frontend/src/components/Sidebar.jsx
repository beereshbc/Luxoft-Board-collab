import React, { useState } from "react";
import {
  FileText,
  MessageCircle,
  Users,
  Home,
  Menu,
  ArrowLeft,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useRoom } from "../context/RoomContext";

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { roomId, usn } = useRoom();
  const [menuOpen, setMenuOpen] = useState(false);

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
              <div className="absolute right-full top-1/2 -translate-y-1/2 mr-2 text-sm bg-gray-800 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                {item.name}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile Buttons: Back, Home, Hamburger */}
      <div className="sm:hidden fixed bottom-4 right-4 z-50 flex space-x-3">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="bg-gray-900 text-yellow-500 p-3 rounded-full shadow-lg flex items-center justify-center"
        >
          <ArrowLeft size={24} />
        </button>

        {/* Home Button */}
        <Link
          to="/"
          className="bg-gray-900 text-yellow-500 p-3 rounded-full shadow-lg flex items-center justify-center"
        >
          <Home size={24} />
        </Link>

        {/* Hamburger Menu */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="bg-gray-900 text-yellow-500 p-3 rounded-full shadow-lg"
        >
          <Menu size={24} />
        </button>

        {/* Slide-up menu */}
        {menuOpen && (
          <div className="fixed bottom-16 right-4 bg-gray-900 rounded-lg shadow-lg py-4 px-3 flex flex-col space-y-3 z-50">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={index}
                  to={item.path}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
                    isActive
                      ? "bg-yellow-500 text-white"
                      : "text-yellow-500 hover:bg-gray-800"
                  }`}
                  onClick={() => setMenuOpen(false)}
                >
                  <Icon size={20} />
                  <span className="text-sm">{item.name}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

export default Sidebar;
