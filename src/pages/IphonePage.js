import React, { useState } from 'react';
import './IphonePage.css';
import { useNavigate } from "react-router-dom";
import { getCart, saveCart } from "../lib/store";
import Toast from "../compoment/Toast";

const iphoneProducts = [
  { id: 1, name: 'iPhone 11 64GB', price: 599, images: 'iPhone 11 64GB.webp', description: 'Mô tả chi tiết của iPhone 11 64GB' },
  { id: 2, name: 'iPhone 12 Pro Max 128GB', price: 1999, images: 'iPhone 12 Pro Max 128GB.webp', description: 'Mô tả chi tiết của iPhone 12 Pro Max 128GB' },
  { id: 3, name: 'iPhone 13 128GB', price: 1699, images: 'iPhone 13 128GB.webp', description: 'Mô tả chi tiết của iPhone 13 128GB' },
  { id: 4, name: 'iPhone 13 256GB', price: 599, images: 'iPhone 13 256GB.webp', description: 'Mô tả chi tiết của iPhone 13 256GB' },
  { id: 5, name: 'iPhone 13 Pro Max 128GB', price: 299, images: 'iPhone 13 Pro Max 128GB.webp', description: 'Mô tả chi tiết của iPhone 13 Pro Max 128GB' },
  { id: 6, name: 'iPhone 14 128GB', price: 199, images: 'iPhone 14 128GB.webp', description: 'Mô tả chi tiết của iPhone 14 128GB' },
  { id: 7, name: 'iPhone 14 Pro 128GB', price: 1899, images: 'iPhone 14 Pro 128GB.webp', description: 'Mô tả chi tiết của iPhone 14 Pro 128GB' },
  { id: 8, name: 'iPhone 15 256GB', price: 899, images: 'iPhone 15 256GB.webp', description: 'Mô tả chi tiết của iPhone 15 256GB' },
  { id: 9, name: 'iPhone 15 Pro 256GB', price: 999, images: 'iPhone 15 Pro 256GB.webp', description: 'Mô tả chi tiết của iPhone 15 Pro 256GB' },
  { id: 10, name: 'iPhone 16 128GB', price: 499, images: 'iPhone 16 128GB.webp', description: 'Mô tả chi tiết của iPhone 16 128GB' },
  { id: 11, name: 'iPhone 16 Pro 128GB', price: 1299, images: 'iPhone 16 Pro 128GB.webp', description: 'Mô tả chi tiết của iPhone 16 Pro 128GB' },
  { id: 12, name: 'iphone-11-128gb', price: 1799, images: 'iphone-11-128gb.webp', description: 'Mô tả chi tiết của iphone-11-128gb' },
  { id: 13, name: 'iphone-12-128gb_2', price: 1599, images: 'iphone-12-128gb_2.webp', description: 'Mô tả chi tiết của iphone-12-128gb_2' },
  { id: 14, name: 'iphone-12-mini_1_1', price: 199, images: 'iphone-12-mini_1_1.webp', description: 'Mô tả chi tiết của iphone-12-mini_1_1' },
  { id: 15, name: 'iphone-12', price: 399, images: 'iphone-12.webp', description: 'Mô tả chi tiết của iphone-12' },
  { id: 16, name: 'iphone-13-pro-max-256gb', price: 2699, images: 'iphone-13-pro-max-256gb.webp', description: 'Mô tả chi tiết của iphone-13-pro-max-256gb' },
  { id: 17, name: 'iphone-14-plus_1_', price: 2199, images: 'iphone-14-plus_1_.webp', description: 'Mô tả chi tiết của iphone-14-plus_1_' },
  { id: 18, name: 'iphone-14-pro-max-256gb', price: 2099, images: 'iphone-14-pro-max-256gb.webp', description: 'Mô tả chi tiết của iphone-14-pro-max-256gb' },
  { id: 19, name: 'iphone-15-pro-max_5', price: 2899, images: 'iphone-15-pro-max_5.webp', description: 'Mô tả chi tiết của iphone-15-pro-max_5' },
  { id: 20, name: 'iphone-16-plus-1', price: 2999, images: 'iphone-16-plus-1.webp', description: 'Mô tả chi tiết của iphone-16-plus-1' },
];

const IphonePage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const navigate = useNavigate();
  const [toast, setToast] = useState(null);

  const handleViewDetails = (product) => {
    navigate(`/product-detail/${product.id}`);
  };

  // Lọc và sắp xếp sản phẩm
  const filteredProducts = iphoneProducts
    .filter((product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => (sortOrder === 'asc' ? a.price - b.price : b.price - a.price));

  // Hàm thêm sản phẩm vào giỏ hàng
  const addToCart = (product) => {
    const cart = getCart();
    const index = cart.findIndex((item) => item.id === product.id);
    const updatedCart = index >= 0
      ? cart.map((item, itemIndex) => itemIndex === index ? { ...item, quantity: (item.quantity || 1) + 1 } : item)
      : [...cart, { ...product, quantity: 1 }];
    saveCart(updatedCart);
    setToast({ message: `Đã thêm ${product.name} vào giỏ hàng`, type: 'success' });
  };

  return (
    <div className="iphone-page">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
      <h1 className="iphone-page__title">iPhone Phones</h1>

      <div className="controls">
        <input
          type="text"
          placeholder="Tìm kiếm sản phẩm..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className="sort-select"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
        >
          <option value="asc">Giá: Thấp đến Cao</option>
          <option value="desc">Giá: Cao đến Thấp</option>
        </select>
      </div>

      <div className="iphone-grid">
        {filteredProducts.map((product) => (
          <div className="iphone-item" key={product.id}>
            <img
              src={`${process.env.PUBLIC_URL}/images/${product.images}`}
              alt={product.name}
              className="iphone-item__images"
              onClick={() => handleViewDetails(product)}
            />
            <h3 className="iphone-item__name">{product.name}</h3>
            <p className="iphone-item__description">{product.description}</p>
            <p className="iphone-item__price">{product.price.toLocaleString()} VND</p>
            <button className="iphone-item__detail" onClick={() => handleViewDetails(product)}>Xem chi tiết</button>
            <button
              className="iphone-item__button"
              onClick={() => addToCart(product)} // Thêm sản phẩm vào giỏ hàng
            >
              Thêm vào giỏ hàng
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IphonePage;
