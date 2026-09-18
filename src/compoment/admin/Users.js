import React, { useMemo, useState } from "react";
import { readStorage } from "../../lib/store";
import AdminLayout from "./AdminLayout";
import "./Users.css";

const Users = () => {
    const [users, setUsers] = useState(() => readStorage("users", []));
    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [formOpen, setFormOpen] = useState(false);
    const [form, setForm] = useState({ username: "", phone: "", password: "" });

    const filteredUsers = useMemo(() => users.filter((user) => {
        const value = `${user.username || user.name || ""} ${user.phone || ""}`.toLowerCase();
        const status = user.status || "active";
        return value.includes(query.toLowerCase()) && (statusFilter === "all" || status === statusFilter);
    }), [users, query, statusFilter]);

    const persist = (nextUsers) => { localStorage.setItem("users", JSON.stringify(nextUsers)); setUsers(nextUsers); };
    const addUser = (event) => {
        event.preventDefault();
        const newUser = { id: Date.now(), username: form.username.trim(), phone: form.phone.trim(), password: form.password, status: "active", createdAt: new Date().toISOString() };
        persist([newUser, ...users]);
        setForm({ username: "", phone: "", password: "" });
        setFormOpen(false);
    };
    const toggleStatus = (user) => persist(users.map((item) => item.id === user.id ? { ...item, status: (item.status || "active") === "active" ? "blocked" : "active" } : item));
    const removeUser = (user) => { if (window.confirm(`Xóa tài khoản ${user.username || user.phone}?`)) persist(users.filter((item) => item.id !== user.id)); };

    return <AdminLayout eyebrow="CUSTOMERS / USERS" title="Người dùng" description="Quản lý tài khoản khách hàng và trạng thái hoạt động." action={<button className="users-primary" type="button" onClick={() => setFormOpen(true)}>+ Thêm người dùng</button>}>
        <div className="admin-kpi-row"><div className="admin-kpi"><small>Tổng tài khoản</small><strong>{users.length}</strong></div><div className="admin-kpi"><small>Đang hoạt động</small><strong>{users.filter((user) => (user.status || "active") === "active").length}</strong></div><div className="admin-kpi"><small>Đã khóa</small><strong>{users.filter((user) => user.status === "blocked").length}</strong></div><div className="admin-kpi"><small>Hiển thị</small><strong>{filteredUsers.length}</strong></div></div>
        <section className="users-panel"><div className="users-toolbar"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm tên user hoặc số điện thoại..." /><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">Tất cả trạng thái</option><option value="active">Đang hoạt động</option><option value="blocked">Đã khóa</option></select></div><div className="users-table-wrap"><table className="users-table"><thead><tr><th>NGƯỜI DÙNG</th><th>SỐ ĐIỆN THOẠI</th><th>NGÀY TẠO</th><th>TRẠNG THÁI</th><th>THAO TÁC</th></tr></thead><tbody>{filteredUsers.map((user) => { const status = user.status || "active"; return <tr key={user.id}><td><div className="user-cell"><span>{(user.username || user.name || "U").charAt(0).toUpperCase()}</span><div><strong>{user.username || user.name || "Chưa đặt tên"}</strong><small>ID: {user.id}</small></div></div></td><td>{user.phone || "Chưa cập nhật"}</td><td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString("vi-VN") : "-"}</td><td><button className={`user-status ${status}`} type="button" onClick={() => toggleStatus(user)}>{status === "active" ? "Đang hoạt động" : "Đã khóa"}</button></td><td><button className="user-action" type="button" onClick={() => toggleStatus(user)}>{status === "active" ? "Khóa" : "Mở khóa"}</button><button className="user-action danger" type="button" onClick={() => removeUser(user)}>Xóa</button></td></tr>; })}</tbody></table>{filteredUsers.length === 0 && <div className="users-empty">Chưa có người dùng phù hợp.</div>}</div></section>
        {formOpen && <div className="users-modal" onMouseDown={(event) => event.target === event.currentTarget && setFormOpen(false)}><form className="user-form" onSubmit={addUser}><button className="user-form-close" type="button" onClick={() => setFormOpen(false)}>×</button><span className="admin-eyebrow">NEW CUSTOMER</span><h2>Thêm người dùng</h2><label>Tên user<input value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} required /></label><label>Số điện thoại<input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value.replace(/\D/g, "") })} maxLength="11" required /></label><label>Mật khẩu<input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} minLength="6" required /></label><button className="users-primary" type="submit">Tạo tài khoản</button></form></div>}
    </AdminLayout>;
};

export default Users;
