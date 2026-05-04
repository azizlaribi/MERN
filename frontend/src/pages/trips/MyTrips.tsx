import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Spinner, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaCar, FaEye, FaMapMarkerAlt, FaCalendarAlt, FaMoneyBill, FaUser, FaPhone, FaEnvelope, FaStar, FaPaw, FaSmoking, FaMusic, FaUsers, FaInfoCircle, FaEdit, FaTrash, FaArrowLeft, FaClock } from 'react-icons/fa';
import { tripService } from '../../services/tripService';
import type { Trip } from '../../types/trip.types';
import Sidebar from '../../components/Sidebar';

const MyTrips: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyTrips();
  }, []);

  const fetchMyTrips = async () => {
    try {
      const data = await tripService.getMyTrips();
      setTrips(data.trips);
    } catch (err: any) {
      setError('Failed to load your trips');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (tripId: string) => {
    if (window.confirm('Are you sure you want to delete this trip? This action cannot be undone.')) {
      try {
        await tripService.deleteTrip(tripId);
        fetchMyTrips();
        alert('Trip deleted successfully');
      } catch (err: any) {
        alert('Failed to delete trip');
      }
    }
  };

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

  const getStatusColorClass = (status: string) => {
    switch(status) {
      case 'upcoming': return 'border-success';
      case 'in-progress': return 'border-warning';
      case 'completed': return 'border-secondary';
      case 'cancelled': return 'border-danger';
      default: return 'border-secondary';
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
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
              <div>
                <h1 className="display-5 fw-bold">My Trips</h1>
                <p className="lead text-muted">Manage your created trips</p>
              </div>
              <Button 
                variant="danger" 
                onClick={() => navigate('/trips/create')}
                style={{ borderRadius: '12px', padding: '12px 24px' }}
              >
                <FaCar className="me-2" /> Create New Trip
              </Button>
            </div>
          </div>

          {error && <Alert variant="danger" style={{ borderRadius: '12px' }}>{error}</Alert>}

          {trips.length === 0 ? (
            <Card className="text-center py-5 border-0 shadow-sm" style={{ borderRadius: '20px' }}>
              <Card.Body>
                <div className="bg-light rounded-circle d-inline-flex p-4 mb-3" style={{ width: '100px', height: '100px', alignItems: 'center', justifyContent: 'center' }}>
                  <FaCar size={50} className="text-muted opacity-50" />
                </div>
                <h4 className="fw-bold mb-2">No trips created yet</h4>
                <p className="text-muted mb-4">Start sharing rides by creating your first trip</p>
                <Button variant="danger" onClick={() => navigate('/trips/create')} style={{ borderRadius: '10px', padding: '10px 32px' }}>
                  Create a Trip
                </Button>
              </Card.Body>
            </Card>
          ) : (
            <>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                  <h3 className="fw-bold mb-1">Your Trips</h3>
                  <p className="text-muted">Found {trips.length} created trip(s)</p>
                </div>
              </div>
              <Row className="g-4">
                {trips.map((trip) => (
                  <Col key={trip._id} lg={12}>
                    <Card className="border-0 shadow-sm" style={{ borderRadius: '20px', transition: 'transform 0.3s', borderLeft: `4px solid ${trip.status === 'upcoming' ? '#28a745' : trip.status === 'in-progress' ? '#ffc107' : '#6c757d'}` }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-3px)')}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                    >
                      <Card.Body className="p-4">
                        <Row className="align-items-center">
                          {/* Trip Info */}
                          <Col lg={4}>
                            <div className="mb-2">
                              {getStatusBadge(trip.status)}
                            </div>
                            <div className="mb-2">
                              <div className="d-flex align-items-center mb-1">
                                <FaMapMarkerAlt className="text-danger me-2" size={14} />
                                <strong className="fs-5">{trip.departure}</strong>
                              </div>
                              <div className="d-flex align-items-center mb-1">
                                <FaMapMarkerAlt className="text-success me-2" size={14} />
                                <strong className="fs-5">{trip.destination}</strong>
                              </div>
                            </div>
                            <div className="text-muted small">
                              <FaCar className="me-1" /> 
                              {trip.carType.toUpperCase()} - {trip.carModel || 'Not specified'}
                            </div>
                          </Col>

                          {/* Date & Time */}
                          <Col lg={2}>
                            <div className="bg-light rounded p-2 text-center" style={{ borderRadius: '10px' }}>
                              <FaCalendarAlt className="text-danger mb-1" />
                              <div className="fw-bold">{new Date(trip.departureTime).toLocaleDateString()}</div>
                              <div className="small text-muted">{new Date(trip.departureTime).toLocaleTimeString()}</div>
                            </div>
                          </Col>

                          {/* Seats & Price */}
                          <Col lg={2}>
                            <div className="text-center">
                              <div className="text-muted small mb-1">Available Seats</div>
                              <div className="fs-3 fw-bold text-success">{trip.availableSeats}</div>
                              <div className="small text-muted">/ {trip.totalSeats} total</div>
                            </div>
                          </Col>

                          <Col lg={2}>
                            <div className="text-center">
                              <div className="text-muted small mb-1">Price per Seat</div>
                              <div className="fs-3 fw-bold text-danger">{trip.pricePerSeat} TND</div>
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
                                <FaEye className="me-1" /> View Details
                              </Button>
                              <Button
                                variant="danger"
                                onClick={() => handleDelete(trip._id)}
                                style={{ borderRadius: '10px' }}
                              >
                                <FaTrash className="me-1" /> Delete
                              </Button>
                            </div>
                            {trip.passengers.length > 0 && (
                              <div className="mt-2 text-center">
                                <Badge bg="info" className="px-2 py-1">
                                  <FaUsers className="me-1" size={10} /> {trip.passengers.length} passenger(s)
                                </Badge>
                              </div>
                            )}
                          </Col>
                        </Row>

                        {/* Additional Info */}
                        {trip.description && (
                          <Row className="mt-3 pt-3 border-top">
                            <Col>
                              <div className="d-flex align-items-start">
                                <FaInfoCircle className="text-muted me-2 mt-1" size={14} />
                                <small className="text-muted">{trip.description}</small>
                              </div>
                            </Col>
                          </Row>
                        )}

                        {/* Preferences */}
                        {(trip.allowPets || trip.allowSmoking || trip.allowMusic) && (
                          <Row className="mt-2">
                            <Col>
                              <div className="d-flex gap-2">
                                {trip.allowPets && <Badge bg="info">🐾 Pets</Badge>}
                                {trip.allowSmoking && <Badge bg="warning">🚬 Smoking</Badge>}
                                {trip.allowMusic && <Badge bg="success">🎵 Music</Badge>}
                              </div>
                            </Col>
                          </Row>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </>
          )}
        </Container>
      </div>
    </div>
  );
};

export default MyTrips;