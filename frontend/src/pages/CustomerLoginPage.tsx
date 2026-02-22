// Growflow - Customer Login Page
// © TrueNorth Group of Companies Ltd.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  Mail, 
  Lock, 
  ArrowLeft, 
  Eye, 
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';

export default function CustomerLoginPage() {
  const navigate = useNavigate();
  const { loginCustomer, requestPasswordReset, resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Password reset states
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetStep, setResetStep] = useState<'email' | 'otp' | 'newPassword'>('email');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await loginCustomer(email, password);
    
    if (result.success) {
      navigate('/customer/dashboard');
    } else {
      setError(result.error || 'Login failed');
    }
    
    setIsLoading(false);
  };

  const handleRequestReset = async () => {
    if (!resetEmail.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    setIsResetting(true);
    const result = await requestPasswordReset(resetEmail);
    
    if (result.success) {
      toast.success(result.message);
      setResetStep('otp');
    }
    setIsResetting(false);
  };

  const handleVerifyOTP = () => {
    if (!otpCode.trim() || otpCode.length !== 6) {
      toast.error('Please enter the 6-digit code');
      return;
    }
    setResetStep('newPassword');
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsResetting(true);
    const result = await resetPassword(otpCode, newPassword);
    
    if (result.success) {
      toast.success('Password reset successful! Please log in with your new password.');
      setShowResetDialog(false);
      setResetStep('email');
      setResetEmail('');
      setOtpCode('');
      setNewPassword('');
      setConfirmNewPassword('');
    } else {
      toast.error(result.error || 'Password reset failed');
    }
    setIsResetting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm py-4 px-4">
        <div className="max-w-md mx-auto flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/')}
            className="mr-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-green-700">Customer Login</h1>
            <p className="text-xs text-gray-500">GreenFlow City Services</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center space-y-1">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
              <Mail className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Welcome Back</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowResetDialog(true);
                    setResetEmail(email);
                  }}
                  className="text-sm text-green-600 hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 h-12"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-4">
              Don't have an account?{' '}
              <button 
                type="button"
                onClick={() => navigate('/signup')}
                className="text-green-600 hover:underline font-medium"
              >
                Sign up
              </button>
            </p>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="bg-white py-4 px-4 text-center">
        <p className="text-xs text-gray-500">
          © TrueNorth Group of Companies Ltd. All rights reserved.
        </p>
      </footer>

      {/* Password Reset Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              {resetStep === 'email' && "Enter your email to receive a reset code."}
              {resetStep === 'otp' && "Enter the 6-digit code sent to your email."}
              {resetStep === 'newPassword' && "Create a new password for your account."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {resetStep === 'email' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="reset_email">Email Address</Label>
                  <Input
                    id="reset_email"
                    type="email"
                    placeholder="your@email.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={handleRequestReset}
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={isResetting}
                >
                  {isResetting ? 'Sending...' : 'Send Reset Code'}
                </Button>
              </>
            )}

            {resetStep === 'otp' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="otp">Reset Code</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="000000"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  />
                  <p className="text-xs text-gray-500">
                    For demo purposes, check the browser console for the OTP.
                  </p>
                </div>
                <Button 
                  onClick={handleVerifyOTP}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  Verify Code
                </Button>
              </>
            )}

            {resetStep === 'newPassword' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="new_password">New Password</Label>
                  <Input
                    id="new_password"
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm_password">Confirm Password</Label>
                  <Input
                    id="confirm_password"
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={handleResetPassword}
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={isResetting}
                >
                  {isResetting ? 'Resetting...' : 'Reset Password'}
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
