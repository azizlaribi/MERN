// AdminTrips.tsx (fixed for correct API response structure)
import React, { useEffect, useState } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  Modal,
  Form,
  InputGroup,
  Spinner,
  Table,
  Pagination,
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import {
  FaSearch,
  FaTrash,
  FaEye,
  FaArrowLeft,
  FaCheck,
  FaTimes,
  FaFilter,
  FaSync,
  FaMapMarkerAlt,
  FaCalendar,
  FaCar,
  FaUsers,
  FaInfoCircle,
} from 'react-icons/fa';
import { authService } from '../../services/authService';
import { tripService } from '../../services/tripService';
import Sidebar from '../../components/Sidebar';

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
  creator: string | {
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

const AdminTrips: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [filteredTrips, setFilteredTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'completed' | 'cancelled'>('all');
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const itemsPerPage = 10;
  const navigate = useNavigate();

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }

    const userRole = authService.getUserRole();
    if (userRole !== 'admin') {
      navigate('/dashboard');
      return;
    }

    fetchTrips();
  }, [navigate]);

  useEffect(() => {
    filterTrips();
  }, [trips, searchTerm, statusFilter]);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const response = await tripService.getAllTrips();
      
      // Handle the API response structure: { message, count, trips }
      let tripsData: Trip[] = [];
      if (response && response.trips && Array.isArray(response.trips)) {
        tripsData = response.trips;
      } else if (Array.isArray(response)) {
        tripsData = response;
      } else if (response?.data && Array.isArray(response.data)) {
        tripsData = response.data;
      } else {
        tripsData = [];
      }
      
      setTrips(tripsData);
    } catch (error) {
      console.error('Error fetching trips:', error);
      showError('Failed to fetch trips');
    } finally {
      setLoading(false);
    }
  };

  const filterTrips = () => {
    let filtered = trips.filter((trip) => {
      // Safely access creator properties (it could be a string or object)
      const creatorName = typeof trip.creator === 'object' && trip.creator
        ? `${trip.creator.firstname || ''} ${trip.creator.lastname || ''}`.toLowerCase()
        : '';
      
      const matchesSearch =
        trip.departure.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
        creatorName.includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || trip.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    setFilteredTrips(filtered);
    setCurrentPage(1);
  };

  const handleViewClick = (trip: Trip) => {
    setSelectedTrip(trip);
    setShowViewModal(true);
  };

  const handleDeleteClick = (trip: Trip) => {
    setSelectedTrip(trip);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedTrip) return;

    try {
      await tripService.deleteTrip(selectedTrip._id);
      showSuccess('Trip deleted successfully');
      setShowDeleteModal(false);
      fetchTrips();
    } catch (error) {
      console.error('Error deleting trip:', error);
      showError('Failed to delete trip');
    }
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const showError = (message: string) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(''), 3000);
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'upcoming':
        return <Badge bg="success">Upcoming</Badge>;
      case 'completed':
        return <Badge bg="info">Completed</Badge>;
      case 'cancelled':
        return <Badge bg="danger">Cancelled</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  const getDriverName = (trip: Trip) => {
    if (typeof trip.creator === 'object' && trip.creator) {
      return `${trip.creator.firstname || ''} ${trip.creator.lastname || ''}`;
    }
    return 'Unknown';
  };

  const sidebarWidth = isSidebarCollapsed ? '80px' : '260px';
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTrips = filteredTrips.slice(startIndex, startIndex + itemsPerPage);
  const totalPages = Math.ceil(filteredTrips.length / itemsPerPage);

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
        <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
        <div style={{ marginLeft: sidebarWidth, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Spinner animation="border" variant="danger" />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
      
      <div style={{ marginLeft: sidebarWidth, flex: 1, transition: 'margin-left 0.3s ease' }}>
        <Container fluid className="py-4">
          {/* Header */}
          <Row className="mb-4">
            <Col>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <Button
                    variant="link"
                    onClick={() => navigate('/admin/dashboard')}
                    className="text-decoration-none mb-2"
                    style={{ color: '#dc3545' }}
                  >
                    <FaArrowLeft className="me-2" /> Back to Dashboard
                  </Button>
                  <h1 className="display-6 fw-bold mb-2" style={{ color: '#000' }}>Manage Trips</h1>
                  <p style={{ color: '#6c757d' }}>
                    Total Trips: <strong className="text-danger">{filteredTrips.length}</strong>
                  </p>
                </div>
                <Button 
                  variant="danger" 
                  onClick={() => fetchTrips()}
                  className="d-flex align-items-center gap-2"
                >
                  <FaSync /> Refresh
                </Button>
              </div>
            </Col>
          </Row>

          {/* Alerts */}
          {successMessage && (
            <Row className="mb-3">
              <Col>
                <div className="alert alert-success alert-dismissible fade show" role="alert">
                  <FaCheck className="me-2" /> {successMessage}
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setSuccessMessage('')}
                  />
                </div>
              </Col>
            </Row>
          )}

          {errorMessage && (
            <Row className="mb-3">
              <Col>
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                  <FaTimes className="me-2" /> {errorMessage}
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setErrorMessage('')}
                  />
                </div>
              </Col>
            </Row>
          )}

          {/* Filters */}
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body>
              <Row className="g-3">
                <Col lg={8}>
                  <InputGroup>
                    <InputGroup.Text style={{ backgroundColor: '#fff', borderRight: 'none' }}>
                      <FaSearch style={{ color: '#dc3545' }} />
                    </InputGroup.Text>
                    <Form.Control
                      placeholder="Search by departure, destination, or driver name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ borderLeft: 'none' }}
                    />
                  </InputGroup>
                </Col>

                <Col lg={3}>
                  <Form.Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    style={{ cursor: 'pointer' }}
                  >
                    <option value="all">All Status</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </Form.Select>
                </Col>

                <Col lg={1}>
                  <Button
                    variant="outline-secondary"
                    className="w-100"
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                    }}
                  >
                    <FaFilter /> Reset
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Trips Table */}
          <Card className="border-0 shadow-sm">
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead style={{ backgroundColor: '#f8f9fa' }}>
                  <tr>
                    <th>Route</th>
                    <th>Driver</th>
                    <th>Date & Time</th>
                    <th>Car</th>
                    <th>Seats</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Bookings</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTrips.length > 0 ? (
                    paginatedTrips.map((trip) => (
                      <tr key={trip._id}>
                        <td>
                          <div className="fw-bold">{trip.departure}</div>
                          <small className="text-muted">→ {trip.destination}</small>
                        </td>
                        <td>{getDriverName(trip)}</td>
                        <td>
                          <div>{new Date(trip.departureTime).toLocaleDateString()}</div>
                          <small className="text-muted">{new Date(trip.departureTime).toLocaleTimeString()}</small>
                        </td>
                        <td>
                          <div>{trip.carModel || 'N/A'}</div>
                          <small className="text-muted">{trip.carType || 'N/A'}</small>
                        </td>
                        <td>
                          {trip.availableSeats}/{trip.totalSeats}
                        </td>
                        <td>
                          <span className="fw-bold text-danger">${trip.pricePerSeat}</span>
                          <small className="text-muted d-block">per seat</small>
                        </td>
                        <td>{getStatusBadge(trip.status)}</td>
                        <td>
                          <Badge bg="secondary">{trip.passengers?.length || 0} bookings</Badge>
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            <Button
                              variant="outline-info"
                              size="sm"
                              onClick={() => handleViewClick(trip)}
                              title="View details"
                            >
                              <FaEye size={14} />
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleDeleteClick(trip)}
                              title="Delete trip"
                            >
                              <FaTrash size={14} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="text-center py-5 text-muted">
                        No trips found
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Card.Footer className="bg-white border-0">
                <Pagination className="justify-content-center mb-0">
                  <Pagination.First onClick={() => setCurrentPage(1)} disabled={currentPage === 1} />
                  <Pagination.Prev onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1} />
                  
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Pagination.Item
                        key={pageNum}
                        active={currentPage === pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Pagination.Item>
                    );
                  })}
                  
                  <Pagination.Next onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages} />
                  <Pagination.Last onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} />
                </Pagination>
              </Card.Footer>
            )}
          </Card>
        </Container>
      </div>

      {/* View Trip Modal */}
      <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="lg" centered>
        <Modal.Header closeButton style={{ borderBottom: '2px solid #dc3545' }}>
          <Modal.Title>
            <FaInfoCircle className="me-2 text-danger" /> Trip Details
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedTrip && (
            <div>
              <Row className="mb-4">
                <Col md={6}>
                  <div className="p-3 border rounded">
                    <h6 className="fw-bold mb-3" style={{ color: '#dc3545' }}>
                      <FaMapMarkerAlt className="me-2" /> Route Information
                    </h6>
                    <p className="mb-2">
                      <strong>From:</strong> {selectedTrip.departure}
                    </p>
                    <p className="mb-2">
                      <strong>To:</strong> {selectedTrip.destination}
                    </p>
                    {selectedTrip.waypoints && selectedTrip.waypoints.length > 0 && (
                      <p className="mb-0">
                        <strong>Waypoints:</strong> {selectedTrip.waypoints.map(w => w.location).join(', ')}
                      </p>
                    )}
                  </div>
                </Col>
                <Col md={6}>
                  <div className="p-3 border rounded">
                    <h6 className="fw-bold mb-3" style={{ color: '#dc3545' }}>
                      <FaCalendar className="me-2" /> Schedule
                    </h6>
                    <p className="mb-2">
                      <strong>Date:</strong> {new Date(selectedTrip.departureTime).toLocaleDateString()}
                    </p>
                    <p className="mb-2">
                      <strong>Time:</strong> {new Date(selectedTrip.departureTime).toLocaleTimeString()}
                    </p>
                    <p className="mb-0">
                      <strong>Status:</strong> {getStatusBadge(selectedTrip.status)}
                    </p>
                  </div>
                </Col>
              </Row>

              <Row className="mb-4">
                <Col md={6}>
                  <div className="p-3 border rounded">
                    <h6 className="fw-bold mb-3" style={{ color: '#dc3545' }}>
                      <FaCar className="me-2" /> Vehicle Details
                    </h6>
                    <p className="mb-2">
                      <strong>Model:</strong> {selectedTrip.carModel || 'N/A'}
                    </p>
                    <p className="mb-2">
                      <strong>Type:</strong> {selectedTrip.carType || 'N/A'}
                    </p>
                    <p className="mb-0">
                      <strong>License Plate:</strong> {selectedTrip.licensePlate || 'N/A'}
                    </p>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="p-3 border rounded">
                    <h6 className="fw-bold mb-3" style={{ color: '#dc3545' }}>
                      <FaUsers className="me-2" /> Seats & Pricing
                    </h6>
                    <p className="mb-2">
                      <strong>Total Seats:</strong> {selectedTrip.totalSeats}
                    </p>
                    <p className="mb-2">
                      <strong>Available Seats:</strong> {selectedTrip.availableSeats}
                    </p>
                    <p className="mb-0">
                      <strong>Price per Seat:</strong> <span className="text-danger fw-bold">${selectedTrip.pricePerSeat}</span>
                    </p>
                  </div>
                </Col>
              </Row>

              {selectedTrip.description && (
                <div className="mb-4 p-3 border rounded">
                  <h6 className="fw-bold mb-2" style={{ color: '#dc3545' }}>Description</h6>
                  <p className="mb-0">{selectedTrip.description}</p>
                </div>
              )}

              <div className="p-3 border rounded">
                <h6 className="fw-bold mb-3" style={{ color: '#dc3545' }}>
                  <FaUsers className="me-2" /> Passengers ({selectedTrip.passengers?.length || 0})
                </h6>
                {selectedTrip.passengers && selectedTrip.passengers.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-sm">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Seats</th>
                          <th>Booked Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedTrip.passengers.map((passenger, index) => (
                          <tr key={index}>
                            <td>{passenger.userId?.firstname} {passenger.userId?.lastname}</td>
                            <td>{passenger.userId?.email}</td>
                            <td>{passenger.seatsBooked}</td>
                            <td>{new Date(passenger.bookedAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-muted mb-0">No passengers yet</p>
                )}
              </div>

              <div className="mt-3 p-3 bg-light rounded">
                <small className="text-muted">
                  <strong>Created at:</strong> {new Date(selectedTrip.createdAt).toLocaleString()}
                </small>
                <br />
                <small className="text-muted">
                  <strong>Last updated:</strong> {new Date(selectedTrip.updatedAt).toLocaleString()}
                </small>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowViewModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton style={{ borderBottom: '2px solid #dc3545' }}>
          <Modal.Title>
            <FaTrash className="me-2 text-danger" /> Confirm Delete
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedTrip && (
            <div>
              <p>Are you sure you want to delete this trip?</p>
              <div className="p-3 bg-light rounded">
                <p className="mb-1">
                  <strong>Route:</strong> {selectedTrip.departure} → {selectedTrip.destination}
                </p>
                <p className="mb-1">
                  <strong>Date:</strong> {new Date(selectedTrip.departureTime).toLocaleDateString()}
                </p>
                <p className="mb-0">
                  <strong>Driver:</strong> {getDriverName(selectedTrip)}
                </p>
              </div>
              <p className="text-danger fw-bold mt-3 mb-0">
                This action cannot be undone. All bookings associated with this trip will also be deleted.
              </p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteConfirm}>
            Delete Trip
          </Button>
        </Modal.Footer>
      </Modal>

      <style>{`
        .table > :not(caption) > * > * {
          padding: 1rem 0.75rem;
          vertical-align: middle;
        }
        .btn-outline-danger:hover {
          background-color: #dc3545;
          border-color: #dc3545;
        }
        .btn-outline-danger:hover svg {
          color: white !important;
        }
        .btn-outline-info:hover {
          background-color: #0dcaf0;
          border-color: #0dcaf0;
        }
        .btn-outline-info:hover svg {
          color: white !important;
        }
        .form-select:focus, .form-control:focus {
          border-color: #dc3545;
          box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
        }
      `}</style>
    </div>
  );
};

export default AdminTrips;