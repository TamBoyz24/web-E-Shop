import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Profile.css";

const defaultOrders = [
  { id: "#1001", name: "iPhone 15 Pro Max", status: "Đã giao", total: 28990000, date: "12/09/2026" },
  { id: "#1002", name: "Samsung Galaxy S24 Ultra", status: "Đang giao", total: 25990000, date: "08/09/2026" },
  { id: "#1003", name: "Xiaomi Redmi Note 13 Pro", status: "Đã thanh toán", total: 7990000, date: "30/08/2026" }
];

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("user") || localStorage.getItem("currentUser") || "null");
    if (savedUser) {
      setUser({
        ...savedUser,
        name: savedUser.name || savedUser.username || "Khách hàng",
        email: savedUser.email || "customer@gmail.com",
        phone: savedUser.phone || "Chưa cập nhật",
        avatar: savedUser.avatar || "https://i.pravatar.cc/150?img=12",
        address: savedUser.address || "Chưa cập nhật địa chỉ",
        orders: savedUser.orders || defaultOrders,
      });
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("isLoggedIn");
    setUser(null);
    navigate("/login");
  };

  if (!user) {
    return (
      <div className="login-prompt">
        <div className="login-prompt-box">
          <h2>Chào bạn!</h2>
          <p>Vui lòng đăng nhập hoặc đăng ký để xem thông tin cá nhân.</p>
          <button className="login-btn" onClick={() => navigate("/login")}>Đăng nhập</button>
        </div>
      </div>
    );
  }

  const totalSpent = (user.orders || []).reduce((sum, order) => sum + Number(order.total || 0), 0);

  return (
    <div className="profile-page">
      <div className="profile-shell">
        <aside className="profile-sidebar">
          <div className="profile-card">
            <div className="avatar-wrap">
              <img src={user.avatar} alt="Avatar" />
            </div>
            <h2>{user.name || user.username}</h2>
            <p className="profile-email">{user.email}</p>

            <div className="profile-status">
              <span className="status-dot" />
              Đang hoạt động
            </div>

            <div className="profile-actions">
              <button className="primary-btn" onClick={() => navigate("/edit-profile")}>Sửa thông tin</button>
              <button className="secondary-btn" onClick={handleLogout}>Đăng xuất</button>
            </div>
          </div>
        </aside>

        <main className="profile-content">
          <section className="summary-grid">
            <div className="summary-card">
              <span className="label">Tổng đơn hàng</span>
              <strong>{(user.orders || []).length}</strong>
            </div>
            <div className="summary-card">
              <span className="label">Tổng chi tiêu</span>
              <strong>{totalSpent.toLocaleString()}đ</strong>
            </div>
            <div className="summary-card">
              <span className="label">Điểm tích lũy</span>
              <strong>{Math.floor(totalSpent / 100000)} điểm</strong>
            </div>
          </section>

          <section className="info-panel">
            <div className="section-header">
              <h3>Thông tin tài khoản</h3>
            </div>

            <div className="info-grid">
              <div className="info-item">
                <span>Họ tên</span>
                <strong>{user.name || user.username}</strong>
              </div>
              <div className="info-item">
                <span>Số điện thoại</span>
                <strong>{user.phone}</strong>
              </div>
              <div className="info-item">
                <span>Email</span>
                <strong>{user.email}</strong>
              </div>
              <div className="info-item">
                <span>Địa chỉ</span>
                <strong>{user.address}</strong>
              </div>
            </div>
          </section>

          <section className="orders-panel">
            <div className="section-header">
              <h3>Đơn hàng gần đây</h3>
              <button className="ghost-btn" type="button" onClick={() => navigate("/")}>Xem thêm</button>
            </div>

            {(user.orders || []).length === 0 ? (
              <p className="empty-state">Bạn chưa có đơn hàng nào.</p>
            ) : (
              <div className="orders-list">
                {(user.orders || []).map((order, index) => (
                  <div className="order-item" key={`${order.id}-${index}`}>
                    <div>
                      <p className="order-id">{order.id}</p>
                      <h4>{order.name}</h4>
                    </div>
                    <div className="order-meta">
                      <span>{order.date}</span>
                      <span className={`badge ${order.status === "Đã giao" ? "success" : order.status === "Đang giao" ? "warning" : "neutral"}`}>
                        {order.status}
                      </span>
                    </div>
                    <strong>{Number(order.total).toLocaleString()}đ</strong>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
};

export default Profile;