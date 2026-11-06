import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest, USER_TOKEN_KEY } from "../lib/api";
import Toast from "./Toast";
import "./EditProfile.css";

const EditProfile = () => {
  const [user, setUser] = useState({ username: "", email: "", phone: "" });
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [profileRefresh, setProfileRefresh] = useState(0);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("user") || localStorage.getItem("currentUser") || "null");
    if (!savedUser || !localStorage.getItem(USER_TOKEN_KEY)) {
      navigate("/login", { replace: true });
      return;
    }

    setUser({
      username: savedUser.username || savedUser.name || "",
      email: savedUser.email || "",
      phone: savedUser.phone || "",
    });

    let isMounted = true;
    apiRequest("/users/me", { user: true })
      .then((profile) => {
        if (!isMounted) return;
        const latestUser = { ...savedUser, ...profile, name: profile.username };
        localStorage.setItem("user", JSON.stringify(latestUser));
        localStorage.setItem("currentUser", JSON.stringify(latestUser));
        setProfileLoaded(true);
        setError("");
        setToast(null);
        setUser({
          username: profile.username || "",
          email: profile.email || "",
          phone: profile.phone || "",
        });
      })
      .catch((requestError) => {
        if (isMounted) {
          setError(requestError.message);
          setToast({ message: requestError.message, type: "error" });
        }
      })
      .finally(() => {
        if (isMounted) setLoadingProfile(false);
      });

    return () => { isMounted = false; };
  }, [navigate, profileRefresh]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setUser((current) => ({ ...current, [name]: value }));
    setError("");
  };

  const handleSaveChanges = async (event) => {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      const updatedUser = await apiRequest("/users/me", {
        method: "PUT",
        user: true,
        body: {
          username: user.username.trim(),
          email: user.email.trim() || null,
          phone: user.phone.trim(),
        },
      });
      const savedUser = {
        ...JSON.parse(localStorage.getItem("user") || "{}"),
        ...updatedUser,
        name: updatedUser.username,
      };
      localStorage.setItem("user", JSON.stringify(savedUser));
      localStorage.setItem("currentUser", JSON.stringify(savedUser));
      setUser({
        username: updatedUser.username,
        email: updatedUser.email || "",
        phone: updatedUser.phone,
      });
      setToast({ message: "Thông tin tài khoản đã được cập nhật.", type: "success" });
    } catch (requestError) {
      setError(requestError.message);
      setToast({ message: requestError.message, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="edit-profile-container">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
      <h1>Chỉnh sửa thông tin</h1>
      <form className="edit-profile-form" onSubmit={handleSaveChanges}>
        {loadingProfile && <p role="status">Đang tải thông tin mới nhất...</p>}
        {error && <p className="edit-profile-error" role="alert">{error}</p>}
        <div className="input-group">
          <label htmlFor="username">Họ tên:</label>
          <input
            type="text"
            id="username"
            name="username"
            value={user.username}
            onChange={handleInputChange}
            maxLength={80}
            autoComplete="name"
            disabled={loadingProfile || !profileLoaded || saving}
            required
          />
        </div>

        <div className="input-group">
          <label htmlFor="email">Email (không bắt buộc):</label>
          <input
            type="email"
            id="email"
            name="email"
            value={user.email}
            onChange={handleInputChange}
            maxLength={254}
            autoComplete="email"
            disabled={loadingProfile || !profileLoaded || saving}
          />
        </div>

        <div className="input-group">
          <label htmlFor="phone">Số điện thoại:</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={user.phone}
            onChange={(event) => {
              setUser((current) => ({
                ...current,
                phone: event.target.value.replace(/\D/g, ""),
              }));
              setError("");
            }}
            minLength={10}
            maxLength={11}
            inputMode="numeric"
            autoComplete="tel"
            disabled={loadingProfile || !profileLoaded || saving}
            required
          />
        </div>

        <button type="submit" className="save-changes-btn" disabled={saving || loadingProfile || !profileLoaded}>
          {loadingProfile ? "Đang tải..." : saving ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
        {error && !profileLoaded && !loadingProfile && (
          <button
            type="button"
            className="edit-profile-back"
            onClick={() => setProfileRefresh((count) => count + 1)}
          >
            Thử tải lại hồ sơ
          </button>
        )}
        <button type="button" className="edit-profile-back" onClick={() => navigate("/profile")}>
          Quay lại hồ sơ
        </button>
      </form>
    </div>
  );
};

export default EditProfile;
