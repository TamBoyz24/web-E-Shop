import React, { useEffect, useState } from 'react';
import './Cart.css'; // Đảm bảo bạn có tệp CSS hoặc đổi đường dẫn phù hợp
import { Modal, Button, Form } from 'react-bootstrap'; // Import các component cần thiết từ react-bootstrap
import { addCartItem, createOrder, getCart, getUser, saveCart } from '../lib/store';
import { Link } from 'react-router-dom';
import Toast from './Toast';

const Cart = () => {
  const [cartItems, setCartItems] = useState(getCart);
  const [totalQuantity, setTotalQuantity] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({ name: '', address: '', phone: '' });
  const [orderCreated, setOrderCreated] = useState(null);
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
    const refreshCart = () => {
      const nextCart = getCart();
      setCartItems(nextCart);
      setSelectedKeys((current) => current.filter((key) => nextCart.some((item) => getItemKey(item) === key)));
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
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
  };

  const handleModalSave = () => {
    if (!customerInfo.name.trim() || !customerInfo.address.trim() || !/^0\d{9,10}$/.test(customerInfo.phone)) {
      setToast({ message: 'Vui lòng nhập họ tên, địa chỉ và số điện thoại hợp lệ', type: 'error' });
      return;
    }
    const order = createOrder(selectedItems, customerInfo, getUser());
    const remainingItems = cartItems.filter((item) => !selectedKeys.includes(getItemKey(item)));
    saveCart(remainingItems);
    setCartItems(remainingItems);
    setOrderCreated(order);
    setToast({ message: `Đã tiếp nhận đơn ${order.id}`, type: 'success' });
    setShowModal(false);
    setSelectedKeys([]);
    setCustomerInfo({ name: '', address: '', phone: '' });
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
        <button className="btn btn-success" onClick={handlePurchase}>
          Mua hàng
        </button>
      </div>
      {orderCreated && <div className="alert alert-info mt-3">
        Đơn <strong>{orderCreated.id}</strong> đã được tạo thành công. Sản phẩm đã mua được chuyển khỏi giỏ hàng.
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
          <Button variant="secondary" onClick={handleModalClose}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleModalSave}>
            Xác nhận
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
