import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import "bootstrap/dist/css/bootstrap.min.css";
import { ProductProvider } from "./compoment/ProductContext"; // Đảm bảo import đúng ProductProvider

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <ProductProvider>
      <App />
    </ProductProvider>
  </React.StrictMode>
);

// Nếu bạn muốn đo lường hiệu suất trong ứng dụng, bạn có thể gọi function này
// Ví dụ: reportWebVitals(console.log)
reportWebVitals();
