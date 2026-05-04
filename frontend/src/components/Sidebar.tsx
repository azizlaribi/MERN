import React, { useState } from 'react';
import { Nav, Button } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  FaCar, FaPlus, FaSearch, FaBookmark, FaCalendarAlt, FaComment ,
  FaSignOutAlt, FaTachometerAlt, FaUsers, FaUser, 
  FaBars, FaChevronLeft, FaChevronRight
} from 'react-icons/fa';
import { authService } from '../services/authService';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const userRole = authService.getUserRole();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const menuItems = userRole === 'admin' ? [
    { path: '/admin/dashboard', icon: <FaTachometerAlt />, label: 'Dashboard' },
    { path: '/admin/trips', icon: <FaCar />, label: 'Manage Trips' },
    { path: '/admin/users', icon: <FaUsers />, label: 'Manage Users' },
  ] : [
    { path: '/dashboard', icon: <FaTachometerAlt />, label: 'Dashboard' },
    { path: '/messages', icon: <FaComment />, label: 'Messages' },
    { path: '/trips/browse', icon: <FaSearch />, label: 'Browse Trips' },
    { path: '/trips/create', icon: <FaPlus />, label: 'Create Trip' },
    { path: '/trips/my-trips', icon: <FaCar />, label: 'My Trips' },
    { path: '/trips/my-bookings', icon: <FaBookmark />, label: 'My Bookings' },
    { path: '/profile', icon: <FaUser />, label: 'Profile' },
  ];

  const sidebarWidth = isCollapsed ? '80px' : '260px';

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: sidebarWidth,
        height: '100vh',
        backgroundColor: '#000000',
        color: 'white',
        transition: 'width 0.3s ease-in-out',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '2px 0 10px rgba(0,0,0,0.3)',
        overflow: 'hidden',
      }}
    >
      {/* Header with Hamburger Button */}
      <div className="p-3 border-bottom border-secondary" style={{ position: 'relative' }}>
        <div className="d-flex align-items-center" style={{ justifyContent: isCollapsed ? 'center' : 'space-between' }}>
          {!isCollapsed && (
            <>
              <div className="d-flex align-items-center">
                <FaCar size={28} className="text-danger me-2" />
                <h4 className="mb-0 fw-bold">RideShare</h4>
              </div>
              <Button
                variant="link"
                onClick={onToggle}
                style={{ color: 'white', padding: '4px' }}
                className="text-decoration-none"
              >
                <FaChevronLeft size={18} />
              </Button>
            </>
          )}
          {isCollapsed && (
            <>
              <Button
                variant="link"
                onClick={onToggle}
                style={{ color: 'white', padding: '8px', margin: '0 auto' }}
                className="text-decoration-none"
              >
                <FaBars size={20} />
              </Button>
            </>
          )}
        </div>
        {!isCollapsed && (
          <p className="text-white-50 small mt-2 mb-0">Your carpooling platform</p>
        )}
      </div>

      {/* Menu Items */}
      <Nav className="flex-column flex-grow-1 mt-3">
        {menuItems.map((item) => (
          <Nav.Link
            key={item.path}
            as={Link}
            to={item.path}
            style={{
              color: location.pathname === item.path ? '#dc3545' : 'white',
              backgroundColor: location.pathname === item.path ? 'rgba(220,53,69,0.1)' : 'transparent',
              padding: isCollapsed ? '12px' : '12px 20px',
              margin: '4px 8px',
              borderRadius: '10px',
              transition: 'all 0.3s',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              textAlign: 'center',
              cursor: 'pointer',
            }}
            className="d-flex align-items-center"
            title={isCollapsed ? item.label : ''}
          >
            <span style={{ 
              fontSize: '20px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              {item.icon}
            </span>
            {!isCollapsed && <span className="ms-3">{item.label}</span>}
          </Nav.Link>
        ))}
      </Nav>

      {/* Footer with Logout */}
      <div className="p-3 border-top border-secondary">
        <Button
          variant="outline-danger"
          onClick={handleLogout}
          style={{
            width: '100%',
            padding: isCollapsed ? '10px' : '10px',
            borderRadius: '10px',
            justifyContent: 'center',
          }}
          className="d-flex align-items-center"
          title={isCollapsed ? 'Logout' : ''}
        >
          <FaSignOutAlt size={18} />
          {!isCollapsed && <span className="ms-2">Logout</span>}
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;