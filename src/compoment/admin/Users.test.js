import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { apiRequest } from "../../lib/api";
import Users from "./Users";

jest.mock("../../lib/api", () => ({
    apiRequest: jest.fn(),
}));

jest.mock("./AdminLayout", () => ({ action, children }) => (
    <main>
        {action}
        {children}
    </main>
));

test("updates a customer's name, phone, and email in the admin users page", async () => {
    const customer = {
        id: "customer-1",
        username: "Khách hàng",
        phone: "0901234567",
        email: null,
        status: "active",
        createdAt: "2026-01-01T00:00:00Z",
        passwordChanges: [],
    };
    apiRequest.mockImplementation((path, options = {}) => {
        if (path === "/admin/users") return Promise.resolve([customer]);
        if (path === "/admin/password-recovery-requests") return Promise.resolve([]);
        if (path === `/admin/users/${customer.id}/profile`) {
            return Promise.resolve({ ...customer, ...options.body });
        }
        return Promise.resolve(null);
    });

    render(<MemoryRouter><Users /></MemoryRouter>);

    fireEvent.click(await screen.findByRole("button", { name: "Sửa thông tin" }));
    fireEvent.change(screen.getByLabelText("Họ tên"), {
        target: { value: "Nguyễn An" },
    });
    fireEvent.change(screen.getByLabelText("Số điện thoại"), {
        target: { value: "0912345678" },
    });
    fireEvent.change(screen.getByLabelText("Email (không bắt buộc)"), {
        target: { value: "an@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Lưu thông tin" }));

    await waitFor(() => {
        expect(apiRequest).toHaveBeenCalledWith(
            `/admin/users/${customer.id}/profile`,
            expect.objectContaining({
                method: "PUT",
                body: {
                    username: "Nguyễn An",
                    phone: "0912345678",
                    email: "an@example.com",
                },
            })
        );
    });
    expect(await screen.findByText("Nguyễn An")).toBeInTheDocument();
    expect(await screen.findByText("an@example.com")).toBeInTheDocument();
    expect(await screen.findByText("Đã cập nhật thông tin khách hàng.")).toBeInTheDocument();
});
