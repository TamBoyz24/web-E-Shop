import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiRequest } from "../lib/api";
import { readStorage } from "../lib/store";
import "./LoginForm.css";

function LoginForm() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // ==============================
  // XỬ LÝ ĐĂNG NHẬP
  // ==============================
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    // Kiểm tra số điện thoại
    const phoneRegex = /^[0-9]{10,11}$/;

    if (!phoneRegex.test(phoneNumber)) {
      setError("Số điện thoại phải có 10 hoặc 11 chữ số!");
      return;
    }

    // Kiểm tra mật khẩu
    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự!");
      return;
    }

    setLoading(true);

    try {
      let user;
      try {
        user = await apiRequest("/auth/login", {
          method: "POST",
          body: { phone: phoneNumber, password },
        });
      } catch (loginError) {
        if (loginError.status !== 401) throw loginError;
        const legacyUsers = readStorage("users", []);
        const legacyUser = Array.isArray(legacyUsers)
          ? legacyUsers.find((item) => item.phone === phoneNumber && item.password === password)
          : null;
        if (!legacyUser) throw loginError;

        try {
          await apiRequest("/auth/register", {
            method: "POST",
            body: {
              username: legacyUser.username || legacyUser.name || "Người dùng",
              phone: legacyUser.phone,
              password: legacyUser.password,
            },
          });
        } catch (registrationError) {
          if (registrationError.status !== 409) throw registrationError;
        }

        user = await apiRequest("/auth/login", {
          method: "POST",
          body: { phone: phoneNumber, password },
        });
      }

      const legacyUsers = readStorage("users", []);
      if (Array.isArray(legacyUsers) && legacyUsers.some((item) => item.phone === phoneNumber)) {
        localStorage.setItem("users", JSON.stringify(legacyUsers.filter((item) => item.phone !== phoneNumber)));
      }

      // Lưu người dùng đang đăng nhập
      localStorage.setItem(
        "currentUser",
        JSON.stringify(user)
      );
      localStorage.setItem("user", JSON.stringify(user));

      // Lưu trạng thái đăng nhập
      localStorage.setItem(
        "isLoggedIn",
        "true"
      );

      alert("Đăng nhập thành công!");

      const destination = location.state?.from || "/home";
      navigate(destination, { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  // ==============================
  // GOOGLE
  // ==============================
  const handleGoogleLogin = () => {
    alert(
      "Đăng nhập bằng Google chưa được tích hợp."
    );
  };

  // ==============================
  // FACEBOOK
  // ==============================
  const handleFacebookLogin = () => {
    alert(
      "Đăng nhập bằng Facebook chưa được tích hợp."
    );
  };
  //=============================================
  // XỬ LÝ ĐĂNG NHẬP QUẢN TRỊ VIÊN
  // ==============================
  const handleAdminLogin = () => {
    navigate("/admin/login");
  };

  // ==============================
  // QUÊN MẬT KHẨU
  // ==============================
  const handleForgotPassword = () => {
    navigate("/forgot-password");
  };

  // ==============================
  // NHẬP SỐ ĐIỆN THOẠI
  // ==============================
  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");

    setPhoneNumber(value);
    setError("");
  };

  // ==============================
  // NHẬP MẬT KHẨU
  // ==============================
  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    setError("");
  };

  return (
    <div className="login-container">

      <h2>Đăng Nhập</h2>

      {/* GOOGLE / FACEBOOK */}
      <div className="social-buttons">

        <button
          type="button"
          className="btn google-btn"
          onClick={handleGoogleLogin}
        >
          Đăng nhập bằng Google
        </button>

        <button
          type="button"
          className="btn facebook-btn"
          onClick={handleFacebookLogin}
        >
          Đăng nhập bằng Facebook
        </button>

      </div>

      <p>Hoặc</p>

      {/* FORM ĐĂNG NHẬP */}
      <form
        onSubmit={handleSubmit}
        className="phone-form"
      >

        {/* SỐ ĐIỆN THOẠI */}
        <input
          type="tel"
          placeholder="Số điện thoại"
          value={phoneNumber}
          onChange={handlePhoneChange}
          maxLength={11}
          required
        />

        {/* MẬT KHẨU */}
        <div className="password-container">

          <input
            type={
              showPassword
                ? "text"
                : "password"
            }
            placeholder="Nhập mật khẩu"
            value={password}
            onChange={handlePasswordChange}
            required
          />

          <button
            type="button"
            className="show-password-btn"
            onClick={() =>
              setShowPassword(!showPassword)
            }
          >
            {showPassword ? "Ẩn" : "Hiện"}
          </button>

        </div>

        {/* QUÊN MẬT KHẨU */}
        <div className="forgot-password">

          <button
            type="button"
            onClick={handleForgotPassword}
          >
            Quên mật khẩu?
          </button>

        </div>

        {/* THÔNG BÁO LỖI */}
        {error && (
          <p className="error">
            {error}
          </p>
        )}

        {/* ĐĂNG NHẬP */}
        <button
          type="submit"
          className="btn submit-btn"
          disabled={loading}
        >
          {loading
            ? "ĐANG ĐĂNG NHẬP..."
            : "TIẾP THEO"}
        </button>

      </form>

      {/* ĐĂNG KÝ */}
      <div className="switch">

        <p>
          Bạn chưa có tài khoản?{" "}

          <span
            onClick={() =>
              navigate("/authform")
            }
            style={{
              cursor: "pointer",
              color: "#007bff",
              textDecoration: "underline"
            }}
          >
            Đăng Ký
          </span>

        </p>

      </div>

      <button
        type="button"
        className="admin-login-button"
        onClick={handleAdminLogin}
      >
        Đăng nhập quản trị viên
      </button>

    </div>
  );
}

export default LoginForm;