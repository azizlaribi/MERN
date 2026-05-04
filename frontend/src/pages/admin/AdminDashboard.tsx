// AdminDashboard.tsx (fixed for correct API response structure)
import React, { useEffect, useState } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Spinner,
  Badge,
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import {
  FaUsers,
  FaUserCheck,
  FaUserTimes,
  FaCar,
  FaChartLine,
  FaRocket,
  FaCalendarAlt,
  FaArrowRight,
} from 'react-icons/fa';
import { authService } from '../../services/authService';
import { userService, type User } from '../../services/Userservice';
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

const AdminDashboard: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    adminUsers: 0,
    regularUsers: 0,
    totalTrips: 0,
    upcomingTrips: 0,
    completedTrips: 0,
    cancelledTrips: 0,
    totalBookings: 0,
  });
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [recentTrips, setRecentTrips] = useState<Trip[]>([]);
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

    fetchDashboardData();
  }, [navigate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      let allUsers: User[] = [];
      let adminUsers: User[] = [];
      
      try {
        const allUsersResponse = await userService.getAllUsers();
        allUsers = Array.isArray(allUsersResponse) ? allUsersResponse : allUsersResponse?.data || [];
      } catch (err) {
        console.error('Error fetching users:', err);
      }
      
      try {
        const adminUsersResponse = await userService.getAllAdmins();
        adminUsers = Array.isArray(adminUsersResponse) ? adminUsersResponse : adminUsersResponse?.data || [];
      } catch (err) {
        console.error('Error fetching admins:', err);
      }
      
      const combinedUsers = [...allUsers, ...adminUsers];
      
      const activeUsers = combinedUsers.filter(u => u.isActive).length;
      const inactiveUsers = combinedUsers.filter(u => !u.isActive).length;
      const regularUsers = combinedUsers.filter(u => u.role === 'user').length;
      const adminCount = combinedUsers.filter(u => u.role === 'admin').length;
      
      let trips: Trip[] = [];
      try {
        const tripsResponse = await tripService.getAllTrips();
        // The API returns { message, count, trips }
        if (tripsResponse && tripsResponse.trips && Array.isArray(tripsResponse.trips)) {
          trips = tripsResponse.trips;
        } else if (Array.isArray(tripsResponse)) {
          trips = tripsResponse;
        } else if (tripsResponse?.data && Array.isArray(tripsResponse.data)) {
          trips = tripsResponse.data;
        } else {
          trips = [];
        }
      } catch (err) {
        console.error('Error fetching trips:', err);
      }
      
      const upcomingTrips = trips.filter((t: Trip) => t.status === 'upcoming').length;
      const completedTrips = trips.filter((t: Trip) => t.status === 'completed').length;
      const cancelledTrips = trips.filter((t: Trip) => t.status === 'cancelled').length;
      const totalBookings = trips.reduce((sum: number, t: Trip) => sum + (t.passengers?.length || 0), 0);
      
      setStats({
        totalUsers: combinedUsers.length,
        activeUsers,
        inactiveUsers,
        adminUsers: adminCount,
        regularUsers,
        totalTrips: trips.length,
        upcomingTrips,
        completedTrips,
        cancelledTrips,
        totalBookings,
      });
      
      setRecentUsers(combinedUsers.slice(0, 5));
      setRecentTrips(trips.slice(0, 5));
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const sidebarWidth = isSidebarCollapsed ? '80px' : '260px';

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
              <div>
                <h1 className="display-6 fw-bold mb-2" style={{ color: '#000' }}>
                  Dashboard
                </h1>
                <p style={{ color: '#6c757d' }}>
                  Welcome back, {authService.getUserEmail() || 'Admin'}!
                </p>
              </div>
            </Col>
          </Row>

          {/* Stats Cards */}
          <Row className="g-4 mb-4">
            <Col lg={3} md={6}>
              <Card className="border-0 shadow-sm h-100" style={{ borderTop: '4px solid #dc3545' }}>
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <p className="text-muted mb-1 small">Total Users</p>
                      <h2 className="fw-bold mb-0" style={{ color: '#000' }}>{stats.totalUsers}</h2>
                    </div>
                    <div className="rounded-circle p-3" style={{ backgroundColor: 'rgba(220, 53, 69, 0.1)' }}>
                      <FaUsers size={24} color="#dc3545" />
                    </div>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <small className="text-muted">
                      <FaUserCheck className="me-1" size={12} /> {stats.activeUsers} Active
                    </small>
                    <small className="text-muted">
                      <FaUserTimes className="me-1" size={12} /> {stats.inactiveUsers} Inactive
                    </small>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={3} md={6}>
              <Card className="border-0 shadow-sm h-100" style={{ borderTop: '4px solid #000' }}>
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <p className="text-muted mb-1 small">User Breakdown</p>
                      <h2 className="fw-bold mb-0" style={{ color: '#000' }}>{stats.regularUsers}</h2>
                    </div>
                    <div className="rounded-circle p-3" style={{ backgroundColor: 'rgba(0, 0, 0, 0.1)' }}>
                      <FaUsers size={24} color="#000" />
                    </div>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <small className="text-muted">
                      Regular: {stats.regularUsers}
                    </small>
                    <small className="text-muted">
                      Admins: {stats.adminUsers}
                    </small>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={3} md={6}>
              <Card className="border-0 shadow-sm h-100" style={{ borderTop: '4px solid #dc3545' }}>
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <p className="text-muted mb-1 small">Total Trips</p>
                      <h2 className="fw-bold mb-0" style={{ color: '#000' }}>{stats.totalTrips}</h2>
                    </div>
                    <div className="rounded-circle p-3" style={{ backgroundColor: 'rgba(220, 53, 69, 0.1)' }}>
                      <FaCar size={24} color="#dc3545" />
                    </div>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <small className="text-muted">
                      Upcoming: {stats.upcomingTrips}
                    </small>
                    <small className="text-muted">
                      Completed: {stats.completedTrips}
                    </small>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={3} md={6}>
              <Card className="border-0 shadow-sm h-100" style={{ borderTop: '4px solid #000' }}>
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <p className="text-muted mb-1 small">Total Bookings</p>
                      <h2 className="fw-bold mb-0" style={{ color: '#000' }}>{stats.totalBookings}</h2>
                    </div>
                    <div className="rounded-circle p-3" style={{ backgroundColor: 'rgba(0, 0, 0, 0.1)' }}>
                      <FaChartLine size={24} color="#000" />
                    </div>
                  </div>
                  <p className="text-muted small mb-0">
                    <FaCalendarAlt className="me-1" size={12} /> All time bookings
                  </p>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Additional Stats Row */}
          <Row className="g-4 mb-4">
            <Col lg={4}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="fw-bold mb-0" style={{ color: '#000' }}>Trip Status</h6>
                    <FaRocket color="#dc3545" />
                  </div>
                  <div className="mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <small>Upcoming Trips</small>
                      <small className="fw-bold">{stats.upcomingTrips}</small>
                    </div>
                    <div className="progress" style={{ height: '8px' }}>
                      <div 
                        className="progress-bar" 
                        style={{ 
                          width: `${stats.totalTrips ? (stats.upcomingTrips / stats.totalTrips) * 100 : 0}%`,
                          backgroundColor: '#28a745'
                        }}
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <small>Completed Trips</small>
                      <small className="fw-bold">{stats.completedTrips}</small>
                    </div>
                    <div className="progress" style={{ height: '8px' }}>
                      <div 
                        className="progress-bar" 
                        style={{ 
                          width: `${stats.totalTrips ? (stats.completedTrips / stats.totalTrips) * 100 : 0}%`,
                          backgroundColor: '#17a2b8'
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="d-flex justify-content-between mb-1">
                      <small>Cancelled Trips</small>
                      <small className="fw-bold">{stats.cancelledTrips}</small>
                    </div>
                    <div className="progress" style={{ height: '8px' }}>
                      <div 
                        className="progress-bar" 
                        style={{ 
                          width: `${stats.totalTrips ? (stats.cancelledTrips / stats.totalTrips) * 100 : 0}%`,
                          backgroundColor: '#dc3545'
                        }}
                      />
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={4}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="fw-bold mb-0" style={{ color: '#000' }}>User Activity</h6>
                    <FaUserCheck color="#dc3545" />
                  </div>
                  <div className="text-center py-3">
                    <h1 className="display-4 fw-bold" style={{ color: '#dc3545' }}>
                      {stats.totalUsers ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}%
                    </h1>
                    <p className="text-muted mt-2">Active Users Rate</p>
                    <div className="mt-3">
                      <Badge bg="success" className="me-2">Active: {stats.activeUsers}</Badge>
                      <Badge bg="secondary">Inactive: {stats.inactiveUsers}</Badge>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={4}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="fw-bold mb-0" style={{ color: '#000' }}>Quick Actions</h6>
                    <FaArrowRight color="#dc3545" />
                  </div>
                  <div className="d-grid gap-2">
                    <Button 
                      variant="outline-danger" 
                      onClick={() => navigate('/admin/users')}
                      className="d-flex align-items-center justify-content-between"
                    >
                      Manage Users <FaUsers />
                    </Button>
                    <Button 
                      variant="outline-dark"
                      onClick={() => navigate('/admin/trips')}
                      className="d-flex align-items-center justify-content-between"
                    >
                      Manage Trips <FaCar />
                    </Button>
                    <Button 
                      variant="outline-secondary"
                      onClick={() => fetchDashboardData()}
                      className="d-flex align-items-center justify-content-between"
                    >
                      Refresh Data <FaChartLine />
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Recent Users & Trips */}
          <Row className="g-4">
            <Col lg={6}>
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white border-0 pt-4">
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="fw-bold mb-0" style={{ color: '#000' }}>Recent Users</h5>
                    <Button 
                      variant="link" 
                      className="text-decoration-none" 
                      style={{ color: '#dc3545' }}
                      onClick={() => navigate('/admin/users')}
                    >
                      View All <FaArrowRight size={12} />
                    </Button>
                  </div>
                </Card.Header>
                <Card.Body>
                  <div className="table-responsive">
                    <table className="table table-hover align-middle">
                      <thead style={{ backgroundColor: '#f8f9fa' }}>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentUsers.map((user) => (
                          <tr key={user._id}>
                            <td className="fw-medium">{user.firstname} {user.lastname}</td>
                            <td>{user.email}</td>
                            <td>
                              <Badge bg={user.role === 'admin' ? 'danger' : 'secondary'}>
                                {user.role.toUpperCase()}
                              </Badge>
                            </td>
                            <td>
                              <Badge bg={user.isActive ? 'success' : 'warning'}>
                                {user.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                        {recentUsers.length === 0 && (
                          <tr>
                            <td colSpan={4} className="text-center text-muted py-4">
                              No users found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={6}>
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white border-0 pt-4">
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="fw-bold mb-0" style={{ color: '#000' }}>Recent Trips</h5>
                    <Button 
                      variant="link" 
                      className="text-decoration-none" 
                      style={{ color: '#dc3545' }}
                      onClick={() => navigate('/admin/trips')}
                    >
                      View All <FaArrowRight size={12} />
                    </Button>
                  </div>
                </Card.Header>
                <Card.Body>
                  <div className="table-responsive">
                    <table className="table table-hover align-middle">
                      <thead style={{ backgroundColor: '#f8f9fa' }}>
                        <tr>
                          <th>Route</th>
                          <th>Date</th>
                          <th>Seats</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentTrips.map((trip) => (
                          <tr key={trip._id}>
                            <td>
                              <div className="fw-medium">{trip.departure}</div>
                              <small className="text-muted">→ {trip.destination}</small>
                            </td>
                            <td>{new Date(trip.departureTime).toLocaleDateString()}</td>
                            <td>{trip.availableSeats}/{trip.totalSeats}</td>
                            <td>
                              <Badge 
                                bg={
                                  trip.status === 'upcoming' ? 'success' :
                                  trip.status === 'completed' ? 'info' : 'danger'
                                }
                              >
                                {trip.status.toUpperCase()}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                        {recentTrips.length === 0 && (
                          <tr>
                            <td colSpan={4} className="text-center text-muted py-4">
                              No trips found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>

      <style>{`
        .progress {
          background-color: #e9ecef;
          border-radius: 10px;
        }
        .table > :not(caption) > * > * {
          padding: 1rem 0.75rem;
        }
        .btn-outline-danger:hover {
          background-color: #dc3545;
          border-color: #dc3545;
        }
        .btn-outline-danger:hover svg {
          color: white !important;
        }
        .card {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .card:hover {
          transform: translateY(-2px);
          box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;