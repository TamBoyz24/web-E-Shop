import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./EditProfile.css";

const EditProfile = () => {
  const [user, setUser] = useState({ name: "", email: "", phone: "" });
  const navigate = useNavigate();

  useEffect(() => {
    // Lấy thông tin người dùng từ localStorage
    const savedUser = JSON.parse(localStorage.getItem("user"));
    if (savedUser) {
      setUser(savedUser);
    } else {
      // Nếu không có thông tin người dùng, chuyển hướng về trang đăng nhập
      navigate("/login");
    }
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUser({ ...user, [name]: value });
  };

  const handleSaveChanges = () => {
    localStorage.setItem("user", JSON.stringify(user)); // Lưu thông tin người dùng vào localStorage
    alert("Thông tin đã được cập nhật!");
    navigate("/profile"); // Quay lại trang cá nhân
  };

  return (
    <div className="edit-profile-container">
      <h1>Chỉnh Sửa Thông Tin</h1>
      <div className="edit-profile-form">
        <div className="input-group">
          <label htmlFor="name">Tên:</label>
          <input
            type="text"
            id="name"
            name="name"
            value={user.name}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="input-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={user.email}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="input-group">
          <label htmlFor="phone">Số điện thoại:</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={user.phone}
            onChange={handleInputChange}
            required
          />
        </div>

        <button onClick={handleSaveChanges} className="save-changes-btn">
          Lưu thay đổi
        </button>
      </div>
    </div>
  );
};

export default EditProfile;
