import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import productsData from "./ProductAdmin";
import "./admin-common.css";
import "./ProductManagement.css";

const STORAGE_KEY = "storeProducts";
const initialProducts = productsData.map(normalizeProduct);

function ProductManagement() {
    const [products, setProducts] = useState(() => loadProducts());
    const [query, setQuery] = useState("");
    const [category, setCategory] = useState("all");
    const [stockFilter, setStockFilter] = useState("all");
    const [editingProduct, setEditingProduct] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formError, setFormError] = useState("");
    const [formData, setFormData] = useState(emptyProduct());

    const categories = useMemo(() => [...new Set(products.map((product) => product.category).filter(Boolean))], [products]);
    const filteredProducts = useMemo(() => products.filter((product) => {
        const matchesQuery = `${product.name} ${product.sku} ${product.brand}`.toLowerCase().includes(query.toLowerCase());
        const matchesCategory = category === "all" || product.category === category;
        const matchesStock = stockFilter === "all"
            || (stockFilter === "low" && product.stock > 0 && product.stock <= 5)
            || (stockFilter === "out" && product.stock === 0);
        return matchesQuery && matchesCategory && matchesStock;
    }), [products, query, category, stockFilter]);

    const stats = {
        total: products.length,
        active: products.filter((product) => product.status === "active").length,
        lowStock: products.filter((product) => product.stock <= 5).length,
        inventoryValue: products.reduce((total, product) => total + product.price * product.stock, 0),
    };

    const openCreateForm = () => {
        setEditingProduct(null);
        setFormData(emptyProduct());
        setFormError("");
        setIsFormOpen(true);
    };

    const openEditForm = (product) => {
        setEditingProduct(product);
        setFormData({ ...product });
        setFormError("");
        setIsFormOpen(true);
    };

    const closeForm = () => {
        setIsFormOpen(false);
        setFormError("");
    };

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((current) => ({ ...current, [name]: value }));
    };

    const handleSave = (event) => {
        event.preventDefault();
        const product = normalizeProduct({ ...formData, id: editingProduct?.id || Date.now() });
        if (!product.name || !product.category || !product.price || !product.images) {
            setFormError("Vui lòng nhập đủ tên, danh mục, giá và tên hình ảnh.");
            return;
        }
        const updatedProducts = editingProduct
            ? products.map((item) => item.id === editingProduct.id ? product : item)
            : [product, ...products];
        saveProducts(updatedProducts);
        setProducts(updatedProducts);
        closeForm();
    };

    const handleDelete = (product) => {
        if (!window.confirm(`Xóa sản phẩm "${product.name}" khỏi kho?`)) return;
        const updatedProducts = products.filter((item) => item.id !== product.id);
        saveProducts(updatedProducts);
        setProducts(updatedProducts);
    };

    const toggleStatus = (product) => {
        const updatedProducts = products.map((item) => item.id === product.id
            ? { ...item, status: item.status === "active" ? "hidden" : "active" }
            : item);
        saveProducts(updatedProducts);
        setProducts(updatedProducts);
    };

    return (
        <main className="admin-layout inventory-page">
            <aside className="admin-sidebar">
                <Link className="admin-brand" to="/admin"><span>A</span> AiPhone Store</Link>
                <p className="admin-caption">TRUNG TÂM QUẢN TRỊ</p>
                <nav className="admin-nav">
                    <Link to="/admin">Tổng quan</Link>
                    <Link className="active" to="/admin/products">Kho sản phẩm</Link>
                    <Link to="/admin/users">Người dùng</Link>
                    <Link to="/admin/orders">Đơn hàng</Link>
                </nav>
                <Link className="back-store" to="/">← Về cửa hàng</Link>
            </aside>

            <section className="admin-workspace inventory-content">
                <header className="inventory-header">
                    <div><span className="admin-eyebrow">INVENTORY / PRODUCTS</span><h1>Kho sản phẩm</h1><p>Quản lý danh mục, giá bán và số lượng tồn kho.</p></div>
                    <button className="inventory-primary" type="button" onClick={openCreateForm}>+ Đăng sản phẩm</button>
                </header>

                <div className="inventory-stats">
                    <Stat label="Tổng sản phẩm" value={stats.total} detail="Mặt hàng trong kho" />
                    <Stat label="Đang bán" value={stats.active} detail="Sản phẩm hiển thị" />
                    <Stat label="Sắp hết hàng" value={stats.lowStock} detail="Cần nhập thêm" warning />
                    <Stat label="Giá trị tồn kho" value={`${stats.inventoryValue.toLocaleString("vi-VN")}đ`} detail="Tổng giá vốn hiển thị" />
                </div>

                <section className="inventory-panel">
                    <div className="inventory-toolbar">
                        <label className="inventory-search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm tên, mã SKU hoặc thương hiệu..." /></label>
                        <select value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">Tất cả danh mục</option>{categories.map((item) => <option key={item} value={item}>{item}</option>)}</select>
                        <select value={stockFilter} onChange={(event) => setStockFilter(event.target.value)}><option value="all">Tất cả tồn kho</option><option value="low">Sắp hết hàng</option><option value="out">Hết hàng</option></select>
                    </div>

                    <div className="inventory-table-wrap">
                        <table className="inventory-table"><thead><tr><th>SẢN PHẨM</th><th>SKU / DANH MỤC</th><th>GIÁ BÁN</th><th>TỒN KHO</th><th>TRẠNG THÁI</th><th /></tr></thead>
                            <tbody>{filteredProducts.map((product) => <tr key={product.id}>
                                <td><div className="inventory-product"><img src={`${process.env.PUBLIC_URL}/images/${product.images}`} alt={product.name} /><div><strong>{product.name}</strong><small>{product.brand || "AiPhone Store"}</small></div></div></td>
                                <td><span className="sku">{product.sku}</span><small className="table-muted">{product.category}</small></td>
                                <td><strong>{product.price.toLocaleString("vi-VN")}đ</strong></td>
                                <td><span className={`stock-number ${product.stock <= 5 ? "is-low" : ""}`}>{product.stock}</span><small className="table-muted"> sản phẩm</small></td>
                                <td><button className={`status-pill ${product.status}`} type="button" onClick={() => toggleStatus(product)}>{product.status === "active" ? "Đang bán" : "Đang ẩn"}</button></td>
                                <td><div className="row-actions"><button type="button" onClick={() => openEditForm(product)} aria-label={`Sửa ${product.name}`}>Sửa</button><button className="danger" type="button" onClick={() => handleDelete(product)} aria-label={`Xóa ${product.name}`}>Xóa</button></div></td>
                            </tr>)}</tbody></table>
                        {filteredProducts.length === 0 && <div className="empty-inventory">Không tìm thấy sản phẩm phù hợp.</div>}
                    </div>
                    <footer className="inventory-footer">Đang hiển thị <strong>{filteredProducts.length}</strong> trên {products.length} sản phẩm</footer>
                </section>
            </section>

            {isFormOpen && <div className="inventory-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && closeForm()}>
                <form className="inventory-form" onSubmit={handleSave}>
                    <div className="form-heading"><div><span className="admin-eyebrow">PRODUCT EDITOR</span><h2>{editingProduct ? "Chỉnh sửa sản phẩm" : "Đăng sản phẩm mới"}</h2></div><button type="button" onClick={closeForm} aria-label="Đóng">×</button></div>
                    {formError && <p className="form-error">{formError}</p>}
                    <div className="form-grid"><label>Tên sản phẩm<input name="name" value={formData.name} onChange={handleChange} required /></label><label>Mã SKU<input name="sku" value={formData.sku} onChange={handleChange} placeholder="VD: IP16-128" /></label><label>Thương hiệu<input name="brand" value={formData.brand} onChange={handleChange} placeholder="Apple, Samsung..." /></label><label>Danh mục<input name="category" value={formData.category} onChange={handleChange} placeholder="iPhone, Samsung..." required /></label><label>Giá bán (VNĐ)<input name="price" type="number" min="0" value={formData.price} onChange={handleChange} required /></label><label>Tồn kho<input name="stock" type="number" min="0" value={formData.stock} onChange={handleChange} required /></label><label className="form-wide">Tên file hình ảnh<input name="images" value={formData.images} onChange={handleChange} placeholder="ten-san-pham.webp" required /><small>Đặt ảnh trong thư mục public/images</small></label><label className="form-wide">Mô tả<textarea name="description" value={formData.description} onChange={handleChange} rows="3" /></label></div>
                    <div className="form-actions"><button className="form-cancel" type="button" onClick={closeForm}>Hủy</button><button className="inventory-primary" type="submit">Lưu sản phẩm</button></div>
                </form>
            </div>}
        </main>
    );
}

