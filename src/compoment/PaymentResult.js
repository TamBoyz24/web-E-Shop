import React, { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../lib/api";
import { Link, useSearchParams } from "react-router-dom";

const PAYMENT_RESULTS = {
  success: {
    title: "Thanh toán thành công",
    message: "Cổng thanh toán đã xác nhận giao dịch. Bạn có thể theo dõi đơn hàng trong hồ sơ.",
  },
  failed: {
    title: "Thanh toán chưa thành công",
    message: "Giao dịch chưa được xác nhận. Nếu tiền đã bị trừ, vui lòng liên hệ cửa hàng và cung cấp mã đơn hàng.",
  },
  pending: {
    title: "Đang xác nhận thanh toán",
    message: "Cửa hàng đang chờ thông báo xác nhận từ cổng thanh toán. Vui lòng kiểm tra lại trạng thái trong hồ sơ.",
  },
};

const PaymentResult = () => {
  const [searchParams] = useSearchParams();
  const orderNumber = searchParams.get("orderNumber");
  const [paymentStatus, setPaymentStatus] = useState("pending");
  const [loading, setLoading] = useState(Boolean(orderNumber));
  const [statusError, setStatusError] = useState("");

  const refreshPaymentStatus = useCallback(() => {
    if (!orderNumber) return;
    setLoading(true);
    setStatusError("");
    apiRequest("/orders/mine", { user: true })
      .then((orders) => {
        const order = Array.isArray(orders) && orders.find((item) => item.orderNumber === orderNumber);
        if (!order) throw new Error("Không tìm thấy trạng thái của đơn hàng trong tài khoản này.");
        setPaymentStatus(order.paymentStatus === "paid" ? "success" : order.paymentStatus === "failed" ? "failed" : "pending");
      })
      .catch((requestError) => {
        setPaymentStatus("pending");
        setStatusError(requestError.message);
      })
      .finally(() => setLoading(false));
  }, [orderNumber]);

  useEffect(() => {
    refreshPaymentStatus();
  }, [refreshPaymentStatus]);

  const result = PAYMENT_RESULTS[paymentStatus] || PAYMENT_RESULTS.pending;

  return (
    <section className="payment-result-page">
      <div className="payment-result-card">
        <span className="admin-eyebrow">PAYMENT STATUS</span>
        <h1>{result.title}</h1>
        <p>{result.message}</p>
        {orderNumber && <p>Mã đơn hàng: <strong>{orderNumber}</strong></p>}
        {loading && <p role="status">Đang kiểm tra trạng thái đơn hàng...</p>}
        {statusError && <p className="text-muted" role="status">{statusError} Trạng thái đang hiển thị là chờ xác nhận.</p>}
        <div className="payment-result-actions">
          <Link className="btn btn-primary" to="/profile">Theo dõi đơn hàng</Link>
          {orderNumber && <button className="btn btn-outline-primary" type="button" onClick={refreshPaymentStatus} disabled={loading}>Kiểm tra lại</button>}
          <Link className="btn btn-outline-secondary" to="/home">Tiếp tục mua sắm</Link>
        </div>
      </div>
    </section>
  );
};

export default PaymentResult;
