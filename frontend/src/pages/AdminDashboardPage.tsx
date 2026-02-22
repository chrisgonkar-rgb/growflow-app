// Growflow - Admin Dashboard
// © TrueNorth Group of Companies Ltd.

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  Upload, 
  BarChart3,
  LogOut,
  ArrowRight,
  UserCheck,
  ClipboardList
} from 'lucide-react';
import DB from '@/db';
import type { DashboardMetrics } from '@/types';

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { logoutStaff, user } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    total_active_customers: 0,
    total_paid_this_month: 0,
    pending_payments: 0,
    revenue_usd: 0,
    revenue_lrd: 0,
  });

  useEffect(() => {
    calculateMetrics();
  }, []);

  const calculateMetrics = () => {
    const customers = DB.Customer.getAll();
    const payments = DB.Payment.getAll();
    
    const activeCustomers = customers.filter(c => 
      c.status === 'active_paid' || c.status === 'active_payment_required'
    );
    
    const pendingPayments = payments.filter(p => p.status === 'pending');
    
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    
    const paidThisMonth = payments.filter(p => 
      p.status === 'approved' && 
      new Date(p.submitted_at) >= thisMonth
    );
    
    const revenueUSD = paidThisMonth
      .filter(p => p.paid_currency === 'USD')
      .reduce((sum, p) => sum + p.paid_amount, 0);
    
    const revenueLRD = paidThisMonth
      .filter(p => p.paid_currency === 'LRD')
      .reduce((sum, p) => sum + p.paid_amount, 0);

    setMetrics({
      total_active_customers: activeCustomers.length,
      total_paid_this_month: paidThisMonth.length,
      pending_payments: pendingPayments.length,
      revenue_usd: revenueUSD,
      revenue_lrd: revenueLRD,
    });
  };

  const handleLogout = () => {
    logoutStaff();
    navigate('/admin');
  };

  const menuItems: { title: string; description: string; icon: typeof Users; path: string; color: string; badge?: number }[] = [
    {
      title: 'Pending Quotes',
      description: 'Review and set prices for new signups',
      icon: ClipboardList,
      path: '/admin/quotes',
      color: 'bg-yellow-100 text-yellow-800',
      badge: metrics.pending_payments,
    },
    {
      title: 'Payment Verification',
      description: 'Verify and approve customer payments',
      icon: DollarSign,
      path: '/admin/payments',
      color: 'bg-blue-100 text-blue-800',
      badge: metrics.pending_payments,
    },
    {
      title: 'Customer Directory',
      description: 'Search and manage all customers',
      icon: Users,
      path: '/admin/customers',
      color: 'bg-green-100 text-green-800',
    },
    {
      title: 'Bulk Import',
      description: 'Import customers from CSV/Excel',
      icon: Upload,
      path: '/admin/import',
      color: 'bg-purple-100 text-purple-800',
    },
    {
      title: 'Reports',
      description: 'View revenue and subscription reports',
      icon: BarChart3,
      path: '/admin/reports',
      color: 'bg-indigo-100 text-indigo-800',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm py-4 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center mr-3">
              <UserCheck className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-xs text-gray-500">Welcome, {user?.name}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleLogout}
            className="text-gray-500"
          >
            <LogOut className="h-4 w-4 mr-1" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 py-6">
        <div className="max-w-6xl mx-auto">
          {/* Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Active Customers</p>
                    <p className="text-2xl font-bold">{metrics.total_active_customers}</p>
                  </div>
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Paid This Month</p>
                    <p className="text-2xl font-bold">{metrics.total_paid_this_month}</p>
                  </div>
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Pending Payments</p>
                    <p className="text-2xl font-bold">{metrics.pending_payments}</p>
                  </div>
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Clock className="h-5 w-5 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Revenue (USD)</p>
                    <p className="text-2xl font-bold">${metrics.revenue_usd.toFixed(0)}</p>
                  </div>
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Menu Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {menuItems.map((item) => (
              <Card 
                key={item.path}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(item.path)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center mr-4 ${item.color}`}>
                        <item.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{item.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      {item.badge && item.badge > 0 && (
                        <Badge className="mr-2 bg-red-100 text-red-800">
                          {item.badge}
                        </Badge>
                      )}
                      <ArrowRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white py-4 px-4 text-center">
        <p className="text-xs text-gray-500">
          © TrueNorth Group of Companies Ltd. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
