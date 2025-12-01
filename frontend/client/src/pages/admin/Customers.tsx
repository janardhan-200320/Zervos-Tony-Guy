import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Search, Plus, UsersRound, Settings, MoreVertical, Edit, Trash2, Mail, Phone, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  notes?: string;
  totalBookings: number;
  createdAt: string;
}

export default function Customers() {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewCustomerOpen, setIsNewCustomerOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    notes: ''
  });

  const storageKey = 'zervos_customers';

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setCustomers(JSON.parse(saved));
      }
    } catch {}
  }, []);

  const persistCustomers = (custs: Customer[]) => {
    setCustomers(custs);
    try {
      localStorage.setItem(storageKey, JSON.stringify(custs));
    } catch {}
  };

  const handleCreateCustomer = () => {
    if (!newCustomer.name || !newCustomer.email) {
      toast({ title: 'Error', description: 'Name and email are required', variant: 'destructive' });
      return;
    }
    const customer: Customer = {
      id: Date.now().toString(),
      ...newCustomer,
      totalBookings: 0,
      createdAt: new Date().toISOString()
    };
    persistCustomers([...customers, customer]);
    setIsNewCustomerOpen(false);
    setNewCustomer({ name: '', email: '', phone: '', company: '', notes: '' });
    toast({ title: 'Success', description: 'Customer created successfully' });
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer({ ...customer });
    setIsEditOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingCustomer) return;
    const updated = customers.map(c => c.id === editingCustomer.id ? editingCustomer : c);
    persistCustomers(updated);
    setIsEditOpen(false);
    setEditingCustomer(null);
    toast({ title: 'Success', description: 'Customer updated successfully' });
  };

  const handleDelete = (id: string) => {
    persistCustomers(customers.filter(c => c.id !== id));
    toast({ title: 'Success', description: 'Customer deleted successfully' });
  };

  const filteredCustomers = customers.filter(cust =>
    cust.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cust.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cust.company?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-gray-900">Customers</h1>
            <Badge variant="outline">{filteredCustomers.length}</Badge>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <Input 
                className="pl-10" 
                placeholder="Search customers..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={() => setIsNewCustomerOpen(true)}>
              <Plus size={16} className="mr-2" /> New Customer
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-gray-50 p-8">
        {filteredCustomers.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <div className="mx-auto w-40 h-40 bg-purple-50 rounded-full mb-6 flex items-center justify-center">
              <UsersRound size={48} className="text-purple-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {customers.length === 0 ? 'No customers added' : 'No customers found'}
            </h3>
            <p className="text-gray-600 mb-6">
              {customers.length === 0 ? (
                <>
                  Add customers to book appointments with them. When customers book<br />
                  using your booking page, they'll be added here automatically.
                </>
              ) : (
                'Try adjusting your search query.'
              )}
            </p>
            {customers.length === 0 && (
              <Button onClick={() => setIsNewCustomerOpen(true)}>
                <Plus size={16} className="mr-2" /> New Customer
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredCustomers.map((customer) => (
              <div key={customer.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:border-purple-200 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <User className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{customer.name}</h3>
                      {customer.company && (
                        <p className="text-sm text-gray-500">{customer.company}</p>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(customer)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-red-600"
                        onClick={() => handleDelete(customer.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="truncate">{customer.email}</span>
                  </div>
                  {customer.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{customer.phone}</span>
                    </div>
                  )}
                </div>

                {customer.notes && (
                  <p className="mt-3 text-sm text-gray-500 line-clamp-2">{customer.notes}</p>
                )}

                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    Added {new Date(customer.createdAt).toLocaleDateString()}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {customer.totalBookings} bookings
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Customer Dialog */}
      <Dialog open={isNewCustomerOpen} onOpenChange={setIsNewCustomerOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>New Customer</DialogTitle>
            <DialogDescription>
              Add a new customer to your database
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input 
                id="name" 
                value={newCustomer.name}
                onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input 
                id="email" 
                type="email"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                placeholder="john@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input 
                id="phone" 
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                placeholder="+1 (555) 000-0000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input 
                id="company" 
                value={newCustomer.company}
                onChange={(e) => setNewCustomer({...newCustomer, company: e.target.value})}
                placeholder="Acme Inc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input 
                id="notes" 
                value={newCustomer.notes}
                onChange={(e) => setNewCustomer({...newCustomer, notes: e.target.value})}
                placeholder="Additional information..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewCustomerOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCustomer}>Create Customer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogDescription>
              Update customer information
            </DialogDescription>
          </DialogHeader>
          {editingCustomer && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name *</Label>
                <Input 
                  id="edit-name" 
                  value={editingCustomer.name}
                  onChange={(e) => setEditingCustomer({...editingCustomer, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email *</Label>
                <Input 
                  id="edit-email" 
                  type="email"
                  value={editingCustomer.email}
                  onChange={(e) => setEditingCustomer({...editingCustomer, email: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input 
                  id="edit-phone" 
                  value={editingCustomer.phone}
                  onChange={(e) => setEditingCustomer({...editingCustomer, phone: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-company">Company</Label>
                <Input 
                  id="edit-company" 
                  value={editingCustomer.company || ''}
                  onChange={(e) => setEditingCustomer({...editingCustomer, company: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-notes">Notes</Label>
                <Input 
                  id="edit-notes" 
                  value={editingCustomer.notes || ''}
                  onChange={(e) => setEditingCustomer({...editingCustomer, notes: e.target.value})}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
