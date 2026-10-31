// Creates a bus owner account. The app's sign-up screen only creates parents,
// so owners are added here:
//
//   node scripts/createOwner.js --first Ramesh --last Patil \
//     --email ramesh@example.com --mobile 9876543210 --password secret123
//
// If the email already belongs to an account, that account is promoted to owner
// (its password is left unchanged).
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const User = require('../models/User');

const args = process.argv.slice(2).reduce((acc, arg, i, all) => {
  if (arg.startsWith('--')) acc[arg.slice(2)] = all[i + 1];
  return acc;
}, {});

const required = ['first', 'last', 'email', 'mobile', 'password'];
const missing = required.filter((key) => !args[key]);

async function main() {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/school-bus-tracker';
  await mongoose.connect(MONGODB_URI);

  const existing = args.email && await User.findOne({ email: args.email.toLowerCase() });
  if (existing) {
    existing.role = 'owner';
    await existing.save();
    console.log(`✅ ${existing.email} is now an owner`);
    return;
  }

  if (missing.length) {
    console.error(`Missing: ${missing.map((m) => `--${m}`).join(' ')}`);
    process.exitCode = 1;
    return;
  }

  const user = await User.create({
    firstName: args.first,
    lastName: args.last,
    email: args.email.toLowerCase(),
    mobileNumber: args.mobile,
    password: args.password,
    role: 'owner'
  });
  console.log(`✅ Created owner ${user.email} (${user._id})`);
}

main()
  .catch((error) => {
    console.error('❌ Failed to create owner:', error.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
