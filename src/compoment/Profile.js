import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest, USER_TOKEN_KEY } from "../lib/api";
import "./Profile.css";

const ORDER_STATUSES = {
  pending: { label: "Chờ xác nhận", className: "neutral" },
  confirmed: { label: "Đã xác nhận", className: "info" },
  shipping: { label: "Đang giao", className: "warning" },
  completed: { label: "Đã giao", className: "success" },
  cancelled: { label: "Đã hủy", className: "danger" },
};

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState("");
  const [ordersRequireLogin, setOrdersRequireLogin] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);

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
      });
    }
  }, []);

  useEffect(() => {
    if (!user) return undefined;

    let isMounted = true;
    const loadOrders = async () => {
      setOrdersLoading(true);
      setOrdersError("");
      setOrdersRequireLogin(false);
      try {
        const result = await apiRequest("/orders/mine", { user: true });
        if (!Array.isArray(result)) {
          throw new Error("Máy chủ trả về danh sách đơn hàng không hợp lệ.");
        }
        if (isMounted) setOrders(result);
      } catch (requestError) {
        if (isMounted) {
          setOrdersError(requestError.message);
          setOrdersRequireLogin(requestError.status === 401 || !localStorage.getItem(USER_TOKEN_KEY));
        }
      } finally {
        if (isMounted) setOrdersLoading(false);
      }
    };

    loadOrders();
    return () => { isMounted = false; };
  }, [user, refreshCount]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem(USER_TOKEN_KEY);
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

  const totalSpent = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);

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
              <strong>{orders.length}</strong>
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
              <h3>Theo dõi đơn hàng</h3>
              <button
                className="ghost-btn"
                type="button"
                onClick={() => setRefreshCount((count) => count + 1)}
                disabled={ordersLoading}
              >
                {ordersLoading ? "Đang tải..." : "Làm mới"}
              </button>
            </div>

            {ordersError && (
              <div className="orders-error" role="alert">
                <p>{ordersError}</p>
                {ordersRequireLogin && (
                  <button
                    className="login-btn"
                    type="button"
                    onClick={() => navigate("/login", { state: { from: "/profile" } })}
                  >
                    Đăng nhập lại
                  </button>
                )}
              </div>
            )}
            {ordersLoading ? (
              <p className="empty-state" role="status">Đang tải trạng thái đơn hàng...</p>
            ) : ordersError ? null : orders.length === 0 ? (
              <p className="empty-state">Bạn chưa có đơn hàng nào.</p>
            ) : (
              <div className="orders-list">
                {orders.map((order) => {
                  const status = ORDER_STATUSES[order.status] || { label: order.status, className: "neutral" };
                  const productNames = (order.items || []).map((item) => item.name).filter(Boolean).join(", ");
                  const createdAt = new Date(order.createdAt);
                  return (
                    <div className="order-item" key={order.id}>
                      <div>
                        <p className="order-id">Mã đơn: {order.orderNumber}</p>
                        <h4>{productNames || `${order.totalQuantity || 0} sản phẩm`}</h4>
                      </div>
                      <div className="order-meta">
                        <time dateTime={order.createdAt}>{createdAt.toLocaleDateString("vi-VN")}</time>
                        <span className={`badge ${status.className}`}>
                          {status.label}
                        </span>
                      </div>
                      <strong>{Number(order.total || 0).toLocaleString("vi-VN")}đ</strong>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
};

export default Profile;