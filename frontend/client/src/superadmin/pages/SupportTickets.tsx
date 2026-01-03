import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TicketCheck,
  Search,
  Filter,
  ChevronDown,
  Clock,
  User,
  MessageSquare,
  Send,
  Paperclip,
  AlertCircle,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  RefreshCw,
  Eye,
  ArrowUp,
  ArrowDown,
  Tag,
  Building2,
  Mail,
  Phone,
  ExternalLink,
  X,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import SuperAdminLayout from '../components/SuperAdminLayout';
import { useSuperAdmin, SupportTicket, TicketMessage } from '../contexts/SuperAdminContext';
import { useToast } from '@/hooks/use-toast';

const SupportTickets = () => {
  const { tickets, updateTicketStatus, theme } = useSuperAdmin();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Filter tickets
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = 
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.clientEmail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || ticket.priority === filterPriority;
    const matchesCategory = filterCategory === 'all' || ticket.category === filterCategory;
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'in-progress': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'waiting-response': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      case 'resolved': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'closed': return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-300';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'billing': return '💳';
      case 'technical': return '🔧';
      case 'feature-request': return '✨';
      case 'bug': return '🐛';
      default: return '📝';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertCircle className="w-4 h-4" />;
      case 'in-progress': return <RefreshCw className="w-4 h-4" />;
      case 'waiting-response': return <Clock className="w-4 h-4" />;
      case 'resolved': return <CheckCircle className="w-4 h-4" />;
      case 'closed': return <XCircle className="w-4 h-4" />;
      default: return <TicketCheck className="w-4 h-4" />;
    }
  };

  const handleStatusChange = (ticketId: string, newStatus: SupportTicket['status']) => {
    updateTicketStatus(ticketId, newStatus);
    toast({
      title: '✅ Status Updated',
      description: `Ticket status changed to ${newStatus.replace('-', ' ')}`,
    });
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim() || !selectedTicket) return;
    
    setIsSending(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: '✅ Reply Sent',
      description: 'Your response has been sent to the client',
    });
    
    setReplyMessage('');
    setIsSending(false);
    
    // Update status to waiting-response
    if (selectedTicket.status === 'open') {
      updateTicketStatus(selectedTicket.id, 'in-progress');
    }
  };

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    inProgress: tickets.filter(t => t.status === 'in-progress').length,
    resolved: tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length,
    critical: tickets.filter(t => t.priority === 'critical' && t.status !== 'resolved' && t.status !== 'closed').length,
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className={`text-2xl lg:text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              Support Tickets
            </h1>
            <p className="text-slate-500 mt-1">
              Manage and respond to client support requests
            </p>
          </div>
          <Button 
            onClick={() => {
              setFilterStatus('all');
              setFilterPriority('all');
              setFilterCategory('all');
              setSearchQuery('');
            }}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: 'Total Tickets', value: stats.total, color: 'blue', icon: TicketCheck },
            { label: 'Open', value: stats.open, color: 'yellow', icon: AlertCircle },
            { label: 'In Progress', value: stats.inProgress, color: 'purple', icon: RefreshCw },
            { label: 'Resolved', value: stats.resolved, color: 'green', icon: CheckCircle },
            { label: 'Critical', value: stats.critical, color: 'red', icon: AlertCircle },
          ].map((stat) => (
            <Card key={stat.label} className={`p-4 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'} ${stat.color === 'red' && stat.value > 0 ? 'border-red-300 dark:border-red-800' : ''}`}>
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
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search tickets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pl-10 ${theme === 'dark' ? 'bg-slate-700 border-slate-600' : ''}`}
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className={`w-36 ${theme === 'dark' ? 'bg-slate-700 border-slate-600' : ''}`}>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="waiting-response">Waiting</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className={`w-32 ${theme === 'dark' ? 'bg-slate-700 border-slate-600' : ''}`}>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className={`w-36 ${theme === 'dark' ? 'bg-slate-700 border-slate-600' : ''}`}>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="billing">Billing</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="feature-request">Feature Request</SelectItem>
                  <SelectItem value="bug">Bug</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Tickets List */}
        <div className="space-y-4">
          <AnimatePresence>
            {filteredTickets.map((ticket, index) => (
              <motion.div
                key={ticket.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card 
                  className={`p-4 cursor-pointer transition-all hover:shadow-lg ${
                    theme === 'dark' ? 'bg-slate-800 border-slate-700 hover:border-slate-600' : 'bg-white hover:border-slate-300'
                  } ${ticket.priority === 'critical' && ticket.status === 'open' ? 'border-l-4 border-l-red-500' : ''}`}
                  onClick={() => setSelectedTicket(ticket)}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Left Section */}
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${
                          ticket.priority === 'critical' ? 'bg-red-100 dark:bg-red-900/30' :
                          ticket.priority === 'high' ? 'bg-orange-100 dark:bg-orange-900/30' :
                          'bg-slate-100 dark:bg-slate-700'
                        }`}>
                          <span className="text-xl">{getCategoryIcon(ticket.category)}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                              {ticket.subject}
                            </h3>
                            <Badge className={getPriorityColor(ticket.priority)}>
                              {ticket.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-500 mt-1 line-clamp-1">
                            {ticket.description}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                            <span className="flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              {ticket.clientName}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(ticket.createdAt).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" />
                              {ticket.messages.length} messages
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Section */}
                    <div className="flex items-center gap-3">
                      <Badge className={getStatusColor(ticket.status)}>
                        <span className="mr-1">{getStatusIcon(ticket.status)}</span>
                        {ticket.status.replace('-', ' ')}
                      </Badge>
                      <Select
                        value={ticket.status}
                        onValueChange={(value) => handleStatusChange(ticket.id, value as SupportTicket['status'])}
                      >
                        <SelectTrigger className={`w-36 ${theme === 'dark' ? 'bg-slate-700 border-slate-600' : ''}`} onClick={(e) => e.stopPropagation()}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="waiting-response">Waiting Response</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredTickets.length === 0 && (
            <Card className={`p-12 text-center ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
              <TicketCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className={`font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                No tickets found
              </p>
              <p className="text-sm text-slate-500 mt-1">
                {searchQuery || filterStatus !== 'all' || filterPriority !== 'all'
                  ? 'Try adjusting your filters'
                  : 'All caught up! No pending tickets.'}
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* Ticket Detail Modal */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className={`max-w-3xl max-h-[90vh] overflow-hidden flex flex-col ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : ''}`}>
          {selectedTicket && (
            <>
              <DialogHeader className="flex-shrink-0">
                <div className="flex items-start justify-between">
                  <div>
                    <DialogTitle className={`text-xl ${theme === 'dark' ? 'text-white' : ''}`}>
                      {selectedTicket.subject}
                    </DialogTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={getPriorityColor(selectedTicket.priority)}>
                        {selectedTicket.priority}
                      </Badge>
                      <Badge className={getStatusColor(selectedTicket.status)}>
                        {selectedTicket.status.replace('-', ' ')}
                      </Badge>
                      <Badge variant="outline">
                        {getCategoryIcon(selectedTicket.category)} {selectedTicket.category}
                      </Badge>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              {/* Client Info */}
              <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-50'} flex-shrink-0`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white">
                        {selectedTicket.clientName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        {selectedTicket.clientName}
                      </p>
                      <p className="text-sm text-slate-500">{selectedTicket.clientEmail}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Client
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto py-4 space-y-4">
                {selectedTicket.messages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex ${message.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] ${message.sender === 'admin' ? 'order-2' : ''}`}>
                      <div className={`p-4 rounded-2xl ${
                        message.sender === 'admin'
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                          : theme === 'dark' ? 'bg-slate-700' : 'bg-slate-100'
                      }`}>
                        <p className={message.sender !== 'admin' && theme === 'dark' ? 'text-slate-200' : ''}>
                          {message.message}
                        </p>
                      </div>
                      <div className={`flex items-center gap-2 mt-1 text-xs text-slate-400 ${message.sender === 'admin' ? 'justify-end' : ''}`}>
                        <span>{message.senderName}</span>
                        <span>•</span>
                        <span>{new Date(message.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Reply Section */}
              <div className={`pt-4 border-t flex-shrink-0 ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
                <div className="flex gap-3">
                  <Textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Type your reply..."
                    className={`flex-1 min-h-[80px] ${theme === 'dark' ? 'bg-slate-700 border-slate-600' : ''}`}
                  />
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Paperclip className="w-4 h-4 mr-2" />
                      Attach
                    </Button>
                    <Select
                      value={selectedTicket.status}
                      onValueChange={(value) => handleStatusChange(selectedTicket.id, value as SupportTicket['status'])}
                    >
                      <SelectTrigger className={`w-40 ${theme === 'dark' ? 'bg-slate-700 border-slate-600' : ''}`}>
                        <SelectValue placeholder="Change Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="waiting-response">Waiting Response</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={handleSendReply}
                    disabled={!replyMessage.trim() || isSending}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                  >
                    {isSending ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    Send Reply
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </SuperAdminLayout>
  );
};

export default SupportTickets;
