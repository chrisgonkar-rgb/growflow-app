// Growflow - Reports Page
// © TrueNorth Group of Companies Ltd.

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Download, 
  Users, 
  DollarSign, 
  TrendingUp,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';
import DB from '@/db';
import type { Customer, Payment } from '@/types';

interface MonthlyRevenue {
  month: string;
  usd: number;
  lrd: number;
  count: number;
}

export default function ReportsPage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenue[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const allCustomers = DB.Customer.getAll();
    const allPayments = DB.Payment.getAll();
    
    setCustomers(allCustomers);
    setPayments(allPayments);
    
    // Calculate monthly revenue
    const revenueMap = new Map<string, MonthlyRevenue>();
    
    allPayments
      .filter(p => p.status === 'approved')
      .forEach(payment => {
        const date = new Date(payment.submitted_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthLabel = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        
        const existing = revenueMap.get(monthKey);
        if (existing) {
          if (payment.paid_currency === 'USD') {
            existing.usd += payment.paid_amount;
          } else {
            existing.lrd += payment.paid_amount;
          }
          existing.count += 1;
        } else {
          revenueMap.set(monthKey, {
            month: monthLabel,
            usd: payment.paid_currency === 'USD' ? payment.paid_amount : 0,
            lrd: payment.paid_currency === 'LRD' ? payment.paid_amount : 0,
            count: 1,
          });
        }
      });
    
    const sortedRevenue = Array.from(revenueMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([, value]) => value);
    
    setMonthlyRevenue(sortedRevenue);
  };

  const exportToCSV = () => {
    const headers = [
      'ID',
      'Full Name',
      'Phone',
      'City',
      'Community',
      'Waste Type',
      'Frequency',
      'Status',
      'Created Date',
      'USD Amount',
      'LRD Amount',
    ];

    const rows = customers.map(customer => {
      const subscription = DB.Subscription.getByCustomerId(customer.id);
      return [
        customer.id,
        customer.full_name,
        customer.phone,
        customer.city,
        customer.community,
        customer.waste_type,
        customer.frequency,
        customer.status,
        customer.created_at,
        subscription?.agreed_amount_usd || '',
        subscription?.agreed_amount_lrd || '',
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `growflow_customers_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Customer data exported successfully');
  };

  const exportPaymentsToCSV = () => {
    const headers = [
      'Payment ID',
      'Customer Name',
      'Phone',
      'Currency',
      'Amount',
      'Method',
      'Reference',
      'Status',
      'Submitted Date',
      'Verified Date',
      'Verified By',
    ];

    const rows = payments.map(payment => {
      const customer = DB.Customer.getById(payment.customer_id);
      const verifier = payment.verified_by ? DB.User.getById(payment.verified_by) : null;
      return [
        payment.id,
        customer?.full_name || 'Unknown',
        customer?.phone || '',
        payment.paid_currency,
        payment.paid_amount,
        payment.method,
        payment.reference || '',
        payment.status,
        payment.submitted_at,
        payment.verified_at || '',
        verifier?.name || '',
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `growflow_payments_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Payment data exported successfully');
  };

  // Calculate stats
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(c => c.status === 'active_paid' || c.status === 'active_payment_required').length;
  const pendingQuotes = customers.filter(c => c.status === 'pending_quote').length;
  
  const totalRevenueUSD = payments
    .filter(p => p.status === 'approved' && p.paid_currency === 'USD')
    .reduce((sum, p) => sum + p.paid_amount, 0);
  
  const totalRevenueLRD = payments
    .filter(p => p.status === 'approved' && p.paid_currency === 'LRD')
    .reduce((sum, p) => sum + p.paid_amount, 0);

  const pendingPayments = payments.filter(p => p.status === 'pending').length;
  const approvedPayments = payments.filter(p => p.status === 'approved').length;
  const rejectedPayments = payments.filter(p => p.status === 'rejected').length;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm py-4 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/admin')}
              className="mr-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Reports</h1>
              <p className="text-xs text-gray-500">View revenue and subscription reports</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 py-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Customers</p>
                    <p className="text-2xl font-bold">{totalCustomers}</p>
                  </div>
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Active</p>
                    <p className="text-2xl font-bold">{activeCustomers}</p>
                  </div>
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Pending Quotes</p>
                    <p className="text-2xl font-bold">{pendingQuotes}</p>
                  </div>
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Revenue (USD)</p>
                    <p className="text-2xl font-bold">${totalRevenueUSD.toFixed(0)}</p>
                  </div>
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-700">{pendingPayments}</p>
                  <p className="text-sm text-yellow-600">Pending</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-700">{approvedPayments}</p>
                  <p className="text-sm text-green-600">Approved</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-700">{rejectedPayments}</p>
                  <p className="text-sm text-red-600">Rejected</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Revenue by Currency */}
          <Card>
            <CardHeader>
              <CardTitle>Total Revenue by Currency</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-600 mb-1">USD Revenue</p>
                  <p className="text-3xl font-bold text-green-700">${totalRevenueUSD.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-600 mb-1">LRD Revenue</p>
                  <p className="text-3xl font-bold text-blue-700">LRD {totalRevenueLRD.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Revenue */}
          {monthlyRevenue.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Monthly Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {monthlyRevenue.map((rev, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">{rev.month}</span>
                      <div className="flex gap-4">
                        <span className="text-green-600">${rev.usd.toLocaleString()} USD</span>
                        {rev.lrd > 0 && (
                          <span className="text-blue-600">LRD {rev.lrd.toLocaleString()}</span>
                        )}
                        <Badge variant="outline">{rev.count} payments</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Export Buttons */}
          <Card>
            <CardHeader>
              <CardTitle>Export Data</CardTitle>
              <CardDescription>Download reports as CSV files</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={exportToCSV}
                  variant="outline"
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Customers
                </Button>
                <Button 
                  onClick={exportPaymentsToCSV}
                  variant="outline"
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Payments
                </Button>
              </div>
            </CardContent>
          </Card>
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
