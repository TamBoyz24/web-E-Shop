import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './UserInfo.css';

const UserInfo = () => {
  const [user, setUser] = useState({
    username: 'tamboyz917',
    avatar: 'https://via.placeholder.com/100', // Thay bằng ảnh thật
    address: '123 Đường ABC, Quận 1, TP.HCM',
    password: '********',
  });

  const navigate = useNavigate();

  const handleSave = () => {
    alert('Thông tin đã được lưu!');
  };

  return (
    <div className="user-info-container">
      <div className="header">
        <h2>Thông tin cá nhân</h2>
        <button onClick={() => navigate('/profile')} className="back-btn">Quay lại</button>
      </div>

      <div className="user-info-section">
        <h3>Thông tin cá nhân</h3>
        <div className="info-item">
          <label>Tên người dùng</label>
          <input type="text" value={user.username} readOnly />
        </div>

        <div className="info-item">
          <label>Địa chỉ</label>
          <input type="text" value={user.address} onChange={(e) => setUser({ ...user, address: e.target.value })} />
        </div>
      </div>

      <div className="security-section">
        <h3>Bảo mật</h3>
        <div className="info-item">
          <label>Mật khẩu</label>
          <input type="password" value={user.password} onChange={(e) => setUser({ ...user, password: e.target.value })} />
        </div>
      </div>

      <button onClick={handleSave} className="save-btn">Lưu thông tin</button>
    </div>
  );
};

export default UserInfo;
