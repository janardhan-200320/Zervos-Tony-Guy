import DashboardLayout from '@/components/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import {
    AlertCircle,
    ArrowLeft,
    Bell,
    Check,
    CheckCircle2,
    Eye,
    EyeOff,
    FileText,
    Key,
    Loader2,
    Lock,
    MessageCircle,
    Phone,
    QrCode,
    RefreshCw,
    Send,
    Server,
    Settings,
    Shield,
    XCircle,
    Zap
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';

interface WhatsAppConfig {
  enabled: boolean;
  apiUrl: string;
  sessionName: string;
  phoneNumber: string;
  apiKey: string;
  autoSendBills: boolean;
  billTemplate: string;
  testMode: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'error' | 'unknown';
  lastTested?: string;
}

const DEFAULT_TEMPLATE = `📄 *E-Bill from {{businessName}}*

🧾 *Invoice:* {{invoiceNumber}}
📅 *Date:* {{date}}
⏰ *Time:* {{time}}

📋 *Items:*
{{items}}

💰 *Subtotal:* ₹{{subtotal}}
{{#discount}}🎁 *Discount:* -₹{{discount}}{{/discount}}
{{#tax}}📊 *Tax:* ₹{{tax}}{{/tax}}
💳 *Total Amount:* ₹{{total}}

💵 *Payment Method:* {{paymentMethod}}

✅ Thank you for your business!

📞 Contact: {{phone}}
📍 Address: {{address}}`;

