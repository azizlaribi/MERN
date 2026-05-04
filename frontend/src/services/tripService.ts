import axios from 'axios';

const API_URL = 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface CreateTripData {
  departure: string;
  destination: string;
  departureTime: string;
  carType: string;
  carModel: string;
  licensePlate: string;
  totalSeats: number;
  pricePerSeat: number;
  description?: string;
  allowPets?: boolean;
  allowSmoking?: boolean;
  allowMusic?: boolean;
  waypoints?: Array<{ location: string; latitude: number; longitude: number }>;
}

export interface TripFilters {
  departure?: string;
  destination?: string;
  departureDate?: string;
  carType?: string;
  maxPrice?: number;
  minSeats?: number;
}

export const tripService = {
   async getAllTrips() {
    const response = await api.get('/trips/all');
    return response.data;
  },
  // Create a new trip
  async createTrip(data: CreateTripData) {
    const response = await api.post('/trips/create', data);
    return response.data;
  },

  // Get all available trips with filters
  async getAvailableTrips(filters?: TripFilters) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });
    }
    const response = await api.get(`/trips/available?${params.toString()}`);
    return response.data;
  },

  // Get user's created trips
  async getMyTrips() {
    const response = await api.get('/trips/my-trips');
    return response.data;
  },

  // Get user's bookings
  async getMyBookings() {
    const response = await api.get('/trips/my-bookings');
    return response.data;
  },

  // Get single trip by ID
  async getTripById(tripId: string) {
    const response = await api.get(`/trips/${tripId}`);
    return response.data;
  },

  // Book a trip
  async bookTrip(tripId: string, seatsToBook: number) {
    const response = await api.post(`/trips/${tripId}/book`, { seatsToBook });
    return response.data;
  },

  // Cancel booking
  async cancelBooking(tripId: string) {
    const response = await api.post(`/trips/${tripId}/cancel-booking`);
    return response.data;
  },

  // Update trip
  async updateTrip(tripId: string, data: Partial<CreateTripData>) {
    const response = await api.put(`/trips/${tripId}`, data);
    return response.data;
  },

  // Delete trip
  async deleteTrip(tripId: string) {
    const response = await api.delete(`/trips/${tripId}`);
    return response.data;
  },

  // Get trip statistics (creator only)
  async getTripStats(tripId: string) {
    const response = await api.get(`/trips/${tripId}/stats`);
    return response.data;
  },

  // Advanced search
  async advancedSearch(filters: TripFilters) {
    const response = await api.post('/trips/search/advanced', filters);
    return response.data;
  },
};