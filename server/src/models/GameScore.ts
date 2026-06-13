import mongoose, { Document } from "mongoose";

export interface IGameScore extends Document {
  userId: mongoose.Types.ObjectId;
  score: number;
  updatedAt: Date;
}

const GameScoreSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  score: { type: Number, required: true, default: 0 },
}, { timestamps: true });

export default mongoose.model<IGameScore>("GameScore", GameScoreSchema);