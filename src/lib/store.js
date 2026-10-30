import { apiRequest } from "./api";

export const STORAGE_KEYS = {
    cart: "cart",
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

export function getUser() {
    return readStorage(STORAGE_KEYS.user, readStorage(STORAGE_KEYS.currentUser, null));
}

export async function createOrder(items, customerInfo, user) {
    const order = await apiRequest("/orders", {
        method: "POST",
        body: {
            customer: customerInfo.name,
            phone: customerInfo.phone,
            address: customerInfo.address,
            userId: user?.id || null,
            items: items.map((item) => ({
                id: String(item.id),
                name: item.name,
                price: Number(item.price || 0),
                quantity: item.quantity || 1,
                images: item.images || "",
                image: item.image || null,
                color: item.color || null,
            })),
        },
    });
    return { ...order, databaseId: order.id, id: order.orderNumber };
}

export function removeCartItemsForOrder(order) {
    const orderIds = new Set(order.items.map((item) => String(item.id)));
    saveCart(getCart().filter((item) => !orderIds.has(String(item.id))));
}
