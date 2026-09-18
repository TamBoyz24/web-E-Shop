

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AuthForm.css";

const AuthForm = () => {
  const navigate = useNavigate();

  // ==============================
  // THÔNG TIN ĐĂNG KÝ
  // ==============================
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [sentOtp, setSentOtp] = useState("");

  // ==============================
  // MẬT KHẨU
  // ==============================
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  // ==============================
  // TRẠNG THÁI
  // ==============================
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");

  // ==============================
  // HIỆN / ẨN MẬT KHẨU
  // ==============================
  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  // ==============================
  // SỐ LẦN GỬI LẠI OTP
  // ==============================
  const [resendCount, setResendCount] =
    useState(0);

  // =====================================================
  // NHẬP SỐ ĐIỆN THOẠI
  // =====================================================
  const handlePhoneChange = (e) => {
    const value =
      e.target.value.replace(/\D/g, "");

    setPhone(value);
    setError("");
  };

  // =====================================================
  // TẠO OTP
  // =====================================================
  const generateOtp = () => {
    const newOtp = Math.floor(
      100000 +
      Math.random() * 900000
    ).toString();

    setSentOtp(newOtp);

    // Demo:
    // Trong ứng dụng thật OTP sẽ được gửi SMS
    alert(
      `Mã OTP của bạn là: ${newOtp}`
    );
  };

  // =====================================================
  // BƯỚC 1
  // KIỂM TRA SỐ ĐIỆN THOẠI
  // =====================================================
  const handleNextStep = (e) => {
    e.preventDefault();

    setError("");

    if (!username.trim()) {
      setError("Vui lòng nhập tên user!");
      return;
    }

    // Kiểm tra số điện thoại
    const phoneRegex = /^[0-9]{10,11}$/;

    if (!phoneRegex.test(phone)) {
      setError(
        "Số điện thoại phải có 10 hoặc 11 chữ số!"
      );
      return;
    }

    // Lấy danh sách tài khoản
    const users =
      JSON.parse(
        localStorage.getItem("users")
      ) || [];

    // Kiểm tra số điện thoại đã tồn tại
    const existingUser = users.find(
      (user) =>
        user.phone === phone
    );

    if (existingUser) {
      setError(
        "Số điện thoại này đã được đăng ký!"
      );
      return;
    }

    // Tạo OTP
    generateOtp();

    // Chuyển sang bước OTP
    setStep(2);
  };

  // =====================================================
  // BƯỚC 2
  // XÁC NHẬN OTP
  // =====================================================
  const handleVerifyOtp = (e) => {
    e.preventDefault();

    setError("");

    // Kiểm tra đủ 6 số
    if (otp.length !== 6) {
      setError(
        "Mã OTP phải gồm 6 chữ số!"
      );
      return;
    }

    // Kiểm tra OTP
    if (otp !== sentOtp) {
      setError(
        "Mã OTP không chính xác!"
      );
      return;
    }

    // OTP đúng
    setOtp("");

    // Sang bước tạo mật khẩu
    setStep(3);
  };

  // =====================================================
  // GỬI LẠI OTP
  // =====================================================
  const handleResendOtp = () => {
    if (resendCount >= 3) {
      setError(
        "Bạn đã vượt quá số lần gửi lại OTP. Vui lòng thử lại sau!"
      );
      return;
    }

    generateOtp();

    setResendCount(
      (prev) => prev + 1
    );

    setOtp("");
    setError("");
  };

  // =====================================================
  // KIỂM TRA MẬT KHẨU
  // =====================================================
  const validatePassword = () => {

    // Ít nhất 6 ký tự
    if (password.length < 6) {
      return "Mật khẩu phải có ít nhất 6 ký tự!";
    }

    // Không quá 50 ký tự
    if (password.length > 50) {
      return "Mật khẩu không được vượt quá 50 ký tự!";
    }

    // Kiểm tra xác nhận
    if (
      password !== confirmPassword
    ) {
      return "Mật khẩu xác nhận không khớp!";
    }

    return "";
  };

  // =====================================================
  // BƯỚC 3
  // TẠO TÀI KHOẢN
  // =====================================================
  const handleCreateAccount = (e) => {
    e.preventDefault();

    setError("");

    // Kiểm tra mật khẩu
    const passwordError =
      validatePassword();

    if (passwordError) {
      setError(passwordError);
      return;
    }

    // Lấy danh sách tài khoản
    const users =
      JSON.parse(
        localStorage.getItem("users")
      ) || [];

    // Kiểm tra lại số điện thoại
    const existingUser = users.find(
      (user) =>
        user.phone === phone
    );

    if (existingUser) {
      setError(
        "Số điện thoại này đã được đăng ký!"
      );
      return;
    }

    // Tạo tài khoản mới
    const newUser = {
      id: Date.now(),
      username: username.trim(),
      phone: phone,
      password: password,
      createdAt:
        new Date().toISOString()
    };

    // Thêm tài khoản
    users.push(newUser);

    // Lưu vào localStorage
    localStorage.setItem(
      "users",
      JSON.stringify(users)
    );

    // Thông báo
    alert(
      "Đăng ký thành công! Vui lòng đăng nhập."
    );

    // Chuyển đến Login
    navigate("/login");
  };

  // =====================================================
  // QUAY LẠI
  // =====================================================
  const handleBack = () => {

    setError("");

    if (step === 2) {
      setOtp("");
      setStep(1);
    }

    if (step === 3) {
      setPassword("");
      setConfirmPassword("");
      setStep(2);
    }
  };

  // =====================================================
  // GOOGLE
  // =====================================================
  const handleGoogleLogin = () => {
    alert(
      "Đăng ký bằng Google chưa được tích hợp."
    );
  };

  // =====================================================
  // FACEBOOK
  // =====================================================
  const handleFacebookLogin = () => {
    alert(
      "Đăng ký bằng Facebook chưa được tích hợp."
    );
  };

  return (
    <div className="auth-container">

      <div className="auth-form">

        <h2>Đăng ký</h2>

        {/* =================================================
            BƯỚC 1
            NHẬP SỐ ĐIỆN THOẠI
        ================================================== */}
        {step === 1 && (
          <>

            <div className="social-login">

              <button
                type="button"
                className="google-btn"
                onClick={
                  handleGoogleLogin
                }
              >
                Đăng ký bằng Google
              </button>

              <button
                type="button"
                className="facebook-btn"
                onClick={
                  handleFacebookLogin
                }
              >
                Đăng ký bằng Facebook
              </button>

            </div>

            <p>Hoặc</p>

            <form
              onSubmit={handleNextStep}
            >

              <div className="input-group">

                <input
                  type="text"
                  placeholder="Tên user"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError("");
                  }}
                  maxLength={50}
                  required
                />

              </div>

              <div className="input-group">

                <input
                  type="tel"
                  placeholder="Số điện thoại"
                  value={phone}
                  onChange={
                    handlePhoneChange
                  }
                  maxLength={11}
                  required
                />

              </div>

              {error && (
                <p className="error">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="submit-btn"
              >
                TIẾP THEO
              </button>

            </form>

          </>
        )}

        {/* =================================================
            BƯỚC 2
            NHẬP OTP
        ================================================== */}
        {step === 2 && (
          <form
            onSubmit={handleVerifyOtp}
          >

            <p>
              Mã xác thực đã được gửi đến:
            </p>

            <strong>
              {phone}
            </strong>

            <div className="input-group">

              <input
                type="text"
                inputMode="numeric"
                placeholder="Nhập mã OTP"
                value={otp}
                onChange={(e) => {

                  const value =
                    e.target.value.replace(
                      /\D/g,
                      ""
                    );

                  setOtp(value);
                  setError("");
                }}
                maxLength={6}
                required
              />

            </div>

            {error && (
              <p className="error">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="submit-btn"
            >
              XÁC NHẬN OTP
            </button>

            <button
              type="button"
              className="resend-btn"
              onClick={
                handleResendOtp
              }
              disabled={
                resendCount >= 3
              }
            >
              GỬI LẠI MÃ
            </button>

            {resendCount > 0 && (
              <p className="resend-info">
                Đã gửi lại:{" "}
                {resendCount}/3 lần
              </p>
            )}

            <button
              type="button"
              className="back-btn"
              onClick={handleBack}
            >
              ← Quay lại
            </button>

          </form>
        )}

        {/* =================================================
            BƯỚC 3
            TẠO MẬT KHẨU
        ================================================== */}
        {step === 3 && (
          <form
            onSubmit={
              handleCreateAccount
            }
          >

            <p className="step-description">
              Tạo mật khẩu cho tài khoản
            </p>

            {/* MẬT KHẨU */}
            <div className="password-group">

              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(e) => {
                  setPassword(
                    e.target.value
                  );
                  setError("");
                }}
                required
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowPassword(
                    !showPassword
                  )
                }
              >
                {showPassword
                  ? "Ẩn"
                  : "Hiện"}
              </button>

            </div>

            {/* XÁC NHẬN MẬT KHẨU */}
            <div className="password-group">

              <input
                type={
                  showConfirmPassword
                    ? "text"
                    : "password"
                }
                placeholder="Nhập lại mật khẩu"
                value={
                  confirmPassword
                }
                onChange={(e) => {
                  setConfirmPassword(
                    e.target.value
                  );
                  setError("");
                }}
                required
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowConfirmPassword(
                    !showConfirmPassword
                  )
                }
              >
                {showConfirmPassword
                  ? "Ẩn"
                  : "Hiện"}
              </button>

            </div>

            {/* YÊU CẦU MẬT KHẨU */}
            <div className="password-rules">

              <p>
                Mật khẩu cần:
              </p>

              <p>
                {password.length >= 6
                  ? "✓"
                  : "○"}{" "}
                Ít nhất 6 ký tự
              </p>

              <p>
                {password ===
                  confirmPassword &&
                  password.length > 0
                  ? "✓"
                  : "○"}{" "}
                Hai mật khẩu giống nhau
              </p>

            </div>

            {error && (
              <p className="error">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="submit-btn"
            >
              HOÀN TẤT ĐĂNG KÝ
            </button>

            <button
              type="button"
              className="back-btn"
              onClick={handleBack}
            >
              ← Quay lại
            </button>

          </form>
        )}

        {/* =================================================
            ĐĂNG NHẬP
        ================================================== */}
        <p className="login-link">

          Bạn đã có tài khoản?{" "}

          <span
            onClick={() =>
              navigate("/login")
            }
            style={{
              cursor: "pointer",
              color: "#007bff",
              textDecoration:
                "underline"
            }}
          >
            Đăng nhập
          </span>

        </p>

      </div>

    </div>
  );
};

export default AuthForm;