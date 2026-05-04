const express = require('express');
const router = express.Router();

const Trip = require('./Trip');
const User = require('../user/User');
const { adminAuthorization, checkTokenExists, authentication } = require('../middlewares/authMiddleware');

//================ALL TRIPS===============
router.get('/all', adminAuthorization, async (req, res) => {
  try {
    
    const trips = await Trip.find()
      .populate('passengers.userId', 'firstname lastname email phone profileImage')
      .sort({ departureTime: -1 });

    res.json({
      message: 'ALL trips retrieved successfully',
      count: trips.length,
      trips,
    });
  } catch (error) {
    console.error('Get my trips error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ============= CREATE TRIP =============
// Create a new trip (driver only)
router.post('/create', authentication, async (req, res) => {
  try {
    const { 
      departure, 
      destination, 
      departureTime, 
      carType, 
      carModel, 
      licensePlate, 
      totalSeats, 
      pricePerSeat, 
      description, 
      allowPets, 
      allowSmoking, 
      allowMusic, 
      waypoints 
    } = req.body;

    // Get user ID from req.user (set by authentication middleware)
    const userId = req.user.userId;
    
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Validate required fields
    if (!departure || !destination || !departureTime || !carType || !totalSeats || pricePerSeat === undefined) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Validate departure time is in the future
    if (new Date(departureTime) <= new Date()) {
      return res.status(400).json({ message: 'Departure time must be in the future' });
    }

    // Validate total seats
    if (totalSeats < 1 || totalSeats > 8) {
      return res.status(400).json({ message: 'Total seats must be between 1 and 8' });
    }

    const newTrip = new Trip({
      creator: userId,
      departure,
      destination,
      departureTime,
      carType,
      carModel,
      licensePlate,
      totalSeats,
      availableSeats: totalSeats,
      pricePerSeat,
      description: description || '',
      allowPets: allowPets || false,
      allowSmoking: allowSmoking || false,
      allowMusic: allowMusic !== undefined ? allowMusic : true,
      waypoints: waypoints || [],
      passengers: [],
    });

    await newTrip.save();
    await newTrip.populate('creator', 'firstname lastname email phone');

    res.status(201).json({
      message: 'Trip created successfully',
      trip: newTrip,
    });
  } catch (error) {
    console.error('Create trip error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ============= GET TRIPS =============
// Get all available trips (with filters)
router.get('/available', async (req, res) => {
  try {
    const { departure, destination, departureDate, carType } = req.query;
    let filter = { status: 'upcoming', availableSeats: { $gt: 0 } };

    if (departure) filter.departure = { $regex: departure, $options: 'i' };
    if (destination) filter.destination = { $regex: destination, $options: 'i' };
    if (carType) filter.carType = carType;

    if (departureDate) {
      const startDate = new Date(departureDate);
      const endDate = new Date(departureDate);
      endDate.setDate(endDate.getDate() + 1);
      filter.departureTime = { $gte: startDate, $lt: endDate };
    }

    const trips = await Trip.find(filter)
      .populate('creator', 'firstname lastname email phone profileImage')
      .sort({ departureTime: 1 })
      .limit(50);

    res.json({
      message: 'Trips retrieved successfully',
      count: trips.length,
      trips,
    });
  } catch (error) {
    console.error('Get trips error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all trips posted by the current user
router.get('/my-trips', authentication, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const trips = await Trip.find({ creator: userId })
      .populate('passengers.userId', 'firstname lastname email phone profileImage')
      .sort({ departureTime: -1 });

    res.json({
      message: 'Your trips retrieved successfully',
      count: trips.length,
      trips,
    });
  } catch (error) {
    console.error('Get my trips error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all trips the current user has booked
router.get('/my-bookings', authentication, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const trips = await Trip.find({
      'passengers.userId': userId,
      status: { $in: ['upcoming', 'in-progress', 'completed'] },
    })
      .populate('creator', 'firstname lastname email phone profileImage')
      .sort({ departureTime: -1 });

    res.json({
      message: 'Your bookings retrieved successfully',
      count: trips.length,
      trips,
    });
  } catch (error) {
    console.error('Get my bookings error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get a single trip by ID
router.get('/:tripId', async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.tripId)
      .populate('creator', 'firstname lastname email phone profileImage rating')
      .populate('passengers.userId', 'firstname lastname email phone profileImage rating');

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    res.json({
      message: 'Trip retrieved successfully',
      trip,
    });
  } catch (error) {
    console.error('Get trip by ID error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ============= BOOK A TRIP =============
// Book seats in a trip
router.post('/:tripId/book', authentication, async (req, res) => {
  try {
    const { seatsToBook } = req.body;
    const userId = req.user.userId;

    if (!seatsToBook || seatsToBook < 1) {
      return res.status(400).json({ message: 'Invalid number of seats' });
    }

    const trip = await Trip.findById(req.params.tripId);

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    if (trip.creator.toString() === userId) {
      return res.status(400).json({ message: 'You cannot book your own trip' });
    }

    if (trip.availableSeats < seatsToBook) {
      return res.status(400).json({ message: 'Not enough available seats' });
    }

    // Check if user already booked this trip
    const existingBooking = trip.passengers.find(p => p.userId.toString() === userId);
    if (existingBooking) {
      return res.status(400).json({ message: 'You have already booked this trip' });
    }

    // Add passenger
    trip.passengers.push({
      userId: userId,
      seatsBooked: seatsToBook,
      status: 'confirmed',
      bookedAt: new Date()
    });

    trip.availableSeats -= seatsToBook;

    await trip.save();
    await trip.populate('passengers.userId', 'firstname lastname email phone profileImage');

    res.status(201).json({
      message: 'Booking confirmed',
      trip,
    });
  } catch (error) {
    console.error('Book trip error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ============= UPDATE TRIP =============
// Update trip details (creator only)
router.put('/:tripId', authentication, async (req, res) => {
  try {
    const userId = req.user.userId;
    const trip = await Trip.findById(req.params.tripId);

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    if (trip.creator.toString() !== userId) {
      return res.status(403).json({ message: 'Only the trip creator can update it' });
    }

    const { departure, destination, departureTime, carType, carModel, licensePlate, pricePerSeat, description, allowPets, allowSmoking, allowMusic, status } = req.body;

    if (departure) trip.departure = departure;
    if (destination) trip.destination = destination;
    if (departureTime) {
      if (new Date(departureTime) <= new Date()) {
        return res.status(400).json({ message: 'Departure time must be in the future' });
      }
      trip.departureTime = departureTime;
    }
    if (carType) trip.carType = carType;
    if (carModel) trip.carModel = carModel;
    if (licensePlate) trip.licensePlate = licensePlate;
    if (pricePerSeat !== undefined) trip.pricePerSeat = pricePerSeat;
    if (description) trip.description = description;
    if (allowPets !== undefined) trip.allowPets = allowPets;
    if (allowSmoking !== undefined) trip.allowSmoking = allowSmoking;
    if (allowMusic !== undefined) trip.allowMusic = allowMusic;
    if (status && ['upcoming', 'in-progress', 'completed', 'cancelled'].includes(status)) {
      trip.status = status;
    }

    await trip.save();
    await trip.populate('creator', 'firstname lastname email phone');

    res.json({
      message: 'Trip updated successfully',
      trip,
    });
  } catch (error) {
    console.error('Update trip error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ============= CANCEL BOOKING =============
// Cancel a passenger's booking
router.post('/:tripId/cancel-booking', authentication, async (req, res) => {
  try {
    const userId = req.user.userId;
    const trip = await Trip.findById(req.params.tripId);

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    const passengerIndex = trip.passengers.findIndex(p => p.userId.toString() === userId);

    if (passengerIndex === -1) {
      return res.status(400).json({ message: 'You have not booked this trip' });
    }

    const seatsBooked = trip.passengers[passengerIndex].seatsBooked;
    trip.passengers.splice(passengerIndex, 1);
    trip.availableSeats += seatsBooked;

    await trip.save();
    await trip.populate('passengers.userId', 'firstname lastname email phone profileImage');

    res.json({
      message: 'Booking cancelled successfully',
      trip,
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ============= REMOVE PASSENGER =============
// Remove a passenger from the trip (creator only)
router.post('/:tripId/remove-passenger/:passengerId', authentication, async (req, res) => {
  try {
    const userId = req.user.userId;
    const trip = await Trip.findById(req.params.tripId);

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    if (trip.creator.toString() !== userId) {
      return res.status(403).json({ message: 'Only the trip creator can remove passengers' });
    }

    const passengerIndex = trip.passengers.findIndex(p => p.userId.toString() === req.params.passengerId);

    if (passengerIndex === -1) {
      return res.status(400).json({ message: 'Passenger not found in this trip' });
    }

    const seatsBooked = trip.passengers[passengerIndex].seatsBooked;
    trip.passengers.splice(passengerIndex, 1);
    trip.availableSeats += seatsBooked;

    await trip.save();
    await trip.populate('passengers.userId', 'firstname lastname email phone profileImage');

    res.json({
      message: 'Passenger removed successfully',
      trip,
    });
  } catch (error) {
    console.error('Remove passenger error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ============= DELETE TRIP =============
// Delete a trip (creator only)
router.delete('/:tripId', authentication, async (req, res) => {
  try {
    const userId = req.user.userId;
    const trip = await Trip.findById(req.params.tripId);

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    if (trip.creator.toString() !== userId) {
      return res.status(403).json({ message: 'Only the trip creator can delete it' });
    }

    await Trip.findByIdAndDelete(req.params.tripId);

    res.json({
      message: 'Trip deleted successfully',
    });
  } catch (error) {
    console.error('Delete trip error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ============= SEARCH TRIPS =============
// Advanced search with multiple filters
router.post('/search/advanced', async (req, res) => {
  try {
    const { departure, destination, departureDate, carType, maxPrice, minSeats } = req.body;

    let filter = { status: 'upcoming', availableSeats: { $gt: 0 } };

    if (departure) filter.departure = { $regex: departure, $options: 'i' };
    if (destination) filter.destination = { $regex: destination, $options: 'i' };
    if (carType) filter.carType = carType;
    if (maxPrice) filter.pricePerSeat = { $lte: maxPrice };
    if (minSeats) filter.availableSeats = { $gte: minSeats };

    if (departureDate) {
      const startDate = new Date(departureDate);
      const endDate = new Date(departureDate);
      endDate.setDate(endDate.getDate() + 1);
      filter.departureTime = { $gte: startDate, $lt: endDate };
    }

    const trips = await Trip.find(filter)
      .populate('creator', 'firstname lastname email phone profileImage rating')
      .sort({ departureTime: 1 });

    res.json({
      message: 'Search results',
      count: trips.length,
      trips,
    });
  } catch (error) {
    console.error('Search trips error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ============= TRIP STATISTICS =============
// Get statistics for a trip (creator only)
router.get('/:tripId/stats', authentication, async (req, res) => {
  try {
    const userId = req.user.userId;
    const trip = await Trip.findById(req.params.tripId).populate('passengers.userId', 'firstname lastname email');

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    if (trip.creator.toString() !== userId) {
      return res.status(403).json({ message: 'Only the trip creator can view statistics' });
    }

    const totalBookedSeats = trip.passengers.reduce((sum, p) => sum + p.seatsBooked, 0);
    const totalRevenue = totalBookedSeats * trip.pricePerSeat;

    const stats = {
      totalPassengers: trip.passengers.length,
      totalBookedSeats,
      availableSeats: trip.availableSeats,
      occupancyRate: ((totalBookedSeats / trip.totalSeats) * 100).toFixed(2) + '%',
      totalRevenue,
      passengers: trip.passengers,
    };

    res.json({
      message: 'Trip statistics',
      stats,
    });
  } catch (error) {
    console.error('Trip stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;