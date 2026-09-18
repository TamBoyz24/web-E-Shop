export const STORAGE_KEYS = {
    cart: "cart",
    orders: "orders",
    user: "user",
    currentUser: "currentUser",
    adminSession: "adminSession",
};

export function readStorage(key, fallback) {
    try {
        const value = JSON.parse(localStorage.getItem(key));
        return value ?? fallback;
    } catch {
        return fallback;
    }
}

export function writeStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event(`${key}-updated`));
}

export function getCart() {
    return readStorage(STORAGE_KEYS.cart, []);
}

export function saveCart(cart) {
    writeStorage(STORAGE_KEYS.cart, cart);
}

export function addCartItem(product, quantity = 1) {
    const cart = getCart();
    const itemIndex = cart.findIndex((item) => item.id === product.id && (item.color || "") === (product.color || ""));
    const updatedCart = itemIndex >= 0
        ? cart.map((item, index) => index === itemIndex ? { ...item, quantity: (item.quantity || 1) + quantity } : item)
        : [...cart, { ...product, quantity }];
    saveCart(updatedCart);
    return updatedCart;
}

export function getOrders() {
    return readStorage(STORAGE_KEYS.orders, []);
}

export function saveOrders(orders) {
    writeStorage(STORAGE_KEYS.orders, orders);
    window.dispatchEvent(new Event("orders-updated"));
}

export function getUser() {
    return readStorage(STORAGE_KEYS.user, readStorage(STORAGE_KEYS.currentUser, null));
}

export function createOrder(items, customerInfo, user) {
    const order = {
        id: `DH-${Date.now()}`,
        customer: customerInfo.name,
        phone: customerInfo.phone,
        address: customerInfo.address,
        userPhone: user?.phone || customerInfo.phone,
        userId: user?.id || null,
        items: items.map((item) => ({ ...item })),
        totalQuantity: items.reduce((sum, item) => sum + (item.quantity || 1), 0),
        total: items.reduce((sum, item) => sum + Number(item.price || 0) * (item.quantity || 1), 0),
        status: "pending",
        createdAt: new Date().toISOString(),
    };
    saveOrders([order, ...getOrders()]);
    return order;
}

export function removeCartItemsForOrder(order) {
    const orderIds = new Set(order.items.map((item) => String(item.id)));
    saveCart(getCart().filter((item) => !orderIds.has(String(item.id))));
}
