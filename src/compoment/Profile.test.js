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
  apiRequest
    .mockResolvedValueOnce([{
      id: "order-1",
      orderNumber: "DH-20261101-1234",
      status: "shipping",
      total: 1299000,
      totalQuantity: 1,
      createdAt: "2026-11-01T10:00:00Z",
      items: [{ name: "iPhone 14", quantity: 1 }],
    }])
    .mockResolvedValueOnce([{
      id: "order-1",
      orderNumber: "DH-20261101-1234",
      status: "completed",
      total: 1299000,
      totalQuantity: 1,
      createdAt: "2026-11-01T10:00:00Z",
      items: [{ name: "iPhone 14", quantity: 1 }],
    }]);

  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Profile />
    </MemoryRouter>
  );

  expect(await screen.findByText("Đang giao")).toBeInTheDocument();
  expect(screen.getByText(/DH-20261101-1234/)).toBeInTheDocument();
  expect(screen.getByText("iPhone 14")).toBeInTheDocument();
  expect(apiRequest).toHaveBeenNthCalledWith(1, "/orders/mine", { user: true });

  fireEvent.click(screen.getByRole("button", { name: "Làm mới" }));
  await waitFor(() => expect(screen.getByText("Đã giao")).toBeInTheDocument());
  expect(apiRequest).toHaveBeenCalledTimes(2);
});

test("shows an empty state when the customer has no orders", async () => {
  apiRequest.mockResolvedValue([]);

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

  expect(await screen.findByRole("alert")).toHaveTextContent("Phiên đăng nhập đã hết hạn.");
  expect(screen.getByRole("button", { name: "Đăng nhập lại" })).toBeInTheDocument();
});
