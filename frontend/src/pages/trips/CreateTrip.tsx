import React, { useState } from 'react';
import { Form, Button, Container, Row, Col, Card, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaCar, FaMapMarkerAlt, FaCalendarAlt, FaMoneyBill, FaInfoCircle, FaPaw, FaSmoking, FaMusic, FaArrowLeft } from 'react-icons/fa';
import { tripService } from '../../services/tripService';
import Sidebar from '../../components/Sidebar';

const CreateTrip: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [formData, setFormData] = useState({
    departure: '',
    destination: '',
    departureTime: '',
    carType: 'sedan',
    carModel: '',
    licensePlate: '',
    totalSeats: 4,
    pricePerSeat: 0,
    description: '',
    allowPets: false,
    allowSmoking: false,
    allowMusic: true,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Validate departure time is in the future
      if (new Date(formData.departureTime) <= new Date()) {
        setError('Departure time must be in the future');
        setLoading(false);
        return;
      }

      await tripService.createTrip(formData);
      setSuccess('Trip created successfully!');
      setTimeout(() => {
        navigate('/trips/my-trips');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create trip');
    } finally {
      setLoading(false);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const sidebarWidth = isSidebarCollapsed ? '80px' : '260px';

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
          <Row className="justify-content-center">
            <Col lg={8}>
              {/* Back Button */}
              <Button
                variant="link"
                onClick={() => navigate('/dashboard')}
                className="mb-3 text-decoration-none"
                style={{ color: '#6c757d' }}
              >
                <FaArrowLeft className="me-2" /> Back to Dashboard
              </Button>

              <Card className="shadow-sm border-0" style={{ borderRadius: '20px' }}>
                <Card.Header className="bg-white border-0 pt-4" style={{ borderRadius: '20px 20px 0 0' }}>
                  <div className="d-flex align-items-center">
                    <div className="bg-danger bg-opacity-10 rounded-circle p-3 me-3" style={{ width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FaCar size={30} className="text-danger" />
                    </div>
                    <div>
                      <h2 className="mb-0 fw-bold">Create a New Trip</h2>
                      <p className="text-muted mb-0">Share your ride and earn money</p>
                    </div>
                  </div>
                </Card.Header>
                <Card.Body className="p-4">
                  {error && <Alert variant="danger" style={{ borderRadius: '12px' }}>{error}</Alert>}
                  {success && <Alert variant="success" style={{ borderRadius: '12px' }}>{success}</Alert>}

                  <Form onSubmit={handleSubmit}>
                    {/* Trip Details Section */}
                    <div className="mb-4">
                      <h5 className="fw-bold mb-3" style={{ color: '#dc3545' }}>📍 Trip Details</h5>
                      <Row className="g-3">
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label className="fw-semibold">Departure <span className="text-danger">*</span></Form.Label>
                            <div className="position-relative">
                              <FaMapMarkerAlt className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                              <Form.Control
                                type="text"
                                name="departure"
                                placeholder="City or address"
                                value={formData.departure}
                                onChange={handleChange}
                                required
                                className="ps-5 py-2"
                                style={{ borderRadius: '10px' }}
                              />
                            </div>
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label className="fw-semibold">Destination <span className="text-danger">*</span></Form.Label>
                            <div className="position-relative">
                              <FaMapMarkerAlt className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                              <Form.Control
                                type="text"
                                name="destination"
                                placeholder="City or address"
                                value={formData.destination}
                                onChange={handleChange}
                                required
                                className="ps-5 py-2"
                                style={{ borderRadius: '10px' }}
                              />
                            </div>
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label className="fw-semibold">Departure Time <span className="text-danger">*</span></Form.Label>
                            <div className="position-relative">
                              <FaCalendarAlt className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                              <Form.Control
                                type="datetime-local"
                                name="departureTime"
                                value={formData.departureTime}
                                onChange={handleChange}
                                required
                                className="ps-5 py-2"
                                style={{ borderRadius: '10px' }}
                              />
                            </div>
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label className="fw-semibold">Price per Seat (TND) <span className="text-danger">*</span></Form.Label>
                            <div className="position-relative">
                              <FaMoneyBill className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                              <Form.Control
                                type="number"
                                name="pricePerSeat"
                                placeholder="0"
                                value={formData.pricePerSeat}
                                onChange={handleChange}
                                required
                                min="0"
                                step="1"
                                className="ps-5 py-2"
                                style={{ borderRadius: '10px' }}
                              />
                            </div>
                          </Form.Group>
                        </Col>
                      </Row>
                    </div>

                    {/* Vehicle Information Section */}
                    <div className="mb-4">
                      <h5 className="fw-bold mb-3" style={{ color: '#dc3545' }}>🚗 Vehicle Information</h5>
                      <Row className="g-3">
                        <Col md={4}>
                          <Form.Group>
                            <Form.Label className="fw-semibold">Car Type <span className="text-danger">*</span></Form.Label>
                            <Form.Select 
                              name="carType" 
                              value={formData.carType} 
                              onChange={handleChange} 
                              required
                              style={{ borderRadius: '10px' }}
                            >
                              <option value="compact">Compact</option>
                              <option value="sedan">Sedan</option>
                              <option value="suv">SUV</option>
                              <option value="van">Van</option>
                              <option value="truck">Truck</option>
                            </Form.Select>
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <Form.Group>
                            <Form.Label className="fw-semibold">Car Model</Form.Label>
                            <Form.Control
                              type="text"
                              name="carModel"
                              placeholder="e.g., Toyota Corolla"
                              value={formData.carModel}
                              onChange={handleChange}
                              style={{ borderRadius: '10px' }}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <Form.Group>
                            <Form.Label className="fw-semibold">License Plate</Form.Label>
                            <Form.Control
                              type="text"
                              name="licensePlate"
                              placeholder="e.g., TUN 1234"
                              value={formData.licensePlate}
                              onChange={handleChange}
                              style={{ borderRadius: '10px' }}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label className="fw-semibold">Total Seats <span className="text-danger">*</span></Form.Label>
                            <Form.Control
                              type="number"
                              name="totalSeats"
                              value={formData.totalSeats}
                              onChange={handleChange}
                              required
                              min="1"
                              max="8"
                              style={{ borderRadius: '10px' }}
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                    </div>

                    {/* Preferences Section */}
                    <div className="mb-4">
                      <h5 className="fw-bold mb-3" style={{ color: '#dc3545' }}>🎯 Preferences</h5>
                      <div className="d-flex gap-4 flex-wrap">
                        <Form.Check
                          type="checkbox"
                          label={<><FaPaw className="me-1 text-info" /> Allow Pets</>}
                          name="allowPets"
                          checked={formData.allowPets}
                          onChange={handleChange}
                          className="fw-semibold"
                        />
                        <Form.Check
                          type="checkbox"
                          label={<><FaSmoking className="me-1 text-warning" /> Allow Smoking</>}
                          name="allowSmoking"
                          checked={formData.allowSmoking}
                          onChange={handleChange}
                          className="fw-semibold"
                        />
                        <Form.Check
                          type="checkbox"
                          label={<><FaMusic className="me-1 text-success" /> Allow Music</>}
                          name="allowMusic"
                          checked={formData.allowMusic}
                          onChange={handleChange}
                          className="fw-semibold"
                        />
                      </div>
                    </div>

                    {/* Description Section */}
                    <div className="mb-4">
                      <h5 className="fw-bold mb-3" style={{ color: '#dc3545' }}>📝 Additional Information</h5>
                      <Form.Group>
                        <div className="position-relative">
                          <FaInfoCircle className="position-absolute top-0 start-0 mt-3 ms-3 text-muted" />
                          <Form.Control
                            as="textarea"
                            name="description"
                            rows={4}
                            placeholder="Any extra information for passengers (luggage space, meeting point, etc.)..."
                            value={formData.description}
                            onChange={handleChange}
                            className="ps-5"
                            style={{ borderRadius: '10px' }}
                          />
                        </div>
                      </Form.Group>
                    </div>

                    {/* Action Buttons */}
                    <div className="d-flex gap-3">
                      <Button
                        variant="danger"
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2"
                        style={{ borderRadius: '10px', fontWeight: '600' }}
                      >
                        {loading ? 'Creating...' : 'Create Trip'}
                      </Button>
                      <Button
                        variant="outline-secondary"
                        onClick={() => navigate('/dashboard')}
                        className="px-4 py-2"
                        style={{ borderRadius: '10px' }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </Form>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </div>
  );
};

export default CreateTrip;