// Growflow - Customer Signup Page
// © TrueNorth Group of Companies Ltd.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  User, 
  Phone, 
  MapPin, 
  Building2, 
  Calendar, 
  CheckCircle, 
  ArrowRight, 
  Trash2,
  ArrowLeft,
  Mail,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { LIBERIA_CITIES, WASTE_TYPES, FREQUENCIES, type WasteType, type Frequency } from '@/types';

export default function CustomerSignupPage() {
  const navigate = useNavigate();
  const { signupCustomer } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    password: '',
    confirm_password: '',
    city: '',
    community: '',
    landmark: '',
    waste_type: '' as WasteType | '',
    frequency: '' as Frequency | '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10,}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match';
    }

    if (!formData.city) {
      newErrors.city = 'City is required';
    }

    if (!formData.community.trim()) {
      newErrors.community = 'Community is required';
    }

    if (!formData.landmark.trim()) {
      newErrors.landmark = 'Landmark is required';
    }

    if (!formData.waste_type) {
      newErrors.waste_type = 'Waste type is required';
    }

    if (!formData.frequency) {
      newErrors.frequency = 'Frequency is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsSubmitting(true);

    const result = await signupCustomer({
      full_name: formData.full_name,
      phone: formData.phone,
      email: formData.email,
      password: formData.password,
      city: formData.city,
      community: formData.community,
      landmark: formData.landmark,
      waste_type: formData.waste_type,
      frequency: formData.frequency,
    });

    if (result.success) {
      setShowSuccess(true);
    } else {
      toast.error(result.error || 'Signup failed');
    }

    setIsSubmitting(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleGoToDashboard = () => {
    navigate('/customer/dashboard');
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
            <h1 className="text-xl font-bold text-green-700">Create Account</h1>
            <p className="text-xs text-gray-500">GreenFlow City Services</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 py-6">
        <Card className="w-full max-w-md mx-auto shadow-lg">
          <CardHeader className="text-center space-y-1">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-2">
              <Trash2 className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-xl font-bold text-gray-900">Sign Up for Sanitation Services</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="full_name"
                    placeholder="Enter your full name"
                    value={formData.full_name}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    className={`pl-10 ${errors.full_name ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.full_name && <p className="text-xs text-red-500">{errors.full_name}</p>}
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="e.g., 0770123456"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className={`pl-10 ${errors.phone ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={`pl-10 pr-10 ${errors.password ? 'border-red-500' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirm_password">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirm_password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    value={formData.confirm_password}
                    onChange={(e) => handleInputChange('confirm_password', e.target.value)}
                    className={`pl-10 pr-10 ${errors.confirm_password ? 'border-red-500' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirm_password && <p className="text-xs text-red-500">{errors.confirm_password}</p>}
              </div>

              {/* City */}
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Select 
                  value={formData.city} 
                  onValueChange={(value) => handleInputChange('city', value)}
                >
                  <SelectTrigger className={`w-full ${errors.city ? 'border-red-500' : ''}`}>
                    <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                    <SelectValue placeholder="Select your city" />
                  </SelectTrigger>
                  <SelectContent>
                    {LIBERIA_CITIES.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.city && <p className="text-xs text-red-500">{errors.city}</p>}
              </div>

              {/* Community */}
              <div className="space-y-2">
                <Label htmlFor="community">Community</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="community"
                    placeholder="Enter your community/area"
                    value={formData.community}
                    onChange={(e) => handleInputChange('community', e.target.value)}
                    className={`pl-10 ${errors.community ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.community && <p className="text-xs text-red-500">{errors.community}</p>}
              </div>

              {/* Landmark */}
              <div className="space-y-2">
                <Label htmlFor="landmark">Landmark Description</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="landmark"
                    placeholder="e.g., Near the market, Blue house"
                    value={formData.landmark}
                    onChange={(e) => handleInputChange('landmark', e.target.value)}
                    className={`pl-10 ${errors.landmark ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.landmark && <p className="text-xs text-red-500">{errors.landmark}</p>}
              </div>

              {/* Waste Type */}
              <div className="space-y-2">
                <Label htmlFor="waste_type">Waste Type</Label>
                <Select 
                  value={formData.waste_type} 
                  onValueChange={(value) => handleInputChange('waste_type', value as WasteType)}
                >
                  <SelectTrigger className={`w-full ${errors.waste_type ? 'border-red-500' : ''}`}>
                    <Trash2 className="h-4 w-4 text-gray-400 mr-2" />
                    <SelectValue placeholder="Select waste type" />
                  </SelectTrigger>
                  <SelectContent>
                    {WASTE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.waste_type && <p className="text-xs text-red-500">{errors.waste_type}</p>}
              </div>

              {/* Frequency */}
              <div className="space-y-2">
                <Label htmlFor="frequency">Collection Frequency</Label>
                <Select 
                  value={formData.frequency} 
                  onValueChange={(value) => handleInputChange('frequency', value as Frequency)}
                >
                  <SelectTrigger className={`w-full ${errors.frequency ? 'border-red-500' : ''}`}>
                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCIES.map((freq) => (
                      <SelectItem key={freq.value} value={freq.value}>
                        {freq.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.frequency && <p className="text-xs text-red-500">{errors.frequency}</p>}
              </div>

              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 h-12 text-lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating Account...' : (
                  <>
                    Create Account <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>

              <p className="text-center text-sm text-gray-500">
                Already have an account?{' '}
                <button 
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-green-600 hover:underline font-medium"
                >
                  Log in
                </button>
              </p>
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
              Account Created Successfully!
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              Thank you for registering. Our team will contact you to confirm your service details and monthly price.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <Button 
              onClick={handleGoToDashboard}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Go to My Account
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
