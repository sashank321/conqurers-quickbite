const API_BASE_URL = (import.meta.env['VITE_API_BASE_URL'] as string) || 'https://conqurers-quickbite.onrender.com/api';

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  available: boolean;
  stock: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  itemTotal: number;
}

export interface CartData {
  _id: string;
  user: string;
  items: CartItem[];
  totalAmount: number;
}

export interface OrderItem {
  product: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface OrderData {
  _id: string;
  orderNumber: string;
  user: string | { _id: string; name: string; email: string };
  items: OrderItem[];
  totalAmount: number;
  status: 'PLACED' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
  paymentMethod: 'CASH' | 'UPI' | 'CARD';
  createdAt: string;
  updatedAt?: string;
}

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  token: string;
}

export interface AdminAnalytics {
  totalOrders: number;
  totalRevenue: number;
  ordersToday: number;
  revenueToday: number;
  ordersByStatus: Record<string, number>;
  topProducts: { name: string; totalSold: number; revenue: number }[];
  recentOrders: OrderData[];
}

// Token storage helpers
export const getStoredToken = () => localStorage.getItem('quickbite_token');
export const setStoredToken = (token: string) => localStorage.setItem('quickbite_token', token);
export const removeStoredToken = () => localStorage.removeItem('quickbite_token');

export const getStoredUser = (): AuthUser | null => {
  try {
    const user = localStorage.getItem('quickbite_user');
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

export const setStoredUser = (user: AuthUser) => {
  localStorage.setItem('quickbite_user', JSON.stringify(user));
  setStoredToken(user.token);
};

export const removeStoredUser = () => {
  localStorage.removeItem('quickbite_user');
  removeStoredToken();
};

// Generic API fetcher
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>)
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json();

  if (!response.ok || data.success === false) {
    throw new Error(data.message || `API request failed (${response.status})`);
  }

  return data.data !== undefined ? data.data : data;
}

// API Functions
export const api = {
  // Health
  checkHealth: async () => {
    return apiRequest<{ success: boolean; message: string; database: string }>('/health');
  },

  // Auth
  register: async (name: string, email: string, password: string): Promise<AuthUser> => {
    const data = await apiRequest<AuthUser>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    });
    setStoredUser(data);
    return data;
  },

  login: async (email: string, password: string): Promise<AuthUser> => {
    const data = await apiRequest<AuthUser>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    setStoredUser(data);
    return data;
  },

  getMe: async (): Promise<AuthUser> => {
    return apiRequest<AuthUser>('/auth/me');
  },

  logout: () => {
    removeStoredUser();
  },

  // Products
  getProducts: async (category?: string, search?: string): Promise<Product[]> => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (search) params.append('search', search);
    const queryStr = params.toString() ? `?${params.toString()}` : '';
    return apiRequest<Product[]>(`/products${queryStr}`);
  },

  getProductById: async (id: string): Promise<Product> => {
    return apiRequest<Product>(`/products/${id}`);
  },

  // Admin: Product CRUD
  createProduct: async (product: Partial<Product>): Promise<Product> => {
    return apiRequest<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(product)
    });
  },

  updateProduct: async (id: string, product: Partial<Product>): Promise<Product> => {
    return apiRequest<Product>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product)
    });
  },

  deleteProduct: async (id: string): Promise<void> => {
    return apiRequest<void>(`/products/${id}`, {
      method: 'DELETE'
    });
  },

  // Cart
  getCart: async (): Promise<CartData> => {
    return apiRequest<CartData>('/cart');
  },

  addToCart: async (productId: string, quantity: number = 1): Promise<CartData> => {
    return apiRequest<CartData>('/cart/items', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity })
    });
  },

  updateCartQuantity: async (productId: string, quantity: number): Promise<CartData> => {
    return apiRequest<CartData>(`/cart/items/${productId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity })
    });
  },

  removeCartItem: async (productId: string): Promise<CartData> => {
    return apiRequest<CartData>(`/cart/items/${productId}`, {
      method: 'DELETE'
    });
  },

  clearCart: async (): Promise<CartData> => {
    return apiRequest<CartData>('/cart', {
      method: 'DELETE'
    });
  },

  // Orders (student)
  createOrder: async (paymentMethod: 'CASH' | 'UPI' | 'CARD'): Promise<OrderData> => {
    return apiRequest<OrderData>('/orders', {
      method: 'POST',
      body: JSON.stringify({ paymentMethod })
    });
  },

  getMyOrders: async (): Promise<OrderData[]> => {
    return apiRequest<OrderData[]>('/orders');
  },

  // Orders (admin)
  getAllOrders: async (status?: string): Promise<OrderData[]> => {
    const params = status ? `?status=${status}` : '';
    return apiRequest<OrderData[]>(`/admin/orders${params}`);
  },

  updateOrderStatus: async (orderId: string, status: string): Promise<OrderData> => {
    return apiRequest<OrderData>(`/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  },

  // Analytics (admin)
  getAnalytics: async (): Promise<AdminAnalytics> => {
    return apiRequest<AdminAnalytics>('/admin/analytics');
  }
};
