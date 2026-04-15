import mongoose, { Schema, Document } from "mongoose";

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  symbol: string;
  type: "buy" | "sell" | "deposit" | "upgrade";
  quantity: number;
  price: number;
  total: number;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    symbol: { type: String, required: true },
    type: { type: String, enum: ["buy", "sell", "deposit", "upgrade"], required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    total: { type: Number, required: true }
  },
  { timestamps: true }
);

export default mongoose.models.Transaction || mongoose.model<ITransaction>("Transaction", TransactionSchema);
