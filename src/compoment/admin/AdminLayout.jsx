import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./admin-common.css";

const AdminLayout = ({ eyebrow, title, description, action, children, className = "" }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const navigation = [
        ["/admin", "Tổng quan"],
        ["/admin/products", "Kho sản phẩm"],
        ["/admin/users", "Người dùng"],
        ["/admin/orders", "Đơn hàng"],
    ];

    const logout = () => {
        localStorage.removeItem("adminSession");
        navigate("/admin/login");
    };

    return (
        <main className={`admin-layout ${className}`}>
            <aside className="admin-sidebar">
                <Link className="admin-brand" to="/admin"><span>A</span><strong>AiPhone <em>Store</em></strong></Link>
                <p className="admin-caption">TRUNG TÂM QUẢN TRỊ</p>
                <nav className="admin-nav">{navigation.map(([path, label]) => <Link className={location.pathname === path ? "active" : ""} to={path} key={path}><span>{label === "Tổng quan" ? "◈" : label === "Kho sản phẩm" ? "▦" : label === "Người dùng" ? "♙" : "▤"}</span>{label}</Link>)}</nav>
                <div className="admin-sidebar-bottom"><Link to="/">← Về cửa hàng</Link><button type="button" onClick={logout}>↪ Đăng xuất</button></div>
            </aside>
            <section className="admin-workspace">
                <header className="admin-page-header"><div><span className="admin-eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>{action}</header>
                {children}
            </section>
        </main>
    );
};

export default AdminLayout;
