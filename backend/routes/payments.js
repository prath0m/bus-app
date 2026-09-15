const express = require('express');
const Payment = require('../models/Payment');
const Student = require('../models/Student');
const User = require('../models/User');
const router = express.Router();

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const serializePayment = (payment, student) => ({
  id: payment._id,
  studentId: payment.studentId,
  student: student ? {
    id: student._id,
    name: student.name,
    contactNumber: student.contactNumber,
    school: student.schoolId ? {
      id: student.schoolId._id,
      schoolName: student.schoolId.schoolName
    } : undefined
  } : undefined,
  year: payment.year,
  month: payment.month,
  monthName: monthNames[payment.month - 1],
  amountDue: payment.amountDue,
  amountPaid: payment.amountPaid,
  status: payment.getStatus(),
  dueDate: payment.dueDate,
  paidDate: payment.paidDate,
  paymentMode: payment.paymentMode,
  notes: payment.notes,
  createdAt: payment.createdAt,
  updatedAt: payment.updatedAt
});

// GET the most recently paid payments across all of the owner's students
// (for a "recent activity" feed) — sorted by when they were actually paid
router.get('/recent/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = Math.min(parseInt(req.query.limit, 10) || 5, 20);

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const payments = await Payment.find({ userId, amountPaid: { $gt: 0 } })
      .sort({ paidDate: -1 })
      .limit(limit);

    const studentIds = payments.map((p) => p.studentId);
    const students = await Student.find({ _id: { $in: studentIds } }).populate('schoolId', 'schoolName');
    const studentById = new Map(students.map((s) => [String(s._id), s]));

    res.json({
      success: true,
      message: 'Recent payments fetched successfully',
      data: {
        payments: payments.map((p) => serializePayment(p, studentById.get(String(p.studentId))))
      }
    });
  } catch (error) {
    console.error('Error fetching recent payments:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch recent payments'
    });
  }
});

// GET dashboard summary for a given month (defaults to current month)
router.get('/dashboard/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const now = new Date();
    const year = parseInt(req.query.year, 10) || now.getFullYear();
    const month = parseInt(req.query.month, 10) || (now.getMonth() + 1);

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const students = await Student.find({ userId, isActive: true })
      .populate('schoolId', 'schoolName');

    for (const student of students) {
      await Payment.ensureMonthsForStudent(student, year, month);
    }

    const studentIds = students.map((s) => s._id);
    const payments = await Payment.find({ studentId: { $in: studentIds }, year, month });
    const paymentByStudentId = new Map(payments.map((p) => [String(p.studentId), p]));

    const rows = students
      .filter((student) => paymentByStudentId.has(String(student._id)))
      .map((student) => serializePayment(paymentByStudentId.get(String(student._id)), student));

    const summary = rows.reduce((acc, row) => {
      acc.totalCollected += row.amountPaid;
      acc.totalPending += Math.max(0, row.amountDue - row.amountPaid);
      if (row.status === 'Paid') acc.paidCount += 1;
      else if (row.status === 'Overdue') acc.overdueCount += 1;
      else acc.dueCount += 1;
      return acc;
    }, { paidCount: 0, dueCount: 0, overdueCount: 0, totalCollected: 0, totalPending: 0 });

    res.json({
      success: true,
      message: 'Dashboard fetched successfully',
      data: {
        year,
        month,
        monthName: monthNames[month - 1],
        totalStudents: rows.length,
        ...summary,
        students: rows
      }
    });
  } catch (error) {
    console.error('Error fetching payment dashboard:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch payment dashboard'
    });
  }
});

// GET full monthly ledger for one student
router.get('/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findById(studentId).populate('schoolId', 'schoolName');
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const now = new Date();
    await Payment.ensureMonthsForStudent(student, now.getFullYear(), now.getMonth() + 1);

    const payments = await Payment.find({ studentId }).sort({ year: -1, month: -1 });

    res.json({
      success: true,
      message: 'Payment history fetched successfully',
      data: {
        count: payments.length,
        payments: payments.map((p) => serializePayment(p, student))
      }
    });
  } catch (error) {
    console.error('Error fetching student payment history:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch payment history'
    });
  }
});

