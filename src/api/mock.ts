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

const activeStatuses = ['PENDING', 'CONFIRMED', 'PICKED_UP', 'ON_DELIVERY', 'DELIVERED'];

const requireRole = (user: any, roles: string[]) => {
  if (!roles.includes(user.role)) {
    throw new Error('Forbidden');
  }
};

const getOrderPricing = (order: any) => {
  const distance = Number(order.distance ?? 5.2);
  const itemWeight = Number(order.itemWeight ?? 1);
  const basePrice = Number(order.basePrice ?? 15000);
  const distancePrice = Number(order.distancePrice ?? distance * 2000);
  const weightPrice = Number(order.weightPrice ?? itemWeight * 1000);
  const totalPrice = Number(order.totalPrice ?? basePrice + distancePrice + weightPrice);

  return { distance, basePrice, distancePrice, weightPrice, totalPrice };
};

const hydrateOrder = (order: any, users: any[]) => {
  const pricing = getOrderPricing(order);

  return {
    ...order,
    ...pricing,
    sender: users.find((u: any) => u.id === order.senderId) || null,
    courier: users.find((u: any) => u.id === order.courierId) || null,
    statusLogs: order.statusLogs || [{ id: `${order.id}-created`, status: 'PENDING', createdAt: order.createdAt, note: 'Order created' }],
  };
};

