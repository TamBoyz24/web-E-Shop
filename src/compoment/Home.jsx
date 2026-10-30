import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../lib/api";
import { addCartItem, getCart } from "../lib/store";
import Toast from "./Toast";
import "./Home.css"; // Giả sử bạn đã có file CSS cho Home

const Home = () => {
  const samsungProducts = [
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

  const [searchQuery, setSearchQuery] = useState("");
  const [priceRange, setPriceRange] = useState("all");
  const [products, setProducts] = useState(() => loadStoreProducts(samsungProducts));
  const [cart, setCart] = useState(getCart);
  const [user, setUser] = useState(null);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

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

  useEffect(() => {
    const refreshProducts = async () => {
      try {
        const savedProducts = await apiRequest("/products");
        setProducts(savedProducts.length ? savedProducts : loadStoreProducts(samsungProducts));
      } catch (requestError) {
        setToast({ message: requestError.message, type: "error" });
      }
    };
    refreshProducts();
    window.addEventListener("products-updated", refreshProducts);
    window.addEventListener("storage", refreshProducts);
    return () => {
      window.removeEventListener("products-updated", refreshProducts);
      window.removeEventListener("storage", refreshProducts);
    };
  }, []);

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handlePriceRangeChange = (event) => {
    setPriceRange(event.target.value);
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearchQuery = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriceRange =
      priceRange === "all" ||
      (priceRange === "under1000" && product.price < 1000) ||
      (priceRange === "1000to2000" && product.price >= 1000 && product.price <= 2000) ||
      (priceRange === "over2000" && product.price > 2000);
    return matchesSearchQuery && matchesPriceRange;
  });

  const handleViewDetails = (product) => {
    navigate(`/product-detail/${product.id}`);
  };

  const handleAddToCart = (product) => {
    setCart(addCartItem(product));
    setToast({ message: `Đã thêm ${product.name} vào giỏ hàng`, type: "success" });
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    setToast({ message: "Đã đăng xuất thành công", type: "success" });
  };

  return (
    <div className="home-page">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
      <section className="home-intro">
        <div className="intro-copy">
          <span className="eyebrow">CÔNG NGHỆ TRONG TẦM TAY</span>
          <h1>Chiếc điện thoại hợp gu, <span>đúng giá.</span></h1>
          <p>Khám phá iPhone, Samsung và Xiaomi chính hãng với ưu đãi rõ ràng, tư vấn tận tâm và giao hàng nhanh.</p>
          <div className="intro-actions">
            <a href="#products" className="primary-cta">Khám phá sản phẩm <span>→</span></a>
            <a href="/promotion" className="secondary-cta">Xem ưu đãi hôm nay</a>
          </div>
          <div className="trust-row">
            <span><b>✓</b> Hàng chính hãng</span>
            <span><b>✓</b> Đổi trả 30 ngày</span>
            <span><b>✓</b> Hỗ trợ mỗi ngày</span>
          </div>
        </div>
        <div className="intro-art">
          <div className="art-orbit orbit-one" />
          <div className="art-orbit orbit-two" />
          <img src={`${process.env.PUBLIC_URL}/images/carosel1.jpg`} alt="Điện thoại nổi bật" />
          <div className="floating-price"><small>Deal nổi bật</small><strong>Giảm đến 30%</strong></div>
        </div>
      </section>

      <section className="campaign-strip" aria-label="Cam kết mua sắm">
        <div><strong>Miễn phí vận chuyển</strong><span>Cho đơn từ 500.000đ</span></div>
        <div><strong>Trả góp 0%</strong><span>Thủ tục đơn giản, duyệt nhanh</span></div>
        <div><strong>Bảo hành an tâm</strong><span>Hỗ trợ kỹ thuật tận nơi</span></div>
      </section>

      <section className="catalog-section" id="products">
        <div className="section-heading">
          <div><span className="eyebrow">BỘ SƯU TẬP MỚI</span><h2>Sản phẩm được yêu thích</h2></div>
          <span className="result-count">{filteredProducts.length} sản phẩm</span>
        </div>
        <div id="carouselExampleIndicators" className="carousel slide" data-bs-ride="carousel" data-bs-interval="3000">
          <div className="carousel-indicators">
            <button type="button" data-bs-target="#carouselExampleIndicators" data-bs-slide-to="0" className="active" aria-current="true" aria-label="Slide 1"></button>
            <button type="button" data-bs-target="#carouselExampleIndicators" data-bs-slide-to="1" aria-label="Slide 2"></button>
            <button type="button" data-bs-target="#carouselExampleIndicators" data-bs-slide-to="2" aria-label="Slide 3"></button>
          </div>
          <div className="carousel-inner">
            <div className="carousel-item active">
              <img src="/images/carosel1.jpg" className="d-block w-100" alt="Slide 1" />
            </div>
            <div className="carousel-item">
              <img src="/images/carosel2.jpg" className="d-block w-100" alt="Slide 2" />
            </div>
            <div className="carousel-item">
              <img src="/images/carosel3.jpeg" className="d-block w-100" alt="Slide 3" />
            </div>
          </div>
          <button className="carousel-control-prev" type="button" data-bs-target="#carouselExampleIndicators" data-bs-slide="prev">
            <span className="carousel-control-prev-icon" aria-hidden="true"></span>
            <span className="visually-hidden">Previous</span>
          </button>
          <button className="carousel-control-next" type="button" data-bs-target="#carouselExampleIndicators" data-bs-slide="next">
            <span className="carousel-control-next-icon" aria-hidden="true"></span>
            <span className="visually-hidden">Next</span>
          </button>
        </div>

        <div className="search-container">
          <span className="search-icon">⌕</span>
          <input
            type="text"
            className="search-input"
            placeholder="Tìm kiếm sản phẩm..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
          <select value={priceRange} onChange={handlePriceRangeChange} className="price-filter">
            <option value="all">Tất cả giá</option>
            <option value="under1000">Dưới 1000 VND</option>
            <option value="1000to2000">1000 - 2000 VND</option>
            <option value="over2000">Trên 2000 VND</option>
          </select>
        </div>

        <div className="product-list">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <article key={product.id} className="product-item">
                <span className="product-tag">Chính hãng</span>
                <img
                  src={`${process.env.PUBLIC_URL}/images/${product.images}`}
                  alt={product.name}
                  onClick={() => handleViewDetails(product)}
                />
                <div className="product-info">
                  <h3>{product.name}</h3>
                  <p className="product-description">{product.description}</p>
                  <div className="product-meta"><span className="product-rating">★ 4.8</span><span>Còn hàng</span></div>
                  <strong className="product-price">{product.price.toLocaleString('vi-VN')} <small>đ</small></strong>
                  <div className="product-actions">
                    <button className="add-button" onClick={() => handleAddToCart(product)}>Thêm vào giỏ</button>
                    <button className="detail-button" onClick={() => handleViewDetails(product)} aria-label={`Xem ${product.name}`}>→</button>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <p>Không tìm thấy sản phẩm nào!</p>
          )}
        </div>
      </section>

      {/* User Information */}
      {user && (
        <div className="user-info">
          <p>Xin chào, {user?.name || "Người dùng"}!</p>
          <button onClick={handleLogout} className="logout-btn">Đăng xuất</button>
        </div>
      )}
    </div>
  );
};

export default Home;

function loadStoreProducts(fallbackProducts) {
  try {
    const savedProducts = JSON.parse(localStorage.getItem("storeProducts"));
    if (Array.isArray(savedProducts)) {
      return savedProducts.filter((product) => product.status !== "hidden" && product.stock !== 0);
    }
  } catch {
    return fallbackProducts;
  }
  return fallbackProducts;
}
