import { apiRequest } from "./api";
import { createOrder, getPaymentOptions, startOrderPayment } from "./store";

jest.mock("./api", () => ({
    apiRequest: jest.fn(),
}));

describe("checkout payment requests", () => {
    beforeEach(() => {
        apiRequest.mockReset();
    });

    test("loads only the payment options configured by the API", async () => {
        const options = { methods: [{ code: "cod", enabled: true }] };
        apiRequest.mockResolvedValue(options);

        await expect(getPaymentOptions()).resolves.toBe(options);
        expect(apiRequest).toHaveBeenCalledWith("/payments/options");
    });

    test("includes the selected method when creating an order", async () => {
        apiRequest.mockResolvedValue({ id: "mongo-id", orderNumber: "DH-1" });

        const order = await createOrder(
            [{ id: "product-id", name: "Phone", price: 25000000, quantity: 1 }],
            { name: "Customer", phone: "0900000000", address: "Hanoi" },
            "zalopay"
        );

        expect(apiRequest).toHaveBeenCalledWith("/orders", expect.objectContaining({
            method: "POST",
            user: true,
            body: expect.objectContaining({ paymentMethod: "zalopay" }),
        }));
        expect(order).toEqual(expect.objectContaining({ databaseId: "mongo-id", id: "DH-1" }));
    });

    test("starts gateway checkout for the saved order instead of recreating it", async () => {
        apiRequest.mockResolvedValue({ url: "https://gateway.example/checkout" });

        await startOrderPayment("mongo-id");

        expect(apiRequest).toHaveBeenCalledWith("/orders/mongo-id/payment", {
            method: "POST",
            user: true,
        });
    });
});
