// Growflow - Pending Quotes Management
// © TrueNorth Group of Companies Ltd.

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  ArrowLeft, 
  Search, 
  Phone, 
  MapPin, 
  Trash2, 
  Calendar, 
  DollarSign,
  CheckCircle,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import DB from '@/db';
import { useAuth } from '@/contexts/AuthContext';
import type { Customer, Subscription } from '@/types';

export default function PendingQuotesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showQuoteDialog, setShowQuoteDialog] = useState(false);
  
  const [quoteData, setQuoteData] = useState({
    agreed_amount_usd: '',
    agreed_amount_lrd: '',
    start_date: '',
    notes: '',
  });

  useEffect(() => {
    loadPendingQuotes();
  }, []);

  const loadPendingQuotes = () => {
    const pending = DB.Customer.getByStatus('pending_quote');
    setCustomers(pending);
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      loadPendingQuotes();
      return;
    }
    const allPending = DB.Customer.getByStatus('pending_quote');
    const filtered = allPending.filter(c => 
      c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      c.city.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setCustomers(filtered);
  };

  const openQuoteDialog = (customer: Customer) => {
    setSelectedCustomer(customer);
    setQuoteData({
      agreed_amount_usd: '',
      agreed_amount_lrd: '',
      start_date: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setShowQuoteDialog(true);
  };

  const handleSubmitQuote = () => {
    if (!selectedCustomer || !user) return;

    const usdAmount = parseFloat(quoteData.agreed_amount_usd);
    if (isNaN(usdAmount) || usdAmount <= 0) {
      toast.error('Please enter a valid USD amount');
      return;
    }

    // Create subscription
    const subscription: Subscription = {
      id: uuidv4(),
      customer_id: selectedCustomer.id,
      agreed_amount_usd: usdAmount,
      agreed_amount_lrd: quoteData.agreed_amount_lrd ? parseFloat(quoteData.agreed_amount_lrd) : undefined,
      start_date: quoteData.start_date,
      set_by: user.id,
      set_at: new Date().toISOString(),
      notes: quoteData.notes || undefined,
    };

    DB.Subscription.create(subscription);
    
    // Update customer status
    DB.Customer.update(selectedCustomer.id, { 
      status: 'active_payment_required',
    });

    toast.success('Quote set successfully!');
    setShowQuoteDialog(false);
    loadPendingQuotes();
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
              <h1 className="text-xl font-bold text-gray-900">Pending Quotes</h1>
              <p className="text-xs text-gray-500">Review and set prices for new signups</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 py-6">
        <div className="max-w-6xl mx-auto">
          {/* Search */}
          <div className="flex gap-2 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, phone, or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} variant="outline">
              Search
            </Button>
          </div>

          {/* Customers List */}
          {customers.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No pending quotes found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {customers.map((customer) => (
                <Card key={customer.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{customer.full_name}</h3>
                        <p className="text-sm text-gray-500">
                          {new Date(customer.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-800">
                        Pending Quote
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 text-gray-400 mr-2" />
                        {customer.phone}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                        {customer.city}, {customer.community}
                      </div>
                      <div className="flex items-center">
                        <Trash2 className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="capitalize">{customer.waste_type.replace('_', ' ')}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="capitalize">{customer.frequency.replace('_', ' ')}</span>
                      </div>
                    </div>

                    <Button 
                      onClick={() => openQuoteDialog(customer)}
                      className="w-full mt-4 bg-green-600 hover:bg-green-700"
                    >
                      Set Price
                    </Button>
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

      {/* Quote Dialog */}
      <Dialog open={showQuoteDialog} onOpenChange={setShowQuoteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Set Monthly Price</DialogTitle>
            <DialogDescription>
              {selectedCustomer && `For ${selectedCustomer.full_name}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="usd_amount">
                Agreed Amount (USD) <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="usd_amount"
                  type="number"
                  placeholder="Enter USD amount"
                  value={quoteData.agreed_amount_usd}
                  onChange={(e) => setQuoteData(prev => ({ ...prev, agreed_amount_usd: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lrd_amount">Agreed Amount (LRD) - Optional</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="lrd_amount"
                  type="number"
                  placeholder="Enter LRD amount"
                  value={quoteData.agreed_amount_lrd}
                  onChange={(e) => setQuoteData(prev => ({ ...prev, agreed_amount_lrd: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={quoteData.start_date}
                onChange={(e) => setQuoteData(prev => ({ ...prev, start_date: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                placeholder="Any additional notes..."
                value={quoteData.notes}
                onChange={(e) => setQuoteData(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>

            <Button 
              onClick={handleSubmitQuote}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Save Quote
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
