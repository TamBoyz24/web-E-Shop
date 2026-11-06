import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { apiRequest } from "../lib/api";
import ForgotPassword from "./ForgotPassword";

jest.mock("../lib/api", () => ({
  apiRequest: jest.fn(),
}));

test("submits a recovery request without revealing whether the phone exists", async () => {
  apiRequest.mockResolvedValue({ message: "accepted" });

  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ForgotPassword />
    </MemoryRouter>
  );

  fireEvent.change(screen.getByLabelText("Số điện thoại tài khoản"), {
    target: { value: "0901234567" },
  });
  fireEvent.click(screen.getByRole("button", { name: "GỬI YÊU CẦU HỖ TRỢ" }));

  await waitFor(() => {
    expect(apiRequest).toHaveBeenCalledWith("/auth/password-recovery-requests", {
      method: "POST",
      body: { phone: "0901234567" },
    });
  });
  expect(await screen.findByRole("status")).toHaveTextContent("Nếu số điện thoại đã đăng ký");
});

test("displays request errors and keeps the recovery form available", async () => {
  apiRequest.mockRejectedValue(new Error("Máy chủ hiện không khả dụng."));

  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ForgotPassword />
    </MemoryRouter>
  );

  fireEvent.change(screen.getByLabelText("Số điện thoại tài khoản"), {
    target: { value: "0901234567" },
  });
  fireEvent.click(screen.getByRole("button", { name: "GỬI YÊU CẦU HỖ TRỢ" }));

  expect(await screen.findByRole("alert")).toHaveTextContent("Máy chủ hiện không khả dụng.");
});
