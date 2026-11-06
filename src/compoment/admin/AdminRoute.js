import React, { useEffect } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

const AdminRoute = ({ children, ownerOnly = false }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const storedSession = localStorage.getItem("adminSession");
    const token = localStorage.getItem("adminToken");

    useEffect(() => {
        const handleExpiredSession = () => {
            navigate("/admin/login", {
                replace: true,
                state: { from: location.pathname },
            });
        };
        window.addEventListener("admin-session-expired", handleExpiredSession);
        return () => window.removeEventListener("admin-session-expired", handleExpiredSession);
    }, [location.pathname, navigate]);

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
