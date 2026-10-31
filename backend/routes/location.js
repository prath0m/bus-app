const express = require('express');
const { body, validationResult } = require('express-validator');
const Student = require('../models/Student');
const User = require('../models/User');
const BusLocation = require('../models/BusLocation');
const { authenticate, requireRole, phoneSuffix } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate, requireRole('owner', 'admin'));

// PUT update the bus's live position (called repeatedly while sharing)
router.put('/bus', [
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  body('heading').optional({ nullable: true }).isFloat(),
  body('speed').optional({ nullable: true }).isFloat()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const { latitude, longitude, heading, speed } = req.body;
    const location = await BusLocation.findOneAndUpdate(
      { ownerId: req.user._id },
      { latitude, longitude, heading, speed, isSharing: true },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ success: true, message: 'Location updated', data: { location: location.toPublic() } });
  } catch (error) {
    console.error('Error updating bus location:', error);
    res.status(500).json({ success: false, message: 'Failed to update location' });
  }
});

// POST stop sharing — parents immediately see the bus as offline
router.post('/bus/stop', async (req, res) => {
  try {
    await BusLocation.updateOne({ ownerId: req.user._id }, { isSharing: false });
    res.json({ success: true, message: 'Stopped sharing location' });
  } catch (error) {
    console.error('Error stopping location sharing:', error);
    res.status(500).json({ success: false, message: 'Failed to stop sharing' });
  }
});

// GET the owner's own last shared position
router.get('/bus', async (req, res) => {
  try {
    const location = await BusLocation.findOne({ ownerId: req.user._id });
    res.json({
      success: true,
      message: 'Location fetched',
      data: { location: location ? location.toPublic() : null }
    });
  } catch (error) {
    console.error('Error fetching bus location:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch location' });
  }
});

// GET home locations of the parents of this owner's students
router.get('/homes', async (req, res) => {
  try {
    const students = await Student.find({ userId: req.user._id, isActive: true })
      .populate('schoolId', 'schoolName')
      .sort({ name: 1 });

    const studentsBySuffix = new Map();
    students.forEach((s) => {
      const suffix = phoneSuffix(s.contactNumber);
      if (!studentsBySuffix.has(suffix)) studentsBySuffix.set(suffix, []);
      studentsBySuffix.get(suffix).push(s);
    });

    const suffixes = [...studentsBySuffix.keys()].filter((s) => s.length === 10);
    const parents = suffixes.length
      ? await User.find({
          role: 'parent',
          isActive: true,
          mobileNumber: { $regex: `(${suffixes.join('|')})$` }
        })
      : [];

    const homes = [];
    const linkedSuffixes = new Set();
    parents.forEach((parent) => {
      const suffix = phoneSuffix(parent.mobileNumber);
      linkedSuffixes.add(suffix);
      if (!parent.homeLocation || parent.homeLocation.latitude == null) return;
      homes.push({
        parentId: parent._id,
        parentName: `${parent.firstName} ${parent.lastName}`,
        mobileNumber: parent.mobileNumber,
        latitude: parent.homeLocation.latitude,
        longitude: parent.homeLocation.longitude,
        address: parent.homeLocation.address,
        updatedAt: parent.homeLocation.updatedAt,
        students: (studentsBySuffix.get(suffix) || []).map((s) => ({
          id: s._id,
          name: s.name,
          schoolName: s.schoolId?.schoolName
        }))
      });
    });

    const withHome = new Set(homes.map((h) => phoneSuffix(h.mobileNumber)));
    const missing = students
      .filter((s) => !withHome.has(phoneSuffix(s.contactNumber)))
      .map((s) => ({
        id: s._id,
        name: s.name,
        contactNumber: s.contactNumber,
        parentRegistered: linkedSuffixes.has(phoneSuffix(s.contactNumber))
      }));

    res.json({
      success: true,
      message: 'Home locations fetched',
      data: { homes, missing }
    });
  } catch (error) {
    console.error('Error fetching home locations:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch home locations' });
  }
});

module.exports = router;
