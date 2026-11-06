import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { apiRequest } from "../../lib/api";
import Admin from "./Admin";

jest.mock("../../lib/api", () => ({
    apiRequest: jest.fn(),
}));

test("keeps the dashboard usable when the API returns null", async () => {
    apiRequest.mockResolvedValue(null);

    render(
        <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Admin />
        </MemoryRouter>
    );

    expect(screen.getByText("Sản phẩm trong kho")).toBeInTheDocument();
    expect(screen.getByText("Sản phẩm trong kho").parentElement).toHaveTextContent("0");
    await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent("Dữ liệu tổng quan không hợp lệ");
    });
});
