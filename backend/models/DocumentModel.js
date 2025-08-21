import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true }, // use _id for custom doc id
    data: { type: Object, required: true }, // Quill delta format
  },
  { timestamps: true }
);

const DocumentModel =
  mongoose.models.Document || mongoose.model("Document", documentSchema);

export default DocumentModel;
