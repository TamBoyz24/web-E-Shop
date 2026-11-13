import { ADMIN_TOKEN_KEY, USER_TOKEN_KEY, apiRequest } from "./api";

const originalFetch = global.fetch;

beforeEach(() => {
  localStorage.clear();
  global.fetch = jest.fn();
});

afterEach(() => {
  global.fetch = originalFetch;
});

test("clears an expired admin session and notifies protected routes", async () => {
  localStorage.setItem(ADMIN_TOKEN_KEY, "expired-token");
  localStorage.setItem("adminSession", JSON.stringify({ role: "owner" }));
  global.fetch.mockResolvedValue({
    ok: false,
    status: 401,
    headers: new Headers({ "content-type": "application/json" }),
    json: async () => ({ message: "Unauthorized" }),
  });
  const onExpired = jest.fn();
  window.addEventListener("admin-session-expired", onExpired);

  await expect(apiRequest("/admin/users", { admin: true })).rejects.toMatchObject({
    status: 401,
    message: "Phiên quản trị đã hết hạn. Vui lòng đăng nhập lại.",
  });

  expect(localStorage.getItem(ADMIN_TOKEN_KEY)).toBeNull();
  expect(localStorage.getItem("adminSession")).toBeNull();
  expect(onExpired).toHaveBeenCalledTimes(1);
  window.removeEventListener("admin-session-expired", onExpired);
});

test("does not expire an admin session for a missing route", async () => {
  localStorage.setItem(ADMIN_TOKEN_KEY, "valid-token");
  localStorage.setItem("adminSession", JSON.stringify({ role: "owner" }));
  global.fetch.mockResolvedValue({
    ok: false,
    status: 404,
    headers: new Headers({ "content-type": "application/json" }),
    json: async () => ({ message: "Not Found" }),
  });

  await expect(apiRequest("/admin/not-found", { admin: true })).rejects.toMatchObject({
    status: 404,
  });

  expect(localStorage.getItem(ADMIN_TOKEN_KEY)).toBe("valid-token");
  expect(localStorage.getItem("adminSession")).not.toBeNull();
});

test("clears an expired customer session after an unauthorized request", async () => {
  localStorage.setItem(USER_TOKEN_KEY, "expired-token");
  localStorage.setItem("user", JSON.stringify({ id: "customer-1" }));
  global.fetch.mockResolvedValue({
    ok: false,
    status: 401,
    headers: new Headers({ "content-type": "application/json" }),
    json: async () => ({ message: "Unauthorized" }),
  });
  const onExpired = jest.fn();
  window.addEventListener("user-session-expired", onExpired);

  await expect(apiRequest("/orders", { method: "POST", user: true })).rejects.toMatchObject({
    status: 401,
  });

  expect(localStorage.getItem(USER_TOKEN_KEY)).toBeNull();
  expect(localStorage.getItem("user")).toBeNull();
  expect(onExpired).toHaveBeenCalledTimes(1);
  window.removeEventListener("user-session-expired", onExpired);
});

test("uses Problem Details text for failed API requests", async () => {
  localStorage.setItem(USER_TOKEN_KEY, "valid-token");
  global.fetch.mockResolvedValue({
    ok: false,
    status: 502,
    headers: new Headers({ "content-type": "application/problem+json" }),
    json: async () => ({ title: "Gateway failed", detail: "ZaloPay is unavailable" }),
  });

  await expect(apiRequest("/orders/order-id/payment", { method: "POST", user: true })).rejects.toMatchObject({
    status: 502,
    message: "ZaloPay is unavailable",
  });
});
