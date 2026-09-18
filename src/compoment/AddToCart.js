// Hàm lấy giỏ hàng từ localStorage
function getCart() {
  const storedCart = localStorage.getItem('cart');
  console.log("Giỏ hàng từ localStorage: ", storedCart);  // Kiểm tra giỏ hàng trước khi trả về
  return storedCart ? JSON.parse(storedCart) : [];
}

// Hàm lưu giỏ hàng vào localStorage
function saveCart(cartData) {
  console.log("Lưu giỏ hàng: ", cartData);  // Kiểm tra dữ liệu sẽ được lưu
  localStorage.setItem('cart', JSON.stringify(cartData));
}

// Hàm thêm sản phẩm vào giỏ hàng
function addToCart(productName, productPrice) {
  const cartData = getCart();
  console.log("Giỏ hàng hiện tại: ", cartData);  // Kiểm tra giỏ hàng trước khi cập nhật

  // Kiểm tra nếu sản phẩm đã có trong giỏ hàng
  const existingProductIndex = cartData.findIndex(item => item.name === productName);
  
  if (existingProductIndex > -1) {
    // Nếu sản phẩm đã có, tăng số lượng lên
    cartData[existingProductIndex].quantity += 1;
    console.log("Cập nhật số lượng sản phẩm: ", cartData[existingProductIndex]);
  } else {
    // Nếu sản phẩm chưa có, thêm sản phẩm mới vào giỏ hàng
    cartData.push({ name: productName, price: productPrice, quantity: 1 });
    console.log("Thêm sản phẩm mới vào giỏ hàng: ", cartData[cartData.length - 1]);
  }

  // Lưu giỏ hàng đã cập nhật vào localStorage
  saveCart(cartData);
}


