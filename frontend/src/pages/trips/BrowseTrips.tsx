import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert, Badge, Spinner, Modal } from 'react-bootstrap';
import { FaSearch, FaMapMarkerAlt, FaCalendarAlt, FaMoneyBill, FaUsers, FaCar, FaPaw, FaSmoking, FaMusic, FaEye, FaArrowRight, FaClock } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { tripService } from '../../services/tripService';
import type { Trip } from '../../types/trip.types';
import type { TripFilters } from '../../services/tripService';
import Sidebar from '../../components/Sidebar';

const BrowseTrips: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showBookModal, setShowBookModal] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [seatsToBook, setSeatsToBook] = useState(1);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [filters, setFilters] = useState<TripFilters>({
    departure: '',
    destination: '',
    departureDate: '',
    carType: '',
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    setLoading(true);
    try {
      const data = await tripService.getAvailableTrips();
      setTrips(data.trips);
    } catch (err: any) {
      setError('Failed to load trips');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const data = await tripService.advancedSearch(filters);
      setTrips(data.trips);
    } catch (err: any) {
      setError('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBookClick = (trip: Trip) => {
    setSelectedTrip(trip);
    setSeatsToBook(1);
    setShowBookModal(true);
  };

  const handleBookConfirm = async () => {
    if (!selectedTrip) return;
    setBookingLoading(true);
    try {
      await tripService.bookTrip(selectedTrip._id, seatsToBook);
      alert('Booking successful!');
      setShowBookModal(false);
      fetchTrips();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Booking failed');
    } finally {
      setBookingLoading(false);
    }
  };

  const getCarTypeIcon = (carType: string) => {
    switch(carType) {
      case 'compact': return '🚗';
      case 'sedan': return '🚘';
      case 'suv': return '🚙';
      case 'van': return '🚐';
      default: return '🚗';
    }
  };

  const getCarTypeLabel = (carType: string) => {
    switch(carType) {
      case 'compact': return 'Compact';
      case 'sedan': return 'Sedan';
      case 'suv': return 'SUV';
      case 'van': return 'Van';
      default: return 'Car';
    }
  };

  const sidebarWidth = isSidebarCollapsed ? '80px' : '260px';

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

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
          {/* Header Section */}
          <div className="mb-5">
            <h1 className="display-5 fw-bold">Find Your Ride</h1>
            <p className="lead text-muted">Search and book available trips from drivers near you</p>
          </div>

          {/* Search Filters Card */}
          <Card className="shadow-sm mb-5 border-0" style={{ borderRadius: '20px' }}>
            <Card.Body className="p-4">
              <Row className="g-3">
                <Col md={3}>
                  <Form.Group>
                    <Form.Label className="fw-semibold">From</Form.Label>
                    <div className="position-relative">
                      <FaMapMarkerAlt className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                      <Form.Control
                        type="text"
                        placeholder="Departure city"
                        value={filters.departure}
                        onChange={(e) => setFilters({...filters, departure: e.target.value})}
                        className="ps-5 py-2"
                        style={{ borderRadius: '10px' }}
                      />
                    </div>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label className="fw-semibold">To</Form.Label>
                    <div className="position-relative">
                      <FaMapMarkerAlt className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                      <Form.Control
                        type="text"
                        placeholder="Destination city"
                        value={filters.destination}
                        onChange={(e) => setFilters({...filters, destination: e.target.value})}
                        className="ps-5 py-2"
                        style={{ borderRadius: '10px' }}
                      />
                    </div>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label className="fw-semibold">Date</Form.Label>
                    <div className="position-relative">
                      <FaCalendarAlt className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                      <Form.Control
                        type="date"
                        value={filters.departureDate}
                        onChange={(e) => setFilters({...filters, departureDate: e.target.value})}
                        className="ps-5 py-2"
                        style={{ borderRadius: '10px' }}
                      />
                    </div>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label className="fw-semibold">Car Type</Form.Label>
                    <Form.Select
                      value={filters.carType}
                      onChange={(e) => setFilters({...filters, carType: e.target.value})}
                      className="py-2"
                      style={{ borderRadius: '10px' }}
                    >
                      <option value="">All Types</option>
                      <option value="compact">Compact</option>
                      <option value="sedan">Sedan</option>
                      <option value="suv">SUV</option>
                      <option value="van">Van</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
              <Row className="mt-4">
                <Col className="text-end">
                  <Button 
                    variant="danger" 
                    onClick={handleSearch}
                    style={{ borderRadius: '10px', padding: '10px 32px' }}
                  >
                    <FaSearch className="me-2" /> Search Trips
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Results Section */}
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="danger" style={{ width: '50px', height: '50px' }} />
              <p className="mt-3 text-muted">Loading available trips...</p>
            </div>
          ) : error ? (
            <Alert variant="danger" className="text-center">{error}</Alert>
          ) : trips.length === 0 ? (
            <Card className="text-center py-5 border-0 shadow-sm" style={{ borderRadius: '20px' }}>
              <Card.Body>
                <FaCar size={60} className="text-muted opacity-25 mb-3" />
                <h4 className="mb-2">No trips found</h4>
                <p className="text-muted">Try adjusting your search filters or check back later</p>
                <Button variant="outline-danger" onClick={() => {
                  setFilters({ departure: '', destination: '', departureDate: '', carType: '' });
                  fetchTrips();
                }}>
                  Clear Filters
                </Button>
              </Card.Body>
            </Card>
          ) : (
            <>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                  <h3 className="fw-bold mb-1">Available Trips</h3>
                  <p className="text-muted">Found {trips.length} trip(s) matching your criteria</p>
                </div>
              </div>
              <Row className="g-4">
                {trips.map((trip) => (
                  <Col key={trip._id} lg={6} xl={4}>
                    <Card className="h-100 border-0 shadow-sm" style={{ borderRadius: '20px', transition: 'transform 0.3s', cursor: 'pointer' }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-5px)')}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                    >
                      <Card.Header className="bg-danger text-white border-0" style={{ borderRadius: '20px 20px 0 0' }}>
                        <div className="d-flex justify-content-between align-items-center">
                          <div className="d-flex align-items-center gap-2">
                            <span style={{ fontSize: '20px' }}>{getCarTypeIcon(trip.carType)}</span>
                            <strong>{getCarTypeLabel(trip.carType)}</strong>
                          </div>
                          <Badge bg="light" text="dark" style={{ padding: '8px 12px' }}>
                            {trip.availableSeats} seats left
                          </Badge>
                        </div>
                      </Card.Header>
                      <Card.Body className="p-4">
                        {/* Route */}
                        <div className="mb-4">
                          <div className="d-flex align-items-center mb-3">
                            <div className="text-center me-3">
                              <div className="bg-danger bg-opacity-10 rounded-circle p-2" style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <FaMapMarkerAlt className="text-danger" />
                              </div>
                            </div>
                            <div className="flex-grow-1">
                              <div className="fw-bold fs-5">{trip.departure}</div>
                              <div className="text-muted small">Departure</div>
                            </div>
                          </div>
                          <div className="d-flex align-items-center mb-3">
                            <div className="text-center me-3">
                              <div className="bg-success bg-opacity-10 rounded-circle p-2" style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <FaMapMarkerAlt className="text-success" />
                              </div>
                            </div>
                            <div className="flex-grow-1">
                              <div className="fw-bold fs-5">{trip.destination}</div>
                              <div className="text-muted small">Destination</div>
                            </div>
                          </div>
                        </div>

                        {/* Trip Details */}
                        <div className="mb-3">
                          <div className="d-flex align-items-center text-muted mb-2">
                            <FaCalendarAlt className="me-2" />
                            <small>{new Date(trip.departureTime).toLocaleString()}</small>
                          </div>
                          <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                            <div>
                              <span className="text-muted small">Driver</span>
                              <div className="fw-semibold">{trip.creator.firstname} {trip.creator.lastname}</div>
                            </div>
                            <div className="text-end">
                              <span className="text-muted small">Price per seat</span>
                              <div className="fs-4 fw-bold text-danger">{trip.pricePerSeat} TND</div>
                            </div>
                          </div>
                        </div>

                        {/* Preferences */}
                        <div className="d-flex gap-3 mb-3 pt-2">
                          {trip.allowPets && <Badge bg="info"><FaPaw className="me-1" /> Pets</Badge>}
                          {trip.allowSmoking && <Badge bg="warning"><FaSmoking className="me-1" /> Smoking</Badge>}
                          {trip.allowMusic && <Badge bg="success"><FaMusic className="me-1" /> Music</Badge>}
                        </div>

                        {/* Actions */}
                        <div className="d-flex gap-2 mt-3">
                          <Button
                            variant="outline-danger"
                            className="flex-grow-1"
                            onClick={() => navigate(`/trips/${trip._id}`)}
                            style={{ borderRadius: '10px' }}
                          >
                            <FaEye className="me-1" /> Details
                          </Button>
                          <Button
                            variant="danger"
                            className="flex-grow-1"
                            onClick={() => handleBookClick(trip)}
                            disabled={trip.availableSeats === 0}
                            style={{ borderRadius: '10px' }}
                          >
                            Book Now
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </>
          )}
        </Container>
      </div>

      {/* Booking Modal */}
      <Modal show={showBookModal} onHide={() => setShowBookModal(false)} centered>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold">Book This Trip</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedTrip && (
            <>
              <div className="mb-3 p-3 bg-light rounded" style={{ borderRadius: '12px' }}>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">From:</span>
                  <strong>{selectedTrip.departure}</strong>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">To:</span>
                  <strong>{selectedTrip.destination}</strong>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-muted">Date:</span>
                  <strong>{new Date(selectedTrip.departureTime).toLocaleString()}</strong>
                </div>
              </div>
              
              <div className="mb-3">
                <label className="form-label fw-semibold">Number of seats:</label>
                <input
                  type="number"
                  className="form-control"
                  min="1"
                  max={selectedTrip.availableSeats}
                  value={seatsToBook}
                  onChange={(e) => setSeatsToBook(parseInt(e.target.value))}
                  style={{ borderRadius: '10px' }}
                />
                <small className="text-muted">Available seats: {selectedTrip.availableSeats}</small>
              </div>
              
              <div className="alert alert-info" style={{ borderRadius: '10px' }}>
                <div className="d-flex justify-content-between">
                  <span>Price per seat:</span>
                  <strong>{selectedTrip.pricePerSeat} TND</strong>
                </div>
                <div className="d-flex justify-content-between mt-2 pt-2 border-top">
                  <span className="fw-bold">Total amount:</span>
                  <strong className="text-danger fs-5">{seatsToBook * selectedTrip.pricePerSeat} TND</strong>
                </div>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="secondary" onClick={() => setShowBookModal(false)} style={{ borderRadius: '10px' }}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleBookConfirm} disabled={bookingLoading} style={{ borderRadius: '10px' }}>
            {bookingLoading ? 'Processing...' : 'Confirm Booking'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default BrowseTrips;