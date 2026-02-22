// Growflow Database Layer
// Simulates PostgreSQL with localStorage for demo purposes
// © TrueNorth Group of Companies Ltd.

import type { User, Customer, Subscription, Payment } from '@/types';

const DB_KEYS = {
  users: 'growflow_users',
  customers: 'growflow_customers',
  subscriptions: 'growflow_subscriptions',
  payments: 'growflow_payments',
  currentUser: 'growflow_current_user',
  currentCustomer: 'growflow_current_customer',
};

// Simple hash function for demo (use bcrypt in production)
export function hashPassword(password: string): string {
  // In production, use bcrypt.hash(password, 10)
  return btoa(password + '_growflow_salt');
}

export function verifyPassword(password: string, hash: string): boolean {
  // In production, use bcrypt.compare(password, hash)
  return hashPassword(password) === hash;
}

// Generate OTP for password reset
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Initialize with default admin user
export function initializeDatabase(): void {
  if (!localStorage.getItem(DB_KEYS.users)) {
    const defaultAdmin: User = {
      id: 'admin-001',
      name: 'System Administrator',
      email: 'admin@greenflow.com',
      role: 'admin',
      password_hash: hashPassword('admin123'),
      created_at: new Date().toISOString(),
    };
    localStorage.setItem(DB_KEYS.users, JSON.stringify([defaultAdmin]));
  }
  if (!localStorage.getItem(DB_KEYS.customers)) {
    localStorage.setItem(DB_KEYS.customers, JSON.stringify([]));
  }
  if (!localStorage.getItem(DB_KEYS.subscriptions)) {
    localStorage.setItem(DB_KEYS.subscriptions, JSON.stringify([]));
  }
  if (!localStorage.getItem(DB_KEYS.payments)) {
    localStorage.setItem(DB_KEYS.payments, JSON.stringify([]));
  }
}

