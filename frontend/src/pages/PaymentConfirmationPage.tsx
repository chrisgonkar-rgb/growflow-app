// Growflow - Payment Confirmation Page
// © TrueNorth Group of Companies Ltd.

import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  ArrowLeft, 
  DollarSign, 
  CreditCard, 
  CheckCircle, 
  Camera,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import DB from '@/db';
import type { Customer, Subscription, Payment, PaymentMethod, Currency } from '@/types';
import { PAYMENT_METHODS, MONTHS, getYearOptions } from '@/types';

export default function PaymentConfirmationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { customer: authCustomer } = useAuth();
  
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  // Get month/year from URL params or default to current month
  const defaultMonth = parseInt(searchParams.get('month') || '') || new Date().getMonth() + 1;
  const defaultYear = parseInt(searchParams.get('year') || '') || new Date().getFullYear();
  
  const [formData, setFormData] = useState({
    month: defaultMonth,
    year: defaultYear,
    method: '' as PaymentMethod | '',
    currency: 'USD' as Currency,
    amount: '',
    reference: '',
    proof: null as File | null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!authCustomer) {
      navigate('/login');
      return;
    }

    const cust = DB.Customer.getById(authCustomer.id);
    if (!cust) {
      toast.error('Customer not found');
      navigate('/login');
      return;
    }

    const sub = DB.Subscription.getByCustomerId(authCustomer.id);
    if (!sub) {
      toast.error('No active subscription found');
      navigate('/customer/dashboard');
      return;
    }

    setCustomer(cust);
    setSubscription(sub);
    
    // Check if there's already a payment for this month
    const existingPayment = DB.Payment.getMonthPaymentStatus(authCustomer.id, defaultMonth, defaultYear);
    if (existingPayment && existingPayment.status === 'approved') {
      toast.info('Payment for this month has already been approved');
      navigate('/customer/dashboard');
      return;
    }

    setIsLoading(false);
  }, [authCustomer, navigate, defaultMonth, defaultYear]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      setFormData(prev => ({ ...prev, proof: file }));
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.method) {
      newErrors.method = 'Please select a payment method';
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }

    if (formData.method === 'mobile_money' && !formData.reference.trim()) {
      newErrors.reference = 'Transaction reference is required for Mobile Money';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePayment = (): boolean => {
    if (!subscription) return false;
    
    const amount = parseFloat(formData.amount);

    if (formData.currency === 'USD') {
      if (amount !== subscription.agreed_amount_usd) {
        toast.error(`Amount must match your agreed monthly fee: $${subscription.agreed_amount_usd.toFixed(2)}`);
        return false;
      }
    } else if (formData.currency === 'LRD') {
      if (!subscription.agreed_amount_lrd) {
        toast.error('LRD payment is not configured for your account');
        return false;
      }
      if (amount !== subscription.agreed_amount_lrd) {
        toast.error(`Amount must match your agreed monthly fee: LRD ${subscription.agreed_amount_lrd.toLocaleString()}`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !validatePayment() || !customer || !subscription) return;

    // Check if there's already a pending payment for this month
    const existingPayment = DB.Payment.getMonthPaymentStatus(customer.id, formData.month, formData.year);
    if (existingPayment && existingPayment.status === 'pending') {
      toast.error('You already have a pending payment for this month. Please wait for verification.');
      return;
    }

    // Create payment record
    const payment: Payment = {
      id: uuidv4(),
      customer_id: customer.id,
      subscription_id: subscription.id,
      payment_month: formData.month,
      payment_year: formData.year,
      paid_currency: formData.currency,
      paid_amount: parseFloat(formData.amount),
      method: formData.method as PaymentMethod,
      reference: formData.reference || undefined,
      proof_url: previewImage || undefined,
      status: 'pending',
      submitted_at: new Date().toISOString(),
    };

    DB.Payment.create(payment);
    
    // Update customer status
    DB.Customer.update(customer.id, { status: 'payment_pending_verification' });
    
    setShowSuccess(true);
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!customer || !subscription) return null;

  const monthName = MONTHS.find(m => m.value === formData.month)?.label || '';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm py-4 px-4">
        <div className="max-w-md mx-auto flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/customer/dashboard')}
            className="mr-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-green-700">Confirm Payment</h1>
            <p className="text-xs text-gray-500">GreenFlow City Services</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 py-6">
        <Card className="max-w-md mx-auto shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Payment Details</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Month Selection */}
            <div className="bg-green-50 p-4 rounded-lg mb-6">
              <p className="text-sm text-green-800 font-medium mb-2">Paying for:</p>
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-green-600 mr-2" />
                <span className="font-bold text-green-800">{monthName} {formData.year}</span>
              </div>
            </div>

            {/* Agreed Amount Display */}
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <p className="text-sm text-blue-800 font-medium mb-2">Your Agreed Monthly Fee:</p>
              <div className="flex justify-between items-center">
                <span className="text-blue-700">USD:</span>
                <span className="font-bold text-blue-800">${subscription.agreed_amount_usd.toFixed(2)}</span>
              </div>
              {subscription.agreed_amount_lrd && (
                <div className="flex justify-between items-center mt-1">
                  <span className="text-blue-700">LRD:</span>
                  <span className="font-bold text-blue-800">LRD {subscription.agreed_amount_lrd.toLocaleString()}</span>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Month Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="month">Month</Label>
                  <Select 
                    value={formData.month.toString()} 
                    onValueChange={(value) => handleInputChange('month', parseInt(value))}
                  >
                    <SelectTrigger>
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((month) => (
                        <SelectItem key={month.value} value={month.value.toString()}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Select 
                    value={formData.year.toString()} 
                    onValueChange={(value) => handleInputChange('year', parseInt(value))}
                  >
                    <SelectTrigger>
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getYearOptions().map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <Label htmlFor="method">Payment Method</Label>
                <Select 
                  value={formData.method} 
                  onValueChange={(value) => handleInputChange('method', value as PaymentMethod)}
                >
                  <SelectTrigger className={errors.method ? 'border-red-500' : ''}>
                    <CreditCard className="h-4 w-4 text-gray-400 mr-2" />
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.method && <p className="text-xs text-red-500">{errors.method}</p>}
              </div>

              {/* Currency */}
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select 
                  value={formData.currency} 
                  onValueChange={(value) => handleInputChange('currency', value as Currency)}
                >
                  <SelectTrigger>
                    <DollarSign className="h-4 w-4 text-gray-400 mr-2" />
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD (US Dollars)</SelectItem>
                    <SelectItem value="LRD" disabled={!subscription.agreed_amount_lrd}>
                      LRD (Liberian Dollars)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount">Amount Paid</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Enter exact amount"
                    value={formData.amount}
                    onChange={(e) => handleInputChange('amount', e.target.value)}
                    className={`pl-10 ${errors.amount ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.amount && <p className="text-xs text-red-500">{errors.amount}</p>}
                <p className="text-xs text-gray-500">
                  Amount must exactly match your agreed monthly fee
                </p>
              </div>

              {/* Transaction Reference */}
              {formData.method === 'mobile_money' && (
                <div className="space-y-2">
                  <Label htmlFor="reference">
                    Transaction Reference <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="reference"
                    placeholder="Enter transaction ID"
                    value={formData.reference}
                    onChange={(e) => handleInputChange('reference', e.target.value)}
                    className={errors.reference ? 'border-red-500' : ''}
                  />
                  {errors.reference && <p className="text-xs text-red-500">{errors.reference}</p>}
                </div>
              )}

              {/* Proof Upload */}
              <div className="space-y-2">
                <Label htmlFor="proof">Upload Proof (Optional)</Label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-green-500 transition-colors"
                >
                  {previewImage ? (
                    <img 
                      src={previewImage} 
                      alt="Payment proof" 
                      className="max-h-32 mx-auto rounded"
                    />
                  ) : (
                    <>
                      <Camera className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">Click to upload receipt or screenshot</p>
                    </>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 h-12"
              >
                Submit Payment Confirmation
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="bg-white py-4 px-4 text-center">
        <p className="text-xs text-gray-500">
          © TrueNorth Group of Companies Ltd. All rights reserved.
        </p>
      </footer>

      {/* Success Dialog */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <DialogTitle className="text-xl font-bold text-gray-900">
              Payment Submitted!
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              Your payment for {monthName} {formData.year} is pending verification. Our team will review and confirm shortly.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <Button 
              onClick={() => navigate('/customer/dashboard')}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Back to Dashboard
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