const withRelations = (orders: any[]) => {
  const users = getUsers();
  return orders.map((order: any) => hydrateOrder(order, users));
};

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
    return getOrderPricing({ itemWeight: weight });
  }

  if (endpoint === '/orders' && method === 'POST') {
    const createdAt = new Date().toISOString();
    const pricing = getOrderPricing(data);
    const newOrder = {
      ...data,
      ...pricing,
      id: generateId(),
      orderCode: generateOrderCode(),
      senderId: currentUser.id,
      status: 'PENDING',
      paymentMethod: data.paymentMethod || 'COD',
      paymentStatus: data.paymentMethod === 'TRANSFER' ? 'UNPAID' : 'PAID',
      createdAt,
      statusLogs: [{ id: `${generateId()}-log`, status: 'PENDING', createdAt, note: 'Order created' }],
    };
    saveOrders([...getOrders(), newOrder]);
    return hydrateOrder(newOrder, getUsers());
  }

  if (endpoint === '/orders/my' && method === 'GET') {
    return withRelations(
      getOrders()
        .filter((o: any) => o.senderId === currentUser.id)
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    );
  }

  const orderMatch = endpoint.match(/^\/orders\/([a-zA-Z0-9]+)(\/(pay|complete|cancel))?$/);
  if (orderMatch && endpoint.startsWith('/orders/') && !endpoint.startsWith('/orders/estimate') && !endpoint.startsWith('/orders/my')) {
    const id = orderMatch[1];
    const action = orderMatch[3];
    const orders = getOrders();
    const orderIndex = orders.findIndex((o: any) => o.id === id);
    if (orderIndex === -1) throw new Error('Order not found');

    if (method === 'GET') {
      requireRole(currentUser, ['SENDER', 'COURIER', 'ADMIN']);
      const order = orders[orderIndex];
      const canRead =
        currentUser.role === 'ADMIN' ||
        order.senderId === currentUser.id ||
        (currentUser.role === 'COURIER' && (order.status === 'PENDING' || order.courierId === currentUser.id));

      if (!canRead) throw new Error('Forbidden');
      return hydrateOrder(order, getUsers());
    }

    requireRole(currentUser, ['SENDER', 'ADMIN']);
    if (currentUser.role !== 'ADMIN' && orders[orderIndex].senderId !== currentUser.id) {
      throw new Error('Forbidden');
    }

    if (method === 'PATCH' && action === 'pay') {
      const now = new Date().toISOString();
      orders[orderIndex].paymentStatus = 'PAID';
      orders[orderIndex].paymentMethod = data?.paymentMethod || orders[orderIndex].paymentMethod || 'TRANSFER';
      orders[orderIndex].statusLogs = [
        ...(orders[orderIndex].statusLogs || []),
        { id: `${generateId()}-log`, status: orders[orderIndex].status, createdAt: now, note: 'Payment confirmed' }
      ];
      saveOrders(orders);
      return hydrateOrder(orders[orderIndex], getUsers());
    }
    if (method === 'PATCH' && action === 'complete') {
      const now = new Date().toISOString();
      orders[orderIndex].status = 'COMPLETED';
      orders[orderIndex].statusLogs = [
        ...(orders[orderIndex].statusLogs || []),
        { id: `${generateId()}-log`, status: 'COMPLETED', createdAt: now, note: 'Order confirmed by sender' }
      ];
      saveOrders(orders);
      return hydrateOrder(orders[orderIndex], getUsers());
    }
    if (method === 'POST' && action === 'cancel') {
      const now = new Date().toISOString();
      orders[orderIndex].status = 'CANCELLED';
      orders[orderIndex].cancelReason = data?.cancelReason || 'Cancelled by user';
      orders[orderIndex].statusLogs = [
        ...(orders[orderIndex].statusLogs || []),
        { id: `${generateId()}-log`, status: 'CANCELLED', createdAt: now, note: orders[orderIndex].cancelReason }
      ];
      saveOrders(orders);
      return hydrateOrder(orders[orderIndex], getUsers());
    }
  }

  // --- COURIER ---
  if (endpoint === '/courier/orders/available' && method === 'GET') {
    requireRole(currentUser, ['COURIER', 'ADMIN']);
    return withRelations(getOrders().filter((o: any) => o.status === 'PENDING' && (o.paymentStatus === 'PAID' || o.paymentMethod === 'COD')));
  }

  if (endpoint === '/courier/orders/my' && method === 'GET') {
    requireRole(currentUser, ['COURIER', 'ADMIN']);
    return withRelations(
      getOrders().filter((o: any) => o.courierId === currentUser.id).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    );
  }
  
  if (endpoint === '/courier/earnings' && method === 'GET') {
    requireRole(currentUser, ['COURIER', 'ADMIN']);
    const myOrders = getOrders().filter((o: any) => o.courierId === currentUser.id && o.status === 'COMPLETED');
    const earnings = myOrders.reduce((sum: number, o: any) => sum + (getOrderPricing(o).totalPrice * 0.8), 0);
    return { totalOrders: myOrders.length, earnings };
  }

  const courierOrderMatch = endpoint.match(/^\/courier\/orders\/([a-zA-Z0-9]+)(\/(accept|status|proof))?$/);
  if (courierOrderMatch) {
    requireRole(currentUser, ['COURIER', 'ADMIN']);
    const id = courierOrderMatch[1];
    const action = courierOrderMatch[3];
    const orders = getOrders();
    const orderIndex = orders.findIndex((o: any) => o.id === id);
    if (orderIndex === -1) throw new Error('Order not found');

    if (method === 'PATCH' && action === 'accept') {
      const now = new Date().toISOString();
      orders[orderIndex].status = 'CONFIRMED';
      orders[orderIndex].courierId = currentUser.id;
      orders[orderIndex].statusLogs = [
        ...(orders[orderIndex].statusLogs || []),
        { id: `${generateId()}-log`, status: 'CONFIRMED', createdAt: now, note: 'Courier accepted the job' }
      ];
      saveOrders(orders);
      return hydrateOrder(orders[orderIndex], getUsers());
    }
    if (method === 'PATCH' && action === 'status') {
      if (currentUser.role !== 'ADMIN' && orders[orderIndex].courierId !== currentUser.id) throw new Error('Forbidden');
      const now = new Date().toISOString();
      orders[orderIndex].status = data.status;
      orders[orderIndex].statusLogs = [
        ...(orders[orderIndex].statusLogs || []),
        { id: `${generateId()}-log`, status: data.status, createdAt: now, note: data.note || 'Status updated by courier' }
      ];
      saveOrders(orders);
      return hydrateOrder(orders[orderIndex], getUsers());
    }
    if (method === 'POST' && action === 'proof') {
      if (currentUser.role !== 'ADMIN' && orders[orderIndex].courierId !== currentUser.id) throw new Error('Forbidden');
      const now = new Date().toISOString();
      orders[orderIndex].proofPhotoUrl = 'https://placehold.co/600x400/png?text=Proof+Of+Delivery';
      orders[orderIndex].status = 'DELIVERED';
      orders[orderIndex].statusLogs = [
        ...(orders[orderIndex].statusLogs || []),
        { id: `${generateId()}-log`, status: 'DELIVERED', createdAt: now, note: 'Proof of delivery uploaded' }
      ];
      saveOrders(orders);
      return hydrateOrder(orders[orderIndex], getUsers());
    }
  }

  // --- ADMIN ---
  if (endpoint === '/admin/dashboard' && method === 'GET') {
    requireRole(currentUser, ['ADMIN']);
    const orders = getOrders();
    const activeOrders = orders.filter((o: any) => activeStatuses.includes(o.status)).length;
    const completedOrders = orders.filter((o: any) => o.status === 'COMPLETED').length;
    const totalOrdersToday = orders.filter((o: any) => new Date(o.createdAt).toDateString() === new Date().toDateString()).length;
    const revenue = orders.filter((o: any) => o.paymentStatus === 'PAID').reduce((sum: number, o: any) => sum + getOrderPricing(o).totalPrice, 0);
    const activeCouriers = getUsers().filter((u: any) => u.role === 'COURIER' && u.isActive).length;
    return { totalOrdersToday, activeOrders, completedOrders, revenue, activeCouriers, recentOrders: withRelations(orders.slice(-5)) };
  }

  if (endpoint === '/admin/orders' && method === 'GET') {
    requireRole(currentUser, ['ADMIN']);
    return withRelations(getOrders().sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  }

  if (endpoint === '/admin/couriers' && method === 'GET') {
    requireRole(currentUser, ['ADMIN']);
    return getUsers().filter((u: any) => u.role === 'COURIER');
  }

  const adminAssignMatch = endpoint.match(/^\/admin\/orders\/([a-zA-Z0-9]+)\/assign$/);
  if (adminAssignMatch && method === 'PATCH') {
    requireRole(currentUser, ['ADMIN']);
    const id = adminAssignMatch[1];
    const orders = getOrders();
    const orderIndex = orders.findIndex((o: any) => o.id === id);
    if (orderIndex > -1) {
      const now = new Date().toISOString();
      orders[orderIndex].courierId = data.courierId;
      orders[orderIndex].status = 'CONFIRMED';
      orders[orderIndex].statusLogs = [
        ...(orders[orderIndex].statusLogs || []),
        { id: `${generateId()}-log`, status: 'CONFIRMED', createdAt: now, note: 'Assigned by admin' }
      ];
      saveOrders(orders);
      return hydrateOrder(orders[orderIndex], getUsers());
    }
  }

  const adminCourierMatch = endpoint.match(/^\/admin\/couriers\/([a-zA-Z0-9]+)$/);
  if (adminCourierMatch && method === 'PATCH') {
    requireRole(currentUser, ['ADMIN']);
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
