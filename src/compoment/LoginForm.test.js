import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { apiRequest, USER_TOKEN_KEY } from "../lib/api";
import { readStorage } from "../lib/store";
import LoginForm from "./LoginForm";

jest.mock("../lib/api", () => ({
  apiRequest: jest.fn(),
  USER_TOKEN_KEY: "userToken",
}));

jest.mock("../lib/store", () => ({
  readStorage: jest.fn(() => []),
}));

beforeEach(() => {
  localStorage.clear();
  apiRequest.mockReset();
  readStorage.mockReset();
  readStorage.mockReturnValue([]);
  jest.spyOn(window, "alert").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

const renderLogin = () => render(
  <MemoryRouter initialEntries={["/login"]}>
    <Routes>
      <Route path="/login" element={<LoginForm />} />
      <Route path="/home" element={<p>Trang chủ</p>} />
    </Routes>
  </MemoryRouter>
);

test("signs in a customer and stores the authenticated session", async () => {
  apiRequest.mockResolvedValue({
    id: "customer-1",
    username: "Khách hàng",
    token: "customer-token",
  });
  renderLogin();

  fireEvent.change(screen.getByPlaceholderText("Số điện thoại"), {
    target: { value: "0901234567" },
  });
  fireEvent.change(screen.getByPlaceholderText("Nhập mật khẩu"), {
    target: { value: "secret123" },
  });
  fireEvent.click(screen.getByRole("button", { name: "TIẾP THEO" }));

  await screen.findByText("Trang chủ");
  expect(apiRequest).toHaveBeenCalledWith("/auth/login", {
    method: "POST",
    body: { phone: "0901234567", password: "secret123" },
  });
  expect(localStorage.getItem(USER_TOKEN_KEY)).toBe("customer-token");
  expect(JSON.parse(localStorage.getItem("currentUser"))).toMatchObject({
    id: "customer-1",
    token: "customer-token",
  });
});

test("explains rejected credentials and provides the recovery path", async () => {
  const error = new Error("Unauthorized");
  error.status = 401;
  apiRequest.mockRejectedValue(error);
  renderLogin();

  fireEvent.change(screen.getByPlaceholderText("Số điện thoại"), {
    target: { value: "0901234567" },
  });
  fireEvent.change(screen.getByPlaceholderText("Nhập mật khẩu"), {
    target: { value: "secret123" },
  });
  fireEvent.click(screen.getByRole("button", { name: "TIẾP THEO" }));

  expect(await screen.findByText(/Số điện thoại hoặc mật khẩu không đúng/)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Quên mật khẩu?" })).toBeInTheDocument();
});

test("uses appropriate browser autocomplete for phone and password", () => {
  renderLogin();

  expect(screen.getByPlaceholderText("Số điện thoại")).toHaveAttribute("autocomplete", "tel");
  expect(screen.getByPlaceholderText("Nhập mật khẩu")).toHaveAttribute("autocomplete", "current-password");
});
