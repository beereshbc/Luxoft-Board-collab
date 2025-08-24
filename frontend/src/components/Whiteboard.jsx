import React, { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { useParams } from "react-router-dom";
import {
  Undo2,
  Trash2,
  Download,
  Pen,
  Eraser,
  ZoomIn,
  ZoomOut,
  Move,
} from "lucide-react";
import toast from "react-hot-toast";

const CANVAS_BG = "#fefefe";

const Whiteboard = () => {
  const { roomId } = useParams();
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);

  const [socket, setSocket] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const [tool, setTool] = useState("pen");
  const [color, setColor] = useState("#1f2937");
  const [width, setWidth] = useState(3);

  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const lastPan = useRef({ x: 0, y: 0 });

  const [strokes, setStrokes] = useState([]);
  const historyRef = useRef([]);
  const currentStrokeRef = useRef(null);

  // -------- Helpers --------
  const clearCanvas = useCallback((ctx, canvas) => {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = CANVAS_BG;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }, []);

  // Shape recognition
  const recognizeShape = (points) => {
    if (points.length < 5) return null;

    // Line detection
    const dx = points[points.length - 1].x - points[0].x;
    const dy = points[points.length - 1].y - points[0].y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const pathLength = points.reduce((acc, p, i) => {
      if (i === 0) return 0;
      const dx = p.x - points[i - 1].x;
      const dy = p.y - points[i - 1].y;
      return acc + Math.sqrt(dx * dx + dy * dy);
    }, 0);

    if (Math.abs(pathLength - distance) / distance < 0.1) return "line";

    // Circle detection (rough)
    const centerX = points.reduce((sum, p) => sum + p.x, 0) / points.length;
    const centerY = points.reduce((sum, p) => sum + p.y, 0) / points.length;
    const radiusAvg =
      points.reduce(
        (sum, p) =>
          sum + Math.sqrt((p.x - centerX) ** 2 + (p.y - centerY) ** 2),
        0
      ) / points.length;
    const variance =
      points.reduce(
        (sum, p) =>
          sum +
          Math.abs(
            Math.sqrt((p.x - centerX) ** 2 + (p.y - centerY) ** 2) - radiusAvg
          ),
        0
      ) / points.length;
    if (variance < 5) return "circle";

    return null;
  };

  const drawStroke = useCallback(
    (ctx, stroke) => {
      if (!stroke || stroke.points.length < 2) return;
      ctx.save();
      ctx.scale(zoom, zoom);
      ctx.translate(offset.x / zoom, offset.y / zoom);

      if (stroke.tool === "eraser") {
        ctx.globalCompositeOperation = "destination-out";
        ctx.strokeStyle = "rgba(0,0,0,1)";
      } else {
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = stroke.color;
      }
      ctx.lineWidth = stroke.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // Draw recognized shape
      if (stroke.shape === "line") {
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        ctx.lineTo(
          stroke.points[stroke.points.length - 1].x,
          stroke.points[stroke.points.length - 1].y
        );
        ctx.stroke();
        ctx.restore();
        return;
      }

      if (stroke.shape === "circle") {
        const centerX =
          stroke.points.reduce((sum, p) => sum + p.x, 0) / stroke.points.length;
        const centerY =
          stroke.points.reduce((sum, p) => sum + p.y, 0) / stroke.points.length;
        const radius =
          stroke.points.reduce(
            (sum, p) =>
              sum + Math.sqrt((p.x - centerX) ** 2 + (p.y - centerY) ** 2),
            0
          ) / stroke.points.length;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        return;
      }

      // Freehand drawing
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length - 1; i++) {
        const midX = (stroke.points[i].x + stroke.points[i + 1].x) / 2;
        const midY = (stroke.points[i].y + stroke.points[i + 1].y) / 2;
        ctx.quadraticCurveTo(
          stroke.points[i].x,
          stroke.points[i].y,
          midX,
          midY
        );
      }
      ctx.lineTo(
        stroke.points[stroke.points.length - 1].x,
        stroke.points[stroke.points.length - 1].y
      );
      ctx.stroke();
      ctx.restore();
    },
    [zoom, offset]
  );

  const redrawAll = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;

    clearCanvas(ctx, canvas);
    historyRef.current.forEach((s) => drawStroke(ctx, s));
  }, [clearCanvas, drawStroke]);

  // -------- Socket Setup --------
  useEffect(() => {
    const s = io("https://luxoft-board-collab-gmit.onrender.com", {
      transports: ["websocket"],
    });
    setSocket(s);
    return () => s.disconnect();
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.once("load-board", (boardStrokes) => {
      setStrokes(boardStrokes || []);
      historyRef.current = boardStrokes || [];
      redrawAll();
    });
    socket.emit("get-board", roomId);

    socket.on("receive-stroke", (stroke) => {
      historyRef.current = [...historyRef.current, stroke];
      setStrokes((prev) => [...prev, stroke]);
      drawStroke(ctxRef.current, stroke);
    });

    socket.on("apply-undo", (strokeId) => {
      historyRef.current = historyRef.current.filter((s) => s.id !== strokeId);
      setStrokes((prev) => prev.filter((s) => s.id !== strokeId));
      redrawAll();
    });

    socket.on("clear-board", () => {
      historyRef.current = [];
      setStrokes([]);
      redrawAll();
      toast("Board cleared");
    });

    return () => {
      socket.off("receive-stroke");
      socket.off("apply-undo");
      socket.off("clear-board");
    };
  }, [socket, roomId, redrawAll, drawStroke]);

  // -------- Canvas Setup --------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctxRef.current = ctx;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    clearCanvas(ctx, canvas);

    const onResize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      redrawAll();
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [clearCanvas, redrawAll]);

  const getRelativePos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left - offset.x) / zoom,
      y: (clientY - rect.top - offset.y) / zoom,
    };
  };

  // -------- Events --------
  const handlePointerDown = (e) => {
    if (tool === "pan") {
      isPanning.current = true;
      lastPan.current = { x: e.clientX, y: e.clientY };
      return;
    }
    setIsDrawing(true);
    const p = getRelativePos(e);
    const stroke = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      points: [p],
      color,
      width,
      tool,
      ts: Date.now(),
    };
    currentStrokeRef.current = stroke;
  };

  const handlePointerMove = (e) => {
    if (tool === "pan" && isPanning.current) {
      const dx = e.clientX - lastPan.current.x;
      const dy = e.clientY - lastPan.current.y;
      setOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      lastPan.current = { x: e.clientX, y: e.clientY };
      redrawAll();
      return;
    }
    if (!isDrawing || !currentStrokeRef.current) return;

    const p = getRelativePos(e);
    currentStrokeRef.current.points.push(p);

    const ctx = ctxRef.current;
    clearCanvas(ctx, canvasRef.current);
    historyRef.current.forEach((s) => drawStroke(ctx, s));
    drawStroke(ctx, currentStrokeRef.current);
  };

  const handlePointerUp = () => {
    if (tool === "pan") {
      isPanning.current = false;
      return;
    }
    if (!isDrawing || !currentStrokeRef.current) return;
    setIsDrawing(false);

    let stroke = currentStrokeRef.current;
    currentStrokeRef.current = null;

    // Apply shape recognition
    const shape = recognizeShape(stroke.points);
    if (shape) {
      stroke.shape = shape;
      toast(`${shape.charAt(0).toUpperCase() + shape.slice(1)} recognized!`);
      if (shape === "line") {
        stroke.points = [
          stroke.points[0],
          stroke.points[stroke.points.length - 1],
        ];
      }
    }

    historyRef.current = [...historyRef.current, stroke];
    setStrokes((prev) => [...prev, stroke]);
    if (socket) socket.emit("send-stroke", stroke);
    redrawAll();
  };

  // -------- Toolbar Actions --------
  const handleUndo = () => {
    const last = historyRef.current[historyRef.current.length - 1];
    if (!last) return toast.error("Nothing to undo");
    historyRef.current = historyRef.current.slice(0, -1);
    setStrokes((prev) => prev.slice(0, -1));
    if (socket) socket.emit("undo-stroke", last.id);
    redrawAll();
    toast.success("Undo successful");
  };

  const handleClear = () => {
    historyRef.current = [];
    setStrokes([]);
    redrawAll();
    toast.success("Board cleared");
    if (socket) socket.emit("clear-board", roomId);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    const link = document.createElement("a");
    link.download = `whiteboard-${roomId}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    toast.success("Board downloaded");
  };

  return (
    <div className="flex-1 relative h-full overflow-auto bg-gray-900">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-20 blur-sm"
        style={{ backgroundImage: "url('/public/board.png')" }}
      ></div>

      <div className="relative z-10 p-6 sm:p-10 w-full max-w-7xl mx-auto">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-6 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 text-center sm:text-left">
            Luxoft Whiteboard
          </h1>

          {/* Tools */}
          <div className="flex flex-col sm:flex-wrap sm:flex-row items-center gap-3 mb-4 justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-gray-600 text-sm font-medium">Tools:</span>
              <button
                onClick={() => setTool("pen")}
                className={`p-2 border rounded-md shadow-sm hover:shadow-md transition-all ${
                  tool === "pen"
                    ? "bg-gradient-to-b from-blue-200 to-blue-100 border-blue-300"
                    : "bg-white border-gray-200"
                }`}
                title="Pen"
              >
                <Pen size={18} />
              </button>
              <button
                onClick={() => setTool("eraser")}
                className={`p-2 border rounded-md shadow-sm hover:shadow-md transition-all ${
                  tool === "eraser"
                    ? "bg-gradient-to-b from-red-200 to-red-100 border-red-300"
                    : "bg-white border-gray-200"
                }`}
                title="Eraser"
              >
                <Eraser size={18} />
              </button>
              <button
                onClick={() => setTool("pan")}
                className={`p-2 border rounded-md shadow-sm hover:shadow-md transition-all ${
                  tool === "pan"
                    ? "bg-gradient-to-b from-green-200 to-green-100 border-green-300"
                    : "bg-white border-gray-200"
                }`}
                title="Pan / Move"
              >
                <Move size={18} />
              </button>
            </div>

            <div className="flex items-center gap-2 flex-wrap mt-2 sm:mt-0">
              <span className="text-gray-600 text-sm font-medium">Stroke:</span>
              <input
                type="color"
                className="w-8 h-8 border rounded-md cursor-pointer"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                disabled={tool === "eraser" || tool === "pan"}
              />
              <input
                type="range"
                min={1}
                max={24}
                value={width}
                onChange={(e) => setWidth(parseInt(e.target.value))}
                className="cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap mt-2 sm:mt-0">
              <span className="text-gray-600 text-sm font-medium">
                Actions:
              </span>
              <button
                onClick={handleUndo}
                className="p-2 border rounded-md shadow-sm hover:shadow-md bg-white border-gray-200 transition-all"
                title="Undo"
              >
                <Undo2 size={18} />
              </button>
              <button
                onClick={handleClear}
                className="p-2 border rounded-md shadow-sm hover:shadow-md bg-white border-gray-200 transition-all"
                title="Clear Board"
              >
                <Trash2 size={18} />
              </button>
              <button
                onClick={handleDownload}
                className="p-2 border rounded-md shadow-sm hover:shadow-md bg-gradient-to-b from-purple-400 to-purple-300 text-white transition-all"
                title="Download Board"
              >
                <Download size={18} />
              </button>
              <button
                onClick={() => setZoom((z) => Math.min(z + 0.2, 3))}
                className="p-2 border rounded-md shadow-sm hover:shadow-md bg-white border-gray-200 transition-all"
                title="Zoom In"
              >
                <ZoomIn size={18} />
              </button>
              <button
                onClick={() => setZoom((z) => Math.max(z - 0.2, 0.4))}
                className="p-2 border rounded-md shadow-sm hover:shadow-md bg-white border-gray-200 transition-all"
                title="Zoom Out"
              >
                <ZoomOut size={18} />
              </button>
            </div>
          </div>

          {/* Canvas */}
          <div className="border border-gray-200 rounded-xl overflow-hidden shadow-inner">
            <canvas
              ref={canvasRef}
              className="w-full h-[70vh] bg-white touch-none cursor-crosshair"
              onMouseDown={handlePointerDown}
              onMouseMove={handlePointerMove}
              onMouseUp={handlePointerUp}
              onMouseLeave={handlePointerUp}
              onTouchStart={handlePointerDown}
              onTouchMove={handlePointerMove}
              onTouchEnd={handlePointerUp}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Whiteboard;
