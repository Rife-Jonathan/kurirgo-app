import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import useAuthStore from './store/authStore';

// Overarching layout & pages
import Layout from './components/Layout';
import Landing from './pages/public/Landing';
import Login from './pages/public/Login';
import Register from './pages/public/Register';

// Sender Pages
import SenderDashboard from './pages/sender/Dashboard';
import SenderOrderNew from './pages/sender/OrderNew';
import SenderOrderDetail from './pages/sender/OrderDetail';
import SenderHistory from './pages/sender/History';

// Courier Pages
import CourierDashboard from './pages/courier/Dashboard';
import CourierOrders from './pages/courier/Orders';
import CourierOrderDetail from './pages/courier/OrderDetail';
import CourierHistory from './pages/courier/History';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminOrders from './pages/admin/Orders';
import AdminCouriers from './pages/admin/Couriers';

export default function App() {
  const { hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route element={<Layout />}>
          {/* Sender */}
          <Route path="/sender/dashboard" element={<SenderDashboard />} />
          <Route path="/sender/order/new" element={<SenderOrderNew />} />
          <Route path="/sender/order/:id" element={<SenderOrderDetail />} />
          <Route path="/sender/history" element={<SenderHistory />} />

          {/* Courier */}
          <Route path="/courier/dashboard" element={<CourierDashboard />} />
          <Route path="/courier/orders" element={<CourierOrders />} />
          <Route path="/courier/order/:id" element={<CourierOrderDetail />} />
          <Route path="/courier/history" element={<CourierHistory />} />

          {/* Admin */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/couriers" element={<AdminCouriers />} />
        </Route>
      </Routes>
    </Router>
  );
}
