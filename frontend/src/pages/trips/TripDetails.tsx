import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Spinner, Badge, Modal, ListGroup } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { FaCar, FaMapMarkerAlt, FaChartLine, FaCalendarAlt, FaMoneyBill, FaUser, FaPhone, FaEnvelope, FaStar, FaPaw, FaSmoking, FaMusic, FaUsers, FaInfoCircle, FaEdit, FaTrash, FaArrowLeft, FaClock, FaCheckCircle, FaComment } from 'react-icons/fa';
import { tripService } from '../../services/tripService';
import type { Trip } from '../../types/trip.types';
import { authService } from '../../services/authService';
import Sidebar from '../../components/Sidebar';

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Component to fit bounds to show the entire route
const FitBounds: React.FC<{ positions: [number, number][] }> = ({ positions }) => {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, positions]);
  return null;
};

// Geocoding service to convert address to coordinates
const geocodeAddress = async (address: string): Promise<[number, number] | null> => {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`);
    const data = await response.json();
    if (data && data.length > 0) {
      return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
};

// Get route between two points using OSRM
const getRoute = async (start: [number, number], end: [number, number]): Promise<[number, number][]> => {
  try {
    const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`);
    const data = await response.json();
    if (data.routes && data.routes.length > 0) {
      const coordinates = data.routes[0].geometry.coordinates;
      return coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
    }
    return [start, end];
  } catch (error) {
    console.error('Route error:', error);
    return [start, end];
  }
};

