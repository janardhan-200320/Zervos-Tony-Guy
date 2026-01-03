import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Megaphone,
  Plus,
  Edit,
  Trash2,
  Send,
  Clock,
  CheckCircle,
  AlertTriangle,
  Info,
  XCircle,
  Eye,
  EyeOff,
  Calendar,
  Users,
  Filter,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import SuperAdminLayout from '../components/SuperAdminLayout';
import { useSuperAdmin, Announcement } from '../contexts/SuperAdminContext';
import { useToast } from '@/hooks/use-toast';

const Announcements = () => {
  const { announcements, createAnnouncement, theme, plans } = useSuperAdmin();
  const { toast } = useToast();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    type: 'info' as Announcement['type'],
    targetPlans: [] as string[],
    isActive: true,
    scheduledAt: '',
    expiresAt: '',
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'info': return <Info className="w-5 h-5 text-blue-600" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'success': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'critical': return <XCircle className="w-5 h-5 text-red-600" />;
      default: return <Megaphone className="w-5 h-5 text-slate-600" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'info': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200';
      case 'warning': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200';
      case 'success': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200';
      case 'critical': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getTypeBg = (type: string) => {
    switch (type) {
      case 'info': return 'border-l-blue-500';
      case 'warning': return 'border-l-yellow-500';
      case 'success': return 'border-l-green-500';
      case 'critical': return 'border-l-red-500';
      default: return 'border-l-slate-500';
    }
  };

  const filteredAnnouncements = filterType === 'all' 
    ? announcements 
    : announcements.filter(a => a.type === filterType);

  const handleCreateAnnouncement = () => {
    if (!newAnnouncement.title.trim() || !newAnnouncement.content.trim()) {
      toast({
        title: '⚠️ Missing Information',
        description: 'Please fill in title and content',
        variant: 'destructive',
      });
      return;
    }

    createAnnouncement(newAnnouncement);
    toast({
      title: '✅ Announcement Created',
      description: 'Your announcement has been published',
    });
    setShowCreateModal(false);
    setNewAnnouncement({
      title: '',
      content: '',
      type: 'info',
      targetPlans: [],
      isActive: true,
      scheduledAt: '',
      expiresAt: '',
    });
  };

  const togglePlanSelection = (planId: string) => {
    setNewAnnouncement(prev => ({
      ...prev,
      targetPlans: prev.targetPlans.includes(planId)
        ? prev.targetPlans.filter(p => p !== planId)
        : [...prev.targetPlans, planId]
    }));
  };

  const stats = {
    total: announcements.length,
    active: announcements.filter(a => a.isActive).length,
    scheduled: announcements.filter(a => a.scheduledAt && new Date(a.scheduledAt) > new Date()).length,
    expired: announcements.filter(a => a.expiresAt && new Date(a.expiresAt) < new Date()).length,
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className={`text-2xl lg:text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              Announcements
            </h1>
            <p className="text-slate-500 mt-1">
              Create and manage system-wide announcements for clients
            </p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white gap-2"
          >
            <Plus className="w-4 h-4" />
            New Announcement
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total', value: stats.total, icon: Megaphone, color: 'blue' },
            { label: 'Active', value: stats.active, icon: CheckCircle, color: 'green' },
            { label: 'Scheduled', value: stats.scheduled, icon: Clock, color: 'purple' },
            { label: 'Expired', value: stats.expired, icon: XCircle, color: 'slate' },
          ].map((stat) => (
            <Card key={stat.label} className={`p-4 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-${stat.color}-100 dark:bg-${stat.color}-900/30`}>
                  <stat.icon className={`w-5 h-5 text-${stat.color}-600`} />
                </div>
                <div>
                  <p className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    {stat.value}
                  </p>
                  <p className="text-xs text-slate-500">{stat.label}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card className={`p-4 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
          <div className="flex items-center gap-4">
            <Filter className="w-4 h-4 text-slate-400" />
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className={`w-40 ${theme === 'dark' ? 'bg-slate-700 border-slate-600' : ''}`}>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Announcements List */}
        <div className="space-y-4">
          <AnimatePresence>
            {filteredAnnouncements.map((announcement, index) => (
              <motion.div
                key={announcement.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={`p-5 border-l-4 ${getTypeBg(announcement.type)} ${
                  theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'
                } ${!announcement.isActive ? 'opacity-60' : ''}`}>
                  <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                    {/* Icon & Content */}
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${
                          announcement.type === 'info' ? 'bg-blue-100 dark:bg-blue-900/30' :
                          announcement.type === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                          announcement.type === 'success' ? 'bg-green-100 dark:bg-green-900/30' :
                          'bg-red-100 dark:bg-red-900/30'
                        }`}>
                          {getTypeIcon(announcement.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                              {announcement.title}
                            </h3>
                            <Badge className={getTypeColor(announcement.type)}>
                              {announcement.type}
                            </Badge>
                            {!announcement.isActive && (
                              <Badge variant="outline" className="text-slate-500">
                                <EyeOff className="w-3 h-3 mr-1" />
                                Hidden
                              </Badge>
                            )}
                          </div>
                          <p className={`mt-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                            {announcement.content}
                          </p>
                          <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(announcement.createdAt).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {announcement.targetPlans.length === 0 
                                ? 'All Plans' 
                                : announcement.targetPlans.join(', ')}
                            </span>
                            {announcement.expiresAt && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Expires: {new Date(announcement.expiresAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 lg:flex-shrink-0">
                      <Button variant="ghost" size="icon">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredAnnouncements.length === 0 && (
            <Card className={`p-12 text-center ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
              <Megaphone className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className={`font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                No announcements found
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Create your first announcement to notify clients
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* Create Announcement Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className={`max-w-lg ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : ''}`}>
          <DialogHeader>
            <DialogTitle className={theme === 'dark' ? 'text-white' : ''}>
              Create Announcement
            </DialogTitle>
            <DialogDescription>
              Create a new announcement to notify clients
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label className={theme === 'dark' ? 'text-slate-300' : ''}>Title</Label>
              <Input
                value={newAnnouncement.title}
                onChange={(e) => setNewAnnouncement(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Announcement title..."
                className={`mt-2 ${theme === 'dark' ? 'bg-slate-700 border-slate-600' : ''}`}
              />
            </div>

            <div>
              <Label className={theme === 'dark' ? 'text-slate-300' : ''}>Content</Label>
              <Textarea
                value={newAnnouncement.content}
                onChange={(e) => setNewAnnouncement(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Write your announcement..."
                className={`mt-2 min-h-[100px] ${theme === 'dark' ? 'bg-slate-700 border-slate-600' : ''}`}
              />
            </div>

            <div>
              <Label className={theme === 'dark' ? 'text-slate-300' : ''}>Type</Label>
              <Select
                value={newAnnouncement.type}
                onValueChange={(value) => setNewAnnouncement(prev => ({ ...prev, type: value as Announcement['type'] }))}
              >
                <SelectTrigger className={`mt-2 ${theme === 'dark' ? 'bg-slate-700 border-slate-600' : ''}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">
                    <div className="flex items-center gap-2">
                      <Info className="w-4 h-4 text-blue-600" />
                      Info
                    </div>
                  </SelectItem>
                  <SelectItem value="warning">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      Warning
                    </div>
                  </SelectItem>
                  <SelectItem value="success">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Success
                    </div>
                  </SelectItem>
                  <SelectItem value="critical">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-600" />
                      Critical
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className={theme === 'dark' ? 'text-slate-300' : ''}>Target Plans</Label>
              <p className="text-xs text-slate-500 mb-2">Leave empty to target all plans</p>
              <div className="flex flex-wrap gap-2">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    onClick={() => togglePlanSelection(plan.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all ${
                      newAnnouncement.targetPlans.includes(plan.id)
                        ? 'bg-purple-100 dark:bg-purple-900/30 border-2 border-purple-500'
                        : theme === 'dark' ? 'bg-slate-700 border-2 border-transparent' : 'bg-slate-100 border-2 border-transparent'
                    }`}
                  >
                    <Checkbox checked={newAnnouncement.targetPlans.includes(plan.id)} />
                    <span className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                      {plan.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className={theme === 'dark' ? 'text-slate-300' : ''}>Schedule (Optional)</Label>
                <Input
                  type="datetime-local"
                  value={newAnnouncement.scheduledAt}
                  onChange={(e) => setNewAnnouncement(prev => ({ ...prev, scheduledAt: e.target.value }))}
                  className={`mt-2 ${theme === 'dark' ? 'bg-slate-700 border-slate-600' : ''}`}
                />
              </div>
              <div>
                <Label className={theme === 'dark' ? 'text-slate-300' : ''}>Expires (Optional)</Label>
                <Input
                  type="datetime-local"
                  value={newAnnouncement.expiresAt}
                  onChange={(e) => setNewAnnouncement(prev => ({ ...prev, expiresAt: e.target.value }))}
                  className={`mt-2 ${theme === 'dark' ? 'bg-slate-700 border-slate-600' : ''}`}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label className={theme === 'dark' ? 'text-slate-300' : ''}>Publish immediately</Label>
              <Switch
                checked={newAnnouncement.isActive}
                onCheckedChange={(checked) => setNewAnnouncement(prev => ({ ...prev, isActive: checked }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateAnnouncement} className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
              <Send className="w-4 h-4 mr-2" />
              Publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SuperAdminLayout>
  );
};

export default Announcements;
