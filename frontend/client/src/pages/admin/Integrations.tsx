import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  Search, 
  Zap, 
  Video, 
  CreditCard, 
  MessageSquare, 
  Share2, 
  HeadphonesIcon,
  Linkedin,
  Twitter,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type Integration = {
  id: string;
  name: string;
  description: string;
  icon?: any;
  logo?: string;
  connected: boolean;
  actionLabel?: string;
  category: string;
};

type IntegrationsProps = {
  category?: string;
};

export default function Integrations({ category }: IntegrationsProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Razorpay Configuration Dialog
  const [showRazorpayDialog, setShowRazorpayDialog] = useState(false);
  const [razorpayConfig, setRazorpayConfig] = useState({
    keyId: '',
    keySecret: '',
    webhookSecret: '',
  });

  // Stripe Configuration Dialog
  const [showStripeDialog, setShowStripeDialog] = useState(false);
  const [stripeConfig, setStripeConfig] = useState({
    publishableKey: '',
    secretKey: '',
    webhookSecret: '',
  });

  // PayPal Configuration Dialog
  const [showPayPalDialog, setShowPayPalDialog] = useState(false);
  const [paypalConfig, setPaypalConfig] = useState({
    clientId: '',
    clientSecret: '',
    mode: 'sandbox', // sandbox or live
  });

  // Load saved configs on mount
  useEffect(() => {
    // Razorpay
    const savedRazorpay = localStorage.getItem('razorpay_config');
    if (savedRazorpay) {
      const config = JSON.parse(savedRazorpay);
      setRazorpayConfig(config);
      setIntegrations(prev => prev.map(int => 
        int.id === 'razorpay' ? { ...int, connected: true } : int
      ));
    }

    // Stripe
    const savedStripe = localStorage.getItem('stripe_config');
    if (savedStripe) {
      const config = JSON.parse(savedStripe);
      setStripeConfig(config);
      setIntegrations(prev => prev.map(int => 
        int.id === 'stripe' ? { ...int, connected: true } : int
      ));
    }

    // PayPal
    const savedPayPal = localStorage.getItem('paypal_config');
    if (savedPayPal) {
      const config = JSON.parse(savedPayPal);
      setPaypalConfig(config);
      setIntegrations(prev => prev.map(int => 
        int.id === 'paypal' ? { ...int, connected: true } : int
      ));
    }
  }, []);

  const [integrations, setIntegrations] = useState<Integration[]>([
    // Video Conferencing
    { 
      id: 'google-meet', 
      name: 'Google Meet', 
      description: 'Automatically creates a Google Meet meeting for every appointment scheduled',
      logo: '🎥',
      connected: false,
      category: 'video-conferencing'
    },
    { 
      id: 'zoom', 
      name: 'Zoom', 
      description: 'Automatically create a Zoom Meeting for every appointment scheduled',
      logo: '📹',
      connected: false,
      category: 'video-conferencing'
    },
    { 
      id: 'microsoft-teams', 
      name: 'Microsoft Teams', 
      description: 'Automatically creates a Microsoft Teams meeting for every appointment scheduled',
      logo: '👥',
      connected: false,
      category: 'video-conferencing'
    },
    { 
      id: 'zoho-meeting', 
      name: 'Zoho Meeting', 
      description: 'Automatically create a Zoho Meeting for every appointment scheduled',
      icon: Video,
      connected: false,
      category: 'video-conferencing'
    },

    // Payments
    { 
      id: 'razorpay', 
      name: 'Razorpay', 
      description: 'Collect online payments while booking.',
      logo: '💳',
      connected: false,
      category: 'payments'
    },
    { 
      id: 'stripe', 
      name: 'Stripe', 
      description: 'Collect online payments while booking.',
      logo: '💰',
      connected: false,
      category: 'payments'
    },
    { 
      id: 'paypal', 
      name: 'PayPal', 
      description: 'Collect online payments while booking.',
      logo: '🅿️',
      connected: false,
      category: 'payments'
    },

    // SMS
    { 
      id: 'twilio', 
      name: 'Twilio', 
      description: 'Send SMS alerts to customers and users.',
      logo: '📱',
      connected: false,
      category: 'sms'
    },
    { 
      id: 'clickatell', 
      name: 'Clickatell', 
      description: 'Send SMS alerts to customers and users.',
      logo: '💬',
      connected: false,
      category: 'sms'
    },
    { 
      id: 'holio', 
      name: 'Holio', 
      description: 'Send SMS alerts to customers and users.',
      logo: '📲',
      connected: false,
      category: 'sms'
    },
    { 
      id: 'clockworksms', 
      name: 'ClockWorkSMS', 
      description: 'Send SMS alerts to customers and users.',
      logo: '⏰',
      connected: false,
      category: 'sms'
    },
    { 
      id: 'sms-magic', 
      name: 'SMS-Magic', 
      description: 'Send SMS alerts to customers and users.',
      logo: '✨',
      connected: false,
      category: 'sms'
    },
    { 
      id: 'nexmo', 
      name: 'Nexmo', 
      description: 'Send SMS alerts to customers and users.',
      logo: '📧',
      connected: false,
      category: 'sms'
    },

    // Connectors
    { 
      id: 'whatsapp', 
      name: 'WhatsApp', 
      description: 'Send WhatsApp notifications and reminders to both customers and users directly.',
      icon: MessageSquare,
      connected: false,
      category: 'connectors'
    },
    { 
      id: 'linkedin', 
      name: 'LinkedIn', 
      description: 'Integrate an app with Bookings through LinkedIn for professional networking.',
      icon: Linkedin,
      connected: false,
      category: 'connectors'
    },
    { 
      id: 'twitter', 
      name: 'Twitter', 
      description: 'Integrate an app with Bookings through Twitter for social engagement.',
      icon: Twitter,
      connected: false,
      category: 'connectors'
    },
    { 
      id: 'zoho-flow', 
      name: 'Zoho Flow', 
      description: 'Automate business processes by integrating any app with Bookings.',
      icon: Share2,
      connected: false,
      category: 'connectors'
    },
    { 
      id: 'zapier', 
      name: 'Zapier', 
      description: 'Integrate an app with Bookings through Zapier.',
      icon: Zap,
      connected: false,
      category: 'connectors'
    },

    // Support
    { 
      id: 'help-desk', 
      name: 'Help Desk', 
      description: 'Provide customer support and manage tickets directly from your booking system.',
      icon: HeadphonesIcon,
      connected: false,
      actionLabel: 'Install',
      category: 'support'
    },
    { 
      id: 'zoho-desk', 
      name: 'Zoho Desk', 
      description: 'Speed up resolution time by adding the Bookings extension to Desk for customer scheduling.',
      icon: HeadphonesIcon,
      connected: false,
      actionLabel: 'Install',
      category: 'support'
    },
    { 
      id: 'sales-iq', 
      name: 'Sales IQ', 
      description: 'Allow customers to book appointments directly from the chat window.',
      icon: MessageSquare,
      connected: false,
      actionLabel: 'Learn How',
      category: 'support'
    },
    { 
      id: 'zoho-assist', 
      name: 'Zoho Assist', 
      description: 'Automatically create a screen sharing or remote support session for every appointment scheduled',
      icon: Video,
      connected: false,
      category: 'support'
    },

  ]);

  const toggleConnection = (id: string) => {
    const integration = integrations.find(i => i.id === id);
    
    // Special handling for payment gateways
    if (id === 'razorpay') {
      if (integration?.connected) {
        setIntegrations(prev => prev.map(int => 
          int.id === id ? { ...int, connected: false } : int
        ));
        localStorage.removeItem('razorpay_config');
        toast({
          title: "Disconnected",
          description: "Razorpay has been disconnected successfully."
        });
      } else {
        setShowRazorpayDialog(true);
      }
      return;
    }

    if (id === 'stripe') {
      if (integration?.connected) {
        setIntegrations(prev => prev.map(int => 
          int.id === id ? { ...int, connected: false } : int
        ));
        localStorage.removeItem('stripe_config');
        toast({
          title: "Disconnected",
          description: "Stripe has been disconnected successfully."
        });
      } else {
        setShowStripeDialog(true);
      }
      return;
    }

    if (id === 'paypal') {
      if (integration?.connected) {
        setIntegrations(prev => prev.map(int => 
          int.id === id ? { ...int, connected: false } : int
        ));
        localStorage.removeItem('paypal_config');
        toast({
          title: "Disconnected",
          description: "PayPal has been disconnected successfully."
        });
      } else {
        setShowPayPalDialog(true);
      }
      return;
    }
    
    // Default toggle for other integrations
    setIntegrations(prev => prev.map(int => 
      int.id === id ? { ...int, connected: !int.connected } : int
    ));
    
    if (integration) {
      toast({
        title: integration.connected ? "Disconnected" : "Connected",
        description: `${integration.name} has been ${integration.connected ? 'disconnected' : 'connected'} successfully.`
      });
    }
  };

  const handleRazorpaySave = async () => {
    if (!razorpayConfig.keyId || !razorpayConfig.keySecret) {
      toast({
        title: "Error",
        description: "Please enter both Key ID and Key Secret",
        variant: "destructive"
      });
      return;
    }

    try {
      localStorage.setItem('razorpay_config', JSON.stringify(razorpayConfig));
      
      await fetch('/api/razorpay/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(razorpayConfig),
      });
      
      setIntegrations(prev => prev.map(int => 
        int.id === 'razorpay' ? { ...int, connected: true } : int
      ));

      setShowRazorpayDialog(false);
      
      toast({
        title: "Connected",
        description: "Razorpay has been connected successfully. You can now accept payments.",
      });
    } catch (error) {
      console.error('Failed to save Razorpay config:', error);
      toast({
        title: "Error",
        description: "Failed to save configuration. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleStripeSave = async () => {
    if (!stripeConfig.publishableKey || !stripeConfig.secretKey) {
      toast({
        title: "Error",
        description: "Please enter both Publishable Key and Secret Key",
        variant: "destructive"
      });
      return;
    }

    try {
      localStorage.setItem('stripe_config', JSON.stringify(stripeConfig));
      
      await fetch('/api/stripe/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stripeConfig),
      });
      
      setIntegrations(prev => prev.map(int => 
        int.id === 'stripe' ? { ...int, connected: true } : int
      ));

      setShowStripeDialog(false);
      
      toast({
        title: "Connected",
        description: "Stripe has been connected successfully. You can now accept payments.",
      });
    } catch (error) {
      console.error('Failed to save Stripe config:', error);
      toast({
        title: "Error",
        description: "Failed to save configuration. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handlePayPalSave = async () => {
    if (!paypalConfig.clientId || !paypalConfig.clientSecret) {
      toast({
        title: "Error",
        description: "Please enter both Client ID and Client Secret",
        variant: "destructive"
      });
      return;
    }

    try {
      localStorage.setItem('paypal_config', JSON.stringify(paypalConfig));
      
      await fetch('/api/paypal/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paypalConfig),
      });
      
      setIntegrations(prev => prev.map(int => 
        int.id === 'paypal' ? { ...int, connected: true } : int
      ));

      setShowPayPalDialog(false);
      
      toast({
        title: "Connected",
        description: "PayPal has been connected successfully. You can now accept payments.",
      });
    } catch (error) {
      console.error('Failed to save PayPal config:', error);
      toast({
        title: "Error",
        description: "Failed to save configuration. Please try again.",
        variant: "destructive"
      });
    }
  };

  const categories = [
    { id: 'video-conferencing', title: 'Video Conferencing', icon: Video },
    { id: 'payments', title: 'Payments', subtitle: 'Powered by Zoho Checkout', icon: CreditCard },
    { id: 'sms', title: 'SMS', icon: MessageSquare },
    { id: 'connectors', title: 'Connectors', icon: Share2 },
    { id: 'support', title: 'Support', icon: HeadphonesIcon },
  ];

  const filteredIntegrations = integrations.filter(int => {
    // Filter by category if provided
    if (category && int.category !== category) {
      return false;
    }
    // Filter by search query
    if (searchQuery && 
        !int.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !int.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  // Get the current category details
  const currentCategory = categories.find(cat => cat.id === category);
  const displayTitle = currentCategory ? currentCategory.title : 'Integrations';

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{displayTitle}</h1>
            {currentCategory?.subtitle && (
              <p className="text-sm text-gray-500 mt-1">| {currentCategory.subtitle}</p>
            )}
          </div>
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input
              className="pl-10"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto">
          {category ? (
            // Single category view
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredIntegrations.map((integration) => {
                const IconComponent = integration.icon;
                return (
                  <Card key={integration.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {integration.logo ? (
                            <div className="text-4xl">{integration.logo}</div>
                          ) : IconComponent ? (
                            <div className="p-3 bg-blue-100 rounded-lg">
                              <IconComponent size={24} className="text-blue-600" />
                            </div>
                          ) : null}
                          <div>
                            <CardTitle className="text-base">{integration.name}</CardTitle>
                            {integration.actionLabel && (
                              <p className="text-xs text-blue-600 mt-1">{integration.actionLabel}</p>
                            )}
                          </div>
                        </div>
                        <Button
                          variant={integration.connected ? "outline" : "default"}
                          size="sm"
                          onClick={() => toggleConnection(integration.id)}
                          className={integration.connected ? "text-blue-600 border-blue-600" : "bg-blue-600 hover:bg-blue-700"}
                        >
                          {integration.connected ? "Connected" : "Connect"}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-sm">
                        {integration.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            // All categories view
            <div className="space-y-12">
              {categories.map((cat) => {
                const categoryIntegrations = filteredIntegrations.filter(
                  int => int.category === cat.id
                );

                if (categoryIntegrations.length === 0) return null;

                return (
                  <div key={cat.id}>
                    <div className="flex items-center gap-2 mb-6">
                      <h2 className="text-xl font-semibold text-gray-900">{cat.title}</h2>
                      {cat.subtitle && (
                        <span className="text-sm text-gray-500">| {cat.subtitle}</span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {categoryIntegrations.map((integration) => {
                        const IconComponent = integration.icon;
                        return (
                          <Card key={integration.id} className="hover:shadow-lg transition-shadow">
                            <CardHeader>
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                  {integration.logo ? (
                                    <div className="text-4xl">{integration.logo}</div>
                                  ) : IconComponent ? (
                                    <div className="p-3 bg-blue-100 rounded-lg">
                                      <IconComponent size={24} className="text-blue-600" />
                                    </div>
                                  ) : null}
                                  <div>
                                    <CardTitle className="text-base">{integration.name}</CardTitle>
                                    {integration.actionLabel && (
                                      <p className="text-xs text-blue-600 mt-1">{integration.actionLabel}</p>
                                    )}
                                  </div>
                                </div>
                                <Button
                                  variant={integration.connected ? "outline" : "default"}
                                  size="sm"
                                  onClick={() => toggleConnection(integration.id)}
                                  className={integration.connected ? "text-blue-600 border-blue-600" : "bg-blue-600 hover:bg-blue-700"}
                                >
                                  {integration.connected ? "Connected" : "Connect"}
                                </Button>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <CardDescription className="text-sm">
                                {integration.description}
                              </CardDescription>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {filteredIntegrations.length === 0 && (
            <div className="text-center py-12">
              <Search size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No integrations found</h3>
              <p className="text-gray-600">Try searching with different keywords</p>
            </div>
          )}
        </div>
      </div>

      {/* ========== PAYMENT GATEWAY CONFIGURATION DIALOGS ========== */}
      
      {/* Razorpay Configuration Dialog */}
      <Dialog open={showRazorpayDialog} onOpenChange={setShowRazorpayDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="text-3xl">💳</div>
              Connect Razorpay
            </DialogTitle>
            <DialogDescription>
              Enter your Razorpay API credentials to start accepting payments
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-900">
                  <p className="font-medium mb-1">Where to find your API keys?</p>
                  <ol className="list-decimal ml-4 space-y-1 text-blue-800">
                    <li>Log in to your Razorpay Dashboard</li>
                    <li>Go to <strong>Settings → API Keys</strong></li>
                    <li>Generate keys if you haven't already</li>
                    <li>Copy and paste them below</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Key ID */}
            <div className="space-y-2">
              <Label htmlFor="razorpay-key-id">
                Key ID <span className="text-red-500">*</span>
              </Label>
              <Input
                id="razorpay-key-id"
                placeholder="rzp_test_XXXXXXXXXXXX"
                value={razorpayConfig.keyId}
                onChange={(e) => setRazorpayConfig(prev => ({ ...prev, keyId: e.target.value }))}
              />
              <p className="text-xs text-gray-500">
                Your Razorpay Key ID (starts with rzp_test_ or rzp_live_)
              </p>
            </div>

            {/* Key Secret */}
            <div className="space-y-2">
              <Label htmlFor="razorpay-key-secret">
                Key Secret <span className="text-red-500">*</span>
              </Label>
              <Input
                id="razorpay-key-secret"
                type="password"
                placeholder="Enter your Key Secret"
                value={razorpayConfig.keySecret}
                onChange={(e) => setRazorpayConfig(prev => ({ ...prev, keySecret: e.target.value }))}
              />
              <p className="text-xs text-gray-500">
                Your Razorpay Key Secret (keep this confidential)
              </p>
            </div>

            {/* Webhook Secret (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="razorpay-webhook-secret">
                Webhook Secret <span className="text-gray-400">(Optional)</span>
              </Label>
              <Input
                id="razorpay-webhook-secret"
                type="password"
                placeholder="Enter Webhook Secret"
                value={razorpayConfig.webhookSecret}
                onChange={(e) => setRazorpayConfig(prev => ({ ...prev, webhookSecret: e.target.value }))}
              />
              <p className="text-xs text-gray-500">
                Webhook secret for payment verification (recommended for production)
              </p>
            </div>

            {/* Help Link */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm text-gray-900">Need help?</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Check Razorpay documentation for detailed setup guide
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('https://razorpay.com/docs/payments/dashboard/account-settings/api-keys/', '_blank')}
                >
                  <ExternalLink size={14} className="mr-1" />
                  Docs
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRazorpayDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRazorpaySave} className="bg-blue-600 hover:bg-blue-700">
              Save & Connect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stripe Configuration Dialog */}
      <Dialog open={showStripeDialog} onOpenChange={setShowStripeDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="text-3xl">💰</div>
              Connect Stripe
            </DialogTitle>
            <DialogDescription>
              Enter your Stripe API credentials to start accepting payments
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Info Banner */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 size={20} className="text-purple-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-purple-900">
                  <p className="font-medium mb-1">Where to find your API keys?</p>
                  <ol className="list-decimal ml-4 space-y-1 text-purple-800">
                    <li>Log in to your Stripe Dashboard</li>
                    <li>Go to <strong>Developers → API Keys</strong></li>
                    <li>Find or create your API keys</li>
                    <li>Copy and paste them below</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Publishable Key */}
            <div className="space-y-2">
              <Label htmlFor="stripe-publishable-key">
                Publishable Key <span className="text-red-500">*</span>
              </Label>
              <Input
                id="stripe-publishable-key"
                placeholder="pk_test_XXXXXXXXXXXX"
                value={stripeConfig.publishableKey}
                onChange={(e) => setStripeConfig(prev => ({ ...prev, publishableKey: e.target.value }))}
              />
              <p className="text-xs text-gray-500">
                Your Stripe Publishable Key (starts with pk_test_ or pk_live_)
              </p>
            </div>

            {/* Secret Key */}
            <div className="space-y-2">
              <Label htmlFor="stripe-secret-key">
                Secret Key <span className="text-red-500">*</span>
              </Label>
              <Input
                id="stripe-secret-key"
                type="password"
                placeholder="sk_test_XXXXXXXXXXXX"
                value={stripeConfig.secretKey}
                onChange={(e) => setStripeConfig(prev => ({ ...prev, secretKey: e.target.value }))}
              />
              <p className="text-xs text-gray-500">
                Your Stripe Secret Key (keep this confidential)
              </p>
            </div>

            {/* Webhook Secret */}
            <div className="space-y-2">
              <Label htmlFor="stripe-webhook-secret">
                Webhook Secret <span className="text-gray-400">(Optional)</span>
              </Label>
              <Input
                id="stripe-webhook-secret"
                type="password"
                placeholder="whsec_XXXXXXXXXXXX"
                value={stripeConfig.webhookSecret}
                onChange={(e) => setStripeConfig(prev => ({ ...prev, webhookSecret: e.target.value }))}
              />
              <p className="text-xs text-gray-500">
                Webhook signing secret for payment verification (recommended)
              </p>
            </div>

            {/* Help Link */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm text-gray-900">Need help?</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Check Stripe documentation for detailed setup guide
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('https://stripe.com/docs/keys', '_blank')}
                >
                  <ExternalLink size={14} className="mr-1" />
                  Docs
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStripeDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleStripeSave} className="bg-purple-600 hover:bg-purple-700">
              Save & Connect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PayPal Configuration Dialog */}
      <Dialog open={showPayPalDialog} onOpenChange={setShowPayPalDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="text-3xl">🅿️</div>
              Connect PayPal
            </DialogTitle>
            <DialogDescription>
              Enter your PayPal API credentials to start accepting payments
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-900">
                  <p className="font-medium mb-1">Where to find your API credentials?</p>
                  <ol className="list-decimal ml-4 space-y-1 text-blue-800">
                    <li>Log in to PayPal Developer Dashboard</li>
                    <li>Go to <strong>My Apps & Credentials</strong></li>
                    <li>Create or select an app</li>
                    <li>Copy Client ID and Secret</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Mode Selection */}
            <div className="space-y-2">
              <Label htmlFor="paypal-mode">
                Environment Mode <span className="text-red-500">*</span>
              </Label>
              <Select
                value={paypalConfig.mode}
                onValueChange={(value) => setPaypalConfig(prev => ({ ...prev, mode: value }))}
              >
                <SelectTrigger id="paypal-mode">
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sandbox">Sandbox (Testing)</SelectItem>
                  <SelectItem value="live">Live (Production)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Use Sandbox for testing, Live for production payments
              </p>
            </div>

            {/* Client ID */}
            <div className="space-y-2">
              <Label htmlFor="paypal-client-id">
                Client ID <span className="text-red-500">*</span>
              </Label>
              <Input
                id="paypal-client-id"
                placeholder="AXXXXXXXXXXXXXXXXXXX"
                value={paypalConfig.clientId}
                onChange={(e) => setPaypalConfig(prev => ({ ...prev, clientId: e.target.value }))}
              />
              <p className="text-xs text-gray-500">
                Your PayPal REST API Client ID
              </p>
            </div>

            {/* Client Secret */}
            <div className="space-y-2">
              <Label htmlFor="paypal-client-secret">
                Client Secret <span className="text-red-500">*</span>
              </Label>
              <Input
                id="paypal-client-secret"
                type="password"
                placeholder="Enter your Client Secret"
                value={paypalConfig.clientSecret}
                onChange={(e) => setPaypalConfig(prev => ({ ...prev, clientSecret: e.target.value }))}
              />
              <p className="text-xs text-gray-500">
                Your PayPal REST API Secret (keep this confidential)
              </p>
            </div>

            {/* Help Link */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm text-gray-900">Need help?</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Check PayPal documentation for detailed setup guide
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('https://developer.paypal.com/api/rest/', '_blank')}
                >
                  <ExternalLink size={14} className="mr-1" />
                  Docs
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPayPalDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handlePayPalSave} className="bg-blue-500 hover:bg-blue-600">
              Save & Connect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
