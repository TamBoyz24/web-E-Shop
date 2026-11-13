import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { apiRequest } from "../lib/api";
import PaymentResult from "./PaymentResult";

jest.mock("../lib/api", () => ({
    apiRequest: jest.fn(),
}));

test("shows the server-confirmed status instead of trusting redirect query parameters", async () => {
    apiRequest.mockResolvedValue([
        { orderNumber: "DH-123", paymentStatus: "pending" },
    ]);

    render(
        <MemoryRouter initialEntries={["/payment-result?status=success&orderNumber=DH-123"]}>
            <PaymentResult />
        </MemoryRouter>
    );

    await waitFor(() => expect(apiRequest).toHaveBeenCalledWith("/orders/mine", { user: true }));
    expect(await screen.findByRole("heading", { name: "Đang xác nhận thanh toán" })).toBeInTheDocument();
});
