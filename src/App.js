import React from 'react';
import { Route, BrowserRouter as Router, Routes, useLocation } from 'react-router-dom';
import AuthForm from './compoment/AuthForm';
import Cart from './compoment/Cart';
import EditProfile from './compoment/EditProfile';
import ForgotPassword from './compoment/ForgotPassword';
import Footer from './compoment/Footer';
import Home from './compoment/Home';
import Navbar from './compoment/Navbar';
import OrderManagement from './compoment/admin/OrderManagement';
import ProductDetail from './compoment/ProductDetail';
import ProductManagement from './compoment/admin/ProductManagement';
import Profile from './compoment/Profile';
import Promotion from './compoment/Promotion';
import TwiceHome from './compoment/TwiceHome';
import UserInfo from './compoment/UserInfo';
import LoginForm from './compoment/LoginForm';
import IphonePage from './pages/IphonePage';
import RedmiPage from './pages/RedmiPage';
import SamsungPage from './pages/SamsungPage';
import Admin from './compoment/admin/Admin';
import Users from './compoment/admin/Users';
import UserDetails from './compoment/admin/UserDetails';
import AdminStaff from './compoment/admin/AdminStaff';
import AdminLogin from './compoment/admin/AdminLogin';
import AdminRoute from './compoment/admin/AdminRoute';

const AppLayout = () => {
  const location = useLocation();
  const isUtilityPage = ['/authform', '/login', '/forgot-password', '/admin/login', '/admin', '/admin/products', '/admin/users', '/admin/orders', '/admin/staff'].includes(location.pathname)
    || location.pathname.startsWith('/admin/users/');

  return (
    <div className="app-shell">
      {!isUtilityPage && <Navbar />}
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/promotion" element={<Promotion />} />
          <Route path="/product-detail/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/user-info" element={<UserInfo />} />
          <Route path="/authform" element={<AuthForm />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/edit-profile" element={<EditProfile />} />
          <Route path="/samsung" element={<SamsungPage />} />
          <Route path="/iphone" element={<IphonePage />} />
          <Route path="/redmi" element={<RedmiPage />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
          <Route path="/admin/products" element={<AdminRoute><ProductManagement /></AdminRoute>} />
          <Route path="/admin/users" element={<AdminRoute><Users /></AdminRoute>} />
          <Route path="/admin/users/:id" element={<AdminRoute><UserDetails /></AdminRoute>} />
          <Route path="/admin/staff" element={<AdminRoute ownerOnly><AdminStaff /></AdminRoute>} />
          <Route path="/admin/orders" element={<AdminRoute><OrderManagement /></AdminRoute>} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      {!isUtilityPage && <Footer />}
    </div>
  );
};
const App = () => {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppLayout />
    </Router>
  );
};

export default App;
