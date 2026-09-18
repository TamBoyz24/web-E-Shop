import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children, isAuthenticated }) => {
  if (typeof isAuthenticated !== 'boolean') {
    console.warn("isAuthenticated phải là boolean");
    return <Navigate to="/" />;
  }

  return isAuthenticated ? children : <Navigate to="/" />;
};

export default PrivateRoute;
