// Growflow - Customer Dashboard Page
// © TrueNorth Group of Companies Ltd.

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Phone, 
  MapPin, 
  Trash2, 
  Calendar, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  LogOut,
  History,
  Mail
} from 'lucide-react';
import { toast } from 'sonner';
import DB from '@/db';
import type { Customer, Subscription, Payment, MonthlyPaymentStatus } from '@/types';
import { MONTHS } from '@/types';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending_quote: { 
    label: 'Pending Quote', 
    color: 'bg-yellow-100 text-yellow-800', 
    icon: Clock 
  },
  active_payment_required: { 
    label: 'Payment Required', 
    color: 'bg-red-100 text-red-800', 
    icon: AlertCircle 
  },
  payment_pending_verification: { 
    label: 'Payment Pending Verification', 
    color: 'bg-blue-100 text-blue-800', 
    icon: Clock 
  },
  active_paid: { 
    label: 'Active - Paid', 
    color: 'bg-green-100 text-green-800', 
    icon: CheckCircle 
  },
  suspended: { 
    label: 'Suspended', 
    color: 'bg-gray-100 text-gray-800', 
    icon: AlertCircle 
  },
};

export default function CustomerDashboardPage() {
  const navigate = useNavigate();
  const { customer: authCustomer, logoutCustomer } = useAuth();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [monthlyStatuses, setMonthlyStatuses] = useState<MonthlyPaymentStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authCustomer) {
      navigate('/login');
      return;
    }

    loadCustomerData();
  }, [authCustomer, navigate]);

  const loadCustomerData = () => {
    if (!authCustomer) return;

    const cust = DB.Customer.getById(authCustomer.id);
    if (!cust) {
      toast.error('Customer not found');
      logoutCustomer();
      navigate('/login');
      return;
    }

    setCustomer(cust);
    const sub = DB.Subscription.getByCustomerId(authCustomer.id);
    setSubscription(sub || null);
    const pays = DB.Payment.getByCustomerId(authCustomer.id);
    setPayments(pays);

    // Calculate monthly payment statuses
    const currentYear = new Date().getFullYear();
    const statuses: MonthlyPaymentStatus[] = [];

    for (let month = 1; month <= 12; month++) {
      const payment = pays.find(p => 
        p.payment_month === month && 
        p.payment_year === currentYear
      );

      statuses.push({
        month,
        year: currentYear,
        monthName: MONTHS.find(m => m.value === month)?.label || '',
        status: payment ? 
          (payment.status === 'approved' ? 'paid' : 
           payment.status === 'rejected' ? 'rejected' : 'pending') 
          : 'unpaid',
        payment,
      });
    }

    setMonthlyStatuses(statuses);
    setIsLoading(false);
  };

  const handleLogout = () => {
    logoutCustomer();
    navigate('/');
  };

  const handlePaymentClick = (month: number, year: number) => {
    navigate(`/customer/payment?month=${month}&year=${year}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!customer) return null;

  const statusConfig = STATUS_CONFIG[customer.status];
  const StatusIcon = statusConfig.icon;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm py-4 px-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-green-700">My Account</h1>
            <p className="text-xs text-gray-500">GreenFlow City Services</p>
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
      <main className="flex-1 p-4 py-6 space-y-4">
        {/* Status Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Account Status</p>
                <Badge className={`mt-1 ${statusConfig.color}`}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {statusConfig.label}
                </Badge>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center">
              <User className="h-4 w-4 text-gray-400 mr-3" />
              <span className="text-sm">{customer.full_name}</span>
            </div>
            <div className="flex items-center">
              <Mail className="h-4 w-4 text-gray-400 mr-3" />
              <span className="text-sm">{customer.email}</span>
            </div>
            <div className="flex items-center">
              <Phone className="h-4 w-4 text-gray-400 mr-3" />
              <span className="text-sm">{customer.phone}</span>
            </div>
            <div className="flex items-center">
              <MapPin className="h-4 w-4 text-gray-400 mr-3" />
              <span className="text-sm">{customer.city}, {customer.community}</span>
            </div>
            <div className="flex items-center">
              <MapPin className="h-4 w-4 text-gray-400 mr-3" />
              <span className="text-sm text-gray-500">{customer.landmark}</span>
            </div>
          </CardContent>
        </Card>

        {/* Service Details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Service Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center">
              <Trash2 className="h-4 w-4 text-gray-400 mr-3" />
              <span className="text-sm capitalize">{customer.waste_type.replace('_', ' ')} Waste</span>
            </div>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 text-gray-400 mr-3" />
              <span className="text-sm capitalize">{customer.frequency.replace('_', ' ')} Collection</span>
            </div>
          </CardContent>
        </Card>

        {/* Payment Info */}
        {subscription && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Monthly Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 text-gray-400 mr-3" />
                  <span className="text-sm">Agreed Amount (USD)</span>
                </div>
                <span className="font-semibold">${subscription.agreed_amount_usd.toFixed(2)}</span>
              </div>
              {subscription.agreed_amount_lrd && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 text-gray-400 mr-3" />
                    <span className="text-sm">Agreed Amount (LRD)</span>
                  </div>
                  <span className="font-semibold">LRD {subscription.agreed_amount_lrd.toLocaleString()}</span>
                </div>
              )}
              <div className="flex items-center">
                <Calendar className="h-4 w-4 text-gray-400 mr-3" />
                <span className="text-sm">Started: {new Date(subscription.start_date).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Monthly Payment Status */}
        {subscription && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Payment Status ({new Date().getFullYear()})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {monthlyStatuses.map((status) => (
                  <div 
                    key={status.month}
                    className={`p-3 rounded-lg text-center cursor-pointer transition-colors ${
                      status.status === 'paid' ? 'bg-green-100' :
                      status.status === 'pending' ? 'bg-blue-100' :
                      status.status === 'rejected' ? 'bg-red-100' :
                      'bg-gray-100 hover:bg-gray-200'
                    }`}
                    onClick={() => {
                      if (status.status === 'unpaid' || status.status === 'rejected') {
                        handlePaymentClick(status.month, status.year);
                      }
                    }}
                  >
                    <p className="text-xs text-gray-500">{status.monthName.substring(0, 3)}</p>
                    <div className="mt-1">
                      {status.status === 'paid' && <CheckCircle className="h-5 w-5 mx-auto text-green-600" />}
                      {status.status === 'pending' && <Clock className="h-5 w-5 mx-auto text-blue-600" />}
                      {status.status === 'rejected' && <AlertCircle className="h-5 w-5 mx-auto text-red-600" />}
                      {status.status === 'unpaid' && <span className="text-gray-400 text-lg">-</span>}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-4 mt-4 text-xs">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-100 rounded mr-1"></div>
                  <span>Paid</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-100 rounded mr-1"></div>
                  <span>Pending</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-100 rounded mr-1"></div>
                  <span>Rejected</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-gray-100 rounded mr-1"></div>
                  <span>Unpaid</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment History */}
        {payments.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <History className="h-5 w-5 mr-2" />
                Payment History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {payments.slice().reverse().map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">
                        {MONTHS.find(m => m.value === payment.payment_month)?.label} {payment.payment_year}
                      </p>
                      <p className="text-xs text-gray-500">
                        {payment.paid_currency} {payment.paid_amount.toLocaleString()}
                      </p>
                    </div>
                    <Badge className={
                      payment.status === 'approved' ? 'bg-green-100 text-green-800' :
                      payment.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }>
                      {payment.status === 'approved' ? 'Approved' :
                       payment.status === 'rejected' ? 'Rejected' :
                       'Pending'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
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
