import React from "react";
import './Footer.css'
const Footer = () => {
return (
<footer>
<div className="footer-container">
<div className="footer-section">
<h3>Tổng đài hổ trợ</h3>
<a href="tel:19001090">Gọi mua:19001090</a>
<a href="#">Email:Support123@gmail.com</a>
<a href="tel:19001080">khiếu nại: 19001080</a>
<a href="tel:19001070">Bảo hành: 19001070</a>
</div>
<div className="footer-section">
<h3>Về Công Ty</h3>
<a href="#">Giới thiệu Công Ty</a>
<a href="#">Tuyển dụng</a>
<a href="#">Góp ý, khiếu nại</a>
<a href="#">Tim siêu thị</a>
</div>
<div className="footer-section">
<h3>Phương thức thanh toán</h3>
<div className="pay-container">
<a href="#">
<i className="fab fa-cc-visa"></i> BIDV
</a>
</div>
</div>
<div className="footer-section">
<h3>Kết nối với chúng tôi</h3>
<div className="social-icons">
<a
href="https://www.youtube.com"
aria-label="YouTube"
target="_blank"
rel="noopener noreferrer"
>
<img
src="https://upload.wikimedia.org/wikipedia/commons/e/ef/Youtube_logo.png"
alt="YouTube"
/>
</a>
<a
href="https://www.facebook.com"
aria-label="Facebook"
target="_blank"
rel="noopener noreferrer"
>
<img
src="https://upload.wikimedia.org/wikipedia/commons/b/b9/2023_Facebook_icon.svg"
alt="Facebook"
/>
</a>
<a
href="https://zalo.me"
aria-label="Zalo"
target="_blank"
rel="noopener noreferrer"
>
<img
src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Icon_of_Zalo.svg/1200px-Icon_of_Zalo.svg.png"
alt="Zalo"
/>
</a>
</div>
</div>
<div className="footer-section qr-code">
<h3>Tải ứng dụng</h3>
<div className="download-app-container">
<a href="#">
<img
src="https://seeklogo.com/images/A/apple-app-store-logo-358417D563-seeklogo.com.png"
alt="Download on the App Store"
/>
</a>
<a href="#">
<img
src="https://freelogopng.com/images/all_img/1664285914google-play-logo-png.png"
alt="Get it on Google Play"
/>
</a>
</div>
</div>
</div>
</footer>
);
};
export default Footer;
