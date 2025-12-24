const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Student name is required'],
    trim: true,
    maxLength: [100, 'Student name cannot exceed 100 characters']
  },
  dateOfJoining: {
    type: Date,
    required: [true, 'Date of joining is required'],
    default: Date.now
  },
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: [true, 'School selection is required']
  },
  contactNumber: {
    type: String,
    required: [true, 'Contact number is required'],
    trim: true,
    validate: {
      validator: function(v) {
        return /^[\+]?[1-9][\d]{9,14}$/.test(v);
      },
      message: 'Please enter a valid contact number'
    }
  },
  paymentMode: {
    type: String,
    required: [true, 'Payment mode is required'],
    enum: ['Cash', 'Online'],
    trim: true
  },
  paymentPeriod: {
    type: String,
    required: [true, 'Payment period is required'],
    enum: ['Monthly', 'Quarterly', 'Half Yearly', 'Yearly', 'Custom'],
    trim: true
  },
  totalYearlyPayment: {
    type: Number,
    required: [true, 'Total yearly payment is required'],
    min: [0, 'Payment amount must be positive'],
    validate: {
      validator: function(v) {
        return v > 0;
      },
      message: 'Total yearly payment must be greater than 0'
    }
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for faster queries
studentSchema.index({ userId: 1 });
studentSchema.index({ schoolId: 1 });
studentSchema.index({ name: 1, userId: 1 });
studentSchema.index({ isActive: 1 });

// Pre-save middleware to update the updatedAt field
studentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Instance method to calculate payment amount based on period
studentSchema.methods.getPaymentAmount = function() {
  const yearly = this.totalYearlyPayment;
  switch (this.paymentPeriod) {
    case 'Monthly':
      return Math.round(yearly / 12);
    case 'Quarterly':
      return Math.round(yearly / 4);
    case 'Half Yearly':
      return Math.round(yearly / 2);
    case 'Yearly':
      return yearly;
    case 'Custom':
      return yearly; // For custom, return yearly amount (can be modified as needed)
    default:
      return yearly;
  }
};

// Instance method to get formatted joining date
studentSchema.methods.getFormattedJoiningDate = function() {
  return this.dateOfJoining.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Static method to find students by user
studentSchema.statics.findByUserId = function(userId) {
  return this.find({ userId: userId, isActive: true })
    .populate('schoolId', 'schoolName schoolAddress')
    .sort({ createdAt: -1 });
};

// Static method to find students by school
studentSchema.statics.findBySchoolId = function(schoolId) {
  return this.find({ schoolId: schoolId, isActive: true })
    .populate('userId', 'firstName lastName email')
    .sort({ name: 1 });
};

// Virtual for student display name with school
studentSchema.virtual('displayName').get(function() {
  return `${this.name} (${this.schoolId?.schoolName || 'Unknown School'})`;
});

// Ensure virtual fields are serialized
studentSchema.set('toJSON', { virtuals: true });

const Student = mongoose.model('Student', studentSchema);

module.exports = Student;