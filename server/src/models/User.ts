import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

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
  passwordHash: string;
  membership: MembershipTier;
  role: UserRole;
  expertTier?: Exclude<MembershipTier, "free">;
  balance: number;
  lockedBalance: number;
  holdings: IHolding[];
  lockedHoldings: IHolding[];
  watchlist: string[];
  resetPasswordCode?: string;
  resetPasswordExpires?: Date;
  username: string;
  isAdmin: boolean;
  aiQueriesToday: number;
  lastAiQueryDate: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
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
    passwordHash: { type: String, required: true },
    membership: {
      type: String,
      enum: ["free", "bronze", "silver", "gold"],
      default: "free"
    },
    role: { type: String, enum: ["user", "expert"], default: "user" },
    expertTier: { type: String, enum: ["bronze", "silver", "gold"], required: false },
    balance: { type: Number, default: 0 },
    lockedBalance: { type: Number, default: 0 },
    holdings: { type: [HoldingSchema], default: [] },
    lockedHoldings: { type: [HoldingSchema], default: [] },
    watchlist: { type: [String], default: [] },
    resetPasswordCode: { type: String },
    resetPasswordExpires: { type: Date },
    username: { type: String },
    isAdmin: { type: Boolean, default: false },
    aiQueriesToday: { type: Number, default: 0 },
    lastAiQueryDate: { type: String, default: "" },
  },
  { timestamps: true }
);

// Method to compare passwords
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

UserSchema.pre("validate", function () {
  if (this.role !== "user" && this.role !== "expert") {
    if (["free", "bronze", "silver", "gold"].includes(this.role as any)) {
      if (this.membership === "free") {
        this.membership = this.role as any;
      }
    }
    this.role = "user";
  }
});

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
