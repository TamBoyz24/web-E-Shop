import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiRequest } from "../../lib/api";
import AdminLayout from "./AdminLayout";
import "./UserDetails.css";

const UserDetails = () => {
    const { id } = useParams();
    const [user, setUser] = useState(null);
    const [form, setForm] = useState({ username: "", phone: "", email: "" });
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        let isMounted = true;
        apiRequest(`/admin/users/${id}`, { admin: true })
            .then((result) => {
                if (!isMounted) return;
                setUser(result);
                setForm({ username: result.username || "", phone: result.phone || "", email: result.email || "" });
            })
            .catch((requestError) => {
                if (isMounted) setError(requestError.message);
            });
        return () => { isMounted = false; };
    }, [id]);

    const saveProfile = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError("");
        setMessage("");
        try {
            const updatedUser = await apiRequest(`/admin/users/${id}/profile`, {
                method: "PUT",
                body: form,
                admin: true,
            });
            setUser(updatedUser);
            setForm({ username: updatedUser.username || "", phone: updatedUser.phone || "", email: updatedUser.email || "" });
            setMessage("Đã cập nhật thông tin khách hàng.");
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <AdminLayout
            eyebrow="CUSTOMER / DETAILS"
            title={user?.username || "Chi tiết khách hàng"}
            description="Thông tin tài khoản, người tạo và nhật ký thay đổi."
            action={<Link className="customer-back-link" to="/admin/users">← Danh sách khách</Link>}
            className="customer-details-layout"
        >
            {error && <p className="form-error" role="alert">{error}</p>}
            {message && <p className="customer-details-success" role="status">{message}</p>}
            {!user && !error && <p>Đang tải thông tin khách hàng...</p>}
            {user && (
                <div className="customer-details-grid">
                    <section className="customer-details-card">
                        <div className="customer-created-meta">
                            <span><small>TÀI KHOẢN TẠO NGÀY</small><strong>{new Date(user.createdAt).toLocaleString("vi-VN")}</strong></span>
                            <span><small>NGƯỜI TẠO</small><strong>{user.createdByAdminName || "Khách tự đăng ký"}</strong></span>
                            <span><small>TRẠNG THÁI</small><strong>{user.status === "blocked" ? "Đã khóa" : "Đang hoạt động"}</strong></span>
                        </div>
                        <form className="customer-details-form" onSubmit={saveProfile}>
                            <h2>Thông tin tài khoản</h2>
                            <label>Họ tên<input value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} maxLength={80} required /></label>
                            <label>Số điện thoại<input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value.replace(/\D/g, "") })} minLength={10} maxLength={11} required /></label>
                            <label>Email<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} maxLength={254} /></label>
                            <button type="submit" disabled={saving}>{saving ? "Đang lưu..." : "Lưu thay đổi"}</button>
                        </form>
                    </section>
                    <section className="customer-details-card">
                        <h2>Lịch sử cập nhật tài khoản</h2>
                        {(user.profileChanges || []).length === 0
                            ? <p className="customer-history-empty">Chưa có lần cập nhật nào được ghi nhận.</p>
                            : <ol className="customer-history">
                                {[...user.profileChanges].reverse().map((change, index) => (
                                    <li key={`${change.changedAt}-${index}`}>
                                        <span className="customer-history-dot" />
                                        <div><strong>{change.actorName}</strong><small>{change.actorRole} · {new Date(change.changedAt).toLocaleString("vi-VN")}</small>
                                            <ul>{(change.changes || []).map((item, itemIndex) => <li key={itemIndex}>{item}</li>)}</ul>
                                        </div>
                                    </li>
                                ))}
                            </ol>}
                        <h2 className="customer-password-history-title">Lịch sử đổi mật khẩu</h2>
                        {(user.passwordChanges || []).length === 0
                            ? <p className="customer-history-empty">Chưa có lần đổi mật khẩu bởi quản trị viên.</p>
                            : <ul className="customer-password-history">
                                {[...user.passwordChanges].reverse().map((change, index) => (
                                    <li key={`${change.changedAt}-${index}`}><strong>{change.adminName}</strong><span>{new Date(change.changedAt).toLocaleString("vi-VN")}</span></li>
                                ))}
                            </ul>}
                    </section>
                </div>
            )}
        </AdminLayout>
    );
};

export default UserDetails;
