import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { apiRequest } from "../lib/api";
import Profile from "./Profile";

jest.mock("../lib/api", () => ({
  USER_TOKEN_KEY: "userToken",
  apiRequest: jest.fn(),
}));

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("user", JSON.stringify({
    id: "customer-1",
    username: "Nguyen Van A",
    phone: "0901234567",
  }));
  localStorage.setItem("userToken", "customer-token");
  apiRequest.mockReset();
});

test("shows current order status and refreshes the customer's orders", async () => {
  const orders = [
    [{
      id: "order-1",
      orderNumber: "DH-20261101-1234",
      status: "shipping",
      total: 1299000,
      totalQuantity: 1,
      createdAt: "2026-11-01T10:00:00Z",
      items: [{ name: "iPhone 14", quantity: 1 }],
    }],
    [{
      id: "order-1",
      orderNumber: "DH-20261101-1234",
      status: "completed",
      total: 1299000,
      totalQuantity: 1,
      createdAt: "2026-11-01T10:00:00Z",
      items: [{ name: "iPhone 14", quantity: 1 }],
    }],
  ];
  apiRequest.mockImplementation((path) => {
    if (path === "/users/me") return Promise.resolve({
      id: "customer-1",
      username: "Nguyen Van A",
      phone: "0901234567",
      email: "a@example.com",
    });
    if (path === "/orders/mine") return Promise.resolve(orders.shift());
    return Promise.resolve(null);
  });

  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Profile />
    </MemoryRouter>
  );

  expect(await screen.findByText("Đang giao")).toBeInTheDocument();
  expect(screen.getByText(/DH-20261101-1234/)).toBeInTheDocument();
  expect(screen.getByText("iPhone 14")).toBeInTheDocument();
  expect(apiRequest).toHaveBeenCalledWith("/orders/mine", { user: true });

  fireEvent.click(screen.getByRole("button", { name: "Làm mới" }));
  await waitFor(() => expect(screen.getByText("Đã giao")).toBeInTheDocument());
  expect(apiRequest.mock.calls.filter(([path]) => path === "/orders/mine")).toHaveLength(2);
});

test("shows an empty state when the customer has no orders", async () => {
  apiRequest.mockImplementation((path) => path === "/users/me"
    ? Promise.resolve({ id: "customer-1", username: "Nguyen Van A", phone: "0901234567" })
    : Promise.resolve([]));

  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Profile />
    </MemoryRouter>
  );

  expect(await screen.findByText("Bạn chưa có đơn hàng nào.")).toBeInTheDocument();
});

test("asks the customer to sign in again when their token expires", async () => {
  apiRequest.mockRejectedValue(Object.assign(new Error("Phiên đăng nhập đã hết hạn."), { status: 401 }));

  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Profile />
    </MemoryRouter>
  );

  await waitFor(() => {
    expect(screen.getAllByRole("alert").some((alert) =>
      alert.textContent.includes("Phiên đăng nhập đã hết hạn.")
    )).toBe(true);
  });
  expect(screen.getByRole("button", { name: "Đăng nhập lại" })).toBeInTheDocument();
});

test("shows customer profile changes saved by admin on the customer profile", async () => {
  apiRequest.mockImplementation((path) => {
    if (path === "/users/me") return Promise.resolve({
      id: "customer-1",
      username: "Tên do admin cập nhật",
      phone: "0912345678",
      email: "updated@example.com",
    });
    if (path === "/orders/mine") return Promise.resolve([]);
    return Promise.resolve(null);
  });

  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Profile />
    </MemoryRouter>
  );

  await waitFor(() => {
    expect(screen.getAllByText("Tên do admin cập nhật").length).toBeGreaterThan(0);
  });
  expect(screen.getByText("0912345678")).toBeInTheDocument();
  expect(screen.getAllByText("updated@example.com").length).toBeGreaterThan(0);
  expect(JSON.parse(localStorage.getItem("user")).username).toBe("Tên do admin cập nhật");
});
