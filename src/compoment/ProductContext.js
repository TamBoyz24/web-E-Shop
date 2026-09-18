import React, { createContext, useReducer } from 'react';

const ProductContext = createContext();

const initialState = {
  products: [
    {
      id: 1,
      imageUrl: '/images/poco-m6_1_.webp',
      productName: 'Xiaomi Redmi 14C 4GB 128GB',
      productPrice: 150,
      description: 'A budget-friendly smartphone with a 4GB RAM and 128GB storage.',
      category: 'Smartphones',
      brand: 'Xiaomi',
      rating: 4.5,
      stock: 30,
    },
    // Thêm các sản phẩm khác tương tự...
  ],
  cart: [],
  total: 0,
  sizeFilter: '',
  successMessage: '',
};

const productReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_TO_CART': {
      const existingProduct = state.cart.find(item => item.id === action.payload.id);
      let updatedCart;
      if (existingProduct) {
        updatedCart = state.cart.map(item =>
          item.id === action.payload.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        updatedCart = [...state.cart, { ...action.payload, quantity: 1 }];
      }
      const updatedTotal = updatedCart.reduce(
        (total, item) => total + item.productPrice * item.quantity,
        0
      );

      return {
        ...state,
        cart: updatedCart,
        total: updatedTotal,
      };
    }
    case 'REMOVE_PRODUCT': {
      const updatedCart = state.cart.filter((item) => item.id !== action.payload.id);
      const updatedTotal = updatedCart.reduce(
        (total, item) => total + item.productPrice * item.quantity,
        0
      );

      return {
        ...state,
        cart: updatedCart,
        total: updatedTotal,
      };
    }
    case 'INCREASE_QUANTITY': {
      const updatedCart = state.cart.map((item) =>
        item.id === action.payload.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
      const updatedTotal = updatedCart.reduce(
        (total, item) => total + item.productPrice * item.quantity,
        0
      );

      return {
        ...state,
        cart: updatedCart,
        total: updatedTotal,
      };
    }
    case 'DECREASE_QUANTITY': {
      const updatedCart = state.cart.map((item) =>
        item.id === action.payload.id && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item
      );
      const updatedTotal = updatedCart.reduce(
        (total, item) => total + item.productPrice * item.quantity,
        0
      );

      return {
        ...state,
        cart: updatedCart,
        total: updatedTotal,
      };
    }
    case 'BUY_PRODUCTS': {
      return {
        ...state,
        cart: [], // Xóa giỏ hàng sau khi mua
        total: 0, // Đặt lại tổng
        successMessage: 'Mua thành công!', // Hiển thị thông báo
      };
    }
    case 'SET_SIZE_FILTER': {
      return { ...state, sizeFilter: action.payload };
    }
    default:
      return state;
  }
};

const ProductProvider = ({ children }) => {
  const [state, dispatch] = useReducer(productReducer, initialState);

  return (
    <ProductContext.Provider value={{ state, dispatch }}>
      {children}
    </ProductContext.Provider>
  );
};

export { ProductContext, ProductProvider };

