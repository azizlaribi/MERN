// AdminUsers.tsx
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
  FaEdit,
  FaTrash,
  FaEye,
  FaEyeSlash,
  FaArrowLeft,
  FaCheck,
  FaTimes,
  FaFilter,
  FaSync,
  FaUserPlus,
} from 'react-icons/fa';
import { authService } from '../../services/authService';
import { userService, type User } from '../../services/Userservice';
import Sidebar from '../../components/Sidebar';

const AdminUsers: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<User>>({});
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

    fetchUsers();
  }, [navigate]);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const allUsersResponse = await userService.getAllUsers();
      const adminUsersResponse = await userService.getAllAdmins();
      
      const allUsers = Array.isArray(allUsersResponse) ? allUsersResponse : allUsersResponse?.data || [];
      const adminUsers = Array.isArray(adminUsersResponse) ? adminUsersResponse : adminUsersResponse?.data || [];
      const combinedUsers = [...allUsers, ...adminUsers];
      setUsers(combinedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      showError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users.filter((user) => {
      const matchesSearch =
        user.firstname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && user.isActive) ||
        (statusFilter === 'inactive' && !user.isActive);

      return matchesSearch && matchesRole && matchesStatus;
    });

    setFilteredUsers(filtered);
    setCurrentPage(1);
  };

  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setEditFormData(user);
    setShowEditModal(true);
  };

  const handleDeleteClick = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedUser) return;

    try {
      await userService.editUser(selectedUser._id, editFormData);
      showSuccess('User updated successfully');
      setShowEditModal(false);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      showError('Failed to update user');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;

    try {
      await userService.deleteUser(selectedUser._id);
      showSuccess('User deleted successfully');
      setShowDeleteModal(false);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      showError('Failed to delete user');
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      await userService.toggleUserStatus(user._id);
      showSuccess(`User ${user.isActive ? 'deactivated' : 'activated'} successfully`);
      fetchUsers();
    } catch (error) {
      console.error('Error toggling user status:', error);
      showError('Failed to update user status');
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

  const sidebarWidth = isSidebarCollapsed ? '80px' : '260px';
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

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
                  <h1 className="display-6 fw-bold mb-2" style={{ color: '#000' }}>Manage Users</h1>
                  <p style={{ color: '#6c757d' }}>
                    Total Users: <strong className="text-danger">{filteredUsers.length}</strong>
                  </p>
                </div>
                <Button 
                  variant="danger" 
                  onClick={() => fetchUsers()}
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
                <Col lg={5}>
                  <InputGroup>
                    <InputGroup.Text style={{ backgroundColor: '#fff', borderRight: 'none' }}>
                      <FaSearch style={{ color: '#dc3545' }} />
                    </InputGroup.Text>
                    <Form.Control
                      placeholder="Search by name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ borderLeft: 'none' }}
                    />
                  </InputGroup>
                </Col>

                <Col lg={3}>
                  <Form.Select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value as any)}
                    style={{ cursor: 'pointer' }}
                  >
                    <option value="all">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="user">User</option>
                  </Form.Select>
                </Col>

                <Col lg={3}>
                  <Form.Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    style={{ cursor: 'pointer' }}
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </Form.Select>
                </Col>

                <Col lg={1}>
                  <Button
                    variant="outline-secondary"
                    className="w-100"
                    onClick={() => {
                      setSearchTerm('');
                      setRoleFilter('all');
                      setStatusFilter('all');
                    }}
                  >
                    <FaFilter /> Reset
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Users Table */}
          <Card className="border-0 shadow-sm">
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead style={{ backgroundColor: '#f8f9fa' }}>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.length > 0 ? (
                    paginatedUsers.map((user) => (
                      <tr key={user._id}>
                        <td className="fw-medium">
                          {user.firstname} {user.lastname}
                        </td>
                        <td>{user.email}</td>
                        <td>{user.phone || 'N/A'}</td>
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
                        <td>
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            <Button
                              variant="outline-info"
                              size="sm"
                              onClick={() => handleToggleStatus(user)}
                              title={user.isActive ? 'Deactivate user' : 'Activate user'}
                            >
                              {user.isActive ? <FaEye size={14} /> : <FaEyeSlash size={14} />}
                            </Button>
                            <Button
                              variant="outline-warning"
                              size="sm"
                              onClick={() => handleEditClick(user)}
                              title="Edit user"
                            >
                              <FaEdit size={14} />
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleDeleteClick(user)}
                              title="Delete user"
                            >
                              <FaTrash size={14} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center py-5 text-muted">
                        No users found
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

      {/* Edit Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg" centered>
        <Modal.Header closeButton style={{ borderBottom: '2px solid #dc3545' }}>
          <Modal.Title>
            <FaEdit className="me-2 text-danger" /> Edit User
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedUser && (
            <Form>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>First Name</Form.Label>
                    <Form.Control
                      type="text"
                      value={editFormData.firstname || ''}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, firstname: e.target.value })
                      }
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Last Name</Form.Label>
                    <Form.Control
                      type="text"
                      value={editFormData.lastname || ''}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, lastname: e.target.value })
                      }
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  value={editFormData.email || ''}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, email: e.target.value })
                  }
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Phone</Form.Label>
                <Form.Control
                  type="tel"
                  value={editFormData.phone || ''}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, phone: e.target.value })
                  }
                />
              </Form.Group>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Role</Form.Label>
                    <Form.Select
                      value={editFormData.role || 'user'}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          role: e.target.value as 'admin' | 'user',
                        })
                      }
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Status</Form.Label>
                    <Form.Check
                      type="switch"
                      label={editFormData.isActive ? 'Active' : 'Inactive'}
                      checked={editFormData.isActive || false}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, isActive: e.target.checked })
                      }
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleSaveEdit}>
            Save Changes
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
          {selectedUser && (
            <div>
              <p>Are you sure you want to delete this user?</p>
              <div className="p-3 bg-light rounded">
                <p className="mb-1">
                  <strong>Name:</strong> {selectedUser.firstname} {selectedUser.lastname}
                </p>
                <p className="mb-1">
                  <strong>Email:</strong> {selectedUser.email}
                </p>
                <p className="mb-0">
                  <strong>Role:</strong> {selectedUser.role}
                </p>
              </div>
              <p className="text-danger fw-bold mt-3 mb-0">
                This action cannot be undone.
              </p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteConfirm}>
            Delete User
          </Button>
        </Modal.Footer>
      </Modal>

      <style>{`
        .table > :not(caption) > * > * {
          padding: 1rem 0.75rem;
          vertical-align: middle;
        }
        .btn-outline-info:hover {
          background-color: #0dcaf0;
          border-color: #0dcaf0;
        }
        .btn-outline-info:hover svg {
          color: white !important;
        }
        .btn-outline-warning:hover {
          background-color: #ffc107;
          border-color: #ffc107;
        }
        .btn-outline-warning:hover svg {
          color: white !important;
        }
        .btn-outline-danger:hover {
          background-color: #dc3545;
          border-color: #dc3545;
        }
        .btn-outline-danger:hover svg {
          color: white !important;
        }
        .form-select:focus, .form-control:focus {
          border-color: #dc3545;
          box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
        }
        .form-check-input:checked {
          background-color: #dc3545;
          border-color: #dc3545;
        }
      `}</style>
    </div>
  );
};

export default AdminUsers;