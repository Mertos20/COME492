import mongoose, { Schema, Document } from "mongoose";

export interface IChatMessage extends Document {
  userId: mongoose.Types.ObjectId;
  expertTier: "bronze" | "silver" | "gold";
  senderRole: "user" | "expert";
  senderName: string;
  message: string;
}

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    expertTier: { type: String, enum: ["bronze", "silver", "gold"], required: true },
    senderRole: { type: String, enum: ["user", "expert"], required: true },
    senderName: { type: String, required: true },
    message: { type: String, required: true, trim: true }
  },
  { timestamps: true }
);

export default mongoose.models.ChatMessage || mongoose.model<IChatMessage>("ChatMessage", ChatMessageSchema);
