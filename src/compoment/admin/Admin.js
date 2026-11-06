import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../../lib/api";
import AdminLayout from "./AdminLayout";

const EMPTY_DASHBOARD = {
    productCount: 0,
    userCount: 0,
    orders: [],
    pendingOrderCount: 0,
    completedRevenue: 0,
};

const Admin = () => {
    const [dashboard, setDashboard] = useState(EMPTY_DASHBOARD);
    const [error, setError] = useState("");

    useEffect(() => {
        let isMounted = true;
        apiRequest("/admin/dashboard", { admin: true })
            .then((data) => {
                if (!isMounted) return;
                if (!data || typeof data !== "object" || Array.isArray(data)) {
                    setError("Dữ liệu tổng quan không hợp lệ. Vui lòng thử tải lại trang.");
                    return;
                }
                setDashboard({ ...EMPTY_DASHBOARD, ...data, orders: Array.isArray(data.orders) ? data.orders : [] });
            })
            .catch((requestError) => { if (isMounted) setError(requestError.message); });
        return () => { isMounted = false; };
    }, []);

    return (
        <AdminLayout eyebrow="OVERVIEW / DASHBOARD" title="Tổng quan" description="Theo dõi nhanh hoạt động của AiPhone Store.">
            {error && <p className="form-error" role="alert">{error}</p>}
            <div className="admin-kpi-row"><div className="admin-kpi"><small>Sản phẩm trong kho</small><strong>{dashboard.productCount}</strong></div><div className="admin-kpi"><small>Người dùng đăng ký</small><strong>{dashboard.userCount}</strong></div><div className="admin-kpi"><small>Đơn chờ xử lý</small><strong>{dashboard.pendingOrderCount}</strong></div><div className="admin-kpi"><small>Doanh thu hoàn tất</small><strong>{Number(dashboard.completedRevenue).toLocaleString("vi-VN")}đ</strong></div></div>
            <div className="admin-dashboard-grid">
                <OverviewCard icon="▦" title="Kho sản phẩm" description="Thêm sản phẩm, cập nhật tồn kho, giá bán và trạng thái hiển thị." to="/admin/products" />
                <OverviewCard icon="♙" title="Người dùng" description="Xem tài khoản, số điện thoại và quản lý trạng thái người dùng." to="/admin/users" />
                <OverviewCard icon="▤" title="Đơn hàng" description="Theo dõi đơn mới, cập nhật giao hàng và xem thông tin khách." to="/admin/orders" />
            </div>
            <section className="admin-section-panel"><h2>Đơn hàng gần đây</h2>{dashboard.orders.length ? <div className="admin-activity-list">{dashboard.orders.slice(0, 5).map((order) => <div key={order.id}><span><strong>{order.orderNumber}</strong> · {order.customer}</span><strong>{Number(order.total || 0).toLocaleString("vi-VN")}đ</strong></div>)}</div> : <p className="admin-empty">Chưa có đơn hàng nào. Đơn mới sẽ xuất hiện tại đây.</p>}</section>
        </AdminLayout>
    );
};

const OverviewCard = ({ icon, title, description, to }) => <article className="admin-overview-card"><span className="overview-icon">{icon}</span><h2>{title}</h2><p>{description}</p><Link to={to}>Mở khu vực quản lý →</Link></article>;

export default Admin;
