const USERS_KEY = 'kurirgo_users';
const ORDERS_KEY = 'kurirgo_orders';

const seedData = () => {
  if (!localStorage.getItem(USERS_KEY)) {
    const users = [
      { id: 'u1', name: 'Sender Demo', email: 'sender1@kurir.com', password: 'sender123', role: 'SENDER', isActive: true },
      { id: 'u2', name: 'Courier Demo', email: 'kurir1@kurir.com', password: 'kurir123', role: 'COURIER', isActive: true, phone: '08123456789' },
      { id: 'u3', name: 'Admin Demo', email: 'admin@kurir.com', password: 'admin123', role: 'ADMIN', isActive: true },
    ];
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }
  if (!localStorage.getItem(ORDERS_KEY)) {
    localStorage.setItem(ORDERS_KEY, JSON.stringify([]));
  }
};

const getUsers = () => JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
const saveUsers = (users: any) => localStorage.setItem(USERS_KEY, JSON.stringify(users));

const getOrders = () => JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
const saveOrders = (orders: any) => localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));

seedData();

const generateId = () => Math.random().toString(36).substr(2, 9);
const generateOrderCode = () => 'ORD-' + Date.now().toString().slice(-6);

export const mockApiClient = async (endpoint: string, options: any = {}) => {
  console.log(`[MOCK API] ${options.method || 'GET'} ${endpoint}`);
  
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

  const token = options.headers?.get('Authorization')?.replace('Bearer ', '');
  const currentUser = token ? getUsers().find((u: any) => u.id === token) : null;
  const method = options.method || 'GET';
  const data = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;

  // --- AUTH ---
  if (endpoint === '/auth/login' && method === 'POST') {
    const user = getUsers().find((u: any) => u.email === data.email && u.password === data.password);
    if (!user) throw new Error('Invalid credentials');
    if (!user.isActive) throw new Error('Account is inactive');
    return { token: user.id, user };
  }
  
  if (endpoint === '/auth/register' && method === 'POST') {
    if (getUsers().some((u: any) => u.email === data.email)) throw new Error('Email already registered');
    const newUser = { id: generateId(), ...data, isActive: true, role: 'SENDER' };
    saveUsers([...getUsers(), newUser]);
    return { token: newUser.id, user: newUser };
  }

  if (!currentUser) throw new Error('Unauthorized');

  // --- SENDER ---
  if (endpoint.startsWith('/orders/estimate') && method === 'GET') {
    // Return dummy estimate
    const urlParams = new URLSearchParams(endpoint.split('?')[1]);
    const weight = parseFloat(urlParams.get('itemWeight') || '1');
    const distance = 5.2;
    const distancePrice = distance * 2000;
    const basePrice = 15000;
    return { distance, distancePrice, basePrice, totalPrice: basePrice + distancePrice + (weight * 1000) };
  }

  if (endpoint === '/orders' && method === 'POST') {
    const newOrder = {
      ...data,
      id: generateId(),
      orderCode: generateOrderCode(),
      senderId: currentUser.id,
      status: 'PENDING',
      paymentStatus: 'UNPAID',
      createdAt: new Date().toISOString()
    };
    saveOrders([...getOrders(), newOrder]);
    return newOrder;
  }

  if (endpoint === '/orders/my' && method === 'GET') {
    return getOrders().filter((o: any) => o.senderId === currentUser.id).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  const orderMatch = endpoint.match(/^\/orders\/([a-zA-Z0-9]+)(\/(pay|complete|cancel))?$/);
  if (orderMatch && endpoint.startsWith('/orders/') && !endpoint.startsWith('/orders/estimate') && !endpoint.startsWith('/orders/my')) {
    const id = orderMatch[1];
    const action = orderMatch[3];
    const orders = getOrders();
    const orderIndex = orders.findIndex((o: any) => o.id === id);
    if (orderIndex === -1) throw new Error('Order not found');

    if (method === 'GET') return orders[orderIndex];
    if (method === 'PATCH' && action === 'pay') {
      orders[orderIndex].paymentStatus = 'PAID';
      orders[orderIndex].paymentMethod = data?.paymentMethod || 'CASH';
      saveOrders(orders);
      return orders[orderIndex];
    }
    if (method === 'PATCH' && action === 'complete') {
      orders[orderIndex].status = 'COMPLETED';
      saveOrders(orders);
      return orders[orderIndex];
    }
    if (method === 'POST' && action === 'cancel') {
      orders[orderIndex].status = 'CANCELLED';
      orders[orderIndex].cancelReason = data?.cancelReason || 'Cancelled by user';
      saveOrders(orders);
      return orders[orderIndex];
    }
  }

  // --- COURIER ---
  if (endpoint === '/courier/orders/available' && method === 'GET') {
    return getOrders().filter((o: any) => o.status === 'PENDING' && o.paymentStatus === 'PAID');
  }

  if (endpoint === '/courier/orders/my' && method === 'GET') {
    return getOrders().filter((o: any) => o.courierId === currentUser.id).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  if (endpoint === '/courier/earnings' && method === 'GET') {
    const myOrders = getOrders().filter((o: any) => o.courierId === currentUser.id && o.status === 'COMPLETED');
    const total = myOrders.reduce((sum: number, o: any) => sum + (o.totalPrice * 0.8), 0);
    return { today: total, thisWeek: total, thisMonth: total, total: total };
  }

  const courierOrderMatch = endpoint.match(/^\/courier\/orders\/([a-zA-Z0-9]+)(\/(accept|status|proof))?$/);
  if (courierOrderMatch) {
    const id = courierOrderMatch[1];
    const action = courierOrderMatch[3];
    const orders = getOrders();
    const orderIndex = orders.findIndex((o: any) => o.id === id);
    if (orderIndex === -1) throw new Error('Order not found');

    if (method === 'PATCH' && action === 'accept') {
      orders[orderIndex].status = 'ACCEPTED';
      orders[orderIndex].courierId = currentUser.id;
      saveOrders(orders);
      return orders[orderIndex];
    }
    if (method === 'PATCH' && action === 'status') {
      orders[orderIndex].status = data.status;
      saveOrders(orders);
      return orders[orderIndex];
    }
    if (method === 'POST' && action === 'proof') {
      // Simulate file upload (FormData)
      orders[orderIndex].proofPhotoUrl = 'https://placehold.co/600x400/png?text=Proof+Of+Delivery';
      saveOrders(orders);
      return orders[orderIndex];
    }
  }

  // --- ADMIN ---
  if (endpoint === '/admin/dashboard' && method === 'GET') {
    const orders = getOrders();
    const activeOrders = orders.filter((o: any) => !['COMPLETED', 'CANCELLED'].includes(o.status)).length;
    const completedOrders = orders.filter((o: any) => o.status === 'COMPLETED').length;
    const revenue = orders.filter((o: any) => o.paymentStatus === 'PAID').reduce((sum: number, o: any) => sum + o.totalPrice, 0);
    const activeCouriers = getUsers().filter((u: any) => u.role === 'COURIER' && u.isActive).length;
    return { activeOrders, completedOrders, revenue, activeCouriers, recentOrders: orders.slice(-5) };
  }

  if (endpoint === '/admin/orders' && method === 'GET') {
    return getOrders().sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  if (endpoint === '/admin/couriers' && method === 'GET') {
    return getUsers().filter((u: any) => u.role === 'COURIER');
  }

  const adminAssignMatch = endpoint.match(/^\/admin\/orders\/([a-zA-Z0-9]+)\/assign$/);
  if (adminAssignMatch && method === 'PATCH') {
    const id = adminAssignMatch[1];
    const orders = getOrders();
    const orderIndex = orders.findIndex((o: any) => o.id === id);
    if (orderIndex > -1) {
      orders[orderIndex].courierId = data.courierId;
      orders[orderIndex].status = 'ACCEPTED';
      saveOrders(orders);
      return orders[orderIndex];
    }
  }

  const adminCourierMatch = endpoint.match(/^\/admin\/couriers\/([a-zA-Z0-9]+)$/);
  if (adminCourierMatch && method === 'PATCH') {
    const id = adminCourierMatch[1];
    const users = getUsers();
    const userIndex = users.findIndex((u: any) => u.id === id);
    if (userIndex > -1) {
      users[userIndex].isActive = data.isActive;
      saveUsers(users);
      return users[userIndex];
    }
  }

  throw new Error(`Endpoint not found: ${method} ${endpoint}`);
};
