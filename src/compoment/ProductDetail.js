import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { addCartItem, getCart, getUser } from "../lib/store";
import Toast from "./Toast";
import './ProductDetail.css'; // Import file CSS

const ProductDetail = () => {
  const { id } = useParams(); // Lấy id sản phẩm từ URL
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isCustomerInfoVisible, setIsCustomerInfoVisible] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({ name: "", email: "", phone: "" }); // Thêm phone
  const [toast, setToast] = useState(null);

  useEffect(() => {
    // Mảng sản phẩm mẫu
    const products = [
      { id: 1, name: 'iPhone 11 64GB', price: 599, images: 'iPhone 11 64GB.webp', description: 'Mô tả chi tiết của iPhone 11 64GB', colors: ["Black", "White", "Blue"] },
      { id: 2, name: 'iPhone 12 Pro Max 128GB', price: 1999, images: 'iPhone 12 Pro Max 128GB.webp', description: 'Mô tả chi tiết của iPhone 12 Pro Max 128GB', colors: ["Black", "White", "Blue"] },
      { id: 3, name: 'iPhone 13 128GB', price: 1699, images: 'iPhone 13 128GB.webp', description: 'Mô tả chi tiết của iPhone 13 128GB', colors: ["Black", "White", "Blue"] },
      { id: 4, name: 'iPhone 13 256GB', price: 599, images: 'iPhone 13 256GB.webp', description: 'Mô tả chi tiết của iPhone 13 256GB', colors: ["Black", "White", "Blue"] },
      { id: 5, name: 'iPhone 13 Pro Max 128GB', price: 299, images: 'iPhone 13 Pro Max 128GB.webp', description: 'Mô tả chi tiết của iPhone 13 Pro Max 128GB', colors: ["Black", "White", "Blue"] },
      { id: 6, name: 'iPhone 14 128GB', price: 199, images: 'iPhone 14 128GB.webp', description: 'Mô tả chi tiết của iPhone 14 128GB', colors: ["Black", "White", "Blue"] },
      { id: 7, name: 'iPhone 14 Pro 128GB', price: 1899, images: 'iPhone 14 Pro 128GB.webp', description: 'Mô tả chi tiết của iPhone 14 Pro 128GB', colors: ["Black", "White", "Blue"] },
      { id: 8, name: 'iPhone 15 256GB', price: 899, images: 'iPhone 15 256GB.webp', description: 'Mô tả chi tiết của iPhone 15 256GB', colors: ["Black", "White", "Blue"] },
      { id: 9, name: 'iPhone 15 Pro 256GB', price: 999, images: 'iPhone 15 Pro 256GB.webp', description: 'Mô tả chi tiết của iPhone 15 Pro 256GB', colors: ["Black", "White", "Blue"] },
      { id: 10, name: 'iPhone 16 128GB', price: 499, images: 'iPhone 16 128GB.webp', description: 'Mô tả chi tiết của iPhone 16 128GB', colors: ["Black", "White", "Blue"] },
      { id: 11, name: 'iPhone 16 Pro 128GB', price: 1299, images: 'iPhone 16 Pro 128GB.webp', description: 'Mô tả chi tiết của iPhone 16 Pro 128GB', colors: ["Black", "White", "Blue"] },
      { id: 12, name: 'iphone-11-128gb', price: 1799, images: 'iphone-11-128gb.webp', description: 'Mô tả chi tiết của iphone-11-128gb', colors: ["Black", "White", "Blue"] },
      { id: 13, name: 'iphone-12-128gb_2', price: 1599, images: 'iphone-12-128gb_2.webp', description: 'Mô tả chi tiết của iphone-12-128gb_2', colors: ["Black", "White", "Blue"] },
      { id: 14, name: 'iphone-12-mini_1_1', price: 199, images: 'iphone-12-mini_1_1.webp', description: 'Mô tả chi tiết của iphone-12-mini_1_1', colors: ["Black", "White", "Blue"] },
      { id: 15, name: 'iphone-12', price: 399, images: 'iphone-12.webp', description: 'Mô tả chi tiết của iphone-12', colors: ["Black", "White", "Blue"] },
      { id: 16, name: 'iphone-13-pro-max-256gb', price: 2699, images: 'iphone-13-pro-max-256gb.webp', description: 'Mô tả chi tiết của iphone-13-pro-max-256gb', colors: ["Black", "White", "Blue"] },
      { id: 17, name: 'iphone-14-plus_1_', price: 2199, images: 'iphone-14-plus_1_.webp', description: 'Mô tả chi tiết của iphone-14-plus_1_', colors: ["Black", "White", "Blue"] },
      { id: 18, name: 'iphone-14-pro-max-256gb', price: 2099, images: 'iphone-14-pro-max-256gb.webp', description: 'Mô tả chi tiết của iphone-14-pro-max-256gb', colors: ["Black", "White", "Blue"] },
      { id: 19, name: 'iphone-15-pro-max_5', price: 2899, images: 'iphone-15-pro-max_5.webp', description: 'Mô tả chi tiết của iphone-15-pro-max_5', colors: ["Black", "White", "Blue"] },
      { id: 20, name: 'iphone-16-plus-1', price: 2999, images: 'iphone-16-plus-1.webp', description: 'Mô tả chi tiết của iphone-16-plus-1', colors: ["Black", "White", "Blue"] },
      { id: 21, name: 'Xiaomi 14 (12GB 256GB)', price: 599, images: 'Xiaomi 14 (12GB 256GB).webp', description: 'Mô tả chi tiết của Xiaomi 14 (12GB 256GB)', colors: ["Black", "White", "Blue"] },
      { id: 22, name: 'Xiaomi 14 Ultra 5G (16GB - 512GB)', price: 1799, images: 'Xiaomi 14 Ultra 5G (16GB - 512GB).webp', description: 'Mô tả chi tiết của Xiaomi 14 Ultra 5G (16GB - 512GB)', colors: ["Black", "White", "Blue"] },
      { id: 23, name: 'Xiaomi 14T (12GB 512GB)', price: 2799, images: 'Xiaomi 14T (12GB 512GB).webp', description: 'Mô tả chi tiết của Xiaomi 14T (12GB 512GB)', colors: ["Black", "White", "Blue"] },
      { id: 24, name: 'Xiaomi 14T Pro 12GB 512GB', price: 199, images: 'Xiaomi 14T Pro 12GB 512GB.webp', description: 'Mô tả chi tiết của Xiaomi 14T Pro 12GB 512GB', colors: ["Black", "White", "Blue"] },
      { id: 25, name: 'Xiaomi POCO M6 (6GB 128GB)', price: 299, images: 'Xiaomi POCO M6 (6GB 128GB).webp', description: 'Mô tả chi tiết của Xiaomi POCO M6 (6GB 128GB)', colors: ["Black", "White", "Blue"] },
      { id: 26, name: 'Xiaomi POCO X6 Pro 5G 8GB 256GB', price: 199, images: 'Xiaomi POCO X6 Pro 5G 8GB 256GB.webp', description: 'Mô tả chi tiết của Xiaomi POCO X6 Pro 5G 8GB 256GB', colors: ["Black", "White", "Blue"] },
      { id: 27, name: 'Xiaomi Redmi 14C 4GB 128GB', price: 399, images: 'Xiaomi Redmi 14C 4GB 128GB.webp', description: 'Mô tả chi tiết của Xiaomi Redmi 14C 4GB 128GB', colors: ["Black", "White", "Blue"] },
      { id: 28, name: 'Xiaomi Redmi Note 13 (6GB-128GB)', price: 1299, images: 'Xiaomi Redmi Note 13 (6GB-128GB).webp', description: 'Mô tả chi tiết của Xiaomi Redmi Note 13 (6GB-128GB)', colors: ["Black", "White", "Blue"] },
      { id: 29, name: 'Xiaomi Redmi Note 13 Pro 4G', price: 1599, images: 'Xiaomi Redmi Note 13 Pro 4G.webp', description: 'Mô tả chi tiết của Xiaomi Redmi Note 13 Pro 4G', colors: ["Black", "White", "Blue"] },
      { id: 30, name: 'Xiaomi Redmi Note 13 Pro Plus 5G 8GB 256GB', price: 999, images: 'Xiaomi Redmi Note 13 Pro Plus 5G 8GB 256GB.webp', description: 'Mô tả chi tiết của Xiaomi Redmi Note 13 Pro Plus 5G 8GB 256GB', colors: ["Black", "White", "Blue"] },
      { id: 31, name: 'xiaomi-13-lite', price: 699, images: 'xiaomi-13-lite.webp', description: 'Mô tả chi tiết của xiaomi-13-lite', colors: ["Black", "White", "Blue"] },
      { id: 32, name: 'xiaomi-13-pro-thumb-xanh-la9', price: 699, images: 'xiaomi-13-pro-thumb-xanh-la9.webp', description: 'Mô tả chi tiết của xiaomi-13-pro-thumb-xanh-la9', colors: ["Black", "White", "Blue"] },
      { id: 33, name: 'xiaomi-13', price: 1999, images: 'xiaomi-13.webp', description: 'Mô tả chi tiết của xiaomi-13', colors: ["Black", "White", "Blue"] },
      { id: 34, name: 'xiaomi-13t_1__1_2', price: 1199, images: 'xiaomi-13t_1__1_2.webp', description: 'Mô tả chi tiết của xiaomi-13t_1__1_2', colors: ["Black", "White", "Blue"] },
      { id: 35, name: 'xiaomi-poco-m5', price: 1799, images: 'xiaomi-poco-m5.webp', description: 'Mô tả chi tiết của xiaomi-poco-m5', colors: ["Black", "White", "Blue"] },
      { id: 36, name: 'xiaomi-redmi-13c_21__1', price: 499, images: 'xiaomi-redmi-13c_21__1.webp', description: 'Mô tả chi tiết của xiaomi-redmi-13c_21__1', colors: ["Black", "White", "Blue"] },
      { id: 37, name: 'xiaomi-redmi-a3-xanh-1', price: 899, images: 'xiaomi-redmi-a3-xanh-1.webp', description: 'Mô tả chi tiết của xiaomi-redmi-a3-xanh-1', colors: ["Black", "White", "Blue"] },
      { id: 38, name: 'xiaomi-redmi-note-11', price: 1699, images: 'xiaomi-redmi-note-11.webp', description: 'Mô tả chi tiết của xiaomi-redmi-note-11', colors: ["Black", "White", "Blue"] },
      { id: 39, name: 'xiaomi-redmi-note-12_1', price: 499, images: 'xiaomi-redmi-note-12_1.webp', description: 'Mô tả chi tiết của xiaomi-redmi-note-12_1', colors: ["Black", "White", "Blue"] },
      { id: 40, name: 'xiaomi-redmi-note-12-pro-5g', price: 1399, images: 'xiaomi-redmi-note-12-pro-5g.webp', description: 'Mô tả chi tiết của xiaomi-redmi-note-12-pro-5g0', colors: ["Black", "White", "Blue"] },
      { id: 41, name: 'Samsung Galaxy A15 LTE 8GB 128GB', price: 1199, images: 'Samsung Galaxy A15 LTE 8GB 128GB.webp', description: 'Mô tả chi tiết của Samsung Galaxy A15 LTE 8GB 128GB', colors: ["Black", "White", "Blue"] },
      { id: 42, name: 'Samsung Galaxy A16 5G 8GB 128GB', price: 899, images: 'Samsung Galaxy A16 5G 8GB 128GB.webp', description: 'Mô tả chi tiết của Samsung Galaxy A16 5G 8GB 128GB', colors: ["Black", "White", "Blue"] },
      { id: 43, name: 'Samsung Galaxy A55 5G 8GB 128GB', price: 1399, images: 'Samsung Galaxy A55 5G 8GB 128GB.webp', description: 'Mô tả chi tiết của Samsung Galaxy A55 5G 8GB 128GB', colors: ["Black", "White", "Blue"] },
      { id: 44, name: 'Samsung Galaxy M55 (12GB 256GB)', price: 649, images: 'Samsung Galaxy M55 (12GB 256GB).webp', description: 'Mô tả chi tiết của Samsung Galaxy M55 (12GB 256GB)', colors: ["Black", "White", "Blue"] },
      { id: 45, name: 'Samsung Galaxy S23 Ultra 12GB 512GB', price: 949, images: 'Samsung Galaxy S23 Ultra 12GB 512GB.webp', description: 'Mô tả chi tiết của Samsung Galaxy S23 Ultra 12GB 512GB', colors: ["Black", "White", "Blue"] },
      { id: 46, name: 'Samsung Galaxy S21 FE 8GB 128GB', price: 1099, images: 'Samsung Galaxy S21 FE 8GB 128GB.webp', description: 'Mô tả chi tiết của Samsung Samsung Galaxy S21 FE 8GB 128GB', colors: ["Black", "White", "Blue"] },
      { id: 47, name: 'Samsung Galaxy S24 FE 5G 8GB 128GB', price: 799, images: 'Samsung Galaxy S24 8GB 256GB.webp', description: 'Mô tả chi tiết của Samsung Samsung Galaxy S24 8GB 256GB', colors: ["Black", "White", "Blue"] },
      { id: 48, name: 'Samsung Galaxy S24 FE 5G 8GB 128GB', price: 1199, images: 'Samsung Galaxy S24 FE 5G 8GB 128GB.webp', description: 'Mô tả chi tiết của Samsung Galaxy S24 FE 5G 8GB 128GB', colors: ["Black", "White", "Blue"] },
      { id: 49, name: 'Samsung Galaxy S24 Plus 12GB 256GB', price: 999, images: 'Samsung Galaxy S24 Plus 12GB 256GB.webp', description: 'Mô tả chi tiết của Samsung Galaxy S24 Plus 12GB 256GB', colors: ["Black", "White", "Blue"] },
      { id: 50, name: 'Samsung Galaxy S24 Ultra 12GB 256GB', price: 1099, images: 'Samsung Galaxy S24 Ultra 12GB 256GB.webp', description: 'Mô tả chi tiết của Samsung Galaxy S24 Ultra 12GB 256GB', colors: ["Black", "White", "Blue"] },
      { id: 51, name: 'Samsung Galaxy Z Flip6 12GB 256GB', price: 199, images: 'Samsung Galaxy Z Flip6 12GB 256GB.webp', description: 'Mô tả chi tiết của Samsung Galaxy Z Flip6 12GB 256GB', colors: ["Black", "White", "Blue"] },
      { id: 52, name: 'Samsung Galaxy Z Fold6 12GB 256GB', price: 1299, images: 'Samsung Galaxy Z Fold6 12GB 256GB.webp', description: 'Mô tả chi tiết của Samsung Galaxy Z Fold6 12GB 256GB', colors: ["Black", "White", "Blue"] },
      { id: 53, name: 'Samsung-galaxy-a05sl', price: 599, images: 'samsung-galaxy-a05sl.webp', description: 'Mô tả chi tiết của Samsung-galaxy-a05sl', colors: ["Black", "White", "Blue"] },
      { id: 54, name: 'Samsung-galaxy-a35_8_', price: 1999, images: 'samsung-galaxy-a35_8_.webp', description: 'Mô tả chi tiết của Samsung-galaxy-a35_8_', colors: ["Black", "White", "Blue"] },
      { id: 55, name: 'Samsung-galaxy-m14', price: 2899, images: 'samsung-galaxy-m14.webp', description: 'Mô tả chi tiết của Samsung-galaxy-m14', colors: ["Black", "White", "Blue"] },
      { id: 56, name: 'Samsung-galaxy-z-flip-4', price: 2799, images: 'samsung-galaxy-z-flip-4.webp', description: 'Mô tả chi tiết của Samsung-galaxy-z-flip-4', colors: ["Black", "White", "Blue"] },
      { id: 57, name: 'Samsung-s23_1', price: 3799, images: 'samsung-s23_1.webp', description: 'Mô tả chi tiết của Samsung-s23_1', colors: ["Black", "White", "Blue"] },
      { id: 58, name: 'Samsung-z-lip5_1__1', price: 1299, images: 'samsung-z-lip5_1__1.webp', description: 'Mô tả chi tiết của Samsung-z-lip5_1__1', colors: ["Black", "White", "Blue"] },
      { id: 59, name: 'Samsung-galaxy', price: 2899, images: 'dien-thoai-samsung-galaxy-a06_1_.webp', description: 'Mô tả chi tiết của Samsung-galaxy', colors: ["Black", "White", "Blue"] },
      { id: 60, name: 'Samsung-galaxy-a25-xanh-vang', price: 2999, images: 'galaxy-a25-xanh-vang.webp', description: 'Mô tả chi tiết của Samsung-galaxy-a25-xanh-vang', colors: ["Black", "White", "Blue"] },
    ];

    let catalog = products;
    try {
      const savedProducts = JSON.parse(localStorage.getItem("storeProducts"));
      if (Array.isArray(savedProducts)) {
        catalog = savedProducts;
      }
    } catch {
      catalog = products;
    }
    const selectedProduct = catalog.find((product) => product.id === parseInt(id));
    setProduct(selectedProduct ? { ...selectedProduct, colors: selectedProduct.colors || ["Đen", "Trắng", "Xanh"] } : null);
  }, [id]);
  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("user"));
    setUser(savedUser);
    const refreshCart = () => setCart(getCart());
    window.addEventListener("cart-updated", refreshCart);
    window.addEventListener("storage", refreshCart);
    return () => {
      window.removeEventListener("cart-updated", refreshCart);
      window.removeEventListener("storage", refreshCart);
    };
  }, []);
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(null);
  const handleQuantityChange = (event) => {
    const newQuantity = parseInt(event.target.value);
    if (newQuantity > 0) {
      setQuantity(newQuantity);
    }
  };
  const handleAddToCart = (product) => {
    const cartItem = { ...product, color: selectedColor || "Mặc định", quantity };
    setCart(addCartItem(cartItem, quantity));
    setToast({ message: `Đã thêm ${product.name} vào giỏ hàng`, type: "success" });
  };
  const handleColorChange = (event) => {
    setSelectedColor(event.target.value);
  };

  const handleCustomerInfoChange = (event) => {
    const { name, value } = event.target;
    setCustomerInfo((prevInfo) => ({ ...prevInfo, [name]: value }));
  };

  const handleSubmitOrder = () => {
    if (!getUser()) {
      setIsCustomerInfoVisible(false);
      navigate(`/login`, { state: { from: `/product-detail/${id}` } });
      return;
    }
    if (!customerInfo.name || !customerInfo.email || !customerInfo.phone) {
      setToast({ message: "Vui lòng điền đầy đủ thông tin", type: "error" });
      return;
    }

    // Lưu vào giỏ hàng (localStorage hoặc state)
    const newProduct = { ...product, color: selectedColor, quantity };
    setCart(addCartItem(newProduct, quantity));

    setToast({ message: "Đã thêm sản phẩm vào giỏ hàng", type: "success" });
    setIsCustomerInfoVisible(false); // Ẩn form và reset thông tin
    setCustomerInfo({ name: "", email: "", phone: "" });
  };

  const handleBuyNow = () => {
    if (!getUser()) {
      navigate(`/login`, { state: { from: `/product-detail/${id}` } });
      return;
    }
    setIsCustomerInfoVisible(true);
  };

  if (!product) return <div>Loading...</div>;

  return (
    <div className="product-detail">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
      <div className="product-detail-layout">
        <div className="product-detail-visual"><span className="product-detail-badge">Chính hãng</span><img src={product.images ? `/images/${product.images}` : product.image} alt={product.name} /></div>
        <div className="product-detail-info"><span className="product-detail-kicker">AIPHONE STORE / CHI TIẾT</span><h1>{product.name}</h1><div className="product-detail-rating">★ 4.8 <span>Đánh giá từ khách hàng</span></div><p className="product-detail-description">{product.description}</p><strong className="product-detail-price">{Number(product.price).toLocaleString("vi-VN")} <small>VND</small></strong>

          {/* Chọn màu */}
          <div className="product-option">
            <label htmlFor="color-select">Chọn màu:</label>
            <select id="color-select" value={selectedColor} onChange={handleColorChange}>
              <option value="">Chọn màu</option>
              {product.colors.map((color) => (
                <option key={color} value={color}>
                  {color}
                </option>
              ))}
            </select>
          </div>

          {/* Chọn số lượng */}
          <div className="product-option">
            <label htmlFor="quantity">Số lượng:</label>
            <input
              type="number"
              id="quantity"
              value={quantity}
              onChange={handleQuantityChange}
              min="1"
            />
          </div>

          {/* Nút Mua ngay */}
          <div className="product-detail-actions"><button className="buy-now" onClick={handleBuyNow}>Mua ngay</button><button className="add-to-cart" onClick={() => handleAddToCart(product)}>Thêm vào giỏ hàng</button></div>
        </div>
      </div>
      {/* Form thông tin khách hàng */}
      {isCustomerInfoVisible && (
        <div className="customer-info-form">
          <h2>Thông tin khách hàng</h2>
          <label htmlFor="name">Họ và tên:</label>
          <input
            type="text"
            id="name"
            name="name"
            value={customerInfo.name}
            onChange={handleCustomerInfoChange}
            placeholder="Nhập họ và tên"
          />
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={customerInfo.email}
            onChange={handleCustomerInfoChange}
            placeholder="Nhập email"
          />
          <label htmlFor="phone">Số điện thoại:</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={customerInfo.phone}
            onChange={handleCustomerInfoChange}
            placeholder="Nhập số điện thoại"
          />
          <button onClick={handleSubmitOrder}>Xác nhận và đặt hàng</button>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
