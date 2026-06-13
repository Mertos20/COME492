import bcrypt from "bcryptjs";
import User from "../models/User";

const experts = [
  { fullName: "Bronze Uzman", email: "bronze@portfol.io", tier: "bronze" as const },
  { fullName: "Silver Uzman", email: "silver@portfol.io", tier: "silver" as const },
  { fullName: "Gold Uzman", email: "gold@portfol.io", tier: "gold" as const }
];

export const seedExperts = async (): Promise<void> => {
  // Seed Experts
  for (const expert of experts) {
    const existing = await User.findOne({ email: expert.email });
    if (existing) {
      continue;
    }

    const password = await bcrypt.hash("expert123", 10);

    await User.create({
      fullName: expert.fullName,
      email: expert.email,
      passwordHash: password,
      role: "expert",
      expertTier: expert.tier,
      membership: expert.tier,
      balance: 0,
      holdings: []
    });
  }

  // Seed Admin User
  const adminEmail = "admin@portfol.io";
  const existingAdmin = await User.findOne({ email: adminEmail });
  if (!existingAdmin) {
    const adminPasswordHash = await bcrypt.hash("admin123", 10);
    await User.create({
      fullName: "System Admin",
      username: "admin",
      email: adminEmail,
      passwordHash: adminPasswordHash,
      role: "user",
      isAdmin: true,
      membership: "free",
      balance: 1000000,
      holdings: []
    });
    console.log(`[Seed] Admin user created: ${adminEmail} with password admin123`);
  }
};
