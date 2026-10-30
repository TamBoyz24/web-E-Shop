import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ADMIN_TOKEN_KEY, apiRequest } from "../../lib/api";
import "./AdminLogin.css";

const AdminLogin = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setLoading(true);
        try {
            const session = await apiRequest("/auth/admin/login", {
                method: "POST",
                body: { username: username.trim(), password },
            });
            localStorage.setItem(ADMIN_TOKEN_KEY, session.token);
            localStorage.setItem("adminSession", JSON.stringify({ username: session.username, role: "admin", expiresAt: session.expiresAt }));
            navigate("/admin");
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="admin-login-page">
            <section className="admin-login-card">
                <div className="admin-login-mark">A</div>
                <span className="admin-eyebrow">AIPHONE STORE / ADMIN</span>
                <h1>Đăng nhập quản trị</h1>
                <p>Đăng nhập để quản lý sản phẩm, đơn hàng và người dùng.</p>
                <form onSubmit={handleSubmit}>
                    <label>Tên đăng nhập<input value={username} onChange={(event) => { setUsername(event.target.value); setError(""); }} autoComplete="username" required /></label>
                    <label>Mật khẩu<input type="password" value={password} onChange={(event) => { setPassword(event.target.value); setError(""); }} autoComplete="current-password" required /></label>
                    {error && <div className="admin-login-error">{error}</div>}
                    <button type="submit" disabled={loading}>{loading ? "Đang đăng nhập..." : "Vào trang quản trị"}</button>
                </form>
                <small>Tài khoản demo cục bộ: admin / admin123</small>
            </section>
        </main>
    );
};

export default AdminLogin;
