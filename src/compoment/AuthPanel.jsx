import React, { useState } from "react";
import "./AuthPanel.css";

const AuthPanel = () => {
  const [isLogin, setIsLogin] = useState(true);

  const toggleForm = () => {
    setIsLogin(!isLogin);
  };

  return (
    <div className="auth-panel">
      {isLogin ? (
        <div className="form-container">
          <h2>Đăng Nhập</h2>
          <form>
            <input type="email" placeholder="Email" required />
            <input type="password" placeholder="Mật khẩu" required />
            <button type="submit">Đăng Nhập</button>
          </form>
          <p>
            Chưa có tài khoản?{" "}
            <span onClick={toggleForm} className="toggle-link">
              Đăng ký
            </span>
          </p>
        </div>
      ) : (
        <div className="form-container">
          <h2>Đăng Ký</h2>
          <form>
            <input type="text" placeholder="Họ tên" required />
            <input type="email" placeholder="Email" required />
            <input type="password" placeholder="Mật khẩu" required />
            <input type="phonenumber" placeholder="Số điện thoại" required/>
            <button type="submit">Đăng Ký</button>
          </form>
          <p>
            Đã có tài khoản?{" "}
            <span onClick={toggleForm} className="toggle-link">
              Đăng nhập
            </span>
          </p>
        </div>
      )}
    </div>
  );
};

export default AuthPanel;

