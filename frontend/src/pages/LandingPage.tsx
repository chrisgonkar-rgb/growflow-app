// Growflow - Public Landing Page
// © TrueNorth Group of Companies Ltd.

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  Trash2, 
  Users, 
  Shield, 
  Download,
  X,
  Smartphone,
  MapPin,
  DollarSign,
  Clock
} from 'lucide-react';
import { usePWA, isDesktop } from '@/hooks/usePWA';

export default function LandingPage() {
  const navigate = useNavigate();
  const { isInstallable, isStandalone, installApp, dismissInstall } = usePWA();
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isDesktopView, setIsDesktopView] = useState(false);

  useEffect(() => {
    setIsDesktopView(isDesktop());
    const handleResize = () => setIsDesktopView(isDesktop());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isInstallable && !isStandalone) {
      setShowInstallPrompt(true);
    }
  }, [isInstallable, isStandalone]);

  const handleInstall = async () => {
    const result = await installApp();
    if (result.success) {
      setShowInstallPrompt(false);
    }
  };

  const features = [
    {
      icon: Trash2,
      title: 'Reliable Collection',
      description: 'Weekly or twice-weekly waste collection at your doorstep',
    },
    {
      icon: MapPin,
      title: 'Citywide Coverage',
      description: 'Serving Paynesville, Monrovia, Sinkor, and surrounding areas',
    },
    {
      icon: DollarSign,
      title: 'Affordable Pricing',
      description: 'Competitive monthly rates with flexible payment options',
    },
    {
      icon: Clock,
      title: 'Easy Scheduling',
      description: 'Choose a collection schedule that works for you',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm py-4 px-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center mr-3">
              <Trash2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-green-700">Growflow</h1>
              <p className="text-xs text-gray-500">GreenFlow City Services</p>
            </div>
          </div>
          
          {/* Staff Login - Desktop Only */}
          {isDesktopView && (
            <Button 
              variant="outline" 
              onClick={() => navigate('/admin')}
              className="text-green-700 border-green-600 hover:bg-green-50"
            >
              <Shield className="h-4 w-4 mr-2" />
              Staff Login
            </Button>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Content */}
            <div className="text-center md:text-left">
              <Badge className="mb-4 bg-green-100 text-green-800 hover:bg-green-100">
                A Service of TrueNorth Group of Companies Ltd.
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Professional Sanitation Services
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Sign up for reliable waste collection services in your community. 
                We serve homes, businesses, and construction sites across Liberia.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <Button 
                  onClick={() => navigate('/signup')}
                  className="bg-green-600 hover:bg-green-700 h-12 px-8 text-lg"
                >
                  <Users className="h-5 w-5 mr-2" />
                  Sign Up
                </Button>
                <Button 
                  onClick={() => navigate('/login')}
                  variant="outline"
                  className="h-12 px-8 text-lg border-green-600 text-green-700 hover:bg-green-50"
                >
                  Log In
                </Button>
              </div>

              {/* Install App Button */}
              {isInstallable && !isStandalone && (
                <Button 
                  onClick={handleInstall}
                  variant="ghost"
                  className="mt-4 text-gray-500"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Install App
                </Button>
              )}
            </div>

            {/* Right: Features */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                      <feature.icon className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-sm text-gray-500">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
            How It Works
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '1', title: 'Sign Up', desc: 'Create your account' },
              { step: '2', title: 'Get Quote', desc: 'We\'ll contact you with pricing' },
              { step: '3', title: 'Confirm', desc: 'Approve your monthly fee' },
              { step: '4', title: 'Pay Monthly', desc: 'Easy payment verification' },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-bold">{item.step}</span>
                </div>
                <h3 className="font-semibold text-gray-900">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Coverage Areas */}
      <section className="py-12 px-4 bg-green-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Areas We Serve
          </h2>
          <p className="text-gray-600 mb-6">
            Providing sanitation services across greater Monrovia
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {['Paynesville', 'Gardnersville', 'Congo Town', 'Old Road', 'Sinkor', 'Monrovia', 'Johnsonville', 'Brewerville', 'RIA Highway'].map((city) => (
              <Badge key={city} variant="outline" className="px-4 py-2">
                {city}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h3 className="font-bold text-lg">Growflow</h3>
              <p className="text-gray-400 text-sm">GreenFlow City Services</p>
            </div>
            <div className="text-center md:text-right">
              <p className="text-gray-400 text-sm">
                © TrueNorth Group of Companies Ltd.
              </p>
              <p className="text-gray-500 text-xs">
                All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Install Prompt Dialog */}
      <Dialog open={showInstallPrompt} onOpenChange={setShowInstallPrompt}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Smartphone className="h-5 w-5 mr-2 text-green-600" />
              Install Growflow App
            </DialogTitle>
            <DialogDescription>
              Add Growflow to your home screen for quick access to your sanitation services.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button 
              onClick={handleInstall}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Install App
            </Button>
            <Button 
              onClick={() => {
                dismissInstall();
                setShowInstallPrompt(false);
              }}
              variant="outline"
            >
              <X className="h-4 w-4 mr-2" />
              Not Now
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
