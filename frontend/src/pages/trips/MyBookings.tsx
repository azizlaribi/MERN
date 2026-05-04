import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Spinner, Badge, Modal } from 'react-bootstrap';
import { FaCar, FaCalendarAlt, FaUser, FaPhone, FaEnvelope, FaTimes, FaArrowLeft, FaMapMarkerAlt, FaClock } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { tripService } from '../../services/tripService';
import type { Trip } from '../../types/trip.types';
import Sidebar from '../../components/Sidebar';

const MyBookings: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [bookings, setBookings] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyBookings();
  }, []);

  const fetchMyBookings = async () => {
    try {
      const data = await tripService.getMyBookings();
      setBookings(data.trips);
    } catch (err: any) {
      setError('Failed to load your bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!selectedTrip) return;
    
    try {
      await tripService.cancelBooking(selectedTrip._id);
      setShowCancelModal(false);
      fetchMyBookings();
      alert('Booking cancelled successfully');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to cancel booking');
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'upcoming': return 'success';
      case 'in-progress': return 'warning';
      case 'completed': return 'secondary';
      case 'cancelled': return 'danger';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'upcoming': return '🟢';
      case 'in-progress': return '🟡';
      case 'completed': return '✅';
      case 'cancelled': return '❌';
      default: return '📌';
    }
  };

  const getMyBookingDetails = (trip: Trip) => {
    const userId = localStorage.getItem('userId');
    const myBooking = trip.passengers.find(p => p.userId._id === userId);
    return myBooking;
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
            <Button
              variant="link"
              onClick={() => navigate('/dashboard')}
              className="mb-3 text-decoration-none"
              style={{ color: '#6c757d' }}
            >
              <FaArrowLeft className="me-2" /> Back to Dashboard
            </Button>
            <h1 className="display-5 fw-bold">My Bookings</h1>
            <p className="lead text-muted">View and manage your booked trips</p>
          </div>

          {error && <Alert variant="danger" style={{ borderRadius: '12px' }}>{error}</Alert>}

          {bookings.length === 0 ? (
            <Card className="text-center py-5 border-0 shadow-sm" style={{ borderRadius: '20px' }}>
              <Card.Body>
                <div className="bg-light rounded-circle d-inline-flex p-4 mb-3" style={{ width: '100px', height: '100px', alignItems: 'center', justifyContent: 'center' }}>
                  <FaCar size={50} className="text-muted opacity-50" />
                </div>
                <h4 className="fw-bold mb-2">No bookings yet</h4>
                <p className="text-muted mb-4">You haven't booked any trips yet. Start your first adventure!</p>
                <Button variant="danger" onClick={() => navigate('/trips/browse')} style={{ borderRadius: '10px', padding: '10px 32px' }}>
                  Browse Trips
                </Button>
              </Card.Body>
            </Card>
          ) : (
            <>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                  <h3 className="fw-bold mb-1">Your Bookings</h3>
                  <p className="text-muted">Found {bookings.length} booked trip(s)</p>
                </div>
              </div>
              <Row className="g-4">
                {bookings.map((trip) => {
                  const myBooking = getMyBookingDetails(trip);
                  return (
                    <Col key={trip._id} lg={12}>
                      <Card className="border-0 shadow-sm" style={{ borderRadius: '20px', transition: 'transform 0.3s' }}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-3px)')}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                      >
                        <Card.Body className="p-4">
                          <Row className="align-items-start">
                            {/* Trip Info */}
                            <Col lg={4}>
                              <div className="mb-3">
                                <Badge bg={getStatusColor(trip.status)} className="mb-2 fs-6" style={{ padding: '8px 16px' }}>
                                  {getStatusIcon(trip.status)} {trip.status.toUpperCase()}
                                </Badge>
                              </div>
                              <h4 className="fw-bold mb-2">
                                {trip.departure} → {trip.destination}
                              </h4>
                              <div className="d-flex align-items-center text-muted mb-2">
                                <FaCalendarAlt className="me-2 text-danger" />
                                <small>{new Date(trip.departureTime).toLocaleString()}</small>
                              </div>
                              <div className="d-flex align-items-center text-muted">
                                <FaCar className="me-2 text-danger" />
                                <small>{trip.carType.toUpperCase()} - {trip.carModel || 'Not specified'}</small>
                              </div>
                            </Col>

                            {/* Driver Info */}
                            <Col lg={3}>
                              <div className="bg-light rounded p-3" style={{ borderRadius: '12px' }}>
                                <div className="text-muted small mb-2">Driver</div>
                                <div className="d-flex align-items-center mb-2">
                                  <div className="bg-danger rounded-circle d-flex align-items-center justify-content-center me-2" style={{ width: '32px', height: '32px' }}>
                                    <FaUser size={14} color="white" />
                                  </div>
                                  <strong>{trip.creator.firstname} {trip.creator.lastname}</strong>
                                </div>
                                {trip.creator.phone && (
                                  <div className="text-muted small mb-1">
                                    <FaPhone className="me-1" size={12} />
                                    {trip.creator.phone}
                                  </div>
                                )}
                                <div className="text-muted small">
                                  <FaEnvelope className="me-1" size={12} />
                                  {trip.creator.email}
                                </div>
                              </div>
                            </Col>

                            {/* Booking Details */}
                            <Col lg={3}>
                              <div className="bg-light rounded p-3" style={{ borderRadius: '12px' }}>
                                <div className="text-muted small mb-2">Your Booking</div>
                                <div className="mb-2">
                                  <span className="fw-bold">{myBooking?.seatsBooked} seat(s)</span> booked
                                </div>
                                <div className="text-danger fw-bold mb-2">
                                  Total: {myBooking?.seatsBooked! * trip.pricePerSeat} TND
                                </div>
                                <div className="text-muted small">
                                  <FaClock className="me-1" size={12} />
                                  Booked on: {new Date(myBooking?.bookedAt || '').toLocaleDateString()}
                                </div>
                              </div>
                            </Col>

                            {/* Actions */}
                            <Col lg={2}>
                              <div className="d-flex flex-column gap-2">
                                <Button
                                  variant="outline-danger"
                                  onClick={() => navigate(`/trips/${trip._id}`)}
                                  style={{ borderRadius: '10px' }}
                                >
                                  View Details
                                </Button>
                                {trip.status === 'upcoming' && (
                                  <Button
                                    variant="danger"
                                    onClick={() => {
                                      setSelectedTrip(trip);
                                      setShowCancelModal(true);
                                    }}
                                    style={{ borderRadius: '10px' }}
                                  >
                                    Cancel Booking
                                  </Button>
                                )}
                              </div>
                            </Col>
                          </Row>

                          {/* Additional Features */}
                          {(trip.allowPets || trip.allowSmoking || trip.allowMusic) && (
                            <Row className="mt-3 pt-3 border-top">
                              <Col>
                                <div className="d-flex gap-3">
                                  {trip.allowPets && <Badge bg="info">🐾 Pets allowed</Badge>}
                                  {trip.allowSmoking && <Badge bg="warning">🚬 Smoking allowed</Badge>}
                                  {trip.allowMusic && <Badge bg="success">🎵 Music allowed</Badge>}
                                </div>
                              </Col>
                            </Row>
                          )}
                        </Card.Body>
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            </>
          )}
        </Container>
      </div>

      {/* Cancel Confirmation Modal */}
      <Modal show={showCancelModal} onHide={() => setShowCancelModal(false)} centered>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold">Cancel Booking</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to cancel your booking for trip from</p>
          <div className="bg-light rounded p-3 mb-3 text-center">
            <strong className="fs-5">{selectedTrip?.departure}</strong>
            <span className="mx-2">→</span>
            <strong className="fs-5">{selectedTrip?.destination}</strong>
          </div>
          <div className="alert alert-warning d-flex align-items-center" style={{ borderRadius: '12px' }}>
            <FaTimes className="me-2" size={18} />
            <span className="small">This action cannot be undone. Your seats will be released to other passengers.</span>
          </div>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="secondary" onClick={() => setShowCancelModal(false)} style={{ borderRadius: '10px' }}>
            Keep Booking
          </Button>
          <Button variant="danger" onClick={handleCancelBooking} style={{ borderRadius: '10px' }}>
            Yes, Cancel Booking
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default MyBookings;