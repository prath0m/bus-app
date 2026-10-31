const express = require('express');
const { body, validationResult } = require('express-validator');
const Student = require('../models/Student');
const Payment = require('../models/Payment');
const BusLocation = require('../models/BusLocation');
const { authenticate, requireRole, phoneMatchQuery } = require('../middleware/auth');
const { serializePayment } = require('./payments');

const router = express.Router();

router.use(authenticate, requireRole('parent'));

// A parent's children are the students whose contact number is the parent's
// mobile number — the owner already records that number when adding a student.
const findChildren = (parent) =>
  Student.find({ contactNumber: phoneMatchQuery(parent.mobileNumber), isActive: true })
    .populate('schoolId', 'schoolName schoolAddress timing shift')
    .populate('userId', 'firstName lastName mobileNumber')
    .sort({ name: 1 });

const serializeHome = (user) =>
  user.homeLocation && user.homeLocation.latitude != null
    ? {
        latitude: user.homeLocation.latitude,
        longitude: user.homeLocation.longitude,
        address: user.homeLocation.address,
        updatedAt: user.homeLocation.updatedAt
      }
    : null;

// GET children with their current-month fee status
router.get('/children', async (req, res) => {
  try {
    const students = await findChildren(req.user);
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const children = await Promise.all(students.map(async (student) => {
      await Payment.ensureMonthsForStudent(student, year, month);
      const current = await Payment.findOne({ studentId: student._id, year, month });
      const allPayments = await Payment.find({ studentId: student._id });
      const outstanding = allPayments.reduce(
        (sum, p) => sum + Math.max(0, p.amountDue - p.amountPaid), 0
      );

      return {
        id: student._id,
        name: student.name,
        dateOfJoining: student.dateOfJoining,
        paymentPeriod: student.paymentPeriod,
        paymentAmount: student.getPaymentAmount(),
        school: student.schoolId ? {
          id: student.schoolId._id,
          schoolName: student.schoolId.schoolName,
          schoolAddress: student.schoolId.schoolAddress,
          timing: student.schoolId.timing,
          shift: student.schoolId.shift
        } : null,
        owner: student.userId ? {
          id: student.userId._id,
          name: `${student.userId.firstName} ${student.userId.lastName}`,
          mobileNumber: student.userId.mobileNumber
        } : null,
        currentPayment: current ? serializePayment(current) : null,
        outstanding
      };
    }));

    res.json({
      success: true,
      message: 'Children fetched successfully',
      data: { children, homeLocation: serializeHome(req.user) }
    });
  } catch (error) {
    console.error('Error fetching parent children:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch children' });
  }
});

// GET full payment history for one of the parent's children
router.get('/children/:studentId/payments', async (req, res) => {
  try {
    const student = await Student.findOne({
      _id: req.params.studentId,
      contactNumber: phoneMatchQuery(req.user.mobileNumber)
    });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const payments = await Payment.find({ studentId: student._id }).sort({ year: -1, month: -1 });
    res.json({
      success: true,
      message: 'Payment history fetched successfully',
      data: { count: payments.length, payments: payments.map((p) => serializePayment(p)) }
    });
  } catch (error) {
    console.error('Error fetching child payments:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch payment history' });
  }
});

// GET live location of every bus that carries one of the parent's children
router.get('/bus-locations', async (req, res) => {
  try {
    const students = await findChildren(req.user);
    const owners = new Map();
    students.forEach((s) => {
      if (s.userId) owners.set(String(s.userId._id), s.userId);
    });

    const locations = await BusLocation.find({ ownerId: { $in: [...owners.keys()] } });
    const byOwner = new Map(locations.map((l) => [String(l.ownerId), l]));

    const buses = [...owners.values()].map((owner) => {
      const location = byOwner.get(String(owner._id));
      return {
        owner: {
          id: owner._id,
          name: `${owner.firstName} ${owner.lastName}`,
          mobileNumber: owner.mobileNumber
        },
        location: location ? location.toPublic() : null
      };
    });

    res.json({ success: true, message: 'Bus locations fetched successfully', data: { buses } });
  } catch (error) {
    console.error('Error fetching bus locations:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch bus location' });
  }
});

// PUT set the parent's home (pickup/drop) location
router.put('/home-location', [
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  body('address').optional().isString().isLength({ max: 200 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const { latitude, longitude, address } = req.body;
    req.user.homeLocation = {
      latitude: Number(latitude),
      longitude: Number(longitude),
      address: address ? address.trim() : undefined,
      updatedAt: new Date()
    };
    await req.user.save();

    res.json({
      success: true,
      message: 'Home location saved',
      data: { homeLocation: serializeHome(req.user) }
    });
  } catch (error) {
    console.error('Error saving home location:', error);
    res.status(500).json({ success: false, message: 'Failed to save home location' });
  }
});

module.exports = router;
