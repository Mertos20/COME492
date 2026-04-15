import mongoose, { Schema, Document } from "mongoose";

export type MembershipTier = "free" | "bronze" | "silver" | "gold";
export type UserRole = "user" | "expert";

export interface IHolding {
  symbol: string;
  quantity: number;
  avgBuyPrice: number;
}

export interface IUser extends Document {
  fullName: string;
  email: string;
  password: string;
  membership: MembershipTier;
  role: UserRole;
  expertTier?: Exclude<MembershipTier, "free">;
  balance: number;
  holdings: IHolding[];
}

const HoldingSchema = new Schema<IHolding>(
  {
    symbol: { type: String, required: true },
    quantity: { type: Number, required: true, default: 0 },
    avgBuyPrice: { type: Number, required: true, default: 0 }
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    membership: {
      type: String,
      enum: ["free", "bronze", "silver", "gold"],
      default: "free"
    },
    role: { type: String, enum: ["user", "expert", "free"], default: "user" },
    expertTier: { type: String, enum: ["bronze", "silver", "gold"], required: false },
    balance: { type: Number, default: 0 },
      holdings: { type: [{
    symbol: String,
    quantity: Number,
    avgBuyPrice: Number
  }], default: [] },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
