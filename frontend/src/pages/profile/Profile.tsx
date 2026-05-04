import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Badge, Modal, Form, ProgressBar, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import {
  FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaEdit, FaShieldAlt,
  FaCheckCircle, FaStar, FaCar, FaRoute, FaMoneyBillWave, FaLock,
  FaTrash, FaExclamationTriangle, FaBell, FaLanguage, FaHeartbeat,
  FaIdCard, FaCalendarAlt, FaSignOutAlt
} from 'react-icons/fa';
import { authService } from '../../services/authService';
import { userService } from '../../services/Userservice';
import type { User, UserStats } from '../../services/Userservice';
import Sidebar from '../../components/Sidebar';

const Profile: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Stats
  const [stats, setStats] = useState<UserStats | null>(null);

  // Edit profile modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ firstname: '', lastname: '', phone: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  // Photo upload
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoLoading, setPhotoLoading] = useState(false);

  // Change password modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Delete account modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Preferences modal
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [prefsForm, setPrefsForm] = useState({
    emailNotifications: true,
    language: 'English' as 'English' | 'French' | 'Arabic',
    privacy: 'Friends only' as 'Public' | 'Friends only' | 'Private',
  });
  const [prefsLoading, setPrefsLoading] = useState(false);
  const [prefsError, setPrefsError] = useState('');
  const [prefsSuccess, setPrefsSuccess] = useState('');

  // Emergency contact (local state / placeholder)
  const [emergencyContact, setEmergencyContact] = useState({ name: '', phone: '', relation: '' });
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }
    loadUser();
    loadStats();
  }, [navigate]);

  const loadUser = async () => {
    setLoading(true);
    try {
      const email = authService.getUserEmail();
      if (email) {
        const fetched = await userService.getUserByEmail(email);
        setUser(fetched);
        setEditForm({
          firstname: fetched.firstname,
          lastname: fetched.lastname,
          phone: fetched.phone ? String(fetched.phone) : '',
        });
        if (fetched.preferences) {
          setPrefsForm({
            emailNotifications: fetched.preferences.emailNotifications,
            language: fetched.preferences.language,
            privacy: fetched.preferences.privacy,
          });
        }
      }
    } catch {
      // Fallback to localStorage data
      const name = localStorage.getItem('name') || '';
      const [firstname = '', ...rest] = name.split(' ');
      setUser({
        _id: localStorage.getItem('userId') || '',
        firstname,
        lastname: rest.join(' '),
        email: authService.getUserEmail() || '',
        isActive: true,
        role: 'user',
      });
      setEditForm({ firstname, lastname: rest.join(' '), phone: '' });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const s = await userService.getUserStats();
      setStats(s);
    } catch {
      // silently fail — stats stay null
    }
  };

  /* ── Helpers ── */
  const sidebarWidth = isSidebarCollapsed ? '80px' : '260px';
  const toggleSidebar = () => setIsSidebarCollapsed((p) => !p);

  const fullName = user ? `${user.firstname} ${user.lastname}`.trim() : '';
  const initials = user
    ? `${user.firstname?.[0] ?? ''}${user.lastname?.[0] ?? ''}`.toUpperCase()
    : '?';

  // Profile completion score
  const completionFields = [
    !!user?.firstname,
    !!user?.lastname,
    !!user?.email,
    !!user?.phone,
    !!user?.picture,
    !!emergencyContact.name,
  ];
  const completionPct = Math.round((completionFields.filter(Boolean).length / completionFields.length) * 100);

  /* ── Edit profile ── */
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setEditLoading(true);
    setEditError('');
    setEditSuccess('');
    try {
      // Upload photo first if selected
      if (photoFile) {
        setPhotoLoading(true);
        try {
          const photoResult = await userService.uploadPhoto(photoFile);
          setUser(photoResult.user);
          setPhotoFile(null);
          setPhotoPreview(null);
        } catch {
          setEditError('Failed to upload photo. Please try again.');
          setEditLoading(false);
          setPhotoLoading(false);
          return;
        } finally {
          setPhotoLoading(false);
        }
      }

      const updated = await userService.editUser(user._id, {
        firstname: editForm.firstname,
        lastname: editForm.lastname,
        phone: editForm.phone ? Number(editForm.phone) : undefined,
      });
      setUser(updated.user);
      setEditSuccess('Profile updated successfully!');
      // Refresh name in localStorage
      localStorage.setItem('name', `${updated.user.firstname} ${updated.user.lastname}`);
    } catch {
      setEditError('Failed to update profile. Please try again.');
    } finally {
      setEditLoading(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  /* ── Change password ── */
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    if (passwordForm.next !== passwordForm.confirm) {
      setPasswordError('New passwords do not match.');
      return;
    }
    if (passwordForm.next.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      return;
    }
    setPasswordLoading(true);
    try {
      const result = await userService.changePassword(passwordForm.current, passwordForm.next);
      setPasswordSuccess(result.message);
      setPasswordForm({ current: '', next: '', confirm: '' });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setPasswordError(msg || 'Failed to change password. Please try again.');
    } finally {
      setPasswordLoading(false);
    }
  };

  /* ── Delete account ── */
  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeleteError('');
    setDeleteLoading(true);
    try {
      await userService.deleteOwnAccount();
      authService.logout();
      navigate('/login');
    } catch {
      setDeleteError('Failed to delete account. Please try again or contact support.');
    } finally {
      setDeleteLoading(false);
    }
  };

  /* ── Preferences ── */
  const handlePrefsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPrefsError('');
    setPrefsSuccess('');
    setPrefsLoading(true);
    try {
      const result = await userService.updatePreferences(prefsForm);
      setUser(result.user);
      setPrefsSuccess('Preferences saved successfully!');
    } catch {
      setPrefsError('Failed to save preferences. Please try again.');
    } finally {
      setPrefsLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="text-center">
          <div className="spinner-border text-danger" role="status" />
          <p className="mt-3 text-muted">Loading profile…</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
      <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />

      <div style={{ marginLeft: sidebarWidth, transition: 'margin-left 0.3s ease-in-out', padding: '30px', minHeight: '100vh' }}>
        <Container fluid className="py-4">

          {/* ── Profile Header ── */}
          <div className="mb-5" style={{
            background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)',
            borderRadius: '24px',
            padding: '40px',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', right: '-40px', top: '-40px', opacity: 0.06 }}>
              <FaUser size={280} />
            </div>
            <Row className="align-items-center">
              <Col xs="auto">
                {user?.picture ? (
                  <img
                    src={user.picture}
                    alt="Avatar"
                    style={{ width: 90, height: 90, borderRadius: '50%', objectFit: 'cover', border: '3px solid #dc3545' }}
                  />
                ) : (
                  <div style={{
                    width: 90, height: 90, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #dc3545, #c82333)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 32, fontWeight: 700, color: 'white',
                    border: '3px solid rgba(255,255,255,0.2)',
                  }}>
                    {initials}
                  </div>
                )}
              </Col>
              <Col>
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <h2 className="fw-bold mb-0">{fullName || 'Unknown User'}</h2>
                  {user?.isActive && (
                    <Badge bg="success" className="d-flex align-items-center gap-1">
                      <FaCheckCircle size={12} /> Verified
                    </Badge>
                  )}
                  {user?.isGoogleAuth && (
                    <Badge bg="info" className="d-flex align-items-center gap-1">
                      <FaShieldAlt size={12} /> Google Auth
                    </Badge>
                  )}
                </div>
                <p className="text-white-50 mt-1 mb-2">{user?.email}</p>
                <div className="d-flex gap-2 flex-wrap">
                  <Button
                    variant="danger"
                    size="sm"
                    style={{ borderRadius: '10px' }}
                    onClick={() => setShowEditModal(true)}
                  >
                    <FaEdit className="me-1" /> Edit Profile
                  </Button>
                  <Button
                    variant="outline-light"
                    size="sm"
                    style={{ borderRadius: '10px' }}
                    onClick={() => { authService.logout(); navigate('/login'); }}
                  >
                    <FaSignOutAlt className="me-1" /> Logout
                  </Button>
                </div>
              </Col>
              <Col lg={3} className="mt-3 mt-lg-0">
                <div className="bg-white bg-opacity-10 rounded-3 p-3">
                  <div className="d-flex justify-content-between mb-1">
                    <small>Profile completion</small>
                    <small className="fw-bold">{completionPct}%</small>
                  </div>
                  <ProgressBar
                    now={completionPct}
                    variant={completionPct >= 80 ? 'success' : completionPct >= 50 ? 'warning' : 'danger'}
                    style={{ height: 8, borderRadius: 4 }}
                  />
                  <small className="text-white-50 mt-1 d-block">
                    {completionPct < 100 ? 'Complete your profile to unlock all features' : 'Your profile is complete!'}
                  </small>
                </div>
              </Col>
            </Row>
          </div>

          {/* ── Stats Row ── */}
          <Row className="g-4 mb-5">
            {[
              { icon: <FaCar size={26} className="text-danger" />, bg: 'bg-danger', label: 'Trips Created', value: stats ? String(stats.tripsCreated) : '—' },
              { icon: <FaRoute size={26} className="text-success" />, bg: 'bg-success', label: 'Trips Taken', value: stats ? String(stats.tripsTaken) : '—' },
              { icon: <FaMoneyBillWave size={26} className="text-warning" />, bg: 'bg-warning', label: 'Total Savings', value: stats ? `${stats.totalSavings.toFixed(2)} TND` : '— TND' },
              { icon: <FaStar size={26} className="text-info" />, bg: 'bg-info', label: 'Rating', value: stats?.rating ? `${stats.rating} / 5` : '—' },
            ].map((s, i) => (
              <Col key={i} lg={3} md={6}>
                <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '20px', transition: 'transform 0.3s', cursor: 'default' }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-5px)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                >
                  <Card.Body className="p-4">
                    <div className={`${s.bg} bg-opacity-10 rounded-circle mb-3`} style={{ width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {s.icon}
                    </div>
                    <h6 className="text-muted mb-1">{s.label}</h6>
                    <h3 className="fw-bold mb-0">{s.value}</h3>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          <Row className="g-4 mb-4">
            {/* ── Personal Info ── */}
            <Col lg={6}>
              <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '20px' }}>
                <Card.Body className="p-4">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="fw-bold mb-0"><FaIdCard className="text-danger me-2" />Personal Information</h5>
                    <Button variant="outline-danger" size="sm" style={{ borderRadius: '10px' }} onClick={() => setShowEditModal(true)}>
                      <FaEdit className="me-1" /> Edit
                    </Button>
                  </div>
                  {[
                    { icon: <FaUser className="text-danger" />, label: 'Full Name', value: fullName || '—' },
                    { icon: <FaEnvelope className="text-danger" />, label: 'Email', value: user?.email || '—' },
                    { icon: <FaPhone className="text-danger" />, label: 'Phone', value: user?.phone ? String(user.phone) : '—' },
                    { icon: <FaMapMarkerAlt className="text-danger" />, label: 'Location', value: '—' },
                    { icon: <FaCalendarAlt className="text-danger" />, label: 'Member since', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—' },
                  ].map((row, i) => (
                    <div key={i} className="d-flex align-items-center py-2 border-bottom border-light">
                      <div className="me-3" style={{ width: 20, textAlign: 'center' }}>{row.icon}</div>
                      <div>
                        <small className="text-muted d-block">{row.label}</small>
                        <span className="fw-semibold">{row.value}</span>
                      </div>
                    </div>
                  ))}
                </Card.Body>
              </Card>
            </Col>

            {/* ── Emergency Contact ── */}
            <Col lg={6}>
              <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '20px' }}>
                <Card.Body className="p-4">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="fw-bold mb-0"><FaHeartbeat className="text-danger me-2" />Emergency Contact</h5>
                    <Button variant="outline-danger" size="sm" style={{ borderRadius: '10px' }} onClick={() => setShowEmergencyModal(true)}>
                      <FaEdit className="me-1" /> Edit
                    </Button>
                  </div>
                  {emergencyContact.name ? (
                    [
                      { label: 'Name', value: emergencyContact.name },
                      { label: 'Phone', value: emergencyContact.phone },
                      { label: 'Relation', value: emergencyContact.relation },
                    ].map((row, i) => (
                      <div key={i} className="d-flex align-items-center py-2 border-bottom border-light">
                        <div>
                          <small className="text-muted d-block">{row.label}</small>
                          <span className="fw-semibold">{row.value || '—'}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <FaHeartbeat size={40} className="text-muted opacity-25 mb-3" />
                      <p className="text-muted">No emergency contact added yet.</p>
                      <Button variant="danger" size="sm" style={{ borderRadius: '10px' }} onClick={() => setShowEmergencyModal(true)}>
                        Add Contact
                      </Button>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row className="g-4 mb-4">
            {/* ── Preferences ── */}
            <Col lg={6}>
              <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '20px' }}>
                <Card.Body className="p-4">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="fw-bold mb-0"><FaBell className="text-danger me-2" />Preferences</h5>
                    <Button variant="outline-danger" size="sm" style={{ borderRadius: '10px' }} onClick={() => setShowPreferencesModal(true)}>
                      <FaEdit className="me-1" /> Edit
                    </Button>
                  </div>
                  {[
                    { icon: <FaBell className="text-warning" />, label: 'Email Notifications', value: user?.preferences?.emailNotifications !== undefined ? (user.preferences.emailNotifications ? 'Enabled' : 'Disabled') : 'Enabled' },
                    { icon: <FaLanguage className="text-success" />, label: 'Language', value: user?.preferences?.language || 'English' },
                    { icon: <FaShieldAlt className="text-info" />, label: 'Privacy', value: user?.preferences?.privacy || 'Friends only' },
                  ].map((row, i) => (
                    <div key={i} className="d-flex align-items-center justify-content-between py-2 border-bottom border-light">
                      <div className="d-flex align-items-center gap-2">
                        {row.icon}
                        <span>{row.label}</span>
                      </div>
                      <Badge bg="secondary" className="rounded-pill">{row.value}</Badge>
                    </div>
                  ))}
                </Card.Body>
              </Card>
            </Col>

            {/* ── Account Management ── */}
            <Col lg={6}>
              <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '20px' }}>
                <Card.Body className="p-4">
                  <h5 className="fw-bold mb-4"><FaLock className="text-danger me-2" />Account Security</h5>
                  <div className="d-grid gap-3">
                    <Button
                      variant="outline-dark"
                      style={{ borderRadius: '12px', textAlign: 'left' }}
                      onClick={() => setShowPasswordModal(true)}
                    >
                      <FaLock className="me-2 text-danger" /> Change Password
                    </Button>
                    <Button
                      variant="outline-danger"
                      style={{ borderRadius: '12px', textAlign: 'left' }}
                      onClick={() => setShowDeleteModal(true)}
                    >
                      <FaTrash className="me-2" /> Delete Account
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* ── Recent Reviews placeholder ── */}
          <Row className="g-4">
            <Col>
              <Card className="border-0 shadow-sm" style={{ borderRadius: '20px' }}>
                <Card.Body className="p-4">
                  <h5 className="fw-bold mb-4"><FaStar className="text-warning me-2" />Recent Reviews</h5>
                  <div className="text-center py-4">
                    <FaStar size={48} className="text-muted opacity-25 mb-3" />
                    <p className="text-muted">No reviews yet. Complete a trip to receive your first review!</p>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

        </Container>
      </div>

      {/* ── Edit Profile Modal ── */}
      <Modal show={showEditModal} onHide={() => { setShowEditModal(false); setEditError(''); setEditSuccess(''); setPhotoFile(null); setPhotoPreview(null); }} centered>
        <Modal.Header closeButton style={{ borderBottom: '1px solid #eee' }}>
          <Modal.Title className="fw-bold"><FaEdit className="text-danger me-2" />Edit Profile</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleEditSubmit}>
          <Modal.Body className="p-4">
            {editError && <Alert variant="danger">{editError}</Alert>}
            {editSuccess && <Alert variant="success">{editSuccess}</Alert>}

            {/* Photo upload */}
            <Form.Group className="mb-4 text-center">
              <div className="mb-2">
                {(photoPreview || user?.picture) ? (
                  <img
                    src={photoPreview || user?.picture}
                    alt="Preview"
                    style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid #dc3545' }}
                  />
                ) : (
                  <div style={{
                    width: 80, height: 80, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #dc3545, #c82333)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 28, fontWeight: 700, color: 'white', margin: '0 auto',
                  }}>
                    {initials}
                  </div>
                )}
              </div>
              <Form.Label className="btn btn-outline-danger btn-sm" style={{ borderRadius: '10px', cursor: 'pointer' }}>
                {photoLoading ? 'Uploading…' : 'Change Photo'}
                <Form.Control
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handlePhotoChange}
                  style={{ display: 'none' }}
                />
              </Form.Label>
              {photoFile && <small className="d-block text-muted mt-1">{photoFile.name}</small>}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>First Name</Form.Label>
              <Form.Control
                type="text"
                value={editForm.firstname}
                onChange={(e) => setEditForm({ ...editForm, firstname: e.target.value })}
                required
                style={{ borderRadius: '10px' }}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Last Name</Form.Label>
              <Form.Control
                type="text"
                value={editForm.lastname}
                onChange={(e) => setEditForm({ ...editForm, lastname: e.target.value })}
                required
                style={{ borderRadius: '10px' }}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Phone</Form.Label>
              <Form.Control
                type="tel"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                style={{ borderRadius: '10px' }}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" style={{ borderRadius: '10px' }} onClick={() => { setShowEditModal(false); setPhotoFile(null); setPhotoPreview(null); }}>Cancel</Button>
            <Button variant="danger" type="submit" style={{ borderRadius: '10px' }} disabled={editLoading || photoLoading}>
              {editLoading || photoLoading ? 'Saving…' : 'Save Changes'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ── Change Password Modal ── */}
      <Modal show={showPasswordModal} onHide={() => { setShowPasswordModal(false); setPasswordError(''); setPasswordSuccess(''); }} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold"><FaLock className="text-danger me-2" />Change Password</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handlePasswordSubmit}>
          <Modal.Body className="p-4">
            {passwordError && <Alert variant="danger">{passwordError}</Alert>}
            {passwordSuccess && <Alert variant="success">{passwordSuccess}</Alert>}
            <Form.Group className="mb-3">
              <Form.Label>Current Password</Form.Label>
              <Form.Control type="password" value={passwordForm.current} onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })} required style={{ borderRadius: '10px' }} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>New Password</Form.Label>
              <Form.Control type="password" value={passwordForm.next} onChange={(e) => setPasswordForm({ ...passwordForm, next: e.target.value })} required style={{ borderRadius: '10px' }} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Confirm New Password</Form.Label>
              <Form.Control type="password" value={passwordForm.confirm} onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })} required style={{ borderRadius: '10px' }} />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" style={{ borderRadius: '10px' }} onClick={() => setShowPasswordModal(false)}>Cancel</Button>
            <Button variant="danger" type="submit" style={{ borderRadius: '10px' }} disabled={passwordLoading}>
              {passwordLoading ? 'Saving…' : 'Change Password'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ── Emergency Contact Modal ── */}
      <Modal show={showEmergencyModal} onHide={() => setShowEmergencyModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold"><FaHeartbeat className="text-danger me-2" />Emergency Contact</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <Alert variant="info" className="small">Emergency contact is stored locally for this session. Backend persistence will be available once the API endpoint is ready.</Alert>
          <Form.Group className="mb-3">
            <Form.Label>Contact Name</Form.Label>
            <Form.Control type="text" value={emergencyContact.name} onChange={(e) => setEmergencyContact({ ...emergencyContact, name: e.target.value })} style={{ borderRadius: '10px' }} />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Phone</Form.Label>
            <Form.Control type="tel" value={emergencyContact.phone} onChange={(e) => setEmergencyContact({ ...emergencyContact, phone: e.target.value })} style={{ borderRadius: '10px' }} />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Relation</Form.Label>
            <Form.Control type="text" placeholder="e.g. Parent, Spouse" value={emergencyContact.relation} onChange={(e) => setEmergencyContact({ ...emergencyContact, relation: e.target.value })} style={{ borderRadius: '10px' }} />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" style={{ borderRadius: '10px' }} onClick={() => setShowEmergencyModal(false)}>Cancel</Button>
          <Button variant="danger" style={{ borderRadius: '10px' }} onClick={() => setShowEmergencyModal(false)}>Save</Button>
        </Modal.Footer>
      </Modal>

      {/* ── Delete Account Modal ── */}
      <Modal show={showDeleteModal} onHide={() => { setShowDeleteModal(false); setDeleteError(''); }} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold text-danger"><FaExclamationTriangle className="me-2" />Delete Account</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {deleteError && <Alert variant="danger">{deleteError}</Alert>}
          <Alert variant="danger">
            <strong>Warning!</strong> This action is permanent and cannot be undone. All your trips, bookings, and data will be deleted.
          </Alert>
          <p>Are you sure you want to permanently delete your account?</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" style={{ borderRadius: '10px' }} onClick={() => { setShowDeleteModal(false); setDeleteError(''); }}>Cancel</Button>
          <Button variant="danger" style={{ borderRadius: '10px' }} onClick={handleDeleteAccount} disabled={deleteLoading}>
            {deleteLoading ? 'Deleting…' : 'Yes, Delete My Account'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ── Preferences Modal ── */}
      <Modal show={showPreferencesModal} onHide={() => { setShowPreferencesModal(false); setPrefsError(''); setPrefsSuccess(''); }} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold"><FaBell className="text-danger me-2" />Edit Preferences</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handlePrefsSubmit}>
          <Modal.Body className="p-4">
            {prefsError && <Alert variant="danger">{prefsError}</Alert>}
            {prefsSuccess && <Alert variant="success">{prefsSuccess}</Alert>}
            <Form.Group className="mb-3">
              <Form.Check
                type="switch"
                id="emailNotifications"
                label="Email Notifications"
                checked={prefsForm.emailNotifications}
                onChange={(e) => setPrefsForm({ ...prefsForm, emailNotifications: e.target.checked })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Language</Form.Label>
              <Form.Select
                value={prefsForm.language}
                onChange={(e) => setPrefsForm({ ...prefsForm, language: e.target.value as 'English' | 'French' | 'Arabic' })}
                style={{ borderRadius: '10px' }}
              >
                <option value="English">English</option>
                <option value="French">French</option>
                <option value="Arabic">Arabic</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Privacy</Form.Label>
              <Form.Select
                value={prefsForm.privacy}
                onChange={(e) => setPrefsForm({ ...prefsForm, privacy: e.target.value as 'Public' | 'Friends only' | 'Private' })}
                style={{ borderRadius: '10px' }}
              >
                <option value="Public">Public</option>
                <option value="Friends only">Friends only</option>
                <option value="Private">Private</option>
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" style={{ borderRadius: '10px' }} onClick={() => setShowPreferencesModal(false)}>Cancel</Button>
            <Button variant="danger" type="submit" style={{ borderRadius: '10px' }} disabled={prefsLoading}>
              {prefsLoading ? 'Saving…' : 'Save Preferences'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default Profile;
