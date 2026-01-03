import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Send,
  Plus,
  Calendar,
  Users,
  TrendingUp,
  MessageCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Trash2,
  Edit,
  Play,
  Pause,
  Filter,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { wabaService, BroadcastMessage, MessageTemplate } from '@/lib/waba-service';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function MarketingCampaignsPage() {
  const { selectedWorkspace } = useWorkspace();
  const { toast } = useToast();

  const [broadcasts, setBroadcasts] = useState<BroadcastMessage[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [sending, setSending] = useState(false);

  const [newBroadcast, setNewBroadcast] = useState({
    name: '',
    templateName: '',
    templateLanguage: 'en',
    targetAudience: 'all' as 'all' | 'customers' | 'custom',
    customPhones: '',
  });

  useEffect(() => {
    loadData();
    loadTemplates();
  }, [selectedWorkspace]);

  const loadData = () => {
    // Load broadcasts
    const workspaceId = typeof selectedWorkspace === 'object' ? selectedWorkspace?.id : selectedWorkspace || 'default';
    const savedBroadcasts = wabaService.getBroadcasts(workspaceId);
    setBroadcasts(savedBroadcasts);

    // Load customers
    const savedCustomers = JSON.parse(localStorage.getItem('zervos_customers') || '[]');
    setCustomers(savedCustomers);
  };

  const loadTemplates = async () => {
    setLoadingTemplates(true);
    const workspaceId = typeof selectedWorkspace === 'object' ? selectedWorkspace?.id : selectedWorkspace || 'default';
    const result = await wabaService.getMessageTemplates(workspaceId);
    
    if (result.success) {
      setTemplates(result.templates.filter(t => t.status === 'APPROVED'));
    } else {
      toast({
        title: 'Failed to Load Templates',
        description: result.error || 'Could not fetch message templates',
        variant: 'destructive',
      });
    }
    setLoadingTemplates(false);
  };

  const handleCreateBroadcast = () => {
    if (!newBroadcast.name || !newBroadcast.templateName) {
      toast({
        title: 'Missing Information',
        description: 'Please provide campaign name and select a template',
        variant: 'destructive',
      });
      return;
    }

    let targetPhones: string[] = [];

    if (newBroadcast.targetAudience === 'all' || newBroadcast.targetAudience === 'customers') {
      targetPhones = customers
        .filter(c => c.phone)
        .map(c => c.phone);
    } else if (newBroadcast.targetAudience === 'custom') {
      targetPhones = newBroadcast.customPhones
        .split(',')
        .map(p => p.trim())
        .filter(p => p);
    }

    if (targetPhones.length === 0) {
      toast({
        title: 'No Recipients',
        description: 'Please select target audience or add phone numbers',
        variant: 'destructive',
      });
      return;
    }

    const broadcast: BroadcastMessage = {
      id: `bc_${Date.now()}`,
      name: newBroadcast.name,
      templateName: newBroadcast.templateName,
      templateLanguage: newBroadcast.templateLanguage,
      targetAudience: targetPhones,
      status: 'draft',
      sentCount: 0,
      deliveredCount: 0,
      readCount: 0,
      failedCount: 0,
      createdAt: new Date().toISOString(),
    };

    const workspaceId = typeof selectedWorkspace === 'object' ? selectedWorkspace?.id : selectedWorkspace || 'default';
    wabaService.saveBroadcast(broadcast, workspaceId);
    setBroadcasts([...broadcasts, broadcast]);

    toast({
      title: '✅ Campaign Created',
      description: `Campaign "${newBroadcast.name}" created with ${targetPhones.length} recipients`,
    });

    setShowCreateDialog(false);
    setNewBroadcast({
      name: '',
      templateName: '',
      templateLanguage: 'en',
      targetAudience: 'all',
      customPhones: '',
    });
  };

  const handleSendBroadcast = async (broadcast: BroadcastMessage) => {
    setSending(true);

    const workspaceId = typeof selectedWorkspace === 'object' ? selectedWorkspace?.id : selectedWorkspace || 'default';

    const updatedBroadcast = {
      ...broadcast,
      status: 'sending' as const,
    };
    wabaService.saveBroadcast(updatedBroadcast, workspaceId);
    setBroadcasts(broadcasts.map(b => b.id === broadcast.id ? updatedBroadcast : b));

    let sent = 0;
    let failed = 0;

    for (const phone of broadcast.targetAudience) {
      const result = await wabaService.sendTemplateMessage(
        phone,
        broadcast.templateName,
        broadcast.templateLanguage,
        undefined,
        workspaceId
      );

      if (result.success) {
        sent++;
      } else {
        failed++;
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const finalBroadcast = {
      ...broadcast,
      status: 'sent' as const,
      sentCount: sent,
      failedCount: failed,
      deliveredCount: sent, // Will be updated by webhook
    };

    wabaService.saveBroadcast(finalBroadcast, workspaceId);
    setBroadcasts(broadcasts.map(b => b.id === broadcast.id ? finalBroadcast : b));

    toast({
      title: '✅ Campaign Sent',
      description: `Sent ${sent} messages, ${failed} failed`,
    });

    setSending(false);
  };

  const handleDeleteBroadcast = (id: string) => {
    const workspaceId = typeof selectedWorkspace === 'object' ? selectedWorkspace?.id : selectedWorkspace || 'default';
    wabaService.deleteBroadcast(id, workspaceId);
    setBroadcasts(broadcasts.filter(b => b.id !== id));
    toast({
      title: 'Campaign Deleted',
      description: 'Campaign has been removed',
    });
  };

  const getStatusBadge = (status: BroadcastMessage['status']) => {
    const variants = {
      draft: { label: 'Draft', color: 'bg-slate-100 text-slate-700' },
      scheduled: { label: 'Scheduled', color: 'bg-blue-100 text-blue-700' },
      sending: { label: 'Sending', color: 'bg-yellow-100 text-yellow-700' },
      sent: { label: 'Sent', color: 'bg-green-100 text-green-700' },
      failed: { label: 'Failed', color: 'bg-red-100 text-red-700' },
    };

    const variant = variants[status];
    return (
      <Badge className={`${variant.color} border-0`}>
        {variant.label}
      </Badge>
    );
  };

  const stats = {
    totalCampaigns: broadcasts.length,
    activeCampaigns: broadcasts.filter(b => b.status === 'sending').length,
    totalSent: broadcasts.reduce((acc, b) => acc + b.sentCount, 0),
    totalReach: broadcasts.reduce((acc, b) => acc + b.targetAudience.length, 0),
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <MessageCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Marketing Campaigns</h1>
                <p className="text-sm text-slate-600">Create and send WhatsApp broadcast campaigns</p>
              </div>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Total Campaigns</p>
                    <p className="text-2xl font-bold text-slate-900">{stats.totalCampaigns}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Send className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Active</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.activeCampaigns}</p>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <Clock className="h-5 w-5 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Messages Sent</p>
                    <p className="text-2xl font-bold text-green-600">{stats.totalSent}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Total Reach</p>
                    <p className="text-2xl font-bold text-purple-600">{stats.totalReach}</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Users className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Campaigns List */}
        <Card>
          <CardHeader>
            <CardTitle>All Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            {broadcasts.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 mb-2">No campaigns yet</p>
                <p className="text-sm text-slate-500 mb-4">Create your first marketing campaign to reach customers</p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Campaign
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {broadcasts.map((broadcast) => (
                  <motion.div
                    key={broadcast.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-slate-900">{broadcast.name}</h3>
                          {getStatusBadge(broadcast.status)}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                          <div>
                            <p className="text-slate-600">Template</p>
                            <p className="font-medium text-slate-900">{broadcast.templateName}</p>
                          </div>
                          <div>
                            <p className="text-slate-600">Recipients</p>
                            <p className="font-medium text-slate-900">{broadcast.targetAudience.length}</p>
                          </div>
                          <div>
                            <p className="text-slate-600">Sent</p>
                            <p className="font-medium text-green-600">{broadcast.sentCount}</p>
                          </div>
                          <div>
                            <p className="text-slate-600">Failed</p>
                            <p className="font-medium text-red-600">{broadcast.failedCount}</p>
                          </div>
                        </div>
                        <p className="text-xs text-slate-500">
                          Created {new Date(broadcast.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {broadcast.status === 'draft' && (
                          <Button
                            size="sm"
                            onClick={() => handleSendBroadcast(broadcast)}
                            disabled={sending}
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Send Now
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteBroadcast(broadcast.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Campaign Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Marketing Campaign</DialogTitle>
              <DialogDescription>
                Send promotional messages to your customers using approved templates
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="campaignName">Campaign Name *</Label>
                <Input
                  id="campaignName"
                  placeholder="e.g., Weekend Sale, New Year Offer"
                  value={newBroadcast.name}
                  onChange={(e) => setNewBroadcast({ ...newBroadcast, name: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="template">Message Template *</Label>
                <Select
                  value={newBroadcast.templateName}
                  onValueChange={(value) => setNewBroadcast({ ...newBroadcast, templateName: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select approved template" />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingTemplates ? (
                      <SelectItem value="loading" disabled>Loading templates...</SelectItem>
                    ) : templates.length === 0 ? (
                      <SelectItem value="none" disabled>No approved templates found</SelectItem>
                    ) : (
                      templates.map((template) => (
                        <SelectItem key={template.id} value={template.name}>
                          {template.name} ({template.category})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500 mt-1">
                  Only Meta-approved templates are shown. Create templates in Meta Business Suite.
                </p>
              </div>

              <div>
                <Label htmlFor="audience">Target Audience *</Label>
                <Select
                  value={newBroadcast.targetAudience}
                  onValueChange={(value: any) => setNewBroadcast({ ...newBroadcast, targetAudience: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Customers ({customers.filter(c => c.phone).length})</SelectItem>
                    <SelectItem value="customers">Active Customers Only</SelectItem>
                    <SelectItem value="custom">Custom Phone Numbers</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newBroadcast.targetAudience === 'custom' && (
                <div>
                  <Label htmlFor="customPhones">Phone Numbers</Label>
                  <Textarea
                    id="customPhones"
                    placeholder="Enter phone numbers separated by commas&#10;e.g., 9876543210, 9123456789"
                    value={newBroadcast.customPhones}
                    onChange={(e) => setNewBroadcast({ ...newBroadcast, customPhones: e.target.value })}
                    className="mt-1"
                    rows={4}
                  />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateBroadcast}>
                <Plus className="h-4 w-4 mr-2" />
                Create Campaign
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
