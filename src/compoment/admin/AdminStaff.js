import React, { useEffect, useState } from "react";
import { apiRequest } from "../../lib/api";
import AdminLayout from "./AdminLayout";
import "./Users.css";

const AdminStaff = () => {
    const [staff, setStaff] = useState([]);
    const [formOpen, setFormOpen] = useState(false);
    const [form, setForm] = useState({ username: "", displayName: "", password: "" });
    const [error, setError] = useState("");

    useEffect(() => {
        let isMounted = true;
        apiRequest("/admin/staff", { admin: true })
            .then((result) => {
                if (isMounted) setStaff(Array.isArray(result) ? result : []);
            })
            .catch((requestError) => {
                if (isMounted) setError(requestError.message);
            });
        return () => { isMounted = false; };
    }, []);

    const createStaff = async (event) => {
        event.preventDefault();
        setError("");
        try {
            const created = await apiRequest("/admin/staff", {
                method: "POST",
                admin: true,
                body: {
                    username: form.username.trim(),
                    displayName: form.displayName.trim(),
                    password: form.password,
                },
            });
            setStaff((current) => [...current, created].sort((a, b) => a.username.localeCompare(b.username)));
            setForm({ username: "", displayName: "", password: "" });
            setFormOpen(false);
        } catch (requestError) {
            setError(requestError.message);
        }
    };

    const toggleStaffStatus = async (admin) => {
        const status = admin.status === "active" ? "blocked" : "active";
        setError("");
        try {
            await apiRequest(`/admin/staff/${admin.id}/status`, {
                method: "PATCH",
                admin: true,
                body: { status },
            });
            setStaff((current) => current.map((item) => item.id === admin.id ? { ...item, status } : item));
        } catch (requestError) {
            setError(requestError.message);
        }
    };

    return (
        <AdminLayout
            eyebrow="ADMIN / STAFF"
            title="Tài khoản nhân viên"
            description="Tạo tài khoản riêng và quản lý quyền đăng nhập của từng nhân viên."
            action={<button className="users-primary" type="button" onClick={() => setFormOpen(true)}>+ Thêm nhân viên</button>}
        >
            {error && <p className="form-error" role="alert">{error}</p>}
            <section className="users-panel">
                <div className="users-table-wrap">
                    <table className="users-table">
                        <thead><tr><th>TÊN NHÂN VIÊN</th><th>TÊN ĐĂNG NHẬP</th><th>NGÀY TẠO</th><th>TRẠNG THÁI</th><th>THAO TÁC</th></tr></thead>
                        <tbody>
                            {staff.map((admin) => (
                                <tr key={admin.id}>
                                    <td><strong>{admin.displayName}</strong></td>
                                    <td>{admin.username}</td>
                                    <td>{new Date(admin.createdAt).toLocaleDateString("vi-VN")}</td>
                                    <td><span className={`user-status ${admin.status}`}>{admin.status === "active" ? "Đang hoạt động" : "Đã khóa"}</span></td>
                                    <td><button className="user-action" type="button" onClick={() => toggleStaffStatus(admin)}>{admin.status === "active" ? "Khóa tài khoản" : "Mở khóa"}</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {staff.length === 0 && <div className="users-empty">Chưa có tài khoản nhân viên riêng.</div>}
                </div>
            </section>
            {formOpen && (
                <div className="users-modal" onMouseDown={(event) => event.target === event.currentTarget && setFormOpen(false)}>
                    <form className="user-form" onSubmit={createStaff}>
                        <button className="user-form-close" type="button" onClick={() => setFormOpen(false)}>×</button>
                        <span className="admin-eyebrow">ADMIN STAFF</span>
                        <h2>Tạo tài khoản nhân viên</h2>
                        <label>Tên nhân viên<input value={form.displayName} onChange={(event) => setForm({ ...form, displayName: event.target.value })} maxLength={80} required /></label>
                        <label>Tên đăng nhập<input value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value.replace(/[^a-zA-Z0-9._-]/g, "") })} minLength={3} maxLength={40} autoComplete="username" required /></label>
                        <label>Mật khẩu (ít nhất 8 ký tự)<input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} minLength={8} maxLength={100} autoComplete="new-password" required /></label>
                        <button className="users-primary" type="submit">Tạo tài khoản</button>
                    </form>
                </div>
            )}
        </AdminLayout>
    );
};

export default AdminStaff;
