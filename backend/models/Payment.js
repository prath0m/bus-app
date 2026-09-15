const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: [true, 'Student is required']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  year: {
    type: Number,
    required: true
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  amountDue: {
    type: Number,
    required: true,
    min: 0
  },
  amountPaid: {
    type: Number,
    default: 0,
    min: 0
  },
  dueDate: {
    type: Date,
    required: true
  },
  paidDate: {
    type: Date
  },
  paymentMode: {
    type: String,
    enum: ['Cash', 'Online'],
  },
  notes: {
    type: String,
    trim: true,
    maxLength: 300
  }
}, {
  timestamps: true
});

paymentSchema.index({ studentId: 1, year: 1, month: 1 }, { unique: true });
paymentSchema.index({ userId: 1, year: 1, month: 1 });

const DUE_DAY_OF_MONTH = 5;

// Instance helper: status is derived, never persisted, so it's always accurate.
// A payment stays "Due" through its entire due day and only flips to
// "Overdue" starting the next day.
paymentSchema.methods.getStatus = function () {
  if (this.amountPaid >= this.amountDue) return 'Paid';
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  if (this.dueDate < startOfToday) return 'Overdue';
  return 'Due';
};

paymentSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

// Ensures a monthly ledger row exists for every month from the student's
// join date through the target year/month (inclusive). Lazily backfills
// history instead of requiring a cron job.
paymentSchema.statics.ensureMonthsForStudent = async function (student, targetYear, targetMonth) {
  const Payment = this;

  const joinDate = new Date(student.dateOfJoining);
  let year = joinDate.getFullYear();
  let month = joinDate.getMonth() + 1;

  const monthsToEnsure = [];
  while (year < targetYear || (year === targetYear && month <= targetMonth)) {
    monthsToEnsure.push({ year, month });
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }

  if (monthsToEnsure.length === 0) return;

  const existing = await Payment.find({
    studentId: student._id,
    $or: monthsToEnsure.map(({ year, month }) => ({ year, month }))
  }).select('year month');

  const existingKeys = new Set(existing.map((p) => `${p.year}-${p.month}`));
  const amountDue = student.getPaymentAmount();

  const toCreate = monthsToEnsure
    .filter(({ year, month }) => !existingKeys.has(`${year}-${month}`))
    .map(({ year, month }) => ({
      studentId: student._id,
      userId: student.userId,
      year,
      month,
      amountDue,
      dueDate: new Date(year, month - 1, DUE_DAY_OF_MONTH)
    }));

  if (toCreate.length > 0) {
    try {
      await Payment.insertMany(toCreate, { ordered: false });
    } catch (error) {
      // Ignore duplicate-key races (unique index already guards correctness)
      if (!error.message || !error.message.includes('E11000')) {
        throw error;
      }
    }
  }
};

paymentSchema.statics.DUE_DAY_OF_MONTH = DUE_DAY_OF_MONTH;

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
