const API_BASE_URL = (process.env.REACT_APP_API_URL || "/api").replace(/\/+$/, "");
export const ADMIN_TOKEN_KEY = "adminToken";
export const USER_TOKEN_KEY = "userToken";

function expireAdminSession() {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem("adminSession");
    window.dispatchEvent(new Event("admin-session-expired"));
}

export async function apiRequest(path, options = {}) {
    const { admin = false, user = false, ...requestOptions } = options;
    const headers = new Headers(requestOptions.headers || {});

    if (requestOptions.body && typeof requestOptions.body !== "string") {
        headers.set("Content-Type", "application/json");
        requestOptions.body = JSON.stringify(requestOptions.body);
    }

    if (admin) {
        const token = localStorage.getItem(ADMIN_TOKEN_KEY);
        if (!token) {
            expireAdminSession();
            const error = new Error("Phiên quản trị đã hết hạn. Vui lòng đăng nhập lại.");
            error.status = 401;
            throw error;
        }
        headers.set("Authorization", `Bearer ${token}`);
    }

    if (user) {
        const token = localStorage.getItem(USER_TOKEN_KEY);
        if (!token) {
            throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        }
        headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...requestOptions,
        headers,
    });
    const contentType = response.headers.get("content-type") || "";
    const payload = contentType.includes("application/json") ? await response.json() : null;

    if (!response.ok) {
        if (admin && response.status === 401) {
            expireAdminSession();
        }
        const message = admin && response.status === 401
            ? "Phiên quản trị đã hết hạn. Vui lòng đăng nhập lại."
            : payload?.message || `Yêu cầu thất bại (${response.status}).`;
        const error = new Error(message);
        error.status = response.status;
        throw error;
    }

    return payload;
}
