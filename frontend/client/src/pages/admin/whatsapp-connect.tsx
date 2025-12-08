import DashboardLayout from '@/components/DashboardLayout';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useToast } from '@/hooks/use-toast';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  Loader2,
  MessageCircle,
  Phone,
  QrCode,
  RefreshCw,
  Shield,
  Smartphone,
  Trash2,
  Wifi,
  WifiOff,
  XCircle,
  Zap
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'wouter';

interface ConnectionStatus {
  status: 'WORKING' | 'SCAN_QR_CODE' | 'STARTING' | 'STOPPED' | 'FAILED';
  qr?: string;
  phoneNumber?: string;
  connectedAt?: string;
}

export default function WhatsAppConnect() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { selectedWorkspace } = useWorkspace();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);
  const [uptime, setUptime] = useState<string>('');

  // Get config from localStorage or use defaults
  const getConfig = useCallback(() => {
    try {
      const workspaceId = selectedWorkspace?.id || 'default';
      const saved = localStorage.getItem(`whatsapp_config_${workspaceId}`);
      
      // If saved config exists, use it
      if (saved) {
        const config = JSON.parse(saved);
        if (config.apiUrl && config.sessionName) {
          return config;
        }
      }
      
      // Return default configuration for Waha Docker
      return {
        enabled: true,
        apiUrl: 'http://localhost:3000',
        sessionName: 'default',
        apiKey: 'ac451f3117ed43c19ac0f38b3bd52d66',
        phoneNumber: '',
        autoSendBills: false,
        billTemplate: '',
        testMode: false
      };
    } catch {
      // Fallback to default config
      return {
        enabled: true,
        apiUrl: 'http://localhost:3000',
        sessionName: 'default',
        apiKey: '4da0af17dffc40119c39a3ba30e0771e',
        phoneNumber: '',
        autoSendBills: false,
        billTemplate: '',
        testMode: false
      };
    }
  }, [selectedWorkspace]);

  // Fetch session status
  const fetchStatus = useCallback(async () => {
    const config = getConfig();
    if (!config) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${config.apiUrl}/api/sessions/${config.sessionName}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(config.apiKey && { 'X-Api-Key': config.apiKey })
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📱 Session status:', data.status);
        console.log('📱 QR in response:', data.qr ? 'Yes' : 'No');
        
        let qrCode = data.qr;
        
        // If status is SCAN_QR_CODE, try to get QR code from multiple sources
        if (data.status === 'SCAN_QR_CODE') {
          // First, try the auth QR endpoint (returns PNG image)
          if (!qrCode) {
            try {
              const qrResponse = await fetch(
                `${config.apiUrl}/api/${config.sessionName}/auth/qr`,
                {
                  headers: {
                    ...(config.apiKey && { 'X-Api-Key': config.apiKey })
                  }
                }
              );
              
              if (qrResponse.ok) {
                // The endpoint returns a PNG image, not JSON
                const blob = await qrResponse.blob();
                qrCode = URL.createObjectURL(blob);
                console.log('📱 Got QR image from auth endpoint');
              }
            } catch (err) {
              console.error('Could not fetch QR from auth endpoint:', err);
            }
          }
          
          // If still no QR, try screenshot endpoint
          if (!qrCode) {
            try {
              const screenshotResponse = await fetch(
                `${config.apiUrl}/api/screenshot?session=${config.sessionName}`,
                {
                  headers: {
                    ...(config.apiKey && { 'X-Api-Key': config.apiKey })
                  }
                }
              );
              
              if (screenshotResponse.ok) {
                const blob = await screenshotResponse.blob();
                qrCode = URL.createObjectURL(blob);
                console.log('📱 Got QR from screenshot endpoint');
              }
            } catch (err) {
              console.error('Could not fetch screenshot:', err);
            }
          }
          
          // If we have a QR code text string, convert it to QR image using a library
          if (qrCode && typeof qrCode === 'string' && !qrCode.startsWith('blob:') && !qrCode.startsWith('data:image')) {
            console.log('📱 Converting QR text to image, length:', qrCode.length);
            // QR is a text string, generate QR code image using qrcode library
            try {
              const QRCode = (await import('qrcode')).default;
              const qrDataUrl = await QRCode.toDataURL(qrCode, {
                width: 400,
                margin: 2,
                color: {
                  dark: '#000000',
                  light: '#FFFFFF'
                }
              });
              qrCode = qrDataUrl;
              console.log('✅ QR code image generated');
            } catch (err) {
              console.error('❌ Failed to generate QR image:', err);
            }
          }
        }
        
        console.log('📱 Final QR code type:', qrCode ? (qrCode.startsWith('data:') ? 'data-url' : qrCode.startsWith('blob:') ? 'blob' : 'string') : 'none');
        
        setConnectionStatus({
          status: data.status || 'STOPPED',
          qr: qrCode,
          phoneNumber: data.me?.id?.split('@')[0],
          connectedAt: data.me?.connectedAt
        });
      } else {
        setConnectionStatus({ status: 'STOPPED' });
      }
    } catch (error) {
      console.error('Error fetching status:', error);
      setConnectionStatus({ status: 'FAILED' });
    } finally {
      setIsLoading(false);
    }
  }, [getConfig]);

  // Start session
  const startSession = useCallback(async () => {
    const config = getConfig();
    setIsLoading(true);
    
    try {
      // First, try to get existing session status
      const statusResponse = await fetch(`${config.apiUrl}/api/sessions/${config.sessionName}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(config.apiKey && { 'X-Api-Key': config.apiKey })
        }
      });

      // If session already exists, restart it
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        
        // If already working, just refresh
        if (statusData.status === 'WORKING') {
          toast({
            title: 'Session Active',
            description: 'WhatsApp session is already running',
          });
          await fetchStatus();
          setIsLoading(false);
          return;
        }

        // Stop existing session first
        await fetch(`${config.apiUrl}/api/sessions/${config.sessionName}/stop`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(config.apiKey && { 'X-Api-Key': config.apiKey })
          }
        });

        // Wait before restarting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Start new session
      const response = await fetch(`${config.apiUrl}/api/sessions/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.apiKey && { 'X-Api-Key': config.apiKey })
        },
        body: JSON.stringify({
          name: config.sessionName,
          config: {
            webhooks: [],
            proxy: null
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to start session';
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      toast({
        title: '✅ Session Started',
        description: 'Scan the QR code with your WhatsApp mobile app',
      });
      
      // Wait a bit for QR to generate, then fetch status
      await new Promise(resolve => setTimeout(resolve, 2000));
      await fetchStatus();
      
    } catch (error: any) {
      console.error('Start session error:', error);
      
      let errorMessage = 'Could not start WhatsApp session';
      if (error.message.includes('ECONNREFUSED') || error.message.includes('Failed to fetch')) {
        errorMessage = 'Cannot connect to Waha server. Make sure it is running at ' + config.apiUrl;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: '❌ Failed to Start',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [getConfig, fetchStatus, toast]);

  // Delete session
  const deleteSession = async () => {
    const config = getConfig();
    if (!config) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`${config.apiUrl}/api/sessions/${config.sessionName}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(config.apiKey && { 'X-Api-Key': config.apiKey })
        }
      });

      if (response.ok) {
        toast({
          title: 'Session Deleted',
          description: 'WhatsApp connection has been removed.',
        });
        setConnectionStatus(null);
        setShowDeleteDialog(false);
      } else {
        throw new Error('Failed to delete');
      }
    } catch (error) {
      toast({
        title: 'Delete Failed',
        description: 'Could not delete WhatsApp session',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Restart session
  const restartSession = async () => {
    setIsRestarting(true);
    const config = getConfig();
    if (!config) {
      setIsRestarting(false);
      return;
    }

    try {
      // First, try to stop the session
      try {
        await fetch(`${config.apiUrl}/api/sessions/${config.sessionName}/stop`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(config.apiKey && { 'X-Api-Key': config.apiKey })
          }
        });
      } catch (e) {
        console.log('Stop session failed (might not exist):', e);
      }

      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Delete the session completely
      try {
        await fetch(`${config.apiUrl}/api/sessions/${config.sessionName}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            ...(config.apiKey && { 'X-Api-Key': config.apiKey })
          }
        });
      } catch (e) {
        console.log('Delete session failed (might not exist):', e);
      }

      // Wait before creating new session
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Start fresh session
      await startSession();

      toast({
        title: '✅ Session Restarted',
        description: 'Please scan the new QR code with WhatsApp',
      });
    } catch (error: any) {
      console.error('Restart error:', error);
      toast({
        title: '❌ Restart Failed',
        description: error.message || 'Could not restart WhatsApp session',
        variant: 'destructive',
      });
    } finally {
      setIsRestarting(false);
    }
  };

  // Auto-refresh status every 5 seconds
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  // Calculate uptime
  useEffect(() => {
    if (connectionStatus?.connectedAt) {
      const updateUptime = () => {
        const connected = new Date(connectionStatus.connectedAt!);
        const now = new Date();
        const diff = now.getTime() - connected.getTime();
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours > 0) {
          setUptime(`${hours}h ${minutes}m`);
        } else {
          setUptime(`${minutes}m`);
        }
      };

      updateUptime();
      const interval = setInterval(updateUptime, 60000); // Update every minute
      return () => clearInterval(interval);
    }
  }, [connectionStatus?.connectedAt]);

  const getStatusInfo = () => {
    if (!connectionStatus) {
      return {
        icon: WifiOff,
        color: 'text-gray-500',
        bg: 'bg-gray-100',
        text: 'Not Started',
        description: 'Click "Start Session" to begin'
      };
    }

    switch (connectionStatus.status) {
      case 'WORKING':
        return {
          icon: CheckCircle2,
          color: 'text-green-600',
          bg: 'bg-green-100',
          text: 'Connected',
          description: 'WhatsApp is ready to send messages'
        };
      case 'SCAN_QR_CODE':
        return {
          icon: QrCode,
          color: 'text-blue-600',
          bg: 'bg-blue-100',
          text: 'Scan QR Code',
          description: 'Open WhatsApp and scan the code'
        };
      case 'STARTING':
        return {
          icon: Loader2,
          color: 'text-yellow-600',
          bg: 'bg-yellow-100',
          text: 'Starting',
          description: 'Initializing WhatsApp session...'
        };
      case 'STOPPED':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bg: 'bg-red-100',
          text: 'Stopped',
          description: 'Session is not active'
        };
      case 'FAILED':
        return {
          icon: AlertCircle,
          color: 'text-red-600',
          bg: 'bg-red-100',
          text: 'Failed',
          description: 'Connection failed, try restarting'
        };
      default:
        return {
          icon: WifiOff,
          color: 'text-gray-500',
          bg: 'bg-gray-100',
          text: 'Unknown',
          description: 'Status unavailable'
        };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;
  const isConnected = connectionStatus?.status === 'WORKING';
  const hasQR = connectionStatus?.status === 'SCAN_QR_CODE' && connectionStatus.qr;

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/dashboard/admin/whatsapp')}
              className="gap-2"
            >
              <ArrowLeft size={18} />
              Back to Settings
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <MessageCircle className="h-8 w-8 text-green-600" />
                WhatsApp Connection
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Scan QR code to connect your WhatsApp Business account
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto grid gap-6 lg:grid-cols-3">
          {/* Main QR Card */}
          <div className="lg:col-span-2">
            <Card className="border-2 shadow-xl">
              <CardHeader className="border-b bg-gradient-to-r from-green-50 to-emerald-50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <QrCode className="h-6 w-6 text-green-600" />
                      Connection QR Code
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Scan this with your WhatsApp to connect
                    </CardDescription>
                  </div>
                  <div className={`px-4 py-2 rounded-full ${statusInfo.bg} flex items-center gap-2`}>
                    <StatusIcon className={`h-5 w-5 ${statusInfo.color} ${connectionStatus?.status === 'STARTING' ? 'animate-spin' : ''}`} />
                    <span className={`font-semibold ${statusInfo.color}`}>{statusInfo.text}</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-8">
                <AnimatePresence mode="wait">
                  {isLoading ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center py-20"
                    >
                      <Loader2 className="h-16 w-16 text-green-600 animate-spin mb-4" />
                      <p className="text-gray-600">Loading session...</p>
                    </motion.div>
                  ) : hasQR ? (
                    <motion.div
                      key="qr"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="flex flex-col items-center"
                    >
                      <div className="relative p-8 bg-white rounded-2xl shadow-2xl border-4 border-green-200">
                        <img 
                          src={connectionStatus.qr} 
                          alt="WhatsApp QR Code"
                          className="w-80 h-80"
                        />
                        <div className="absolute -top-3 -right-3 bg-green-500 rounded-full p-2">
                          <Smartphone className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      
                      <div className="mt-8 text-center max-w-md">
                        <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
                          <Smartphone className="h-5 w-5 text-green-600" />
                          How to Connect
                        </h3>
                        <ol className="text-left space-y-2 text-sm text-gray-600">
                          <li className="flex items-start gap-2">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold text-xs">1</span>
                            <span>Open WhatsApp on your phone</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold text-xs">2</span>
                            <span>Tap Menu (⋮) → Linked Devices</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold text-xs">3</span>
                            <span>Tap "Link a Device"</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold text-xs">4</span>
                            <span>Point your phone at this screen to scan</span>
                          </li>
                        </ol>
                      </div>
                    </motion.div>
                  ) : isConnected ? (
                    <motion.div
                      key="connected"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="flex flex-col items-center py-12"
                    >
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="w-32 h-32 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center mb-6"
                      >
                        <CheckCircle2 className="h-16 w-16 text-white" />
                      </motion.div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">Successfully Connected!</h3>
                      <p className="text-gray-600 mb-6">Your WhatsApp is ready to send messages</p>
                      
                      {connectionStatus.phoneNumber && (
                        <div className="flex items-center gap-2 px-6 py-3 bg-green-50 rounded-full border-2 border-green-200">
                          <Phone className="h-5 w-5 text-green-600" />
                          <span className="font-mono font-bold text-green-700">
                            +{connectionStatus.phoneNumber}
                          </span>
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="not-started"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center py-20"
                    >
                      <div className="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center mb-6">
                        <QrCode className="h-16 w-16 text-gray-400" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">No Active Session</h3>
                      <p className="text-gray-600 mb-6">Start a new session to get QR code</p>
                      <Button
                        onClick={startSession}
                        disabled={isLoading}
                        size="lg"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Starting...
                          </>
                        ) : (
                          <>
                            <Zap className="mr-2 h-5 w-5" />
                            Start Session
                          </>
                        )}
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Action Buttons */}
                {connectionStatus && connectionStatus.status !== 'STARTING' && (
                  <div className="mt-8 flex gap-3 justify-center">
                    <Button
                      onClick={restartSession}
                      disabled={isRestarting || isLoading}
                      variant="outline"
                      className="gap-2"
                    >
                      {isRestarting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Restarting...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4" />
                          Restart Session
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => setShowDeleteDialog(true)}
                      disabled={isDeleting || isLoading}
                      variant="outline"
                      className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Session
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Status Sidebar */}
          <div className="space-y-6">
            {/* Connection Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Wifi className="h-5 w-5 text-green-600" />
                  Connection Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Status</span>
                  <Badge className={statusInfo.bg}>
                    <StatusIcon className={`h-3 w-3 mr-1 ${statusInfo.color}`} />
                    <span className={statusInfo.color}>{statusInfo.text}</span>
                  </Badge>
                </div>

                {isConnected && connectionStatus.phoneNumber && (
                  <>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Phone Number</span>
                      <span className="text-sm font-mono font-bold text-gray-900">
                        +{connectionStatus.phoneNumber}
                      </span>
                    </div>

                    {uptime && (
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600">Uptime</span>
                        <span className="text-sm font-bold text-gray-900 flex items-center gap-1">
                          <Clock className="h-4 w-4 text-green-600" />
                          {uptime}
                        </span>
                      </div>
                    )}
                  </>
                )}

                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-800">{statusInfo.description}</p>
                </div>
              </CardContent>
            </Card>

            {/* Features Card */}
            <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  What You Can Do
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Send bills and invoices automatically</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Send appointment reminders</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Notify customers about bookings</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Send vendor management updates</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Broadcast messages to customers</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Send payment confirmations</span>
                </div>
              </CardContent>
            </Card>

            {/* Security Note */}
            <Card className="border-amber-200 bg-amber-50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                  Important
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-amber-900 space-y-2">
                <p>• Use WhatsApp Business account for best results</p>
                <p>• QR code expires after 2 minutes</p>
                <p>• Connection persists until you delete it</p>
                <p>• Only scan with your business number</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                Delete WhatsApp Session?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This will disconnect your WhatsApp and remove all session data. You'll need to scan the QR code again to reconnect. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={deleteSession}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Session
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
