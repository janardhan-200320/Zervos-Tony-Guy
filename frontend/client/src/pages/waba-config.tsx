import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import {
  MessageCircle,
  Save,
  TestTube,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Info,
  ExternalLink,
  Key,
  Phone,
  Shield,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { wabaService, WABAConfig } from '@/lib/waba-service';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function WABAConfigPage() {
  const { selectedWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const [config, setConfig] = useState<WABAConfig>({
    enabled: false,
    phoneNumberId: '',
    businessAccountId: '',
    accessToken: '',
    apiVersion: 'v18.0',
    webhookVerifyToken: '',
  });

  useEffect(() => {
    loadConfig();
  }, [selectedWorkspace]);

  const loadConfig = () => {
    const workspaceId = typeof selectedWorkspace === 'object' ? selectedWorkspace?.id : selectedWorkspace || 'default';
    const saved = localStorage.getItem(`waba_config_${workspaceId}`);
    if (saved) {
      setConfig(JSON.parse(saved));
      setConnectionStatus('success');
    }
  };

  const handleSave = () => {
    if (!config.phoneNumberId || !config.businessAccountId || !config.accessToken) {
      toast({
        title: 'Missing Required Fields',
        description: 'Please fill in Phone Number ID, Business Account ID, and Access Token',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const workspaceId = typeof selectedWorkspace === 'object' ? selectedWorkspace?.id : selectedWorkspace || 'default';
      wabaService.saveConfig(config, workspaceId);
      toast({
        title: '✅ Configuration Saved',
        description: 'WABA configuration has been saved successfully',
      });
      setConnectionStatus('success');
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: 'Failed to save configuration',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!config.phoneNumberId || !config.accessToken) {
      toast({
        title: 'Missing Credentials',
        description: 'Please fill in Phone Number ID and Access Token first',
        variant: 'destructive',
      });
      return;
    }

    setTesting(true);
    setConnectionStatus('idle');

    // Save temporarily for testing
    const workspaceId = typeof selectedWorkspace === 'object' ? selectedWorkspace?.id : selectedWorkspace || 'default';
    wabaService.saveConfig(config, workspaceId);

    const result = await wabaService.testConnection(workspaceId);

    if (result.success) {
      setConnectionStatus('success');
      toast({
        title: '✅ Connection Successful',
        description: result.message,
      });
    } else {
      setConnectionStatus('error');
      toast({
        title: '❌ Connection Failed',
        description: result.message,
        variant: 'destructive',
      });
    }

    setTesting(false);
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <MessageCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">WhatsApp Business API</h1>
              <p className="text-sm text-slate-600">Configure Meta-approved WABA for marketing campaigns</p>
            </div>
          </div>

          {connectionStatus === 'success' && (
            <Alert className="mt-4 border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                WABA is configured and ready to use for marketing campaigns
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Configuration Form */}
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                API Credentials
              </CardTitle>
              <CardDescription>
                Enter your Meta Cloud API credentials from Facebook Business Manager
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={config.enabled}
                    onCheckedChange={(checked) => setConfig({ ...config, enabled: checked })}
                  />
                  <div>
                    <Label className="font-medium">Enable WABA</Label>
                    <p className="text-xs text-slate-600">Turn on to use WhatsApp Business API</p>
                  </div>
                </div>
                <Badge variant={config.enabled ? 'default' : 'secondary'}>
                  {config.enabled ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phoneNumberId">Phone Number ID *</Label>
                  <Input
                    id="phoneNumberId"
                    placeholder="1234567890123456"
                    value={config.phoneNumberId}
                    onChange={(e) => setConfig({ ...config, phoneNumberId: e.target.value })}
                    className="mt-1"
                  />
                  <p className="text-xs text-slate-500 mt-1">From WhatsApp Business API settings</p>
                </div>

                <div>
                  <Label htmlFor="businessAccountId">Business Account ID *</Label>
                  <Input
                    id="businessAccountId"
                    placeholder="1234567890123456"
                    value={config.businessAccountId}
                    onChange={(e) => setConfig({ ...config, businessAccountId: e.target.value })}
                    className="mt-1"
                  />
                  <p className="text-xs text-slate-500 mt-1">WhatsApp Business Account ID</p>
                </div>
              </div>

              <div>
                <Label htmlFor="accessToken">Access Token *</Label>
                <Input
                  id="accessToken"
                  type="password"
                  placeholder="Enter your permanent access token"
                  value={config.accessToken}
                  onChange={(e) => setConfig({ ...config, accessToken: e.target.value })}
                  className="mt-1 font-mono text-sm"
                />
                <p className="text-xs text-slate-500 mt-1">System user permanent access token with whatsapp_business_messaging permission</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="apiVersion">API Version</Label>
                  <Input
                    id="apiVersion"
                    placeholder="v18.0"
                    value={config.apiVersion}
                    onChange={(e) => setConfig({ ...config, apiVersion: e.target.value })}
                    className="mt-1"
                  />
                  <p className="text-xs text-slate-500 mt-1">Meta Graph API version</p>
                </div>

                <div>
                  <Label htmlFor="webhookVerifyToken">Webhook Verify Token (Optional)</Label>
                  <Input
                    id="webhookVerifyToken"
                    placeholder="your_verify_token"
                    value={config.webhookVerifyToken}
                    onChange={(e) => setConfig({ ...config, webhookVerifyToken: e.target.value })}
                    className="mt-1"
                  />
                  <p className="text-xs text-slate-500 mt-1">For webhook verification</p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={handleSave} disabled={loading} className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Saving...' : 'Save Configuration'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={testing || !config.phoneNumberId || !config.accessToken}
                >
                  <TestTube className="h-4 w-4 mr-2" />
                  {testing ? 'Testing...' : 'Test Connection'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Setup Guide */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                How to Get Your Credentials
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Go to Meta Developer Portal</p>
                    <p className="text-sm text-slate-600">Visit developers.facebook.com and log in with your business account</p>
                    <a
                      href="https://developers.facebook.com/apps"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-1"
                    >
                      Open Meta Developer Portal <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                  <div className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Select Your App & Navigate to WhatsApp</p>
                    <p className="text-sm text-slate-600">Click on your app → WhatsApp → API Setup</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                  <div className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">
                    3
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Copy Phone Number ID</p>
                    <p className="text-sm text-slate-600">Find "Phone number ID" under your registered phone number</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                  <div className="bg-orange-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">
                    4
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Get Access Token</p>
                    <p className="text-sm text-slate-600">Generate a permanent access token from System Users in Business Settings</p>
                    <p className="text-xs text-orange-700 mt-1">⚠️ Token needs "whatsapp_business_messaging" permission</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-indigo-50 rounded-lg">
                  <div className="bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">
                    5
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Get Business Account ID</p>
                    <p className="text-sm text-slate-600">Found in WhatsApp Manager → Settings → Business Account ID</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                What You Can Do with WABA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                  <Phone className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-900">Broadcast Messages</p>
                    <p className="text-sm text-slate-600">Send promotional offers to multiple customers at once</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                  <Shield className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-900">Template Messages</p>
                    <p className="text-sm text-slate-600">Use Meta-approved message templates for marketing</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                  <MessageCircle className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-900">Campaign Analytics</p>
                    <p className="text-sm text-slate-600">Track message delivery, reads, and engagement</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                  <Zap className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-900">Customer Segmentation</p>
                    <p className="text-sm text-slate-600">Target specific customer groups for campaigns</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
