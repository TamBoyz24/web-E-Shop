import React, { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../../lib/api";
import AdminLayout from "./AdminLayout";
import "./Users.css";

const Users = () => {
    const [users, setUsers] = useState([]);
    const [recoveryRequests, setRecoveryRequests] = useState([]);
    const [error, setError] = useState("");
    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [formOpen, setFormOpen] = useState(false);
    const [passwordUser, setPasswordUser] = useState(null);
    const [newPassword, setNewPassword] = useState("");
    const [form, setForm] = useState({ username: "", phone: "", password: "" });

    useEffect(() => {
        let isMounted = true;
        apiRequest("/admin/users", { admin: true })
            .then((savedUsers) => { if (isMounted) setUsers(savedUsers); })
            .catch((requestError) => { if (isMounted) setError(requestError.message); });
        apiRequest("/admin/password-recovery-requests", { admin: true })
            .then((requests) => { if (isMounted) setRecoveryRequests(Array.isArray(requests) ? requests : []); })
            .catch((requestError) => { if (isMounted) setError(requestError.message); });
        return () => { isMounted = false; };
    }, []);

    const filteredUsers = useMemo(() => users.filter((user) => {
        const value = `${user.username || user.name || ""} ${user.phone || ""}`.toLowerCase();
        const status = user.status || "active";
        return value.includes(query.toLowerCase()) && (statusFilter === "all" || status === statusFilter);
    }), [users, query, statusFilter]);

    const addUser = async (event) => {
        event.preventDefault();
        setError("");
        try {
            const newUser = await apiRequest("/admin/users", {
                method: "POST",
                admin: true,
                body: { username: form.username.trim(), phone: form.phone.trim(), password: form.password },
            });
            setUsers((current) => [newUser, ...current]);
            setForm({ username: "", phone: "", password: "" });
            setFormOpen(false);
        } catch (requestError) {
            setError(requestError.message);
        }
    };

    const toggleStatus = async (user) => {
        const status = (user.status || "active") === "active" ? "blocked" : "active";
        try {
            await apiRequest(`/admin/users/${user.id}/status`, { method: "PATCH", body: { status }, admin: true });
            setUsers((current) => current.map((item) => item.id === user.id ? { ...item, status } : item));
            setError("");
        } catch (requestError) {
            setError(requestError.message);
        }
    };

    const removeUser = async (user) => {
        if (!window.confirm(`Xóa tài khoản ${user.username || user.phone}?`)) return;
        try {
            await apiRequest(`/admin/users/${user.id}`, { method: "DELETE", admin: true });
            setUsers((current) => current.filter((item) => item.id !== user.id));
            setError("");
        } catch (requestError) {
            setError(requestError.message);
        }
    };

    const resetPassword = async (event) => {
        event.preventDefault();
        if (!passwordUser) return;
        try {
            const updatedUser = await apiRequest(`/admin/users/${passwordUser.id}/password`, {
                method: "PATCH",
                admin: true,
                body: { password: newPassword },
            });
            setUsers((current) => current.map((item) => item.id === updatedUser.id ? updatedUser : item));
            setRecoveryRequests((current) => current.filter((request) => request.phone !== updatedUser.phone));
            setPasswordUser(null);
            setNewPassword("");
            setError("");
        } catch (requestError) {
            setError(requestError.message);
        }
    };

    const dismissRecoveryRequest = async (request) => {
        try {
            await apiRequest(`/admin/password-recovery-requests/${request.id}`, {
                method: "PATCH",
                admin: true,
                body: { status: "dismissed" },
            });
            setRecoveryRequests((current) => current.filter((item) => item.id !== request.id));
            setError("");
        } catch (requestError) {
            setError(requestError.message);
        }
    };

    const startRecovery = (request) => {
        const matchingUser = users.find((user) => user.phone === request.phone);
        if (matchingUser) {
            setPasswordUser(matchingUser);
            setNewPassword("");
        } else {
            setError("Không tìm thấy tài khoản khách hàng tương ứng với yêu cầu này.");
        }
    };

    return (
        <AdminLayout
            eyebrow="CUSTOMERS / USERS"
            title="Người dùng"
            description="Quản lý tài khoản khách hàng, yêu cầu khôi phục và lịch sử đổi mật khẩu."
            action={<button className="users-primary" type="button" onClick={() => setFormOpen(true)}>+ Thêm người dùng</button>}
        >
            {error && <p className="form-error" role="alert">{error}</p>}

            <div className="admin-kpi-row">
                <div className="admin-kpi"><small>Tổng tài khoản</small><strong>{users.length}</strong></div>
                <div className="admin-kpi"><small>Đang hoạt động</small><strong>{users.filter((user) => (user.status || "active") === "active").length}</strong></div>
                <div className="admin-kpi"><small>Đã khóa</small><strong>{users.filter((user) => user.status === "blocked").length}</strong></div>
                <div className="admin-kpi"><small>Yêu cầu khôi phục</small><strong>{recoveryRequests.length}</strong></div>
            </div>

            <section className="users-panel recovery-requests-panel">
                <header className="users-section-heading">
                    <div><h2>Yêu cầu quên mật khẩu</h2><p>Xác minh khách hàng qua điện thoại trước khi đặt mật khẩu mới.</p></div>
                </header>
                {recoveryRequests.length === 0 ? (
                    <p className="users-empty">Không có yêu cầu đang chờ.</p>
                ) : (
                    <div className="users-table-wrap">
                        <table className="users-table recovery-table">
                            <thead><tr><th>SỐ ĐIỆN THOẠI</th><th>THỜI GIAN GỬI</th><th>THAO TÁC</th></tr></thead>
                            <tbody>
                                {recoveryRequests.map((request) => {
                                    const matchingUser = users.find((user) => user.phone === request.phone);
                                    return (
                                        <tr key={request.id}>
                                            <td>{request.phone}{matchingUser && <small className="recovery-customer-name">{matchingUser.username}</small>}</td>
                                            <td>{new Date(request.createdAt).toLocaleString("vi-VN")}</td>
                                            <td>
                                                {matchingUser && <button className="user-action" type="button" onClick={() => startRecovery(request)}>Xác minh &amp; đặt lại mật khẩu</button>}
                                                <button className="user-action danger" type="button" onClick={() => dismissRecoveryRequest(request)}>Đóng yêu cầu</button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            <section className="users-panel">
                <div className="users-toolbar">
                    <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm tên user hoặc số điện thoại..." />
                    <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                        <option value="all">Tất cả trạng thái</option>
                        <option value="active">Đang hoạt động</option>
                        <option value="blocked">Đã khóa</option>
                    </select>
                </div>
                <div className="users-table-wrap">
                    <table className="users-table customers-table">
                        <thead><tr><th>NGƯỜI DÙNG</th><th>SỐ ĐIỆN THOẠI</th><th>NGÀY TẠO</th><th>LẦN ĐỔI MẬT KHẨU GẦN NHẤT</th><th>TRẠNG THÁI</th><th>THAO TÁC</th></tr></thead>
                        <tbody>
                            {filteredUsers.map((user) => {
                                const status = user.status || "active";
                                const latestChange = (user.passwordChanges || []).at(-1);
                                return (
                                    <tr key={user.id}>
                                        <td><div className="user-cell"><span>{(user.username || user.name || "U").charAt(0).toUpperCase()}</span><div><strong>{user.username || user.name || "Chưa đặt tên"}</strong><small>ID: {user.id}</small></div></div></td>
                                        <td>{user.phone || "Chưa cập nhật"}</td>
                                        <td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString("vi-VN") : "-"}</td>
                                        <td>{latestChange ? <span className="password-audit"><strong>{latestChange.adminName}</strong><small>{new Date(latestChange.changedAt).toLocaleString("vi-VN")}</small></span> : "Chưa đổi bởi admin"}</td>
                                        <td><button className={`user-status ${status}`} type="button" onClick={() => toggleStatus(user)}>{status === "active" ? "Đang hoạt động" : "Đã khóa"}</button></td>
                                        <td>
                                            <button className="user-action" type="button" onClick={() => { setPasswordUser(user); setNewPassword(""); }}>Đổi mật khẩu</button>
                                            <button className="user-action" type="button" onClick={() => toggleStatus(user)}>{status === "active" ? "Khóa" : "Mở khóa"}</button>
                                            <button className="user-action danger" type="button" onClick={() => removeUser(user)}>Xóa</button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {filteredUsers.length === 0 && <div className="users-empty">Chưa có người dùng phù hợp.</div>}
                </div>
            </section>

            {formOpen && (
                <div className="users-modal" onMouseDown={(event) => event.target === event.currentTarget && setFormOpen(false)}>
                    <form className="user-form" onSubmit={addUser}>
                        <button className="user-form-close" type="button" onClick={() => setFormOpen(false)}>×</button>
                        <span className="admin-eyebrow">NEW CUSTOMER</span>
                        <h2>Thêm người dùng</h2>
                        <label>Tên user<input value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} maxLength={80} required /></label>
                        <label>Số điện thoại<input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value.replace(/\D/g, "") })} minLength={10} maxLength={11} required /></label>
                        <label>Mật khẩu<input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} minLength={6} maxLength={50} required /></label>
                        <button className="users-primary" type="submit">Tạo tài khoản</button>
                    </form>
                </div>
            )}

            {passwordUser && (
                <div className="users-modal" onMouseDown={(event) => event.target === event.currentTarget && setPasswordUser(null)}>
                    <form className="user-form" onSubmit={resetPassword}>
                        <button className="user-form-close" type="button" onClick={() => setPasswordUser(null)}>×</button>
                        <span className="admin-eyebrow">CUSTOMER PASSWORD</span>
                        <h2>Đặt lại mật khẩu</h2>
                        <p>{passwordUser.username} · {passwordUser.phone}</p>
                        <label>Mật khẩu mới<input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength={6} maxLength={50} autoComplete="new-password" required /></label>
                        <p className="password-audit-note">Hệ thống sẽ lưu tên nhân viên đang đăng nhập và thời gian đổi; mật khẩu không được ghi vào nhật ký.</p>
                        <button className="users-primary" type="submit">Lưu mật khẩu mới</button>
                    </form>
                </div>
            )}
        </AdminLayout>
    );
};

export default Users;
