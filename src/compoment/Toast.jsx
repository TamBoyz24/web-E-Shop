import React, { useEffect } from "react";
import "./Toast.css";

const Toast = ({ message, type = "success", onClose }) => {
    useEffect(() => {
        if (!message) return undefined;
        const timer = setTimeout(onClose, 3600);
        return () => clearTimeout(timer);
    }, [message, onClose]);

    if (!message) return null;
    return (
        <div className={`app-toast ${type}`} role={type === "error" ? "alert" : "status"} aria-live={type === "error" ? "assertive" : "polite"}>
            <span className="toast-symbol" aria-hidden="true">{type === "error" ? "!" : "✓"}</span>
            <span className="toast-content">
                <strong>{type === "error" ? "Có lỗi xảy ra" : "Thành công"}</strong>
                <span>{message}</span>
            </span>
            <button type="button" onClick={onClose} aria-label="Đóng thông báo">×</button>
        </div>
    );
};

export default Toast;
