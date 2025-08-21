import mongoose from "mongoose";

/**
 * We store the whiteboard as an array of strokes.
 * Each stroke is compact and re-playable.
 */
const pointSchema = new mongoose.Schema(
  {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
  },
  { _id: false }
);

const strokeSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    points: { type: [pointSchema], required: true },
    color: { type: String, default: "#000000" },
    width: { type: Number, default: 4 },
    tool: { type: String, enum: ["pen", "eraser"], default: "pen" },
    ts: { type: Number, default: () => Date.now() },
  },
  { _id: false }
);

const whiteboardSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true }, // roomId
    strokes: { type: [strokeSchema], default: [] },
  },
  { timestamps: true }
);

const WhiteboardModel =
  mongoose.models.Whiteboard || mongoose.model("Whiteboard", whiteboardSchema);

export default WhiteboardModel;