// PUT mark a single payment as paid (defaults to fully paid today)
router.put('/:paymentId/mark-paid', async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { amountPaid, paymentMode, paidDate } = req.body;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ error: 'Payment record not found' });
    }

    payment.amountPaid = typeof amountPaid === 'number' ? amountPaid : payment.amountDue;
    payment.paymentMode = paymentMode || payment.paymentMode || 'Cash';
    payment.paidDate = paidDate ? new Date(paidDate) : new Date();

    const saved = await payment.save();
    const student = await Student.findById(saved.studentId).populate('schoolId', 'schoolName');

    res.json({
      success: true,
      message: 'Payment marked as paid',
      data: { payment: serializePayment(saved, student) }
    });
  } catch (error) {
    console.error('Error marking payment as paid:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation failed',
        details: Object.values(error.errors).map((err) => err.message)
      });
    }
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to mark payment as paid'
    });
  }
});

// POST mark several payments as paid at once (advance / lump-sum payments)
router.post('/bulk-mark-paid', async (req, res) => {
  try {
    const { paymentIds, paymentMode, paidDate } = req.body;

    if (!Array.isArray(paymentIds) || paymentIds.length === 0) {
      return res.status(400).json({ error: 'paymentIds must be a non-empty array' });
    }

    const payments = await Payment.find({ _id: { $in: paymentIds } });
    const effectivePaidDate = paidDate ? new Date(paidDate) : new Date();

    for (const payment of payments) {
      payment.amountPaid = payment.amountDue;
      payment.paymentMode = paymentMode || payment.paymentMode || 'Cash';
      payment.paidDate = effectivePaidDate;
      await payment.save();
    }

    res.json({
      success: true,
      message: `${payments.length} payment(s) marked as paid`,
      data: { updatedCount: payments.length }
    });
  } catch (error) {
    console.error('Error bulk marking payments as paid:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to bulk mark payments as paid'
    });
  }
});

// POST create (or update) a run of monthly payment rows for a student, splitting
// one total amount evenly across them — for enrolling mid-year, a school that
// opens in a different month each year, or a student only paying for part of
// the year. Any month that already has a row just gets its amount updated.
router.post('/create-term', async (req, res) => {
  try {
    const { studentId, startYear, startMonth, durationMonths, totalAmount } = req.body;

    if (!studentId || !startYear || !startMonth || !durationMonths || !totalAmount) {
      return res.status(400).json({
        error: 'studentId, startYear, startMonth, durationMonths and totalAmount are required'
      });
    }
    if (durationMonths < 1 || durationMonths > 36) {
      return res.status(400).json({ error: 'durationMonths must be between 1 and 36' });
    }

    const student = await Student.findById(studentId).populate('schoolId', 'schoolName');
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const perMonth = Math.floor(totalAmount / durationMonths);
    const remainder = totalAmount - perMonth * durationMonths;

    let year = startYear;
    let month = startMonth;
    const payments = [];

    for (let i = 0; i < durationMonths; i++) {
      const amountDue = perMonth + (i === durationMonths - 1 ? remainder : 0);
      const dueDate = new Date(year, month - 1, Payment.DUE_DAY_OF_MONTH);

      const payment = await Payment.findOneAndUpdate(
        { studentId, year, month },
        {
          $set: { amountDue },
          $setOnInsert: { studentId, userId: student.userId, dueDate }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      payments.push(payment);

      month += 1;
      if (month > 12) {
        month = 1;
        year += 1;
      }
    }

    res.status(201).json({
      success: true,
      message: `Payment term created for ${durationMonths} month(s)`,
      data: {
        count: payments.length,
        payments: payments.map((p) => serializePayment(p, student))
      }
    });
  } catch (error) {
    console.error('Error creating payment term:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation failed',
        details: Object.values(error.errors).map((err) => err.message)
      });
    }
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create payment term'
    });
  }
});

// PUT generic edit (adjust amount due / notes)
router.put('/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { amountDue, notes } = req.body;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ error: 'Payment record not found' });
    }

    if (typeof amountDue === 'number') payment.amountDue = amountDue;
    if (typeof notes === 'string') payment.notes = notes;

    const saved = await payment.save();
    const student = await Student.findById(saved.studentId).populate('schoolId', 'schoolName');

    res.json({
      success: true,
      message: 'Payment updated successfully',
      data: { payment: serializePayment(saved, student) }
    });
  } catch (error) {
    console.error('Error updating payment:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation failed',
        details: Object.values(error.errors).map((err) => err.message)
      });
    }
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update payment'
    });
  }
});

module.exports = router;
