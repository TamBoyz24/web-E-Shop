// Tạo container sản phẩm
const productContainer = document.createElement('div');
productContainer.style.maxWidth = '600px';
productContainer.style.margin = '20px auto';
productContainer.style.fontFamily = 'Arial, sans-serif';

// Danh sách sản phẩm mẫu
const products = [
  
];

// Hàm xử lý thêm sản phẩm vào giỏ hàng
const AddToCart = (productName, productPrice) => {
  alert(`Đã thêm vào giỏ hàng: ${productName} - ${productPrice.toLocaleString()}₫`);
};

// Kiểm tra nếu không có sản phẩm
if (products.length === 0) {
  const emptyMessage = document.createElement('p');
  emptyMessage.textContent = 'Không có sản phẩm nào để hiển thị.';
  emptyMessage.style.textAlign = 'center';
  emptyMessage.style.fontSize = '18px';
  emptyMessage.style.color = '#888';
  productContainer.appendChild(emptyMessage);
} else {
  // Hiển thị danh sách sản phẩm
  products.forEach((product) => {
    const productDiv = document.createElement('div');
    productDiv.style.display = 'flex';
    productDiv.style.justifyContent = 'space-between';
    productDiv.style.alignItems = 'center';
    productDiv.style.border = '1px solid #ccc';
    productDiv.style.padding = '10px';
    productDiv.style.marginBottom = '10px';
    productDiv.style.borderRadius = '5px';

    const nameSpan = document.createElement('span');
    nameSpan.textContent = product.name;

    const priceSpan = document.createElement('span');
    priceSpan.textContent = `${product.price.toLocaleString()}₫`;

    const addButton = document.createElement('button');
    addButton.textContent = 'Thêm vào giỏ';
    addButton.style.backgroundColor = '#28a745';
    addButton.style.color = 'white';
    addButton.style.border = 'none';
    addButton.style.padding = '5px 10px';
    addButton.style.cursor = 'pointer';
    addButton.style.borderRadius = '3px';

    addButton.addEventListener('click', () => AddToCart(product.name, product.price));

    addButton.onmouseover = () => (addButton.style.backgroundColor = '#218838');
    addButton.onmouseout = () => (addButton.style.backgroundColor = '#28a745');

    productDiv.appendChild(nameSpan);
    productDiv.appendChild(priceSpan);
    productDiv.appendChild(addButton);

    productContainer.appendChild(productDiv);
  });
}

// Thêm container vào body
document.body.appendChild(productContainer);
