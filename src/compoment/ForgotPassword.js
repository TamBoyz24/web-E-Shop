import React, { useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../lib/api";
import "./ForgotPassword.css";

const ForgotPassword = () => {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await apiRequest("/auth/password-recovery-requests", {
        method: "POST",
        body: { phone },
      });
      setSubmitted(true);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="forgot-password-page">
      <section className="forgot-password-card">
        <span className="forgot-password-mark">A</span>
        <p className="forgot-password-eyebrow">AIPHONE STORE / HỖ TRỢ TÀI KHOẢN</p>
        <h1>Quên mật khẩu?</h1>
        {submitted ? (
          <div className="recovery-success" role="status">
            <p>
              Nếu số điện thoại đã đăng ký, yêu cầu sẽ được gửi đến quản trị viên
              để xác minh. Nhân viên sẽ liên hệ bạn qua số điện thoại này trước
              khi đặt mật khẩu mới.
            </p>
            <Link to="/login">Quay lại đăng nhập</Link>
          </div>
        ) : (
          <>
            <p>
              Nhập số điện thoại của tài khoản. Vì chưa tích hợp SMS OTP, quản
              trị viên sẽ xác minh danh tính trước khi hỗ trợ đặt lại mật khẩu.
            </p>
            <form onSubmit={handleSubmit}>
              <label htmlFor="recovery-phone">Số điện thoại tài khoản</label>
              <input
                id="recovery-phone"
                type="tel"
                autoComplete="tel"
                inputMode="numeric"
                minLength={10}
                maxLength={11}
                pattern="[0-9]{10,11}"
                value={phone}
                onChange={(event) => {
                  setPhone(event.target.value.replace(/\D/g, ""));
                  setError("");
                }}
                placeholder="Nhập số điện thoại đã đăng ký"
                required
              />
              {error && <p className="forgot-password-error" role="alert">{error}</p>}
              <button type="submit" disabled={loading}>
                {loading ? "ĐANG GỬI..." : "GỬI YÊU CẦU HỖ TRỢ"}
              </button>
            </form>
            <Link className="forgot-password-back" to="/login">← Quay lại đăng nhập</Link>
          </>
        )}
      </section>
    </main>
  );
};

export default ForgotPassword;
