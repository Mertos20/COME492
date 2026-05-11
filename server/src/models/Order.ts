import mongoose, { Document, Schema } from "mongoose";

export interface IOrder extends Document {
  userId: mongoose.Types.ObjectId;
  symbol: string;
  type: "market" | "limit" | "stop";
  side: "buy" | "sell";
  quantity: number;
  targetPrice?: number;
  status: "pending" | "executed" | "cancelled";
  createdAt: Date;
}

const OrderSchema = new Schema<IOrder>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  symbol: { type: String, required: true },
  type: { type: String, enum: ["market", "limit", "stop"], required: true },
  side: { type: String, enum: ["buy", "sell"], required: true },
  quantity: { type: Number, required: true, min: 0 },
  targetPrice: { type: Number },
  status: { type: String, enum: ["pending", "executed", "cancelled"], default: "pending" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);
