import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { readStorage, removeCartItemsForOrder } from "../../lib/store";
import { apiRequest } from "../../lib/api";
import "./admin-common.css";
import "./OrderManagement.css";

const statusLabels = { pending: "Chờ xử lý", confirmed: "Đã xác nhận", shipping: "Đang giao", completed: "Hoàn tất", cancelled: "Đã hủy" };

const OrderManagement = () => {
    const [orders, setOrders] = useState([]);
    const [error, setError] = useState("");
    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedOrder, setSelectedOrder] = useState(null);

    useEffect(() => {
        let isMounted = true;
        const loadOrders = async () => {
            try {
                let savedOrders = await apiRequest("/admin/orders", { admin: true });
                if (savedOrders.length === 0) {
                    const legacyOrders = readStorage("orders", []);
                    if (Array.isArray(legacyOrders) && legacyOrders.length) {
                        try {
                            savedOrders = await apiRequest("/admin/orders/import", {
                                method: "POST",
                                body: legacyOrders,
                                admin: true,
                            });
                            localStorage.removeItem("orders");
                        } catch (importError) {
                            savedOrders = await apiRequest("/admin/orders", { admin: true });
                            if (savedOrders.length === 0) throw importError;
                        }
                    }
                }
                if (isMounted) setOrders(savedOrders.map(normalizeOrder));
            } catch (requestError) {
                if (isMounted) setError(requestError.message);
            }
        };
        loadOrders();
        return () => { isMounted = false; };
    }, []);

    const filteredOrders = useMemo(() => orders.filter((order) => {
        const searchable = `${order.id} ${order.customer} ${order.phone}`.toLowerCase();
        return searchable.includes(query.toLowerCase()) && (statusFilter === "all" || order.status === statusFilter);
    }), [orders, query, statusFilter]);

    const stats = {
        total: orders.length,
        pending: orders.filter((order) => order.status === "pending").length,
        shipping: orders.filter((order) => order.status === "shipping").length,
        revenue: orders.filter((order) => order.status === "completed").reduce((sum, order) => sum + order.total, 0),
    };

    const updateStatus = async (order, status) => {
        try {
            await apiRequest(`/admin/orders/${order.databaseId}/status`, {
                method: "PATCH",
                body: { status },
                admin: true,
            });
            const updatedOrder = { ...order, status, updatedAt: new Date().toISOString() };
            setOrders((current) => current.map((item) => item.id === order.id ? updatedOrder : item));
            if (status === "completed") removeCartItemsForOrder(order);
            if (selectedOrder?.id === order.id) setSelectedOrder(updatedOrder);
            setError("");
        } catch (requestError) {
            setError(requestError.message);
        }
    };

    const deleteOrder = async (order) => {
        if (!window.confirm(`Xóa lịch sử đơn ${order.id}?`)) return;
        try {
            await apiRequest(`/admin/orders/${order.databaseId}`, { method: "DELETE", admin: true });
            setOrders((current) => current.filter((item) => item.id !== order.id));
            setSelectedOrder(null);
            setError("");
        } catch (requestError) {
            setError(requestError.message);
        }
    };

    return (
        <main className="admin-layout orders-page">
            <aside className="admin-sidebar">
                <Link className="admin-brand" to="/admin"><span>A</span> AiPhone Store</Link>
                <p className="admin-caption">TRUNG TÂM QUẢN TRỊ</p>
                <nav className="admin-nav"><Link to="/admin">Tổng quan</Link><Link to="/admin/products">Kho sản phẩm</Link><Link to="/admin/users">Người dùng</Link><Link className="active" to="/admin/orders">Đơn hàng</Link></nav>
                <Link className="back-store" to="/">← Về cửa hàng</Link>
            </aside>
            <section className="admin-workspace orders-content">
                <header className="orders-header"><div><span className="admin-eyebrow">OPERATIONS / ORDERS</span><h1>Quản lý đơn hàng</h1><p>Theo dõi, xác nhận và cập nhật tiến trình giao hàng.</p></div></header>
                {error && <p className="form-error" role="alert">{error}</p>}
                <div className="orders-stats"><div><small>Tổng đơn</small><strong>{stats.total}</strong></div><div><small>Chờ xử lý</small><strong>{stats.pending}</strong></div><div><small>Đang giao</small><strong>{stats.shipping}</strong></div><div><small>Doanh thu hoàn tất</small><strong>{stats.revenue.toLocaleString("vi-VN")}đ</strong></div></div>
                <section className="orders-panel">
                    <div className="orders-toolbar"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm mã đơn, tên khách hoặc số điện thoại..." /><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">Tất cả trạng thái</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
                    <div className="orders-table-wrap"><table className="orders-table"><thead><tr><th>MÃ ĐƠN</th><th>KHÁCH HÀNG</th><th>SẢN PHẨM</th><th>TỔNG TIỀN</th><th>NGÀY ĐẶT</th><th>TRẠNG THÁI</th><th>THAO TÁC</th></tr></thead><tbody>{filteredOrders.map((order) => <tr key={order.id}><td><strong>{order.id}</strong></td><td><strong>{order.customer}</strong><small>{order.phone}</small></td><td>{order.items?.length || 0} mặt hàng<small>{order.totalQuantity || 0} sản phẩm</small></td><td><strong>{Number(order.total).toLocaleString("vi-VN")}đ</strong></td><td>{new Date(order.createdAt).toLocaleDateString("vi-VN")}</td><td><select className={`order-status ${order.status}`} value={order.status} onChange={(event) => updateStatus(order, event.target.value)}>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></td><td><button className="view-order" type="button" onClick={() => setSelectedOrder(order)}>Chi tiết</button><button className="delete-order" type="button" onClick={() => deleteOrder(order)}>Xóa</button></td></tr>)}</tbody></table>{filteredOrders.length === 0 && <div className="orders-empty">Chưa có đơn hàng phù hợp.</div>}</div>
                </section>
            </section>
            {selectedOrder && <div className="order-detail-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setSelectedOrder(null)}><section className="order-detail-card"><button className="detail-close" type="button" onClick={() => setSelectedOrder(null)}>×</button><span className="admin-eyebrow">ORDER DETAIL</span><h2>{selectedOrder.id}</h2><div className="customer-box"><strong>{selectedOrder.customer}</strong><span>{selectedOrder.phone}</span><span>{selectedOrder.address}</span></div><div className="order-items">{selectedOrder.items?.map((item, index) => <div key={`${item.id}-${index}`}><span>{item.name} × {item.quantity || 1}</span><strong>{(item.price * (item.quantity || 1)).toLocaleString("vi-VN")}đ</strong></div>)}</div><div className="detail-total"><span>Tổng thanh toán</span><strong>{Number(selectedOrder.total).toLocaleString("vi-VN")}đ</strong></div><button className="complete-order" type="button" onClick={() => updateStatus(selectedOrder, "completed")} disabled={selectedOrder.status === "completed" || selectedOrder.status === "cancelled"}>{selectedOrder.status === "completed" ? "Đã hoàn tất" : "Đánh dấu hoàn tất"}</button></section></div>}
        </main>
    );
};

function normalizeOrder(order) {
    return { ...order, databaseId: order.id, id: order.orderNumber };
}

export default OrderManagement;
