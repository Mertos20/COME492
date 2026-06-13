import express from 'express';
import { requireAuth } from '../middleware/auth';
import { admin } from '../middleware/admin';
import User from '../models/User';
import Transaction from '../models/Transaction';

const router = express.Router();

// @route   GET api/admin/stats
// @desc    Get system-wide stats and recent transactions
// @access  Admin
router.get('/stats', requireAuth, admin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const users = await User.find().select('balance role membership');
    const totalBalance = users.reduce((acc, u) => acc + (u.balance || 0), 0);
    const expertCount = users.filter(u => u.role === 'expert').length;
    
    // Counts by membership
    const membershipDistribution = {
      free: users.filter(u => u.membership === 'free').length,
      bronze: users.filter(u => u.membership === 'bronze').length,
      silver: users.filter(u => u.membership === 'silver').length,
      gold: users.filter(u => u.membership === 'gold').length,
    };

    const totalTransactions = await Transaction.countDocuments();
    
    // Calculate total system transaction volume using aggregation
    const volumeResult = await Transaction.aggregate([
      { $group: { _id: null, totalVolume: { $sum: "$total" } } }
    ]);
    const totalVolume = volumeResult.length > 0 ? volumeResult[0].totalVolume : 0;

    // Get 15 recent transactions populated with user info
    const recentTransactions = await Transaction.find()
      .sort({ createdAt: -1 })
      .limit(15)
      .populate('userId', 'fullName email username');

    res.json({
      totalUsers,
      totalBalance,
      expertCount,
      membershipDistribution,
      totalTransactions,
      totalVolume,
      recentTransactions
    });
  } catch (err: any) {
    console.error('Error fetching admin stats:', err);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/admin/users
// @desc    Get all users
// @access  Admin
router.get('/users', requireAuth, admin, async (req, res) => {
  try {
    const users = await User.find().select('-passwordHash');
    res.json(users);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/admin/users/:id
// @desc    Update a user generic fields
// @access  Admin
router.put('/users/:id', requireAuth, admin, async (req, res) => {
  try {
    const { role, membership, expertTier } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    if (role !== undefined) user.role = role;
    if (membership !== undefined) user.membership = membership;
    
    if (role === 'expert') {
      // If role becomes expert, ensure expertTier is set
      user.expertTier = expertTier || 'bronze';
    } else {
      user.expertTier = undefined;
    }

    await user.save();
    
    const updatedUser = user.toObject();
    delete updatedUser.passwordHash;
    
    res.json(updatedUser);
  } catch (err: any) {
    console.error('Error updating user:', err);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/admin/users/:id/balance
// @desc    Update user balance (kept for backward compatibility)
// @access  Admin
router.put('/users/:id/balance', requireAuth, admin, async (req, res) => {
  return res.status(403).json({ msg: 'Bakiyeye müdahale yetkisi kaldırılmıştır.' });
});

// @route   DELETE api/admin/users/:id
// @desc    Delete a user
// @access  Admin
router.delete('/users/:id', requireAuth, admin, async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.json({ msg: 'User removed' });
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/admin/users/:id/freeze
// @desc    Toggle user freeze status
// @access  Admin
router.put('/users/:id/freeze', requireAuth, admin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        user.isFrozen = !user.isFrozen;
        await user.save();
        res.json({ msg: `User ${user.isFrozen ? 'frozen' : 'unfrozen'}`, isFrozen: user.isFrozen });
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


export default router;
