import React, { useEffect, useState } from 'react';
import './SamsungPage.css';
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../lib/api";
import { getCart, saveCart } from "../lib/store";
import Toast from "../compoment/Toast";
const samsungProducts = [
  { id: 41, name: 'Samsung Galaxy A15 LTE 8GB 128GB', price: 1199, images: 'Samsung Galaxy A15 LTE 8GB 128GB.webp', description: 'Mô tả chi tiết của Samsung Galaxy A15 LTE 8GB 128GB' },
  { id: 42, name: 'Samsung Galaxy A16 5G 8GB 128GB', price: 899, images: 'Samsung Galaxy A16 5G 8GB 128GB.webp', description: 'Mô tả chi tiết của Samsung Galaxy A16 5G 8GB 128GB' },
  { id: 43, name: 'Samsung Galaxy A55 5G 8GB 128GB', price: 1399, images: 'Samsung Galaxy A55 5G 8GB 128GB.webp', description: 'Mô tả chi tiết của Samsung Galaxy A55 5G 8GB 128GB' },
  { id: 44, name: 'Samsung Galaxy M55 (12GB 256GB)', price: 649, images: 'Samsung Galaxy M55 (12GB 256GB).webp', description: 'Mô tả chi tiết của Samsung Galaxy M55 (12GB 256GB)' },
  { id: 45, name: 'Samsung Galaxy S23 Ultra 12GB 512GB', price: 949, images: 'Samsung Galaxy S23 Ultra 12GB 512GB.webp', description: 'Mô tả chi tiết của Samsung Galaxy S23 Ultra 12GB 512GB' },
  { id: 46, name: 'Samsung Galaxy S21 FE 8GB 128GB', price: 1099, images: 'Samsung Galaxy S21 FE 8GB 128GB.webp', description: 'Mô tả chi tiết của Samsung Samsung Galaxy S21 FE 8GB 128GB' },
  { id: 47, name: 'Samsung Galaxy S24 FE 5G 8GB 128GB', price: 799, images: 'Samsung Galaxy S24 8GB 256GB.webp', description: 'Mô tả chi tiết của Samsung Samsung Galaxy S24 8GB 256GB' },
  { id: 48, name: 'Samsung Galaxy S24 FE 5G 8GB 128GB', price: 1199, images: 'Samsung Galaxy S24 FE 5G 8GB 128GB.webp', description: 'Mô tả chi tiết của Samsung Galaxy S24 FE 5G 8GB 128GB' },
  { id: 49, name: 'Samsung Galaxy S24 Plus 12GB 256GB', price: 999, images: 'Samsung Galaxy S24 Plus 12GB 256GB.webp', description: 'Mô tả chi tiết của Samsung Galaxy S24 Plus 12GB 256GB' },
  { id: 50, name: 'Samsung Galaxy S24 Ultra 12GB 256GB', price: 1099, images: 'Samsung Galaxy S24 Ultra 12GB 256GB.webp', description: 'Mô tả chi tiết của Samsung Galaxy S24 Ultra 12GB 256GB' },
  { id: 51, name: 'Samsung Galaxy Z Flip6 12GB 256GB', price: 199, images: 'Samsung Galaxy Z Flip6 12GB 256GB.webp', description: 'Mô tả chi tiết của Samsung Galaxy Z Flip6 12GB 256GB' },
  { id: 52, name: 'Samsung Galaxy Z Fold6 12GB 256GB', price: 1299, images: 'Samsung Galaxy Z Fold6 12GB 256GB.webp', description: 'Mô tả chi tiết của Samsung Galaxy Z Fold6 12GB 256GB' },
  { id: 53, name: 'Samsung-galaxy-a05sl', price: 599, images: 'samsung-galaxy-a05sl.webp', description: 'Mô tả chi tiết của Samsung-galaxy-a05sl' },
  { id: 54, name: 'Samsung-galaxy-a35_8_', price: 1999, images: 'samsung-galaxy-a35_8_.webp', description: 'Mô tả chi tiết của Samsung-galaxy-a35_8_' },
  { id: 55, name: 'Samsung-galaxy-m14', price: 2899, images: 'samsung-galaxy-m14.webp', description: 'Mô tả chi tiết của Samsung-galaxy-m14' },
  { id: 56, name: 'Samsung-galaxy-z-flip-4', price: 2799, images: 'samsung-galaxy-z-flip-4.webp', description: 'Mô tả chi tiết của Samsung-galaxy-z-flip-4' },
  { id: 57, name: 'Samsung-s23_1', price: 3799, images: 'samsung-s23_1.webp', description: 'Mô tả chi tiết của Samsung-s23_1' },
  { id: 58, name: 'Samsung-z-lip5_1__1', price: 1299, images: 'samsung-z-lip5_1__1.webp', description: 'Mô tả chi tiết của Samsung-z-lip5_1__1' },
  { id: 59, name: 'Samsung-galaxy', price: 2899, images: 'dien-thoai-samsung-galaxy-a06_1_.webp', description: 'Mô tả chi tiết của Samsung-galaxy' },
  { id: 60, name: 'Samsung-galaxy-a25-xanh-vang', price: 2999, images: 'galaxy-a25-xanh-vang.webp', description: 'Mô tả chi tiết của Samsung-galaxy-a25-xanh-vang' },
];

const SamsungPage = () => {
  const [products, setProducts] = useState(samsungProducts);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const navigate = useNavigate();
  const [toast, setToast] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const refreshProducts = async () => {
      try {
        const savedProducts = await apiRequest("/products");
        if (isMounted && savedProducts.length) {
          setProducts(savedProducts.filter((product) => product.category === "Samsung" || product.name.toLowerCase().includes("samsung")));
        }
      } catch (requestError) {
        if (isMounted) setToast({ message: requestError.message, type: 'error' });
      }
    };
    refreshProducts();
    window.addEventListener("products-updated", refreshProducts);
    return () => {
      isMounted = false;
      window.removeEventListener("products-updated", refreshProducts);
    };
  }, []);

  const handleViewDetails = (product) => {
    navigate(`/product-detail/${product.id}`);
  };
  // Lọc và sắp xếp sản phẩm
  const filteredProducts = products
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
    <div className="samsung-page">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
      <h1 className="samsung-page__title">Samsung Phones</h1>

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

      <div className="samsung-grid">
        {filteredProducts.map((product) => (
          <div className="samsung-item" key={product.id}>
            <img
              src={`${process.env.PUBLIC_URL}/images/${product.images}`}
              alt={product.name}
              className="samsung-item__images"
              onClick={() => handleViewDetails(product)}
            />
            <h3 className="samsung-item__name">{product.name}</h3>
            <p className="samsung-item__description">{product.description}</p>
            <p className="samsung-item__price">{product.price.toLocaleString()} VND</p>
            <button className="samsung-item__detail" onClick={() => handleViewDetails(product)}>Xem chi tiết</button>
            <button
              className="samsung-item__button"
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

export default SamsungPage;