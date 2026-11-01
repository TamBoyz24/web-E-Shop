import React from "react";
import { Navigate, useLocation } from "react-router-dom";

const AdminRoute = ({ children, ownerOnly = false }) => {
    const location = useLocation();
    const storedSession = localStorage.getItem("adminSession");
    const token = localStorage.getItem("adminToken");
    let session = null;
    try {
        session = storedSession ? JSON.parse(storedSession) : null;
    } catch (error) {
        if (!(error instanceof SyntaxError)) throw error;
    }

    if (!session || !token) {
        return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
    }
    if (ownerOnly && session.role !== "owner") {
        return <Navigate to="/admin" replace />;
    }
    return children;
};

export default AdminRoute;
