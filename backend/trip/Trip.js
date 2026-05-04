const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');

const tripSchema = new mongoose.Schema(
  {
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    departure: {
      type: String,
      required: true,
      trim: true,
    },

    destination: {
      type: String,
      required: true,
      trim: true,
    },

    departureTime: {
      type: Date,
      required: true,
    },

    carType: {
      type: String,
      enum: ['compact', 'sedan', 'suv', 'van', 'truck'],
      required: true,
    },

    carModel: {
      type: String,
      trim: true,
    },

    licensePlate: {
      type: String,
      trim: true,
    },

    totalSeats: {
      type: Number,
      required: true,
      min: 1,
      max: 8,
    },

    availableSeats: {
      type: Number,
      required: true,
      min: 0,
    },

    pricePerSeat: {
      type: Number,
      required: true,
      min: 0,
    },

    passengers: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        seatsBooked: {
          type: Number,
          required: true,
          min: 1,
        },
        bookedAt: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: String,
          enum: ['pending', 'confirmed', 'cancelled'],
          default: 'confirmed',
        },
      },
    ],

    status: {
      type: String,
      enum: ['upcoming', 'in-progress', 'completed', 'cancelled'],
      default: 'upcoming',
    },

    description: {
      type: String,
      trim: true,
    },

    allowPets: {
      type: Boolean,
      default: false,
    },

    allowSmoking: {
      type: Boolean,
      default: false,
    },

    allowMusic: {
      type: Boolean,
      default: true,
    },

    waypoints: [
      {
        location: String,
        latitude: Number,
        longitude: Number,
      },
    ],
  },
  { timestamps: true }
);

tripSchema.virtual('totalBookedSeats').get(function () {
  return this.passengers.reduce((sum, passenger) => sum + passenger.seatsBooked, 0);
});

tripSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Trip', tripSchema);