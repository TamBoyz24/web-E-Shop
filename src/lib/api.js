const API_BASE_URL = (process.env.REACT_APP_API_URL || "/api").replace(/\/+$/, "");
export const ADMIN_TOKEN_KEY = "adminToken";

export async function apiRequest(path, options = {}) {
    const { admin = false, ...requestOptions } = options;
    const headers = new Headers(requestOptions.headers || {});

    if (requestOptions.body && typeof requestOptions.body !== "string") {
        headers.set("Content-Type", "application/json");
        requestOptions.body = JSON.stringify(requestOptions.body);
    }

    if (admin) {
        const token = localStorage.getItem(ADMIN_TOKEN_KEY);
        if (!token) {
            throw new Error("Phiên quản trị đã hết hạn. Vui lòng đăng nhập lại.");
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
        const error = new Error(payload?.message || `Yêu cầu thất bại (${response.status}).`);
        error.status = response.status;
        throw error;
    }

    return payload;
}
