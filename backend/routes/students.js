const express = require('express');
const Student = require('../models/Student');
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

// Create a new student
router.post('/create', validateUser, async (req, res) => {
  try {
    const { 
      name, 
      dateOfJoining, 
      schoolId, 
      contactNumber, 
      paymentMode, 
      paymentPeriod, 
      totalYearlyPayment, 
      userId 
    } = req.body;

    // Validate required fields
    if (!name || !schoolId || !contactNumber || !paymentMode || !paymentPeriod || !totalYearlyPayment) {
      return res.status(400).json({ 
        error: 'All fields are required',
        required: ['name', 'schoolId', 'contactNumber', 'paymentMode', 'paymentPeriod', 'totalYearlyPayment', 'userId']
      });
    }

    // Validate school exists and belongs to user
    const school = await School.findOne({ _id: schoolId, userId: userId });
    if (!school) {
      return res.status(404).json({ 
        error: 'School not found or does not belong to this user' 
      });
    }

    // Check if student with same name already exists in the same school
    const existingStudent = await Student.findOne({ 
      name: name.trim(),
      schoolId: schoolId,
      userId: userId,
      isActive: true
    });

    if (existingStudent) {
      return res.status(409).json({ 
        error: 'A student with this name already exists in this school' 
      });
    }

    // Create new student
    const student = new Student({
      name: name.trim(),
      dateOfJoining: dateOfJoining || Date.now(),
      schoolId,
      contactNumber: contactNumber.trim(),
      paymentMode: paymentMode.trim(),
      paymentPeriod: paymentPeriod.trim(),
      totalYearlyPayment: Number(totalYearlyPayment),
      userId
    });

    const savedStudent = await student.save();
    
    // Populate school data for response
    await savedStudent.populate('schoolId', 'schoolName schoolAddress');

    res.status(201).json({
      success: true,
      message: 'Student created successfully',
      data: {
        student: {
          id: savedStudent._id,
          name: savedStudent.name,
          dateOfJoining: savedStudent.dateOfJoining,
          formattedJoiningDate: savedStudent.getFormattedJoiningDate(),
          school: savedStudent.schoolId,
          contactNumber: savedStudent.contactNumber,
          paymentMode: savedStudent.paymentMode,
          paymentPeriod: savedStudent.paymentPeriod,
          totalYearlyPayment: savedStudent.totalYearlyPayment,
          paymentAmount: savedStudent.getPaymentAmount(),
          isActive: savedStudent.isActive,
          createdAt: savedStudent.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Error creating student:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: Object.values(error.errors).map(err => err.message)
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({ 
        error: 'Invalid ID format provided'
      });
    }

    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to create student'
    });
  }
});

// Get all students for a specific user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const students = await Student.findByUserId(userId);
    
    res.json({
      success: true,
      message: 'Students fetched successfully',
      data: {
        count: students.length,
        students: students.map(student => ({
          id: student._id,
          name: student.name,
          dateOfJoining: student.dateOfJoining,
          formattedJoiningDate: student.getFormattedJoiningDate(),
          school: student.schoolId,
          contactNumber: student.contactNumber,
          paymentMode: student.paymentMode,
          paymentPeriod: student.paymentPeriod,
          totalYearlyPayment: student.totalYearlyPayment,
          paymentAmount: student.getPaymentAmount(),
          isActive: student.isActive,
          createdAt: student.createdAt,
          updatedAt: student.updatedAt
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to fetch students'
    });
  }
});

// Get students by school
router.get('/school/:schoolId', async (req, res) => {
  try {
    const { schoolId } = req.params;

    const students = await Student.findBySchoolId(schoolId);
    
    res.json({
      success: true,
      message: 'Students fetched successfully',
      data: {
        count: students.length,
        students: students.map(student => ({
          id: student._id,
          name: student.name,
          dateOfJoining: student.dateOfJoining,
          formattedJoiningDate: student.getFormattedJoiningDate(),
          contactNumber: student.contactNumber,
          paymentMode: student.paymentMode,
          paymentPeriod: student.paymentPeriod,
          totalYearlyPayment: student.totalYearlyPayment,
          paymentAmount: student.getPaymentAmount(),
          user: student.userId,
          isActive: student.isActive,
          createdAt: student.createdAt
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching students by school:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to fetch students'
    });
  }
});

// Get a specific student by ID
router.get('/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findById(studentId)
      .populate('schoolId', 'schoolName schoolAddress timing shift')
      .populate('userId', 'firstName lastName email');
    
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json({
      success: true,
      message: 'Student fetched successfully',
      data: {
        student: {
          id: student._id,
          name: student.name,
          dateOfJoining: student.dateOfJoining,
          formattedJoiningDate: student.getFormattedJoiningDate(),
          school: student.schoolId,
          contactNumber: student.contactNumber,
          paymentMode: student.paymentMode,
          paymentPeriod: student.paymentPeriod,
          totalYearlyPayment: student.totalYearlyPayment,
          paymentAmount: student.getPaymentAmount(),
          user: student.userId,
          isActive: student.isActive,
          createdAt: student.createdAt,
          updatedAt: student.updatedAt
        }
      }
    });

  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to fetch student'
    });
  }
});

// Update a student
router.put('/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { name, dateOfJoining, contactNumber, paymentMode, paymentPeriod, totalYearlyPayment } = req.body;

    const student = await Student.findById(studentId);
    
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Update fields if provided
    if (name) student.name = name.trim();
    if (dateOfJoining) student.dateOfJoining = new Date(dateOfJoining);
    if (contactNumber) student.contactNumber = contactNumber.trim();
    if (paymentMode) student.paymentMode = paymentMode.trim();
    if (paymentPeriod) student.paymentPeriod = paymentPeriod.trim();
    if (totalYearlyPayment) student.totalYearlyPayment = Number(totalYearlyPayment);

    const updatedStudent = await student.save();
    await updatedStudent.populate('schoolId', 'schoolName schoolAddress');

    res.json({
      success: true,
      message: 'Student updated successfully',
      data: {
        student: {
          id: updatedStudent._id,
          name: updatedStudent.name,
          dateOfJoining: updatedStudent.dateOfJoining,
          formattedJoiningDate: updatedStudent.getFormattedJoiningDate(),
          school: updatedStudent.schoolId,
          contactNumber: updatedStudent.contactNumber,
          paymentMode: updatedStudent.paymentMode,
          paymentPeriod: updatedStudent.paymentPeriod,
          totalYearlyPayment: updatedStudent.totalYearlyPayment,
          paymentAmount: updatedStudent.getPaymentAmount(),
          updatedAt: updatedStudent.updatedAt
        }
      }
    });

  } catch (error) {
    console.error('Error updating student:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to update student'
    });
  }
});

// Soft delete a student (set isActive to false)
router.delete('/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findById(studentId);
    
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    student.isActive = false;
    await student.save();

    res.json({
      success: true,
      message: 'Student deleted successfully',
      data: {
        deletedStudent: {
          id: student._id,
          name: student.name
        }
      }
    });

  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to delete student'
    });
  }
});

// Check if user has any students
router.get('/check/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const studentCount = await Student.countDocuments({ userId, isActive: true });
    
    res.json({
      success: true,
      message: 'Student check completed successfully',
      data: {
        hasStudents: studentCount > 0,
        studentCount
      }
    });

  } catch (error) {
    console.error('Error checking students:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to check students'
    });
  }
});

module.exports = router;