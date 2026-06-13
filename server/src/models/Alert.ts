import mongoose, { Schema, Document } from "mongoose";

export interface IAlert extends Document {
  userId: mongoose.Types.ObjectId;
  symbol: string;
  targetPrice: number;
  condition: "above" | "below";
  isTriggered: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AlertSchema = new Schema<IAlert>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    symbol: { type: String, required: true },
    targetPrice: { type: Number, required: true },
    condition: { type: String, enum: ["above", "below"], required: true },
    isTriggered: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.models.Alert || mongoose.model<IAlert>("Alert", AlertSchema);
