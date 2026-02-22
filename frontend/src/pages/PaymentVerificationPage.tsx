// Growflow - Payment Verification Page
// © TrueNorth Group of Companies Ltd.

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  ArrowLeft, 
  Search, 
  CreditCard, 
  CheckCircle, 
  XCircle,
  FileText,
  Image as ImageIcon
} from 'lucide-react';
import { toast } from 'sonner';
import DB from '@/db';
import { useAuth } from '@/contexts/AuthContext';
import type { Payment, Customer, Subscription } from '@/types';

interface PaymentWithDetails extends Payment {
  customer?: Customer;
  subscription?: Subscription;
}

export default function PaymentVerificationPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [payments, setPayments] = useState<PaymentWithDetails[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<PaymentWithDetails | null>(null);
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    loadPendingPayments();
  }, []);

  const loadPendingPayments = () => {
    const pending = DB.Payment.getPending();
    const withDetails = pending.map(payment => ({
      ...payment,
      customer: DB.Customer.getById(payment.customer_id),
      subscription: DB.Subscription.getById(payment.subscription_id),
    }));
    setPayments(withDetails);
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      loadPendingPayments();
      return;
    }
    const allPending = DB.Payment.getPending();
    const withDetails = allPending.map(payment => ({
      ...payment,
      customer: DB.Customer.getById(payment.customer_id),
      subscription: DB.Subscription.getById(payment.subscription_id),
    }));
    const filtered = withDetails.filter(p => 
      p.customer?.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.customer?.phone.includes(searchQuery) ||
      p.reference?.includes(searchQuery)
    );
    setPayments(filtered);
  };

  const openVerifyDialog = (payment: PaymentWithDetails) => {
    setSelectedPayment(payment);
    setRejectionReason('');
    setShowVerifyDialog(true);
  };

  const handleApprove = () => {
    if (!selectedPayment || !user) return;

    DB.Payment.update(selectedPayment.id, {
      status: 'approved',
      verified_at: new Date().toISOString(),
      verified_by: user.id,
    });

    // Update customer status
    DB.Customer.update(selectedPayment.customer_id, {
      status: 'active_paid',
    });

    toast.success('Payment approved successfully!');
    setShowVerifyDialog(false);
    loadPendingPayments();
  };

  const handleReject = () => {
    if (!selectedPayment || !user) return;

    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    DB.Payment.update(selectedPayment.id, {
      status: 'rejected',
      verified_at: new Date().toISOString(),
      verified_by: user.id,
      rejection_reason: rejectionReason,
    });

    // Revert customer status
    DB.Customer.update(selectedPayment.customer_id, {
      status: 'active_payment_required',
    });

    toast.success('Payment rejected');
    setShowVerifyDialog(false);
    loadPendingPayments();
  };

  const openImageDialog = (payment: PaymentWithDetails) => {
    setSelectedPayment(payment);
    setShowImageDialog(true);
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
              <h1 className="text-xl font-bold text-gray-900">Payment Verification</h1>
              <p className="text-xs text-gray-500">Verify and approve customer payments</p>
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
                placeholder="Search by name, phone, or reference..."
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

          {/* Payments List */}
          {payments.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-12 w-12 mx-auto text-green-300 mb-4" />
                <p className="text-gray-500">No pending payments to verify</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {payments.map((payment) => (
                <Card key={payment.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {payment.customer?.full_name || 'Unknown'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {new Date(payment.submitted_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800">
                        Pending
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Amount:</span>
                        <span className="font-semibold">
                          {payment.paid_currency} {payment.paid_amount.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <CreditCard className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="capitalize">{payment.method.replace('_', ' ')}</span>
                      </div>
                      {payment.reference && (
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-xs">Ref: {payment.reference}</span>
                        </div>
                      )}
                      
                      {/* Expected amount check */}
                      {payment.subscription && (
                        <div className={`p-2 rounded text-xs ${
                          (payment.paid_currency === 'USD' && payment.paid_amount === payment.subscription.agreed_amount_usd) ||
                          (payment.paid_currency === 'LRD' && payment.paid_amount === payment.subscription.agreed_amount_lrd)
                            ? 'bg-green-50 text-green-700'
                            : 'bg-red-50 text-red-700'
                        }`}>
                          Expected: {payment.paid_currency === 'USD' 
                            ? `$${payment.subscription.agreed_amount_usd.toFixed(2)}`
                            : `LRD ${payment.subscription.agreed_amount_lrd?.toLocaleString()}`
                          }
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 mt-4">
                      {payment.proof_url && (
                        <Button 
                          variant="outline"
                          size="sm"
                          onClick={() => openImageDialog(payment)}
                          className="flex-1"
                        >
                          <ImageIcon className="h-4 w-4 mr-1" />
                          View Proof
                        </Button>
                      )}
                      <Button 
                        onClick={() => openVerifyDialog(payment)}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        size="sm"
                      >
                        Verify
                      </Button>
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

      {/* Verify Dialog */}
      <Dialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Verify Payment</DialogTitle>
            <DialogDescription>
              {selectedPayment && `Payment from ${selectedPayment.customer?.full_name}`}
            </DialogDescription>
          </DialogHeader>
          
          {selectedPayment && (
            <div className="space-y-4 mt-4">
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Amount:</span>
                  <span className="font-semibold">
                    {selectedPayment.paid_currency} {selectedPayment.paid_amount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Method:</span>
                  <span className="capitalize">{selectedPayment.method.replace('_', ' ')}</span>
                </div>
                {selectedPayment.reference && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Reference:</span>
                    <span>{selectedPayment.reference}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="rejection_reason">Rejection Reason (if rejecting)</Label>
                <Input
                  id="rejection_reason"
                  placeholder="Enter reason for rejection..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleReject}
                  variant="destructive"
                  className="flex-1"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button 
                  onClick={handleApprove}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Dialog */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Payment Proof</DialogTitle>
          </DialogHeader>
          {selectedPayment?.proof_url && (
            <div className="mt-4">
              <img 
                src={selectedPayment.proof_url} 
                alt="Payment proof" 
                className="max-w-full rounded-lg"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
