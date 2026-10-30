import React from "react";
import { Navigate, useLocation } from "react-router-dom";

const AdminRoute = ({ children }) => {
    const location = useLocation();
    const session = localStorage.getItem("adminSession");
    const token = localStorage.getItem("adminToken");
    if (!session || !token) {
        return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
    }
    return children;
};

export default AdminRoute;
