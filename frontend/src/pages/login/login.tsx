import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Row, Col, Card, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { FaCar, FaEnvelope, FaLock } from 'react-icons/fa';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // If already logged in, redirect to appropriate dashboard
    if (authService.isAuthenticated()) {
      const role = authService.getUserRole();
      if (role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.login({ email, password });
      
      // Redirect based on role
      if (response.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #000000 0%, #2d2d2d 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <Container fluid>
        <Row className="justify-content-center">
          <Col xs={12} md={10} lg={8}>
            <Card className="shadow-lg border-0" style={{ borderRadius: '20px', overflow: 'hidden' }}>
              <Row className="g-0">
                <Col md={6} className="d-none d-md-block">
                  <div style={{
                    background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
                    height: '100%',
                    padding: '3rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    color: 'white',
                    textAlign: 'center'
                  }}>
                    <FaCar size={80} className="mb-4" />
                    <h1 className="display-4 fw-bold mb-3">RideShare</h1>
                    <p className="lead mb-4">Your trusted carpooling platform</p>
                    <div className="mt-4">
                      <div className="d-flex justify-content-center gap-4 mb-3">
                        <div>
                          <h2 className="display-6 fw-bold">500+</h2>
                          <p>Daily Rides</p>
                        </div>
                        <div>
                          <h2 className="display-6 fw-bold">10k+</h2>
                          <p>Happy Users</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Col>

                <Col md={6}>
                  <Card.Body className="p-5">
                    <div className="text-center mb-4 d-md-none">
                      <div className="d-inline-flex justify-content-center align-items-center bg-danger rounded-circle p-3 mb-3" style={{ width: '70px', height: '70px' }}>
                        <FaCar size={35} color="white" />
                      </div>
                    </div>
                    
                    <h2 className="fw-bold mb-2" style={{ color: '#000000' }}>Welcome Back</h2>
                    <p className="text-muted mb-4">Sign in to your account</p>

                    {error && (
                      <Alert variant="danger" className="mb-4">
                        {error}
                      </Alert>
                    )}

                    <Form onSubmit={handleSubmit}>
                      <Form.Group className="mb-4">
                        <Form.Label className="fw-semibold" style={{ color: '#333' }}>Email Address</Form.Label>
                        <div className="position-relative">
                          <div className="position-absolute top-50 start-0 translate-middle-y ms-3">
                            <FaEnvelope className="text-muted" />
                          </div>
                          <Form.Control
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            size="lg"
                            className="py-3 ps-5"
                            style={{ borderRadius: '10px', border: '1px solid #ddd' }}
                          />
                        </div>
                      </Form.Group>

                      <Form.Group className="mb-4">
                        <Form.Label className="fw-semibold" style={{ color: '#333' }}>Password</Form.Label>
                        <div className="position-relative">
                          <div className="position-absolute top-50 start-0 translate-middle-y ms-3">
                            <FaLock className="text-muted" />
                          </div>
                          <Form.Control
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            size="lg"
                            className="py-3 ps-5"
                            style={{ borderRadius: '10px', border: '1px solid #ddd' }}
                          />
                        </div>
                      </Form.Group>

                      <div className="d-flex justify-content-between align-items-center mb-4">
                        <Form.Check 
                          type="checkbox" 
                          label="Remember me"
                          className="text-muted"
                        />
                        <Link to="/forgot-password" className="text-danger text-decoration-none">
                          Forgot Password?
                        </Link>
                      </div>

                      <Button
                        variant="danger"
                        type="submit"
                        disabled={loading}
                        size="lg"
                        className="w-100 py-3 fw-bold mb-3"
                        style={{ borderRadius: '10px', fontSize: '16px' }}
                      >
                        {loading ? 'Signing in...' : 'Sign In'}
                      </Button>

                      <div className="text-center mt-4">
                        <p className="mb-0 text-muted">
                          Don't have an account?{' '}
                          <Link to="/register" className="text-danger fw-bold text-decoration-none">
                            Create an account
                          </Link>
                        </p>
                      </div>
                    </Form>
                  </Card.Body>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Login;