import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { getOrders, readStorage } from "../../lib/store";
import AdminLayout from "./AdminLayout";

const Admin = () => {
    const products = readStorage("storeProducts", []);
    const users = readStorage("users", []);
    const orders = getOrders();
    const pendingOrders = useMemo(() => orders.filter((order) => order.status === "pending"), [orders]);
    const revenue = orders.filter((order) => order.status === "completed").reduce((sum, order) => sum + Number(order.total || 0), 0);

    return (
        <AdminLayout eyebrow="OVERVIEW / DASHBOARD" title="Tổng quan" description="Theo dõi nhanh hoạt động của AiPhone Store.">
            <div className="admin-kpi-row"><div className="admin-kpi"><small>Sản phẩm trong kho</small><strong>{products.length || 60}</strong></div><div className="admin-kpi"><small>Người dùng đăng ký</small><strong>{users.length}</strong></div><div className="admin-kpi"><small>Đơn chờ xử lý</small><strong>{pendingOrders.length}</strong></div><div className="admin-kpi"><small>Doanh thu hoàn tất</small><strong>{revenue.toLocaleString("vi-VN")}đ</strong></div></div>
            <div className="admin-dashboard-grid">
                <OverviewCard icon="▦" title="Kho sản phẩm" description="Thêm sản phẩm, cập nhật tồn kho, giá bán và trạng thái hiển thị." to="/admin/products" />
                <OverviewCard icon="♙" title="Người dùng" description="Xem tài khoản, số điện thoại và quản lý trạng thái người dùng." to="/admin/users" />
                <OverviewCard icon="▤" title="Đơn hàng" description="Theo dõi đơn mới, cập nhật giao hàng và xem thông tin khách." to="/admin/orders" />
            </div>
            <section className="admin-section-panel"><h2>Đơn hàng gần đây</h2>{orders.length ? <div className="admin-activity-list">{orders.slice(0, 5).map((order) => <div key={order.id}><span><strong>{order.id}</strong> · {order.customer}</span><strong>{Number(order.total || 0).toLocaleString("vi-VN")}đ</strong></div>)}</div> : <p className="admin-empty">Chưa có đơn hàng nào. Đơn mới sẽ xuất hiện tại đây.</p>}</section>
        </AdminLayout>
    );
};

const OverviewCard = ({ icon, title, description, to }) => <article className="admin-overview-card"><span className="overview-icon">{icon}</span><h2>{title}</h2><p>{description}</p><Link to={to}>Mở khu vực quản lý →</Link></article>;

export default Admin;