export default function WhatsAppSettings() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { selectedWorkspace } = useWorkspace();
  const [config, setConfig] = useState<WhatsAppConfig>({
    enabled: false,
    apiUrl: 'http://localhost:3000',
    sessionName: 'default',
    phoneNumber: '+919035101333',
    apiKey: 'ac451f3117ed43c19ac0f38b3bd52d66',
    autoSendBills: false,
    billTemplate: DEFAULT_TEMPLATE,
    testMode: true,
    connectionStatus: 'unknown',
    lastTested: undefined
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testPhoneNumber, setTestPhoneNumber] = useState('');

  useEffect(() => {
    loadConfig();
  }, [selectedWorkspace]);

  const loadConfig = () => {
    try {
      const workspaceId = selectedWorkspace?.id || 'default';
      const saved = localStorage.getItem(`whatsapp_config_${workspaceId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        setConfig({ ...config, ...parsed });
      }
    } catch (error) {
      console.error('Error loading WhatsApp config:', error);
    }
  };

  const saveConfig = () => {
    setIsSaving(true);
    try {
      const workspaceId = selectedWorkspace?.id || 'default';
      localStorage.setItem(`whatsapp_config_${workspaceId}`, JSON.stringify(config));
      
      toast({
        title: 'Settings Saved',
        description: 'WhatsApp configuration has been saved successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save WhatsApp configuration.',
        variant: 'destructive',
      });
    } finally {
      setTimeout(() => setIsSaving(false), 500);
    }
  };

  const testConnection = async () => {
    if (!config.apiUrl || !config.sessionName) {
      toast({
        title: 'Missing Information',
        description: 'Please enter API URL and Session Name.',
        variant: 'destructive',
      });
      return;
    }

    setIsTesting(true);
    
    try {
      // Test connection to Waha API
      const response = await fetch(`${config.apiUrl}/api/sessions/${config.sessionName}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(config.apiKey && { 'X-Api-Key': config.apiKey })
        }
      });

      if (response.ok) {
        const data = await response.json();
        const isConnected = data.status === 'WORKING' || data.status === 'ACTIVE';
        
        setConfig(prev => ({
          ...prev,
          connectionStatus: isConnected ? 'connected' : 'disconnected',
          lastTested: new Date().toISOString()
        }));

        toast({
          title: isConnected ? 'Connection Successful!' : 'Session Not Active',
          description: isConnected 
            ? 'WhatsApp session is active and ready to send messages.'
            : 'Please scan QR code to activate the session.',
          variant: isConnected ? 'default' : 'destructive',
        });
      } else {
        throw new Error('Connection failed');
      }
    } catch (error) {
      setConfig(prev => ({
        ...prev,
        connectionStatus: 'error',
        lastTested: new Date().toISOString()
      }));

      toast({
        title: 'Connection Failed',
        description: 'Could not connect to Waha API. Please check your settings.',
        variant: 'destructive',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const sendTestMessage = async () => {
    if (!testPhoneNumber) {
      toast({
        title: 'Phone Number Required',
        description: 'Please enter a phone number to send test message.',
        variant: 'destructive',
      });
      return;
    }

    if (config.connectionStatus !== 'connected') {
      toast({
        title: 'Not Connected',
        description: 'Please test connection first before sending messages.',
        variant: 'destructive',
      });
      return;
    }

    setIsTesting(true);

    try {
      // Format phone number for WhatsApp (remove + and add @c.us)
      const formattedPhone = testPhoneNumber.replace(/[^0-9]/g, '') + '@c.us';

      const response = await fetch(`${config.apiUrl}/api/sendText`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.apiKey && { 'X-Api-Key': config.apiKey })
        },
        body: JSON.stringify({
          session: config.sessionName,
          chatId: formattedPhone,
          text: `🧪 *Test Message from ${selectedWorkspace?.name || 'Zervos'}*\n\nYour WhatsApp E-Bill system is working perfectly! ✅\n\nYou'll receive your bills automatically via WhatsApp.`
        })
      });

      if (response.ok) {
        toast({
          title: 'Test Message Sent!',
          description: `Test message delivered to ${testPhoneNumber}`,
        });
        setTestPhoneNumber('');
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      toast({
        title: 'Failed to Send',
        description: 'Could not send test message. Please check your configuration.',
        variant: 'destructive',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const getStatusBadge = () => {
    switch (config.connectionStatus) {
      case 'connected':
        return (
          <Badge className="bg-green-500">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Connected
          </Badge>
        );
      case 'disconnected':
        return (
          <Badge variant="outline" className="border-orange-500 text-orange-600">
            <AlertCircle className="h-3 w-3 mr-1" />
            Disconnected
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Error
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <AlertCircle className="h-3 w-3 mr-1" />
            Unknown
          </Badge>
        );
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/dashboard/admin')}
              className="gap-2"
            >
              <ArrowLeft size={18} />
              Back to Admin Center
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <MessageCircle className="h-8 w-8 text-green-600" />
                WhatsApp E-Bill Settings
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Configure WhatsApp integration for sending bills automatically
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {getStatusBadge()}
            <Button
              onClick={saveConfig}
              disabled={isSaving}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Main Configuration */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Configuration */}
          <div className="lg:col-span-2 space-y-6">
            {/* Enable WhatsApp */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-green-600" />
                  Enable WhatsApp Integration
                </CardTitle>
                <CardDescription>
                  Turn on to start sending E-Bills via WhatsApp
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${config.enabled ? 'bg-green-600' : 'bg-gray-400'}`}>
                      <MessageCircle className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">WhatsApp E-Bills</p>
                      <p className="text-sm text-gray-600">
                        {config.enabled ? 'Customers will receive bills via WhatsApp' : 'Currently disabled'}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={config.enabled}
                    onCheckedChange={(checked) => setConfig({ ...config, enabled: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Waha API Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5 text-blue-600" />
                  Waha API Configuration
                </CardTitle>
                <CardDescription>
                  Connect to your Waha (WhatsApp HTTP API) server
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="apiUrl" className="flex items-center gap-2">
                    <Server className="h-4 w-4" />
                    API URL *
                  </Label>
                  <Input
                    id="apiUrl"
                    placeholder="http://localhost:3000"
                    value={config.apiUrl}
                    onChange={(e) => setConfig({ ...config, apiUrl: e.target.value })}
                  />
                  <p className="text-xs text-gray-500">
                    Your Waha server endpoint (e.g., http://localhost:3000 or https://your-waha-server.com)
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sessionName" className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Session Name *
                    </Label>
                    <Input
                      id="sessionName"
                      placeholder="default"
                      value={config.sessionName}
                      onChange={(e) => setConfig({ ...config, sessionName: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber" className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      WhatsApp Number *
                    </Label>
                    <Input
                      id="phoneNumber"
                      placeholder="+919035101333"
                      value={config.phoneNumber}
                      onChange={(e) => setConfig({ ...config, phoneNumber: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apiKey" className="flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    API Key (Optional)
                  </Label>
                  <div className="relative">
                    <Input
                      id="apiKey"
                      type={showApiKey ? 'text' : 'password'}
                      placeholder="Enter your API key if required"
                      value={config.apiKey}
                      onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Only needed if your Waha server requires authentication
                  </p>
                </div>

                <Button
                  onClick={testConnection}
                  disabled={isTesting}
                  variant="outline"
                  className="w-full"
                >
                  {isTesting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Testing Connection...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Test Connection
                    </>
                  )}
                </Button>

                {config.lastTested && (
                  <p className="text-xs text-gray-500 text-center">
                    Last tested: {new Date(config.lastTested).toLocaleString()}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Bill Template */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-purple-600" />
                  E-Bill Message Template
                </CardTitle>
                <CardDescription>
                  Customize the WhatsApp message format for bills
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="template">Message Template</Label>
                  <Textarea
                    id="template"
                    rows={12}
                    value={config.billTemplate}
                    onChange={(e) => setConfig({ ...config, billTemplate: e.target.value })}
                    className="font-mono text-sm"
                  />
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-sm text-blue-900 mb-2">Available Variables:</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs text-blue-700">
                    <code>{'{{businessName}}'}</code>
                    <code>{'{{invoiceNumber}}'}</code>
                    <code>{'{{date}}'}</code>
                    <code>{'{{time}}'}</code>
                    <code>{'{{items}}'}</code>
                    <code>{'{{subtotal}}'}</code>
                    <code>{'{{discount}}'}</code>
                    <code>{'{{tax}}'}</code>
                    <code>{'{{total}}'}</code>
                    <code>{'{{paymentMethod}}'}</code>
                    <code>{'{{phone}}'}</code>
                    <code>{'{{address}}'}</code>
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={() => setConfig({ ...config, billTemplate: DEFAULT_TEMPLATE })}
                  className="w-full"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reset to Default Template
                </Button>
              </CardContent>
            </Card>

            {/* Additional Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-gray-600" />
                  Additional Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Auto-Send Bills</p>
                    <p className="text-xs text-gray-600">Automatically send bills after payment</p>
                  </div>
                  <Switch
                    checked={config.autoSendBills}
                    onCheckedChange={(checked) => setConfig({ ...config, autoSendBills: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Test Mode</p>
                    <p className="text-xs text-gray-600">Show test notifications for debugging</p>
                  </div>
                  <Switch
                    checked={config.testMode}
                    onCheckedChange={(checked) => setConfig({ ...config, testMode: checked })}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Info & Test */}
          <div className="space-y-6">
            {/* Status Card */}
            <Card className="border-2 border-green-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  Connection Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  {config.connectionStatus === 'connected' ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-3"
                    >
                      <CheckCircle2 className="h-10 w-10 text-green-600" />
                    </motion.div>
                  ) : (
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-3">
                      <XCircle className="h-10 w-10 text-gray-400" />
                    </div>
                  )}
                  <h3 className="font-bold text-lg">
                    {config.connectionStatus === 'connected' ? 'Connected' : 'Not Connected'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {config.connectionStatus === 'connected'
                      ? 'Ready to send WhatsApp messages'
                      : 'Please configure and test connection'}
                  </p>
                </div>

                {config.enabled && config.connectionStatus === 'connected' && (
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200 text-center">
                    <Bell className="h-5 w-5 text-green-600 mx-auto mb-1" />
                    <p className="text-xs text-green-700 font-medium">
                      E-Bills will be sent to customers automatically
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Test Message */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Send className="h-5 w-5 text-blue-600" />
                  Send Test Message
                </CardTitle>
                <CardDescription>
                  Test your WhatsApp integration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="testPhone">Test Phone Number</Label>
                  <Input
                    id="testPhone"
                    placeholder="+91 9876543210"
                    value={testPhoneNumber}
                    onChange={(e) => setTestPhoneNumber(e.target.value)}
                  />
                </div>
                <Button
                  onClick={sendTestMessage}
                  disabled={isTesting || config.connectionStatus !== 'connected'}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {isTesting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Test Message
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Security Info */}
            <Card className="bg-amber-50 border-amber-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lock className="h-5 w-5 text-amber-600" />
                  Security & Privacy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-amber-900">
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>All settings stored locally in your browser</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Customer phone numbers are validated before sending</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Messages sent only with explicit user action</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>No data shared with third parties</span>
                </div>
              </CardContent>
            </Card>

            {/* Setup Guide */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-indigo-600" />
                  Quick Setup Guide
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Install Waha</p>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded mt-1 block">
                      docker run -p 3000:3000 devlikeapro/waha
                    </code>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Scan QR Code</p>
                    <p className="text-xs text-gray-600">Open http://localhost:3000/dashboard</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Configure Settings</p>
                    <p className="text-xs text-gray-600">Enter API URL and test connection</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                    4
                  </div>
                  <div>
                    <p className="font-medium">Start Sending!</p>
                    <p className="text-xs text-gray-600">Bills will be sent via WhatsApp</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
