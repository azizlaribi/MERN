import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { tripService } from '../../services/tripService';
import { 
  FaCar, FaMapMarkerAlt, FaCalendarAlt, FaUserFriends, 
  FaPlus, FaSearch, FaBookmark, FaRoute, FaClock, 
  FaMoneyBillWave, FaShieldAlt, FaHeadset, FaArrowRight,
  FaStar
} from 'react-icons/fa';
import { GiRoundStar } from 'react-icons/gi';
import Sidebar from '../../components/Sidebar';

const Dashboard: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [recentTrips, setRecentTrips] = useState([]);
  const [stats, setStats] = useState({
    totalTrips: 0,
    totalBookings: 0,
    upcomingTrips: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }
    
    const userRole = authService.getUserRole();
    if (userRole !== 'user') {
      navigate('/admin/dashboard');
    }
    
    fetchDashboardData();
  }, [navigate]);

  const fetchDashboardData = async () => {
    try {
      const myTrips = await tripService.getMyTrips();
      const myBookings = await tripService.getMyBookings();
      
      setStats({
        totalTrips: myTrips.trips?.length || 0,
        totalBookings: myBookings.trips?.length || 0,
        upcomingTrips: myTrips.trips?.filter((t: any) => t.status === 'upcoming').length || 0
      });
      
      const recent = [...(myTrips.trips || []), ...(myBookings.trips || [])]
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 4);
      setRecentTrips(recent);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };

  const userName = localStorage.getItem('name') || 'User';
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
          {/* Hero Section */}
          <div className="mb-5" style={{
            background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)',
            borderRadius: '24px',
            padding: '40px',
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', right: '-50px', top: '-50px', opacity: 0.1 }}>
              <FaCar size={300} />
            </div>
            <Row className="align-items-center">
              <Col lg={8}>
                <h1 className="display-4 fw-bold mb-3" style={{ letterSpacing: '-0.5px' }}>
                  Welcome back, {userName}! 👋
                </h1>
                <p className="lead mb-4" style={{ opacity: 0.9 }}>
                  Ready to share a ride or find your next adventure?
                </p>
                <div className="d-flex gap-3 flex-wrap">
                  <Button 
                    variant="danger" 
                    size="lg"
                    onClick={() => navigate('/trips/create')}
                    style={{ borderRadius: '12px', padding: '12px 32px' }}
                  >
                    <FaPlus className="me-2" /> Create a Trip
                  </Button>
                  <Button 
                    variant="outline-light" 
                    size="lg"
                    onClick={() => navigate('/trips/browse')}
                    style={{ borderRadius: '12px', padding: '12px 32px' }}
                  >
                    <FaSearch className="me-2" /> Find a Ride
                  </Button>
                </div>
              </Col>
            </Row>
          </div>

          {/* Stats Cards */}
          <Row className="g-4 mb-5">
            <Col lg={4}>
              <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '20px', transition: 'transform 0.3s', cursor: 'pointer' }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-5px)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                onClick={() => navigate('/trips/my-trips')}
              >
                <Card.Body className="p-4">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <div className="bg-danger bg-opacity-10 rounded-circle p-3 mb-3" style={{ width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FaCar size={28} className="text-danger" />
                      </div>
                      <h6 className="text-muted mb-2">My Trips</h6>
                      <h2 className="display-3 fw-bold mb-0">{stats.totalTrips}</h2>
                      <small className="text-muted">Trips created</small>
                    </div>
                    <FaArrowRight className="text-muted" />
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={4}>
              <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '20px', transition: 'transform 0.3s', cursor: 'pointer' }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-5px)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                onClick={() => navigate('/trips/my-bookings')}
              >
                <Card.Body className="p-4">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <div className="bg-success bg-opacity-10 rounded-circle p-3 mb-3" style={{ width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FaBookmark size={28} className="text-success" />
                      </div>
                      <h6 className="text-muted mb-2">My Bookings</h6>
                      <h2 className="display-3 fw-bold mb-0">{stats.totalBookings}</h2>
                      <small className="text-muted">Trips booked</small>
                    </div>
                    <FaArrowRight className="text-muted" />
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={4}>
              <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '20px', transition: 'transform 0.3s', cursor: 'pointer' }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-5px)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                <Card.Body className="p-4">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <div className="bg-warning bg-opacity-10 rounded-circle p-3 mb-3" style={{ width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FaCalendarAlt size={28} className="text-warning" />
                      </div>
                      <h6 className="text-muted mb-2">Upcoming Trips</h6>
                      <h2 className="display-3 fw-bold mb-0">{stats.upcomingTrips}</h2>
                      <small className="text-muted">Scheduled rides</small>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Recent Activity Section */}
          <Row className="mb-5">
            <Col>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                  <h3 className="fw-bold mb-1">Recent Activity</h3>
                  <p className="text-muted">Your latest trips and bookings</p>
                </div>
                <Button 
                  variant="link" 
                  className="text-danger text-decoration-none"
                  onClick={() => navigate('/trips/browse')}
                >
                  View All <FaArrowRight className="ms-1" />
                </Button>
              </div>
              
              {recentTrips.length === 0 ? (
                <Card className="border-0 shadow-sm text-center py-5" style={{ borderRadius: '20px' }}>
                  <Card.Body>
                    <FaCar size={60} className="text-muted opacity-25 mb-3" />
                    <h5>No recent activity</h5>
                    <p className="text-muted">Start by creating or booking your first trip!</p>
                    <Button variant="danger" onClick={() => navigate('/trips/create')}>
                      Create a Trip
                    </Button>
                  </Card.Body>
                </Card>
              ) : (
                <Row className="g-4">
                  {recentTrips.map((trip: any, index: number) => (
                    <Col key={index} lg={6}>
                      <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px', transition: 'transform 0.3s' }}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-3px)')}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                      >
                        <Card.Body className="p-4">
                          <div className="d-flex justify-content-between align-items-start mb-3">
                            <div className="d-flex align-items-center gap-2">
                              <div className="bg-danger rounded-circle p-2" style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <FaRoute size={16} color="white" />
                              </div>
                              <span className="badge bg-success">{trip.status || 'upcoming'}</span>
                            </div>
                            <small className="text-muted">
                              <FaClock className="me-1" />
                              {new Date(trip.departureTime).toLocaleDateString()}
                            </small>
                          </div>
                          
                          <div className="mb-3">
                            <div className="d-flex align-items-center mb-2">
                              <div className="me-3 text-center">
                                <div className="fw-bold">{trip.departure.substring(0, 3)}</div>
                                <div className="text-muted small">Departure</div>
                              </div>
                              <div className="flex-grow-1 px-3">
                                <div className="border-top border-2 border-danger position-relative">
                                  <div className="position-absolute top-50 start-50 translate-middle bg-white px-2">
                                    <FaArrowRight className="text-danger" size={14} />
                                  </div>
                                </div>
                              </div>
                              <div className="text-center">
                                <div className="fw-bold">{trip.destination.substring(0, 3)}</div>
                                <div className="text-muted small">Arrival</div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="d-flex justify-content-between align-items-center pt-2">
                            <div>
                              <small className="text-muted">Price per seat</small>
                              <div className="fw-bold text-danger">{trip.pricePerSeat} TND</div>
                            </div>
                            <Button 
                              variant="outline-danger" 
                              size="sm"
                              onClick={() => navigate(`/trips/${trip._id}`)}
                              style={{ borderRadius: '10px' }}
                            >
                              View Details
                            </Button>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              )}
            </Col>
          </Row>

          {/* Features Grid */}
          <Row className="mt-4">
            <Col>
              <h3 className="fw-bold text-center mb-5">Why Choose RideShare?</h3>
              <Row className="g-4">
                <Col lg={3} md={6}>
                  <Card className="border-0 shadow-sm text-center h-100" style={{ borderRadius: '20px', transition: 'transform 0.3s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-5px)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                  >
                    <Card.Body className="p-4">
                      <div className="bg-danger bg-opacity-10 rounded-circle d-inline-flex p-3 mb-3" style={{ width: '70px', height: '70px', alignItems: 'center', justifyContent: 'center' }}>
                        <FaMoneyBillWave size={32} className="text-danger" />
                      </div>
                      <Card.Title className="fw-bold mb-2">Save Money</Card.Title>
                      <Card.Text className="text-muted">
                        Share fuel costs and save up to 70% compared to driving alone
                      </Card.Text>
                    </Card.Body>
                  </Card>
                </Col>
                <Col lg={3} md={6}>
                  <Card className="border-0 shadow-sm text-center h-100" style={{ borderRadius: '20px', transition: 'transform 0.3s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-5px)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                  >
                    <Card.Body className="p-4">
                      <div className="bg-success bg-opacity-10 rounded-circle d-inline-flex p-3 mb-3" style={{ width: '70px', height: '70px', alignItems: 'center', justifyContent: 'center' }}>
                        <FaUserFriends size={32} className="text-success" />
                      </div>
                      <Card.Title className="fw-bold mb-2">Meet People</Card.Title>
                      <Card.Text className="text-muted">
                        Connect with like-minded travelers in your community
                      </Card.Text>
                    </Card.Body>
                  </Card>
                </Col>
                <Col lg={3} md={6}>
                  <Card className="border-0 shadow-sm text-center h-100" style={{ borderRadius: '20px', transition: 'transform 0.3s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-5px)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                  >
                    <Card.Body className="p-4">
                      <div className="bg-warning bg-opacity-10 rounded-circle d-inline-flex p-3 mb-3" style={{ width: '70px', height: '70px', alignItems: 'center', justifyContent: 'center' }}>
                        <FaShieldAlt size={32} className="text-warning" />
                      </div>
                      <Card.Title className="fw-bold mb-2">Safe & Secure</Card.Title>
                      <Card.Text className="text-muted">
                        Verified users and secure payments for peace of mind
                      </Card.Text>
                    </Card.Body>
                  </Card>
                </Col>
                <Col lg={3} md={6}>
                  <Card className="border-0 shadow-sm text-center h-100" style={{ borderRadius: '20px', transition: 'transform 0.3s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-5px)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                  >
                    <Card.Body className="p-4">
                      <div className="bg-info bg-opacity-10 rounded-circle d-inline-flex p-3 mb-3" style={{ width: '70px', height: '70px', alignItems: 'center', justifyContent: 'center' }}>
                        <FaHeadset size={32} className="text-info" />
                      </div>
                      <Card.Title className="fw-bold mb-2">24/7 Support</Card.Title>
                      <Card.Text className="text-muted">
                        Our team is always here to help you anytime
                      </Card.Text>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Col>
          </Row>

          {/* Testimonial Section */}
          <Row className="mt-5">
            <Col>
              <Card className="border-0 shadow-sm" style={{ borderRadius: '20px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <Card.Body className="p-5 text-center text-white">
                  <GiRoundStar size={40} className="mb-3 opacity-75" />
                  <h3 className="fw-bold mb-3">Join thousands of happy riders!</h3>
                  <p className="lead mb-0">"RideShare has transformed my daily commute. I've saved money and made great friends along the way!"</p>
                  <div className="mt-3">
                    <FaStar className="text-warning me-1" />
                    <FaStar className="text-warning me-1" />
                    <FaStar className="text-warning me-1" />
                    <FaStar className="text-warning me-1" />
                    <FaStar className="text-warning me-1" />
                    <small className="ms-2 opacity-75">4.9 from 10,000+ reviews</small>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </div>
  );
};

export default Dashboard;