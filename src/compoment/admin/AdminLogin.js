import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminLogin.css";

const ADMIN_ACCOUNT = { username: "admin", password: "admin123" };

const AdminLogin = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = (event) => {
        event.preventDefault();
        if (username.trim() !== ADMIN_ACCOUNT.username || password !== ADMIN_ACCOUNT.password) {
            setError("Tên đăng nhập hoặc mật khẩu quản trị không đúng.");
            return;
        }
        localStorage.setItem("adminSession", JSON.stringify({ username: ADMIN_ACCOUNT.username, role: "admin", loggedInAt: new Date().toISOString() }));
        navigate("/admin");
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
                    <button type="submit">Vào trang quản trị</button>
                </form>
                <small>Tài khoản demo: admin / admin123</small>
            </section>
        </main>
    );
};

export default AdminLogin;
