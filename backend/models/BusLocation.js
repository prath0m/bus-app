const mongoose = require('mongoose');

// Latest known position of an owner's bus. One document per owner, overwritten
// on every update — we only need "where is the bus now", not a trail.
const busLocationSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  latitude: {
    type: Number,
    required: true,
    min: -90,
    max: 90
  },
  longitude: {
    type: Number,
    required: true,
    min: -180,
    max: 180
  },
  heading: {
    type: Number
  },
  speed: {
    type: Number
  },
  isSharing: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// A location that hasn't been refreshed in this long is treated as offline,
// e.g. the owner's phone lost signal or the app was killed without stopping.
busLocationSchema.statics.STALE_AFTER_MS = 2 * 60 * 1000;

busLocationSchema.methods.toPublic = function () {
  const isLive = this.isSharing && Date.now() - this.updatedAt.getTime() < busLocationSchema.statics.STALE_AFTER_MS;
  return {
    latitude: this.latitude,
    longitude: this.longitude,
    heading: this.heading,
    speed: this.speed,
    isLive,
    updatedAt: this.updatedAt
  };
};

const BusLocation = mongoose.model('BusLocation', busLocationSchema);

module.exports = BusLocation;
