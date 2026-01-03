import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  Bell,
  Shield,
  Database,
  Globe,
  Mail,
  MessageSquare,
  Key,
  Server,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Save,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  Zap,
  Lock,
  Unlock,
  Power,
  Clock,
  Users,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SuperAdminLayout from '../components/SuperAdminLayout';
import { useSuperAdmin } from '../contexts/SuperAdminContext';
import { useToast } from '@/hooks/use-toast';

const SystemSettings = () => {
  const { theme, stats } = useSuperAdmin();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  // Settings state
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    newRegistrations: true,
    twoFactorRequired: false,
    emailNotifications: true,
    smsNotifications: true,
    whatsappNotifications: true,
    autoBackup: true,
    backupFrequency: 'daily',
    maxFileSize: '50',
    sessionTimeout: '30',
    passwordExpiry: '90',
    maxLoginAttempts: '5',
    apiRateLimit: '1000',
    smtpHost: 'smtp.zervos.com',
    smtpPort: '587',
    smtpUser: 'noreply@zervos.com',
    whatsappApiKey: 'waba_xxxxxxxxxxxxx',
    razorpayKey: 'rzp_live_xxxxxxxxxxxxxx',
    googleAnalyticsId: 'G-XXXXXXXXXX',
  });

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSaving(false);
    toast({
      title: '✅ Settings Saved',
      description: 'System settings have been updated successfully',
    });
  };

  const toggleMaintenanceMode = () => {
    setSettings(prev => ({ ...prev, maintenanceMode: !prev.maintenanceMode }));
    toast({
      title: settings.maintenanceMode ? '🟢 System Online' : '🟠 Maintenance Mode Enabled',
      description: settings.maintenanceMode 
        ? 'System is now accessible to all users' 
        : 'Only admins can access the system',
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: '📋 Copied',
      description: 'Copied to clipboard',
    });
  };

  const systemHealth = {
    database: 'healthy',
    api: 'healthy',
    storage: 'healthy',
    email: 'healthy',
    whatsapp: 'warning',
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className={`text-2xl lg:text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              System Settings
            </h1>
            <p className="text-slate-500 mt-1">
              Configure global system settings and integrations
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant={settings.maintenanceMode ? 'destructive' : 'outline'}
              onClick={toggleMaintenanceMode}
              className="gap-2"
            >
              {settings.maintenanceMode ? (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  Maintenance Mode ON
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  System Online
                </>
              )}
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white gap-2"
            >
              {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </Button>
          </div>
        </div>

        {/* System Health */}
        <Card className={`p-6 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
          <h3 className={`font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            System Health
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {Object.entries(systemHealth).map(([service, status]) => (
              <div
                key={service}
                className={`p-4 rounded-xl ${
                  status === 'healthy' 
                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                    : status === 'warning'
                    ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                    : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {status === 'healthy' ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : status === 'warning' ? (
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  )}
                  <span className={`capitalize font-medium ${
                    status === 'healthy' ? 'text-green-700 dark:text-green-400' :
                    status === 'warning' ? 'text-yellow-700 dark:text-yellow-400' :
                    'text-red-700 dark:text-red-400'
                  }`}>
                    {status}
                  </span>
                </div>
                <p className={`text-sm capitalize ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                  {service}
                </p>
              </div>
            ))}
          </div>
        </Card>

        {/* Settings Tabs */}
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className={`${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'} p-1`}>
            <TabsTrigger value="general" className="gap-2">
              <Settings className="w-4 h-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="w-4 h-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="integrations" className="gap-2">
              <Zap className="w-4 h-4" />
              Integrations
            </TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className={`p-6 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
                <h3 className={`font-semibold mb-4 flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  <Globe className="w-5 h-5" />
                  General Configuration
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className={theme === 'dark' ? 'text-slate-300' : ''}>New Registrations</Label>
                      <p className="text-sm text-slate-500">Allow new users to register</p>
                    </div>
                    <Switch
                      checked={settings.newRegistrations}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, newRegistrations: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className={theme === 'dark' ? 'text-slate-300' : ''}>Auto Backup</Label>
                      <p className="text-sm text-slate-500">Automatically backup database</p>
                    </div>
                    <Switch
                      checked={settings.autoBackup}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoBackup: checked }))}
                    />
                  </div>
                  <div>
                    <Label className={theme === 'dark' ? 'text-slate-300' : ''}>Backup Frequency</Label>
                    <Select 
                      value={settings.backupFrequency}
                      onValueChange={(value) => setSettings(prev => ({ ...prev, backupFrequency: value }))}
                    >
                      <SelectTrigger className={`mt-2 ${theme === 'dark' ? 'bg-slate-700 border-slate-600' : ''}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className={theme === 'dark' ? 'text-slate-300' : ''}>Max File Upload Size (MB)</Label>
                    <Input
                      type="number"
                      value={settings.maxFileSize}
                      onChange={(e) => setSettings(prev => ({ ...prev, maxFileSize: e.target.value }))}
                      className={`mt-2 ${theme === 'dark' ? 'bg-slate-700 border-slate-600' : ''}`}
                    />
                  </div>
                </div>
              </Card>

              <Card className={`p-6 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
                <h3 className={`font-semibold mb-4 flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  <Database className="w-5 h-5" />
                  System Information
                </h3>
                <div className="space-y-4">
                  <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-500">Total Clients</span>
                      <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        {stats.totalClients}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-500">Active Subscriptions</span>
                      <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        {stats.activeSubscriptions}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">Database Size</span>
                      <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        2.4 GB
                      </span>
                    </div>
                  </div>
                  <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-500">Version</span>
                      <Badge>v2.5.0</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">Last Updated</span>
                      <span className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                        Dec 30, 2024
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className={`p-6 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
                <h3 className={`font-semibold mb-4 flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  <Lock className="w-5 h-5" />
                  Authentication
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className={theme === 'dark' ? 'text-slate-300' : ''}>Require 2FA</Label>
                      <p className="text-sm text-slate-500">Mandatory for all users</p>
                    </div>
                    <Switch
                      checked={settings.twoFactorRequired}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, twoFactorRequired: checked }))}
                    />
                  </div>
                  <div>
                    <Label className={theme === 'dark' ? 'text-slate-300' : ''}>Session Timeout (minutes)</Label>
                    <Input
                      type="number"
                      value={settings.sessionTimeout}
                      onChange={(e) => setSettings(prev => ({ ...prev, sessionTimeout: e.target.value }))}
                      className={`mt-2 ${theme === 'dark' ? 'bg-slate-700 border-slate-600' : ''}`}
                    />
                  </div>
                  <div>
                    <Label className={theme === 'dark' ? 'text-slate-300' : ''}>Password Expiry (days)</Label>
                    <Input
                      type="number"
                      value={settings.passwordExpiry}
                      onChange={(e) => setSettings(prev => ({ ...prev, passwordExpiry: e.target.value }))}
                      className={`mt-2 ${theme === 'dark' ? 'bg-slate-700 border-slate-600' : ''}`}
                    />
                  </div>
                  <div>
                    <Label className={theme === 'dark' ? 'text-slate-300' : ''}>Max Login Attempts</Label>
                    <Input
                      type="number"
                      value={settings.maxLoginAttempts}
                      onChange={(e) => setSettings(prev => ({ ...prev, maxLoginAttempts: e.target.value }))}
                      className={`mt-2 ${theme === 'dark' ? 'bg-slate-700 border-slate-600' : ''}`}
                    />
                  </div>
                </div>
              </Card>

              <Card className={`p-6 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
                <h3 className={`font-semibold mb-4 flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  <Key className="w-5 h-5" />
                  API Configuration
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label className={theme === 'dark' ? 'text-slate-300' : ''}>API Rate Limit (per hour)</Label>
                    <Input
                      type="number"
                      value={settings.apiRateLimit}
                      onChange={(e) => setSettings(prev => ({ ...prev, apiRateLimit: e.target.value }))}
                      className={`mt-2 ${theme === 'dark' ? 'bg-slate-700 border-slate-600' : ''}`}
                    />
                  </div>
                  <div>
                    <Label className={theme === 'dark' ? 'text-slate-300' : ''}>Admin API Key</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        type={showApiKey ? 'text' : 'password'}
                        value="sk_live_xxxxxxxxxxxxxxxxxxxx"
                        readOnly
                        className={`${theme === 'dark' ? 'bg-slate-700 border-slate-600' : ''}`}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setShowApiKey(!showApiKey)}
                      >
                        {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard('sk_live_xxxxxxxxxxxxxxxxxxxx')}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Regenerate API Key
                  </Button>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications">
            <Card className={`p-6 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
              <h3 className={`font-semibold mb-4 flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                <Bell className="w-5 h-5" />
                Notification Channels
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Mail className="w-5 h-5 text-blue-600" />
                      <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        Email
                      </span>
                    </div>
                    <Switch
                      checked={settings.emailNotifications}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, emailNotifications: checked }))}
                    />
                  </div>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-slate-500">SMTP Host</Label>
                      <Input
                        value={settings.smtpHost}
                        onChange={(e) => setSettings(prev => ({ ...prev, smtpHost: e.target.value }))}
                        className={`mt-1 ${theme === 'dark' ? 'bg-slate-600 border-slate-500' : ''}`}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500">SMTP Port</Label>
                      <Input
                        value={settings.smtpPort}
                        onChange={(e) => setSettings(prev => ({ ...prev, smtpPort: e.target.value }))}
                        className={`mt-1 ${theme === 'dark' ? 'bg-slate-600 border-slate-500' : ''}`}
                      />
                    </div>
                  </div>
                </div>

                <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-green-600" />
                      <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        WhatsApp
                      </span>
                    </div>
                    <Switch
                      checked={settings.whatsappNotifications}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, whatsappNotifications: checked }))}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">API Key</Label>
                    <Input
                      type="password"
                      value={settings.whatsappApiKey}
                      onChange={(e) => setSettings(prev => ({ ...prev, whatsappApiKey: e.target.value }))}
                      className={`mt-1 ${theme === 'dark' ? 'bg-slate-600 border-slate-500' : ''}`}
                    />
                  </div>
                  <Badge className="mt-3 bg-yellow-100 text-yellow-700">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Check Connection
                  </Badge>
                </div>

                <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Bell className="w-5 h-5 text-purple-600" />
                      <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        SMS
                      </span>
                    </div>
                    <Switch
                      checked={settings.smsNotifications}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, smsNotifications: checked }))}
                    />
                  </div>
                  <p className="text-sm text-slate-500">
                    SMS notifications via Twilio integration
                  </p>
                  <Badge className="mt-3 bg-green-100 text-green-700">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Connected
                  </Badge>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Integrations Settings */}
          <TabsContent value="integrations">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className={`p-6 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
                <h3 className={`font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  Payment Gateway
                </h3>
                <div className="space-y-4">
                  <div className={`p-4 rounded-xl flex items-center justify-between ${
                    theme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-50'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                        <span className="text-white font-bold text-xs">R</span>
                      </div>
                      <div>
                        <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                          Razorpay
                        </p>
                        <p className="text-xs text-slate-500">Primary payment gateway</p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-700">Active</Badge>
                  </div>
                  <div>
                    <Label className={theme === 'dark' ? 'text-slate-300' : ''}>API Key</Label>
                    <Input
                      type="password"
                      value={settings.razorpayKey}
                      onChange={(e) => setSettings(prev => ({ ...prev, razorpayKey: e.target.value }))}
                      className={`mt-2 ${theme === 'dark' ? 'bg-slate-700 border-slate-600' : ''}`}
                    />
                  </div>
                </div>
              </Card>

              <Card className={`p-6 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
                <h3 className={`font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  Analytics
                </h3>
                <div className="space-y-4">
                  <div className={`p-4 rounded-xl flex items-center justify-between ${
                    theme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-50'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center">
                        <span className="text-white font-bold text-xs">G</span>
                      </div>
                      <div>
                        <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                          Google Analytics
                        </p>
                        <p className="text-xs text-slate-500">Website analytics</p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-700">Active</Badge>
                  </div>
                  <div>
                    <Label className={theme === 'dark' ? 'text-slate-300' : ''}>Measurement ID</Label>
                    <Input
                      value={settings.googleAnalyticsId}
                      onChange={(e) => setSettings(prev => ({ ...prev, googleAnalyticsId: e.target.value }))}
                      className={`mt-2 ${theme === 'dark' ? 'bg-slate-700 border-slate-600' : ''}`}
                    />
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </SuperAdminLayout>
  );
};

export default SystemSettings;
