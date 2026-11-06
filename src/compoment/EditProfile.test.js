import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { apiRequest } from "../lib/api";
import EditProfile from "./EditProfile";

jest.mock("../lib/api", () => ({
  USER_TOKEN_KEY: "userToken",
  apiRequest: jest.fn(),
}));

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("userToken", "customer-token");
  localStorage.setItem("user", JSON.stringify({
    id: "customer-1",
    username: "Khách hàng",
    phone: "0901234567",
  }));
  apiRequest.mockReset();
});

test("saves customer profile changes to the API and refreshes local account data", async () => {
  apiRequest.mockImplementation((path, options = {}) => Promise.resolve(path === "/users/me" && options.method !== "PUT"
    ? {
      id: "customer-1",
      username: "Server Name",
      phone: "0901234567",
      email: "",
    }
    : {
      id: "customer-1",
      username: "Nguyễn An",
      phone: "0912345678",
      email: "an@example.com",
    }));

  render(
    <MemoryRouter>
      <EditProfile />
    </MemoryRouter>
  );

  await screen.findByDisplayValue("Server Name");
  fireEvent.change(screen.getByLabelText("Họ tên:"), {
    target: { value: "Nguyễn An" },
  });
  fireEvent.change(screen.getByLabelText("Email (không bắt buộc):"), {
    target: { value: "an@example.com" },
  });
  fireEvent.change(screen.getByLabelText("Số điện thoại:"), {
    target: { value: "0912345678" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Lưu thay đổi" }));

  await waitFor(() => {
    expect(apiRequest).toHaveBeenCalledWith("/users/me", expect.objectContaining({
      method: "PUT",
      user: true,
      body: {
        username: "Nguyễn An",
        email: "an@example.com",
        phone: "0912345678",
      },
    }));
  });
  await waitFor(() => {
    expect(JSON.parse(localStorage.getItem("user")).username).toBe("Nguyễn An");
  });
  expect(await screen.findByText("Thông tin tài khoản đã được cập nhật.")).toBeInTheDocument();
});
