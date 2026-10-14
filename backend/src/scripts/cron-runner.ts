import * as mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb+srv://fanqie:fanqie123@cluster0.f8acy45.mongodb.net/wormup';

interface IncomeTransactionDoc {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  amount: number;
  availableFrom: Date;
  status: string;
}

const IncomeTransactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, required: true },
    amount: { type: Number, required: true },
    availableFrom: { type: Date, required: true },
    status: { type: String, default: 'PENDING', index: true },
    isUsable: { type: Boolean, default: false },
  },
  { collection: 'income_transactions', timestamps: true },
);

const UserSchema = new mongoose.Schema(
  {
    name: String,
    phone: String,
    email: String,
    pendingIncome: { type: Number, default: 0 },
    availableIncome: { type: Number, default: 0 },
    shoppingCoins: { type: Number, default: 2000 },
    walletBalance: { type: Number, default: 0 },
    lastMonthlyCoinCredit: { type: Date },
    isActive: { type: Boolean, default: true },
  },
  { collection: 'users', timestamps: true },
);

const CoinTransactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true },
    type: { type: String, required: true },
    description: { type: String, default: '' },
    balanceAfter: { type: Number, required: true },
  },
  { collection: 'coin_transactions', timestamps: true },
);

const IncomeTransaction = mongoose.model('IncomeTransactionCron', IncomeTransactionSchema);
const User = mongoose.model('UserCron', UserSchema);
const CoinTransaction = mongoose.model('CoinTransactionCron', CoinTransactionSchema);

/**
 * CRON 1: Daily Midnight Income Rollover
 * Rule: Only moves records where status == 'PENDING' AND availableFrom <= currentTime
 */
export async function runDailyIncomeRollover() {
  console.log('----------------------------------------------------');
  console.log('⏰ Starting Daily Midnight Income Rollover Cron Job...');
  const now = new Date();
  console.log(`Current Time: ${now.toISOString()}`);

  const pendingTxs = (await IncomeTransaction.find({
    status: 'PENDING',
    availableFrom: { $lte: now },
  }).lean()) as unknown as IncomeTransactionDoc[];

  console.log(`Found ${pendingTxs.length} pending transactions whose 24-hr lock period is complete.`);

  if (pendingTxs.length === 0) {
    console.log('✅ No transactions to rollover today.');
    return { rolledOverCount: 0, totalAmount: 0 };
  }

  // Group by user
  const userMap: { [userId: string]: { total: number; txIds: mongoose.Types.ObjectId[] } } = {};
  for (const tx of pendingTxs) {
    const uId = tx.userId.toString();
    if (!userMap[uId]) {
      userMap[uId] = { total: 0, txIds: [] };
    }
    userMap[uId].total += tx.amount || 0;
    userMap[uId].txIds.push(tx._id);
  }

  let totalRolledOver = 0;
  let userCount = 0;

  for (const [userId, data] of Object.entries(userMap)) {
    await User.findByIdAndUpdate(userId, {
      $inc: {
        pendingIncome: -data.total,
        availableIncome: data.total,
      },
    });

    await IncomeTransaction.updateMany(
      { _id: { $in: data.txIds } },
      { $set: { status: 'AVAILABLE', isUsable: true } },
    );

    totalRolledOver += data.total;
    userCount++;
    console.log(`  User ${userId}: Rolled over ₹${data.total} (${data.txIds.length} txs)`);
  }

  console.log(`✅ Daily Income Rollover Complete: ₹${totalRolledOver} moved to availableIncome across ${userCount} users.`);
  return { rolledOverCount: pendingTxs.length, totalAmount: totalRolledOver, userCount };
}

/**
 * CRON 2: Monthly 1st Shopping Coins Allocation
 * Rule: Credits ₹2,000 Shopping Coins to eligible users on 1st of each month.
 * Uses idempotency check: User.lastMonthlyCoinCredit in current month is skipped.
 * Strictly adds to shoppingCoins, NEVER to income or wallet balance.
 */
export async function runMonthlyShoppingCoins() {
  console.log('----------------------------------------------------');
  console.log('🪙 Starting Monthly 1st Shopping Coins Allocation Cron Job...');
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  console.log(`Target Month: ${currentMonth + 1}/${currentYear}`);

  const users = await User.find({ isActive: true });
  console.log(`Checking ${users.length} active users for monthly ₹2,000 Shopping Coins...`);

  let creditedCount = 0;
  let skippedCount = 0;

  for (const user of users) {
    if (user.lastMonthlyCoinCredit) {
      const lastCreditDate = new Date(user.lastMonthlyCoinCredit);
      if (
        lastCreditDate.getFullYear() === currentYear &&
        lastCreditDate.getMonth() === currentMonth
      ) {
        skippedCount++;
        continue; // Already credited for this month (Idempotency)
      }
    }

    const previousCoins = user.shoppingCoins || 0;
    const newCoins = previousCoins + 2000;

    user.shoppingCoins = newCoins;
    user.lastMonthlyCoinCredit = now;
    await user.save();

    await CoinTransaction.create({
      userId: user._id,
      amount: 2000,
      type: 'MONTHLY_ALLOCATION',
      description: `Monthly ₹2,000 Shopping Coins credit for ${now.toLocaleString('default', { month: 'long', year: 'numeric' })}`,
      balanceAfter: newCoins,
    });

    creditedCount++;
    console.log(`  User ${user._id} (${user.name || user.phone}): Credited ₹2,000 Shopping Coins (New Balance: ${newCoins})`);
  }

  console.log(`✅ Monthly Shopping Coins Complete: ${creditedCount} users credited, ${skippedCount} users skipped (idempotent).`);
  return { creditedCount, skippedCount };
}

async function main() {
  const arg = process.argv[2] || 'daily';
  console.log(`Connecting to MongoDB at: ${MONGODB_URI.replace(/:([^:@]+)@/, ':****@')}`);
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB.');

  try {
    if (arg === 'daily' || arg === 'all') {
      await runDailyIncomeRollover();
    }
    if (arg === 'monthly' || arg === 'all') {
      await runMonthlyShoppingCoins();
    }
  } catch (err) {
    console.error('❌ Error executing cron job:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB. Done.');
  }
}

if (require.main === module) {
  main();
}
