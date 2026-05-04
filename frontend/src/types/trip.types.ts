export interface Passenger {
  userId: {
    _id: string;
    firstname: string;
    lastname: string;
    email: string;
    phone: string;
    profileImage?: string;
  };
  seatsBooked: number;
  bookedAt: Date;
  status: string;
}

export interface Trip {
  _id: string;
  creator: {
    _id: string;
    firstname: string;
    lastname: string;
    email: string;
    phone: string;
    profileImage?: string;
    rating?: number;
  };
  departure: string;
  destination: string;
  departureTime: string;
  carType: string;
  carModel: string;
  licensePlate: string;
  totalSeats: number;
  availableSeats: number;
  pricePerSeat: number;
  passengers: Passenger[];
  status: 'upcoming' | 'in-progress' | 'completed' | 'cancelled';
  description?: string;
  allowPets: boolean;
  allowSmoking: boolean;
  allowMusic: boolean;
  waypoints?: Array<{ location: string; latitude: number; longitude: number }>;
  createdAt: string;
  updatedAt: string;
  totalBookedSeats?: number;
}