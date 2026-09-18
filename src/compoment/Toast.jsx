import React, { useEffect } from "react";
import "./Toast.css";

const Toast = ({ message, type = "success", onClose }) => {
    useEffect(() => {
        if (!message) return undefined;
        const timer = setTimeout(onClose, 2800);
        return () => clearTimeout(timer);
    }, [message, onClose]);

    if (!message) return null;
    return (
        <div className={`app-toast ${type}`} role="status">
            <span className="toast-symbol">{type === "error" ? "!" : "✓"}</span>
            <span>{message}</span>
            <button type="button" onClick={onClose} aria-label="Đóng thông báo">×</button>
        </div>
    );
};

export default Toast;
