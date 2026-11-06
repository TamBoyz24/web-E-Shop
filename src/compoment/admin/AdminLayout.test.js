import { act, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { apiRequest } from "../../lib/api";
import AdminLayout from "./AdminLayout";

jest.mock("../../lib/api", () => ({
  apiRequest: jest.fn().mockRejectedValue(new Error("API unavailable")),
}));

afterEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
  jest.useRealTimers();
});

test("shows consistent navigation and the active page for admin staff", () => {
  localStorage.setItem("adminSession", JSON.stringify({
    role: "staff",
    displayName: "Nhân viên",
  }));

  render(
    <MemoryRouter initialEntries={["/admin/users"]}>
      <AdminLayout><div>Nội dung</div></AdminLayout>
    </MemoryRouter>
  );

  expect(screen.getByRole("navigation", { name: "Điều hướng quản trị" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /Người dùng/ })).toHaveAttribute("aria-current", "page");
  expect(screen.getByRole("link", { name: /Đơn hàng/ })).not.toHaveAttribute("aria-current");
  expect(screen.queryByRole("link", { name: /Nhân viên admin/ })).not.toBeInTheDocument();
  expect(screen.getByText("NHÂN VIÊN")).toBeInTheDocument();
});

test("shows the staff management link for owner admins", () => {
  localStorage.setItem("adminSession", JSON.stringify({ role: "owner", username: "admin" }));

  render(
    <MemoryRouter initialEntries={["/admin/staff"]}>
      <AdminLayout><div>Nội dung</div></AdminLayout>
    </MemoryRouter>
  );

  expect(screen.getByRole("link", { name: /Nhân viên admin/ })).toHaveAttribute("aria-current", "page");
  expect(screen.getByText("QUẢN TRỊ VIÊN")).toBeInTheDocument();
});

test("shows the pending order count from the dashboard endpoint", async () => {
  apiRequest.mockResolvedValue({ pendingOrderCount: 3 });

  render(
    <MemoryRouter initialEntries={["/admin/orders"]}>
      <AdminLayout><div>Nội dung</div></AdminLayout>
    </MemoryRouter>
  );

  expect(await screen.findByText("3")).toBeInTheDocument();
  expect(apiRequest).toHaveBeenCalledWith("/admin/dashboard", { admin: true });
});

test("notifies admins when new orders arrive", async () => {
  jest.useFakeTimers();
  apiRequest
    .mockResolvedValueOnce({ pendingOrderCount: 1, orders: [{ id: "existing-order" }] })
    .mockResolvedValueOnce({
      pendingOrderCount: 2,
      orders: [{ id: "new-order" }, { id: "existing-order" }],
    });

  render(
    <MemoryRouter initialEntries={["/admin"]}>
      <AdminLayout><div>Nội dung</div></AdminLayout>
    </MemoryRouter>
  );
  await act(async () => { await Promise.resolve(); });
  expect(screen.getByText("1")).toBeInTheDocument();

  await act(async () => {
    jest.advanceTimersByTime(30000);
    await Promise.resolve();
  });
  expect(screen.getByRole("status")).toHaveTextContent("Bạn vừa nhận được 1 đơn hàng mới.");
  expect(screen.getByText("2")).toBeInTheDocument();
});
