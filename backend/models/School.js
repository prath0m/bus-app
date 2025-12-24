const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema({
  schoolName: {
    type: String,
    required: [true, 'School name is required'],
    trim: true,
    maxLength: [100, 'School name cannot exceed 100 characters']
  },
  schoolAddress: {
    type: String,
    required: [true, 'School address is required'],
    trim: true,
    maxLength: [200, 'School address cannot exceed 200 characters']
  },
  timing: {
    type: String,
    required: [true, 'School timing is required'],
    trim: true
  },
  shift: {
    type: String,
    required: [true, 'School shift is required'],
    enum: ['Morning', 'Afternoon', 'Evening', 'Full Day'],
    trim: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
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
  timestamps: true // This automatically handles createdAt and updatedAt
});

// Index for faster queries
schoolSchema.index({ userId: 1 });
schoolSchema.index({ schoolName: 1, userId: 1 });

// Pre-save middleware to update the updatedAt field
schoolSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Instance method to get formatted timing
schoolSchema.methods.getFormattedTiming = function() {
  return `${this.timing} (${this.shift})`;
};

// Static method to find schools by user
schoolSchema.statics.findByUserId = function(userId) {
  return this.find({ userId: userId }).sort({ createdAt: -1 });
};

const School = mongoose.model('School', schoolSchema);

module.exports = School;