import React, { useEffect, useRef, useState, useContext } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { io } from "socket.io-client";
import { useParams } from "react-router-dom";
import { GeminiContext } from "../context/GeminiContext";
import Sidebar from "./Sidebar";

const DocumentEditor = () => {
  const editorRef = useRef(null);
  const quillRef = useRef(null);
  const [socket, setSocket] = useState();
  const [quill, setQuill] = useState();
  const { roomId } = useParams();

  const { onSent, setQuillInstance, loading } = useContext(GeminiContext);

  const TOOLBAR_OPTIONS = [
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    [{ font: [] }],
    [{ list: "ordered" }, { list: "bullet" }],
    ["bold", "italic", "underline"],
    [{ color: [] }, { background: [] }],
    [{ script: "sub" }, { script: "super" }],
    [{ align: [] }],
    ["image", "blockquote", "code-block"],
    ["clean"],
  ];

  useEffect(() => {
    const s = io("https://luxoft-board-collab-gmit.onrender.com", {
      transports: ["websocket"],
      withCredentials: true,
    });
    setSocket(s);
    return () => {
      s.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!quillRef.current && editorRef.current) {
      quillRef.current = new Quill(editorRef.current, {
        theme: "snow",
        modules: { toolbar: TOOLBAR_OPTIONS },
      });
      const q = quillRef.current;
      q.disable();
      q.setText("Loading...");
      setQuill(q);
      setQuillInstance(q); // pass quill instance to context
    }
  }, [setQuillInstance]);

  useEffect(() => {
    if (socket == null || quill == null) return;

    socket.once("load-room", (room) => {
      quill.setContents(room);
      quill.enable();
    });

    socket.emit("get-room", roomId);
  }, [quill, socket, roomId]);

  useEffect(() => {
    if (socket == null || quill == null) return;
    const handler = (delta) => {
      quill.updateContents(delta);
    };
    socket.on("receive-changes", handler);
    return () => {
      socket.off("receive-change", handler);
    };
  }, [socket, quill]);

  useEffect(() => {
    if (socket == null || quill == null) return;

    const interval = setInterval(() => {
      socket.emit("save-document", quill.getContents());
    }, 2000);
    return () => {
      clearInterval(interval);
    };
  }, [socket, quill]);

  useEffect(() => {
    if (socket == null || quill == null) return;

    const handler = (delta, oldDelta, source) => {
      if (source !== "user") return;
      socket.emit("send-changes", delta);
    };

    quill.on("text-change", handler);
    return () => {
      quill.off("text-change", handler);
    };
  }, [socket, quill]);

  return (
    <div className="flex-1 p-4 sm:p-8 h-screen sm:mx-28 mx-6 bg-gray-900  overflow-y-scroll relative">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center blur-sm opacity-30"
        style={{ backgroundImage: "url('/board.png')" }}
      ></div>

      {/* Content */}
      <div className="relative bg-white/90 backdrop-blur-md max-w-4xl mx-auto rounded-xl shadow-lg p-4 sm:p-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">
          Document Editor
        </h2>

        <div className="relative border border-gray-300 rounded-lg h-[80vh] overflow-hidden shadow-inner">
          <div ref={editorRef} className="h-full p-2 sm:p-4" />

          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm rounded-lg">
              <p className="text-gray-600 text-lg font-medium">
                AI is generating...
              </p>
            </div>
          )}

          <button
            disabled={loading}
            type="button"
            onClick={() => onSent()}
            className="absolute bottom-2 right-2 text-sm bg-indigo-100 border border-indigo-200 px-3 py-1 rounded-lg hover:bg-indigo-200 transition shadow-md"
          >
            Generate with AI
          </button>
        </div>
      </div>
      <Sidebar />
    </div>
  );
};

export default DocumentEditor;
