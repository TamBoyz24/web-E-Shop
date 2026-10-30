import React, { useEffect, useState } from 'react';
import './RedmiPage.css';
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../lib/api";
import { getCart, saveCart } from "../lib/store";
import Toast from "../compoment/Toast";

const redmiProducts = [
  { id: 21, name: 'Xiaomi 14 (12GB 256GB)', price: 599, images: 'Xiaomi 14 (12GB 256GB).webp', description: 'Mô tả chi tiết của Xiaomi 14 (12GB 256GB)' },
  { id: 22, name: 'Xiaomi 14 Ultra 5G (16GB - 512GB)', price: 1799, images: 'Xiaomi 14 Ultra 5G (16GB - 512GB).webp', description: 'Mô tả chi tiết của Xiaomi 14 Ultra 5G (16GB - 512GB)' },
  { id: 23, name: 'Xiaomi 14T (12GB 512GB)', price: 2799, images: 'Xiaomi 14T (12GB 512GB).webp', description: 'Mô tả chi tiết của Xiaomi 14T (12GB 512GB)' },
  { id: 24, name: 'Xiaomi 14T Pro 12GB 512GB', price: 199, images: 'Xiaomi 14T Pro 12GB 512GB.webp', description: 'Mô tả chi tiết của Xiaomi 14T Pro 12GB 512GB' },
  { id: 25, name: 'Xiaomi POCO M6 (6GB 128GB)', price: 299, images: 'Xiaomi POCO M6 (6GB 128GB).webp', description: 'Mô tả chi tiết của Xiaomi POCO M6 (6GB 128GB)' },
  { id: 26, name: 'Xiaomi POCO X6 Pro 5G 8GB 256GB', price: 199, images: 'Xiaomi POCO X6 Pro 5G 8GB 256GB.webp', description: 'Mô tả chi tiết của Xiaomi POCO X6 Pro 5G 8GB 256GB' },
  { id: 27, name: 'Xiaomi Redmi 14C 4GB 128GB', price: 399, images: 'Xiaomi Redmi 14C 4GB 128GB.webp', description: 'Mô tả chi tiết của Xiaomi Redmi 14C 4GB 128GB' },
  { id: 28, name: 'Xiaomi Redmi Note 13 (6GB-128GB)', price: 1299, images: 'Xiaomi Redmi Note 13 (6GB-128GB).webp', description: 'Mô tả chi tiết của Xiaomi Redmi Note 13 (6GB-128GB)' },
  { id: 29, name: 'Xiaomi Redmi Note 13 Pro 4G', price: 1599, images: 'Xiaomi Redmi Note 13 Pro 4G.webp', description: 'Mô tả chi tiết của Xiaomi Redmi Note 13 Pro 4G' },
  { id: 30, name: 'Xiaomi Redmi Note 13 Pro Plus 5G 8GB 256GB', price: 999, images: 'Xiaomi Redmi Note 13 Pro Plus 5G 8GB 256GB.webp', description: 'Mô tả chi tiết của Xiaomi Redmi Note 13 Pro Plus 5G 8GB 256GB' },
  { id: 31, name: 'xiaomi-13-lite', price: 699, images: 'xiaomi-13-lite.webp', description: 'Mô tả chi tiết của xiaomi-13-lite' },
  { id: 32, name: 'xiaomi-13-pro-thumb-xanh-la9', price: 699, images: 'xiaomi-13-pro-thumb-xanh-la9.webp', description: 'Mô tả chi tiết của xiaomi-13-pro-thumb-xanh-la9' },
  { id: 33, name: 'xiaomi-13', price: 1999, images: 'xiaomi-13.webp', description: 'Mô tả chi tiết của xiaomi-13' },
  { id: 34, name: 'xiaomi-13t_1__1_2', price: 1199, images: 'xiaomi-13t_1__1_2.webp', description: 'Mô tả chi tiết của xiaomi-13t_1__1_2' },
  { id: 35, name: 'xiaomi-poco-m5', price: 1799, images: 'xiaomi-poco-m5.webp', description: 'Mô tả chi tiết của xiaomi-poco-m5' },
  { id: 36, name: 'xiaomi-redmi-13c_21__1', price: 499, images: 'xiaomi-redmi-13c_21__1.webp', description: 'Mô tả chi tiết của xiaomi-redmi-13c_21__1' },
  { id: 37, name: 'xiaomi-redmi-a3-xanh-1', price: 899, images: 'xiaomi-redmi-a3-xanh-1.webp', description: 'Mô tả chi tiết của xiaomi-redmi-a3-xanh-1' },
  { id: 38, name: 'xiaomi-redmi-note-11', price: 1699, images: 'xiaomi-redmi-note-11.webp', description: 'Mô tả chi tiết của xiaomi-redmi-note-11' },
  { id: 39, name: 'xiaomi-redmi-note-12_1', price: 499, images: 'xiaomi-redmi-note-12_1.webp', description: 'Mô tả chi tiết của xiaomi-redmi-note-12_1' },
  { id: 40, name: 'xiaomi-redmi-note-12-pro-5g', price: 1399, images: 'xiaomi-redmi-note-12-pro-5g.webp', description: 'Mô tả chi tiết của xiaomi-redmi-note-12-pro-5g' },
];

const RedmiPage = () => {
  const [products, setProducts] = useState(redmiProducts);
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
          setProducts(savedProducts.filter((product) => /xiaomi|redmi|poco/i.test(`${product.category} ${product.name}`)));
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
    <div className="redmi-page">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
      <h1 className="redmi-page__title">Redmi Phones</h1>

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

      <div className="redmi-grid">
        {filteredProducts.map((product) => (
          <div className="redmi-item" key={product.id}>
            <img
              src={`${process.env.PUBLIC_URL}/images/${product.images}`}
              alt={product.name}
              className="redmi-item__images"
              onClick={() => handleViewDetails(product)}
            />
            <h3 className="redmi-item__name">{product.name}</h3>
            <p className="redmi-item__description">{product.description}</p>
            <p className="redmi-item__price">{product.price.toLocaleString()} VND</p>
            <button className="redmi-item__detail" onClick={() => handleViewDetails(product)}>Xem chi tiết</button>
            <button
              className="redmi-item__button"
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

export default RedmiPage;
