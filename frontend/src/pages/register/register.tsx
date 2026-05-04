import React, { useState } from 'react';
import { Form, Button, Container, Row, Col, Card, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { FaCar, FaUser, FaEnvelope, FaLock, FaPhone } from 'react-icons/fa';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      await authService.register({
        firstname: formData.firstname,
        lastname: formData.lastname,
        email: formData.email,
        password: formData.password,
        phone: formData.phone
      });

      setSuccess('Registration successful! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
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
      justifyContent: 'center',
      padding: '2rem 0'
    }}>
      <Container fluid>
        <Row className="justify-content-center">
          <Col xs={12} md={10} lg={8}>
            <Card className="shadow-lg border-0" style={{ borderRadius: '20px', overflow: 'hidden' }}>
              <Row className="g-0">
                {/* Left side - Branding */}
                <Col md={5} className="d-none d-md-block">
                  <div style={{
                    background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
                    height: '100%',
                    padding: '2rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    color: 'white',
                    textAlign: 'center'
                  }}>
                    <FaCar size={70} className="mb-4" />
                    <h2 className="fw-bold mb-3">Join RideShare</h2>
                    <p className="mb-4">Start sharing rides and save money today!</p>
                    <div className="mt-3">
                      <p className="small mb-2">✓ Safe & Secure Rides</p>
                      <p className="small mb-2">✓ Save on Fuel Costs</p>
                      <p className="small mb-2">✓ Meet New People</p>
                    </div>
                  </div>
                </Col>

                {/* Right side - Registration Form */}
                <Col md={7}>
                  <Card.Body className="p-4 p-lg-5">
                    <div className="text-center mb-4 d-md-none">
                      <div className="d-inline-flex justify-content-center align-items-center bg-danger rounded-circle p-3 mb-3" style={{ width: '60px', height: '60px' }}>
                        <FaCar size={30} color="white" />
                      </div>
                    </div>
                    
                    <h2 className="fw-bold mb-2">Create Account</h2>
                    <p className="text-muted mb-4">Join RideShare and start sharing rides</p>

                    {error && (
                      <Alert variant="danger" className="mb-4">
                        {error}
                      </Alert>
                    )}

                    {success && (
                      <Alert variant="success" className="mb-4">
                        {success}
                      </Alert>
                    )}

                    <Form onSubmit={handleSubmit}>
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold" style={{ color: '#333' }}>First Name</Form.Label>
                            <div className="position-relative">
                              <div className="position-absolute top-50 start-0 translate-middle-y ms-3">
                                <FaUser className="text-muted" size={14} />
                              </div>
                              <Form.Control
                                type="text"
                                name="firstname"
                                placeholder="Enter first name"
                                value={formData.firstname}
                                onChange={handleChange}
                                required
                                className="py-2 ps-5"
                                style={{ borderRadius: '8px', border: '1px solid #ddd' }}
                              />
                            </div>
                          </Form.Group>
                        </Col>

                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold" style={{ color: '#333' }}>Last Name</Form.Label>
                            <div className="position-relative">
                              <div className="position-absolute top-50 start-0 translate-middle-y ms-3">
                                <FaUser className="text-muted" size={14} />
                              </div>
                              <Form.Control
                                type="text"
                                name="lastname"
                                placeholder="Enter last name"
                                value={formData.lastname}
                                onChange={handleChange}
                                required
                                className="py-2 ps-5"
                                style={{ borderRadius: '8px', border: '1px solid #ddd' }}
                              />
                            </div>
                          </Form.Group>
                        </Col>
                      </Row>

                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold" style={{ color: '#333' }}>Email Address</Form.Label>
                        <div className="position-relative">
                          <div className="position-absolute top-50 start-0 translate-middle-y ms-3">
                            <FaEnvelope className="text-muted" />
                          </div>
                          <Form.Control
                            type="email"
                            name="email"
                            placeholder="Enter email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="py-2 ps-5"
                            style={{ borderRadius: '8px', border: '1px solid #ddd' }}
                          />
                        </div>
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold" style={{ color: '#333' }}>Phone Number</Form.Label>
                        <div className="position-relative">
                          <div className="position-absolute top-50 start-0 translate-middle-y ms-3">
                            <FaPhone className="text-muted" />
                          </div>
                          <Form.Control
                            type="tel"
                            name="phone"
                            placeholder="Enter phone number"
                            value={formData.phone}
                            onChange={handleChange}
                            required
                            className="py-2 ps-5"
                            style={{ borderRadius: '8px', border: '1px solid #ddd' }}
                          />
                        </div>
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold" style={{ color: '#333' }}>Password</Form.Label>
                        <div className="position-relative">
                          <div className="position-absolute top-50 start-0 translate-middle-y ms-3">
                            <FaLock className="text-muted" />
                          </div>
                          <Form.Control
                            type="password"
                            name="password"
                            placeholder="Create password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            className="py-2 ps-5"
                            style={{ borderRadius: '8px', border: '1px solid #ddd' }}
                          />
                        </div>
                      </Form.Group>

                      <Form.Group className="mb-4">
                        <Form.Label className="fw-semibold" style={{ color: '#333' }}>Confirm Password</Form.Label>
                        <div className="position-relative">
                          <div className="position-absolute top-50 start-0 translate-middle-y ms-3">
                            <FaLock className="text-muted" />
                          </div>
                          <Form.Control
                            type="password"
                            name="confirmPassword"
                            placeholder="Confirm password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                            className="py-2 ps-5"
                            style={{ borderRadius: '8px', border: '1px solid #ddd' }}
                          />
                        </div>
                      </Form.Group>

                      <Button
                        variant="danger"
                        type="submit"
                        disabled={loading}
                        className="w-100 py-2 fw-bold mb-3"
                        style={{ borderRadius: '8px', fontSize: '16px' }}
                      >
                        {loading ? 'Creating Account...' : 'Sign Up'}
                      </Button>

                      <div className="text-center">
                        <p className="mb-0 text-muted">
                          Already have an account?{' '}
                          <Link to="/login" className="text-danger fw-bold text-decoration-none">
                            Sign In
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

export default Register;