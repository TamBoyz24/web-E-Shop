import React, { useEffect, useState } from "react";
import { Link, NavLink, useNavigate, useSearchParams } from "react-router-dom";
import { USER_TOKEN_KEY } from "../lib/api";
import "./Navbar.css";

const Navbar = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [user, setUser] = useState(() => getStoredUser());
    const [cartCount, setCartCount] = useState(() => getCartCount());
    const [menuOpen, setMenuOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState(() => searchParams.get("q") || "");

    function syncState() {
        setUser(getStoredUser());
        setCartCount(getCartCount());
    }

    useEffect(() => {
        window.addEventListener("storage", syncState);
        window.addEventListener("cart-updated", syncState);
        window.addEventListener("user-session-expired", syncState);
        return () => {
            window.removeEventListener("storage", syncState);
            window.removeEventListener("cart-updated", syncState);
            window.removeEventListener("user-session-expired", syncState);
        };
    }, []);

    useEffect(() => {
        setSearchTerm(searchParams.get("q") || "");
    }, [searchParams]);

    const handleSearch = (event) => {
        event.preventDefault();
        const query = new URLSearchParams();
        if (searchTerm.trim()) query.set("q", searchTerm.trim());
        navigate(`/${query.toString() ? `?${query.toString()}` : ""}#products`);
        setMenuOpen(false);
    };

    const handleLogout = () => {
        localStorage.removeItem("user");
        localStorage.removeItem("currentUser");
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem(USER_TOKEN_KEY);
        syncState();
        navigate("/login");
    };

    return (
        <header className="site-header">
            <div className="nav-shell">
                <Link className="brand" to="/">
                    <span className="brand-mark">A</span>
                    <span>AiPhone <em>Store</em></span>
                </Link>

                <form className="nav-search" role="search" onSubmit={handleSearch}>
                    <input
                        type="search"
                        aria-label="Tìm kiếm sản phẩm"
                        placeholder="Bạn cần tìm gì?"
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                    />
                    <button type="submit" aria-label="Tìm kiếm">⌕</button>
                </form>

                <button className="menu-toggle" type="button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Mở menu">
                    <span /> <span /> <span />
                </button>

                <nav className={`main-nav ${menuOpen ? "is-open" : ""}`}>
                    <NavLink to="/" end onClick={() => setMenuOpen(false)}>Trang chủ</NavLink>
                    <NavLink to="/iphone" onClick={() => setMenuOpen(false)}>iPhone</NavLink>
                    <NavLink to="/samsung" onClick={() => setMenuOpen(false)}>Samsung</NavLink>
                    <NavLink to="/redmi" onClick={() => setMenuOpen(false)}>Xiaomi</NavLink>
                    <NavLink to="/promotion" onClick={() => setMenuOpen(false)}>Khuyến mãi</NavLink>
                </nav>

                <div className="nav-actions">
                    <Link className="cart-link" to="/cart" aria-label="Giỏ hàng">
                        <span className="cart-icon">&#128722;</span>
                        <span className="cart-label">Giỏ hàng</span>
                        <b>{cartCount}</b>
                    </Link>
                    {user ? (
                        <div className="account-actions">
                            <Link className="account-name" to="/profile">{user.username || user.name || "Tài khoản"}</Link>
                            <button className="logout-link" type="button" onClick={handleLogout}>Thoát</button>
                        </div>
                    ) : (
                        <button className="login-button" type="button" onClick={() => navigate("/login")}>Đăng nhập</button>
                    )}
                </div>
            </div>
        </header>
    );
};

function getStoredUser() {
    try {
        return JSON.parse(localStorage.getItem("user") || localStorage.getItem("currentUser") || "null");
    } catch {
        return null;
    }
}

function getCartCount() {
    try {
        return JSON.parse(localStorage.getItem("cart") || "[]").reduce((total, item) => total + (item.quantity || 1), 0);
    } catch {
        return 0;
    }
}

export default Navbar;
