// Growflow - Customer Directory Page
// © TrueNorth Group of Companies Ltd.

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  ArrowLeft, 
  Search, 
  User, 
  Phone, 
  MapPin, 
  Trash2, 
  Calendar, 
  DollarSign,
  FileText,
  History,
  Filter
} from 'lucide-react';
import DB from '@/db';
import type { Customer, Subscription, Payment } from '@/types';

interface CustomerWithDetails extends Customer {
  subscription?: Subscription;
  payments?: Payment[];
}

const STATUS_COLORS: Record<string, string> = {
  pending_quote: 'bg-yellow-100 text-yellow-800',
  active_payment_required: 'bg-red-100 text-red-800',
  payment_pending_verification: 'bg-blue-100 text-blue-800',
  active_paid: 'bg-green-100 text-green-800',
  suspended: 'bg-gray-100 text-gray-800',
};

const STATUS_LABELS: Record<string, string> = {
  pending_quote: 'Pending Quote',
  active_payment_required: 'Payment Required',
  payment_pending_verification: 'Pending Verification',
  active_paid: 'Active - Paid',
  suspended: 'Suspended',
};

export default function CustomerDirectoryPage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<CustomerWithDetails[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithDetails | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = () => {
    const allCustomers = DB.Customer.getAll();
    const withDetails = allCustomers.map(customer => ({
      ...customer,
      subscription: DB.Subscription.getByCustomerId(customer.id),
      payments: DB.Payment.getByCustomerId(customer.id),
    }));
    setCustomers(withDetails);
  };

  const handleSearch = () => {
    let filtered = DB.Customer.getAll();
    
    if (searchQuery.trim()) {
      filtered = DB.Customer.search(searchQuery);
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === statusFilter);
    }
    
    const withDetails = filtered.map(customer => ({
      ...customer,
      subscription: DB.Subscription.getByCustomerId(customer.id),
      payments: DB.Payment.getByCustomerId(customer.id),
    }));
    
    setCustomers(withDetails);
  };

  const openDetailDialog = (customer: CustomerWithDetails) => {
    setSelectedCustomer(customer);
    setShowDetailDialog(true);
  };

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
              <h1 className="text-xl font-bold text-gray-900">Customer Directory</h1>
              <p className="text-xs text-gray-500">Search and manage all customers</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 py-6">
        <div className="max-w-6xl mx-auto">
          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-2 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, phone, city, or community..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="pending_quote">Pending Quote</option>
              <option value="active_payment_required">Payment Required</option>
              <option value="payment_pending_verification">Pending Verification</option>
              <option value="active_paid">Active - Paid</option>
              <option value="suspended">Suspended</option>
            </select>
            <Button onClick={handleSearch} variant="outline">
              <Filter className="h-4 w-4 mr-1" />
              Filter
            </Button>
          </div>

          {/* Results Count */}
          <p className="text-sm text-gray-500 mb-4">
            Showing {customers.length} customer{customers.length !== 1 ? 's' : ''}
          </p>

          {/* Customers List */}
          {customers.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No customers found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {customers.map((customer) => (
                <Card 
                  key={customer.id} 
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => openDetailDialog(customer)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{customer.full_name}</h3>
                        <p className="text-sm text-gray-500">{customer.phone}</p>
                      </div>
                      <Badge className={STATUS_COLORS[customer.status]}>
                        {STATUS_LABELS[customer.status]}
                      </Badge>
                    </div>
                    
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                        {customer.city}, {customer.community}
                      </div>
                      <div className="flex items-center">
                        <Trash2 className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="capitalize">{customer.waste_type.replace('_', ' ')}</span>
                      </div>
                      {customer.subscription && (
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 text-gray-400 mr-2" />
                          ${customer.subscription.agreed_amount_usd.toFixed(2)}/month
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white py-4 px-4 text-center">
        <p className="text-xs text-gray-500">
          © TrueNorth Group of Companies Ltd. All rights reserved.
        </p>
      </footer>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
          </DialogHeader>
          
          {selectedCustomer && (
            <div className="space-y-6 mt-4">
              {/* Basic Info */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Personal Information</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex items-center">
                    <User className="h-4 w-4 text-gray-400 mr-2" />
                    {selectedCustomer.full_name}
                  </div>
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 text-gray-400 mr-2" />
                    {selectedCustomer.phone}
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                    {selectedCustomer.city}, {selectedCustomer.community}
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-500">{selectedCustomer.landmark}</span>
                  </div>
                </div>
              </div>

              {/* Service Info */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Service Details</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex items-center">
                    <Trash2 className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="capitalize">{selectedCustomer.waste_type.replace('_', ' ')} Waste</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="capitalize">{selectedCustomer.frequency.replace('_', ' ')} Collection</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                    Registered: {new Date(selectedCustomer.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Subscription Info */}
              {selectedCustomer.subscription && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Subscription</h3>
                  <div className="bg-green-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span>USD Amount:</span>
                      <span className="font-semibold">${selectedCustomer.subscription.agreed_amount_usd.toFixed(2)}</span>
                    </div>
                    {selectedCustomer.subscription.agreed_amount_lrd && (
                      <div className="flex justify-between">
                        <span>LRD Amount:</span>
                        <span className="font-semibold">LRD {selectedCustomer.subscription.agreed_amount_lrd.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Start Date:</span>
                      <span>{new Date(selectedCustomer.subscription.start_date).toLocaleDateString()}</span>
                    </div>
                    {selectedCustomer.subscription.notes && (
                      <div className="text-sm text-gray-600 mt-2">
                        Notes: {selectedCustomer.subscription.notes}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Payment History */}
              {selectedCustomer.payments && selectedCustomer.payments.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <History className="h-4 w-4 mr-1" />
                    Payment History
                  </h3>
                  <div className="space-y-2">
                    {selectedCustomer.payments.slice().reverse().map((payment) => (
                      <div key={payment.id} className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">
                              {payment.paid_currency} {payment.paid_amount.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(payment.submitted_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge className={
                            payment.status === 'approved' ? 'bg-green-100 text-green-800' :
                            payment.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }>
                            {payment.status}
                          </Badge>
                        </div>
                        {payment.rejection_reason && (
                          <p className="text-xs text-red-600 mt-1">
                            Reason: {payment.rejection_reason}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
