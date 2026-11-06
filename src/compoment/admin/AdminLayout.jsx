import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { apiRequest } from "../../lib/api";
import "./admin-common.css";

const AdminLayout = ({ eyebrow, title, description, action, children, className = "" }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const adminSession = JSON.parse(localStorage.getItem("adminSession") || "null");
    const [pendingCount, setPendingCount] = useState(null);
    const [orderNotice, setOrderNotice] = useState("");
    const knownOrderIds = useRef(null);
    const noticeTimeout = useRef(null);

    useEffect(() => {
        let isMounted = true;
        const loadPendingCount = async () => {
            try {
                const dashboard = await apiRequest("/admin/dashboard", { admin: true });
                const count = Number(dashboard.pendingOrderCount) || 0;
                if (!isMounted) return;
                const currentOrderIds = new Set(
                    (Array.isArray(dashboard.orders) ? dashboard.orders : [])
                        .map((order) => order.id)
                        .filter(Boolean)
                );
                if (knownOrderIds.current !== null) {
                    const newOrders = [...currentOrderIds].filter((id) => !knownOrderIds.current.has(id)).length;
                    if (newOrders > 0) {
                        setOrderNotice(`Bạn vừa nhận được ${newOrders} đơn hàng mới.`);
                        window.clearTimeout(noticeTimeout.current);
                        noticeTimeout.current = window.setTimeout(() => setOrderNotice(""), 8000);
                    }
                }
                knownOrderIds.current = currentOrderIds;
                setPendingCount(count);
            } catch {
                if (isMounted) setPendingCount(-1);
            }
        };
        loadPendingCount();
        const interval = window.setInterval(loadPendingCount, 30000);
        return () => {
            isMounted = false;
            window.clearInterval(interval);
            window.clearTimeout(noticeTimeout.current);
        };
    }, []);

    const navigation = [
        { path: "/admin", label: "Tổng quan", icon: "◫" },
        { path: "/admin/products", label: "Kho sản phẩm", icon: "▦" },
        { path: "/admin/users", label: "Người dùng", icon: "♙" },
        { path: "/admin/orders", label: "Đơn hàng", icon: "▤" },
        ...(adminSession?.role === "owner"
            ? [{ path: "/admin/staff", label: "Nhân viên admin", icon: "♧" }]
            : []),
    ];

    const logout = () => {
        localStorage.removeItem("adminSession");
        localStorage.removeItem("adminToken");
        navigate("/admin/login");
    };

    return (
        <main className={`admin-layout ${className}`}>
            <aside className="admin-sidebar">
                <Link className="admin-brand" to="/admin"><span>A</span><strong>AiPhone <em>Store</em></strong></Link>
                <p className="admin-caption">TRUNG TÂM QUẢN TRỊ</p>
                <nav className="admin-nav" aria-label="Điều hướng quản trị">
                    {navigation.map(({ path, label, icon }) => {
                        const active = location.pathname === path
                            || (path !== "/admin" && location.pathname.startsWith(`${path}/`));
                        return (
                            <Link
                                className={`admin-nav-link${active ? " active" : ""}`}
                                to={path}
                                key={path}
                                aria-current={active ? "page" : undefined}
                            >
                                <span className="admin-nav-icon" aria-hidden="true">{icon}</span>
                                <span className="admin-nav-label">{label}</span>
                                {path === "/admin/orders" && pendingCount !== null && pendingCount !== 0 && (
                                    <span className={`admin-order-badge${pendingCount < 0 ? " error" : ""}`} title={pendingCount < 0 ? "Không thể tải số đơn hàng" : `${pendingCount} đơn chờ xử lý`}>
                                        {pendingCount < 0 ? "!" : pendingCount}
                                    </span>
                                )}
                                {active && <span className="admin-nav-indicator" aria-hidden="true" />}
                            </Link>
                        );
                    })}
                </nav>
                <div className="admin-user-card">
                    <span className="admin-user-avatar" aria-hidden="true">
                        {(adminSession?.displayName || adminSession?.username || "A").charAt(0).toUpperCase()}
                    </span>
                    <span className="admin-user-details">
                        <small>{adminSession?.role === "owner" ? "QUẢN TRỊ VIÊN" : "NHÂN VIÊN"}</small>
                        <strong>{adminSession?.displayName || adminSession?.username || "Admin"}</strong>
                    </span>
                </div>
                <div className="admin-sidebar-bottom"><Link to="/">← Về cửa hàng</Link><button type="button" onClick={logout}>↪ Đăng xuất</button></div>
            </aside>
            <section className="admin-workspace">
                <header className="admin-page-header"><div><span className="admin-eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>{action}</header>
                {orderNotice && <Link className="admin-order-notice" to="/admin/orders" role="status">{orderNotice} Xem đơn hàng</Link>}
                {children}
            </section>
        </main>
    );
};

export default AdminLayout;