const TripDetails: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showBookModal, setShowBookModal] = useState(false);
  const [seatsToBook, setSeatsToBook] = useState(1);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [showStats, setShowStats] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
  const [departureCoords, setDepartureCoords] = useState<[number, number] | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<[number, number] | null>(null);
  const [mapLoading, setMapLoading] = useState(false);

  const currentUserId = localStorage.getItem('userId');
  const isCreator = trip?.creator._id === currentUserId;
  const userRole = authService.getUserRole();
  const isAdmin = userRole === 'admin';

  useEffect(() => {
    fetchTripDetails();
  }, [tripId]);

  useEffect(() => {
    if (trip) {
      fetchRoute();
    }
  }, [trip]);

  const fetchTripDetails = async () => {
    if (!tripId) return;
    try {
      const data = await tripService.getTripById(tripId);
      setTrip(data.trip);
      
      if (data.trip.creator._id === currentUserId || isAdmin) {
        try {
          const statsData = await tripService.getTripStats(tripId);
          setStats(statsData.stats);
        } catch (err) {
          console.error('Failed to fetch stats');
        }
      }
    } catch (err: any) {
      setError('Failed to load trip details');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoute = async () => {
    if (!trip) return;
    setMapLoading(true);
    try {
      // Geocode departure and destination
      const depCoords = await geocodeAddress(trip.departure);
      const destCoords = await geocodeAddress(trip.destination);
      
      if (depCoords && destCoords) {
        setDepartureCoords(depCoords);
        setDestinationCoords(destCoords);
        
        // Get the route
        const route = await getRoute(depCoords, destCoords);
        setRouteCoordinates(route);
      }
    } catch (error) {
      console.error('Error fetching route:', error);
    } finally {
      setMapLoading(false);
    }
  };

  const handleBook = async () => {
    if (!tripId) return;
    setBookingLoading(true);
    try {
      await tripService.bookTrip(tripId, seatsToBook);
      setShowBookModal(false);
      fetchTripDetails();
      alert('Booking successful!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Booking failed');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!tripId) return;
    if (window.confirm('Are you sure you want to cancel your booking?')) {
      try {
        await tripService.cancelBooking(tripId);
        fetchTripDetails();
        alert('Booking cancelled successfully');
      } catch (err: any) {
        alert(err.response?.data?.message || 'Failed to cancel booking');
      }
    }
  };

  const handleDeleteTrip = async () => {
    if (!tripId) return;
    if (window.confirm('Are you sure you want to delete this trip? This action cannot be undone.')) {
      try {
        await tripService.deleteTrip(tripId);
        alert('Trip deleted successfully');
        navigate('/trips/my-trips');
      } catch (err: any) {
        alert(err.response?.data?.message || 'Failed to delete trip');
      }
    }
  };

  const handleMessageDriver = () => {
    navigate(`/messages/${trip?.creator._id}`);
  };

  const getPassengerBooking = () => {
    return trip?.passengers.find(p => p.userId._id === currentUserId);
  };

  const hasBooked = !!getPassengerBooking();
  const myBooking = getPassengerBooking();

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      upcoming: 'success',
      'in-progress': 'warning',
      completed: 'secondary',
      cancelled: 'danger',
    };
    const icons: Record<string, string> = {
      upcoming: '🟢',
      'in-progress': '🟡',
      completed: '✅',
      cancelled: '❌',
    };
    return (
      <Badge bg={variants[status] || 'secondary'} className="px-3 py-2 fs-6">
        {icons[status] || '📌'} {status.toUpperCase()}
      </Badge>
    );
  };

  const getCarTypeIcon = () => {
    switch(trip?.carType) {
      case 'compact': return '🚗 Compact';
      case 'sedan': return '🚘 Sedan';
      case 'suv': return '🚙 SUV';
      case 'van': return '🚐 Van';
      case 'truck': return '🚛 Truck';
      default: return '🚗 Car';
    }
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const sidebarWidth = isSidebarCollapsed ? '80px' : '260px';

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <Spinner animation="border" variant="danger" style={{ width: '50px', height: '50px' }} />
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
        <Container className="py-5">
          <Alert variant="danger" style={{ borderRadius: '12px' }}>{error || 'Trip not found'}</Alert>
          <Button variant="danger" onClick={() => navigate(-1)} style={{ borderRadius: '10px' }}>Go Back</Button>
        </Container>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
      <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />

      {/* Main Content */}
      <div style={{ 
        marginLeft: sidebarWidth,
        transition: 'margin-left 0.3s ease-in-out',
        padding: '30px',
        minHeight: '100vh'
      }}>
        <Container fluid className="py-4">
          {/* Back Button */}
          <Button 
            variant="link" 
            onClick={() => navigate(-1)} 
            className="mb-3 text-decoration-none"
            style={{ color: '#6c757d' }}
          >
            <FaArrowLeft className="me-2" /> Back
          </Button>

          <Row>
            <Col lg={8}>
              {/* Map Card */}
              <Card className="shadow-sm border-0 mb-4" style={{ borderRadius: '20px', overflow: 'hidden' }}>
                <Card.Header className="bg-danger text-white" style={{ borderRadius: '0' }}>
                  <h5 className="mb-0 fw-bold">🗺️ Route Map</h5>
                </Card.Header>
                <Card.Body className="p-0">
                  {mapLoading ? (
                    <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
                      <Spinner animation="border" variant="danger" />
                      <span className="ms-3">Loading map...</span>
                    </div>
                  ) : departureCoords && destinationCoords ? (
                    <MapContainer
                      center={[(departureCoords[0] + destinationCoords[0]) / 2, (departureCoords[1] + destinationCoords[1]) / 2]}
                      zoom={13}
                      style={{ height: '400px', width: '100%' }}
                      zoomControl={true}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      {/* Departure Marker */}
                      <Marker position={departureCoords}>
                        <Popup>
                          <strong>Departure</strong><br />
                          {trip.departure}<br />
                          <small>{new Date(trip.departureTime).toLocaleString()}</small>
                        </Popup>
                      </Marker>
                      {/* Destination Marker */}
                      <Marker position={destinationCoords}>
                        <Popup>
                          <strong>Destination</strong><br />
                          {trip.destination}
                        </Popup>
                      </Marker>
                      {/* Route Polyline */}
                      {routeCoordinates.length > 0 && (
                        <Polyline
                          positions={routeCoordinates}
                          color="#dc3545"
                          weight={4}
                          opacity={0.8}
                          dashArray="10, 10"
                        />
                      )}
                      <FitBounds positions={[departureCoords, destinationCoords]} />
                    </MapContainer>
                  ) : (
                    <div className="text-center py-5" style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                      <FaMapMarkerAlt size={50} className="text-muted mb-3" />
                      <p>Map unavailable. Please check the addresses.</p>
                    </div>
                  )}
                </Card.Body>
              </Card>

              {/* Main Trip Info Card */}
              <Card className="shadow-sm border-0 mb-4" style={{ borderRadius: '20px' }}>
                <Card.Body className="p-4">
                  <div className="d-flex justify-content-between align-items-start mb-4">
                    <div>
                      {getStatusBadge(trip.status)}
                    </div>
                    {(isCreator || isAdmin) && trip.status === 'upcoming' && (
                      <div className="d-flex gap-2">
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => navigate(`/trips/${tripId}/edit`)}
                          style={{ borderRadius: '8px' }}
                        >
                          <FaEdit className="me-1" /> Edit
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={handleDeleteTrip}
                          style={{ borderRadius: '8px' }}
                        >
                          <FaTrash className="me-1" /> Delete
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Route Display */}
                  <div className="mb-4">
                    <div className="d-flex align-items-center mb-3 p-3 bg-light rounded" style={{ borderRadius: '12px' }}>
                      <div className="bg-danger rounded-circle p-2 me-3" style={{ width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FaMapMarkerAlt color="white" size={20} />
                      </div>
                      <div className="flex-grow-1">
                        <h3 className="mb-0 fs-4">{trip.departure}</h3>
                        <div className="text-muted small">Departure Point</div>
                      </div>
                      <div className="text-muted">
                        <FaClock className="me-1" />
                        {new Date(trip.departureTime).toLocaleTimeString()}
                      </div>
                    </div>
                    
                    {trip.waypoints && trip.waypoints.length > 0 && (
                      <div className="ms-4 ps-4 mb-3">
                        {trip.waypoints.map((wp, idx) => (
                          <div key={idx} className="d-flex align-items-center mb-2">
                            <div className="bg-secondary bg-opacity-10 rounded-circle p-1 me-2" style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <small>{idx + 1}</small>
                            </div>
                            <small className="text-muted">📍 {wp.location}</small>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="d-flex align-items-center p-3 bg-light rounded" style={{ borderRadius: '12px' }}>
                      <div className="bg-success rounded-circle p-2 me-3" style={{ width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FaMapMarkerAlt color="white" size={20} />
                      </div>
                      <div>
                        <h3 className="mb-0 fs-4">{trip.destination}</h3>
                        <div className="text-muted small">Destination</div>
                      </div>
                    </div>
                  </div>

                  <div className="border-top pt-4">
                    <Row className="g-3">
                      <Col md={6}>
                        <div className="p-3 bg-light rounded" style={{ borderRadius: '12px' }}>
                          <FaCalendarAlt className="text-danger me-2" />
                          <strong>Departure Date:</strong>
                          <div className="mt-1">{new Date(trip.departureTime).toLocaleDateString()}</div>
                          <div className="text-muted small">{new Date(trip.departureTime).toLocaleTimeString()}</div>
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="p-3 bg-light rounded" style={{ borderRadius: '12px' }}>
                          <FaMoneyBill className="text-danger me-2" />
                          <strong>Price:</strong>
                          <div className="fs-2 fw-bold text-danger mt-1">{trip.pricePerSeat} TND</div>
                          <div className="text-muted small">per seat</div>
                        </div>
                      </Col>
                    </Row>
                  </div>
                </Card.Body>
              </Card>

              {/* Vehicle Details Card */}
              <Card className="shadow-sm border-0 mb-4" style={{ borderRadius: '20px' }}>
                <Card.Header className="bg-white border-0 pt-4" style={{ borderRadius: '20px 20px 0 0' }}>
                  <h5 className="mb-0 fw-bold"><FaCar className="text-danger me-2" /> Vehicle Information</h5>
                </Card.Header>
                <Card.Body className="p-4">
                  <Row className="g-3">
                    <Col md={6}>
                      <div className="p-3 bg-light rounded" style={{ borderRadius: '12px' }}>
                        <div className="text-muted small mb-1">Car Type</div>
                        <div className="fw-bold fs-5">{getCarTypeIcon()}</div>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="p-3 bg-light rounded" style={{ borderRadius: '12px' }}>
                        <div className="text-muted small mb-1">Car Model</div>
                        <div className="fw-bold">{trip.carModel || 'Not specified'}</div>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="p-3 bg-light rounded" style={{ borderRadius: '12px' }}>
                        <div className="text-muted small mb-1">License Plate</div>
                        <div className="fw-bold">{trip.licensePlate || 'Not specified'}</div>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="p-3 bg-light rounded" style={{ borderRadius: '12px' }}>
                        <div className="text-muted small mb-1">Total Seats</div>
                        <div className="fw-bold fs-5">{trip.totalSeats} seats</div>
                      </div>
                    </Col>
                  </Row>

                  <div className="mt-4">
                    <strong className="d-block mb-2">Preferences:</strong>
                    <div className="d-flex gap-2 flex-wrap">
                      {trip.allowPets && <Badge bg="info" className="px-3 py-2">🐾 Pets Allowed</Badge>}
                      {trip.allowSmoking && <Badge bg="warning" className="px-3 py-2">🚬 Smoking Allowed</Badge>}
                      {trip.allowMusic && <Badge bg="success" className="px-3 py-2">🎵 Music Allowed</Badge>}
                      {!trip.allowPets && !trip.allowSmoking && !trip.allowMusic && (
                        <span className="text-muted">No special preferences</span>
                      )}
                    </div>
                  </div>

                  {trip.description && (
                    <div className="mt-4 pt-3 border-top">
                      <strong><FaInfoCircle className="text-danger me-2" /> Description:</strong>
                      <p className="mt-2 text-muted">{trip.description}</p>
                    </div>
                  )}
                </Card.Body>
              </Card>

              {/* Driver Info Card */}
              <Card className="shadow-sm border-0" style={{ borderRadius: '20px' }}>
                <Card.Header className="bg-white border-0 pt-4" style={{ borderRadius: '20px 20px 0 0' }}>
                  <h5 className="mb-0 fw-bold"><FaUser className="text-danger me-2" /> Driver Information</h5>
                </Card.Header>
                <Card.Body className="p-4">
                  <div className="d-flex align-items-center mb-4">
                    <div className="bg-dark rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '70px', height: '70px' }}>
                      {trip.creator.profileImage ? (
                        <img src={trip.creator.profileImage} alt="Profile" className="rounded-circle" style={{ width: '70px', height: '70px', objectFit: 'cover' }} />
                      ) : (
                        <FaUser size={35} color="white" />
                      )}
                    </div>
                    <div>
                      <h3 className="mb-1 fs-4">{trip.creator.firstname} {trip.creator.lastname}</h3>
                      {trip.creator.rating && (
                        <div className="text-warning">
                          <FaStar className="me-1" /> {trip.creator.rating} / 5.0
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="ps-2">
                    {trip.creator.phone && (
                      <div className="mb-2 d-flex align-items-center">
                        <div className="bg-light rounded-circle p-2 me-2" style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <FaPhone className="text-danger" size={14} />
                        </div>
                        <span>{trip.creator.phone}</span>
                      </div>
                    )}
                    <div className="d-flex align-items-center">
                      <div className="bg-light rounded-circle p-2 me-2" style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FaEnvelope className="text-danger" size={14} />
                      </div>
                      <span>{trip.creator.email}</span>
                    </div>
                  </div>
                  
                  {/* Message Driver Button - Only show if current user is not the driver */}
                  {currentUserId !== trip.creator._id && (
                    <Button
                      variant="outline-danger"
                      className="w-100 mt-4"
                      onClick={handleMessageDriver}
                      style={{ borderRadius: '10px', fontWeight: '500' }}
                    >
                      <FaComment className="me-2" />
                      Message Driver
                    </Button>
                  )}
                </Card.Body>
              </Card>
            </Col>

            <Col lg={4}>
              {/* Booking Card */}
              <Card className="shadow-sm border-0 mb-4 sticky-top" style={{ top: '20px', borderRadius: '20px' }}>
                <Card.Header className="bg-danger text-white" style={{ borderRadius: '20px 20px 0 0' }}>
                  <h5 className="mb-0 fw-bold">Booking Information</h5>
                </Card.Header>
                <Card.Body className="p-4">
                  <div className="mb-4">
                    <div className="d-flex justify-content-between mb-2">
                      <span>Available Seats:</span>
                      <strong className="text-success fs-5">{trip.availableSeats} / {trip.totalSeats}</strong>
                    </div>
                    <div className="progress" style={{ height: '10px', borderRadius: '5px' }}>
                      <div 
                        className="progress-bar bg-danger" 
                        style={{ width: `${((trip.totalSeats - trip.availableSeats) / trip.totalSeats) * 100}%`, borderRadius: '5px' }}
                      ></div>
                    </div>
                  </div>

                  {hasBooked && (
                    <Alert variant="info" style={{ borderRadius: '12px' }}>
                      <FaCheckCircle className="me-2" />
                      <strong>You have booked this trip!</strong>
                      <div className="mt-2">
                        <div>Seats booked: <strong>{myBooking?.seatsBooked}</strong></div>
                        <div>Total paid: <strong className="text-danger">{myBooking?.seatsBooked! * trip.pricePerSeat} TND</strong></div>
                      </div>
                      {trip.status === 'upcoming' && (
                        <Button variant="danger" size="sm" className="mt-3 w-100" onClick={handleCancelBooking}>
                          Cancel Booking
                        </Button>
                      )}
                    </Alert>
                  )}

                  {!isCreator && !hasBooked && trip.status === 'upcoming' && trip.availableSeats > 0 && (
                    <Button 
                      variant="danger" 
                      size="lg" 
                      className="w-100 py-3"
                      onClick={() => setShowBookModal(true)}
                      style={{ borderRadius: '12px', fontWeight: '600' }}
                    >
                      Book This Trip
                    </Button>
                  )}

                  {trip.availableSeats === 0 && (
                    <Alert variant="warning" className="mb-0 text-center" style={{ borderRadius: '12px' }}>
                      <FaUsers className="me-2" size={18} />
                      This trip is fully booked!
                    </Alert>
                  )}

                  {trip.status !== 'upcoming' && (
                    <Alert variant="secondary" className="mb-0 text-center" style={{ borderRadius: '12px' }}>
                      This trip is <strong>{trip.status}</strong>. Booking is not available.
                    </Alert>
                  )}

                  {isCreator && (
                    <Button 
                      variant="outline-danger" 
                      className="w-100 mt-3 py-2"
                      onClick={() => setShowStats(true)}
                      style={{ borderRadius: '12px' }}
                    >
                      View Trip Statistics
                    </Button>
                  )}
                </Card.Body>
              </Card>

              {/* Passengers List */}
              {(isCreator || isAdmin) && trip.passengers.length > 0 && (
                <Card className="shadow-sm border-0" style={{ borderRadius: '20px' }}>
                  <Card.Header className="bg-white border-0 pt-4" style={{ borderRadius: '20px 20px 0 0' }}>
                    <h5 className="mb-0 fw-bold"><FaUsers className="text-danger me-2" /> Passengers ({trip.passengers.length})</h5>
                  </Card.Header>
                  <Card.Body className="p-0">
                    <ListGroup variant="flush">
                      {trip.passengers.map((passenger, idx) => (
                        <ListGroup.Item key={idx} className="d-flex justify-content-between align-items-center py-3">
                          <div>
                            <strong>{passenger.userId.firstname} {passenger.userId.lastname}</strong>
                            <div className="text-muted small mt-1">
                              <FaClock className="me-1" size={10} />
                              Booked: {new Date(passenger.bookedAt).toLocaleDateString()}
                            </div>
                          </div>
                          <Badge bg="success" className="px-3 py-2">
                            {passenger.seatsBooked} seat(s)
                          </Badge>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  </Card.Body>
                </Card>
              )}
            </Col>
          </Row>

          {/* Booking Modal */}
          <Modal show={showBookModal} onHide={() => setShowBookModal(false)} centered size="md">
            <Modal.Header closeButton className="border-0">
              <Modal.Title className="fw-bold">Book This Trip</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <div className="bg-light rounded p-3 mb-4" style={{ borderRadius: '12px' }}>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">From:</span>
                  <strong>{trip.departure}</strong>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">To:</span>
                  <strong>{trip.destination}</strong>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-muted">Date:</span>
                  <strong>{new Date(trip.departureTime).toLocaleDateString()}</strong>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="form-label fw-semibold">Number of seats:</label>
                <input
                  type="number"
                  className="form-control form-control-lg"
                  min="1"
                  max={trip.availableSeats}
                  value={seatsToBook}
                  onChange={(e) => setSeatsToBook(Math.min(parseInt(e.target.value) || 1, trip.availableSeats))}
                  style={{ borderRadius: '10px' }}
                />
                <small className="text-muted">Maximum {trip.availableSeats} seats available</small>
              </div>
              
              <div className="bg-danger bg-opacity-10 rounded p-3" style={{ borderRadius: '12px' }}>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="fw-semibold">Total amount:</span>
                  <span className="fs-3 fw-bold text-danger">{seatsToBook * trip.pricePerSeat} TND</span>
                </div>
                <div className="text-muted small mt-1">Price per seat: {trip.pricePerSeat} TND</div>
              </div>
            </Modal.Body>
            <Modal.Footer className="border-0">
              <Button variant="secondary" onClick={() => setShowBookModal(false)} style={{ borderRadius: '10px' }}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleBook} disabled={bookingLoading} style={{ borderRadius: '10px', padding: '10px 32px' }}>
                {bookingLoading ? 'Processing...' : 'Confirm Booking'}
              </Button>
            </Modal.Footer>
          </Modal>

          {/* Statistics Modal */}
          <Modal show={showStats} onHide={() => setShowStats(false)} size="lg" centered>
            <Modal.Header closeButton className="border-0">
              <Modal.Title className="fw-bold">Trip Statistics</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {stats && (
                <div>
                  <Row className="g-3 mb-4">
                    <Col md={6}>
                      <Card className="bg-gradient bg-primary text-white border-0" style={{ borderRadius: '15px' }}>
                        <Card.Body className="text-center">
                          <FaUsers size={30} className="mb-2 opacity-75" />
                          <h2 className="display-4 fw-bold mb-0">{stats.totalPassengers}</h2>
                          <div>Total Passengers</div>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={6}>
                      <Card className="bg-gradient bg-success text-white border-0" style={{ borderRadius: '15px' }}>
                        <Card.Body className="text-center">
                          <FaCar size={30} className="mb-2 opacity-75" />
                          <h2 className="display-4 fw-bold mb-0">{stats.totalBookedSeats}</h2>
                          <div>Seats Booked</div>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                  <Row className="g-3 mb-4">
                    <Col md={6}>
                      <Card className="bg-gradient bg-info text-white border-0" style={{ borderRadius: '15px' }}>
                        <Card.Body className="text-center">
                          <FaChartLine size={30} className="mb-2 opacity-75" />
                          <h2 className="display-4 fw-bold mb-0">{stats.occupancyRate}</h2>
                          <div>Occupancy Rate</div>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={6}>
                      <Card className="bg-gradient bg-warning text-white border-0" style={{ borderRadius: '15px' }}>
                        <Card.Body className="text-center">
                          <FaMoneyBill size={30} className="mb-2 opacity-75" />
                          <h2 className="display-4 fw-bold mb-0">{stats.totalRevenue} TND</h2>
                          <div>Total Revenue</div>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                  <h6 className="fw-bold mb-3">Passenger Details:</h6>
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead className="table-light">
                        <tr>
                          <th>Name</th>
                          <th>Seats</th>
                          <th>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.passengers?.map((passenger: any, idx: number) => (
                          <tr key={idx}>
                            <td><strong>{passenger.userId.firstname} {passenger.userId.lastname}</strong></td>
                            <td><span className="badge bg-info">{passenger.seatsBooked} seats</span></td>
                            <td><span className="text-danger fw-bold">{passenger.seatsBooked * trip.pricePerSeat} TND</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </Modal.Body>
            <Modal.Footer className="border-0">
              <Button variant="secondary" onClick={() => setShowStats(false)} style={{ borderRadius: '10px' }}>
                Close
              </Button>
            </Modal.Footer>
          </Modal>
        </Container>
      </div>
    </div>
  );
};

export default TripDetails;