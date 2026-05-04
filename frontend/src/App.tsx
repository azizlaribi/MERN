import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import Login from './pages/login/login';
import Register from './pages/register/register';
import Dashboard from './pages/dashboard/Dashboard';
import PrivateRoute from './components/PrivateRoute';
import PublicRoute from './components/PublicRoute';
import CreateTrip from './pages/trips/CreateTrip';
import BrowseTrips from './pages/trips/BrowseTrips';
import MyTrips from './pages/trips/MyTrips';
import TripDetails from './pages/trips/TripDetails';
import MyBookings from './pages/trips/MyBookings';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/Adminusers';
import AdminTrips from './pages/admin/AdminTrips';
import Messages from './pages/messenger/Messages';


const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        
        {/* User routes */}
        <Route path="/dashboard" element={<PrivateRoute requiredRole="user"><Dashboard /></PrivateRoute>} />
        <Route path="/trips/create" element={<PrivateRoute requiredRole="user"><CreateTrip /></PrivateRoute>} />
        <Route path="/trips/browse" element={<PrivateRoute requiredRole="user"><BrowseTrips /></PrivateRoute>} />
        <Route path="/trips/my-trips" element={<PrivateRoute requiredRole="user"><MyTrips /></PrivateRoute>} />
        <Route path="/trips/my-bookings" element={<PrivateRoute requiredRole="user"><MyBookings /></PrivateRoute>} />
        <Route path="/trips/:tripId" element={<PrivateRoute requiredRole="user"><TripDetails /></PrivateRoute>} />
        <Route path="/messages" element={<PrivateRoute requiredRole="user"><Messages /></PrivateRoute>} />
<Route path="/messages/:userId" element={<PrivateRoute requiredRole="user"><Messages /></PrivateRoute>} />
        {/* Admin routes */}
        <Route path="/admin/dashboard" element={<PrivateRoute requiredRole="admin"><AdminDashboard /></PrivateRoute>} />
        <Route path="/admin/users" element={<PrivateRoute requiredRole="admin"><AdminUsers /></PrivateRoute>} />
        <Route path="/admin/trips" element={<PrivateRoute requiredRole="admin"><AdminTrips /></PrivateRoute>} />
        
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
};

export default App;