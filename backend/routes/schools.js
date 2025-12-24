const express = require('express');
const School = require('../models/School');
const User = require('../models/User');
const router = express.Router();

// Middleware to validate user existence
const validateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.body.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid user ID' });
  }
};

// Create a new school
router.post('/create', validateUser, async (req, res) => {
  try {
    const { schoolName, schoolAddress, timing, shift, userId } = req.body;

    // Validate required fields
    if (!schoolName || !schoolAddress || !timing || !shift) {
      return res.status(400).json({ 
        success: false,
        message: 'All fields are required',
        error: 'All fields are required',
        required: ['schoolName', 'schoolAddress', 'timing', 'shift', 'userId']
      });
    }

    // Check if user already has a school with the same name AND shift combination
    const existingSchool = await School.findOne({ 
      schoolName: schoolName.trim(),
      shift: shift.trim(),
      userId: userId 
    });

    if (existingSchool) {
      return res.status(409).json({ 
        success: false,
        message: `You already have a school "${schoolName}" with ${shift} shift`,
        error: `You already have a school "${schoolName}" with ${shift} shift` 
      });
    }

    // Create new school
    const school = new School({
      schoolName: schoolName.trim(),
      schoolAddress: schoolAddress.trim(),
      timing: timing.trim(),
      shift: shift.trim(),
      userId
    });

    const savedSchool = await school.save();

    res.status(201).json({
      success: true,
      message: 'School created successfully',
      data: {
        school: {
          id: savedSchool._id,
          schoolName: savedSchool.schoolName,
          schoolAddress: savedSchool.schoolAddress,
          timing: savedSchool.timing,
          shift: savedSchool.shift,
          formattedTiming: savedSchool.getFormattedTiming(),
          createdAt: savedSchool.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Error creating school:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false,
        message: 'Validation failed',
        error: 'Validation failed',
        details: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({ 
      success: false,
      message: 'Failed to create school: ' + error.message,
      error: error.message || 'Internal server error'
    });
  }
});

// Get all schools for a specific user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const schools = await School.findByUserId(userId);
    
    res.json({
      success: true,
      message: 'Schools fetched successfully',
      data: {
        count: schools.length,
        schools: schools.map(school => ({
          id: school._id,
          schoolName: school.schoolName,
          schoolAddress: school.schoolAddress,
          timing: school.timing,
          shift: school.shift,
          formattedTiming: school.getFormattedTiming(),
          createdAt: school.createdAt,
          updatedAt: school.updatedAt
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching schools:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to fetch schools'
    });
  }
});

// Get a specific school by ID
router.get('/:schoolId', async (req, res) => {
  try {
    const { schoolId } = req.params;

    const school = await School.findById(schoolId).populate('userId', 'firstName lastName email');
    
    if (!school) {
      return res.status(404).json({ error: 'School not found' });
    }

    res.json({
      success: true,
      message: 'School fetched successfully',
      data: {
        school: {
          id: school._id,
          schoolName: school.schoolName,
          schoolAddress: school.schoolAddress,
          timing: school.timing,
          shift: school.shift,
          formattedTiming: school.getFormattedTiming(),
          user: school.userId,
          createdAt: school.createdAt,
          updatedAt: school.updatedAt
        }
      }
    });

  } catch (error) {
    console.error('Error fetching school:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to fetch school'
    });
  }
});

// Update a school
router.put('/:schoolId', async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { schoolName, schoolAddress, timing, shift } = req.body;

    const school = await School.findById(schoolId);
    
    if (!school) {
      return res.status(404).json({ error: 'School not found' });
    }

    // Update fields if provided
    if (schoolName) school.schoolName = schoolName.trim();
    if (schoolAddress) school.schoolAddress = schoolAddress.trim();
    if (timing) school.timing = timing.trim();
    if (shift) school.shift = shift.trim();

    const updatedSchool = await school.save();

    res.json({
      success: true,
      message: 'School updated successfully',
      data: {
        school: {
          id: updatedSchool._id,
          schoolName: updatedSchool.schoolName,
          schoolAddress: updatedSchool.schoolAddress,
          timing: updatedSchool.timing,
          shift: updatedSchool.shift,
          formattedTiming: updatedSchool.getFormattedTiming(),
          updatedAt: updatedSchool.updatedAt
        }
      }
    });

  } catch (error) {
    console.error('Error updating school:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to update school'
    });
  }
});

// Delete a school
router.delete('/:schoolId', async (req, res) => {
  try {
    const { schoolId } = req.params;

    const school = await School.findByIdAndDelete(schoolId);
    
    if (!school) {
      return res.status(404).json({ error: 'School not found' });
    }

    res.json({
      success: true,
      message: 'School deleted successfully',
      deletedSchool: {
        id: school._id,
        schoolName: school.schoolName
      }
    });

  } catch (error) {
    console.error('Error deleting school:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to delete school'
    });
  }
});

// Check if user has any schools
router.get('/check/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('Backend: Check schools endpoint called for userId:', userId);

    // Validate user exists
    const user = await User.findById(userId);
    if (!user) {
      console.log('Backend: User not found for userId:', userId);
      return res.status(404).json({ error: 'User not found' });
    }

    const schoolCount = await School.countDocuments({ userId });
    console.log('Backend: School count for user:', schoolCount);
    
    const responseData = {
      success: true,
      message: 'School check completed successfully',
      data: {
        hasSchools: schoolCount > 0,
        schoolCount
      }
    };
    
    console.log('Backend: Sending response:', JSON.stringify(responseData, null, 2));
    res.json(responseData);

  } catch (error) {
    console.error('Error checking schools:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to check schools'
    });
  }
});

module.exports = router;