function Stat({ label, value, detail, warning }) { return <div className="inventory-stat"><span className={warning ? "stat-icon warning" : "stat-icon"}>◈</span><div><small>{label}</small><strong>{value}</strong><em>{detail}</em></div></div>; }
function emptyProduct() { return { name: "", sku: "", brand: "", category: "", price: "", stock: 0, images: "", description: "", status: "active" }; }
function normalizeProduct(product) { return { ...product, price: Number(product.price) || 0, stock: Number.isFinite(Number(product.stock)) ? Number(product.stock) : 20, sku: product.sku || `SP-${product.id}`, brand: product.brand || product.category || "Điện thoại", category: product.category || guessCategory(product.name), images: product.images || product.image || "", description: product.description || "Sản phẩm chính hãng tại AiPhone Store", status: product.status || "active" }; }
function guessCategory(name = "") { const value = name.toLowerCase(); if (value.includes("iphone")) return "iPhone"; if (value.includes("samsung")) return "Samsung"; return "Xiaomi"; }
function loadProducts() { try { const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)); if (Array.isArray(saved)) return saved.map(normalizeProduct); } catch { /* Use the built-in catalog when storage is invalid. */ } return initialProducts; }
function saveProducts(products) { localStorage.setItem(STORAGE_KEY, JSON.stringify(products)); window.dispatchEvent(new Event("products-updated")); }

export default ProductManagement;
