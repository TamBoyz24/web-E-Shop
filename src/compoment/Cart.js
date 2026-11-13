import React, { useEffect, useState } from 'react';
import './Cart.css'; // Đảm bảo bạn có tệp CSS hoặc đổi đường dẫn phù hợp
import { Modal, Button, Form } from 'react-bootstrap'; // Import các component cần thiết từ react-bootstrap
import { addCartItem, createOrder, getCart, getPaymentOptions, getUser, saveCart, startOrderPayment } from '../lib/store';
import { USER_TOKEN_KEY } from '../lib/api';
import { normalizeLegacyCatalog } from '../lib/catalog';
import { Link, useNavigate } from 'react-router-dom';
import Toast from './Toast';

const Cart = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState(() => normalizeLegacyCatalog(getCart()));
  const [totalQuantity, setTotalQuantity] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({ name: '', address: '', phone: '' });
  const [orderCreated, setOrderCreated] = useState(null);
  const [paymentOptions, setPaymentOptions] = useState(null);
  const [paymentOptionsError, setPaymentOptionsError] = useState('');
  const [paymentOptionsLoading, setPaymentOptionsLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState(() => getCart().map(getItemKey));
  const [toast, setToast] = useState(null);

  const selectedItems = cartItems.filter((item) => selectedKeys.includes(getItemKey(item)));

  useEffect(() => {
    const totalQuantity = selectedItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const totalPrice = selectedItems.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);

    setTotalQuantity(totalQuantity);
    setTotalPrice(totalPrice);
  }, [cartItems, selectedKeys]);

  useEffect(() => {
    const storedCart = getCart();
    const normalizedCart = normalizeLegacyCatalog(storedCart);
    if (JSON.stringify(storedCart) !== JSON.stringify(normalizedCart)) {
      saveCart(normalizedCart);
      setCartItems(normalizedCart);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    getPaymentOptions()
      .then((options) => {
        if (!isMounted) return;
        setPaymentOptions(options);
        const defaultMethod = options.methods?.find((method) => method.code === 'cod' && method.enabled)
          || options.methods?.find((method) => method.enabled);
        if (defaultMethod) setPaymentMethod(defaultMethod.code);
        setPaymentOptionsError('');
      })
      .catch((requestError) => {
        if (isMounted) setPaymentOptionsError(requestError.message);
      })
      .finally(() => {
        if (isMounted) setPaymentOptionsLoading(false);
      });
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    const refreshCart = () => {
      const nextCart = getCart();
      const normalizedCart = normalizeLegacyCatalog(nextCart);
      setCartItems(normalizedCart);
      setSelectedKeys((current) => current.filter((key) => normalizedCart.some((item) => getItemKey(item) === key)));
    };
    window.addEventListener('cart-updated', refreshCart);
    window.addEventListener('storage', refreshCart);
    return () => {
      window.removeEventListener('cart-updated', refreshCart);
      window.removeEventListener('storage', refreshCart);
    };
  }, []);

  const addToCart = (product) => {
    const validatedProduct = validateProduct(product);

    if (!validatedProduct) {
      setToast({ message: 'Thông tin sản phẩm không hợp lệ', type: 'error' });
      return;
    }

    setCartItems(addCartItem(product));
    setToast({ message: `Đã thêm ${product.name} vào giỏ hàng`, type: 'success' });
  };

  const validateProduct = (product) => {
    if (!product.name || !product.price || !product.images || !product.id) {
      return false;
    }
    return true;
  };

  const handleRemove = (id) => {
    const updatedCart = cartItems.filter((item) => item.id !== id);
    saveCart(updatedCart);
    setCartItems(updatedCart);
    setSelectedKeys((current) => current.filter((key) => !key.startsWith(`${id}-`)));
    setToast({ message: 'Đã xóa sản phẩm khỏi giỏ hàng', type: 'success' });
  };

  const handleIncreaseQuantity = (id) => {
    const updatedCart = cartItems.map((item) =>
      item.id === id ? { ...item, quantity: (item.quantity || 1) + 1 } : item
    );
    saveCart(updatedCart);
    setCartItems(updatedCart);
  };

  const handleDecreaseQuantity = (id) => {
    const updatedCart = cartItems.map((item) =>
      item.id === id && item.quantity > 1
        ? { ...item, quantity: item.quantity - 1 }
        : item
    );
    saveCart(updatedCart);
    setCartItems(updatedCart);
  };

  const handlePurchase = () => {
    if (selectedItems.length === 0) {
      setToast({ message: 'Hãy chọn ít nhất một sản phẩm để mua', type: 'error' });
      return;
    }
    if (!getUser() || !localStorage.getItem(USER_TOKEN_KEY)) {
      navigate('/login', { state: { from: '/cart' } });
      return;
    }
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
  };

  const handleModalSave = async () => {
    if (!getUser() || !localStorage.getItem(USER_TOKEN_KEY)) {
      setShowModal(false);
      navigate('/login', { state: { from: '/cart' } });
      return;
    }
    if (!customerInfo.name.trim() || !customerInfo.address.trim() || !/^0\d{9,10}$/.test(customerInfo.phone)) {
      setToast({ message: 'Vui lòng nhập họ tên, địa chỉ và số điện thoại hợp lệ', type: 'error' });
      return;
    }
    setSubmittingOrder(true);
    try {
      const order = await createOrder(selectedItems, customerInfo, paymentMethod);
      const remainingItems = cartItems.filter((item) => !selectedKeys.includes(getItemKey(item)));
      saveCart(remainingItems);
      setCartItems(remainingItems);
      setShowModal(false);
      setSelectedKeys([]);
      setCustomerInfo({ name: '', address: '', phone: '' });
      setOrderCreated({ ...order, paymentError: '' });

      if (paymentMethod === 'vnpay' || paymentMethod === 'zalopay') {
        try {
          const checkout = await startOrderPayment(order.databaseId);
          window.location.assign(checkout.url);
          return;
        } catch (paymentError) {
          setOrderCreated((current) => current ? { ...current, paymentError: paymentError.message } : current);
          setToast({ message: `Đơn ${order.id} đã tạo nhưng chưa khởi tạo được thanh toán. Bạn có thể thử lại bên dưới.`, type: 'error' });
          return;
        }
      }

      setToast({ message: `Đã tiếp nhận đơn ${order.id}`, type: 'success' });
    } catch (requestError) {
      if (requestError.status === 401) {
        localStorage.removeItem(USER_TOKEN_KEY);
        localStorage.removeItem('user');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('isLoggedIn');
        navigate('/login', { state: { from: '/cart' } });
        return;
      }
      setToast({ message: requestError.message, type: 'error' });
    } finally {
      setSubmittingOrder(false);
    }
  };

  const retryPayment = async () => {
    if (!orderCreated?.databaseId) return;
    try {
      const checkout = await startOrderPayment(orderCreated.databaseId);
      window.location.assign(checkout.url);
    } catch (requestError) {
      setOrderCreated((current) => current ? { ...current, paymentError: requestError.message } : current);
      setToast({ message: requestError.message, type: 'error' });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCustomerInfo({ ...customerInfo, [name]: value });
  };

  return (
    <div className="container mt-5">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
      <h2 className="text-center mb-4">Giỏ hàng</h2>
      <div className="cart-selection-bar">
        <label><input type="checkbox" checked={cartItems.length > 0 && selectedKeys.length === cartItems.length} onChange={(event) => setSelectedKeys(event.target.checked ? cartItems.map(getItemKey) : [])} /> Chọn tất cả</label>
        <span>Đã chọn <strong>{selectedItems.length}</strong> sản phẩm · <strong>{totalQuantity}</strong> sản phẩm</span>
      </div>
      <table className="table table-bordered text-center">
        <thead>
          <tr>
            <th>STT</th>
            <th>Chọn</th>
            <th>Ảnh đại diện</th>
            <th>Tên sản phẩm</th>
            <th>Số lượng</th>
            <th>Đơn giá</th>
            <th>Thành tiền</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {cartItems.length > 0 ? (
            cartItems.map((item, index) => (
              <tr key={item.id}>
                <td>{index + 1}</td>
                <td><input type="checkbox" checked={selectedKeys.includes(getItemKey(item))} onChange={(event) => setSelectedKeys((current) => event.target.checked ? [...current, getItemKey(item)] : current.filter((key) => key !== getItemKey(item)))} aria-label={`Chọn ${item.name}`} /></td>
                <td>
                  <img src={item.image || `${process.env.PUBLIC_URL}/images/${item.images}`} alt={item.name} width="50" />
                </td>
                <td>{item.name}</td>
                <td>
                  <div className="quantity-controls">
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => handleDecreaseQuantity(item.id)}
                    >
                      -
                    </button>
                    <span>{item.quantity || 1}</span>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => handleIncreaseQuantity(item.id)}
                    >
                      +
                    </button>
                  </div>
                </td>
                <td>{item.price.toLocaleString('vi-VN')} VND</td>
                <td>
                  {(item.price * (item.quantity || 1)).toLocaleString('vi-VN')} VND
                </td>
                <td>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleRemove(item.id)}
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="8">Giỏ hàng trống</td>
            </tr>
          )}
        </tbody>
      </table>
      <div className="d-flex justify-content-between">
        <p><strong>Tổng giá trị: {isNaN(totalPrice) ? '0' : totalPrice.toLocaleString('vi-VN')} đ</strong></p>
        <button className="btn btn-success" onClick={handlePurchase} disabled={paymentOptionsLoading || !paymentOptions}>
          Mua hàng
        </button>
      </div>
      {paymentOptionsError && <div className="alert alert-danger mt-3" role="alert">Không thể tải phương thức thanh toán: {paymentOptionsError}</div>}
      {orderCreated && <div className="alert alert-info mt-3">
        <p>Đơn <strong>{orderCreated.id}</strong> đã được tạo thành công. Sản phẩm đã mua được chuyển khỏi giỏ hàng.</p>
        {orderCreated.paymentMethod === 'bank_transfer' && paymentOptions?.bankTransfer && <div className="bank-transfer-instructions">
          <strong>Thông tin chuyển khoản</strong>
          <span>Ngân hàng: {paymentOptions.bankTransfer.bankName}</span>
          <span>Chủ tài khoản: {paymentOptions.bankTransfer.accountName}</span>
          <span>Số tài khoản: {paymentOptions.bankTransfer.accountNumber}</span>
          {paymentOptions.bankTransfer.branch && <span>Chi nhánh: {paymentOptions.bankTransfer.branch}</span>}
          <span className="bank-transfer-content">Nội dung chuyển khoản: <strong>{orderCreated.id}</strong></span>
          <span>Đơn hàng sẽ được xử lý sau khi cửa hàng xác nhận đã nhận tiền.</span>
        </div>}
        {orderCreated.paymentMethod === 'cod' && <span>Bạn thanh toán khi nhận hàng.</span>}
        {orderCreated.paymentError && <div className="payment-retry">
          <p>Đơn hàng đã được lưu, nhưng cổng thanh toán chưa khởi tạo được giao dịch: {orderCreated.paymentError}</p>
          <Button variant="primary" onClick={retryPayment}>Thử thanh toán lại</Button>
        </div>}
      </div>}
      <div className="text-end">
        <Link className="btn btn-warning text-white" to="/home">Quay lại trang chủ</Link>
      </div>

      {/* Modal for customer info */}
      <Modal show={showModal} onHide={handleModalClose}>
        <Modal.Header closeButton>
          <Modal.Title>Thông tin khách hàng</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3" as="fieldset">
            <Form.Label as="legend">Phương thức thanh toán</Form.Label>
            {paymentOptionsLoading && <p role="status">Đang tải phương thức thanh toán...</p>}
            {paymentOptionsError && <p className="text-danger" role="alert">{paymentOptionsError}</p>}
            {paymentOptions?.methods?.map((method) => <Form.Check
              key={method.code}
              type="radio"
              name="paymentMethod"
              id={`payment-${method.code}`}
              label={<span>{method.name}<small className="payment-method-description">{method.enabled ? method.description : method.disabledReason}</small></span>}
              value={method.code}
              checked={paymentMethod === method.code}
              disabled={!method.enabled || submittingOrder}
              onChange={() => setPaymentMethod(method.code)}
            />)}
          </Form.Group>
          <Form>
            <Form.Group className="mb-3" controlId="formName">
              <Form.Label>Họ tên</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={customerInfo.name}
                onChange={handleInputChange}
                placeholder="Nhập họ tên"
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formAddress">
              <Form.Label>Địa chỉ</Form.Label>
              <Form.Control
                type="text"
                name="address"
                value={customerInfo.address}
                onChange={handleInputChange}
                placeholder="Nhập địa chỉ"
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formPhone">
              <Form.Label>Số điện thoại</Form.Label>
              <Form.Control
                type="text"
                name="phone"
                value={customerInfo.phone}
                onChange={handleInputChange}
                placeholder="Nhập số điện thoại"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleModalClose} disabled={submittingOrder}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleModalSave} disabled={submittingOrder || paymentOptionsLoading || !paymentOptions || !paymentOptions.methods?.some((method) => method.code === paymentMethod && method.enabled)}>
            {submittingOrder ? 'Đang xử lý...' : 'Xác nhận'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Cart;

function getItemKey(item) {
  return `${item.id}-${item.color || 'default'}`;
}
