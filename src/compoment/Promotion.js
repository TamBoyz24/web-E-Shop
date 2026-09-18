import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Promotion.css";
import { getCart, saveCart } from "../lib/store";
import Toast from "./Toast";
import SaleTopImage from "./img/thiet-ke-anh-sale.jpg";
import Sale1 from "./img/anh1.jpg";
import Sale2 from "./img/anh2.jpg";
import Sale3 from "./img/anh3.jpg";
import Sale4 from "./img/anh4.jpg";
import Sale5 from "./img/anh5.webp";
import Sale6 from "./img/anh6.webp";
import Sale7 from "./img/anh7.webp";
import Sale8 from "./img/anh8.webp";

const saleProducts = [
    { id: 1, name: "Redmi Note 13 Pro", price: 599999, oldPrice: 899999, image: Sale1, stock: 6 },
    { id: 2, name: "iPhone 13 128GB", price: 1499999, oldPrice: 1999999, image: Sale2, stock: 1 },
    { id: 3, name: "Xiaomi POCO M6", price: 199999, oldPrice: 399999, image: Sale3, stock: 9 },
    { id: 4, name: "Samsung Galaxy A55", price: 999999, oldPrice: 1399999, image: Sale4, stock: 5 },
    { id: 5, name: "iPhone 12 mini", price: 499999, oldPrice: 799999, image: Sale5, stock: 2 },
    { id: 6, name: "Samsung Galaxy A15", price: 599999, oldPrice: 899999, image: Sale6, stock: 3 },
    { id: 7, name: "Xiaomi Redmi 14C", price: 899999, oldPrice: 1199999, image: Sale7, stock: 5 },
    { id: 8, name: "Samsung Galaxy M55", price: 449999, oldPrice: 699999, image: Sale8, stock: 0 },
];

const Promotion = () => {
    const navigate = useNavigate();
    const [timeLeft, setTimeLeft] = useState(3600);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        const timer = setInterval(() => setTimeLeft((time) => time > 0 ? time - 1 : 0), 1000);
        return () => clearInterval(timer);
    }, []);

    const addToCart = (product) => {
        if (!product.stock) {
            setToast({ message: "Sản phẩm này đã hết hàng", type: "error" });
            return;
        }
        const cart = getCart();
        const index = cart.findIndex((item) => item.id === product.id);
        const updatedCart = index >= 0
            ? cart.map((item, itemIndex) => itemIndex === index ? { ...item, quantity: (item.quantity || 1) + 1 } : item)
            : [...cart, { id: product.id, name: product.name, price: product.price, images: "", image: product.image, description: "Sản phẩm flash sale", quantity: 1 }];
        saveCart(updatedCart);
        setToast({ message: `Đã thêm ${product.name} vào giỏ hàng`, type: "success" });
    };

    const hours = String(Math.floor(timeLeft / 3600)).padStart(2, "0");
    const minutes = String(Math.floor((timeLeft % 3600) / 60)).padStart(2, "0");
    const seconds = String(timeLeft % 60).padStart(2, "0");

    return (
        <main className="promotion-page">
            <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
            <section className="promotion-hero"><img src={SaleTopImage} alt="Flash sale điện thoại" /><div><span>ƯU ĐÃI ĐẶC BIỆT</span><h1>Flash Sale<br /><strong>giá chạm đáy</strong></h1><p>Deal tốt mỗi ngày, số lượng có hạn.</p></div></section>
            <section className="promotion-heading"><div><span className="promotion-eyebrow">KẾT THÚC TRONG</span><h2>Chớp deal hôm nay</h2></div><div className="sale-timer"><b>{hours}</b><i>:</i><b>{minutes}</b><i>:</i><b>{seconds}</b></div></section>
            <section className="sale-grid">{saleProducts.map((product) => <article className="sale-card" key={product.id}><div className="sale-badge">-50%</div><img src={product.image} alt={product.name} /><div className="sale-card-body"><h3>{product.name}</h3><div><strong>{product.price.toLocaleString("vi-VN")}đ</strong><del>{product.oldPrice.toLocaleString("vi-VN")}đ</del></div><p className={product.stock ? "sale-stock" : "sale-stock sold-out"}>{product.stock ? `Còn ${product.stock} sản phẩm` : "Hết hàng"}</p><div className="sale-actions"><button type="button" onClick={() => navigate(`/product-detail/${product.id}`)}>Chi tiết</button><button type="button" onClick={() => addToCart(product)} disabled={!product.stock}>Thêm giỏ</button></div></div></article>)}</section>
        </main>
    );
};

export default Promotion;