// Generic CRUD operations
function getAll<T>(key: string): T[] {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

function saveAll<T>(key: string, items: T[]): void {
  localStorage.setItem(key, JSON.stringify(items));
}

// User operations (Admin/Staff)
export const UserDB = {
  getAll: (): User[] => getAll(DB_KEYS.users),
  
  getById: (id: string): User | undefined => {
    return getAll<User>(DB_KEYS.users).find(u => u.id === id);
  },
  
  getByEmail: (email: string): User | undefined => {
    return getAll<User>(DB_KEYS.users).find(u => u.email.toLowerCase() === email.toLowerCase());
  },
  
  create: (user: User): User => {
    const users = getAll<User>(DB_KEYS.users);
    users.push(user);
    saveAll(DB_KEYS.users, users);
    return user;
  },
  
  update: (id: string, updates: Partial<User>): User | null => {
    const users = getAll<User>(DB_KEYS.users);
    const index = users.findIndex(u => u.id === id);
    if (index === -1) return null;
    users[index] = { ...users[index], ...updates };
    saveAll(DB_KEYS.users, users);
    return users[index];
  },
  
  delete: (id: string): boolean => {
    const users = getAll<User>(DB_KEYS.users);
    const filtered = users.filter(u => u.id !== id);
    if (filtered.length === users.length) return false;
    saveAll(DB_KEYS.users, filtered);
    return true;
  },
};

// Customer operations
export const CustomerDB = {
  getAll: (): Customer[] => getAll(DB_KEYS.customers),
  
  getById: (id: string): Customer | undefined => {
    return getAll<Customer>(DB_KEYS.customers).find(c => c.id === id);
  },
  
  getByPhone: (phone: string): Customer | undefined => {
    return getAll<Customer>(DB_KEYS.customers).find(c => c.phone === phone);
  },
  
  getByEmail: (email: string): Customer | undefined => {
    return getAll<Customer>(DB_KEYS.customers).find(c => 
      c.email.toLowerCase() === email.toLowerCase()
    );
  },
  
  getByResetToken: (token: string): Customer | undefined => {
    return getAll<Customer>(DB_KEYS.customers).find(c => 
      c.reset_token === token && 
      c.reset_token_expires && 
      new Date(c.reset_token_expires) > new Date()
    );
  },
  
  create: (customer: Customer): Customer => {
    const customers = getAll<Customer>(DB_KEYS.customers);
    customers.push(customer);
    saveAll(DB_KEYS.customers, customers);
    return customer;
  },
  
  update: (id: string, updates: Partial<Customer>): Customer | null => {
    const customers = getAll<Customer>(DB_KEYS.customers);
    const index = customers.findIndex(c => c.id === id);
    if (index === -1) return null;
    customers[index] = { ...customers[index], ...updates };
    saveAll(DB_KEYS.customers, customers);
    return customers[index];
  },
  
  delete: (id: string): boolean => {
    const customers = getAll<Customer>(DB_KEYS.customers);
    const filtered = customers.filter(c => c.id !== id);
    if (filtered.length === customers.length) return false;
    saveAll(DB_KEYS.customers, filtered);
    return true;
  },
  
  search: (query: string): Customer[] => {
    const customers = getAll<Customer>(DB_KEYS.customers);
    const lowerQuery = query.toLowerCase();
    return customers.filter(c => 
      c.full_name.toLowerCase().includes(lowerQuery) ||
      c.phone.includes(lowerQuery) ||
      c.email.toLowerCase().includes(lowerQuery) ||
      c.city.toLowerCase().includes(lowerQuery) ||
      c.community.toLowerCase().includes(lowerQuery)
    );
  },
  
  getByStatus: (status: string): Customer[] => {
    return getAll<Customer>(DB_KEYS.customers).filter(c => c.status === status);
  },
};

// Subscription operations
export const SubscriptionDB = {
  getAll: (): Subscription[] => getAll(DB_KEYS.subscriptions),
  
  getById: (id: string): Subscription | undefined => {
    return getAll<Subscription>(DB_KEYS.subscriptions).find(s => s.id === id);
  },
  
  getByCustomerId: (customerId: string): Subscription | undefined => {
    return getAll<Subscription>(DB_KEYS.subscriptions).find(s => s.customer_id === customerId);
  },
  
  create: (subscription: Subscription): Subscription => {
    const subscriptions = getAll<Subscription>(DB_KEYS.subscriptions);
    subscriptions.push(subscription);
    saveAll(DB_KEYS.subscriptions, subscriptions);
    return subscription;
  },
  
  update: (id: string, updates: Partial<Subscription>): Subscription | null => {
    const subscriptions = getAll<Subscription>(DB_KEYS.subscriptions);
    const index = subscriptions.findIndex(s => s.id === id);
    if (index === -1) return null;
    subscriptions[index] = { ...subscriptions[index], ...updates };
    saveAll(DB_KEYS.subscriptions, subscriptions);
    return subscriptions[index];
  },
  
  delete: (id: string): boolean => {
    const subscriptions = getAll<Subscription>(DB_KEYS.subscriptions);
    const filtered = subscriptions.filter(s => s.id !== id);
    if (filtered.length === subscriptions.length) return false;
    saveAll(DB_KEYS.subscriptions, filtered);
    return true;
  },
};

// Payment operations
export const PaymentDB = {
  getAll: (): Payment[] => getAll(DB_KEYS.payments),
  
  getById: (id: string): Payment | undefined => {
    return getAll<Payment>(DB_KEYS.payments).find(p => p.id === id);
  },
  
  getByCustomerId: (customerId: string): Payment[] => {
    return getAll<Payment>(DB_KEYS.payments).filter(p => p.customer_id === customerId);
  },
  
  getBySubscriptionId: (subscriptionId: string): Payment[] => {
    return getAll<Payment>(DB_KEYS.payments).filter(p => p.subscription_id === subscriptionId);
  },
  
  getPending: (): Payment[] => {
    return getAll<Payment>(DB_KEYS.payments).filter(p => p.status === 'pending');
  },
  
  getByMonth: (customerId: string, month: number, year: number): Payment | undefined => {
    return getAll<Payment>(DB_KEYS.payments).find(p => 
      p.customer_id === customerId && 
      p.payment_month === month && 
      p.payment_year === year
    );
  },
  
  // Check if there's an approved payment for a specific month
  hasApprovedPaymentForMonth: (customerId: string, month: number, year: number): boolean => {
    return getAll<Payment>(DB_KEYS.payments).some(p => 
      p.customer_id === customerId && 
      p.payment_month === month && 
      p.payment_year === year &&
      p.status === 'approved'
    );
  },
  
  // Get payment status for a specific month
  getMonthPaymentStatus: (customerId: string, month: number, year: number): Payment | undefined => {
    return getAll<Payment>(DB_KEYS.payments).find(p => 
      p.customer_id === customerId && 
      p.payment_month === month && 
      p.payment_year === year
    );
  },
  
  create: (payment: Payment): Payment => {
    const payments = getAll<Payment>(DB_KEYS.payments);
    payments.push(payment);
    saveAll(DB_KEYS.payments, payments);
    return payment;
  },
  
  update: (id: string, updates: Partial<Payment>): Payment | null => {
    const payments = getAll<Payment>(DB_KEYS.payments);
    const index = payments.findIndex(p => p.id === id);
    if (index === -1) return null;
    payments[index] = { ...payments[index], ...updates };
    saveAll(DB_KEYS.payments, payments);
    return payments[index];
  },
  
  delete: (id: string): boolean => {
    const payments = getAll<Payment>(DB_KEYS.payments);
    const filtered = payments.filter(p => p.id !== id);
    if (filtered.length === payments.length) return false;
    saveAll(DB_KEYS.payments, filtered);
    return true;
  },
};

// Session management
export const Session = {
  getCurrentUser: (): User | null => {
    const data = localStorage.getItem(DB_KEYS.currentUser);
    return data ? JSON.parse(data) : null;
  },
  
  setCurrentUser: (user: User | null): void => {
    if (user) {
      localStorage.setItem(DB_KEYS.currentUser, JSON.stringify(user));
    } else {
      localStorage.removeItem(DB_KEYS.currentUser);
    }
  },
  
  getCurrentCustomer: (): Customer | null => {
    const data = localStorage.getItem(DB_KEYS.currentCustomer);
    return data ? JSON.parse(data) : null;
  },
  
  setCurrentCustomer: (customer: Customer | null): void => {
    if (customer) {
      localStorage.setItem(DB_KEYS.currentCustomer, JSON.stringify(customer));
    } else {
      localStorage.removeItem(DB_KEYS.currentCustomer);
    }
  },
  
  logoutUser: (): void => {
    localStorage.removeItem(DB_KEYS.currentUser);
  },
  
  logoutCustomer: (): void => {
    localStorage.removeItem(DB_KEYS.currentCustomer);
  },
  
  logoutAll: (): void => {
    localStorage.removeItem(DB_KEYS.currentUser);
    localStorage.removeItem(DB_KEYS.currentCustomer);
  },
};

// Export all
export default {
  initialize: initializeDatabase,
  hashPassword,
  verifyPassword,
  generateOTP,
  User: UserDB,
  Customer: CustomerDB,
  Subscription: SubscriptionDB,
  Payment: PaymentDB,
  Session,
};
