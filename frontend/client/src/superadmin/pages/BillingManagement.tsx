import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  Search,
  Filter,
  Download,
  Plus,
  DollarSign,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Send,
  RotateCcw,
  Eye,
  MoreVertical,
  TrendingUp,
  Users,
  Receipt,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import SuperAdminLayout from '../components/SuperAdminLayout';
import { useSuperAdmin, Invoice, Payment } from '../contexts/SuperAdminContext';

const BillingManagement = () => {
  const { theme, invoices, payments, clients, updateInvoiceStatus, processRefund, applyCredit, createInvoice } = useSuperAdmin();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [creditAmount, setCreditAmount] = useState('');
  const [creditReason, setCreditReason] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');

  // Stats calculations
  const totalRevenue = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);
  const pendingAmount = invoices.filter(i => i.status === 'pending' || i.status === 'overdue').reduce((sum, i) => sum + i.total, 0);
  const overdueAmount = invoices.filter(i => i.status === 'overdue').reduce((sum, i) => sum + i.total, 0);
  const refundedAmount = payments.filter(p => p.status === 'refunded').reduce((sum, p) => sum + p.amount, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': case 'completed': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'sent': case 'pending': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'overdue': case 'failed': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'refunded': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'cancelled': return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-400';
      case 'draft': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': case 'completed': return CheckCircle;
      case 'sent': case 'pending': return Clock;
      case 'overdue': case 'failed': return AlertTriangle;
      case 'refunded': return RotateCcw;
      case 'cancelled': return XCircle;
      default: return FileText;
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleRefund = () => {
    if (selectedPayment && refundAmount && refundReason) {
      processRefund(selectedPayment.id, parseFloat(refundAmount), refundReason);
      setShowRefundModal(false);
      setRefundAmount('');
      setRefundReason('');
      setSelectedPayment(null);
    }
  };

  const handleApplyCredit = () => {
    if (selectedClientId && creditAmount && creditReason) {
      applyCredit(selectedClientId, parseFloat(creditAmount), creditReason);
      setShowCreditModal(false);
      setCreditAmount('');
      setCreditReason('');
      setSelectedClientId('');
    }
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className={`text-2xl lg:text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              Billing & Invoices
            </h1>
            <p className="text-slate-500 mt-1">
              Manage invoices, payments, refunds, and credits
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setShowCreditModal(true)} className="gap-2">
              <Wallet className="w-4 h-4" />
              Apply Credit
            </Button>
            <Button onClick={() => setShowCreateInvoiceModal(true)} className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600">
              <Plus className="w-4 h-4" />
              Create Invoice
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div whileHover={{ scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }}>
            <Card className={`p-5 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Total Revenue</p>
                  <p className={`text-2xl font-bold mt-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    ₹{totalRevenue.toLocaleString()}
                  </p>
                  <div className="flex items-center gap-1 mt-2 text-green-600">
                    <ArrowUpRight className="w-4 h-4" />
                    <span className="text-sm">+12.5%</span>
                  </div>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }}>
            <Card className={`p-5 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Pending</p>
                  <p className={`text-2xl font-bold mt-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    ₹{pendingAmount.toLocaleString()}
                  </p>
                  <p className="text-sm text-slate-400 mt-2">{invoices.filter(i => i.status === 'pending').length} invoices</p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }}>
            <Card className={`p-5 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Overdue</p>
                  <p className={`text-2xl font-bold mt-1 text-red-600`}>
                    ₹{overdueAmount.toLocaleString()}
                  </p>
                  <p className="text-sm text-slate-400 mt-2">{invoices.filter(i => i.status === 'overdue').length} invoices</p>
                </div>
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }}>
            <Card className={`p-5 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Refunded</p>
                  <p className={`text-2xl font-bold mt-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    ₹{refundedAmount.toLocaleString()}
                  </p>
                  <p className="text-sm text-slate-400 mt-2">{payments.filter(p => p.status === 'refunded').length} refunds</p>
                </div>
                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                  <RotateCcw className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="invoices" className="space-y-4">
          <TabsList className={`${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'}`}>
            <TabsTrigger value="invoices" className="gap-2">
              <FileText className="w-4 h-4" />
              Invoices
            </TabsTrigger>
            <TabsTrigger value="payments" className="gap-2">
              <CreditCard className="w-4 h-4" />
              Payments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="invoices" className="space-y-4">
            {/* Filters */}
            <Card className={`p-4 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search invoices..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`pl-10 ${theme === 'dark' ? 'bg-slate-700 border-slate-600' : ''}`}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className={`w-40 ${theme === 'dark' ? 'bg-slate-700 border-slate-600' : ''}`}>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" className="gap-2">
                  <Download className="w-4 h-4" />
                  Export
                </Button>
              </div>
            </Card>

            {/* Invoice List */}
            <Card className={`overflow-hidden ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={`${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-50'}`}>
                    <tr>
                      <th className="text-left p-4 font-medium text-slate-500">Invoice</th>
                      <th className="text-left p-4 font-medium text-slate-500">Client</th>
                      <th className="text-left p-4 font-medium text-slate-500">Amount</th>
                      <th className="text-left p-4 font-medium text-slate-500">Status</th>
                      <th className="text-left p-4 font-medium text-slate-500">Due Date</th>
                      <th className="text-left p-4 font-medium text-slate-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {filteredInvoices.map((invoice, index) => {
                        const StatusIcon = getStatusIcon(invoice.status);
                        return (
                          <motion.tr
                            key={invoice.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ delay: index * 0.03 }}
                            className={`border-t ${theme === 'dark' ? 'border-slate-700 hover:bg-slate-700/50' : 'border-slate-100 hover:bg-slate-50'}`}
                          >
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-100'}`}>
                                  <Receipt className="w-4 h-4 text-purple-600" />
                                </div>
                                <div>
                                  <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                                    {invoice.invoiceNumber}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {new Date(invoice.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                                {invoice.clientName}
                              </p>
                              <p className="text-sm text-slate-500">{invoice.clientEmail}</p>
                            </td>
                            <td className="p-4">
                              <p className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                                ₹{invoice.total.toLocaleString()}
                              </p>
                              <p className="text-xs text-slate-500">Tax: ₹{invoice.tax}</p>
                            </td>
                            <td className="p-4">
                              <Badge className={`${getStatusColor(invoice.status)} gap-1`}>
                                <StatusIcon className="w-3 h-3" />
                                {invoice.status}
                              </Badge>
                            </td>
                            <td className="p-4">
                              <p className={theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}>
                                {invoice.dueDate}
                              </p>
                              {invoice.paidAt && (
                                <p className="text-xs text-green-600">Paid: {new Date(invoice.paidAt).toLocaleDateString()}</p>
                              )}
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <Button size="sm" variant="ghost" onClick={() => setSelectedInvoice(invoice)}>
                                  <Eye className="w-4 h-4" />
                                </Button>
                                {invoice.status === 'pending' && (
                                  <Button size="sm" variant="ghost" className="text-green-600" onClick={() => updateInvoiceStatus(invoice.id, 'paid')}>
                                    <CheckCircle className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="space-y-4">
            <Card className={`overflow-hidden ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={`${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-50'}`}>
                    <tr>
                      <th className="text-left p-4 font-medium text-slate-500">Transaction</th>
                      <th className="text-left p-4 font-medium text-slate-500">Client</th>
                      <th className="text-left p-4 font-medium text-slate-500">Amount</th>
                      <th className="text-left p-4 font-medium text-slate-500">Method</th>
                      <th className="text-left p-4 font-medium text-slate-500">Status</th>
                      <th className="text-left p-4 font-medium text-slate-500">Date</th>
                      <th className="text-left p-4 font-medium text-slate-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment, index) => {
                      const StatusIcon = getStatusIcon(payment.status);
                      return (
                        <motion.tr
                          key={payment.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.03 }}
                          className={`border-t ${theme === 'dark' ? 'border-slate-700 hover:bg-slate-700/50' : 'border-slate-100 hover:bg-slate-50'}`}
                        >
                          <td className="p-4">
                            <p className={`font-mono text-sm ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                              {payment.transactionId || 'N/A'}
                            </p>
                          </td>
                          <td className="p-4">
                            <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                              {payment.clientName}
                            </p>
                          </td>
                          <td className="p-4">
                            <p className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                              ₹{payment.amount.toLocaleString()}
                            </p>
                          </td>
                          <td className="p-4">
                            <Badge variant="outline" className="capitalize">{payment.method}</Badge>
                          </td>
                          <td className="p-4">
                            <Badge className={`${getStatusColor(payment.status)} gap-1`}>
                              <StatusIcon className="w-3 h-3" />
                              {payment.status}
                            </Badge>
                          </td>
                          <td className="p-4 text-slate-500">
                            {new Date(payment.processedAt).toLocaleDateString()}
                          </td>
                          <td className="p-4">
                            {payment.status === 'completed' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-orange-600"
                                onClick={() => {
                                  setSelectedPayment(payment);
                                  setRefundAmount(String(payment.amount));
                                  setShowRefundModal(true);
                                }}
                              >
                                <RotateCcw className="w-4 h-4 mr-1" />
                                Refund
                              </Button>
                            )}
                            {payment.status === 'failed' && (
                              <Button size="sm" variant="ghost" className="text-blue-600">
                                <RefreshCw className="w-4 h-4 mr-1" />
                                Retry
                              </Button>
                            )}
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Invoice Detail Modal */}
        <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
          <DialogContent className={`max-w-2xl ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : ''}`}>
            <DialogHeader>
              <DialogTitle className={theme === 'dark' ? 'text-white' : ''}>
                Invoice {selectedInvoice?.invoiceNumber}
              </DialogTitle>
            </DialogHeader>
            {selectedInvoice && (
              <div className="space-y-6">
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Bill To</p>
                    <p className={`font-medium ${theme === 'dark' ? 'text-white' : ''}`}>{selectedInvoice.clientName}</p>
                    <p className="text-sm text-slate-500">{selectedInvoice.clientEmail}</p>
                  </div>
                  <Badge className={getStatusColor(selectedInvoice.status)}>{selectedInvoice.status}</Badge>
                </div>
                
                <div className={`border rounded-lg overflow-hidden ${theme === 'dark' ? 'border-slate-700' : ''}`}>
                  <table className="w-full">
                    <thead className={theme === 'dark' ? 'bg-slate-700' : 'bg-slate-50'}>
                      <tr>
                        <th className="text-left p-3 text-sm">Description</th>
                        <th className="text-right p-3 text-sm">Qty</th>
                        <th className="text-right p-3 text-sm">Price</th>
                        <th className="text-right p-3 text-sm">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.items.map((item, idx) => (
                        <tr key={idx} className={`border-t ${theme === 'dark' ? 'border-slate-700' : ''}`}>
                          <td className="p-3">{item.description}</td>
                          <td className="p-3 text-right">{item.quantity}</td>
                          <td className="p-3 text-right">₹{item.unitPrice}</td>
                          <td className="p-3 text-right">₹{item.total}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className={theme === 'dark' ? 'bg-slate-700' : 'bg-slate-50'}>
                      <tr>
                        <td colSpan={3} className="p-3 text-right font-medium">Subtotal</td>
                        <td className="p-3 text-right">₹{selectedInvoice.amount}</td>
                      </tr>
                      <tr>
                        <td colSpan={3} className="p-3 text-right font-medium">Tax (18%)</td>
                        <td className="p-3 text-right">₹{selectedInvoice.tax}</td>
                      </tr>
                      <tr>
                        <td colSpan={3} className="p-3 text-right font-bold">Total</td>
                        <td className="p-3 text-right font-bold">₹{selectedInvoice.total}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Refund Modal */}
        <Dialog open={showRefundModal} onOpenChange={setShowRefundModal}>
          <DialogContent className={theme === 'dark' ? 'bg-slate-800 border-slate-700' : ''}>
            <DialogHeader>
              <DialogTitle className={theme === 'dark' ? 'text-white' : ''}>Process Refund</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Refund Amount (₹)</Label>
                <Input
                  type="number"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className={theme === 'dark' ? 'bg-slate-700 border-slate-600' : ''}
                />
              </div>
              <div>
                <Label>Reason</Label>
                <Textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Enter reason for refund..."
                  className={theme === 'dark' ? 'bg-slate-700 border-slate-600' : ''}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRefundModal(false)}>Cancel</Button>
              <Button onClick={handleRefund} className="bg-orange-600 hover:bg-orange-700">Process Refund</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Credit Modal */}
        <Dialog open={showCreditModal} onOpenChange={setShowCreditModal}>
          <DialogContent className={theme === 'dark' ? 'bg-slate-800 border-slate-700' : ''}>
            <DialogHeader>
              <DialogTitle className={theme === 'dark' ? 'text-white' : ''}>Apply Credit</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Select Client</Label>
                <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                  <SelectTrigger className={theme === 'dark' ? 'bg-slate-700 border-slate-600' : ''}>
                    <SelectValue placeholder="Choose client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id}>{client.businessName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Credit Amount (₹)</Label>
                <Input
                  type="number"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  className={theme === 'dark' ? 'bg-slate-700 border-slate-600' : ''}
                />
              </div>
              <div>
                <Label>Reason</Label>
                <Textarea
                  value={creditReason}
                  onChange={(e) => setCreditReason(e.target.value)}
                  placeholder="Enter reason for credit..."
                  className={theme === 'dark' ? 'bg-slate-700 border-slate-600' : ''}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreditModal(false)}>Cancel</Button>
              <Button onClick={handleApplyCredit} className="bg-green-600 hover:bg-green-700">Apply Credit</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </SuperAdminLayout>
  );
};

export default BillingManagement;
