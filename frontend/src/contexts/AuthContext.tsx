// Growflow Authentication Context
// © TrueNorth Group of Companies Ltd.

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, Customer } from '@/types';
import DB, { verifyPassword, hashPassword, generateOTP } from '@/db';

interface AuthContextType {
  // Staff
  user: User | null;
  isStaffAuthenticated: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  loginStaff: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logoutStaff: () => void;
  
  // Customer
  customer: Customer | null;
  isCustomerAuthenticated: boolean;
  loginCustomer: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logoutCustomer: () => void;
  signupCustomer: (data: CustomerSignupData) => Promise<{ success: boolean; error?: string; customer?: Customer }>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; message?: string }>;
  resetPassword: (token: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

export interface CustomerSignupData {
  full_name: string;
  phone: string;
  email: string;
  password: string;
  city: string;
  community: string;
  landmark: string;
  waste_type: string;
  frequency: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize database
    DB.initialize();
    // Check for existing sessions
    const currentUser = DB.Session.getCurrentUser();
    const currentCustomer = DB.Session.getCurrentCustomer();
    setUser(currentUser);
    setCustomer(currentCustomer);
    setIsLoading(false);
  }, []);

  // Staff login
  const loginStaff = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const foundUser = DB.User.getByEmail(email);
    
    if (!foundUser) {
      return { success: false, error: 'Invalid email or password' };
    }
    
    if (!verifyPassword(password, foundUser.password_hash)) {
      return { success: false, error: 'Invalid email or password' };
    }
    
    setUser(foundUser);
    DB.Session.setCurrentUser(foundUser);
    return { success: true };
  };

  const logoutStaff = () => {
    setUser(null);
    DB.Session.logoutUser();
  };

  // Customer login
  const loginCustomer = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const foundCustomer = DB.Customer.getByEmail(email);
    
    if (!foundCustomer) {
      return { success: false, error: 'Invalid email or password' };
    }
    
    if (!verifyPassword(password, foundCustomer.password_hash)) {
      return { success: false, error: 'Invalid email or password' };
    }
    
    setCustomer(foundCustomer);
    DB.Session.setCurrentCustomer(foundCustomer);
    return { success: true };
  };

  const logoutCustomer = () => {
    setCustomer(null);
    DB.Session.logoutCustomer();
  };

  // Customer signup
  const signupCustomer = async (data: CustomerSignupData): Promise<{ success: boolean; error?: string; customer?: Customer }> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Check for duplicate phone
    const existingPhone = DB.Customer.getByPhone(data.phone);
    if (existingPhone) {
      return { success: false, error: 'This phone number is already registered. Please contact support.' };
    }
    
    // Check for duplicate email
    const existingEmail = DB.Customer.getByEmail(data.email);
    if (existingEmail) {
      return { success: false, error: 'This email is already registered. Please log in or use a different email.' };
    }
    
    // Create customer
    const { v4: uuidv4 } = await import('uuid');
    const customer: Customer = {
      id: uuidv4(),
      full_name: data.full_name,
      phone: data.phone,
      email: data.email.toLowerCase(),
      password_hash: hashPassword(data.password),
      city: data.city,
      community: data.community,
      landmark: data.landmark,
      waste_type: data.waste_type as any,
      frequency: data.frequency as any,
      status: 'pending_quote',
      created_at: new Date().toISOString(),
    };

    DB.Customer.create(customer);
    
    // Auto-login after signup
    setCustomer(customer);
    DB.Session.setCurrentCustomer(customer);
    
    return { success: true, customer };
  };

  // Password reset request (OTP-based)
  const requestPasswordReset = async (email: string): Promise<{ success: boolean; message?: string }> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const foundCustomer = DB.Customer.getByEmail(email);
    
    if (!foundCustomer) {
      // Don't reveal if email exists
      return { success: true, message: 'If an account exists with this email, you will receive reset instructions.' };
    }
    
    // Generate OTP
    const otp = generateOTP();
    const expires = new Date();
    expires.setHours(expires.getHours() + 1); // 1 hour expiry
    
    // Save reset token
    DB.Customer.update(foundCustomer.id, {
      reset_token: otp,
      reset_token_expires: expires.toISOString(),
    });
    
    // In production, send email with OTP
    // For demo, we'll just log it
    console.log(`Password reset OTP for ${email}: ${otp}`);
    
    return { success: true, message: 'If an account exists with this email, you will receive reset instructions.' };
  };

  // Reset password with OTP
  const resetPassword = async (token: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const customer = DB.Customer.getByResetToken(token);
    
    if (!customer) {
      return { success: false, error: 'Invalid or expired reset code. Please request a new one.' };
    }
    
    // Update password
    DB.Customer.update(customer.id, {
      password_hash: hashPassword(newPassword),
      reset_token: undefined,
      reset_token_expires: undefined,
    });
    
    return { success: true };
  };

  const value: AuthContextType = {
    // Staff
    user,
    isStaffAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isStaff: user?.role === 'admin' || user?.role === 'staff',
    loginStaff,
    logoutStaff,
    
    // Customer
    customer,
    isCustomerAuthenticated: !!customer,
    loginCustomer,
    logoutCustomer,
    signupCustomer,
    requestPasswordReset,
    resetPassword,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
