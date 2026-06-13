import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/portfolio';

async function fixDb() {
  try {
    await mongoose.connect(uri);
    console.log('Connected to DB');
    
    const db = mongoose.connection.db;
    if (!db) {
      console.log('No db object');
      return;
    }
    const users = db.collection('users');
    
    // Find users with invalid roles
    const invalidUsers = await users.find({ role: { $nin: ['user', 'expert'] } }).toArray();
    console.log(`Found ${invalidUsers.length} users with invalid roles.`);
    
    let updated = 0;
    for (const user of invalidUsers) {
      let newMembership = user.membership;
      if (['free', 'bronze', 'silver', 'gold'].includes(user.role)) {
        if (user.membership === 'free' || !user.membership) {
          newMembership = user.role;
        }
      }
      
      await users.updateOne(
        { _id: user._id },
        { $set: { role: 'user', membership: newMembership || 'free' } }
      );
      updated++;
    }
    
    console.log(`Successfully fixed ${updated} users.`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixDb();
